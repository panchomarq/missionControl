#!/bin/bash
set -euo pipefail

PROJECTS_DIR="$HOME/Documents/projects"
DATA_DIR="$(dirname "$0")/../data"
OUTPUT="$DATA_DIR/projects.json"
SCANS_DIR="$DATA_DIR/scans"

mkdir -p "$SCANS_DIR"

extract_description() {
  local project_dir="$1"
  local claude_md=""

  # Find CLAUDE.md (root, or frontend/, or backend/)
  if [[ -f "$project_dir/CLAUDE.md" ]]; then
    claude_md="$project_dir/CLAUDE.md"
  elif [[ -f "$project_dir/frontend/CLAUDE.md" ]]; then
    claude_md="$project_dir/frontend/CLAUDE.md"
  elif [[ -f "$project_dir/backend/CLAUDE.md" ]]; then
    claude_md="$project_dir/backend/CLAUDE.md"
  fi

  [[ -z $claude_md ]] && return

  # Try known description sections in order of preference
  local desc=""
  local section
  for section in "What This Is" "Problema" "Project Overview" "Overview"; do
    desc=$(sed -n "/^## ${section}\$/,/^##/{/^## ${section}\$/d;/^##/d;p;}" "$claude_md" 2>/dev/null \
      | head -3 | tr '\n' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || true)
    [[ -n $desc ]] && break
  done

  # Fallback: first non-empty, non-heading line that isn't Claude Code boilerplate
  if [[ -z $desc ]]; then
    desc=$(awk '/^[^#[:space:]]/ && NR > 1 && $0 !~ /^This file provides guidance/ {print; exit}' \
      "$claude_md" 2>/dev/null || true)
  fi

  # Escape double quotes for JSON
  echo "${desc//\"/\\\"}"
}

extract_stack() {
  local project_dir="$1"
  local stack=()

  if [[ -f "$project_dir/package.json" ]]; then
    stack+=("Node.js")
    if grep -q '"next"' "$project_dir/package.json" 2>/dev/null; then
      stack+=("Next.js")
    fi
    if grep -q '"drizzle-orm"' "$project_dir/package.json" 2>/dev/null; then
      stack+=("Drizzle")
    fi
  fi

  if [[ -f "$project_dir/pyproject.toml" ]] || [[ -f "$project_dir/requirements.txt" ]]; then
    stack+=("Python")
    if grep -q "textual" "$project_dir/pyproject.toml" 2>/dev/null || \
       grep -q "textual" "$project_dir/requirements.txt" 2>/dev/null; then
      stack+=("Textual")
    fi
    if grep -q "fastapi" "$project_dir/requirements.txt" 2>/dev/null || \
       grep -q "fastapi" "$project_dir/pyproject.toml" 2>/dev/null; then
      stack+=("FastAPI")
    fi
  fi

  if [[ -f "$project_dir/Cargo.toml" ]]; then
    stack+=("Rust")
  fi

  if [[ -f "$project_dir/frontend/package.json" ]]; then
    if grep -q '"next"' "$project_dir/frontend/package.json" 2>/dev/null; then
      stack+=("Next.js")
    fi
  fi

  if [[ -f "$project_dir/backend/requirements.txt" ]]; then
    if grep -q "fastapi" "$project_dir/backend/requirements.txt" 2>/dev/null; then
      stack+=("FastAPI")
    fi
  fi

  local json="["
  local first=true
  for item in "${stack[@]}"; do
    if [[ $first == true ]]; then
      first=false
    else
      json+=","
    fi
    json+="\"$item\""
  done
  json+="]"
  echo "$json"
}

scan_git() {
  local project_dir="$1"

  if [[ ! -d "$project_dir/.git" ]]; then
    echo '{}'
    return
  fi

  local branch
  branch=$(git -C "$project_dir" branch --show-current 2>/dev/null || echo "unknown")

  local dirty_files
  dirty_files=$(git -C "$project_dir" status --porcelain 2>/dev/null | wc -l)

  local has_unpushed=false
  local unpushed=0
  if git -C "$project_dir" rev-parse '@{u}' >/dev/null 2>&1; then
    unpushed=$(git -C "$project_dir" log '@{u}..HEAD' --oneline 2>/dev/null | wc -l)
  fi
  if (( unpushed > 0 )); then
    has_unpushed=true
  fi

  local last_commit_date
  last_commit_date=$(git -C "$project_dir" log -1 --format="%aI" 2>/dev/null || echo "")

  local last_commit_msg
  last_commit_msg=$(git -C "$project_dir" log -1 --format="%s" 2>/dev/null || echo "")
  last_commit_msg="${last_commit_msg//\"/\\\"}"

  cat <<GITJSON
{
    "branch": "$branch",
    "hasUnpushed": $has_unpushed,
    "dirtyFiles": $dirty_files,
    "lastCommit": "$last_commit_date",
    "lastCommitMessage": "$last_commit_msg"
  }
GITJSON
}

compute_health() {
  local dirty_files="$1"
  local has_unpushed="$2"
  local last_commit="$3"
  local status="$4"

  if [[ $status == "paused" ]]; then
    echo "red"
    return
  fi

  if (( dirty_files > 0 )) || [[ $has_unpushed == "true" ]]; then
    echo "yellow"
    return
  fi

  if [[ -n $last_commit ]]; then
    local now
    now=$(date +%s)
    local commit_epoch
    commit_epoch=$(date -d "$last_commit" +%s 2>/dev/null || echo "0")
    local days_ago=$(( (now - commit_epoch) / 86400 ))
    if (( days_ago > 7 )); then
      echo "red"
      return
    fi
  fi

  echo "green"
}

now=$(date -Iseconds)
projects="[]"

for dir in "$PROJECTS_DIR"/*/; do
  [[ ! -d $dir ]] && continue

  slug=$(basename "$dir")

  # Skip hidden directories and missionControl itself
  [[ $slug == .* ]] && continue

  description=$(extract_description "$dir")
  if [[ -z $description ]]; then
    # Fallback: first line of CLAUDE.md after "# "
    if [[ -f "$dir/CLAUDE.md" ]]; then
      description=$(grep -m1 "^# " "$dir/CLAUDE.md" 2>/dev/null | sed 's/^# //' || echo "")
    fi
  fi

  stack_json=$(extract_stack "$dir")
  git_info=$(scan_git "$dir")

  dirty_files=$(echo "$git_info" | grep -o '"dirtyFiles": [0-9]*' | grep -o '[0-9]*' || echo "0")
  has_unpushed=$(echo "$git_info" | grep -o '"hasUnpushed": [a-z]*' | awk '{print $2}' || echo "false")
  last_commit=$(echo "$git_info" | grep -o '"lastCommit": "[^"]*"' | sed 's/"lastCommit": "//;s/"//' || echo "")

  status="active"
  health=$(compute_health "$dirty_files" "$has_unpushed" "$last_commit" "$status")

  scan_file="$SCANS_DIR/$slug.json"

  project=$(cat <<PROJJSON
{
  "id": "$slug",
  "name": "$slug",
  "slug": "$slug",
  "path": "$(realpath "$dir")",
  "description": "$description",
  "stack": $stack_json,
  "status": "$status",
  "priority": "medium",
  "git": $git_info,
  "health": "$health",
  "lastScanned": "$now"
}
PROJJSON
)

  echo "$project" > "$scan_file"

  if [[ $projects == "[]" ]]; then
    projects="[$project"
  else
    projects="$projects,$project"
  fi
done

if [[ $projects != "[]" ]]; then
  projects="$projects]"
fi

echo "$projects" | python3 -m json.tool > "$OUTPUT"

echo "Scanned $(echo "$projects" | grep -c '"id"') projects → $OUTPUT"

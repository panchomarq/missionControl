#!/bin/bash
set -euo pipefail

VAULT_DIR="$HOME/Documents/Obsidian Vault"
PROJECTS_DIR="$HOME/Documents/projects"
DATA_DIR="$(dirname "$0")/../data"
PROJECTS_FILE="$DATA_DIR/projects.json"

if [[ ! -d $VAULT_DIR ]]; then
  echo "Error: Obsidian Vault not found at $VAULT_DIR"
  exit 1
fi

if [[ ! -f $PROJECTS_FILE ]]; then
  echo "Error: projects.json not found. Run scan-projects.sh first."
  exit 1
fi

project_slugs=$(python3 -c "
import json
with open('$PROJECTS_FILE') as f:
    projects = json.load(f)
for p in projects:
    print(p['id'])
")

found=0

for slug in $project_slugs; do
  # Search for notes matching the project name (case-insensitive)
  # Look for: {slug}.md, {slug}/roadmap.md, roadmaps/{slug}.md
  note=""

  for candidate in \
    "$VAULT_DIR/$slug.md" \
    "$VAULT_DIR/${slug}/roadmap.md" \
    "$VAULT_DIR/roadmaps/$slug.md" \
    "$VAULT_DIR/projects/$slug.md" \
    "$VAULT_DIR/Projects/$slug.md"; do
    if [[ -f $candidate ]]; then
      note="$candidate"
      break
    fi
  done

  # Fallback: search by filename anywhere in vault
  if [[ -z $note ]]; then
    note=$(find "$VAULT_DIR" -iname "$slug.md" -not -path "*/.obsidian/*" 2>/dev/null | head -1 || true)
  fi

  if [[ -z $note ]]; then
    continue
  fi

  found=$((found + 1))
  echo "Found note for $slug: $note"

  # Extract roadmap items (lines starting with - [ ] or - [x])
  tasks=$(grep -E "^- \[(x| )\]" "$note" 2>/dev/null || true)

  if [[ -z $tasks ]]; then
    echo "  No roadmap items found"
    continue
  fi

  task_count=$(echo "$tasks" | wc -l)
  done_count=$(echo "$tasks" | grep -c "^\- \[x\]" || true)
  pending_count=$((task_count - done_count))

  echo "  Tasks: $pending_count pending, $done_count done"

  # Save extracted roadmap to scan file
  scan_file="$DATA_DIR/scans/${slug}-obsidian.json"
  python3 -c "
import json

tasks = []
for line in '''$tasks'''.strip().split('\n'):
    if not line.strip():
        continue
    done = line.strip().startswith('- [x]')
    title = line.strip().lstrip('- [x] ').lstrip('- [ ] ')
    tasks.append({
        'title': title,
        'status': 'done' if done else 'pending',
        'source': 'obsidian'
    })

with open('$scan_file', 'w') as f:
    json.dump({
        'projectId': '$slug',
        'sourceFile': '''$note''',
        'tasks': tasks
    }, f, indent=2)
    f.write('\n')
"
done

echo "Synced $found projects from Obsidian Vault"

if [[ $found -eq 0 ]]; then
  echo ""
  echo "No matching notes found. Create notes in your vault with project names:"
  for slug in $project_slugs; do
    echo "  - $VAULT_DIR/$slug.md"
  done
  echo ""
  echo "Add roadmap items as checkboxes:"
  echo "  - [ ] Pending task"
  echo "  - [x] Completed task"
fi

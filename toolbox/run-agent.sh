#!/bin/bash
set -euo pipefail

TASK_ID="${1:?Usage: run-agent.sh <task-id>}"
DATA_DIR="$(dirname "$0")/../data"
AGENTS_FILE="$DATA_DIR/agents.json"
TASKS_FILE="$DATA_DIR/tasks.json"
OUTPUT_DIR="$DATA_DIR/agent-output"
RULES_FILE="$DATA_DIR/agent-rules.md"
MODEL="qwen2.5-coder:14b"
OLLAMA_URL="http://localhost:11434"

mkdir -p "$OUTPUT_DIR"

# --- Read task ---
task_json=$(python3 -c "
import json, sys
with open('$TASKS_FILE') as f:
    tasks = json.load(f)
task = next((t for t in tasks if t['id'] == '$TASK_ID'), None)
if not task:
    print('ERROR: task not found', file=sys.stderr)
    sys.exit(1)
print(json.dumps(task))
")

TITLE=$(echo "$task_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['title'])")
PROJECT_ID=$(echo "$task_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['projectId'])")

# --- Status helpers ---
update_agent_status() {
  local status="$1"
  python3 -c "
import json
from datetime import datetime, timezone
with open('$AGENTS_FILE') as f:
    agents = json.load(f)
for a in agents:
    if a['taskId'] == '$TASK_ID' and a['status'] in ('spawning', 'active'):
        a['status'] = '$status'
        if '$status' in ('completed', 'failed'):
            a['completedAt'] = datetime.now(timezone.utc).isoformat()
with open('$AGENTS_FILE', 'w') as f:
    json.dump(agents, f, indent=2)
    f.write('\n')
"
}

update_task_status() {
  local status="$1"
  python3 -c "
import json
from datetime import datetime, timezone
with open('$TASKS_FILE') as f:
    tasks = json.load(f)
for t in tasks:
    if t['id'] == '$TASK_ID':
        t['status'] = '$status'
        t['updatedAt'] = datetime.now(timezone.utc).isoformat()
with open('$TASKS_FILE', 'w') as f:
    json.dump(tasks, f, indent=2)
    f.write('\n')
"
}

# --- Check Ollama ---
if ! curl -s --max-time 3 "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
  echo "Starting Ollama..."
  systemctl start ollama 2>/dev/null || true
  sleep 5
  if ! curl -s --max-time 3 "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    echo "ERROR: Ollama not reachable at $OLLAMA_URL"
    update_agent_status "failed"
    exit 1
  fi
fi

available=$(curl -s "$OLLAMA_URL/api/tags" | python3 -c "
import json, sys
data = json.load(sys.stdin)
models = [m['name'] for m in data.get('models', [])]
print('yes' if any('$MODEL' in m for m in models) else 'no')
")

if [[ $available != "yes" ]]; then
  echo "ERROR: Model $MODEL not available in Ollama"
  update_agent_status "failed"
  exit 1
fi

update_agent_status "active"

# --- Build context ---
project_dir="$HOME/Documents/projects/$PROJECT_ID"
prd_file="$DATA_DIR/prds/$TASK_ID.md"

# Always include agent rules
rules=""
if [[ -f "$RULES_FILE" ]]; then
  rules=$(cat "$RULES_FILE")
fi

# Project file tree
file_tree=$(find "$project_dir" -maxdepth 3 \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path '*/.git/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/venv/*' \
  -type f 2>/dev/null | head -60 | sed "s|$project_dir/||")

# Extract reference files from PRD (lines with backtick paths)
ref_files=""
if [[ -f "$prd_file" ]]; then
  # Find file paths mentioned in the PRD
  # shellcheck disable=SC2016  # literal regex for grep, no shell expansion intended
  mentioned_files=$(grep -oE '`[a-zA-Z_/\[\]]+\.(tsx?|css|json|md)`' "$prd_file" 2>/dev/null \
    | tr -d '`' | sort -u || true)

  for ref in $mentioned_files; do
    # Try exact path first, then with dashboard/ prefix
    for candidate in \
      "$project_dir/$ref" \
      "$project_dir/dashboard/$ref"; do
      if [[ -f "$candidate" ]]; then
        content=$(head -80 "$candidate")
        short_path="${candidate#"$project_dir"/}"
        ref_files+="
=== $short_path ===
$content
=== END $short_path ===

"
        break
      fi
    done
  done
fi

# Always include a reference component for style
example_file="$project_dir/dashboard/components/Panel.tsx"
if [[ -f "$example_file" ]] && [[ ! "$ref_files" == *"Panel.tsx"* ]]; then
  ref_files+="
=== EXAMPLE COMPONENT: components/Panel.tsx ===
$(cat "$example_file")
=== END EXAMPLE ===

"
fi

# --- Build prompt ---
if [[ -f "$prd_file" ]]; then
  prd_content=$(cat "$prd_file")
  prompt="$rules

---

$prd_content

---

PROJECT STRUCTURE:
$file_tree

---

REFERENCE FILES (follow these patterns exactly):
$ref_files

---

RULES REMINDER:
- Named exports ONLY (export function X), NEVER export default
- Inline styles with CSSProperties, NEVER CSS modules
- Import with @/ alias, NEVER relative imports
- Use existing Panel component for bordered sections
- NO borderRadius anywhere
- Do NOT wrap file content in markdown code fences
- Output ONLY the file blocks, no explanations"
else
  prompt="$rules

---

TASK: $TITLE

PROJECT STRUCTURE:
$file_tree

REFERENCE FILES:
$ref_files

Write the code changes needed. Output each file using:

--- FILE: path/to/file ---
(complete file content)
--- END FILE ---"
fi

echo "Sending task to $MODEL..."
echo "$prompt" > "$OUTPUT_DIR/$TASK_ID-prompt.txt"

# --- Call Ollama ---
response=$(python3 -c "
import json, urllib.request, sys

prompt = open('$OUTPUT_DIR/$TASK_ID-prompt.txt').read()

payload = json.dumps({
    'model': '$MODEL',
    'prompt': prompt,
    'stream': False,
    'options': {
        'temperature': 0.2,
        'num_predict': 8192,
        'top_p': 0.9
    }
}).encode()

req = urllib.request.Request(
    '$OLLAMA_URL/api/generate',
    data=payload,
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req, timeout=600) as resp:
        data = json.load(resp)
        print(data.get('response', 'No response from model'))
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    sys.exit(1)
" 2>"$OUTPUT_DIR/$TASK_ID-error.txt") || {
  echo "ERROR: Ollama API call failed"
  cat "$OUTPUT_DIR/$TASK_ID-error.txt"
  update_agent_status "failed"
  exit 1
}

echo "$response" > "$OUTPUT_DIR/$TASK_ID-response.txt"

if [[ -z "$response" ]] || [[ "$response" == "No response from model" ]]; then
  echo "ERROR: Empty response from model"
  update_agent_status "failed"
  exit 1
fi

update_agent_status "completed"
update_task_status "review"

echo "Agent completed task $TASK_ID"
echo "Response saved to $OUTPUT_DIR/$TASK_ID-response.txt"

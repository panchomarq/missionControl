#!/bin/bash
set -euo pipefail

TASK_ID="${1:?Usage: run-agent.sh <task-id>}"
DATA_DIR="$(dirname "$0")/../data"
AGENTS_FILE="$DATA_DIR/agents.json"
TASKS_FILE="$DATA_DIR/tasks.json"
OUTPUT_DIR="$DATA_DIR/agent-output"
MODEL="qwen2.5-coder:14b"
OLLAMA_URL="http://localhost:11434"

mkdir -p "$OUTPUT_DIR"

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

project_dir="$HOME/Documents/projects/$PROJECT_ID"
prd_file="$DATA_DIR/prds/$TASK_ID.md"

context=""
if [[ -f "$project_dir/CLAUDE.md" ]]; then
  context+="=== CLAUDE.md ===
$(head -100 "$project_dir/CLAUDE.md")

"
fi

file_tree=$(find "$project_dir" -maxdepth 3 \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path '*/.git/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/venv/*' \
  -type f 2>/dev/null | head -50 | sed "s|$project_dir/||")

if [[ -f "$prd_file" ]]; then
  prd_content=$(cat "$prd_file")
  prompt="You are a coding agent. Follow the PRD below exactly.

$prd_content

PROJECT STRUCTURE:
$file_tree

$context

Output the COMPLETE content of each file you create or modify using this format:

--- FILE: path/to/file ---
(complete file content)
--- END FILE ---

Write production-ready code. No placeholders, no TODOs, no explanations outside the file blocks."
else
  prompt="You are a coding agent working on the project '$PROJECT_ID'.

TASK: $TITLE

PROJECT STRUCTURE:
$file_tree

PROJECT CONTEXT:
$context

Instructions:
1. Analyze the task and the project context
2. Write the code changes needed
3. For each file change, use this format:

--- FILE: path/to/file ---
(complete file content)
--- END FILE ---

Be precise and complete. Only modify what's needed for the task."
fi

echo "Sending task to $MODEL..."
echo "$prompt" > "$OUTPUT_DIR/$TASK_ID-prompt.txt"

response=$(curl -s "$OLLAMA_URL/api/generate" \
  --max-time 300 \
  -d "$(python3 -c "
import json
print(json.dumps({
    'model': '$MODEL',
    'prompt': '''$prompt''',
    'stream': False,
    'options': {
        'temperature': 0.3,
        'num_predict': 4096
    }
}))
")" 2>&1) || {
  echo "ERROR: Ollama API call failed"
  update_agent_status "failed"
  exit 1
}

echo "$response" | python3 -c "
import json, sys
try:
    resp = json.load(sys.stdin)
    print(resp.get('response', 'No response from model'))
except json.JSONDecodeError:
    print('ERROR: Invalid JSON response', file=sys.stderr)
    sys.exit(1)
" > "$OUTPUT_DIR/$TASK_ID-response.txt" 2>&1 || {
  echo "ERROR: Failed to parse Ollama response"
  echo "$response" > "$OUTPUT_DIR/$TASK_ID-raw.txt"
  update_agent_status "failed"
  exit 1
}

update_agent_status "completed"
update_task_status "done"

echo "Agent completed task $TASK_ID"
echo "Response saved to $OUTPUT_DIR/$TASK_ID-response.txt"

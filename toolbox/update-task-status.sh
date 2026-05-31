#!/bin/bash
set -euo pipefail

TASK_ID="${1:-}"
NEW_STATUS="${2:-}"
DATA_DIR="$(dirname "$0")/../data"
TASKS_FILE="$DATA_DIR/tasks.json"

if [[ -z $TASK_ID || -z $NEW_STATUS ]]; then
  echo "Usage: update-task-status.sh <task-id> <pending|in-progress|done>"
  exit 1
fi

if [[ ! $NEW_STATUS =~ ^(pending|in-progress|done)$ ]]; then
  echo "Error: status must be pending, in-progress, or done"
  exit 1
fi

if [[ ! -f $TASKS_FILE ]]; then
  echo "Error: $TASKS_FILE not found"
  exit 1
fi

NOW=$(date -Iseconds)

python3 -c "
import json, sys

with open('$TASKS_FILE', 'r') as f:
    tasks = json.load(f)

found = False
for task in tasks:
    if task['id'] == '$TASK_ID':
        task['status'] = '$NEW_STATUS'
        task['updatedAt'] = '$NOW'
        found = True
        break

if not found:
    print('Error: task $TASK_ID not found', file=sys.stderr)
    sys.exit(1)

with open('$TASKS_FILE', 'w') as f:
    json.dump(tasks, f, indent=2)
    f.write('\n')

print('Updated $TASK_ID → $NEW_STATUS')
"

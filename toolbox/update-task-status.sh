#!/bin/bash
set -euo pipefail

TASK_ID="${1:-}"
NEW_STATUS="${2:-}"
DATA_DIR="$(dirname "$0")/../data"
TASKS_FILE="$DATA_DIR/tasks.json"

VALID_STATUSES="pending|approved|in-progress|review|ask-human|waiting-tokens|failed|rejected|done"

if [[ -z $TASK_ID || -z $NEW_STATUS ]]; then
  echo "Usage: update-task-status.sh <task-id> <$VALID_STATUSES>"
  exit 1
fi

if [[ ! $NEW_STATUS =~ ^($VALID_STATUSES)$ ]]; then
  echo "Error: status must be one of: $VALID_STATUSES"
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

# Atomic write: stage to a temp file, then replace. os.replace is atomic on the
# same filesystem, so a concurrent reader never sees a half-written file.
import os
tmp = '$TASKS_FILE.' + str(os.getpid()) + '.tmp'
with open(tmp, 'w') as f:
    json.dump(tasks, f, indent=2)
    f.write('\n')
os.replace(tmp, '$TASKS_FILE')

print('Updated $TASK_ID → $NEW_STATUS')
"

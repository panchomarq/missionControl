#!/bin/bash
set -euo pipefail

# Usage: agent-push.sh <project-path> <task-id> "commit message"
# Creates a branch qwen/<task-id>, commits staged changes, pushes, and opens a PR.

PROJECT_PATH="${1:?Usage: agent-push.sh <project-path> <task-id> \"commit message\"}"
TASK_ID="${2:?Missing task-id}"
COMMIT_MSG="${3:?Missing commit message}"

BRANCH="qwen/${TASK_ID}"
AGENT_NAME="Qwen 2.5"
AGENT_EMAIL="noreply@ollama.local"

EXCLUDE_PATTERNS=(
  "*.env*"
  "credentials*"
  "*.key"
  "*.pem"
  "*.secret"
  "node_modules/"
  "__pycache__/"
  ".next/"
)

cd "$PROJECT_PATH"

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ $current_branch == "main" || $current_branch == "master" ]]; then
  echo "ABORT: refusing to push to $current_branch"
  echo "This script only pushes to qwen/* branches."
  exit 1
fi

if [[ $current_branch != "$BRANCH" ]]; then
  git fetch origin main
  git checkout -b "$BRANCH" origin/main
  echo "Created branch: $BRANCH"
fi

for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  git reset HEAD -- "$pattern" 2>/dev/null || true
done

if git diff --cached --quiet; then
  echo "No staged changes to commit."
  echo "Stage your changes first: git add <files>"
  exit 1
fi

git commit -m "$(cat <<EOF
[${TASK_ID}] ${COMMIT_MSG}

Co-Authored-By: ${AGENT_NAME} <${AGENT_EMAIL}>
EOF
)"

git push -u origin "$BRANCH"
echo "Pushed to origin/$BRANCH"

if gh pr list --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null | grep -q .; then
  PR_NUM=$(gh pr list --head "$BRANCH" --json number --jq '.[0].number')
  echo "PR #${PR_NUM} already exists for this branch."
else
  gh pr create \
    --title "[${TASK_ID}] ${COMMIT_MSG}" \
    --body "$(cat <<EOF
## Summary

Agent-generated PR for task \`${TASK_ID}\`.

## Checklist

- [ ] CI passes
- [ ] Code review approved
- [ ] Vault updated with result

---
Agent: ${AGENT_NAME}
EOF
)" \
    --base main
  echo "PR created."
fi

echo "Done. Branch: $BRANCH"

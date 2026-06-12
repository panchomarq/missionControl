#!/bin/bash
# Daily refresh of the data lake: scan all projects (required), then sync the
# Obsidian roadmap (best-effort — never fails the run if the vault is unmounted).
set -euo pipefail

SCRIPT_DIR="$(dirname "$0")"

bash "$SCRIPT_DIR/scan-projects.sh"

if ! bash "$SCRIPT_DIR/sync-obsidian.sh"; then
  echo "sync-obsidian.sh failed — continuing (scan output is already written)."
fi

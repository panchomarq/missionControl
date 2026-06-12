#!/bin/bash
# Single installer for every Mission Control systemd user timer. New timers
# (runner, strategic pass) only need to drop their .service/.timer files into
# toolbox/systemd/ — this script enumerates and installs all of them.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UNIT_SRC="$SCRIPT_DIR/systemd"
UNIT_DST="$HOME/.config/systemd/user"

if [[ ! -d $UNIT_SRC ]]; then
  echo "Error: $UNIT_SRC not found"
  exit 1
fi

mkdir -p "$UNIT_DST"

# Run user timers even when no session is active (e.g. machine sitting at the
# display manager after a reboot). Persistent=true then catches up missed runs.
if command -v loginctl >/dev/null 2>&1; then
  loginctl enable-linger "$USER" 2>/dev/null || \
    echo "Note: could not enable linger (timers run at login instead)."
fi

systemctl --user daemon-reload

installed=()
for unit in "$UNIT_SRC"/*.service "$UNIT_SRC"/*.timer; do
  [[ -e $unit ]] || continue
  cp "$unit" "$UNIT_DST/"
  installed+=("$(basename "$unit")")
done

systemctl --user daemon-reload

# Enable and start every timer (services are triggered by their timer).
for unit in "$UNIT_SRC"/*.timer; do
  [[ -e $unit ]] || continue
  name="$(basename "$unit")"
  systemctl --user enable --now "$name"
  echo "Enabled $name"
done

echo "Installed: ${installed[*]:-none}"
echo "Active timers:"
systemctl --user list-timers --all 'mc-*' --no-pager || true

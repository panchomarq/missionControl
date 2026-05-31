import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";

type Status = "active" | "paused" | "archived";

const STATUS_MAP: Record<Status, { color: string; icon: string }> = {
  active: { color: "var(--health-green)", icon: "play" },
  paused: { color: "var(--health-yellow)", icon: "power" },
  archived: { color: "var(--text-dim)", icon: "folder" },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { color, icon } = STATUS_MAP[status];

  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-xs)",
    color,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color,
    padding: "3px 7px",
    textTransform: "uppercase",
    letterSpacing: 1,
  };

  return (
    <span style={style}>
      <Icon name={icon} size={10} />
      {status}
    </span>
  );
}

import type { CSSProperties } from "react";

type Status = "active" | "paused" | "archived";

const colors: Record<Status, string> = {
  active: "var(--health-green)",
  paused: "var(--health-yellow)",
  archived: "var(--text-dim)",
};

const icons: Record<Status, string> = {
  active: "▶",
  paused: "║",
  archived: "■",
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "8px",
    color: colors[status],
    border: `1px solid ${colors[status]}`,
    padding: "2px 6px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  return (
    <span style={style}>
      {icons[status]} {status}
    </span>
  );
}

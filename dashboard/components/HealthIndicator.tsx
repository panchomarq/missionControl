import type { CSSProperties } from "react";

type Health = "green" | "yellow" | "red";

const labels: Record<Health, string> = {
  green: "STABLE",
  yellow: "WARNING",
  red: "CRITICAL",
};

const icons: Record<Health, string> = {
  green: "♥",
  yellow: "⚠",
  red: "✖",
};

interface HealthIndicatorProps {
  health: Health;
}

export function HealthIndicator({ health }: HealthIndicatorProps) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "8px",
    color: `var(--health-${health})`,
  };

  const dotStyle: CSSProperties = {
    display: "inline-block",
    width: "8px",
    height: "8px",
    background: `var(--health-${health})`,
    boxShadow: `0 0 6px var(--health-${health})`,
    animation: health === "red" ? "blink 1s step-end infinite" : undefined,
  };

  return (
    <span style={style}>
      <span style={dotStyle} />
      {icons[health]} {labels[health]}
    </span>
  );
}

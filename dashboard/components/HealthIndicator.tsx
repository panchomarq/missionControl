import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";

type Health = "green" | "yellow" | "red";

const HEALTH_MAP: Record<Health, { label: string; icon: string }> = {
  green: { label: "STABLE", icon: "heart" },
  yellow: { label: "WARNING", icon: "flag" },
  red: { label: "CRITICAL", icon: "close" },
};

interface HealthIndicatorProps {
  health: Health;
}

export function HealthIndicator({ health }: HealthIndicatorProps) {
  const color = `var(--health-${health})`;
  const { label, icon } = HEALTH_MAP[health];

  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-xs)",
    color,
  };

  return (
    <span style={style}>
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: health === "red"
            ? "blink 1s step-end infinite"
            : undefined,
        }}
      />
      <Icon name={icon} size={12} />
      {label}
    </span>
  );
}

"use client";

import type { CSSProperties } from "react";
import type { AgentSession } from "@/lib/data";

const badgeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 8px",
  background: "var(--bg-dark)",
  border: "1px solid var(--border)",
  fontSize: "7px",
  letterSpacing: "1px",
};

const dotStyle: CSSProperties = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
};

const agentColors: Record<AgentSession["agentType"], string> = {
  qwen: "#22d3ee",
  opus: "#a78bfa",
  claude: "#fb923c",
};

const statusLabels: Record<AgentSession["status"], string> = {
  spawning: "SPAWNING",
  active: "WORKING",
  completed: "DONE",
  failed: "FAILED",
};

interface AgentBadgeProps {
  agent: AgentSession;
}

export function AgentBadge({ agent }: AgentBadgeProps) {
  const color = agentColors[agent.agentType];
  const isActive =
    agent.status === "spawning" || agent.status === "active";

  return (
    <div style={badgeStyle}>
      <span
        style={{
          ...dotStyle,
          background: color,
          boxShadow: isActive ? `0 0 6px ${color}` : "none",
          animation: isActive ? "pulse 1.5s infinite" : "none",
        }}
      />
      <span style={{ color: "var(--text-dim)" }}>
        {agent.agentType.toUpperCase()}
      </span>
      <span
        style={{
          color: isActive ? color : "var(--text-dim)",
          animation:
            agent.status === "spawning" ? "blink 0.8s infinite" : "none",
        }}
      >
        {statusLabels[agent.status]}
      </span>
    </div>
  );
}

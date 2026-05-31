"use client";

import type { CSSProperties } from "react";
import type { AgentSession } from "@/lib/data";
import { AgentBadge } from "@/components/AgentBadge";

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const headerStyle: CSSProperties = {
  fontSize: "8px",
  color: "var(--text-dim)",
  textTransform: "uppercase",
  letterSpacing: "2px",
  padding: "4px 8px",
};

const emptyStyle: CSSProperties = {
  fontSize: "7px",
  color: "var(--text-dim)",
  padding: "6px 8px",
  fontStyle: "italic",
};

const taskLabel: CSSProperties = {
  fontSize: "6px",
  color: "var(--text-dim)",
  padding: "0 8px 4px",
  lineHeight: "1.8",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

interface AgentPanelProps {
  agents: AgentSession[];
  tasks?: Array<{ id: string; title: string }>;
}

export function AgentPanel({ agents, tasks = [] }: AgentPanelProps) {
  const active = agents.filter(
    (a) => a.status === "spawning" || a.status === "active",
  );
  const recent = agents
    .filter((a) => a.status === "completed" || a.status === "failed")
    .slice(-3);

  const taskMap = new Map(tasks.map((t) => [t.id, t.title]));

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        Agents {active.length > 0 && `(${active.length})`}
      </div>

      {active.length === 0 && recent.length === 0 && (
        <div style={emptyStyle}>No agents deployed</div>
      )}

      {active.map((agent) => (
        <div key={agent.id}>
          <AgentBadge agent={agent} />
          <div style={taskLabel}>
            {taskMap.get(agent.taskId) ?? agent.taskId}
          </div>
        </div>
      ))}

      {recent.map((agent) => (
        <div key={agent.id} style={{ opacity: 0.5 }}>
          <AgentBadge agent={agent} />
        </div>
      ))}
    </div>
  );
}

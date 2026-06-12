import type { CSSProperties } from "react";
import type { AgentSession } from "@/lib/data";
import { Icon } from "@/components/Icon";

const wrapStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "4px 0",
};

const itemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  background: "var(--bg-dark)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--border)",
  borderLeftWidth: 2,
  borderLeftColor: "var(--agent-qwen)",
};

const posStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-tiny)",
  color: "var(--text-dim)",
  minWidth: 14,
};

const labelStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--ft-sm)",
  color: "var(--text-dim)",
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

interface AgentQueueProps {
  agents: AgentSession[];
  taskMap: Record<string, string>;
}

export function AgentQueue({ agents, taskMap }: AgentQueueProps) {
  const queued = agents
    .filter((a) => a.status === "spawning")
    .toSorted(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

  if (queued.length === 0) return null;

  return (
    <div style={wrapStyle}>
      {queued.map((agent, i) => (
        <div key={agent.id} style={itemStyle}>
          <span style={posStyle}>{i + 1}</span>
          <Icon name="zap" size={10} />
          <span style={labelStyle}>
            {taskMap[agent.taskId] ?? agent.taskId}
          </span>
        </div>
      ))}
    </div>
  );
}

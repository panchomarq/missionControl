"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { rescanProjects } from "@/app/actions";
import type { AgentSession } from "@/lib/data";
import { AgentBadge } from "@/components/AgentBadge";

const sidebarStyle: CSSProperties = {
  width: "200px",
  minHeight: "100vh",
  background: "var(--bg-panel)",
  borderRight: "2px solid var(--border)",
  padding: "16px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  position: "fixed",
  top: 0,
  left: 0,
  overflow: "auto",
};

const logoStyle: CSSProperties = {
  fontSize: "11px",
  color: "var(--accent)",
  textAlign: "center",
  padding: "12px 0",
  borderBottom: "1px solid var(--border)",
  letterSpacing: "1px",
  lineHeight: "2.2",
};

const navStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const linkStyle: CSSProperties = {
  fontSize: "10px",
  padding: "10px 8px",
  color: "var(--text)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "background 0.1s",
  textDecoration: "none",
};

const btnStyle: CSSProperties = {
  ...linkStyle,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "'Press Start 2P', monospace",
  width: "100%",
  textAlign: "left",
};

const sectionLabel: CSSProperties = {
  fontSize: "8px",
  color: "var(--text-dim)",
  textTransform: "uppercase",
  letterSpacing: "2px",
  padding: "4px 8px",
};

const versionStyle: CSSProperties = {
  marginTop: "auto",
  fontSize: "6px",
  color: "var(--text-dim)",
  textAlign: "center",
  padding: "8px",
  borderTop: "1px solid var(--border)",
};

const agentItemStyle: CSSProperties = {
  padding: "4px 8px",
};

const taskLabelStyle: CSSProperties = {
  fontSize: "6px",
  color: "var(--text-dim)",
  padding: "0 8px 6px",
  lineHeight: "1.8",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const emptyStyle: CSSProperties = {
  fontSize: "7px",
  color: "var(--text-dim)",
  padding: "6px 8px",
  fontStyle: "italic",
};

const timeStyle: CSSProperties = {
  fontSize: "5px",
  color: "var(--text-dim)",
  padding: "0 8px 2px",
};

interface SidebarProps {
  agents?: AgentSession[];
  tasks?: Array<{ id: string; title: string }>;
}

export function Sidebar({
  agents: initialAgents = [],
  tasks: initialTasks = [],
}: SidebarProps) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [agents, setAgents] = useState(initialAgents);
  const [taskMap, setTaskMap] = useState<Record<string, string>>(
    Object.fromEntries(initialTasks.map((t) => [t.id, t.title])),
  );

  const pollAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) return;
      const data = await res.json();
      setAgents(data.agents);
      setTaskMap(data.taskMap);

      const hasActive = data.agents.some(
        (a: AgentSession) =>
          a.status === "spawning" || a.status === "active",
      );
      if (!hasActive && initialAgents.some(
        (a) => a.status === "spawning" || a.status === "active",
      )) {
        router.refresh();
      }
    } catch { /* ignore */ }
  }, [initialAgents, router]);

  useEffect(() => {
    const interval = setInterval(pollAgents, 3000);
    return () => clearInterval(interval);
  }, [pollAgents]);

  async function handleRescan() {
    setScanning(true);
    await rescanProjects();
    router.refresh();
    setScanning(false);
  }

  const active = agents.filter(
    (a) => a.status === "spawning" || a.status === "active",
  );
  const recent = agents
    .filter((a) => a.status === "completed" || a.status === "failed")
    .slice(-3)
    .reverse();

  function formatElapsed(startedAt: string): string {
    const seconds = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000,
    );
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  return (
    <nav style={sidebarStyle}>
      <div style={logoStyle}>
        ⚔ MISSION<br />CONTROL
      </div>

      <div style={navStyle}>
        <div style={sectionLabel}>Navigation</div>
        <Link href="/" style={linkStyle}>
          🗺 Overview
        </Link>
      </div>

      <div style={navStyle}>
        <div style={sectionLabel}>System</div>
        <button
          style={{
            ...btnStyle,
            color: scanning ? "var(--accent)" : "var(--text)",
            animation: scanning ? "pulse 1s infinite" : "none",
          }}
          onClick={handleRescan}
          disabled={scanning}
        >
          {scanning ? "⏳ Scanning..." : "🔄 Rescan"}
        </button>
      </div>

      <div style={navStyle}>
        <div style={sectionLabel}>
          Agents {active.length > 0 && `(${active.length})`}
        </div>

        {active.length === 0 && recent.length === 0 && (
          <div style={emptyStyle}>No agents deployed</div>
        )}

        {active.map((agent) => (
          <div key={agent.id} style={agentItemStyle}>
            <AgentBadge agent={agent} />
            <div style={taskLabelStyle}>
              {taskMap[agent.taskId] ?? agent.taskId}
            </div>
            <div style={timeStyle}>
              ⏱ {formatElapsed(agent.startedAt)}
            </div>
          </div>
        ))}

        {recent.map((agent) => (
          <div key={agent.id} style={{ ...agentItemStyle, opacity: 0.5 }}>
            <AgentBadge agent={agent} />
            <div style={taskLabelStyle}>
              {taskMap[agent.taskId] ?? agent.taskId}
            </div>
          </div>
        ))}
      </div>

      <div style={versionStyle}>
        v0.2.0
      </div>
    </nav>
  );
}

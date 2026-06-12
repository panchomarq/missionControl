"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { rescanProjects } from "@/app/actions";
import type { AgentSession } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { AgentBadge } from "@/components/AgentBadge";
import { AgentQueue } from "@/components/AgentQueue";

const sidebarStyle: CSSProperties = {
  width: 210,
  minHeight: "100vh",
  background: "var(--bg-panel)",
  borderRight: "2px solid var(--border)",
  padding: "16px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 22,
  position: "fixed",
  top: 0,
  left: 0,
  overflow: "auto",
};

const linkStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--ft-lg)",
  padding: "8px 8px",
  color: "var(--text)",
  display: "flex",
  alignItems: "center",
  gap: 9,
  cursor: "pointer",
  textDecoration: "none",
};

const btnStyle: CSSProperties = {
  ...linkStyle,
  background: "none",
  border: "none",
  width: "100%",
  textAlign: "left",
};

const sectionLabel: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-xs)",
  color: "var(--text-dim)",
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "4px 8px",
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

  const hasActiveAgents = agents.some(
    (a) => a.status === "spawning" || a.status === "active",
  );

  const pollAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) return;
      const data = await res.json();
      setAgents(data.agents);
      setTaskMap(data.taskMap);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!hasActiveAgents) return;
    const interval = setInterval(pollAgents, 5000);
    return () => clearInterval(interval);
  }, [hasActiveAgents, pollAgents]);

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

  return (
    <nav style={sidebarStyle}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-md)",
          color: "var(--accent)",
          textAlign: "center",
          padding: "10px 0 14px",
          borderBottom: "1px solid var(--border)",
          letterSpacing: 1,
          lineHeight: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name="flag" size={22} />
        MISSION<br />CONTROL
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={sectionLabel}>Navigation</div>
        <Link href="/" style={linkStyle}>
          <Icon name="home" size={15} /> Overview
        </Link>
        <Link href="/tasks" style={linkStyle}>
          <Icon name="clipboard" size={15} /> Tasks
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
          <Icon name="reload" size={15} />
          {scanning ? "Scanning…" : "Rescan"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={sectionLabel}>
          Agents {active.length > 0 && `(${active.length})`}
        </div>

        {active.length === 0 && recent.length === 0 && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              color: "var(--text-dim)",
              padding: "4px 8px",
              fontStyle: "italic",
            }}
          >
            No agents deployed
          </div>
        )}

        {active.map((agent) => (
          <div key={agent.id}>
            <AgentBadge agent={agent} />
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--ft-sm)",
                color: "var(--text-dim)",
                padding: "2px 8px 4px",
                lineHeight: "var(--lh-tight)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {taskMap[agent.taskId] ?? agent.taskId}
            </div>
          </div>
        ))}

        <AgentQueue agents={agents} taskMap={taskMap} />

        {recent.map((agent) => (
          <div key={agent.id} style={{ opacity: 0.5 }}>
            <AgentBadge agent={agent} />
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-micro)",
          color: "var(--text-dim)",
          textAlign: "center",
          padding: 8,
          borderTop: "1px solid var(--border)",
        }}
      >
        v0.2.0
      </div>
    </nav>
  );
}

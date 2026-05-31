"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { rescanProjects } from "@/app/actions";
import type { AgentSession } from "@/lib/data";
import { AgentPanel } from "@/components/AgentPanel";

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

interface SidebarProps {
  agents?: AgentSession[];
  tasks?: Array<{ id: string; title: string }>;
}

export function Sidebar({ agents = [], tasks = [] }: SidebarProps) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  async function handleRescan() {
    setScanning(true);
    await rescanProjects();
    router.refresh();
    setScanning(false);
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

      <AgentPanel agents={agents} tasks={tasks} />

      <div style={versionStyle}>
        v0.1.0
      </div>
    </nav>
  );
}

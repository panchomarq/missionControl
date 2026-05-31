import type { CSSProperties } from "react";
import { getProjects, getActiveAgents, getTasks } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { Panel } from "@/components/Panel";

const headerStyle: CSSProperties = {
  marginBottom: "24px",
};

const titleStyle: CSSProperties = {
  fontSize: "18px",
  color: "var(--text-bright)",
  marginBottom: "8px",
};

const subtitleStyle: CSSProperties = {
  fontSize: "9px",
  color: "var(--text-dim)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "16px",
};

const statsRow: CSSProperties = {
  display: "flex",
  gap: "16px",
  marginBottom: "24px",
};

const statBox: CSSProperties = {
  flex: 1,
  textAlign: "center",
  padding: "12px",
};

const statValue: CSSProperties = {
  fontSize: "20px",
  color: "var(--text-bright)",
  marginBottom: "8px",
};

const statLabel: CSSProperties = {
  fontSize: "8px",
  color: "var(--text-dim)",
  textTransform: "uppercase",
  letterSpacing: "2px",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjects();

  const activeAgents = await getActiveAgents();
  const allTasks = await getTasks();
  const pendingTasks = allTasks.filter((t) => t.status === "pending").length;

  const active = projects.filter((p) => p.status === "active").length;
  const warnings = projects.filter((p) => p.health === "yellow").length;
  const critical = projects.filter((p) => p.health === "red").length;

  return (
    <>
      <div style={headerStyle}>
        <div style={titleStyle}>⚔ World Map</div>
        <div style={subtitleStyle}>
          {projects.length} projects discovered — last scan{" "}
          {projects[0]?.lastScanned
            ? new Date(projects[0].lastScanned).toLocaleString()
            : "never"}
        </div>
      </div>

      <div style={statsRow}>
        <Panel style={statBox}>
          <div style={statValue}>{active}</div>
          <div style={statLabel}>Active Quests</div>
        </Panel>
        <Panel style={statBox}>
          <div style={{ ...statValue, color: "var(--health-yellow)" }}>
            {warnings}
          </div>
          <div style={statLabel}>Warnings</div>
        </Panel>
        <Panel style={statBox}>
          <div style={{ ...statValue, color: "var(--health-red)" }}>
            {critical}
          </div>
          <div style={statLabel}>Critical</div>
        </Panel>
        <Panel style={statBox}>
          <div style={statValue}>{pendingTasks}</div>
          <div style={statLabel}>Quests</div>
        </Panel>
        <Panel style={statBox}>
          <div
            style={{
              ...statValue,
              color: activeAgents.length > 0 ? "#22d3ee" : "var(--text-dim)",
              animation: activeAgents.length > 0
                ? "pulse 1.5s infinite"
                : "none",
            }}
          >
            {activeAgents.length}
          </div>
          <div style={statLabel}>Agents</div>
        </Panel>
      </div>

      <div style={gridStyle}>
        {projects.map((project, i) => (
          <div
            key={project.id}
            className="animate-in"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </>
  );
}

import type { CSSProperties } from "react";
import { getProjects, getActiveAgents, getTasks } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { Panel } from "@/components/Panel";

export const dynamic = "force-dynamic";

const statValue: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-3xl)",
  color: "var(--text-bright)",
  marginBottom: 8,
};

const statLabel: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-xs)",
  color: "var(--text-dim)",
  textTransform: "uppercase",
  letterSpacing: 2,
};

const statBox: CSSProperties = {
  flex: 1,
  textAlign: "center",
  padding: 18,
};

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
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            color: "var(--text-bright)",
            marginBottom: 8,
          }}
        >
          World Map
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--ft-base)",
            color: "var(--text-dim)",
          }}
        >
          {projects.length} projects discovered — last scan{" "}
          {projects[0]?.lastScanned
            ? new Date(projects[0].lastScanned).toLocaleString()
            : "never"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        <Panel style={statBox}>
          <div style={statValue}>{active}</div>
          <div style={statLabel}>Active</div>
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
              color: activeAgents.length > 0
                ? "var(--agent-qwen)"
                : "var(--text-dim)",
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
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

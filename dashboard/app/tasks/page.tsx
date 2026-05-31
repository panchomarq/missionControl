import type { CSSProperties } from "react";
import Link from "next/link";
import {
  getTasks,
  getProjects,
  getAgents,
  getAllPrds,
} from "@/lib/data";
import { Panel } from "@/components/Panel";
import { TaskBoard } from "@/components/TaskBoard";

export const dynamic = "force-dynamic";

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

export default async function TasksPage() {
  const tasks = await getTasks();
  const projects = await getProjects();
  const agents = await getAgents();
  const prds = await getAllPrds(tasks);

  const projectMap = Object.fromEntries(
    projects.map((p) => [p.id, p.name]),
  );

  const pending = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in-progress");
  const done = tasks.filter((t) => t.status === "done");

  const withPrd = Object.keys(prds).length;

  return (
    <>
      <div style={headerStyle}>
        <div style={titleStyle}>📋 Quest Log</div>
        <div style={subtitleStyle}>
          All tasks across {projects.length} projects
        </div>
      </div>

      <div style={statsRow}>
        <Panel style={statBox}>
          <div style={statValue}>{pending.length}</div>
          <div style={statLabel}>Pending</div>
        </Panel>
        <Panel style={statBox}>
          <div style={{
            ...statValue,
            color: "var(--health-yellow)",
            animation: inProgress.length > 0 ? "pulse 1.5s infinite" : "none",
          }}>
            {inProgress.length}
          </div>
          <div style={statLabel}>In Progress</div>
        </Panel>
        <Panel style={statBox}>
          <div style={{ ...statValue, color: "var(--health-green)" }}>
            {done.length}
          </div>
          <div style={statLabel}>Done</div>
        </Panel>
        <Panel style={statBox}>
          <div style={{ ...statValue, color: "var(--accent)" }}>
            {withPrd}
          </div>
          <div style={statLabel}>With PRD</div>
        </Panel>
      </div>

      <TaskBoard
        tasks={tasks}
        agents={agents}
        prds={prds}
        projectMap={projectMap}
      />
    </>
  );
}

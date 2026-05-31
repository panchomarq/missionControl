import type { CSSProperties } from "react";
import {
  getTasks,
  getProjects,
  getAgents,
  getAllPrds,
} from "@/lib/data";
import { Panel } from "@/components/Panel";
import { TaskBoard } from "@/components/TaskBoard";

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
  padding: 12,
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
  const review = tasks.filter((t) => t.status === "review");
  const done = tasks.filter((t) => t.status === "done");

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
          Quest Log
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--ft-base)",
            color: "var(--text-dim)",
          }}
        >
          All tasks across {projects.length} projects
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
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
          <div style={statLabel}>Working</div>
        </Panel>
        <Panel style={statBox}>
          <div style={{ ...statValue, color: "var(--agent-qwen)" }}>
            {review.length}
          </div>
          <div style={statLabel}>Review</div>
        </Panel>
        <Panel style={statBox}>
          <div style={{ ...statValue, color: "var(--health-green)" }}>
            {done.length}
          </div>
          <div style={statLabel}>Done</div>
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

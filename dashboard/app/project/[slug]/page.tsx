import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getTasksByProject, getTaskPrd } from "@/lib/data";
import { Panel } from "@/components/Panel";
import { HealthIndicator } from "@/components/HealthIndicator";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskList } from "@/components/TaskList";
import { AddTaskForm } from "@/components/AddTaskForm";

export const dynamic = "force-dynamic";

const backLink: CSSProperties = {
  fontSize: "9px",
  color: "var(--text-dim)",
  marginBottom: "16px",
  display: "inline-block",
};

const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "24px",
};

const titleStyle: CSSProperties = {
  fontSize: "18px",
  color: "var(--text-bright)",
  marginBottom: "8px",
};

const descStyle: CSSProperties = {
  fontSize: "10px",
  color: "var(--text-dim)",
  lineHeight: "2.2",
  maxWidth: "600px",
};

const gridTwo: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  marginBottom: "24px",
};

const infoRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid var(--border)",
  fontSize: "9px",
};

const label: CSSProperties = {
  color: "var(--text-dim)",
};

const value: CSSProperties = {
  color: "var(--text-bright)",
};

const stackRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "8px",
};

const tag: CSSProperties = {
  fontSize: "8px",
  color: "var(--accent)",
  border: "1px solid var(--accent)",
  padding: "3px 8px",
  letterSpacing: "1px",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const tasks = await getTasksByProject(project.id);
  const hasGit = project.git && project.git.branch;

  const prdEntries = await Promise.all(
    tasks.map(async (t) => {
      const prd = await getTaskPrd(t.id);
      return [t.id, prd] as const;
    }),
  );
  const prds: Record<string, string> = {};
  for (const [id, prd] of prdEntries) {
    if (prd) prds[id] = prd;
  }

  const pending = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in-progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <>
      <Link href="/" style={backLink}>
        ← Back to World Map
      </Link>

      <div style={headerRow}>
        <div>
          <div style={titleStyle}>{project.name}</div>
          <div style={descStyle}>{project.description}</div>
          <div style={stackRow}>
            {project.stack.map((tech) => (
              <span key={tech} style={tag}>{tech}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
          <StatusBadge status={project.status} />
          <HealthIndicator health={project.health} />
        </div>
      </div>

      <div style={gridTwo}>
        <Panel title="Git Status">
          {hasGit ? (
            <>
              <div style={infoRow}>
                <span style={label}>Branch</span>
                <span style={value}>⎇ {project.git.branch}</span>
              </div>
              <div style={infoRow}>
                <span style={label}>Dirty Files</span>
                <span style={{
                  ...value,
                  color: project.git.dirtyFiles > 0
                    ? "var(--health-yellow)"
                    : "var(--health-green)",
                }}>
                  {project.git.dirtyFiles}
                </span>
              </div>
              <div style={infoRow}>
                <span style={label}>Unpushed</span>
                <span style={{
                  ...value,
                  color: project.git.hasUnpushed
                    ? "var(--health-yellow)"
                    : "var(--health-green)",
                }}>
                  {project.git.hasUnpushed ? "Yes" : "No"}
                </span>
              </div>
              <div style={infoRow}>
                <span style={label}>Last Commit</span>
                <span style={value}>
                  {new Date(project.git.lastCommit).toLocaleDateString()}
                </span>
              </div>
              <div style={{ ...infoRow, borderBottom: "none" }}>
                <span style={label}>Message</span>
                <span style={{
                  ...value,
                  maxWidth: "200px",
                  textAlign: "right",
                  lineHeight: "1.8",
                }}>
                  {project.git.lastCommitMessage}
                </span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: "9px", color: "var(--text-dim)" }}>
              No git repository detected
            </div>
          )}
        </Panel>

        <Panel title="Info">
          <div style={infoRow}>
            <span style={label}>Path</span>
            <span style={{ ...value, fontSize: "7px" }}>{project.path}</span>
          </div>
          <div style={infoRow}>
            <span style={label}>Priority</span>
            <span style={value}>{project.priority.toUpperCase()}</span>
          </div>
          <div style={infoRow}>
            <span style={label}>Last Scan</span>
            <span style={value}>
              {new Date(project.lastScanned).toLocaleString()}
            </span>
          </div>
          <div style={{ ...infoRow, borderBottom: "none" }}>
            <span style={label}>Tasks</span>
            <span style={value}>
              {pending.length} pending · {inProgress.length} active · {done.length} done
            </span>
          </div>
        </Panel>
      </div>

      <Panel title="Quests" style={{ marginBottom: "16px" }}>
        <AddTaskForm projectId={project.id} />
        <TaskList tasks={tasks} projectPath={project.path} prds={prds} />
      </Panel>
    </>
  );
}

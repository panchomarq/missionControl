"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Task, AgentSession } from "@/lib/data";
import { startTask } from "@/app/actions";
import { AgentReview } from "@/components/AgentReview";
import { Panel } from "@/components/Panel";

const statusColors: Record<Task["status"], string> = {
  pending: "var(--text-dim)",
  "in-progress": "var(--health-yellow)",
  done: "var(--health-green)",
};

const statusIcons: Record<Task["status"], string> = {
  pending: "○",
  "in-progress": "◐",
  done: "●",
};

const statusLabels: Record<Task["status"], string> = {
  pending: "PENDING",
  "in-progress": "WORKING",
  done: "DONE",
};

const priorityColors: Record<Task["priority"], string> = {
  high: "var(--health-red)",
  medium: "var(--health-yellow)",
  low: "var(--text-dim)",
};

const filterRow: CSSProperties = {
  display: "flex",
  gap: "6px",
  marginBottom: "16px",
  flexWrap: "wrap",
};

const filterBtn: CSSProperties = {
  background: "none",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--border)",
  color: "var(--text-dim)",
  padding: "4px 10px",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "7px",
  cursor: "pointer",
  letterSpacing: "1px",
};

const filterActive: CSSProperties = {
  ...filterBtn,
  borderColor: "var(--accent)",
  color: "var(--accent)",
};

const taskRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderBottom: "1px solid var(--border)",
  fontSize: "9px",
};

const btnStyle: CSSProperties = {
  background: "none",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--border)",
  color: "var(--text-dim)",
  padding: "3px 8px",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "7px",
  cursor: "pointer",
  letterSpacing: "1px",
};

const projectTag: CSSProperties = {
  fontSize: "6px",
  color: "var(--accent)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--accent)",
  padding: "2px 6px",
  letterSpacing: "1px",
  textDecoration: "none",
};

const prdContainer: CSSProperties = {
  margin: "0 12px 12px",
  borderLeft: "3px solid var(--accent)",
  background: "var(--bg-dark)",
  overflow: "hidden",
};

const prdHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  borderBottom: "1px solid var(--border)",
};

const prdTitle: CSSProperties = {
  fontSize: "7px",
  color: "var(--accent)",
  letterSpacing: "2px",
};

const prdBody: CSSProperties = {
  padding: "12px",
  maxHeight: "400px",
  overflow: "auto",
};

const prdSection: CSSProperties = {
  marginBottom: "12px",
};

const prdSectionTitle: CSSProperties = {
  fontSize: "7px",
  color: "var(--accent)",
  letterSpacing: "1px",
  marginBottom: "6px",
  borderBottom: "1px solid var(--border)",
  paddingBottom: "4px",
};

const prdText: CSSProperties = {
  fontSize: "7px",
  color: "var(--text)",
  lineHeight: "2.4",
  fontFamily: "'Press Start 2P', monospace",
  whiteSpace: "pre-wrap",
};

const prdCode: CSSProperties = {
  fontSize: "7px",
  color: "var(--health-green)",
  lineHeight: "2",
  fontFamily: "'Press Start 2P', monospace",
  whiteSpace: "pre-wrap",
  background: "rgba(0,0,0,0.3)",
  padding: "8px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--border)",
  marginTop: "4px",
};

interface TaskBoardProps {
  tasks: Task[];
  agents: AgentSession[];
  prds: Record<string, string>;
  projectMap: Record<string, string>;
}

interface PrdSection {
  title: string;
  content: string;
  isCode: boolean;
}

function parsePrd(raw: string): PrdSection[] {
  const sections: PrdSection[] = [];
  const lines = raw.split("\n");
  let current: PrdSection | null = null;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        if (current) {
          current.content += "\n" + codeBuffer.join("\n");
        } else {
          sections.push({
            title: "Code",
            content: codeBuffer.join("\n"),
            isCode: true,
          });
        }
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith("## ")) {
      current = {
        title: line.replace(/^## /, ""),
        content: "",
        isCode: false,
      };
      sections.push(current);
    } else if (line.startsWith("# ")) {
      continue;
    } else if (current) {
      current.content += (current.content ? "\n" : "") + line;
    }
  }

  return sections;
}

export function TaskBoard({
  tasks,
  agents,
  prds,
  projectMap,
}: TaskBoardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [expandedPrd, setExpandedPrd] = useState<string | null>(null);
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);

  const projectIds = [...new Set(tasks.map((t) => t.projectId))];

  const filtered = filter === "all"
    ? tasks
    : tasks.filter((t) => t.projectId === filter);

  const pending = filtered.filter((t) => t.status === "pending");
  const inProgress = filtered.filter((t) => t.status === "in-progress");
  const done = filtered.filter((t) => t.status === "done");

  function getAgentForTask(taskId: string): AgentSession | undefined {
    return agents
      .filter((a) => a.taskId === taskId)
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )[0];
  }

  async function handleStart(task: Task) {
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("projectId", task.projectId);
    await startTask(formData);
    router.refresh();
  }

  function renderTask(task: Task) {
    const color = statusColors[task.status];
    const agent = getAgentForTask(task.id);
    const hasPrd = !!prds[task.id];
    const showPrd = expandedPrd === task.id;
    const hasReview = agent?.status === "completed";

    return (
      <div key={task.id}>
        <div style={taskRow}>
          <span style={{ color, fontSize: "12px", minWidth: "14px" }}>
            {statusIcons[task.status]}
          </span>
          <Link
            href={`/project/${task.projectId}`}
            style={projectTag}
          >
            {projectMap[task.projectId] ?? task.projectId}
          </Link>
          <span style={{
            flex: 1,
            color: task.status === "done" ? "var(--text-dim)" : "var(--text)",
            textDecoration: task.status === "done" ? "line-through" : "none",
          }}>
            {task.title}
          </span>
          <span style={{
            fontSize: "6px",
            color: priorityColors[task.priority],
            border: `1px solid ${priorityColors[task.priority]}`,
            padding: "1px 4px",
            letterSpacing: "1px",
          }}>
            {task.priority.toUpperCase()}
          </span>
          <span style={{
            fontSize: "6px",
            padding: "2px 6px",
            letterSpacing: "1px",
            borderWidth: "1px",
            borderStyle: "solid",
            color,
            borderColor: color,
            animation: task.status === "in-progress"
              ? "pulse 1.5s infinite"
              : "none",
          }}>
            {statusLabels[task.status]}
          </span>
          {hasPrd && (
            <button
              style={{
                ...btnStyle,
                color: showPrd ? "var(--accent)" : "var(--text-dim)",
                borderColor: showPrd ? "var(--accent)" : "var(--border)",
              }}
              onClick={() => setExpandedPrd(showPrd ? null : task.id)}
            >
              📋 PRD
            </button>
          )}
          {hasReview && (
            <button
              style={{
                ...btnStyle,
                borderColor: "#22d3ee",
                color: "#22d3ee",
              }}
              onClick={() => setReviewTaskId(task.id)}
            >
              📄 Review
            </button>
          )}
          {task.status === "pending" && (
            <button
              style={{
                ...btnStyle,
                borderColor: "var(--health-green)",
                color: "var(--health-green)",
              }}
              onClick={() => handleStart(task)}
            >
              ▸ Start
            </button>
          )}
        </div>
        {showPrd && prds[task.id] && renderPrd(prds[task.id])}
      </div>
    );
  }

  function renderPrd(raw: string) {
    const sections = parsePrd(raw);

    return (
      <div style={prdContainer}>
        <div style={prdHeader}>
          <span style={prdTitle}>PRD</span>
        </div>
        <div style={prdBody}>
          {sections.map((section, i) => (
            <div key={i} style={prdSection}>
              <div style={prdSectionTitle}>{section.title}</div>
              {section.isCode ? (
                <pre style={prdCode}>{section.content}</pre>
              ) : (
                <div style={prdText}>
                  {section.content.split("\n").map((line, j) => (
                    <div key={j}>
                      {line.startsWith("- ") ? (
                        <span>
                          <span style={{ color: "var(--accent)" }}>▸ </span>
                          {line.slice(2)}
                        </span>
                      ) : line.startsWith("### ") ? (
                        <span style={{
                          color: "var(--text-bright)",
                          display: "block",
                          marginTop: "8px",
                        }}>
                          {line.replace(/^### /, "")}
                        </span>
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const reviewAgent = reviewTaskId
    ? getAgentForTask(reviewTaskId)
    : undefined;
  const reviewTask = reviewTaskId
    ? tasks.find((t) => t.id === reviewTaskId)
    : undefined;

  return (
    <>
      {reviewTaskId && reviewAgent && reviewTask && (
        <AgentReview
          taskId={reviewTaskId}
          agentId={reviewAgent.id}
          projectId={reviewTask.projectId}
          taskTitle={reviewTask.title}
          onClose={() => setReviewTaskId(null)}
        />
      )}

      <div style={filterRow}>
        <button
          style={filter === "all" ? filterActive : filterBtn}
          onClick={() => setFilter("all")}
        >
          All ({tasks.length})
        </button>
        {projectIds.map((pid) => (
          <button
            key={pid}
            style={filter === pid ? filterActive : filterBtn}
            onClick={() => setFilter(pid)}
          >
            {projectMap[pid] ?? pid} (
            {tasks.filter((t) => t.projectId === pid).length})
          </button>
        ))}
      </div>

      {inProgress.length > 0 && (
        <Panel
          title={`⚔ In Progress (${inProgress.length})`}
          style={{ marginBottom: "16px" }}
        >
          {inProgress.map(renderTask)}
        </Panel>
      )}

      {pending.length > 0 && (
        <Panel
          title={`○ Pending (${pending.length})`}
          style={{ marginBottom: "16px" }}
        >
          {pending.map(renderTask)}
        </Panel>
      )}

      {done.length > 0 && (
        <Panel title={`● Completed (${done.length})`}>
          {done.map(renderTask)}
        </Panel>
      )}
    </>
  );
}

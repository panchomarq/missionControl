"use client";

import { useState, type CSSProperties } from "react";
import type { Task, AgentSession } from "@/lib/data";
import { startTask } from "@/app/actions";
import { useRouter } from "next/navigation";
import { QwenCommand } from "@/components/QwenCommand";
import { AgentReview } from "@/components/AgentReview";

const statusColors: Record<Task["status"], string> = {
  pending: "var(--text-dim)",
  "in-progress": "var(--health-yellow)",
  review: "var(--agent-qwen)",
  "ask-human": "var(--accent)",
  done: "var(--health-green)",
};

const statusIcons: Record<Task["status"], string> = {
  pending: "○",
  "in-progress": "◐",
  review: "◉",
  "ask-human": "✋",
  done: "●",
};

const statusLabels: Record<Task["status"], string> = {
  pending: "PENDING",
  "in-progress": "WORKING",
  review: "REVIEW",
  "ask-human": "ASK HUMAN",
  done: "DONE",
};

const priorityColors: Record<Task["priority"], string> = {
  high: "var(--health-red)",
  medium: "var(--health-yellow)",
  low: "var(--text-dim)",
};

const emptyStyle: CSSProperties = {
  fontSize: "9px",
  color: "var(--text-dim)",
  textAlign: "center",
  padding: "20px",
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 0",
  borderBottom: "1px solid var(--border)",
  fontSize: "9px",
};

const titleStyle: CSSProperties = {
  flex: 1,
  color: "var(--text)",
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

const statusTagStyle: CSSProperties = {
  fontSize: "6px",
  padding: "2px 6px",
  letterSpacing: "1px",
  borderWidth: "1px",
  borderStyle: "solid",
};

const prdStyle: CSSProperties = {
  background: "var(--bg-dark)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--accent)",
  borderLeftWidth: "3px",
  padding: "12px",
  margin: "6px 0 6px 24px",
  maxHeight: "300px",
  overflow: "auto",
};

const prdTextStyle: CSSProperties = {
  fontSize: "7px",
  color: "var(--text)",
  lineHeight: "2.2",
  whiteSpace: "pre-wrap",
  fontFamily: "'Press Start 2P', monospace",
  margin: 0,
};

const sectionTitle: CSSProperties = {
  fontSize: "8px",
  color: "var(--text-dim)",
  textTransform: "uppercase",
  letterSpacing: "2px",
  marginTop: "12px",
  marginBottom: "4px",
};

interface TaskListProps {
  tasks: Task[];
  agents: AgentSession[];
  projectPath?: string;
  prds?: Record<string, string>;
}

export function TaskList({
  tasks,
  agents,
  projectPath,
  prds = {},
}: TaskListProps) {
  const router = useRouter();
  const [expandedPrd, setExpandedPrd] = useState<string | null>(null);
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <div style={emptyStyle}>No quests yet. Add one above.</div>;
  }

  const pending = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in-progress");
  const review = tasks.filter((t) => t.status === "review");
  const done = tasks.filter((t) => t.status === "done");

  function getAgentForTask(taskId: string): AgentSession | undefined {
    return agents
      .filter((a) => a.taskId === taskId)
      .sort((a, b) =>
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
    const prd = prds[task.id];
    const showPrd = expandedPrd === task.id;
    const color = statusColors[task.status];
    const agent = getAgentForTask(task.id);
    const hasReviewableOutput = agent?.status === "completed";

    return (
      <div key={task.id}>
        <div style={rowStyle}>
          <span style={{ color, fontSize: "12px", minWidth: "14px" }}>
            {statusIcons[task.status]}
          </span>
          <span style={{
            ...titleStyle,
            textDecoration: task.status === "done" ? "line-through" : "none",
            opacity: task.status === "done" ? 0.5 : 1,
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
            ...statusTagStyle,
            color,
            borderColor: color,
            animation: task.status === "in-progress"
              ? "pulse 1.5s infinite"
              : "none",
          }}>
            {statusLabels[task.status]}
          </span>
          {prd && (
            <button
              style={{
                ...btnStyle,
                color: showPrd ? "var(--accent)" : "var(--text-dim)",
              }}
              onClick={() => setExpandedPrd(showPrd ? null : task.id)}
            >
              📋 PRD
            </button>
          )}
          {hasReviewableOutput && (
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
        {showPrd && (
          <div style={prdStyle}>
            <pre style={prdTextStyle}>{prd}</pre>
          </div>
        )}
        {projectPath && task.status !== "done" && (
          <QwenCommand task={task} projectPath={projectPath} />
        )}
      </div>
    );
  }

  const reviewAgent = reviewTaskId ? getAgentForTask(reviewTaskId) : undefined;
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

      {inProgress.length > 0 && (
        <>
          <div style={sectionTitle}>⚔ In Progress</div>
          {inProgress.map(renderTask)}
        </>
      )}
      {pending.length > 0 && (
        <>
          <div style={sectionTitle}>○ Pending</div>
          {pending.map(renderTask)}
        </>
      )}
      {review.length > 0 && (
        <>
          <div style={sectionTitle}>◉ Review</div>
          {review.map(renderTask)}
        </>
      )}
      {done.length > 0 && (
        <>
          <div style={sectionTitle}>● Completed</div>
          {done.map(renderTask)}
        </>
      )}
    </>
  );
}

"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Task, AgentSession } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { startTask, approveProposal } from "@/app/actions";
import { AgentReview } from "@/components/AgentReview";

const priorityColors: Record<Task["priority"], string> = {
  high: "var(--health-red)",
  medium: "var(--health-yellow)",
  low: "var(--text-dim)",
};

const COLUMNS: Array<{
  status: Task["status"];
  label: string;
  bullet: string;
  color: string;
  pulse: boolean;
}> = [
  {
    status: "pending",
    label: "PENDING",
    bullet: "○",
    color: "var(--text-dim)",
    pulse: false,
  },
  {
    status: "ask-human",
    label: "ASK HUMAN",
    bullet: "✋",
    color: "var(--accent)",
    pulse: false,
  },
  {
    status: "approved",
    label: "APPROVED",
    bullet: "◇",
    color: "var(--agent-claude)",
    pulse: false,
  },
  {
    status: "in-progress",
    label: "WORKING",
    bullet: "◐",
    color: "var(--health-yellow)",
    pulse: true,
  },
  {
    status: "review",
    label: "REVIEW",
    bullet: "◉",
    color: "var(--agent-qwen)",
    pulse: false,
  },
  {
    status: "done",
    label: "DONE",
    bullet: "●",
    color: "var(--health-green)",
    pulse: false,
  },
];

// Exception states fold into their nearest flow column so no task disappears:
// dispatched-but-stuck tasks sit under WORKING, terminal rejected under DONE.
const COLUMN_FOR: Partial<Record<Task["status"], Task["status"]>> = {
  "waiting-tokens": "in-progress",
  failed: "in-progress",
  rejected: "done",
};

function columnFor(status: Task["status"]): Task["status"] {
  return COLUMN_FOR[status] ?? status;
}

const STATUS_TAGS: Partial<
  Record<Task["status"], { label: string; color: string }>
> = {
  approved: { label: "QUEUED", color: "var(--agent-claude)" },
  "waiting-tokens": { label: "WAITING TOKENS", color: "var(--health-yellow)" },
  failed: { label: "FAILED", color: "var(--health-red)" },
  rejected: { label: "REJECTED", color: "var(--text-dim)" },
};

/** Surface exception-state context (attempts, error) that the column alone can't convey. */
function renderStatusTag(task: Task) {
  const tag = STATUS_TAGS[task.status];
  if (!tag) return null;

  const attemptSuffix =
    task.status === "waiting-tokens" && task.attempts
      ? ` ×${task.attempts}`
      : "";

  return (
    <div style={{ marginBottom: 6 }}>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-micro)",
          color: tag.color,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: tag.color,
          padding: "1px 4px",
          letterSpacing: 1,
        }}
      >
        {tag.label}
        {attemptSuffix}
      </span>
      {task.status === "failed" && task.error && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--text-dim)",
            marginTop: 4,
            lineHeight: "var(--lh-tight)",
          }}
        >
          {task.error}
        </div>
      )}
    </div>
  );
}

const boardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 16,
  alignItems: "flex-start",
};

const columnStyle: CSSProperties = {
  background: "var(--bg-panel)",
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: "var(--border)",
  padding: 12,
  minHeight: 300,
  maxHeight: "calc(100vh - 240px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const columnHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "1px solid var(--border)",
};

const countBadge: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-tiny)",
  padding: "2px 6px",
  borderWidth: 1,
  borderStyle: "solid",
};

const cardStyle: CSSProperties = {
  background: "var(--bg-dark)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--border)",
  padding: 12,
  marginBottom: 8,
  position: "relative",
  overflow: "hidden",
};

const cardTitleStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--ft-base)",
  color: "var(--text)",
  lineHeight: "var(--lh-tight)",
  marginBottom: 8,
};

const cardFooter: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  marginTop: 4,
};

const btnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "none",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--border)",
  color: "var(--text-dim)",
  padding: "3px 8px",
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-tiny)",
  cursor: "pointer",
  letterSpacing: 1,
};

const filterRow: CSSProperties = {
  display: "flex",
  gap: 6,
  marginBottom: 16,
  flexWrap: "wrap",
};

const filterBtn: CSSProperties = {
  background: "none",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--border)",
  color: "var(--text-dim)",
  padding: "4px 10px",
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-tiny)",
  cursor: "pointer",
  letterSpacing: 1,
};

const prdContainer: CSSProperties = {
  background: "var(--bg-panel)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--accent)",
  borderLeftWidth: 3,
  padding: 10,
  marginTop: 8,
  maxHeight: 200,
  overflow: "auto",
};

const prdText: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--ft-sm)",
  color: "var(--text)",
  lineHeight: "var(--lh-body)",
  whiteSpace: "pre-wrap",
  margin: 0,
};

interface TaskBoardProps {
  tasks: Task[];
  agents: AgentSession[];
  prds: Record<string, string>;
  projectMap: Record<string, string>;
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

  function getAgentForTask(taskId: string): AgentSession | undefined {
    return agents
      .filter((a) => a.taskId === taskId)
      .toSorted(
        (a, b) =>
          new Date(b.startedAt).getTime() -
          new Date(a.startedAt).getTime(),
      )[0];
  }

  async function handleApproveProposal(task: Task, critical: boolean) {
    const formData = new FormData();
    formData.set("taskId", task.id);
    if (critical) formData.set("critical", "true");
    await approveProposal(formData);
    router.refresh();
  }

  async function handleStart(task: Task) {
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("projectId", task.projectId);
    await startTask(formData);
    router.refresh();
  }

  function renderCard(task: Task) {
    const prd = prds[task.id];
    const showPrd = expandedPrd === task.id;
    const agent = getAgentForTask(task.id);
    const hasReview = agent?.status === "completed";
    const isDone = task.status === "done";

    return (
      <div
        key={task.id}
        style={{
          ...cardStyle,
          opacity: isDone ? 0.6 : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 6,
          }}
        >
          <Link
            href={`/project/${task.projectId}`}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-tiny)",
              color: "var(--accent)",
              letterSpacing: 1,
              textDecoration: "none",
            }}
          >
            {projectMap[task.projectId] ?? task.projectId}
          </Link>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-micro)",
              color: priorityColors[task.priority],
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: priorityColors[task.priority],
              padding: "1px 4px",
              letterSpacing: 1,
            }}
          >
            {task.priority.toUpperCase()}
          </span>
        </div>

        {(task.retries ?? 0) > 0 && (
          <div style={{ marginBottom: 6 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-micro)",
                color: "var(--health-red)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "var(--health-red)",
                padding: "1px 4px",
                letterSpacing: 1,
              }}
            >
              RETRY {task.retries}
            </span>
            {task.retryHistory && task.retryHistory.length > 0 && (
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginTop: 4,
                  lineHeight: "var(--lh-tight)",
                }}
              >
                {task.retryHistory[task.retryHistory.length - 1].reason}
              </div>
            )}
          </div>
        )}

        {renderStatusTag(task)}

        <div
          style={{
            ...cardTitleStyle,
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {task.title}
        </div>

        <div style={cardFooter}>
          {prd && (
            <button
              style={{
                ...btnStyle,
                color: showPrd ? "var(--accent)" : "var(--text-dim)",
                borderColor: showPrd ? "var(--accent)" : "var(--border)",
              }}
              onClick={() =>
                setExpandedPrd(showPrd ? null : task.id)
              }
            >
              <Icon name="clipboard" size={9} /> PRD
            </button>
          )}
          {hasReview && (
            <button
              style={{
                ...btnStyle,
                borderColor: "var(--agent-qwen)",
                color: "var(--agent-qwen)",
              }}
              onClick={() => setReviewTaskId(task.id)}
            >
              <Icon name="search" size={9} /> REVIEW
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
              <Icon name="play" size={9} /> START
            </button>
          )}
          {task.status === "ask-human" && (
            <>
              <button
                style={{
                  ...btnStyle,
                  borderColor: "var(--health-green)",
                  color: "var(--health-green)",
                }}
                onClick={() => handleApproveProposal(task, false)}
              >
                <Icon name="check" size={9} /> APPROVE
              </button>
              <button
                style={{
                  ...btnStyle,
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                }}
                title="Approve as critical — routes Tier 2 to Opus"
                onClick={() => handleApproveProposal(task, true)}
              >
                <Icon name="alert" size={9} /> CRIT
              </button>
            </>
          )}
        </div>

        {showPrd && prd && (
          <div style={prdContainer}>
            <pre style={prdText}>{prd}</pre>
          </div>
        )}
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
          style={
            filter === "all"
              ? { ...filterBtn, borderColor: "var(--accent)", color: "var(--accent)" }
              : filterBtn
          }
          onClick={() => setFilter("all")}
        >
          ALL ({tasks.length})
        </button>
        {projectIds.map((pid) => (
          <button
            key={pid}
            style={
              filter === pid
                ? { ...filterBtn, borderColor: "var(--accent)", color: "var(--accent)" }
                : filterBtn
            }
            onClick={() => setFilter(pid)}
          >
            {(projectMap[pid] ?? pid).toUpperCase()} (
            {tasks.filter((t) => t.projectId === pid).length})
          </button>
        ))}
      </div>

      <div style={boardStyle}>
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter(
            (t) => columnFor(t.status) === col.status,
          );
          return (
            <div key={col.status} style={columnStyle}>
              <div style={columnHeaderStyle}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-xs)",
                    color: col.color,
                    letterSpacing: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    animation: col.pulse && colTasks.length > 0
                      ? "pulse 1.5s infinite"
                      : "none",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14 }}>
                    {col.bullet}
                  </span>
                  {col.label}
                </span>
                <span
                  style={{
                    ...countBadge,
                    color: col.color,
                    borderColor: col.color,
                  }}
                >
                  {colTasks.length}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {colTasks.length === 0 && (
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--ft-sm)",
                      color: "var(--text-dim)",
                      textAlign: "center",
                      padding: 20,
                      opacity: 0.5,
                    }}
                  >
                    No tasks
                  </div>
                )}
                {colTasks.map(renderCard)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { rejectAgent, applyAgentFiles } from "@/app/actions";

interface ParsedFile {
  path: string;
  content: string;
}

interface AgentOutput {
  response: string;
  prompt: string | null;
  files: ParsedFile[];
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  zIndex: 100,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "40px 24px",
  overflow: "auto",
};

const modalStyle: CSSProperties = {
  background: "var(--bg-panel)",
  border: "2px solid var(--accent)",
  maxWidth: "900px",
  width: "100%",
  maxHeight: "85vh",
  overflow: "auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px",
  borderBottom: "2px solid var(--border)",
  position: "sticky",
  top: 0,
  background: "var(--bg-panel)",
  zIndex: 1,
};

const titleStyle: CSSProperties = {
  fontSize: "10px",
  color: "var(--accent)",
  letterSpacing: "2px",
};

const btnRow: CSSProperties = {
  display: "flex",
  gap: "8px",
};

const btnBase: CSSProperties = {
  background: "none",
  border: "1px solid",
  padding: "6px 14px",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "7px",
  cursor: "pointer",
  letterSpacing: "1px",
};

const fileHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 16px",
  background: "var(--bg-dark)",
  borderBottom: "1px solid var(--border)",
  borderTop: "2px solid var(--border)",
};

const filePathStyle: CSSProperties = {
  fontSize: "8px",
  color: "#22d3ee",
  letterSpacing: "1px",
};

const codeStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: "7px",
  color: "var(--text)",
  lineHeight: "2.4",
  whiteSpace: "pre-wrap",
  fontFamily: "'Press Start 2P', monospace",
  margin: 0,
  background: "var(--bg-dark)",
  overflow: "auto",
};

const rawStyle: CSSProperties = {
  padding: "16px",
  fontSize: "7px",
  color: "var(--text-dim)",
  lineHeight: "2.2",
  whiteSpace: "pre-wrap",
  fontFamily: "'Press Start 2P', monospace",
};

const tabsStyle: CSSProperties = {
  display: "flex",
  borderBottom: "1px solid var(--border)",
};

const tabStyle: CSSProperties = {
  padding: "10px 16px",
  fontSize: "7px",
  color: "var(--text-dim)",
  background: "none",
  border: "none",
  borderBottom: "2px solid transparent",
  fontFamily: "'Press Start 2P', monospace",
  cursor: "pointer",
  letterSpacing: "1px",
};

interface AgentReviewProps {
  taskId: string;
  agentId: string;
  projectId: string;
  taskTitle: string;
  onClose: () => void;
}

export function AgentReview({
  taskId,
  agentId,
  projectId,
  taskTitle,
  onClose,
}: AgentReviewProps) {
  const router = useRouter();
  const [output, setOutput] = useState<AgentOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"files" | "raw">("files");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/output?taskId=${taskId}`)
      .then((r) => r.json())
      .then((data) => {
        setOutput(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId]);

  async function handleApply() {
    if (!output?.files.length) return;
    setApplying(true);
    const formData = new FormData();
    formData.set("taskId", taskId);
    formData.set("projectId", projectId);
    formData.set("files", JSON.stringify(output.files));
    await applyAgentFiles(formData);
    setApplying(false);
    router.refresh();
    onClose();
  }

  async function handleReject() {
    const formData = new FormData();
    formData.set("agentId", agentId);
    await rejectAgent(formData);
    router.refresh();
    onClose();
  }

  if (loading) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={{ ...modalStyle, padding: "40px", textAlign: "center" }}>
          <span style={{ fontSize: "9px", color: "var(--accent)", animation: "pulse 1.5s infinite" }}>
            Loading agent output...
          </span>
        </div>
      </div>
    );
  }

  if (!output || output.response === undefined) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={{ ...modalStyle, padding: "40px", textAlign: "center" }}>
          <span style={{ fontSize: "9px", color: "var(--health-red)" }}>
            No output found for this agent.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>AGENT REVIEW</div>
            <div style={{ fontSize: "7px", color: "var(--text-dim)", marginTop: "4px" }}>
              {taskTitle}
            </div>
          </div>
          <div style={btnRow}>
            {output.files.length > 0 && (
              <button
                style={{
                  ...btnBase,
                  borderColor: "var(--health-green)",
                  color: "var(--health-green)",
                  animation: applying ? "pulse 1s infinite" : "none",
                }}
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? "Applying..." : `Apply ${output.files.length} files`}
              </button>
            )}
            <button
              style={{
                ...btnBase,
                borderColor: "var(--health-red)",
                color: "var(--health-red)",
              }}
              onClick={handleReject}
            >
              Reject
            </button>
            <button
              style={{
                ...btnBase,
                borderColor: "var(--text-dim)",
                color: "var(--text-dim)",
              }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div style={tabsStyle}>
          <button
            style={{
              ...tabStyle,
              color: tab === "files" ? "var(--accent)" : "var(--text-dim)",
              borderBottomColor: tab === "files" ? "var(--accent)" : "transparent",
            }}
            onClick={() => setTab("files")}
          >
            Files ({output.files.length})
          </button>
          <button
            style={{
              ...tabStyle,
              color: tab === "raw" ? "var(--accent)" : "var(--text-dim)",
              borderBottomColor: tab === "raw" ? "var(--accent)" : "transparent",
            }}
            onClick={() => setTab("raw")}
          >
            Raw Output
          </button>
        </div>

        {tab === "files" && (
          <div>
            {output.files.length === 0 ? (
              <div style={rawStyle}>
                No file blocks detected. Check raw output.
              </div>
            ) : (
              output.files.map((file, i) => (
                <div key={i}>
                  <div style={fileHeaderStyle}>
                    <span style={filePathStyle}>{file.path}</span>
                  </div>
                  <pre style={codeStyle}>{file.content}</pre>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "raw" && (
          <pre style={rawStyle}>{output.response}</pre>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/data";
import { spawnAgent } from "@/app/actions";

const containerStyle: CSSProperties = {
  marginTop: "8px",
  background: "var(--bg-dark)",
  border: "1px solid var(--border)",
  padding: "10px",
  fontSize: "8px",
  fontFamily: "'Press Start 2P', monospace",
};

const commandText: CSSProperties = {
  color: "var(--health-green)",
  wordBreak: "break-all",
  lineHeight: "2",
  whiteSpace: "pre-wrap",
};

const btnRow: CSSProperties = {
  display: "flex",
  gap: "8px",
  marginTop: "8px",
};

const btnStyle: CSSProperties = {
  background: "none",
  border: "1px solid var(--accent)",
  color: "var(--accent)",
  padding: "4px 10px",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "7px",
  cursor: "pointer",
  letterSpacing: "1px",
};

const copiedStyle: CSSProperties = {
  ...btnStyle,
  borderColor: "var(--health-green)",
  color: "var(--health-green)",
};

const deployBtnStyle: CSSProperties = {
  ...btnStyle,
  borderColor: "#22d3ee",
  color: "#22d3ee",
};

const deployedStyle: CSSProperties = {
  ...btnStyle,
  borderColor: "var(--health-green)",
  color: "var(--health-green)",
  animation: "pulse 1.5s infinite",
};

interface QwenCommandProps {
  task: Task;
  projectPath: string;
}

function generateCommand(task: Task, projectPath: string): string {
  return [
    `cd ${projectPath}`,
    `# Task: ${task.title}`,
    `# Priority: ${task.priority}`,
    `# Status: ${task.status} → in-progress`,
    ``,
    `# Execute this task and update the status when done:`,
    `# bash ~/Documents/projects/missionControl/toolbox/update-task-status.sh ${task.id} done`,
  ].join("\n");
}

export function QwenCommand({ task, projectPath }: QwenCommandProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const command = generateCommand(task, projectPath);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeploy() {
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("projectId", task.projectId);
    formData.set("agentType", "qwen");
    formData.set("command", command);
    await spawnAgent(formData);
    setDeployed(true);
    router.refresh();
  }

  if (!visible) {
    return (
      <button
        style={{
          ...btnStyle,
          fontSize: "6px",
          padding: "2px 6px",
        }}
        onClick={() => setVisible(true)}
      >
        ⚡ Qwen
      </button>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={commandText}>{command}</div>
      <div style={btnRow}>
        <button
          style={copied ? copiedStyle : btnStyle}
          onClick={handleCopy}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <button
          style={deployed ? deployedStyle : deployBtnStyle}
          onClick={handleDeploy}
          disabled={deployed}
        >
          {deployed ? "✓ Deployed" : "Deploy Agent"}
        </button>
        <button style={btnStyle} onClick={() => setVisible(false)}>
          Close
        </button>
      </div>
    </div>
  );
}

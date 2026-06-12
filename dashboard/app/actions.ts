"use server";

import { readFile, writeFile, rename } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { existsSync, mkdirSync } from "node:fs";
import type { Task, AgentSession } from "@/lib/data";

const execFileAsync = promisify(execFile);

const TASKS_PATH = join(process.cwd(), "..", "data", "tasks.json");

/**
 * Write JSON atomically: stage to a temp file, then rename over the target.
 * rename(2) is atomic on the same filesystem, so a concurrent reader (or a
 * crash mid-write) never observes a truncated or half-written file. Shared by
 * every writer of the data lake to soften the dashboard/cron write race.
 */
async function writeJsonAtomic(path: string, data: unknown): Promise<void> {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
  await rename(tmp, path);
}

async function readTasks(): Promise<Task[]> {
  const raw = await readFile(TASKS_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeTasks(tasks: Task[]): Promise<void> {
  await writeJsonAtomic(TASKS_PATH, tasks);
}

export async function addTask(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;
  const priority = (formData.get("priority") as string) || "medium";

  if (!projectId || !title) return;

  const tasks = await readTasks();
  const id = `task-${String(tasks.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();

  tasks.push({
    id,
    projectId,
    title,
    status: "pending",
    priority: priority as Task["priority"],
    source: "manual",
    tier: 1,
    createdAt: now,
    updatedAt: now,
  });

  await writeTasks(tasks);
}

export async function updateTaskStatus(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const newStatus = formData.get("status") as Task["status"];

  if (!taskId || !newStatus) return;

  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === taskId);

  if (!task) return;

  task.status = newStatus;
  task.updatedAt = new Date().toISOString();

  await writeTasks(tasks);
}

export async function rescanProjects() {
  const scriptPath = join(process.cwd(), "..", "toolbox", "scan-projects.sh");
  await execFileAsync("bash", [scriptPath]);
}

const AGENTS_PATH = join(process.cwd(), "..", "data", "agents.json");

async function readAgents(): Promise<AgentSession[]> {
  const raw = await readFile(AGENTS_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeAgents(agents: AgentSession[]): Promise<void> {
  await writeJsonAtomic(AGENTS_PATH, agents);
}

export async function spawnAgent(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const projectId = formData.get("projectId") as string;
  const agentType = (formData.get("agentType") as string) || "qwen";
  const command = formData.get("command") as string;

  if (!taskId || !projectId || !command) return;

  const agents = await readAgents();
  const now = new Date().toISOString();
  const id = `agent-${Date.now()}`;

  agents.push({
    id,
    taskId,
    projectId,
    agentType: agentType as AgentSession["agentType"],
    status: "spawning",
    command,
    startedAt: now,
    completedAt: null,
  });

  await writeAgents(agents);

  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (task && task.status === "pending") {
    task.status = "in-progress";
    task.updatedAt = now;
    await writeTasks(tasks);
  }

  return id;
}

const PRDS_DIR = join(process.cwd(), "..", "data", "prds");

export async function startTask(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const projectId = formData.get("projectId") as string;

  if (!taskId || !projectId) return;

  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const now = new Date().toISOString();
  task.status = "in-progress";
  task.updatedAt = now;
  await writeTasks(tasks);

  const prdPath = join(PRDS_DIR, `${taskId}.md`);
  if (!existsSync(prdPath)) {
    const prdContent = [
      `# PRD: ${task.title}`,
      "",
      "## Task ID",
      taskId,
      "",
      "## Objetivo",
      task.title,
      "",
      "## Contexto",
      `Proyecto: ${projectId}`,
      `Prioridad: ${task.priority}`,
      "",
      "## Archivos a modificar",
      "<!-- Lista los archivos con path relativo al proyecto -->",
      "<!-- El agente leerá estos archivos como referencia -->",
      "- `archivo/que/modificar.tsx`",
      "",
      "## Instrucciones",
      "<!-- Instrucciones paso a paso de qué cambiar -->",
      "1. TODO",
      "",
      "## Criterio de éxito",
      "- [ ] Definir criterios concretos",
    ].join("\n");
    await writeFile(prdPath, prdContent + "\n");
  }

  const agents = await readAgents();
  const agentId = `agent-${Date.now()}`;
  agents.push({
    id: agentId,
    taskId,
    projectId,
    agentType: "qwen",
    status: "spawning",
    command: `bash toolbox/run-agent.sh ${taskId}`,
    startedAt: now,
    completedAt: null,
  });
  await writeAgents(agents);

  const scriptPath = join(process.cwd(), "..", "toolbox", "run-agent.sh");
  execFileAsync("bash", [scriptPath, taskId]).catch(() => {});

  return agentId;
}

export async function updateAgentStatus(formData: FormData) {
  const agentId = formData.get("agentId") as string;
  const status = formData.get("status") as AgentSession["status"];

  if (!agentId || !status) return;

  const agents = await readAgents();
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return;

  agent.status = status;
  if (status === "completed" || status === "failed") {
    agent.completedAt = new Date().toISOString();
  }

  await writeAgents(agents);

  if (status === "completed") {
    const tasks = await readTasks();
    const task = tasks.find((t) => t.id === agent.taskId);
    if (task) {
      task.status = "review";
      task.updatedAt = new Date().toISOString();
      await writeTasks(tasks);
    }
  }
}

export async function rejectAgent(formData: FormData) {
  const agentId = formData.get("agentId") as string;
  const reason = formData.get("reason") as string;
  if (!agentId) return;

  const agents = await readAgents();
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return;

  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === agent.taskId);
  if (task) {
    task.status = "pending";
    task.retries = (task.retries ?? 0) + 1;
    if (!task.retryHistory) task.retryHistory = [];
    task.retryHistory.push({
      attempt: task.retries,
      rejectedAt: new Date().toISOString(),
      reason: reason || "Review rejected",
      rejectedBy: (formData.get("rejectedBy") as string) || "opus",
    });
    task.updatedAt = new Date().toISOString();
    await writeTasks(tasks);
  }

  agent.status = "failed";
  agent.completedAt = new Date().toISOString();
  await writeAgents(agents);
}

/**
 * Approve a proposal in the ask-human column, queuing it for the runner.
 * ask-human → approved. The optional critical flag routes Tier 2 execution to
 * Opus instead of the Sonnet default. This is the only path from a proposal to
 * execution — there is no auto-approval.
 */
export async function approveProposal(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  if (!taskId) return;

  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.status !== "ask-human") return;

  task.status = "approved";
  if (formData.get("critical") === "true") task.critical = true;
  task.updatedAt = new Date().toISOString();
  await writeTasks(tasks);
}

/**
 * Approve completed agent work after review. review → done.
 */
export async function approveTask(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  if (!taskId) return;

  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.status = "done";
  task.updatedAt = new Date().toISOString();
  await writeTasks(tasks);
}

export async function applyAgentFiles(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const filesJson = formData.get("files") as string;
  const projectId = formData.get("projectId") as string;

  if (!taskId || !filesJson || !projectId) return;

  const files: Array<{ path: string; content: string }> = JSON.parse(filesJson);
  const projectDir = join(
    process.env.HOME ?? "/home/francisco",
    "Documents/projects",
    projectId,
  );

  for (const file of files) {
    const fullPath = join(projectDir, file.path);
    const dir = join(fullPath, "..");
    mkdirSync(dir, { recursive: true });
    await writeFile(fullPath, file.content + "\n");
  }

  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = "done";
    task.updatedAt = new Date().toISOString();
    await writeTasks(tasks);
  }
}

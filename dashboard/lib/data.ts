import { readFile } from "node:fs/promises";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "..", "data");

export interface GitInfo {
  branch: string;
  hasUnpushed: boolean;
  dirtyFiles: number;
  lastCommit: string;
  lastCommitMessage: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  path: string;
  description: string;
  stack: string[];
  status: "active" | "paused" | "archived";
  priority: "high" | "medium" | "low";
  git: GitInfo;
  health: "green" | "yellow" | "red";
  lastScanned: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: "pending" | "in-progress" | "done";
  priority: "high" | "medium" | "low";
  source: "manual" | "roadmap" | "scan";
  createdAt: string;
  updatedAt: string;
}

export async function getProjects(): Promise<Project[]> {
  const raw = await readFile(join(DATA_DIR, "projects.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug);
}

export async function getTasks(): Promise<Task[]> {
  const raw = await readFile(join(DATA_DIR, "tasks.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const tasks = await getTasks();
  return tasks.filter((t) => t.projectId === projectId);
}

export interface AgentSession {
  id: string;
  taskId: string;
  projectId: string;
  agentType: "qwen" | "opus" | "claude";
  status: "spawning" | "active" | "completed" | "failed";
  command: string;
  startedAt: string;
  completedAt: string | null;
}

export async function getAgents(): Promise<AgentSession[]> {
  const raw = await readFile(join(DATA_DIR, "agents.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getActiveAgents(): Promise<AgentSession[]> {
  const agents = await getAgents();
  return agents.filter(
    (a) => a.status === "spawning" || a.status === "active",
  );
}

export async function getTaskPrd(taskId: string): Promise<string | null> {
  const prdPath = join(DATA_DIR, "prds", `${taskId}.md`);
  try {
    return await readFile(prdPath, "utf-8");
  } catch {
    return null;
  }
}

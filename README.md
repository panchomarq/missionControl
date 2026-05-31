# Mission Control

Personal OS dashboard with Terminal RPG aesthetics. Monitors all projects in `~/Documents/projects/`, tracks tasks, and delegates work to AI agents (Qwen 2.5 Coder via Ollama).

## Architecture

```
missionControl/
├── dashboard/          # Next.js app (App Router, pixel art CSS)
│   ├── app/            # Pages and server actions
│   ├── components/     # UI components (ProjectCard, TaskList, AgentPanel, etc.)
│   └── lib/            # Data layer (reads JSON files)
├── data/               # JSON Data Lake
│   ├── projects.json   # All monitored projects
│   ├── tasks.json      # Tasks per project (pending/in-progress/done)
│   ├── agents.json     # Agent session history
│   ├── prds/           # PRD files per task (instructions for agents)
│   └── scans/          # Per-project scan results
└── toolbox/            # Executable scripts
    ├── scan-projects.sh      # Scans ~/Documents/projects/ for git/stack info
    ├── sync-obsidian.sh      # Reads roadmaps from Obsidian Vault
    ├── run-agent.sh          # Sends tasks to Qwen via Ollama API
    └── update-task-status.sh # CLI tool to update task status
```

## Prerequisites

- Node.js 22+
- pnpm
- Ollama with `qwen2.5-coder:14b` model (for agent execution)
- Projects in `~/Documents/projects/` with optional `CLAUDE.md` / `ROADMAP.md`

## Setup

```bash
# Install dashboard dependencies
cd dashboard
pnpm install

# Scan projects to populate data
cd ..
bash toolbox/scan-projects.sh

# Sync Obsidian roadmaps (optional, requires Obsidian Vault)
bash toolbox/sync-obsidian.sh
```

## Running

```bash
cd dashboard
pnpm dev
# Open http://localhost:3000
```

## Usage

### Dashboard

- **World Map** — Overview of all projects with health indicators (green/yellow/red)
- **Project Detail** — Click a project to see git status, tasks, and PRDs
- **Quests** — Task management with status transitions (pending → in-progress → done)

### Agent Workflow

1. Write a PRD in `data/prds/{task-id}.md` with detailed instructions
2. Click **▸ Start** on a task — spawns an agent, sends PRD to Qwen via Ollama
3. Agent status appears in the sidebar (spawning → active → completed)
4. Agent output saved to `data/agent-output/{task-id}-response.txt`

### Toolbox Scripts

```bash
# Scan all projects (updates data/projects.json)
bash toolbox/scan-projects.sh

# Sync Obsidian roadmaps
bash toolbox/sync-obsidian.sh

# Update task status from CLI
bash toolbox/update-task-status.sh <task-id> <pending|in-progress|done>

# Run agent manually
bash toolbox/run-agent.sh <task-id>
```

## Orchestration Model

- **Opus** — Strategy, architecture, PRDs, complex decisions
- **Qwen 2.5 Coder 14B** — Code execution, file updates, boilerplate (runs locally via Ollama)
- **Human** — Approval required for destructive actions, PRs, structural changes

## Stack

- Next.js 16 (App Router, Turbopack)
- CSS custom (pixel art, Press Start 2P font, no UI frameworks)
- JSON flat files (no database)
- Bash scripts (toolbox)
- Ollama API (agent execution)

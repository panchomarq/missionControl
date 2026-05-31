import type { CSSProperties } from "react";
import type { ObsidianRoadmap } from "@/lib/data";
import { Panel } from "@/components/Panel";

const progressStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--ft-sm)",
  color: "var(--text-dim)",
  marginBottom: 8,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 0",
  fontFamily: "var(--font-body)",
  fontSize: "var(--ft-base)",
};

interface RoadmapPanelProps {
  roadmap: ObsidianRoadmap;
}

export function RoadmapPanel({ roadmap }: RoadmapPanelProps) {
  const done = roadmap.tasks.filter((t) => t.status === "done").length;

  return (
    <Panel title="Obsidian Roadmap" style={{ marginTop: 16 }}>
      <div style={progressStyle}>
        {done}/{roadmap.tasks.length} completed
      </div>
      {roadmap.tasks.map((task, i) => {
        const isDone = task.status === "done";
        return (
          <div key={i} style={rowStyle}>
            <span
              style={{
                color: isDone
                  ? "var(--health-green)"
                  : "var(--text-dim)",
              }}
            >
              {isDone ? "●" : "○"}
            </span>
            <span
              style={{
                color: isDone ? "var(--text-dim)" : "var(--text)",
                textDecoration: isDone ? "line-through" : "none",
                opacity: isDone ? 0.5 : 1,
              }}
            >
              {task.title}
            </span>
          </div>
        );
      })}
    </Panel>
  );
}

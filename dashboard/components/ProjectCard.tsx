"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Project } from "@/lib/data";
import { HealthIndicator } from "@/components/HealthIndicator";
import { StatusBadge } from "@/components/StatusBadge";

const cardStyle: CSSProperties = {
  background: "var(--bg-panel)",
  border: "2px solid var(--border)",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  transition: "border-color 0.1s, box-shadow 0.1s",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
};

const stackStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
};

const tagStyle: CSSProperties = {
  fontSize: "8px",
  color: "var(--text-dim)",
  border: "1px solid var(--border)",
  padding: "2px 4px",
  letterSpacing: "1px",
};

const nameStyle: CSSProperties = {
  fontSize: "14px",
  color: "var(--text-bright)",
  letterSpacing: "1px",
};

const descStyle: CSSProperties = {
  fontSize: "9px",
  color: "var(--text-dim)",
  lineHeight: "2.2",
  maxHeight: "44px",
  overflow: "hidden",
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "auto",
  paddingTop: "8px",
  borderTop: "1px solid var(--border)",
};

const gitStyle: CSSProperties = {
  fontSize: "8px",
  color: "var(--text-dim)",
  display: "flex",
  gap: "8px",
};

const spriteBar: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "2px",
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const hasGit = project.git && project.git.branch;

  return (
    <Link href={`/project/${project.slug}`} style={{ textDecoration: "none" }}>
      <div
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-highlight)";
          e.currentTarget.style.boxShadow = "0 0 12px rgba(91,141,217,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div
          style={{
            ...spriteBar,
            background: `var(--health-${project.health})`,
            boxShadow: `0 0 8px var(--health-${project.health})`,
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={nameStyle}>{project.name}</span>
          <StatusBadge status={project.status} />
        </div>

        <div style={descStyle}>{project.description}</div>

        <div style={stackStyle}>
          {project.stack.map((tech) => (
            <span key={tech} style={tagStyle}>{tech}</span>
          ))}
        </div>

        <div style={footerStyle}>
          <HealthIndicator health={project.health} />
          {hasGit && (
            <div style={gitStyle}>
              <span>⎇ {project.git.branch}</span>
              {project.git.dirtyFiles > 0 && (
                <span style={{ color: "var(--health-yellow)" }}>
                  ✎ {project.git.dirtyFiles}
                </span>
              )}
              {project.git.hasUnpushed && (
                <span style={{ color: "var(--health-yellow)" }}>↑ unpushed</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

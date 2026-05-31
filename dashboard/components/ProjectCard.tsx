"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Project } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { HealthIndicator } from "@/components/HealthIndicator";
import { StatusBadge } from "@/components/StatusBadge";

const cardStyle: CSSProperties = {
  background: "var(--bg-panel)",
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: "var(--border)",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 13,
  transition: "border-color .1s, box-shadow .1s",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
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
          e.currentTarget.style.boxShadow =
            "0 0 14px rgba(240, 168, 71, 0.22)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `var(--health-${project.health})`,
            boxShadow: `0 0 8px var(--health-${project.health})`,
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-xl)",
              color: "var(--text-bright)",
              letterSpacing: 1,
            }}
          >
            {project.name}
          </span>
          <StatusBadge status={project.status} />
        </div>

        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--ft-base)",
            color: "var(--text-dim)",
            lineHeight: "var(--lh-tight)",
            minHeight: 42,
          }}
        >
          {project.description}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {project.stack.map((tech) => (
            <span
              key={tech}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "var(--border)",
                padding: "3px 5px",
                letterSpacing: 1,
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <HealthIndicator health={project.health} />
          {hasGit && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                color: "var(--text-dim)",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon name="git-branch" size={13} />
                {project.git.branch}
              </span>
              {project.git.dirtyFiles > 0 && (
                <span
                  style={{
                    color: "var(--health-yellow)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Icon name="file" size={12} />
                  {project.git.dirtyFiles}
                </span>
              )}
              {project.git.hasUnpushed && (
                <span
                  style={{
                    color: "var(--health-yellow)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Icon name="arrow-up" size={12} />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
  className?: string;
}

const panelStyle: CSSProperties = {
  background: "var(--bg-panel)",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "var(--border)",
  padding: 18,
};

const titleStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  color: "var(--accent)",
  fontSize: "var(--fs-sm)",
  letterSpacing: 2,
  textTransform: "uppercase",
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "1px solid var(--border)",
};

export function Panel({ children, title, style, className }: PanelProps) {
  return (
    <div style={{ ...panelStyle, ...style }} className={className}>
      {title && <div style={titleStyle}>{title}</div>}
      {children}
    </div>
  );
}

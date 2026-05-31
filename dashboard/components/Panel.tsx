import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
  className?: string;
}

const panelStyle: CSSProperties = {
  background: "var(--bg-panel)",
  border: "2px solid var(--border)",
  padding: "16px",
};

const titleStyle: CSSProperties = {
  color: "var(--accent)",
  fontSize: "9px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  marginBottom: "12px",
  paddingBottom: "8px",
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

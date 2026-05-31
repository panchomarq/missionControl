"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import { addTask } from "@/app/actions";
import { useRouter } from "next/navigation";

const formStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "16px",
  paddingBottom: "16px",
  borderBottom: "1px solid var(--border)",
};

const inputStyle: CSSProperties = {
  flex: 1,
  background: "var(--bg-dark)",
  border: "1px solid var(--border)",
  color: "var(--text-bright)",
  padding: "8px 10px",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "9px",
  outline: "none",
};

const selectStyle: CSSProperties = {
  background: "var(--bg-dark)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  padding: "8px",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "8px",
  outline: "none",
  cursor: "pointer",
};

const buttonStyle: CSSProperties = {
  background: "var(--accent)",
  border: "none",
  color: "var(--bg-dark)",
  padding: "8px 14px",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: "9px",
  cursor: "pointer",
  letterSpacing: "1px",
};

interface AddTaskFormProps {
  projectId: string;
}

export function AddTaskForm({ projectId }: AddTaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    await addTask(formData);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} action={handleSubmit} style={formStyle}>
      <input type="hidden" name="projectId" value={projectId} />
      <input
        type="text"
        name="title"
        placeholder="New quest..."
        required
        style={inputStyle}
      />
      <select name="priority" defaultValue="medium" style={selectStyle}>
        <option value="low">Low</option>
        <option value="medium">Med</option>
        <option value="high">High</option>
      </select>
      <button type="submit" style={buttonStyle}>
        + Add
      </button>
    </form>
  );
}

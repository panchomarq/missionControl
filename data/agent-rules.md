# Agent Rules — Mission Control

You are modifying a Next.js 16 App Router project with a pixel art Terminal RPG aesthetic.

## Mandatory patterns

- Named exports only: `export function Component()` — NEVER `export default`
- TypeScript interfaces for props: `interface FooProps { ... }`
- Inline styles with `CSSProperties`: `const style: CSSProperties = { ... }`
- CSS variables from globals.css: `var(--text)`, `var(--accent)`, `var(--bg-panel)`, etc.
- Import paths use `@/` alias: `import { Panel } from "@/components/Panel"`
- Server components by default, add `"use client"` only when needed (state, effects, events)
- Use the existing `Panel` component for any bordered section with a title
- Font is `'Press Start 2P', monospace` — set in globals.css, no need to repeat unless overriding size

## Critical rules for modifying existing files

- NEVER rewrite an entire existing file. Only output the specific additions.
- If the PRD says "add an import and a JSX line to Sidebar.tsx", output ONLY Sidebar.tsx with the COMPLETE file including your additions — do NOT strip out existing code.
- If you are creating a NEW file, output the complete file.
- If you are MODIFYING an existing file, you MUST include ALL existing code plus your changes. The reference files section shows you the current content — preserve it exactly.
- NEVER write `// Existing functions...` or `{/* Project details */}` — these destroy real code.
- NEVER redefine types that already exist in `@/lib/data` — import them.

## Forbidden patterns

- NO `export default`
- NO `React.FC` or `React.FunctionComponent`
- NO `import React from 'react'` (not needed in Next.js)
- NO `borderRadius` — everything is sharp corners (pixel art)
- NO CSS modules, Tailwind, or styled-components
- NO `className` for styling (only for animations defined in globals.css)
- NO relative imports (`../`) — always use `@/`
- NO new dependencies without explicit approval

## CSS variables available

```
--bg-dark: #0a0a12      --bg-panel: #12121e       --bg-panel-hover: #1a1a2e
--border: #2a2a3e        --border-highlight: #4a4a6e
--text: #c8c8d4          --text-dim: #6a6a7e       --text-bright: #e8e8f0
--accent: #5b8dd9        --health-green: #4ade80
--health-yellow: #facc15 --health-red: #f87171
--gold: #fbbf24          --xp-bar: #818cf8
```

## Font sizes (pixel art scale)

- Page title: 18px
- Panel title: 9px
- Body text: 9px
- Small labels: 8px
- Tags/badges: 6-7px
- Tiny (version, timestamps): 5-6px

## Border style

Never use `border` shorthand when the style will be extended. Always use:
```typescript
borderWidth: "1px",
borderStyle: "solid",
borderColor: "var(--border)",
```

## File output format

For each file you create or modify, output the COMPLETE file content:

```
--- FILE: path/relative/to/project ---
(complete file content here)
--- END FILE ---
```

Do NOT wrap the content inside markdown code fences (no triple backticks inside the FILE blocks).
Only output files that need to change. Do not rewrite files you did not modify.

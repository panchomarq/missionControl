# Mission Control — Dashboard

Dashboard local con estética Terminal RPG que centraliza el estado de los proyectos personales en `~/Documents/projects/`. Frontend del sistema Mission Control; los datos viven en el Data Lake JSON del repo (`../data/`).

## Setup

Requiere Node 22 y pnpm 11.

```bash
pnpm install
```

## Run

```bash
pnpm dev     # dev server en http://localhost:3000
pnpm build   # build de producción
pnpm start   # servir el build
```

El servidor lee los JSON desde `../data/` (rutas relativas al directorio `dashboard/`), así que correlo siempre desde acá.

## Arquitectura

- **Next.js (App Router)** con React Server Components por defecto; server actions en `app/actions.ts` para escribir en el Data Lake.
- **Sin base de datos**: lectura/escritura directa de `../data/*.json` vía `lib/data.ts`.
- **Sin frameworks de UI**: CSS custom con variables en `app/globals.css`, componentes pixel art en `components/` (exports nombrados, estilos inline `CSSProperties`, componente base `Panel`).
- **API**: `app/api/agents/` expone el estado de agentes para el polling del Sidebar.

Las convenciones de código para agentes están en `../data/agent-rules.md`. La arquitectura completa del sistema está en el `CLAUDE.md` de la raíz del repo.

# Mission Control

Sistema operativo personal con estética Terminal RPG. Orquestado por Opus 4.6 (estrategia, arquitectura, PRDs) y ejecutado localmente por Qwen 2.5 Coder 14B vía OpenCode (tareas de código, escaneo, actualizaciones de datos).

## Problema

No hay visibilidad centralizada del estado de los proyectos personales. La información está dispersa entre repos git, archivos CLAUDE.md, ROADMAPs, y notas de Obsidian. No hay forma rápida de saber: qué proyectos existen, en qué estado están, qué tareas quedan pendientes, y cuál necesita atención.

## Solución

Un dashboard local (Next.js) con estética Terminal RPG que muestra el estado de todos los proyectos en `~/Documents/projects/`. Los datos viven en archivos JSON planos (Data Lake). Scripts en `toolbox/` escanean los proyectos y alimentan el Data Lake. La UI permite visualizar estado, tareas, y disparar ejecuciones con Qwen desde un botón.

## Arquitectura

```
missionControl/
├── CLAUDE.md                    # Este archivo
├── PRD-mission-control.md       # PRD detallado
├── data/                        # JSON Data Lake
│   ├── projects.json            # Estado de todos los proyectos
│   ├── tasks.json               # Tareas por proyecto (pending/in-progress/done)
│   └── scans/                   # Resultados de escaneos individuales
│       └── {project-slug}.json  # Último escaneo por proyecto
├── dashboard/                   # App Next.js
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   ├── components/          # UI components (pixel art)
│   │   ├── lib/                 # Utilidades, lectura de JSON
│   │   └── styles/              # CSS pixel art theme
│   └── package.json
├── toolbox/                     # Scripts ejecutables por Qwen
│   ├── scan-projects.sh         # Escanea ~/Documents/projects/
│   ├── scan-git-status.sh       # Git status de cada repo
│   ├── update-task-status.sh    # Mueve tareas entre estados
│   └── sync-obsidian.sh         # Lee roadmaps del vault
└── memory/                      # Memoria por dominio
    └── decisions.md             # Decisiones arquitectónicas
```

### Stack

- **UI**: Next.js (App Router), CSS custom (pixel art, sin frameworks UI)
- **Datos**: Archivos JSON en `data/` (sin base de datos)
- **Scripts**: Bash en `toolbox/` (ejecutados por Qwen vía OpenCode)
- **Fuentes de datos**: Git repos, CLAUDE.md, ROADMAP.md, Obsidian Vault

### Modelo de orquestación

- **Opus 4.6**: Diseña PRDs, define esquemas de datos, escribe scripts complejos, toma decisiones arquitectónicas. No ejecuta tareas mecánicas.
- **Qwen 2.5 Coder 14B**: Ejecuta scripts de `toolbox/`, escribe archivos, actualiza JSONs, genera código boilerplate. Recibe instrucciones específicas y sin ambigüedad.
- **Protocolo Ask To Human**: Ninguna acción destructiva, PR, build, o cambio estructural se ejecuta sin confirmación explícita de Francisco.

### Fuentes de datos por proyecto

| Fuente | Qué extraer | Cómo |
|--------|-------------|------|
| Git repo | Branch, commits sin push, archivos modificados, último commit | `git status`, `git log` |
| CLAUDE.md | Descripción, stack, comandos | Parseo del archivo |
| ROADMAP.md | Fases, estado de cada fase | Parseo del archivo |
| Obsidian Vault | Notas de roadmap por proyecto | `~/Documents/Obsidian Vault/` |

### Esquemas de datos

**projects.json**
```json
[
  {
    "id": "carApp",
    "name": "Car App",
    "slug": "carApp",
    "path": "/home/francisco/Documents/projects/carApp",
    "description": "Vehicle fleet rental management app",
    "stack": ["Next.js", "Drizzle", "Neon Postgres"],
    "status": "active",
    "priority": "high",
    "git": {
      "branch": "main",
      "hasUnpushed": false,
      "dirtyFiles": 0,
      "lastCommit": "2026-05-30T00:00:00Z",
      "lastCommitMessage": "fix(dashboard): improve pending payments layout"
    },
    "health": "green",
    "lastScanned": "2026-05-30T22:00:00Z"
  }
]
```

**tasks.json**
```json
[
  {
    "id": "task-001",
    "projectId": "carApp",
    "title": "Add bulk import for drivers",
    "status": "pending",
    "priority": "medium",
    "createdAt": "2026-05-30T00:00:00Z",
    "updatedAt": "2026-05-30T00:00:00Z"
  }
]
```

## Commands

```bash
# Dashboard
cd dashboard && pnpm dev        # Dev server
cd dashboard && pnpm build      # Production build

# Toolbox (ejecutar desde la raíz de missionControl)
bash toolbox/scan-projects.sh   # Escanear todos los proyectos
bash toolbox/scan-git-status.sh # Actualizar git status
```

## Proyectos monitoreados

| Proyecto | Tipo | Stack |
|----------|------|-------|
| carApp | Web app | Next.js, Drizzle, Neon, Vercel |
| homeTui | TUI | Python, Textual, SQLite |
| personalDashboard | Web app | Next.js (frontend), FastAPI (backend) |
| missionControl | Este sistema | Next.js, JSON |

## Decisiones de diseño

- **JSON plano sobre DB**: Para 4-10 proyectos, JSON es suficiente y transparente. Qwen puede leer/escribir JSON sin drivers ni conexiones. Si escala a 50+, migrar a SQLite.
- **Bash scripts sobre código complejo**: Los scripts de `toolbox/` son bash puro. Qwen solo necesita ejecutarlos, no interpretarlos. Opus los escribe, Qwen los corre.
- **Sin auth**: Dashboard es local y personal. No necesita autenticación.
- **Pixel art CSS puro**: Sin librerías de UI. Fuentes pixeladas, paleta limitada, bordes de 1px, animaciones de sprites CSS.
- **Historial truncado**: El Data Lake guarda el estado actual, no historial completo. Git tiene el historial de cambios de los JSONs.

---

## Roadmap

### Etapa 0 — Cimientos (actual)
- [x] Definir arquitectura y esquemas de datos
- [x] Crear CLAUDE.md con roadmap
- [x] Escribir PRD-mission-control.md
- [x] Crear estructura de carpetas (data/, dashboard/, toolbox/)
- [x] Inicializar proyecto Next.js en dashboard/

### Etapa 1 — Data Lake
- [x] Escribir `toolbox/scan-projects.sh` (detecta proyectos, lee CLAUDE.md)
- [x] Escribir `toolbox/scan-git-status.sh` (git info integrado en scan-projects.sh)
- [x] Generar `data/projects.json` con datos reales de los 4 proyectos
- [x] Generar `data/tasks.json` con estructura vacía
- [ ] Validar que Qwen puede ejecutar los scripts sin errores

### Etapa 2 — Dashboard base (Terminal RPG)
- [x] Diseñar sistema de diseño pixel art (fuente, paleta, componentes)
- [x] Crear layout principal: barra lateral + área principal
- [x] Página de inicio: lista de proyectos como "mapa del mundo"
- [x] Componente de proyecto: tile/sprite que muestra status visual
- [x] Leer `data/projects.json` desde el servidor Next.js

### Etapa 3 — Vista de proyecto
- [x] Página de detalle por proyecto: git status, stack, descripción
- [x] Sección de tareas: lista con estados pending/in-progress/done
- [x] Formulario para agregar/mover tareas (escribe en tasks.json)
- [x] Indicadores de salud (health) con colores pixel art

### Etapa 4 — Integración Qwen
- [x] Botón "Execute with Qwen" en la UI
- [x] Generar comando específico para copiar/pegar en OpenCode
- [x] Script `toolbox/update-task-status.sh` para que Qwen actualice tareas
- [ ] Sistema de cola visual: lista de comandos pendientes (futuro)
- [ ] Feedback visual del estado de ejecución (futuro)

### Etapa 5 — Sincronización Obsidian
- [x] Escribir `toolbox/sync-obsidian.sh` (lee roadmaps del vault)
- [x] Mapear notas de Obsidian a proyectos en projects.json
- [ ] Mostrar roadmap de Obsidian en la vista de proyecto (cuando haya notas en el vault)

### Etapa 6 — Pulido y extensibilidad
- [x] Animaciones pixel art (fadeIn con delay escalonado, pulse, scanline)
- [x] Rescan desde la sidebar (botón con feedback visual)
- [ ] Sonidos 8-bit opcionales para eventos (futuro)
- [ ] Espacio para "Skills/Triggers" futuros en la arquitectura (futuro)

### Etapa 7 — Orquestación autónoma (brainstorm 2026-06-09)

El sistema propone, Francisco aprueba. Requisitos completos en `docs/brainstorms/2026-06-09-autonomous-orchestration-requirements.md`.

- [ ] A. Consolidación: limpiar código muerto de la raíz, commitear Sidebar pendiente, fix scanner, lint en CI, mergear PRs
- [ ] B. Datos frescos: scan diario por cron, tolerante a vault desmontado
- [ ] C. Proposer Qwen: propuestas de mantenimiento en ask-human, con deduplicación
- [ ] D. Runner: despacho de tareas aprobadas por tier, E2E Tier 1 validado
- [ ] E. Claude estratégico: pasada semanal + botón, PRDs Tier 2, estados waiting-tokens con reintento

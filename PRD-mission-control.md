# PRD — Mission Control

## Problema

La información de los proyectos personales está dispersa en múltiples fuentes (git repos, CLAUDE.md, ROADMAP.md, Obsidian Vault). No existe una vista unificada para responder preguntas simples: ¿qué proyectos tengo? ¿cuál tiene archivos sin commitear? ¿qué tareas están pendientes? ¿cuál necesita atención?

Esto causa:
- Pérdida de contexto al cambiar entre proyectos
- Tareas olvidadas o duplicadas
- No hay forma de priorizar sin revisar cada repo manualmente

## Éxito

Mission Control es exitoso cuando:
1. Abro el dashboard y en <5 segundos veo el estado de todos mis proyectos
2. Puedo identificar visualmente cuál proyecto necesita atención (archivos dirty, commits sin push, tareas bloqueadas)
3. Puedo agregar/mover tareas sin salir del dashboard
4. Puedo generar un comando para Qwen con un click y pegarlo en OpenCode

## Usuarios

Solo uno: Francisco. Dashboard local, sin auth, sin deploy remoto.

## Alcance

### En alcance (v1)
- Dashboard local con estética Terminal RPG
- Lista de proyectos con estado visual (health: green/yellow/red)
- Git status por proyecto (branch, dirty files, unpushed commits)
- Sistema de tareas (pending/in-progress/done) por proyecto
- Lectura de CLAUDE.md y ROADMAP.md para descripción y stack
- Botón "Execute with Qwen" que genera comandos copiables
- Scripts de escaneo en bash (toolbox/)

### Fuera de alcance (v1)
- Ejecución directa de Qwen desde el dashboard (requiere integración con OpenCode API)
- Sincronización con Obsidian Vault (Etapa 5)
- Animaciones, sprites reactivos, sonidos 8-bit (Etapa 6)
- Historial de cambios de estado (git tracking del JSON es suficiente)
- Multi-usuario, auth, deploy remoto

## Esquemas de datos

### projects.json

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

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | Nombre de la carpeta del proyecto |
| name | string | Nombre legible |
| slug | string | Igual al id, para URLs |
| path | string | Ruta absoluta |
| description | string | Extraído de CLAUDE.md |
| stack | string[] | Tecnologías principales |
| status | enum | active, paused, archived |
| priority | enum | high, medium, low |
| git.branch | string | Branch actual |
| git.hasUnpushed | boolean | Commits locales sin push |
| git.dirtyFiles | number | Archivos modificados sin commit |
| git.lastCommit | ISO date | Fecha del último commit |
| git.lastCommitMessage | string | Mensaje del último commit |
| health | enum | green (limpio), yellow (dirty/unpushed), red (>7 días sin actividad) |
| lastScanned | ISO date | Última vez que se escaneó |

**Reglas de health:**
- **green**: sin dirty files, sin unpushed, actividad en los últimos 7 días
- **yellow**: tiene dirty files O unpushed commits
- **red**: sin actividad por más de 7 días O status "paused"

### tasks.json

```json
[
  {
    "id": "task-001",
    "projectId": "carApp",
    "title": "Add bulk import for drivers",
    "status": "pending",
    "priority": "medium",
    "source": "roadmap",
    "createdAt": "2026-05-30T00:00:00Z",
    "updatedAt": "2026-05-30T00:00:00Z"
  }
]
```

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID corto (task-XXX) |
| projectId | string | Referencia al proyecto |
| title | string | Descripción de la tarea |
| status | enum | pending, in-progress, done |
| priority | enum | high, medium, low |
| source | enum | manual, roadmap, scan |
| createdAt | ISO date | Fecha de creación |
| updatedAt | ISO date | Última modificación |

## Plan de construcción

### Bloque 1 — Cimientos (~1h)
- Crear estructura de carpetas
- Inicializar Next.js en dashboard/
- Crear JSONs iniciales vacíos en data/
- **Entregable**: `pnpm dev` arranca sin errores

### Bloque 2 — Data Lake (~1h)
- Escribir `toolbox/scan-projects.sh`
- Escribir `toolbox/scan-git-status.sh`
- Generar projects.json con datos reales de los 4 proyectos
- **Entregable**: `bash toolbox/scan-projects.sh` genera JSON válido

### Bloque 3 — Design system Terminal RPG (~1h)
- Seleccionar fuente pixelada (Press Start 2P o similar)
- Definir paleta de colores (4-6 colores: fondo oscuro, texto claro, acentos)
- Crear componentes base: Panel, StatusBadge, HealthIndicator
- Layout: barra lateral fija + área principal scrollable
- **Entregable**: página de prueba con componentes renderizados

### Bloque 4 — Dashboard principal (~1h)
- Página de inicio: grid de proyectos como tiles RPG
- Cada tile muestra: nombre, health indicator, stack icons, last activity
- Lectura de projects.json desde server component
- **Entregable**: dashboard funcional con datos reales

### Bloque 5 — Vista de proyecto (~1h)
- Página `/project/[slug]` con detalle
- Sección de git status (branch, dirty files, last commit)
- Sección de tareas con filtros por estado
- Formulario para agregar tarea (escribe en tasks.json via API route)
- **Entregable**: vista de detalle funcional con CRUD de tareas

### Bloque 6 — Integración Qwen (~1h)
- Botón "Execute with Qwen" por tarea
- Genera comando bash o instrucción específica
- UI de cola: lista de comandos generados, copiables al clipboard
- **Entregable**: botón genera comando y lo copia

## Decisiones técnicas

| Decisión | Elección | Alternativa descartada | Razón |
|----------|----------|----------------------|-------|
| Datos | JSON plano | SQLite, Postgres | 4 proyectos, transparencia, Qwen lee/escribe sin drivers |
| UI framework | CSS custom | Tailwind, shadcn | Pixel art requiere control total del CSS |
| Fuente | Press Start 2P | VT323, Silkscreen | Más legible en cuerpo de texto pixelado |
| Escaneo | Bash scripts | Node scripts | Qwen ejecuta bash sin ambigüedad, sin deps |
| Tareas CRUD | API routes + fs | Server actions | Escritura directa a JSON, sin ORM |

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Qwen falla en tool calling | Medio | Scripts son bash puro, solo necesita ejecutarlos |
| JSON se corrompe | Alto | Git tracking de data/, backup antes de escritura |
| Pixel art ilegible | Medio | Fuente mínimo 12px, probar en monitor real |
| Escaneo lento con muchos proyectos | Bajo | Para 4-10 proyectos es instantáneo |

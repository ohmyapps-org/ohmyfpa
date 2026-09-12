# OhMyFPA Architecture

## Purpose

OhMyFPA is a local-first workspace for Function Point Analysis. It transforms requirements into a reviewable inventory of EI, EO, EQ, ILF, and EIF functions, calculates points and converts the estimate into effort based on team size.

## Runtime

- Frontend: React 19, TypeScript strict mode, Vite and CSS.
- Runtime: Bun.
- Persistence: browser localStorage for the working analysis.
- AI boundary: an optional stdio MCP server that runs in the same machine.
- Iconography: lucide-react.
- Network: no browser requests are required for the core flow.

## Main modules

| Module | Responsibility |
| --- | --- |
| Overview | Shows the visual function map, volume by type, traceability and effort. |
| Functions | Filters the inventory and removes local records. |
| Imports | Reads local GitHub, Trello and IEEE830 exports. |
| Values FPA | Stores hours per point, workday length, cost reference and profile label. |
| MCP Server | Documents and exposes local tools for AI-assisted handling. |
| Documents | Links the local operating documentation. |

## Data flow

1. A user creates a function or selects a local JSON, CSV, Markdown or TXT file.
2. The browser parser normalizes the record, preserves its origin and infers a candidate type from the title.
3. The user reviews the suggested type, complexity, DET, RET and confidence.
4. The function is stored in browser localStorage under ohmyfpa-analysis-v1.
5. The summary derives function points, hours and team days from the current values.
6. Export creates a JSON file that can be moved to another offline workspace.
7. The MCP server can read a local analysis file when OHMYFPA_DATA is configured.

## Design language

The interface follows the OhMy family direction: compact panels, dark canvas, petroleum blue accents, thin technical borders and diagram-like spatial relationships. The center map is deliberately a visual index of the five FPA function types.

## Scope boundary

Actual live GitHub, Trello or IFPUG network synchronization is outside the offline build. The supported path is export locally, import locally, review locally. This keeps the Zero Data Policy enforceable.

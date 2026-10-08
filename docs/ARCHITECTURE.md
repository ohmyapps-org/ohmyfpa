# OhMyFPA Architecture

## Purpose

OhMyFPA is a local-first workspace for Function Point Analysis. It transforms requirements into a reviewable inventory of EI, EO, EQ, ILF and EIF functions, adjusts the count with the 14 IFPUG general system characteristics, and converts the adjusted total into duration and cost.

## Runtime

- Frontend: React 19, TypeScript strict mode, Vite and plain CSS with design tokens.
- Runtime: Bun.
- Persistence: browser localStorage, one entry per workspace.
- AI boundary: an optional stdio MCP server that runs on the same machine.
- Iconography: lucide-react.
- Network: no browser requests are required for any part of the flow.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/lib/types.ts` | Shared domain types. |
| `src/lib/fpa.ts` | Point matrix, IFPUG complexity tables, the 14 influence factors, VAF and the estimation formula. Single source of truth, also imported by the MCP server. |
| `src/lib/import.ts` | Format dispatch and parsers. Heavy parsers (`pdfjs-dist`, `mammoth`, `xlsx`) are dynamic imports, so they are code-split and only fetched when a matching file is opened. |
| `src/lib/storage.ts` | Schema defaults, v1 → v2 migration, load and save. |
| `src/styles/*.css` | `tokens` (palette, themes, accessibility), `base` (reset), `layout` (shell, sidebar, section bar), `components`, `views`. |
| `src/components/*` | Sidebar, section bar, charts, function modal and UI primitives. |
| `src/views/*` | One file per workspace view. |

## Modules in the product

| View | Responsibility |
| --- | --- |
| Resumen | Switchable chart (radar, ternary, bars, donut), key metrics and the eight-step pipeline as navigation. |
| Funciones | Filters the inventory and opens the detail modal for each function. |
| Importaciones | Reads local DOCX, PDF, XLSX, CSV, JSON, Markdown and TXT; documents connector expectations. |
| Influencia | Scores the 14 general system characteristics and shows TDI, VAF and AFP live. |
| Valores FPA | Hours per point, workday length, developers, rate, currency and the editable point matrix. |
| Estimación | Duration and cost, including other costs with recurring proration. |
| Configuración | Project data, theme, accessibility, agent connection and data portability. |
| MCP Server | Visible only in dev and self-host builds; documents the local tools. |

## Data flow

1. A user creates a function or selects local files.
2. `parseFile` dispatches by extension, normalizes each record, preserves its origin and source URL, and infers a candidate type from the text.
3. `deriveComplexity` applies the IFPUG DET × RET / FTR table for the function type and reports which bands matched, so the number stays auditable.
4. Functions are stored per project in localStorage under `ohmyfpa-analysis-v2`.
5. `estimate` derives UFP, TDI, VAF, AFP, hours, duration and cost in one pass; every view reads from that single result.
6. Export creates a JSON file that can be restored in another offline workspace or handed to the MCP server through `OHMYFPA_DATA`.

## Theming and accessibility

Every colour, radius and duration is a CSS custom property in `tokens.css`. Theme, contrast, typeface and motion are `data-*` attributes on `<html>`; UI scale is a `--ui-scale` multiplier on the root font size, and all sizing is authored in `rem`, so one variable rescales the whole interface.

## Scope boundary

Live GitHub, Trello or IFPUG network synchronization is outside the offline build. The supported path is export locally, import locally, review locally. That is what keeps the Zero Data Policy enforceable.

# OhMyFPA

OhMyFPA is a local-first Function Point Analysis workspace: it turns software requirements into a reviewable inventory of EI, EO, EQ, ILF and EIF functions, adjusts the count with the 14 IFPUG general system characteristics, and derives project duration and cost from the result.

The interface follows the OhMy visual language requested for the Eternum analysis project: floating surfaces, petroleum blue accents, diagram-like relationships and compact review panels, in light and dark themes.

## The method, end to end

The product implements the full estimation pipeline, not just the unadjusted count:

1. Functional requirements (IEEE 830) — imported or created by hand.
2. Type and complexity — IFPUG DET × RET / FTR tables.
3. Unadjusted function points (UFP).
4. The 14 degrees of influence (TDI, 0 to 70).
5. Value adjustment factor: `VAF = 0.65 + 0.01 × TDI`.
6. Adjusted function points: `AFP = UFP × VAF`.
7. Project duration from effort and developer count.
8. Project cost, including other costs such as domain, hosting and training.

## Features

- Multi-project workspace with a project switcher and per-project values.
- Collapsible floating sidebar; no global header — sections navigate with a floating pill bar when a view has subsections.
- Function inventory with search, type and status filters, and a detail modal that explains how each point value was reached, including the complexity table that was applied and a link back to the source GitHub issue or Trello card.
- Local import of DOCX, PDF, XLSX, CSV, JSON, Markdown and TXT. Heavy parsers are code-split and load on demand.
- Editable IFPUG point matrix and effort values, with a one-click restore to the CPM baseline.
- Influence view with the 14 characteristics, live TDI, VAF and AFP.
- Estimation view with duration and cost breakdown, including recurring costs prorated over the project length.
- Dark theme plus accessibility controls: UI scale (80–160%), high contrast, typeface (DM Sans / system / Atkinson Hyperlegible) and reduced motion.
- Custom number steppers — native spinners are hidden everywhere.
- Optional stdio MCP server for AI-assisted classification, adjustment and effort handling.
- localStorage persistence with JSON export and restore. Zero Data Policy for the whole flow.

## Local development

Requirements: Bun.

Install and run:

    bun install
    bun dev

Validate:

    bun run build
    bun run lint

Run the MCP server:

    bun run mcp-server/index.ts

## Deployment modes

`VITE_DEPLOY_MODE` selects what the build exposes:

| Value | MCP Server section | Intended use |
| --- | --- | --- |
| `dev` (default in `bun dev`) | visible | local development |
| `selfhost` | visible | self-hosted instance where the operator runs the server |
| `production` (default in `bun build`) | hidden | hosted build; agents connect from Configuración → Agente AI |

## Privacy boundary

The browser does not call GitHub, Trello, IFPUG or a remote AI service. Importers operate on files selected by the user, and working state remains in localStorage. The MCP server is stdio-only and reads an analysis file only when `OHMYFPA_DATA` is configured.

See the documents in `docs` for the architecture, data model, user guide, MCP contract, privacy policy and open work items.

# OhMyFPA

OhMyFPA is a local-first Function Point Analysis workspace for turning software requirements into a reviewable inventory of EI, EO, EQ, ILF and EIF functions.

The interface follows the OhMy visual language requested for the Eternum analysis project: dark technical surfaces, petroleum blue accents, diagram-like relationships and compact review panels.

## Features

- Local dashboard with function-point map, type distribution and traceability.
- Function inventory with search, FPA type filter and local deletion.
- Manual function creation with type and complexity.
- Local import of GitHub Issues, Trello exports and IEEE830-like Markdown or TXT.
- JSON and CSV normalization with local semantic heuristics.
- Custom effort values and editable FPA point matrix: hours per point, workday hours, optional hourly rate, profile label and points by type/complexity.
- Effort calculation based on function points and developer count.
- Optional stdio MCP server for AI-assisted classification and effort handling.
- Browser localStorage persistence and JSON export.
- Zero Data Policy for the core flow.

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

## Privacy boundary

The browser does not call GitHub, Trello, IFPUG or a remote AI service. Importers operate on files selected by the user, and working state remains in localStorage. The MCP server is stdio-only and reads an analysis file only when OHMYFPA_DATA is configured.

See the documents in docs for the architecture, data model, user guide, MCP contract and privacy policy.

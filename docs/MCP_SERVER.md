# OhMyFPA MCP Server

## What it does

The optional server exposes local tools over standard input and output. It does not open an HTTP port, send prompts to a remote model or collect telemetry.

Run it with:

bun run mcp-server/index.ts

A client configuration looks like:

{
  "mcpServers": {
    "ohmyfpa": {
      "command": "bun",
      "args": ["run", "mcp-server/index.ts"]
    }
  }
}

## Tools

- analyze_function: classifies a requirement with local heuristics and returns a candidate type, complexity, points and confidence.
- calculate_effort: calculates hours and team days from points, developers and productivity values.
- list_functions: reads OHMYFPA_DATA when set, otherwise returns a small safe fallback.
- import_ieee830: extracts candidate requirement lines from local text.

## Local file binding

PowerShell:

$env:OHMYFPA_DATA = 'C:\ruta\ohmyfpa-analysis.json'
bun run mcp-server/index.ts

The server is intentionally stdio-only and has no network listener. It is safe to disable if AI handling is not needed.

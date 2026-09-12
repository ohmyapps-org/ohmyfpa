# OhMyFPA MCP Server

## What it does

The optional server exposes local tools over standard input and output. It does not open an HTTP port, send prompts to a remote model or collect telemetry. It imports `src/lib/fpa.ts` directly, so an agent and a person always get the same numbers from the same analysis.

Run it with:

    bun run mcp-server/index.ts

## Tools

| Tool | Purpose |
| --- | --- |
| `list_functions` | Reads the inventory from the file named by `OHMYFPA_DATA`. |
| `analyze_function` | Classifies a requirement and applies the IFPUG complexity table for the inferred type. Accepts `det`, `ret` and `ftr`; returns the matched bands. |
| `import_ieee830` | Extracts candidate requirements from local text. |
| `adjust_points` | Applies the 14 degrees of influence and returns TDI, VAF and adjusted points. |
| `calculate_effort` | Returns UFP, TDI, VAF, AFP, hours, duration and cost for the local analysis, with optional overrides for developers, hours per point, workday hours and rate. |
| `list_influence_factors` | Returns the 14 characteristics with their descriptions, for an agent that needs to score them. |

## Local file binding

PowerShell:

    $env:OHMYFPA_DATA = 'C:\ruta\ohmyfpa-plataforma-eternum.json'
    bun run mcp-server/index.ts

bash:

    OHMYFPA_DATA=/ruta/ohmyfpa-plataforma-eternum.json bun run mcp-server/index.ts

The file is the JSON produced by Exportar análisis. Without it the server still answers, using the built-in defaults, and says so in the response.

## Connecting a client

Configuración → Agente AI in the app renders a ready-to-copy configuration for Claude / Claude Code, ChatGPT / OpenAI, Gemini CLI, Hermes Agent and any OpenAI-compatible client with MCP stdio support. The generic form is:

    {
      "mcpServers": {
        "ohmyfpa": {
          "command": "bun",
          "args": ["run", "mcp-server/index.ts"],
          "env": { "OHMYFPA_DATA": "/ruta/ohmyfpa-analysis.json" }
        }
      }
    }

## Visibility

The MCP Server view only ships in `dev` and `selfhost` builds (`VITE_DEPLOY_MODE`). A production build hides it, because the server is not something a hosted user runs — they connect their own agent from Configuración.

The server is intentionally stdio-only and has no network listener. It is safe to disable if AI handling is not needed.

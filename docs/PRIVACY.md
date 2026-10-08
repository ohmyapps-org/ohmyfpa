# OhMyFPA Privacy Policy

## Zero Data Policy

The core application does not send analysis data, imported files, prompts or credentials to a server. The browser only uses local state and local file APIs.

## Storage

Working data is stored in browser localStorage under ohmyfpa-analysis-v2, and preferences under ohmyfpa-preferences-v1. The browser profile controls its lifetime. Exported JSON files are created with a download action and remain under the user's control.

## Connectors

GitHub and Trello are import labels, not live connections in this offline build. Use an export produced by the source system and import that file locally. There are no access tokens, OAuth redirects, cookies or background sync jobs.

## Local parsing

DOCX, PDF and XLSX are parsed in the browser by pdfjs-dist, mammoth and SheetJS. These libraries are bundled with the application and loaded on demand from the same origin. No file is sent anywhere, and no parsing service is contacted.

## AI handling

The MCP server uses stdio and loopback-local files only. It does not call an LLM or remote API. A user-controlled MCP client may have its own policy, so review that client before connecting it.

## Deletion

Clear the OhMyFPA site data in the browser to remove localStorage state. Delete exported JSON files through the operating system when they are no longer needed.

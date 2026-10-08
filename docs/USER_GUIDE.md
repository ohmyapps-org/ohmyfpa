# OhMyFPA User Guide

## Start an analysis

1. Run `bun install`.
2. Run `bun dev`.
3. Open the local Vite URL.
4. Complete the three-step onboarding: it names the project and points at the connectors.
5. Use Nueva función to create an item, or open Importaciones to load files.

## Import formats

All parsing runs in the browser. Nothing is uploaded.

| Format | Behaviour |
| --- | --- |
| DOCX | Converted to HTML with `mammoth` so headings and tables survive, then read as an IEEE 830 document. |
| PDF | Text is extracted per page with `pdfjs-dist`, then read as an IEEE 830 document. Table geometry is not reconstructed, so a requirement table in a PDF falls back to the prose reader. |
| XLSX / XLS | Every sheet is read as a table; the sheet name becomes the issue when the row has none. |
| CSV / TSV | Delimiter is sniffed (`,` `;` tab `\|`), quoted cells are supported. |
| JSON | An array, or an object with `functions`, `issues`, `cards` or `items`. GitHub and Trello shapes are detected and their labels, lists, milestones and URLs are flattened. |
| MD / TXT | Read as an IEEE 830 document, same as DOCX and PDF. |

Recognised column names include `id`, `title`/`titulo`/`nombre`, `description`/`descripcion`, `type`/`tipo`, `issue`/`modulo`/`labels`/`list`, `complexity`/`complejidad`, `det`, `ret`, `ftr` and `url`/`html_url`/`shortUrl`.

## How an IEEE 830 document is read

Requirement tables come first. A Markdown table counts as a requirement inventory only when its header row has both an identifier column (`id`, `código`, `clave`, `ref`) and a description column (`descripción`, `requisito`, `detalle`, `nombre`). That rejects the front matter, glossary, role and module tables that surround them. The nearest preceding heading becomes the issue, with its numbering stripped, so `#### 3.2.1. Control de acceso y autenticación (AUTH)` groups its rows under `Control de acceso y autenticación (AUTH)`. A `Criterio de aceptación` or `Métrica o restricción` column is folded into the description, and when the row carries no title the description supplies a shortened one.

Rows whose identifier starts with `RNF`, `NFR` or `RN` are skipped: non-functional requirements are constraints, not function points. The import notes report how many were left out.

When a document has no requirement table, the prose reader takes over. It reads bulleted or numbered lines and sentences shaped like `El sistema deberá …`, stripping the prefix from the title. It drops headings, table rows, anything under an `Índice` heading, and any line whose text repeats one of the document's own headings — that last rule is what keeps a table of contents out of the inventory.

## Function types

- EI: External Input. A transaction enters data and maintains one or more internal logical files.
- EO: External Output. A result leaves the system and includes derived logic or calculation.
- EQ: External Query. A retrieval with no derived logic and no file maintenance.
- ILF: Internal Logical File. A logical data group maintained inside the application boundary.
- EIF: External Interface File. A logical data group referenced by the application but maintained elsewhere.

## Complexity

Complexity is derived, not guessed, once the counts are present:

- ILF and EIF use RET × DET, with bands RET 1 / 2–5 / 6+ and DET 1–19 / 20–50 / 51+.
- EI uses FTR × DET, with bands FTR 0–1 / 2 / 3+ and DET 1–4 / 5–15 / 16+.
- EO and EQ use FTR × DET, with bands FTR 0–1 / 2–3 / 4+ and DET 1–5 / 6–19 / 20+.

Open any function to see the weight that was applied, the table that produced the complexity and the values that matched. If the counts are missing, the complexity stays manual and the modal says so.

## Adjustment

Influencia scores the 14 general system characteristics from 0 to 5:

    TDI = Σ degrees            (0 to 70)
    VAF = 0.65 + 0.01 × TDI    (0.65 to 1.35)
    AFP = UFP × VAF

## Effort, duration and cost

    hours    = AFP × hours per FP
    days     = hours ÷ developers ÷ workday hours
    cost     = hours × hourly rate + other costs

Other costs cover everything the implementation implies — domain, hosting, training. A cost marked *Mensual* is multiplied by the number of project months derived from the estimated duration.

## Accessibility

Configuración → Apariencia carries theme (light, dark, system), UI scale from 80% to 160%, typeface (DM Sans, system, or Atkinson Hyperlegible for high legibility), high contrast and reduced motion. Preferences persist per browser, separately from the analysis.

## Review protocol

Before treating the estimate as final, verify:

- The function boundary is unique and traceable to an issue or requirement.
- The FPA type matches the behaviour, not only the UI label.
- DET, RET and FTR counts are supported by the requirement.
- The influence degrees were agreed with the user, not defaulted.
- Complexity and confidence are reviewed by a person familiar with the domain.
- The exported JSON is stored according to the team's privacy policy.

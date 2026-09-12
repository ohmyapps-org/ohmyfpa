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
| DOCX | Text is extracted with `mammoth` and read as IEEE 830 requirement lines. |
| PDF | Text is extracted per page with `pdfjs-dist`, then read as requirement lines. |
| XLSX / XLS | Every sheet is read as a table; the sheet name becomes the issue when the row has none. |
| CSV / TSV | Delimiter is sniffed (`,` `;` tab `\|`), quoted cells are supported. |
| JSON | An array, or an object with `functions`, `issues`, `cards` or `items`. GitHub and Trello shapes are detected and their labels, lists, milestones and URLs are flattened. |
| MD / TXT | Requirement lines, same as DOCX and PDF. |

Recognised column names include `id`, `title`/`titulo`/`nombre`, `description`/`descripcion`, `type`/`tipo`, `issue`/`modulo`/`labels`/`list`, `complexity`/`complejidad`, `det`, `ret`, `ftr` and `url`/`html_url`/`shortUrl`.

Requirement lines are recognised when they start with a bullet, a number, `RF-`, `RN-` or `REQ`, or when they read like `El sistema deberá …`. Prefixes are stripped from the title.

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

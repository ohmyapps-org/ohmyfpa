# Open work items

The initial build shipped without an issue backlog. This file is that backlog, in a shape `gh issue create` can consume once the repository has a remote.

Status legend: **done** shipped in the UI overhaul, **open** not started.

---

## done — Adjust the count with the 14 general system characteristics

`area:fpa` `priority:high`

The estimate stopped at unadjusted points, so steps 4 to 6 of the brief were missing. Influencia now scores the 14 characteristics from 0 to 5, computes TDI and `VAF = 0.65 + 0.01 × TDI`, and every view reads AFP instead of UFP.

## done — Project duration and cost

`area:fpa` `priority:high`

Steps 7 and 8 of the brief. Estimación derives hours, team days and weeks from AFP and the developer count, and a cost breakdown with an editable list of other costs (domain, hosting, training) where recurring items are prorated over the project length.

## done — Derive complexity from DET, RET and FTR

`area:fpa` `priority:high`

Complexity used to be assigned by hand. The IFPUG tables now derive it, and the function detail modal reports which table and which bands produced the result.

## done — Import DOCX, PDF, XLSX

`area:import` `priority:high`

Added alongside the existing CSV, JSON, Markdown and TXT readers. All three run in the browser through code-split dynamic imports, so the Zero Data Policy holds and the initial bundle is unaffected.

## done — Multi-project workspace

`area:ux` `priority:medium`

Projects are switchable from the sidebar, each with its own functions, values and influence scores.

## done — Dark theme and accessibility controls

`area:ux` `priority:medium`

Theme (light, dark, system), UI scale 80–160%, high contrast, three typefaces including Atkinson Hyperlegible, and reduced motion. Persisted per browser.

---

## open — Batch review mode for imported functions

`area:ux` `priority:high`

After importing a large document, every function lands as Borrador or Revisar and has to be opened one at a time. Needed: a review queue that walks the imported set, showing the source text beside the type, DET/RET/FTR fields and a keyboard path to accept or correct.

Acceptance: import 40 requirements and classify all of them without leaving the queue; the queue tracks progress and can be resumed.

## open — Reconstruct tables from PDF

`area:import` `priority:medium`

Markdown, DOCX and XLSX requirement tables are read as tables. PDF is not: `pdfjs-dist` returns positioned text runs, not cells, so a PDF ERS falls back to the prose reader and loses the ID, acceptance criterion and module columns.

Acceptance: a PDF whose requirements live in a table imports with the same IDs, issues and descriptions as the DOCX of the same document, by clustering text items on their x positions per page.

## open — Duplicate and near-duplicate detection on import

`area:import` `priority:medium`

Re-importing an updated export duplicates functions. IDs are de-duplicated by suffix, which hides the problem rather than solving it.

Acceptance: importing a file that overlaps the current inventory offers merge, replace or skip per matching function, matching on source URL first and normalized title second.

## open — Per-function audit trail

`area:fpa` `priority:medium`

Estimates get challenged. Today there is no record of who changed a type, a count or a complexity, or when.

Acceptance: each function keeps a local change log (field, previous value, new value, timestamp) visible in the detail modal and included in the export.

## open — Comparison between analysis versions

`area:fpa` `priority:medium`

Teams re-estimate after scope changes and need the delta, not two separate numbers.

Acceptance: load a second exported JSON and see a diff of functions, UFP, TDI, VAF, AFP, duration and cost against the current project.

## open — GSC grade tables in the UI

`area:fpa` `priority:low`

`Determinacion_de_los_niveles_de_influencia.pdf` defines what each grade 0 to 5 means for each of the 14 characteristics. The app currently shows a one-line description and a generic grade label, so scoring still needs the PDF open beside it.

Acceptance: each characteristic can expand to the full grade table from the reference document.

## open — PDF and DOCX export of the analysis

`area:export` `priority:medium`

JSON export serves the tool; a client deliverable needs a readable document with the inventory, the adjustment, the duration and the cost breakdown.

Acceptance: export a paginated report offline, with the charts rendered.

## open — Live GitHub and Trello sync

`area:import` `priority:low`

Deliberately out of the offline build. If it ever ships it must be opt-in, token-scoped, documented in `PRIVACY.md`, and must not weaken the Zero Data Policy for users who do not enable it.

Acceptance: a decision record stating whether this is in scope at all, before any implementation.

## open — Automated test suite

`area:quality` `priority:high`

There are no tests. The complexity tables, the VAF formula, the cost proration and the import parsers are all pure functions and are the highest-value targets.

Acceptance: unit coverage of `src/lib/fpa.ts` and `src/lib/import.ts`, plus one end-to-end pass over import → classify → adjust → estimate.

## open — Decide on TailwindCSS

`area:quality` `priority:low`

`tailwindcss`, `@tailwindcss/vite` and `@tailwindcss/postcss` are in `package.json` but are not wired into `vite.config.ts` and no utility classes are used. The design system is CSS custom properties, which is what the theme and scale controls depend on.

Acceptance: either wire Tailwind v4 in and map `@theme` onto the existing tokens, or drop the three dependencies. Not both halves of the current state.

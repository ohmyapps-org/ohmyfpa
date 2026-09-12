# OhMyFPA User Guide

## Start an analysis

1. Run 'bun install'.
2. Run 'bun dev'.
3. Open the local Vite URL.
4. Use Nueva función to create an item or open Importaciones to load a file.

## Import formats

JSON accepts an array or an object with functions, issues or cards. Useful fields are id, title, type, issue, complexity, det and ret.

CSV accepts a header row. The parser recognizes English and Spanish names such as title / nombre, type / tipo, issue / etiqueta, complexity / complejidad, det and ret.

Markdown and TXT are treated as IEEE830-like requirement lines. Each non-empty line becomes a draft candidate. Local heuristics infer a candidate type from words such as consultar, exportar, registrar, sincronizar or repositorio.

## Function types

- EI: External Input. A transaction enters data and updates internal logic.
- EO: External Output. A result leaves the system and includes derived or transformed logic.
- EQ: External Query. A read-only query with limited derived logic.
- ILF: Internal Logical File. A logical data group maintained by the product.
- EIF: External Interface File. A logical data group referenced by the product but maintained elsewhere.

## Effort

The estimate is:

hours = total FP × hours per FP

team days = hours ÷ developers ÷ workday hours

Change the developers stepper in the Overview or edit the local baseline and point matrix in Valores FPA. The baseline is a planning aid, not a substitute for expert review.

## Review protocol

Before treating the estimate as final, verify:

- The function boundary is unique and traceable to an issue or requirement.
- The FPA type matches the behavior, not only the UI label.
- DET and RET counts are supported by the requirement.
- Complexity and confidence are reviewed by a person familiar with the domain.
- The exported JSON is stored according to the team's privacy policy.

# OhMyFPA Data Model

The canonical definitions live in `src/lib/types.ts`.

## Workspace

    AnalysisState {
      version: 2
      activeProjectId: string
      projects: Project[]
      onboarded: boolean
    }

## Project

    Project {
      id, name, client, createdAt
      functions: FpaFunction[]
      values: ProjectValues
      influence: InfluenceScores
    }

## Function

    FpaFunction {
      id, title, description
      type: EI | EO | EQ | ILF | EIF
      issue
      complexity: Baja | Media | Alta
      det          // data element types
      ret          // record element types, used by ILF and EIF
      ftr          // file types referenced, used by EI, EO and EQ
      points
      origin: Manual | GitHub | Trello | IEEE830 | CSV | XLSX | DOCX | PDF | JSON
      sourceUrl    // issue or card link, shown in the detail modal
      confidence
      status: Listo | Revisar | Borrador
    }

`det`, `ret` and `ftr` are not decoration: `deriveComplexity` uses them to pick the IFPUG band, and the detail modal reports which table was applied.

## Project values

    ProjectValues {
      hoursPerPoint, workdayHours, developers
      baseRate, currency, productivityLabel
      pointMatrix      // weights by type and complexity
      otherCosts: CostItem[]
    }

    CostItem { id, label, amount, recurring }

A `recurring` cost is multiplied by the number of project months, derived from the estimated duration at 21 working days per month.

## Influence

    InfluenceScores = Record<factorId, 0..5>

The fourteen factor ids are defined in `INFLUENCE_FACTORS` (`src/lib/fpa.ts`): `comunicacion`, `distribuido`, `rendimiento`, `configuracion`, `transacciones`, `entrada-linea`, `interfase`, `actualizacion-linea`, `procesamiento`, `reusabilidad`, `implementacion`, `operacion`, `multi-instalacion`, `cambios`.

TDI is their sum (0 to 70) and `VAF = 0.65 + 0.01 × TDI`.

## Preferences

Stored separately from the analysis, under `ohmyfpa-preferences-v1`:

    Accessibility { theme, scale, contrast, typeface, reduceMotion }

## Versioning

The analysis key is `ohmyfpa-analysis-v2`. A v1 payload (a flat `{ functions, values }` object) is migrated into a single project on first load; the v1 entry is left untouched. Future schema changes should migrate a copy of the old shape rather than deleting local records.

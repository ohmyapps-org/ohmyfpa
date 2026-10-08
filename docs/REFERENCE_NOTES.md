# Reference Notes

## Supplied materials

- `Analisis_PFuncion_1.pdf` — course deck on the FPA method.
- `Determinacion_de_los_niveles_de_influencia.pdf` — the 14 general system characteristics with their 0–5 grade tables. The factor list and wording in `INFLUENCE_FACTORS` (`src/lib/fpa.ts`) are derived from this document.
- `IMG_1022.jpeg` — whiteboard defining the required pipeline.

## The whiteboard, mapped to the product

| Whiteboard step | Where it lives |
| --- | --- |
| 1. Lista de requerimientos funcionales (IEEE 830) | Importaciones |
| 2. Tipo y complejidad | Funciones + detail modal |
| 3. Total APFSA (sin ajustar) + tabla de valores IFPUG | Resumen, Valores FPA |
| 4. 14 puntos de niveles de influencia | Influencia |
| 5. Total de valor de ajuste | Influencia (TDI → VAF) |
| 6. Fórmula para el cálculo del VPFA ajustado | Influencia, Estimación |
| 7. Cálculo de duración con cantidad de developers | Estimación → Duración |
| 8. Estimación del costo, sin olvidar otros costos | Estimación → Costos |

## Visual direction

The page follows the OhMy product family and the diagram language requested in the brief: technical surfaces, restrained cyan-teal accents, thin graph lines, compact cards and a central map that connects the five function categories to one analysis. The map is an explanatory visualization with four interchangeable readings (radar, ternary, bars, donut), not a source of calculation truth.

## Implementation note

The initial matrix is a local baseline held in `DEFAULT_MATRIX` (`src/lib/fpa.ts`) and editable per project from Valores FPA. If the team adopts a formally licensed or project-specific IFPUG matrix, replace those values and document the version and licensing terms here.

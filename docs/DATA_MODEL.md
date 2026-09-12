# OhMyFPA Data Model

## Function

A function record contains:

- id
- title
- type
- issue
- complexity
- det
- ret
- points
- origin
- confidence
- status

## Custom values

The local profile stores:

- hoursPerPoint
- workdayHours
- baseRate
- productivityLabel
- pointMatrix, with values by function type and complexity

Developers are session state and are included in JSON exports.

## Versioning

The browser key is versioned as ohmyfpa-analysis-v1. Future schema changes should migrate a copy of the old shape rather than deleting local records.

# ADR-004: mergedPhases Overlay Pattern

**Status:** Accepted
**Date:** 2024-01-01
**Version:** 1.0

## Context

The canonical phase/section/requirement structure is defined in `src/data/phases.js` (checked into git). Users also need to customise labels, order, add custom phases/sections, and hide/reorder items — without modifying source code.

## Decision

Store user customisations in Supabase tables (`phases`, `sections`). At runtime, `getMergedPhases(phasesData, sectionsData)` in `src/utils/mergePhases.js` overlays these rows on top of the built-in `PHASES` constant. All views consume `mergedPhases` (the merged result) — never the raw `PHASES` directly.

## Consequences

- **Positive:** Built-in structure is code-reviewed and versioned. User customisations survive app updates. Custom phases get automatic colour assignment.
- **Negative:** Two sources of truth must be kept consistent. Adding a new built-in phase also requires adding its visual metadata to `mergePhases.js`.

## History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial decision |

# Architectural Decision Records (ADRs)

Record of significant technical decisions in this project.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [001](001-supabase-optional-backend.md) | Supabase as Optional Backend | Accepted |
| [002](002-no-router-library.md) | Manual pushState Routing (No Router Library) | Accepted |
| [003](003-browser-jwt-for-metabase.md) | Browser-side JWT Signing for Metabase Embeds | Accepted |
| [004](004-mergedphases-overlay-pattern.md) | mergedPhases Overlay Pattern | Accepted |
| [005](005-image-storage-strategy.md) | Image Storage Strategy (Supabase Storage + Base64 Fallback) | Accepted |

## Template

To create a new ADR, use the template below and save as `NNN-title-slug.md`:

```markdown
# ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Version:** 1.0

## Context

[Why was this decision needed?]

## Decision

[What was decided?]

## Consequences

- **Positive:** ...
- **Negative:** ...

## History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | YYYY-MM-DD | Initial decision |
```

## Conventions

- **Numbering:** Sequential, 3 digits with leading zeros (001, 002, ...)
- **Filename:** `NNN-title-in-slug.md`
- **Status:**
  - `Proposed` - Under discussion
  - `Accepted` - Approved and in use
  - `Deprecated` - Still works but not recommended
  - `Superseded` - Replaced by another ADR (link it)

## Adding Decisions

In Claude Code, use the interactive command:
```
/add-decision
```

This will ask clarifying questions and populate the ADR with context.

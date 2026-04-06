# ADR-002: Manual pushState Routing (No Router Library)

**Status:** Accepted
**Date:** 2024-01-01
**Version:** 1.0

## Context

The app has 6 views. A full router library (React Router, TanStack Router) would add dependency weight and API surface for a simple flat navigation structure.

## Decision

Implement routing manually via `window.history.pushState` and a `PATH_TO_VIEW` / `VIEW_TO_PATH` map in `App.jsx`. View state is a single `useState` string. `popstate` events handle back/forward navigation.

## Consequences

- **Positive:** Zero dependency. Simple to understand. Works for the current flat navigation.
- **Negative:** No nested routes, no route params, no lazy loading. Would need to be replaced if navigation complexity grows significantly.

## History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial decision |

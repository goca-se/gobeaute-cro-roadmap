# ADR-001: Supabase as Optional Backend

**Status:** Accepted
**Date:** 2024-01-01
**Version:** 1.0

## Context

The app started as a pure localStorage SPA. As it grew to support multiple users and needed cloud sync, a backend was required — but the app also needed to keep working without it (local demos, offline use).

## Decision

Use Supabase for auth and data persistence, but make it entirely optional. `src/lib/supabase.js` exports `supabase` (client or `null`) and `isConfigured` (boolean) based on env var presence. All code that touches Supabase is gated on `isConfigured` or null-checks on `supabase`.

## Consequences

- **Positive:** App works offline or without a Supabase project. No vendor lock-in for local usage. Easy to demo without credentials.
- **Negative:** Every Supabase interaction requires a null-check. Two code paths (localStorage vs Supabase) must stay in sync.

## History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial decision |

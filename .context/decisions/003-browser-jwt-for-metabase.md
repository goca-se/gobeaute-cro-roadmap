# ADR-003: Browser-side JWT Signing for Metabase Embeds

**Status:** Accepted
**Date:** 2024-01-01
**Version:** 1.0

## Context

Metabase's embedding feature requires a signed JWT containing the dashboard/card ID. Normally this would be done server-side to protect the embed secret. This app has no backend.

## Decision

Sign Metabase JWTs in the browser using the Web Crypto API (`crypto.subtle.sign` with HMAC-SHA256). The embed secret is stored in `appSettings.metabase.embedSecret` (user-entered, held in Supabase or localStorage). No external library is needed — only `btoa` + Web Crypto.

## Consequences

- **Positive:** No server required. No additional dependencies. Works entirely in-browser.
- **Negative:** The embed secret is visible to anyone who can read the app's Supabase row or localStorage. Acceptable for an internal tool where all users are trusted staff.

## History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial decision |

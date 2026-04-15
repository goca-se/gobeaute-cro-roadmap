# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

No test runner configured. Validate changes by running `npm run build` (catches TypeScript/JSX errors).

## Project Overview

**Gobeaute CRO Roadmap** — Internal React SPA tracking CRO (Conversion Rate Optimization) methodology progress across 7 beauty brands. Built with React 18 + Vite 5 + Tailwind CSS 3. Optional Supabase backend for auth, cloud sync, and image storage.

**Active brands:** Ápice, Barbour's, Kokeshi, Rituária, Lescent (+ Auá, By Samia hidden in UI)

## Environment

Supabase is optional. Without env vars the app runs in localStorage-only mode (no auth, no cloud sync).

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Supabase Storage — image attachments

Task descriptions support inline image attachments via `task-images` bucket in Supabase Storage. Images are compressed client-side to WebP (max 1920px). In localStorage mode, images fall back to base64 (limit ~500 KB). See `.claude/docs/supabase-schema.md` for required RLS policies.

## Architecture

Single-page React app. Views: `dashboard | brand | matrix | analytics | abtesting | log | settings`. URL paths map to views via `PATH_TO_VIEW` in `App.jsx`; navigation uses `pushState` (no router library).

### Key directories

```
src/
├── components/     # 13 view/UI components (Dashboard, BrandView, MatrixView, etc.)
├── data/           # Static data: phases, statuses, initial seeds
├── hooks/          # useCROData (state), useAuth (auth)
├── lib/            # supabase.js (client), metabase.js (embed/JWT)
└── utils/          # mergePhases, stats, imageUpload (pure functions)
```

### Database schema

Full Supabase schema documentation: **`.claude/docs/supabase-schema.md`**
Data flow & state architecture: **`.claude/docs/data-flow.md`**

**Key tables:**
| Table | Purpose |
|-------|---------|
| `brands` | Brand registry (PK: `brand_id`) |
| `phases` | CRO phases with label/emoji/order |
| `sections` | Sections within phases (FK → phases) |
| `brand_tasks` | Per-brand task state: status, assignee, deadline, description, priority (FK → brands, sections) |
| `phase_tasks` | Global custom tasks visible to all brands (auto-ID: `CRO-001`) |
| `brand_settings` | Per-brand config: logo, links, Metabase card IDs |
| `app_settings` | Singleton: group name, Metabase config, status labels, responsible areas |
| `brand_ui_state` | Per-brand: hidden tasks, task/matrix ordering |
| `global_ui_state` | Singleton: phase titles, notes, hidden tasks |
| `activity_log` | Append-only audit trail of status changes |
| `profiles` | User profiles (FK → auth.users) |

### Supabase vs localStorage mode

`src/lib/supabase.js` exports `supabase` (client or `null`) and `isConfigured` (boolean). When `isConfigured` is false, the app skips auth and reads/writes only localStorage. When true, Google OAuth is required (restricted to `gobeaute.com.br` and `gocase.com` domains), and all state syncs to Supabase.

### Data model

`src/data/phases.js` — canonical source of truth for built-in phases → sections → requirements.
`src/data/initialData.js` — seeds initial statuses for pre-populated brands.
`src/data/initialNotes.js` — seeds initial notes/descriptions.
`src/data/statusConfig.js` — status cycle, priority config, responsible-area config. **Always import from here instead of hardcoding status strings.**

**Status cycle:** `pending → in_progress → waiting_client → validating → done`

Each task is an object: `{ status, assignee, deadline, description, priority, customTitle }` — see `DEFAULT_TASK` in `useCROData.js`.

### mergedPhases

`src/utils/mergePhases.js` exports `getMergedPhases(phasesData, sectionsData)`. It overlays Supabase-stored phase/section overrides (labels, order, custom phases) on top of the built-in `PHASES` constant. **All views receive `mergedPhases` (not raw `PHASES`) from `useCROData`.** When adding new built-in phases or sections, add visual metadata to the lookup objects in `mergePhases.js` as well.

### State — `src/hooks/useCROData.js`

Owns **all** app state. Loads from localStorage (`gobeaute_cro_data`, `gobeaute_cro_log`) then, if Supabase is configured, syncs to/from the database. Dual-write: mutations update localStorage immediately, then async upsert to Supabase. See `.claude/docs/data-flow.md` for complete state shape.

**Key mutations exposed:**

- **Tasks**: `updateTask(brandId, reqId, fields)`, `addCustomTask`, `updateCustomTask`, `deleteCustomTask`, `hideTask`, `showTask`, `bulkUpdateTasks`, `reorderSection`
- **Phase-level editing**: `addPhaseTask`, `updatePhaseTask`, `deletePhaseTask`, `showPhaseTask`, `reorderPhaseSection`, `movePhaseTask`, `updatePhaseTitleOverride`, `updatePhaseNote`
- **Structure**: `addPhase`, `deletePhase`, `addCustomSection`, `deleteCustomSection`, `reorderPhases`, `reorderSections`, `updatePhaseMeta`, `updateSectionMeta`
- **Settings**: `updateBrandSetting(brandId, path, value)`, `updateAppSetting(path, value)`, `saveBrandMetrics`
- **Export**: `exportJSON()`, `exportCSV()`

`syncState` and `lastSynced` reflect Supabase sync status (forwarded to `Header`).

### A/B Testing — Elevate integration

`src/components/ABTestingView.jsx` — View at `/testes-ab` displaying A/B test data from Elevate platform.
`src/hooks/useABTestData.js` — Hook for reading test data from Supabase, filtering, sorting, and managing notes.
`src/lib/elevateSync.js` — Normalization logic for MCP data → Supabase schema (used by sync command).
`.claude/commands/sync-elevate.md` — Claude Code command to collect data from Elevate MCP tools.

**Tables:** `ab_tests`, `ab_test_snapshots`, `ab_test_notes`, `ab_sync_log` (see `.claude/docs/supabase-schema.md`).
**Setup SQL:** `supabase-ab-tests-setup.sql`

Data flows: Elevate MCP → Claude Code command/cron → `elevateSync.js` normalizes → Supabase tables → `useABTestData` hook reads → `ABTestingView` renders.

Brand mapping (1:1): `apice` ↔ `mcp__elevate-apice`, `barbours` ↔ `mcp__elevate-barbours`, `kokeshi` ↔ `mcp__elevate-kokeshi`, `rituaria` ↔ `mcp__elevate-rituaria`, `lescent` ↔ `mcp__elevate-lescent`.

### Metabase integration — `src/lib/metabase.js`

Browser-side JWT signing (Web Crypto API, no dependencies) for Metabase embedded dashboards and card queries. Key exports: `generateEmbedUrl`, `fetchCardValue`, `fetchBrandMetrics`, `testConnection`. Config lives in `appSettings.metabase`. Per-brand metric card IDs live in `brandSettings[brandId].metabaseCards`.

### App settings structure

```js
appSettings = {
  groupName, logoUrl,
  metabase: { baseUrl, apiKey, embedSecret, embedDashboardId },
  statusLabels: { pending, in_progress, waiting_client, validating, done },
  responsibleAreas: [{ id, label, color, bg, border }],
}
brandSettings[brandId] = {
  logoUrl, customName, customSegment,
  links: { ga4, storeUrl, shopify, drive },
  metabaseCards: { cvr, aov, rpv, sessions, revenue },
}
```

## Common Operations

### Adding a new requirement

1. Add to the correct section in `src/data/phases.js`
2. Optionally seed status in `src/data/initialData.js`
3. The hook auto-initialises new req IDs to `'pending'` for all brands on next load

### Adding a new brand

1. Add to `BRANDS` in `src/data/phases.js`
2. Optionally seed in `src/data/initialData.js`

### Adding a new phase or section

1. Can be done via Settings UI (persisted to Supabase `phases`/`sections` tables)
2. For built-in phases: add to `PHASES` in `src/data/phases.js` + visual metadata in `mergePhases.js`

### Modifying the database schema

1. Update the Supabase schema (migrations or dashboard)
2. Update `.claude/docs/supabase-schema.md` to reflect changes
3. Update sync logic in `useCROData.js` if new tables/columns are added

## Styling

Design tokens are CSS variables in `src/index.css`. Phase colors (`--phase-1/2/3`) and status colors should use those variables or the constants in `src/data/statusConfig.js`. Tailwind for layout/spacing; inline styles for dynamic phase/brand data.

**Fonts (Google Fonts):** `Fraunces` for display/headings, `Syne` for labels/nav, `Outfit` for body/data.

## Console helpers

Available in browser console when app is running:

```js
exportData()        // downloads JSON backup
importData(json)    // restores from JSON string
exportCSV()         // downloads marca × requisito × status CSV
resetData()         // wipes to initial seed state
```

## Conventions

- **Language:** UI text and comments in Portuguese (pt-BR). Code identifiers in English.
- **State mutations:** Always go through `useCROData` — never write to localStorage or Supabase directly from components.
- **Status strings:** Import from `statusConfig.js`, never hardcode.
- **Phases in views:** Always use `mergedPhases`, never raw `PHASES`.
- **No router library:** Navigation via `history.pushState()` + `PATH_TO_VIEW` map in `App.jsx`.
- **Dual persistence:** Every mutation writes localStorage (sync) + Supabase (async). localStorage is source-of-truth for instant render; Supabase wins on reload.

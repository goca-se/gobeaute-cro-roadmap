# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

No test runner configured.

## Environment

Supabase is optional. Without env vars the app runs in localStorage-only mode (no auth, no cloud sync).

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Supabase Storage — image attachments

Task descriptions support inline image attachments. Requires a public bucket `task-images` in Supabase Storage with these RLS policies:

```sql
CREATE POLICY "Public read task images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'task-images' );

CREATE POLICY "Authenticated users can upload task images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'task-images' );

CREATE POLICY "Authenticated users can delete task images"
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'task-images' );
```

Without the bucket, uploads fail with a clear error message. In localStorage mode, images fall back to base64 (limit ~500 KB per image).

## Architecture

Single-page React app (Vite + Tailwind CSS) tracking CRO methodology progress across beauty brands. Views: `dashboard | brand | matrix | analytics | log | settings`. URL paths map to views via `PATH_TO_VIEW` in `App.jsx`; navigation uses `pushState` (no router library).

### Supabase vs localStorage mode

`src/lib/supabase.js` exports `supabase` (client or `null`) and `isConfigured` (boolean). When `isConfigured` is false, the app skips auth entirely and reads/writes only localStorage. When true, Google OAuth is required (restricted to `gobeaute.com.br` and `gocase.com` domains via `src/hooks/useAuth.js`), and all state syncs to Supabase tables.

### Data model

`src/data/phases.js` — canonical source of truth for built-in phases → sections → requirements. `src/data/initialData.js` seeds initial statuses for pre-populated brands. `src/data/initialNotes.js` seeds initial notes.

`src/data/statusConfig.js` — status cycle order (`pending → in_progress → waiting_client → validating → done`), plus priority and responsible-area config. Import from here instead of hardcoding status strings.

Each task is an object (not just a status string): `{ status, assignee, deadline, description, priority, customTitle }` — see `DEFAULT_TASK` in `useCROData.js`.

### mergedPhases

`src/utils/mergePhases.js` exports `getMergedPhases(phasesData, sectionsData)`. It overlays Supabase-stored phase/section overrides (labels, order, custom phases) on top of the built-in `PHASES` constant. All views receive `mergedPhases` (not raw `PHASES`) from `useCROData`. When adding new built-in phases or sections, add visual metadata to the lookup objects in `mergePhases.js` as well.

### State — `src/hooks/useCROData.js`

Owns all app state. Loads from localStorage (`gobeaute_cro_data`, `gobeaute_cro_log`) then, if Supabase is configured, syncs to/from the database. Key mutations exposed:

- **Tasks**: `updateTask(brandId, reqId, fields)`, `addCustomTask`, `updateCustomTask`, `deleteCustomTask`, `hideTask`, `showTask`, `bulkUpdateTasks`, `reorderSection`
- **Phase-level editing**: `addPhaseTask`, `updatePhaseTask`, `deletePhaseTask`, `showPhaseTask`, `reorderPhaseSection`, `movePhaseTask`, `updatePhaseTitleOverride`, `updatePhaseNote`
- **Structure**: `addPhase`, `deletePhase`, `addCustomSection`, `deleteCustomSection`, `reorderPhases`, `reorderSections`, `updatePhaseMeta`, `updateSectionMeta`
- **Settings**: `updateBrandSetting(brandId, path, value)`, `updateAppSetting(path, value)`, `saveBrandMetrics`
- **Export**: `exportJSON()`, `exportCSV()`

`syncState` and `lastSynced` reflect Supabase sync status and are forwarded to `Header` for display.

### Metabase integration — `src/lib/metabase.js`

Browser-side JWT signing (Web Crypto API, no dependencies) for Metabase embedded dashboards and card queries. Key exports: `generateEmbedUrl`, `fetchCardValue`, `fetchBrandMetrics`, `testConnection`. Config lives in `appSettings.metabase` (baseUrl, apiKey, embedSecret, embedDashboardId). Per-brand metric card IDs live in `brandSettings[brandId].metabaseCards`.

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

### Adding a new requirement

1. Add to the correct section in `src/data/phases.js`
2. Optionally seed status in `src/data/initialData.js`
3. The hook auto-initialises new req IDs to `'pending'` for all brands on next load

### Adding a new brand

1. Add to `BRANDS` in `src/data/phases.js`
2. Optionally seed in `src/data/initialData.js`

### Styling

Design tokens are CSS variables in `src/index.css`. Phase colors (`--phase-1/2/3`) and status colors should use those variables or the constants in `src/data/statusConfig.js`. Tailwind for layout/spacing; inline styles for anything driven by dynamic phase/brand data.

Fonts (Google Fonts): `Fraunces` for display/headings, `Syne` for labels/nav, `Outfit` for body/data.

### Console helpers

```js
exportData()        // downloads JSON backup
importData(json)    // restores from JSON string
exportCSV()         // downloads marca × requisito × status CSV
resetData()         // wipes to initial seed state
```

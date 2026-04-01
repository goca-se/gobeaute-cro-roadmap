# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

No test runner configured.

## Architecture

Single-page React app (Vite + Tailwind CSS) for tracking CRO methodology progress across 7 beauty brands. No backend — all state lives in `localStorage`.

### Data flow

`src/data/phases.js` is the source of truth for the entire data model: 3 phases → sections → requirements (with tooltips). `src/data/initialData.js` holds the pre-populated statuses for Ápice, Barbour's and Lescent.

`src/hooks/useCROData.js` owns all state. On first load it merges `INITIAL_STATUSES` into a full grid of all brand × requirement combinations, defaulting to `'pending'`. Subsequent loads hydrate from `localStorage` key `gobeaute_cro_data` (activity log in `gobeaute_cro_log`). `cycleStatus(brandId, reqId)` is the single mutation — it advances `pending → in_progress → done → pending` and appends to the activity log.

`src/utils/stats.js` contains pure functions for progress calculations (global, per-phase, per-brand-phase, per-section). No state lives here.

`src/App.jsx` manages view routing (`dashboard | brand | matrix | log`) and the selected brand/phase state. It passes `cycleStatus` and `statuses` down to views.

### Adding a new requirement

1. Add an entry to the correct phase's section in `src/data/phases.js`
2. Optionally seed an initial status in `src/data/initialData.js`
3. No other files need changing — the hook automatically initialises new req IDs to `'pending'` for all brands on next load

### Adding a new brand

1. Add to the `BRANDS` array in `src/data/phases.js`
2. Optionally seed in `src/data/initialData.js`

### Styling

Design tokens are CSS variables in `src/index.css`. Phase colors (`--phase-1/2/3`) and status colors (`--done`, `--progress`, `--pending`) should be consumed via those variables or via the constants already defined in each component. Tailwind is used for layout/spacing; inline styles are used for anything driven by dynamic phase/brand data.

Fonts (loaded from Google Fonts): `Fraunces` for display/headings, `Syne` for labels and navigation, `Outfit` for body and data.

### Console helpers (exposed globally)

```js
exportData()        // downloads JSON backup
importData(json)    // restores from JSON string
exportCSV()         // downloads marca × requisito × status CSV
resetData()         // wipes to initial seed state
```

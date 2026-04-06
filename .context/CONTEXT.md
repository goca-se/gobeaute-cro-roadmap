# Domain Context

## Overview

Internal tool for the Gobeaute group (7 beauty brands) to track CRO (Conversion Rate Optimisation) methodology progress. Each brand moves through a structured set of phases, sections, and requirements. The team at Gobeaute uses this to visualise which brands are ahead, which tasks are blocked, and who owns what.

## Domain

### Core Entities

| Entity | Responsibility |
|--------|----------------|
| `Phase` | Top-level milestone (e.g., "Foundation", "Optimisation"). Contains ordered sections. |
| `Section` | Grouping of requirements within a phase (e.g., "Analytics Setup"). |
| `Requirement` | Atomic task/checklist item with an ID, label, and tooltip. |
| `Task` | A brand × requirement cell: `{ status, assignee, deadline, description, priority, customTitle }` |
| `Brand` | One of the beauty brands tracked (e.g., Ápice, Barbour's, Lescent). |
| `ActivityLog` | Append-only list of status change events for auditing. |
| `AppSettings` | Group-level config: name, logo, Metabase connection, status labels, responsible areas. |
| `BrandSettings` | Per-brand config: logo, links (GA4, Shopify, Drive), Metabase card IDs. |

### Modules/Packages

```
src/
├── data/           # Static constants and initial seed data
│   ├── phases.js        # PHASES + BRANDS — canonical data model
│   ├── initialData.js   # Pre-seeded task statuses for some brands
│   ├── initialNotes.js  # Pre-seeded notes per brand/section
│   └── statusConfig.js  # STATUS_ORDER, STATUS_CONFIG, PRIORITY_CONFIG, RESPONSIBLE_CONFIG
├── hooks/          # Stateful React hooks
│   ├── useCROData.js    # All app state + Supabase sync
│   └── useAuth.js       # Google OAuth via Supabase, domain restriction
├── lib/            # External service clients
│   ├── supabase.js      # Supabase client (null when unconfigured)
│   └── metabase.js      # JWT signing + embedded dashboard/card fetching
├── utils/          # Pure functions
│   ├── stats.js         # Progress calculations (global, per-phase, per-brand)
│   └── mergePhases.js   # Merges Supabase phase overrides with built-in PHASES
└── components/     # View components (one per route + shared UI)
```

## Architecture

### System Overview

Frontend-only SPA (React 18 + Vite + Tailwind). No custom backend — all persistence is either `localStorage` (always) or Supabase Postgres (when env vars are present). The app gracefully degrades to offline/local-only mode when Supabase is not configured.

### Directory Structure

```
cro-roadmap/
├── src/
│   ├── App.jsx          # Route shell, view switching via pushState
│   ├── main.jsx         # React entry point
│   ├── index.css        # CSS variables (design tokens) + global styles
│   ├── data/            # Static constants and seed data
│   ├── hooks/           # useCROData (state) + useAuth (auth)
│   ├── lib/             # supabase.js + metabase.js
│   ├── utils/           # stats.js + mergePhases.js
│   └── components/      # Dashboard, BrandView, MatrixView, AnalyticsView, SettingsView, ActivityLog, Header, LoginScreen, ...
├── .context/            # dotcontext AI context docs
├── .claude/             # Claude Code commands, agents, skills, settings
├── CLAUDE.md            # AI assistant guidance
├── .mcp.json            # MCP server config (context7 + Atlassian)
├── package.json
└── vite.config.js
```

### Key Dependencies

| Category | Dependency | Purpose |
|----------|-----------|---------|
| Framework | React 18 | UI rendering |
| Build | Vite 5 | Dev server + bundler |
| Styling | Tailwind CSS 3 | Utility-first layout/spacing |
| Backend | @supabase/supabase-js | Auth + Postgres sync (optional) |
| Crypto | Web Crypto API (browser built-in) | JWT signing for Metabase embeds |

No test framework configured.

### Data Flow

```
localStorage ──┐
               ├──► useCROData (useState) ──► App.jsx ──► View components
Supabase DB ───┘         │
                         └──► writes back to both stores on mutation

Auth flow (when Supabase configured):
  Google OAuth ──► useAuth ──► supabase.auth ──► session stored in localStorage
  Domain check (gobeaute.com.br | gocase.com) ──► sign out if not allowed

Metabase flow:
  appSettings.metabase config ──► lib/metabase.js (JWT sign) ──► Metabase embed iframe / card fetch
```

## Conventions

### Naming Patterns

- Files: `camelCase.js` / `PascalCase.jsx` for components
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` (e.g., `BRANDS`, `STATUS_ORDER`, `DEFAULT_TASK`)
- IDs in data: `kebab-case` (e.g., `'apice'`, `'phase-1'`, `'section-analytics'`)

### Error Handling

Minimal — external calls (Supabase, Metabase) use `.catch(console.error)` or try/catch with `null` fallback. No custom error classes or boundaries.

### Testing Style

No test framework. No tests. Not applicable.

### Import Organization

React imports first, then internal imports grouped by depth (components → hooks → utils → data → lib). No strict enforced ordering.

### State Management

Single hook (`useCROData`) owns all app state via `useState`. No Redux, no Context API for data. `mergedPhases` is derived via `useMemo`. Settings and tasks are plain objects stored in one large state blob.

### API Response Format

No custom API. Supabase returns standard Postgres row objects. Metabase returns `{ data: { rows: [[val]] } }` or `[[val]]` depending on endpoint.

## Main Flows

### Task Status Update

```
User clicks status badge in BrandView or MatrixView
  → updateTask(brandId, reqId, { status: nextStatus })
    → useCROData mutates local state
    → persists to localStorage
    → if Supabase configured: upserts to `tasks` table
    → appends entry to activityLog (localStorage + Supabase)
```

### Authentication (Supabase mode)

```
App loads → useAuth checks supabase.auth.getSession()
  → No session: show LoginScreen
  → User clicks "Sign in with Google" → supabase.auth.signInWithOAuth()
  → Callback: domain check (gobeaute.com.br or gocase.com)
    → Allowed: setUser, load data
    → Blocked: signOut, show error
```

### mergedPhases Resolution

```
useCROData loads `phases` + `sections` rows from Supabase
  → getMergedPhases(phasesData, sectionsData)
    → sorts by sort_order
    → overlays Supabase labels/order on built-in PHASES constant
    → custom phases get cycling color palette
  → returned as `mergedPhases`, passed to all views
```

## External Integrations

| System | Type | Description |
|--------|------|-------------|
| Supabase | Postgres + OAuth | Optional backend for auth + cloud sync |
| Google OAuth | OAuth 2.0 via Supabase | Single sign-on, domain-restricted |
| Metabase | JWT-embedded iframe + REST | Embedded dashboards and per-brand KPI cards |

## Glossary

| Term | Definition |
|------|------------|
| **CRO** | Conversion Rate Optimisation — the methodology being tracked |
| **Phase** | A major milestone stage in the CRO methodology |
| **Requirement** | An atomic checklist item within a section |
| **Task** | The state of one requirement for one specific brand |
| **mergedPhases** | The final phase structure after overlaying Supabase customisations on the built-in constants |
| **Brand** | One of the Gobeaute group's beauty e-commerce stores |
| **Metabase card** | A single saved question/chart in Metabase, referenced by numeric ID |
| **isConfigured** | `true` when Supabase env vars are present; gates auth and cloud sync |

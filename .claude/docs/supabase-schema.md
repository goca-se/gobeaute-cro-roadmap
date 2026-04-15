# Supabase Database Schema

Reference documentation for the Supabase PostgreSQL schema used by the CRO Roadmap app.

> **Note:** This schema is for context only. Table order and constraints may not reflect exact migration order.

## Entity Relationship Overview

```
brands (brand_id PK)
  ├── brand_tasks (id PK, brand_id FK → brands, section_id FK → sections)
  ├── brand_settings (brand_id PK/FK)
  └── brand_ui_state (brand_id PK)

phases (phase_id PK)
  └── sections (section_id PK, phase_id FK → phases)
        └── phase_tasks (id PK, phase_id, section_id)

app_settings (id PK, singleton 'main')
global_ui_state (id PK, singleton 'main')
activity_log (id PK)
cro_data (id PK) — legacy JSON blob fallback
profiles (id PK/FK → auth.users)
```

## Tables

### `brands`

Registry of all brands tracked by the app.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `brand_id` | text | — | **PK**. Slug identifier (e.g. `apice`, `kokeshi`) |
| `brand_name` | text | — | Display name |

**Active brands:** apice, barbours, kokeshi, rituaria, lescent (aua, bysamia hidden in UI)

---

### `phases`

Top-level grouping of CRO methodology phases. Customizable labels/order/emoji via UI.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `phase_id` | text | — | **PK**. e.g. `phase_1`, `phase_2`, `phase_3` |
| `label` | text | — | Display name |
| `sort_order` | integer | — | Ordering position |
| `emoji` | text | `''` | Optional emoji prefix |

---

### `sections`

Sub-groups within phases. Each section contains requirements/tasks.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `section_id` | text | — | **PK** |
| `phase_id` | text | — | **FK → phases.phase_id** |
| `label` | text | — | Display name |
| `sort_order` | integer | — | Ordering within phase |
| `emoji` | text | `''` | Optional emoji prefix |

---

### `brand_tasks`

Per-brand task state. Each row = one brand's status for a requirement or custom task.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | text | — | **PK**. UUID or generated ID |
| `brand_id` | text | — | **FK → brands.brand_id** |
| `section_id` | text | — | **FK → sections.section_id** (nullable for legacy) |
| `title` | text | `''` | Custom task title (empty for built-in requirements) |
| `status` | text | `'pending'` | One of: `pending`, `in_progress`, `waiting_client`, `validating`, `done` |
| `assignee` | text | — | Responsible person name |
| `deadline` | timestamptz | — | Due date |
| `priority` | text | — | `high`, `medium`, `low`, or null |
| `description` | text | — | HTML/markdown content (may contain `<img>` tags) |
| `sort_order` | integer | `0` | Ordering within section |
| `is_hidden` | boolean | `false` | Soft-hide from brand view |
| `updated_at` | timestamptz | `now()` | Last modification |

---

### `phase_tasks`

Global phase-level custom tasks visible to **all brands**. Synced bidirectionally with `brand_tasks` when created.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | text | `'CRO-' \|\| lpad(nextval(...), 3, '0')` | **PK**. Auto-generated `CRO-001` format |
| `phase_id` | text | — | Phase this task belongs to |
| `section_id` | text | — | Section within the phase |
| `label` | text | `''` | Task name/title |
| `tooltip` | text | — | Help text |
| `description` | text | — | Detailed description |
| `priority` | text | — | `high`, `medium`, `low`, or null |
| `sort_order` | integer | `0` | Ordering within section |
| `updated_at` | timestamptz | `now()` | Last modification |

**Key behavior:** When a `phase_task` is created, the app creates corresponding `brand_tasks` entries for all brands. This bidirectional sync prevents duplication.

---

### `brand_settings`

Per-brand configuration (logo, external links, Metabase card mappings).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `brand_id` | text | — | **PK** |
| `logo_url` | text | `''` | Brand logo URL |
| `custom_name` | text | `''` | Display name override |
| `custom_segment` | text | `''` | Brand segment label |
| `links` | jsonb | `{"ga4":"","drive":"","shopify":"","storeUrl":""}` | External tool URLs |
| `metabase_cards` | jsonb | `{"aov":null,"cvr":null,"rpv":null,"revenue":null,"sessions":null}` | Metabase card IDs for metrics |

---

### `app_settings`

Singleton row (`id = 'main'`) for global app configuration.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | text | `'main'` | **PK**. Always `'main'` |
| `group_name` | text | `'Gobeaute'` | Organization display name |
| `logo_url` | text | `''` | Organization logo |
| `metabase` | jsonb | `{"apiKey":"","baseUrl":"","embedSecret":"","embedDashboardId":""}` | Metabase connection config |
| `status_labels` | jsonb | `{}` | Custom display labels for statuses |
| `responsible_areas` | jsonb | `[]` | Team/area definitions with colors |
| `updated_at` | timestamptz | `now()` | Last modification |

---

### `brand_ui_state`

Per-brand UI preferences (hidden tasks, ordering).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `brand_id` | text | — | **PK** |
| `hidden_tasks` | text[] | `'{}'` | Array of hidden task IDs |
| `task_order` | jsonb | `'{}'` | `{ sectionId: [reqId, ...] }` custom ordering |
| `matrix_order` | jsonb | `'{}'` | Matrix view ordering overrides |

---

### `global_ui_state`

Singleton row (`id = 'main'`) for shared UI state across all brands.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | text | `'main'` | **PK**. Always `'main'` |
| `phase_hidden_tasks` | text[] | `'{}'` | Phase-level hidden task IDs |
| `phase_task_order` | jsonb | `'{}'` | Phase-level task ordering |
| `phase_titles` | jsonb | `'{}'` | Phase title overrides |
| `phase_notes` | jsonb | `'{}'` | Phase description/notes (HTML) |
| `matrix_titles` | jsonb | `'{}'` | Matrix view title overrides |

---

### `activity_log`

Append-only audit trail of status changes.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | text | — | **PK** |
| `timestamp` | timestamptz | `now()` | When the change occurred |
| `brand_id` | text | — | Which brand |
| `brand_name` | text | — | Brand display name (denormalized) |
| `req_id` | text | — | Task/requirement ID |
| `req_label` | text | — | Task label at time of change (denormalized) |
| `old_status` | text | — | Previous status |
| `new_status` | text | — | New status |

---

### `cro_data`

Legacy fallback table storing the full app state as a JSON blob. Used during migration; the relational tables above are the primary source.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | text | — | **PK** |
| `data` | jsonb | `'{}'` | Full state JSON |
| `updated_at` | timestamptz | `now()` | Last modification |

---

### `profiles`

User profiles linked to Supabase Auth.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | — | **PK**, **FK → auth.users.id** |
| `email` | text | — | User email |
| `full_name` | text | — | Display name |
| `avatar_url` | text | — | Profile picture |
| `role` | text | `'member'` | User role (`member`, etc.) |
| `created_at` | timestamptz | `now()` | Account creation |
| `last_login` | timestamptz | `now()` | Most recent login |

---

## Storage Buckets

### `task-images`

Public bucket for task description image attachments.

**Path pattern:** `tasks/{brandId}/{reqId}/{uid}.webp`

**RLS policies:**
- SELECT: public read
- INSERT: authenticated users only
- DELETE: authenticated users only

---

## Data Flow: App ↔ Supabase

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  localStorage│◄───►│  useCROData  │◄───►│    Supabase      │
│  (instant)   │     │  (hook)      │     │  (async sync)    │
└─────────────┘     └──────────────┘     └─────────────────┘
                          │
                    Reads from 7 tables:
                    • brand_tasks
                    • phase_tasks
                    • brand_settings
                    • app_settings
                    • brand_ui_state
                    • global_ui_state
                    • activity_log

                    Also reads:
                    • phases (structure)
                    • sections (structure)
```

**Sync strategy:** Dual-write — mutations immediately update localStorage, then fire-and-forget upsert to Supabase. On load, Supabase data takes precedence over localStorage.

---

## Status Values

Used across `brand_tasks.status` and `activity_log.old_status/new_status`:

| Value | Description |
|-------|-------------|
| `pending` | Not started |
| `in_progress` | Currently being worked on |
| `waiting_client` | Blocked, waiting on client action |
| `validating` | Implementation complete, under review |
| `done` | Completed |

Cycle order: `pending → in_progress → waiting_client → validating → done`

---

## Sequences

- `phase_tasks_id_seq` — auto-incrementing sequence for `phase_tasks.id` (generates `CRO-001`, `CRO-002`, etc.)

---

## A/B Testing Tables (Elevate Integration)

### `ab_tests`

Master registry of A/B tests from Elevate platform. Updated via MCP sync (cron or manual).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | text | — | **PK** (composite with brand_id). Elevate test UUID |
| `brand_id` | text | — | **PK**, **FK → brands.brand_id** |
| `name` | text | `''` | Test name from Elevate |
| `type` | text | — | THEME, CUSTOM_CODE, PAGE, PRODUCT_TEST, etc. |
| `status` | text | `'running'` | running, paused, done, draft (normalized lowercase) |
| `goal` | text | `'REVENUE_PER_VISITOR'` | Primary metric for the test |
| `winner_variation_id` | text | — | Winning variation ID (from significance data) |
| `winner_variation_name` | text | — | Winning variation name |
| `is_winner` | boolean | `false` | True if a non-control variant won |
| `started_at` | timestamptz | — | Test start date |
| `finished_at` | timestamptz | — | Test end date (null if running) |
| `traffic_percentage` | integer | — | Traffic allocation (null = 50/50) |
| `control_*` | numeric/int | — | Control metrics: cr, rpv, aov, revenue, visitors, sessions, conversions, add_to_cart_rate, checkout_start_rate |
| `variant_*` | numeric/int | — | Variant metrics (same set as control) + variation_id, variation_name |
| `lift_cr_pct` | numeric | — | CR lift percentage |
| `lift_rpv_pct` | numeric | — | RPV lift percentage |
| `lift_aov_pct` | numeric | — | AOV lift percentage (calculated) |
| `statistical_status` | text | — | "Significant" or "Not Significant" |
| `statistical_significance` | jsonb | — | Full significance JSON from Elevate |
| `raw_list_data` | jsonb | — | Raw list_tests response |
| `raw_results_data` | jsonb | — | Raw get_test_results response |
| `raw_significance_data` | jsonb | — | Raw get_statistical_significance response |
| `last_synced_at` | timestamptz | `now()` | Last MCP sync timestamp |
| `created_at` | timestamptz | `now()` | First seen |
| `updated_at` | timestamptz | `now()` | Last modification |

---

### `ab_test_snapshots`

Historical metric snapshots captured at each sync (2x/day).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | serial | — | **PK** |
| `test_id` | text | — | **FK → ab_tests(id, brand_id)** |
| `brand_id` | text | — | **FK** |
| `control_cr/rpv/aov/revenue` | numeric | — | Control metrics at collection time |
| `control_visitors` | integer | — | Control visitors at collection time |
| `variant_cr/rpv/aov/revenue` | numeric | — | Variant metrics at collection time |
| `variant_visitors` | integer | — | Variant visitors at collection time |
| `lift_cr_pct/rpv_pct/aov_pct` | numeric | — | Lifts at collection time |
| `statistical_status` | text | — | Significance at collection time |
| `collected_at` | timestamptz | `now()` | When this snapshot was taken |

---

### `ab_test_notes`

User annotations per test (comments, tags, learnings).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | serial | — | **PK** |
| `test_id` | text | — | **FK → ab_tests(id, brand_id)** |
| `brand_id` | text | — | **FK** |
| `content` | text | `''` | Note text |
| `tags` | text[] | `'{}'` | Free-form tags |
| `author` | text | — | Who wrote the note |
| `created_at` | timestamptz | `now()` | Creation time |
| `updated_at` | timestamptz | `now()` | Last edit time |

---

### `ab_sync_log`

Audit trail of sync executions (cron and manual).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | serial | — | **PK** |
| `brand_id` | text | — | Which brand was synced |
| `trigger_type` | text | `'cron'` | 'cron' or 'manual' |
| `tests_fetched` | integer | `0` | Tests found in MCP |
| `tests_updated` | integer | `0` | Tests upserted |
| `tests_skipped` | integer | `0` | Tests skipped (done >3 days) |
| `errors` | jsonb | `'[]'` | Error/warning messages |
| `started_at` | timestamptz | `now()` | Sync start |
| `finished_at` | timestamptz | — | Sync end |
| `status` | text | `'running'` | running, success, partial, error |

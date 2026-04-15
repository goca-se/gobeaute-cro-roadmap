# Data Flow & State Architecture

How data moves through the CRO Roadmap application.

## State Ownership

All app state lives in `src/hooks/useCROData.js`. No other component or hook owns state — they receive it as props and call mutation functions.

## In-Memory State Shape

```js
{
  // Core task data
  tasks: {
    [brandId]: {
      [reqId]: {
        status: 'pending' | 'in_progress' | 'waiting_client' | 'validating' | 'done',
        assignee: string | null,
        deadline: 'YYYY-MM-DD' | null,
        description: string | null,      // HTML content, may include <img> tags
        priority: 'high' | 'medium' | 'low' | null,
        customTitle: string | null        // overrides requirement label
      }
    }
  },

  // Brand-specific custom tasks (not in built-in phases.js)
  customTasks: {
    [brandId]: {
      [sectionId]: [{ id, title, status, assignee, deadline, description, priority }]
    }
  },

  // Phase-level custom tasks (visible to ALL brands)
  phaseCustomTasks: {
    [sectionId]: [{ id, label, tooltip, description, priority, sort_order }]
  },

  // UI ordering
  taskOrder: { [brandId]: { [sectionId]: [reqId, ...] } },
  matrixOrder: { [reqId]: sortIndex },
  phaseTaskOrder: { [sectionId]: [taskId, ...] },

  // Hidden items
  hiddenTasks: { [brandId]: [reqId, ...] },
  phaseHiddenTasks: [taskId, ...],

  // Display overrides
  matrixTitles: { [reqId]: string },
  phaseTitles: { [phaseId]: string },
  phaseNotes: { [phaseId]: string },

  // Settings
  brandSettings: { [brandId]: { logoUrl, customName, customSegment, links, metabaseCards } },
  appSettings: { groupName, logoUrl, metabase, statusLabels, responsibleAreas },

  // Metrics cache
  brandMetrics: { [brandId]: { cvr, aov, rpv, sessions, revenue, updatedAt } },

  // Internal mappings
  taskDbIds: { [brandId]: { [reqId]: supabaseId } },

  // Structure overrides from Supabase
  phasesData: [{ phase_id, label, emoji, sort_order }],
  sectionsData: [{ section_id, phase_id, label, emoji, sort_order }]
}
```

## Persistence Layer

### localStorage Keys

| Key | Contents |
|-----|----------|
| `gobeaute_cro_data` | Full state JSON (tasks, customTasks, settings, etc.) |
| `gobeaute_cro_log` | Activity log entries |

### Supabase Tables (when configured)

The hook reads from 9 tables on initial load and writes to them on every mutation:

| Table | State field(s) |
|-------|---------------|
| `brand_tasks` | `tasks`, `customTasks`, `taskDbIds` |
| `phase_tasks` | `phaseCustomTasks` |
| `phases` | `phasesData` |
| `sections` | `sectionsData` |
| `brand_settings` | `brandSettings` |
| `app_settings` | `appSettings` |
| `brand_ui_state` | `hiddenTasks`, `taskOrder`, `matrixOrder` |
| `global_ui_state` | `phaseHiddenTasks`, `phaseTaskOrder`, `phaseTitles`, `phaseNotes`, `matrixTitles` |
| `activity_log` | `activityLog` |

### Sync Strategy

1. **On mount:** Load localStorage instantly → render UI → fetch Supabase in background → merge (Supabase wins)
2. **On mutation:** Update React state → write localStorage (sync) → upsert Supabase (async, fire-and-forget)
3. **Conflict resolution:** Last-write-wins; Supabase data takes precedence on load

## mergedPhases Pipeline

Views never consume raw `PHASES` from `src/data/phases.js`. Instead:

```
PHASES (built-in)  +  phasesData/sectionsData (Supabase overrides)
         │                        │
         └──── getMergedPhases() ─┘
                      │
              mergedPhases (passed to all views)
```

`getMergedPhases()` in `src/utils/mergePhases.js`:
- Preserves visual metadata (colors, durations) from built-in constants
- Overlays custom labels, emoji, sort_order from Supabase
- Inserts entirely custom phases/sections not in built-in data
- Auto-assigns cycling color palette to custom phases

## Mutation Flow Example

```
User clicks status badge
  → BrandView calls updateTask(brandId, reqId, { status: 'in_progress' })
    → useCROData updates React state
    → Writes to localStorage['gobeaute_cro_data']
    → Appends to activityLog
    → Upserts brand_tasks row in Supabase
    → Inserts activity_log row in Supabase
    → Updates syncState / lastSynced
```

## Image Upload Flow

```
User pastes/selects image in RichTextEditor
  → validateImageFile() — checks type + size (2MB max)
  → compressImage() — resize to max 1920px, convert to WebP
  → uploadImage()
    ├── Supabase mode: upload to task-images bucket → public URL
    └── localStorage mode: convert to base64 data URL
  → Insert <img src="..."> into description HTML
  → Save via updateTask(brandId, reqId, { description })
```

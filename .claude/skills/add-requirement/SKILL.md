# Skill: Adding a New Requirement or Brand

## Adding a Requirement

1. Open `src/data/phases.js`
2. Locate the correct phase → section and add an entry to `requirements`:

```js
{
  id: 'unique-kebab-id',      // must be globally unique across all phases
  label: 'Requirement label',
  tooltip: 'Detailed explanation shown on hover',
}
```

3. Optionally seed an initial status for specific brands in `src/data/initialData.js`:

```js
INITIAL_STATUSES['apice']['unique-kebab-id'] = 'done'
```

4. No other files need updating — `useCROData` auto-initialises unknown req IDs to `'pending'` for all brands on next load.

## Adding a Brand

1. Open `src/data/phases.js` and add to the `BRANDS` array:

```js
{ id: 'brand-id', name: 'Brand Name', segment: 'Segment description' }
```

2. Optionally seed initial statuses in `src/data/initialData.js`:

```js
INITIAL_STATUSES['brand-id'] = {
  'some-req-id': 'done',
  // ...
}
```

## Adding a Custom Phase (via Settings UI)

Custom phases are created through the Settings view at runtime — they are stored in Supabase and do not require code changes. The `getMergedPhases` utility assigns them colours from `CUSTOM_PHASE_COLORS` in `src/utils/mergePhases.js`.

If you need to add a built-in phase (checked into git), also add its visual metadata to the `PHASE_META` lookup in `src/utils/mergePhases.js`.

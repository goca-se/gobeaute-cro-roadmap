import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { PHASES, BRANDS } from '../data/phases'
import { INITIAL_STATUSES } from '../data/initialData'
import { INITIAL_NOTES } from '../data/initialNotes'
import { supabase, isConfigured } from '../lib/supabase'
import { getMergedPhases } from '../utils/mergePhases'

const STORAGE_KEY = 'gobeaute_cro_data'
const LOG_KEY = 'gobeaute_cro_log'

export const DEFAULT_TASK = {
  status: 'pending',
  assignee: null,
  deadline: null,
  description: '',
  priority: null,
  customTitle: null,
}

const DEFAULT_BRAND_SETTINGS = {
  logoUrl: '',
  customName: '',
  customSegment: '',
  links: { ga4: '', storeUrl: '', shopify: '', drive: '' },
  metabaseCards: { cvr: null, aov: null, rpv: null, sessions: null, revenue: null },
}

const DEFAULT_APP_SETTINGS = {
  groupName: 'Gobeaute',
  logoUrl: '',
  metabase: { baseUrl: '', apiKey: '', embedSecret: '', embedDashboardId: '' },
  statusLabels: {
    pending: 'Pendente',
    in_progress: 'Em progresso',
    waiting_client: 'Esp. cliente',
    validating: 'Em validação',
    done: 'Finalizado',
  },
  responsibleAreas: [
    { id: 'growth', label: 'Growth', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    { id: 'marketing', label: 'Marketing', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { id: 'tech', label: 'Tech', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  ],
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  const result = { ...obj }
  let curr = result
  for (let i = 0; i < keys.length - 1; i++) {
    curr[keys[i]] = { ...(curr[keys[i]] || {}) }
    curr = curr[keys[i]]
  }
  curr[keys[keys.length - 1]] = value
  return result
}

function ensureBrandSettings(brandSettings) {
  const result = { ...brandSettings }
  BRANDS.forEach(brand => {
    if (!result[brand.id]) {
      result[brand.id] = { ...DEFAULT_BRAND_SETTINGS, links: { ...DEFAULT_BRAND_SETTINGS.links }, metabaseCards: { ...DEFAULT_BRAND_SETTINGS.metabaseCards } }
    } else {
      if (!result[brand.id].links) result[brand.id].links = { ...DEFAULT_BRAND_SETTINGS.links }
      else if (result[brand.id].links.storeUrl == null) result[brand.id].links = { ...DEFAULT_BRAND_SETTINGS.links, ...result[brand.id].links }
    }
  })
  return result
}

function patchAppSettings(settings) {
  if (!settings) return { ...DEFAULT_APP_SETTINGS }
  const s = { ...DEFAULT_APP_SETTINGS, ...settings }
  if (!s.metabase) s.metabase = { ...DEFAULT_APP_SETTINGS.metabase }
  else s.metabase = { baseUrl: s.metabase.baseUrl || '', apiKey: s.metabase.apiKey || '', embedSecret: s.metabase.embedSecret || '', embedDashboardId: s.metabase.embedDashboardId || '' }
  if (!s.statusLabels) s.statusLabels = { ...DEFAULT_APP_SETTINGS.statusLabels }
  if (!s.responsibleAreas || !s.responsibleAreas.length) s.responsibleAreas = [...DEFAULT_APP_SETTINGS.responsibleAreas]
  return s
}

function buildDefaultTasks() {
  const tasks = {}
  BRANDS.forEach(brand => {
    tasks[brand.id] = {}
    const initial = INITIAL_STATUSES[brand.id] || {}
    PHASES.forEach(phase => {
      phase.sections.forEach(section => {
        section.requirements.forEach(req => {
          tasks[brand.id][req.id] = { ...DEFAULT_TASK, status: initial[req.id] || 'pending' }
        })
      })
    })
  })
  return tasks
}

function migrateIfNeeded(stored) {
  if (stored.tasks) return stored
  if (!stored.statuses) return null
  const tasks = {}
  BRANDS.forEach(brand => {
    tasks[brand.id] = {}
    PHASES.forEach(phase => {
      phase.sections.forEach(section => {
        section.requirements.forEach(req => {
          tasks[brand.id][req.id] = { ...DEFAULT_TASK, status: stored.statuses[brand.id]?.[req.id] || 'pending' }
        })
      })
    })
  })
  return { lastUpdated: stored.lastUpdated || new Date().toISOString(), tasks, customTasks: {}, taskOrder: {}, hiddenTasks: {}, matrixTitles: {}, matrixOrder: {}, phaseCustomTasks: {}, phaseTaskOrder: {}, phaseHiddenTasks: [] }
}

function ensureAllReqs(tasks, phaseCustomTasks = {}) {
  BRANDS.forEach(brand => {
    if (!tasks[brand.id]) tasks[brand.id] = {}
    PHASES.forEach(phase => {
      phase.sections.forEach(section => {
        section.requirements.forEach(req => {
          if (!tasks[brand.id][req.id]) tasks[brand.id][req.id] = { ...DEFAULT_TASK }
        })
        ;(phaseCustomTasks[section.id] || []).forEach(ct => {
          if (!tasks[brand.id][ct.id]) tasks[brand.id][ct.id] = { ...DEFAULT_TASK }
        })
      })
    })
  })
  return tasks
}

function seedMissingNotes(data) {
  BRANDS.forEach(brand => {
    PHASES.forEach(phase => {
      phase.sections.forEach(section => {
        section.requirements.forEach(req => {
          const task = data.tasks?.[brand.id]?.[req.id]
          if (task && !task.description && INITIAL_NOTES[req.id]) {
            task.description = INITIAL_NOTES[req.id]
          }
        })
      })
    })
  })
  return data
}

// Supabase returns date columns as ISO timestamps ("2026-04-15T00:00:00+00:00").
// <input type="date"> requires "yyyy-MM-dd" — slice to just the date part.
function normalizeDeadline(value) {
  if (!value) return null
  return String(value).slice(0, 10)
}

function findReqLabel(reqId) {
  for (const phase of PHASES) {
    for (const section of phase.sections) {
      const req = section.requirements.find(r => r.id === reqId)
      if (req) return req.label
    }
  }
  return reqId
}

function getSectionIdForReqOrPhaseTask(reqId, phaseCustomTasks) {
  for (const phase of PHASES) {
    for (const section of phase.sections) {
      if (section.requirements.some(r => r.id === reqId)) return section.id
    }
  }
  for (const [sectionId, tasks] of Object.entries(phaseCustomTasks || {})) {
    if (tasks.some(t => t.id === reqId)) return sectionId
  }
  return null
}

function getSortOrderForReq(reqId) {
  for (const phase of PHASES) {
    for (const section of phase.sections) {
      const idx = section.requirements.findIndex(r => r.id === reqId)
      if (idx !== -1) return idx + 1 // 1-based, matches reqBySectionSort in fetchAllTables
    }
  }
  return 0 // phase task or custom task — sort_order not used for matching
}

function nextTaskDbId(brandId, taskDbIds, customTasks) {
  const allBrandIds = Object.values(taskDbIds?.[brandId] || {})
  const customIds = Object.values(customTasks?.[brandId] || {}).flat().map(t => t.id)
  const nums = [...allBrandIds, ...customIds]
    .map(id => { const m = String(id).match(/TASK-[A-Z]+-(\d+)$/i); return m ? parseInt(m[1]) : 0 })
    .filter(n => n > 0)
  const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `TASK-${brandId.toUpperCase()}-${String(nextNum).padStart(3, '0')}`
}

function migrateLegacyTaskFields(tasks) {
  if (!tasks) return tasks
  Object.keys(tasks).forEach(brandId => {
    Object.keys(tasks[brandId] || {}).forEach(reqId => {
      const t = tasks[brandId][reqId]
      if (!t) return
      if ('responsible' in t && !('assignee' in t)) { t.assignee = t.responsible; delete t.responsible }
      if ('notes' in t && !('description' in t)) { t.description = t.notes; delete t.notes }
    })
  })
  return tasks
}

function buildPhasesDataFromConstants() {
  return PHASES.map((phase, idx) => ({
    phase_id: phase.id,
    label: phase.name,
    emoji: '',
    sort_order: idx,
  }))
}

function buildSectionsDataFromConstants() {
  const sections = []
  PHASES.forEach(phase => {
    phase.sections.forEach((section, idx) => {
      sections.push({
        section_id: section.id,
        phase_id: phase.id,
        label: section.name,
        emoji: '',
        sort_order: idx,
      })
    })
  })
  return sections
}

function freshData() {
  return {
    lastUpdated: new Date().toISOString(),
    tasks: buildDefaultTasks(),
    customTasks: {}, taskOrder: {}, hiddenTasks: {},
    matrixTitles: {}, matrixOrder: {},
    phaseCustomTasks: {}, phaseTaskOrder: {}, phaseHiddenTasks: [],
    phaseTitles: {}, phaseNotes: {},
    brandSettings: ensureBrandSettings({}),
    appSettings: { ...DEFAULT_APP_SETTINGS, statusLabels: { ...DEFAULT_APP_SETTINGS.statusLabels }, responsibleAreas: [...DEFAULT_APP_SETTINGS.responsibleAreas] },
    brandMetrics: {},
    taskDbIds: {},
    phasesData: buildPhasesDataFromConstants(),
    sectionsData: buildSectionsDataFromConstants(),
  }
}

function loadLocalData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      let parsed = JSON.parse(raw)
      parsed = migrateIfNeeded(parsed) || freshData()
      if (!parsed.customTasks) parsed.customTasks = {}
      if (!parsed.taskOrder) parsed.taskOrder = {}
      if (!parsed.hiddenTasks) parsed.hiddenTasks = {}
      if (!parsed.matrixTitles) parsed.matrixTitles = {}
      if (!parsed.matrixOrder) parsed.matrixOrder = {}
      if (!parsed.phaseCustomTasks) parsed.phaseCustomTasks = {}
      if (!parsed.phaseTaskOrder) parsed.phaseTaskOrder = {}
      if (!parsed.phaseHiddenTasks) parsed.phaseHiddenTasks = []
      if (!parsed.phaseTitles) parsed.phaseTitles = {}
      if (!parsed.phaseNotes) parsed.phaseNotes = {}
      if (!parsed.brandSettings) parsed.brandSettings = {}
      parsed.brandSettings = ensureBrandSettings(parsed.brandSettings)
      parsed.appSettings = patchAppSettings(parsed.appSettings)
      if (!parsed.brandMetrics) parsed.brandMetrics = {}
      if (!parsed.taskDbIds) parsed.taskDbIds = {}
      if (!parsed.phasesData || !parsed.phasesData.length) parsed.phasesData = buildPhasesDataFromConstants()
      if (!parsed.sectionsData || !parsed.sectionsData.length) parsed.sectionsData = buildSectionsDataFromConstants()
      migrateLegacyTaskFields(parsed.tasks)
      parsed.tasks = ensureAllReqs(parsed.tasks, parsed.phaseCustomTasks)
      seedMissingNotes(parsed)
      return parsed
    }
  } catch {}
  return freshData()
}

function getPhaseIdForSection(sectionId) {
  for (const phase of PHASES) {
    for (const section of phase.sections) {
      if (section.id === sectionId) return `phase${phase.number}`
    }
  }
  return 'phase1'
}

async function fetchAllTables() {
  const [ptRes, btRes, bsRes, asRes, buiRes, guiRes, logRes, phRes, secRes] = await Promise.all([
    supabase.from('phase_tasks').select('*').order('sort_order'),
    supabase.from('brand_tasks').select('*').order('sort_order'),
    supabase.from('brand_settings').select('*'),
    supabase.from('app_settings').select('*').eq('id', 'main').maybeSingle(),
    supabase.from('brand_ui_state').select('*'),
    supabase.from('global_ui_state').select('*').eq('id', 'main').maybeSingle(),
    supabase.from('activity_log').select('*').order('timestamp', { ascending: false }).limit(200),
    supabase.from('phases').select('*').order('sort_order'),
    supabase.from('sections').select('*').order('sort_order'),
  ])

  for (const res of [ptRes, btRes, bsRes, buiRes, guiRes, logRes]) {
    if (res.error) throw res.error
  }
  if (asRes.error) throw asRes.error

  // Build lookup: section_id:sort_order → req_id (1-based, standard tasks from phases.js)
  const reqBySectionSort = {}
  PHASES.forEach(phase => {
    phase.sections.forEach(section => {
      section.requirements.forEach((req, idx) => {
        reqBySectionSort[`${section.id}:${idx + 1}`] = req.id
      })
    })
  })

  // Build set of phase task UUIDs (for linking phase task brand rows)
  const phaseTaskIdSet = new Set((ptRes.data || []).map(r => r.id))

  // Assemble tasks from brand_tasks rows (new schema: id, brand_id, section_id, title, description, assignee)
  const tasks = buildDefaultTasks()
  const customTasks = {}
  const taskDbIds = {}

  // Detect schema: new schema uses 'description'/'assignee', old uses 'notes'/'responsible'
  const sampleRow = (btRes.data || [])[0]
  const hasNewSchema = sampleRow ? ('description' in sampleRow || 'assignee' in sampleRow || !('task_type' in sampleRow)) : true

  ;(btRes.data || []).forEach(row => {
    if (!hasNewSchema) {
      // Legacy schema fallback: task_type / req_id columns still present
      if (row.task_type === 'standard' || row.task_type === 'phase') {
        if (!tasks[row.brand_id]) tasks[row.brand_id] = {}
        tasks[row.brand_id][row.req_id] = {
          status: row.status || 'pending',
          assignee: row.responsible || row.assignee || null,
          deadline: normalizeDeadline(row.deadline),
          description: row.notes || row.description || '',
          priority: row.priority || null,
          customTitle: row.custom_title || null,
        }
      } else if (row.task_type === 'brand_custom') {
        if (!customTasks[row.brand_id]) customTasks[row.brand_id] = {}
        if (!customTasks[row.brand_id][row.section_id]) customTasks[row.brand_id][row.section_id] = []
        customTasks[row.brand_id][row.section_id].push({
          id: row.req_id,
          title: row.title || '',
          status: row.status || 'pending',
          assignee: row.responsible || row.assignee || null,
          deadline: normalizeDeadline(row.deadline),
          description: row.notes || row.description || '',
          priority: row.priority || null,
        })
      }
      return
    }

    // New schema: no task_type / req_id. Distinguish by section_id + sort_order.
    const { id, brand_id, section_id, title, description, assignee, status, priority, deadline, sort_order } = row

    // 1. Standard task: sort_order > 0 and matches a known requirement position
    const reqIdBySort = (sort_order > 0) ? reqBySectionSort[`${section_id}:${sort_order}`] : null
    if (reqIdBySort) {
      if (!tasks[brand_id]) tasks[brand_id] = {}
      tasks[brand_id][reqIdBySort] = {
        status: status || 'pending',
        assignee: assignee || null,
        deadline: normalizeDeadline(deadline),
        description: description || '',
        priority: priority || null,
        customTitle: null,
      }
      if (!taskDbIds[brand_id]) taskDbIds[brand_id] = {}
      taskDbIds[brand_id][reqIdBySort] = id
      return
    }

    // 2. Phase task row: title = UUID of a phase task
    if (phaseTaskIdSet.has(title)) {
      const phaseTaskId = title
      if (!tasks[brand_id]) tasks[brand_id] = {}
      tasks[brand_id][phaseTaskId] = {
        status: status || 'pending',
        assignee: assignee || null,
        deadline: normalizeDeadline(deadline),
        description: description || '',
        priority: priority || null,
        customTitle: null,
      }
      if (!taskDbIds[brand_id]) taskDbIds[brand_id] = {}
      taskDbIds[brand_id][phaseTaskId] = id
      return
    }

    // 3. Brand custom task
    if (!customTasks[brand_id]) customTasks[brand_id] = {}
    if (!customTasks[brand_id][section_id]) customTasks[brand_id][section_id] = []
    customTasks[brand_id][section_id].push({
      id,
      title: title || '',
      status: status || 'pending',
      assignee: assignee || null,
      deadline: normalizeDeadline(deadline),
      description: description || '',
      priority: priority || null,
    })
  })

  // phaseCustomTasks — ALL rows in phase_tasks are custom by definition
  const phaseCustomTasks = {}
  ;(ptRes.data || []).forEach(row => {
    if (!phaseCustomTasks[row.section_id]) phaseCustomTasks[row.section_id] = []
    phaseCustomTasks[row.section_id].push({
      id: row.id, title: row.label, tooltip: row.tooltip || '',
      description: row.description || '', priority: row.priority || null, sort: row.sort_order ?? 0,
    })
    BRANDS.forEach(brand => {
      if (tasks[brand.id] && !tasks[brand.id][row.id]) {
        tasks[brand.id][row.id] = { ...DEFAULT_TASK }
      }
    })
  })

  // brandSettings
  const brandSettings = ensureBrandSettings({})
  ;(bsRes.data || []).forEach(row => {
    brandSettings[row.brand_id] = {
      logoUrl: row.logo_url || '',
      customName: row.custom_name || '',
      customSegment: row.custom_segment || '',
      links: { ...DEFAULT_BRAND_SETTINGS.links, ...(row.links || {}) },
      metabaseCards: { ...DEFAULT_BRAND_SETTINGS.metabaseCards, ...(row.metabase_cards || {}) },
    }
  })

  // appSettings
  const asRow = asRes.data
  const appSettings = patchAppSettings(asRow ? {
    groupName: asRow.group_name,
    logoUrl: asRow.logo_url,
    metabase: asRow.metabase,
    statusLabels: asRow.status_labels,
    responsibleAreas: asRow.responsible_areas,
  } : null)

  // brand_ui_state → hiddenTasks, taskOrder, matrixOrder
  const hiddenTasks = {}
  const taskOrder = {}
  const matrixOrder = {}
  ;(buiRes.data || []).forEach(row => {
    hiddenTasks[row.brand_id] = row.hidden_tasks || []
    taskOrder[row.brand_id] = row.task_order || {}
    matrixOrder[row.brand_id] = row.matrix_order || {}
  })

  // global_ui_state
  const guiRow = guiRes.data || {}
  const phaseHiddenTasks = guiRow.phase_hidden_tasks || []
  const phaseTaskOrder = guiRow.phase_task_order || {}
  const phaseTitles = guiRow.phase_titles || {}
  const phaseNotes = guiRow.phase_notes || {}
  const matrixTitles = guiRow.matrix_titles || {}

  // activity_log
  const log = (logRes.data || []).map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    brandId: row.brand_id,
    brandName: row.brand_name,
    reqId: row.req_id,
    reqLabel: row.req_label,
    oldStatus: row.old_status,
    newStatus: row.new_status,
  }))

  // phases + sections (non-fatal — tables may not exist yet)
  let phasesData = buildPhasesDataFromConstants()
  let sectionsData = buildSectionsDataFromConstants()
  if (!phRes.error && phRes.data !== null) {
    if (phRes.data.length > 0) {
      phasesData = phRes.data.map(r => ({
        phase_id: r.phase_id,
        label: r.label,
        emoji: r.emoji || '',
        sort_order: r.sort_order ?? 0,
      }))
    } else {
      // Seed phases table with built-in data
      supabase.from('phases').insert(phasesData.map(p => ({
        phase_id: p.phase_id, label: p.label, emoji: p.emoji, sort_order: p.sort_order,
      }))).then(() => {})
    }
  }
  if (!secRes.error && secRes.data !== null) {
    if (secRes.data.length > 0) {
      sectionsData = secRes.data.map(r => ({
        section_id: r.section_id,
        phase_id: r.phase_id,
        label: r.label,
        emoji: r.emoji || '',
        sort_order: r.sort_order ?? 0,
      }))
    } else {
      // Seed sections table with built-in data
      supabase.from('sections').insert(sectionsData.map(s => ({
        section_id: s.section_id, phase_id: s.phase_id, label: s.label, emoji: s.emoji, sort_order: s.sort_order,
      }))).then(() => {})
    }
  }

  const data = {
    lastUpdated: new Date().toISOString(),
    tasks,
    customTasks,
    phaseCustomTasks,
    taskOrder,
    hiddenTasks,
    matrixTitles,
    matrixOrder,
    phaseTaskOrder,
    phaseHiddenTasks,
    phaseTitles,
    phaseNotes,
    brandSettings,
    appSettings,
    brandMetrics: {},
    taskDbIds,
    phasesData,
    sectionsData,
  }

  seedMissingNotes(data)
  return { data, log }
}

export function useCROData() {
  const [data, setDataRaw] = useState(loadLocalData)
  const [activityLog, setActivityLog] = useState(() => {
    try { const r = localStorage.getItem(LOG_KEY); if (r) return JSON.parse(r) } catch {}
    return []
  })

  const [syncState, setSyncState] = useState(isConfigured ? 'loading' : 'local')
  const [lastSynced, setLastSynced] = useState(null)
  const dataRef = useRef(data)
  const notesTimerRef = useRef({})
  const realtimeFetchTimerRef = useRef(null)
  const pendingWritesRef = useRef(0)
  const useLegacyBlobRef = useRef(false) // true when new tables aren't ready yet
  const blobPushTimerRef = useRef(null)

  useEffect(() => { dataRef.current = data }, [data])

  const setData = useCallback((newData) => { setDataRaw(newData) }, [])

  // Persist to localStorage on every state change
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data])
  useEffect(() => { localStorage.setItem(LOG_KEY, JSON.stringify(activityLog)) }, [activityLog])

  // Fire-and-forget DB write with sync state tracking
  const dbWrite = useCallback((promise) => {
    if (!supabase) return
    pendingWritesRef.current++
    setSyncState('syncing')
    promise.then(({ error }) => {
      pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1)
      if (error) {
        console.error('[CRO DB] write error:', error)
        setSyncState('error')
      } else if (pendingWritesRef.current === 0) {
        setSyncState('synced')
        setLastSynced(new Date())
      }
    })
  }, [])

  // Apply remote data to state + localStorage
  const applyRemoteData = useCallback((remoteData, remoteLog) => {
    setDataRaw(remoteData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData))
    setActivityLog(remoteLog)
    localStorage.setItem(LOG_KEY, JSON.stringify(remoteLog))
    setSyncState('synced')
    setLastSynced(new Date())
  }, [])

  // ── Supabase: initial fetch from 7 tables (falls back to cro_data blob) ──
  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      // Try new relational tables first
      try {
        const { data: remoteData, log: remoteLog } = await fetchAllTables()
        applyRemoteData(remoteData, remoteLog)
        return
      } catch (e) {
        const msg = e?.message || String(e)
        console.warn('[CRO sync] New tables not ready, falling back to cro_data blob:', msg)
      }

      // Fallback: old single-blob table
      useLegacyBlobRef.current = true
      try {
        const { data: remote, error } = await supabase
          .from('cro_data')
          .select('data, updated_at')
          .eq('id', 'main')
          .maybeSingle()
        if (error) throw error
        if (remote?.data && Object.keys(remote.data).length > 0) {
          const remoteDate = new Date(remote.updated_at)
          const localDate = new Date(dataRef.current.lastUpdated)
          if (remoteDate > localDate) {
            const patched = { ...remote.data }
            if (!patched.customTasks) patched.customTasks = {}
            if (!patched.taskOrder) patched.taskOrder = {}
            if (!patched.hiddenTasks) patched.hiddenTasks = {}
            if (!patched.matrixTitles) patched.matrixTitles = {}
            if (!patched.matrixOrder) patched.matrixOrder = {}
            if (!patched.phaseCustomTasks) patched.phaseCustomTasks = {}
            if (!patched.phaseTaskOrder) patched.phaseTaskOrder = {}
            if (!patched.phaseHiddenTasks) patched.phaseHiddenTasks = []
            if (!patched.phaseTitles) patched.phaseTitles = {}
            if (!patched.phaseNotes) patched.phaseNotes = {}
            if (!patched.brandSettings) patched.brandSettings = {}
            patched.brandSettings = ensureBrandSettings(patched.brandSettings)
            patched.appSettings = patchAppSettings(patched.appSettings)
            if (!patched.brandMetrics) patched.brandMetrics = {}
            patched.tasks = ensureAllReqs(patched.tasks || {}, patched.phaseCustomTasks)
            seedMissingNotes(patched)
            setDataRaw(patched)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(patched))
          }
        }
        setSyncState('synced')
        setLastSynced(new Date())
      } catch (e2) {
        console.error('[CRO sync] Fallback fetch also failed:', e2)
        setSyncState('error')
      }
    })()
  }, [applyRemoteData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Supabase: real-time subscription on brand_tasks + phase_tasks ────
  useEffect(() => {
    if (!supabase) return
    const realtimeHandler = () => {
      // Skip events triggered by our own writes
      if (pendingWritesRef.current > 0) return
      clearTimeout(realtimeFetchTimerRef.current)
      realtimeFetchTimerRef.current = setTimeout(async () => {
        try {
          const { data: remoteData, log: remoteLog } = await fetchAllTables()
          applyRemoteData(remoteData, remoteLog)
        } catch (e) {
          console.error('[CRO sync] Realtime re-fetch failed:', e)
        }
      }, 500)
    }
    const channel = supabase
      .channel('cro_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brand_tasks' }, realtimeHandler)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'phase_tasks' }, realtimeHandler)
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') setSyncState('error')
      })
    return () => {
      supabase.removeChannel(channel)
      clearTimeout(realtimeFetchTimerRef.current)
    }
  }, [applyRemoteData])

  // ── Legacy blob push (active only when new tables aren't ready yet) ──
  useEffect(() => {
    if (!supabase || !useLegacyBlobRef.current) return
    clearTimeout(blobPushTimerRef.current)
    setSyncState('syncing')
    blobPushTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('cro_data')
          .upsert({ id: 'main', data: dataRef.current, updated_at: dataRef.current.lastUpdated })
        if (error) throw error
        setSyncState('synced')
        setLastSynced(new Date())
      } catch (e) {
        console.error('[CRO sync] Legacy blob push failed:', e)
        setSyncState('error')
      }
    }, 800)
    return () => clearTimeout(blobPushTimerRef.current)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers for DB writes ─────────────────────────────────────────────

  // Returns true if reqId belongs to a phase-level custom task
  const isPhaseTask = (reqId) =>
    Object.values(dataRef.current.phaseCustomTasks || {}).some(arr => arr.some(t => t.id === reqId))

  // ── Phase-Brand sync helpers ──────────────────────────────────────────

  // Returns the title of a phase custom task by its id
  const getPhaseTaskTitle = (phaseTaskId) => {
    for (const [, tasks] of Object.entries(dataRef.current.phaseCustomTasks || {})) {
      const t = tasks.find(t => t.id === phaseTaskId)
      if (t) return t.title
    }
    return null
  }

  // Returns [{ sectionId, taskId }] for all phase custom tasks with the given title
  const findPhaseTasksByTitle = (title) => {
    if (!title) return []
    const results = []
    for (const [sectionId, tasks] of Object.entries(dataRef.current.phaseCustomTasks || {})) {
      tasks.forEach(t => { if (t.title === title) results.push({ sectionId, taskId: t.id }) })
    }
    return results
  }

  // Returns [{ sectionId, taskId }] for all brand custom tasks matching title in a given brand
  const findBrandCustomTasksByTitle = (brandId, title) => {
    if (!title) return []
    const results = []
    for (const [sectionId, tasks] of Object.entries(dataRef.current.customTasks?.[brandId] || {})) {
      tasks.forEach(t => { if (t.title === title) results.push({ sectionId, taskId: t.id }) })
    }
    return results
  }

  // Returns [{ brandId, sectionId, taskId }] for all brand custom tasks matching title across all brands
  const findBrandCustomTasksByTitleAllBrands = (title) => {
    if (!title) return []
    const results = []
    for (const brandId of Object.keys(dataRef.current.customTasks || {})) {
      findBrandCustomTasksByTitle(brandId, title).forEach(match => results.push({ brandId, ...match }))
    }
    return results
  }

  // Refs to allow updateTask and updateCustomTask to call each other without circular deps
  const updateTaskRef = useRef(null)
  const updateCustomTaskRef = useRef(null)

  const buildBrandTaskRow = (brandId, reqId, overrides) => {
    const current = dataRef.current.tasks[brandId]?.[reqId] || DEFAULT_TASK
    const t = { ...current, ...overrides }
    const taskDbId = dataRef.current.taskDbIds?.[brandId]?.[reqId]
      || nextTaskDbId(brandId, dataRef.current.taskDbIds, dataRef.current.customTasks)
    const row = {
      id: taskDbId,
      brand_id: brandId,
      section_id: getSectionIdForReqOrPhaseTask(reqId, dataRef.current.phaseCustomTasks),
      sort_order: getSortOrderForReq(reqId),
      title: t.customTitle || findReqLabel(reqId),
      description: t.description || '',
      assignee: t.assignee,
      status: t.status,
      deadline: t.deadline,
      priority: t.priority,
      is_hidden: false,
      updated_at: new Date().toISOString(),
    }
    return row
  }

  const buildBrandUIRow = (brandId, overrides) => {
    const d = dataRef.current
    return {
      brand_id: brandId,
      hidden_tasks: d.hiddenTasks?.[brandId] || [],
      task_order: d.taskOrder?.[brandId] || {},
      matrix_order: d.matrixOrder?.[brandId] || {},
      ...overrides,
    }
  }

  const buildGlobalUIRow = (overrides) => {
    const d = dataRef.current
    return {
      id: 'main',
      phase_hidden_tasks: d.phaseHiddenTasks || [],
      phase_task_order: d.phaseTaskOrder || {},
      phase_titles: d.phaseTitles || {},
      phase_notes: d.phaseNotes || {},
      matrix_titles: d.matrixTitles || {},
      ...overrides,
    }
  }

  // ── Mutations ────────────────────────────────────────────────────────

  const updateTask = useCallback((brandId, reqId, field, value, opts = {}) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      tasks: {
        ...prev.tasks,
        [brandId]: {
          ...prev.tasks[brandId],
          [reqId]: { ...(prev.tasks[brandId]?.[reqId] || DEFAULT_TASK), [field]: value },
        },
      },
    }))

    if (field === 'status') {
      const brand = BRANDS.find(b => b.id === brandId)
      const logEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        brandId, brandName: brand?.name || brandId, reqId,
        reqLabel: findReqLabel(reqId),
        oldStatus: dataRef.current.tasks[brandId]?.[reqId]?.status || 'pending',
        newStatus: value,
      }
      setActivityLog(log => [logEntry, ...log].slice(0, 200))
      if (supabase) {
        dbWrite(supabase.from('activity_log').insert({
          id: logEntry.id, timestamp: logEntry.timestamp,
          brand_id: logEntry.brandId, brand_name: logEntry.brandName,
          req_id: logEntry.reqId, req_label: logEntry.reqLabel,
          old_status: logEntry.oldStatus, new_status: logEntry.newStatus,
        }))
      }

      // Cascade: phase_task status → brand custom tasks with same title (same brand)
      if (!opts.cascade && isPhaseTask(reqId)) {
        const title = getPhaseTaskTitle(reqId)
        if (title) {
          findBrandCustomTasksByTitle(brandId, title).forEach(({ sectionId, taskId }) => {
            updateCustomTaskRef.current?.(brandId, sectionId, taskId, 'status', value, { cascade: true })
          })
        }
      }
    }

    if (supabase) {
      const upsertBrandTask = (overrides) => {
        const row = buildBrandTaskRow(brandId, reqId, overrides)
        const isNewRow = !dataRef.current.taskDbIds?.[brandId]?.[reqId]
        const promise = supabase.from('brand_tasks').upsert(row)
        dbWrite(promise)
        promise.then(({ error }) => {
          if (!error && isNewRow) {
            setData(prev => ({
              ...prev,
              taskDbIds: {
                ...prev.taskDbIds,
                [brandId]: { ...(prev.taskDbIds?.[brandId] || {}), [reqId]: row.id },
              },
            }))
          }
        })
      }
      if (field === 'description') {
        clearTimeout(notesTimerRef.current[`${brandId}:${reqId}`])
        notesTimerRef.current[`${brandId}:${reqId}`] = setTimeout(() => upsertBrandTask({}), 800)
      } else {
        upsertBrandTask({ [field]: value })
      }
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const getCustomTasks = useCallback((brandId, sectionId) => data.customTasks?.[brandId]?.[sectionId] || [], [data])

  const addCustomTask = useCallback((brandId, sectionId) => {
    const id = nextTaskDbId(brandId, dataRef.current.taskDbIds, dataRef.current.customTasks)
    const newTask = { id, title: '', status: 'pending', assignee: null, deadline: null, description: '', priority: null }
    setData(prev => ({
      ...prev, lastUpdated: new Date().toISOString(),
      customTasks: { ...prev.customTasks, [brandId]: { ...(prev.customTasks?.[brandId] || {}), [sectionId]: [...(prev.customTasks?.[brandId]?.[sectionId] || []), newTask] } },
    }))
    if (supabase) {
      dbWrite(supabase.from('brand_tasks').insert({
        id, brand_id: brandId, section_id: sectionId, title: '',
        description: '', status: 'pending', sort_order: 0, is_hidden: false,
        updated_at: new Date().toISOString(),
      }))
    }
    return id
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateCustomTask = useCallback((brandId, sectionId, taskId, field, value, opts = {}) => {
    // Capture title before setData (dataRef.current still holds current state)
    const taskTitle = field === 'status' && !opts.cascade
      ? dataRef.current.customTasks?.[brandId]?.[sectionId]?.find(t => t.id === taskId)?.title
      : null

    setData(prev => ({
      ...prev, lastUpdated: new Date().toISOString(),
      customTasks: { ...prev.customTasks, [brandId]: { ...(prev.customTasks?.[brandId] || {}), [sectionId]: (prev.customTasks?.[brandId]?.[sectionId] || []).map(t => t.id === taskId ? { ...t, [field]: value } : t) } },
    }))

    // Cascade: brand_task status → phase tasks with same title (same brand)
    if (field === 'status' && !opts.cascade && taskTitle) {
      findPhaseTasksByTitle(taskTitle).forEach(({ taskId: phaseTaskId }) => {
        updateTaskRef.current?.(brandId, phaseTaskId, 'status', value, { cascade: true })
      })
    }

    if (supabase) {
      if (field === 'description') {
        clearTimeout(notesTimerRef.current[`custom:${taskId}`])
        notesTimerRef.current[`custom:${taskId}`] = setTimeout(() => {
          dbWrite(supabase.from('brand_tasks').update({ description: dataRef.current.customTasks?.[brandId]?.[sectionId]?.find(t => t.id === taskId)?.description ?? value, updated_at: new Date().toISOString() }).eq('id', taskId))
        }, 800)
      } else {
        dbWrite(supabase.from('brand_tasks').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', taskId))
      }
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep refs up-to-date so cascade calls always invoke the latest closures
  updateTaskRef.current = updateTask
  updateCustomTaskRef.current = updateCustomTask

  const deleteCustomTask = useCallback((brandId, sectionId, taskId) => {
    setData(prev => ({
      ...prev, lastUpdated: new Date().toISOString(),
      customTasks: { ...prev.customTasks, [brandId]: { ...(prev.customTasks?.[brandId] || {}), [sectionId]: (prev.customTasks?.[brandId]?.[sectionId] || []).filter(t => t.id !== taskId) } },
      taskOrder: { ...prev.taskOrder, [brandId]: { ...(prev.taskOrder?.[brandId] || {}), [sectionId]: (prev.taskOrder?.[brandId]?.[sectionId] || []).filter(id => id !== taskId) } },
    }))
    if (supabase) {
      dbWrite(supabase.from('brand_tasks').delete().eq('id', taskId))
    }
  }, [setData, dbWrite])

  const reorderSection = useCallback((brandId, sectionId, orderedIds) => {
    setData(prev => ({ ...prev, lastUpdated: new Date().toISOString(), taskOrder: { ...prev.taskOrder, [brandId]: { ...(prev.taskOrder?.[brandId] || {}), [sectionId]: orderedIds } } }))
    if (supabase) {
      dbWrite(supabase.from('brand_ui_state').upsert(buildBrandUIRow(brandId, {
        task_order: { ...(dataRef.current.taskOrder?.[brandId] || {}), [sectionId]: orderedIds },
      })))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const hideTask = useCallback((brandId, reqId) => {
    const newHidden = [...new Set([...(dataRef.current.hiddenTasks?.[brandId] || []), reqId])]
    setData(prev => ({ ...prev, lastUpdated: new Date().toISOString(), hiddenTasks: { ...prev.hiddenTasks, [brandId]: newHidden } }))
    if (supabase) {
      dbWrite(supabase.from('brand_ui_state').upsert(buildBrandUIRow(brandId, { hidden_tasks: newHidden })))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const showTask = useCallback((brandId, reqId) => {
    const newHidden = (dataRef.current.hiddenTasks?.[brandId] || []).filter(id => id !== reqId)
    setData(prev => ({ ...prev, lastUpdated: new Date().toISOString(), hiddenTasks: { ...prev.hiddenTasks, [brandId]: newHidden } }))
    if (supabase) {
      dbWrite(supabase.from('brand_ui_state').upsert(buildBrandUIRow(brandId, { hidden_tasks: newHidden })))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const bulkUpdateTasks = useCallback((brandId, taskIds, updates) => {
    if (!taskIds.length) return
    // Distinguish standard/phase req IDs (found in tasks[brandId]) from custom task IDs
    const standardTasks = dataRef.current.tasks[brandId] || {}
    const reqIds = taskIds.filter(id => id in standardTasks)
    const customIds = new Set(taskIds.filter(id => !(id in standardTasks)))
    setData(prev => {
      let newTasks = prev.tasks
      if (reqIds.length) {
        const bt = { ...prev.tasks[brandId] }
        reqIds.forEach(id => { bt[id] = { ...(bt[id] || DEFAULT_TASK), ...updates } })
        newTasks = { ...prev.tasks, [brandId]: bt }
      }
      let newCustom = prev.customTasks
      if (customIds.size) {
        const bc = { ...(prev.customTasks?.[brandId] || {}) }
        Object.keys(bc).forEach(sid => { bc[sid] = bc[sid].map(t => customIds.has(t.id) ? { ...t, ...updates } : t) })
        newCustom = { ...prev.customTasks, [brandId]: bc }
      }
      return { ...prev, lastUpdated: new Date().toISOString(), tasks: newTasks, customTasks: newCustom }
    })
    if (supabase) {
      const now = new Date().toISOString()
      if (reqIds.length) {
        const rows = reqIds.map(reqId => buildBrandTaskRow(brandId, reqId, updates))
        dbWrite(supabase.from('brand_tasks').upsert(rows))
      }
      if (customIds.size) {
        const dbUpdates = { ...updates, updated_at: now }
        ;[...customIds].forEach(taskId => {
          dbWrite(supabase.from('brand_tasks').update(dbUpdates).eq('id', taskId))
        })
      }
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase-level task management ──────────────────────────────────────

  const addPhaseTask = useCallback(async (sectionId) => {
    const phaseId = getPhaseIdForSection(sectionId)
    const sortOrder = (dataRef.current.phaseCustomTasks?.[sectionId] || []).length

    const addToState = (id) => {
      setData(prev => {
        const newTasks = { ...prev.tasks }
        BRANDS.forEach(brand => {
          newTasks[brand.id] = { ...(newTasks[brand.id] || {}), [id]: { ...DEFAULT_TASK } }
        })
        return {
          ...prev,
          lastUpdated: new Date().toISOString(),
          tasks: newTasks,
          phaseCustomTasks: {
            ...prev.phaseCustomTasks,
            [sectionId]: [...(prev.phaseCustomTasks?.[sectionId] || []), { id, title: '', tooltip: '', description: '', priority: null, sort: sortOrder }],
          },
        }
      })
    }

    if (!supabase) {
      const id = `temp_${Date.now()}`
      addToState(id)
      return id
    }

    setSyncState('syncing')
    pendingWritesRef.current++
    const { data: inserted, error } = await supabase
      .from('phase_tasks')
      .insert({ phase_id: phaseId, section_id: sectionId, label: '', description: '', priority: null, sort_order: sortOrder, updated_at: new Date().toISOString() })
      .select('id')
      .single()
    pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1)

    if (error || !inserted) {
      console.error('[CRO DB] addPhaseTask failed:', error)
      setSyncState('error')
      return null
    }

    const id = inserted.id
    addToState(id)
    if (pendingWritesRef.current === 0) { setSyncState('synced'); setLastSynced(new Date()) }

    // Insert per-brand status rows: use phase task UUID as title to maintain the link
    const brandRows = BRANDS.map(brand => ({
      id: nextTaskDbId(brand.id, dataRef.current.taskDbIds, dataRef.current.customTasks),
      brand_id: brand.id,
      section_id: sectionId,
      title: id, // phase task UUID — used to identify this row in fetchAllTables
      description: '',
      status: 'pending',
      sort_order: 0,
      is_hidden: false,
      updated_at: new Date().toISOString(),
    }))
    dbWrite(supabase.from('brand_tasks').upsert(brandRows))
    return id
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const updatePhaseTask = useCallback((sectionId, taskId, field, value) => {
    // Capture oldTitle before state update for title sync cascade
    const oldTitle = field === 'title'
      ? dataRef.current.phaseCustomTasks?.[sectionId]?.find(t => t.id === taskId)?.title ?? null
      : null

    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseCustomTasks: {
        ...prev.phaseCustomTasks,
        [sectionId]: (prev.phaseCustomTasks?.[sectionId] || []).map(t =>
          t.id === taskId ? { ...t, [field]: value } : t
        ),
      },
    }))

    // Cascade: phase_task title change → update matching brand custom tasks in all brands
    if (field === 'title' && oldTitle) {
      findBrandCustomTasksByTitleAllBrands(oldTitle).forEach(({ brandId, sectionId: bSectionId, taskId: bTaskId }) => {
        updateCustomTaskRef.current?.(brandId, bSectionId, bTaskId, 'title', value, { cascade: true })
      })
    }

    if (supabase) {
      const col = field === 'title' ? 'label' : field
      dbWrite(supabase.from('phase_tasks').update({ [col]: value, updated_at: new Date().toISOString() }).eq('id', taskId))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const deletePhaseTask = useCallback((sectionId, taskId) => {
    const isCustom = isPhaseTask(taskId)
    setData(prev => {
      const next = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        phaseTaskOrder: {
          ...prev.phaseTaskOrder,
          [sectionId]: (prev.phaseTaskOrder?.[sectionId] || []).filter(id => id !== taskId),
        },
      }
      if (isCustom) {
        next.phaseCustomTasks = {
          ...prev.phaseCustomTasks,
          [sectionId]: (prev.phaseCustomTasks?.[sectionId] || []).filter(t => t.id !== taskId),
        }
      } else {
        next.phaseHiddenTasks = [...new Set([...(prev.phaseHiddenTasks || []), taskId])]
      }
      return next
    })
    if (supabase) {
      if (isCustom) {
        dbWrite(supabase.from('phase_tasks').delete().eq('id', taskId))
        // After migration: brand_tasks rows for phase tasks use title = phase task UUID
        dbWrite(supabase.from('brand_tasks').delete().eq('title', taskId))
      } else {
        const newHidden = [...new Set([...(dataRef.current.phaseHiddenTasks || []), taskId])]
        dbWrite(supabase.from('global_ui_state').upsert(buildGlobalUIRow({ phase_hidden_tasks: newHidden })))
      }
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const showPhaseTask = useCallback((reqId) => {
    const newHidden = (dataRef.current.phaseHiddenTasks || []).filter(id => id !== reqId)
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseHiddenTasks: newHidden,
    }))
    if (supabase) {
      dbWrite(supabase.from('global_ui_state').upsert(buildGlobalUIRow({ phase_hidden_tasks: newHidden })))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const reorderPhaseSection = useCallback((sectionId, orderedIds) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseTaskOrder: { ...prev.phaseTaskOrder, [sectionId]: orderedIds },
    }))
    if (supabase) {
      dbWrite(supabase.from('global_ui_state').upsert(buildGlobalUIRow({
        phase_task_order: { ...(dataRef.current.phaseTaskOrder || {}), [sectionId]: orderedIds },
      })))
      const now = new Date().toISOString()
      const sectionCustomIds = new Set((dataRef.current.phaseCustomTasks?.[sectionId] || []).map(t => t.id))
      const customRows = orderedIds
        .filter(id => sectionCustomIds.has(id))
        .map((id, idx) => ({ id, sort_order: idx, updated_at: now }))
      if (customRows.length) dbWrite(supabase.from('phase_tasks').upsert(customRows))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const movePhaseTask = useCallback((taskId, fromSectionId, toSectionId, insertIndex) => {
    setData(prev => {
      const fromList = prev.phaseCustomTasks?.[fromSectionId] || []
      const task = fromList.find(t => t.id === taskId)
      if (!task) return prev
      const newFrom = fromList.filter(t => t.id !== taskId)
      const toList = [...(prev.phaseCustomTasks?.[toSectionId] || [])]
      toList.splice(insertIndex, 0, { ...task, sort: insertIndex }) // local `sort` mirrors sort_order

      const newFromOrder = newFrom.map(t => t.id)
      const newToOrder = toList.map(t => t.id)
      const existingFromOrder = prev.phaseTaskOrder?.[fromSectionId] || fromList.map(t => t.id)
      const existingToOrder = prev.phaseTaskOrder?.[toSectionId] || (prev.phaseCustomTasks?.[toSectionId] || []).map(t => t.id)
      const fromOrderFiltered = existingFromOrder.filter(id => id !== taskId)
      const toOrderWithTask = [...existingToOrder.filter(id => id !== taskId)]
      toOrderWithTask.splice(insertIndex, 0, taskId)

      return {
        ...prev,
        lastUpdated: new Date().toISOString(),
        phaseCustomTasks: {
          ...prev.phaseCustomTasks,
          [fromSectionId]: newFrom,
          [toSectionId]: toList,
        },
        phaseTaskOrder: {
          ...prev.phaseTaskOrder,
          [fromSectionId]: fromOrderFiltered,
          [toSectionId]: toOrderWithTask,
        },
      }
    })
    if (supabase) {
      const now = new Date().toISOString()
      const phaseId = getPhaseIdForSection(toSectionId)
      dbWrite(supabase.from('phase_tasks').update({
        section_id: toSectionId, phase_id: phaseId, sort_order: insertIndex, updated_at: now,
      }).eq('id', taskId))
      const newFromOrder = (dataRef.current.phaseTaskOrder?.[fromSectionId] || []).filter(id => id !== taskId)
      const existingTo = dataRef.current.phaseTaskOrder?.[toSectionId] || []
      const newToOrder = [...existingTo.filter(id => id !== taskId)]
      newToOrder.splice(insertIndex, 0, taskId)
      dbWrite(supabase.from('global_ui_state').upsert(buildGlobalUIRow({
        phase_task_order: {
          ...(dataRef.current.phaseTaskOrder || {}),
          [fromSectionId]: newFromOrder,
          [toSectionId]: newToOrder,
        },
      })))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const updatePhaseTitleOverride = useCallback((taskId, title) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseTitles: { ...prev.phaseTitles, [taskId]: title },
    }))
    if (supabase) {
      dbWrite(supabase.from('global_ui_state').upsert(buildGlobalUIRow({
        phase_titles: { ...(dataRef.current.phaseTitles || {}), [taskId]: title },
      })))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const updatePhaseNote = useCallback((taskId, note) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseNotes: { ...prev.phaseNotes, [taskId]: note },
    }))
    if (supabase) {
      clearTimeout(notesTimerRef.current[`phaseNote:${taskId}`])
      notesTimerRef.current[`phaseNote:${taskId}`] = setTimeout(() => {
        dbWrite(supabase.from('global_ui_state').upsert(buildGlobalUIRow({
          phase_notes: dataRef.current.phaseNotes || {},
        })))
      }, 800)
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Brand/app settings + metrics ─────────────────────────────────────

  const updateBrandSetting = useCallback((brandId, path, value) => {
    const current = dataRef.current.brandSettings?.[brandId] || { ...DEFAULT_BRAND_SETTINGS }
    const newBrandSettings = setNestedValue(current, path, value)
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      brandSettings: { ...prev.brandSettings, [brandId]: newBrandSettings },
    }))
    if (supabase) {
      dbWrite(supabase.from('brand_settings').upsert({
        brand_id: brandId,
        logo_url: newBrandSettings.logoUrl || '',
        custom_name: newBrandSettings.customName || '',
        custom_segment: newBrandSettings.customSegment || '',
        links: newBrandSettings.links || {},
        metabase_cards: newBrandSettings.metabaseCards || {},
      }))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateAppSetting = useCallback((path, value) => {
    const newAppSettings = setNestedValue(dataRef.current.appSettings || { ...DEFAULT_APP_SETTINGS }, path, value)
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      appSettings: newAppSettings,
    }))
    if (supabase) {
      dbWrite(supabase.from('app_settings').upsert({
        id: 'main',
        group_name: newAppSettings.groupName || '',
        logo_url: newAppSettings.logoUrl || '',
        metabase: newAppSettings.metabase || {},
        status_labels: newAppSettings.statusLabels || {},
        responsible_areas: newAppSettings.responsibleAreas || [],
        updated_at: new Date().toISOString(),
      }))
    }
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveBrandMetrics = useCallback((brandId, metrics) => {
    setData(prev => ({
      ...prev,
      brandMetrics: { ...(prev.brandMetrics || {}), [brandId]: metrics },
    }))
  }, [setData])

  // ── Export / import ──────────────────────────────────────────────────

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ data, activityLog }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `gobeaute-cro-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }, [data, activityLog])

  const exportCSV = useCallback(() => {
    const VB = BRANDS.filter(b => !b.hidden)
    const sl = s => ({ done: 'Finalizado', in_progress: 'Em progresso', waiting_client: 'Esperando cliente', validating: 'Em validação', pending: 'Pendente' }[s] || 'Pendente')
    const rows = [['Fase', 'Seção', 'Requisito', ...VB.map(b => b.name)].join(',')]
    PHASES.forEach(phase => {
      phase.sections.forEach(section => {
        section.requirements.forEach(req => {
          rows.push([`"Fase ${phase.number}"`, `"${section.name}"`, `"${req.label}"`, ...VB.map(b => sl(data.tasks[b.id]?.[req.id]?.status))].join(','))
        })
      })
    })
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `gobeaute-cro-matriz-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }, [data])

  const importData = useCallback(json => {
    try {
      const parsed = JSON.parse(json)
      if (parsed.data) { setData(parsed.data); if (parsed.activityLog) setActivityLog(parsed.activityLog); return true }
    } catch (e) { console.error('Import failed:', e) }
    return false
  }, [setData])

  const resetData = useCallback(() => {
    setData(freshData())
    setActivityLog([])
  }, [setData])

  const exportDescriptions = useCallback(() => {
    const stripHtml = html => html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''
    const apiceId = BRANDS.find(b => b.id === 'apice' || b.name?.toLowerCase().includes('pice'))?.id || BRANDS[0]?.id
    const lines = [`# CRO Hub — Descrições de requisitos\n`]
    PHASES.forEach(phase => {
      lines.push(`## Fase ${phase.number} — ${phase.name}\n`)
      phase.sections.forEach(section => {
        lines.push(`### ${section.name}\n`)
        section.requirements.forEach(req => {
          const note = data.tasks?.[apiceId]?.[req.id]?.description || INITIAL_NOTES[req.id] || ''
          lines.push(`#### ${req.label}\n`)
          if (note) lines.push(stripHtml(note) + '\n')
          lines.push('')
        })
      })
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `cro-hub-descricoes-${new Date().toISOString().slice(0, 10)}.md`
    a.click(); URL.revokeObjectURL(url)
  }, [data])

  useEffect(() => {
    window.exportData = exportJSON; window.importData = importData
    window.exportCSV = exportCSV; window.resetData = resetData
    window.exportDescriptions = exportDescriptions
  }, [exportJSON, importData, exportCSV, resetData, exportDescriptions])

  // ── Phase / Section meta mutations ─────────────────────────────────────

  const updatePhaseMeta = useCallback((phaseId, field, value) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phasesData: (prev.phasesData || []).map(p =>
        p.phase_id === phaseId ? { ...p, [field]: value } : p
      ),
    }))
    if (supabase) {
      dbWrite(supabase.from('phases').update({ [field]: value }).eq('phase_id', phaseId))
    }
  }, [setData, dbWrite])

  const updateSectionMeta = useCallback((sectionId, field, value) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      sectionsData: (prev.sectionsData || []).map(s =>
        s.section_id === sectionId ? { ...s, [field]: value } : s
      ),
    }))
    if (supabase) {
      dbWrite(supabase.from('sections').update({ [field]: value }).eq('section_id', sectionId))
    }
  }, [setData, dbWrite])

  const addCustomSection = useCallback((phaseId, { name, emoji }) => {
    const sectionId = `custom_${phaseId}_${Date.now()}`
    const phaseSections = (dataRef.current.sectionsData || []).filter(s => s.phase_id === phaseId)
    const maxSort = phaseSections.reduce((max, s) => Math.max(max, s.sort_order), -1)
    const newSection = { section_id: sectionId, phase_id: phaseId, label: name, emoji: emoji || '', sort_order: maxSort + 1 }
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      sectionsData: [...(prev.sectionsData || []), newSection],
    }))
    if (supabase) {
      dbWrite(supabase.from('sections').insert({
        section_id: sectionId, phase_id: phaseId, label: name, emoji: emoji || '', sort_order: maxSort + 1,
      }))
    }
    return sectionId
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCustomSection = useCallback((sectionId) => {
    setData(prev => {
      const next = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        sectionsData: (prev.sectionsData || []).filter(s => s.section_id !== sectionId),
      }
      if (next.phaseCustomTasks?.[sectionId]) {
        next.phaseCustomTasks = { ...next.phaseCustomTasks }
        delete next.phaseCustomTasks[sectionId]
      }
      return next
    })
    if (supabase) {
      dbWrite(supabase.from('sections').delete().eq('section_id', sectionId))
    }
  }, [setData, dbWrite])

  const reorderPhases = useCallback((orderedPhaseIds) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phasesData: (prev.phasesData || []).map(p => {
        const idx = orderedPhaseIds.indexOf(p.phase_id)
        return idx >= 0 ? { ...p, sort_order: idx } : p
      }),
    }))
    if (supabase) {
      dbWrite(supabase.from('phases').upsert(
        orderedPhaseIds.map((id, idx) => ({ phase_id: id, sort_order: idx }))
      ))
    }
  }, [setData, dbWrite])

  const addPhase = useCallback(({ label, emoji, color, colorLight, colorMuted, colorDark }) => {
    const phaseId = `custom_phase_${Date.now()}`
    const maxSort = (dataRef.current.phasesData || []).reduce((max, p) => Math.max(max, p.sort_order), -1)
    const newPhase = { phase_id: phaseId, label, emoji: emoji || '', sort_order: maxSort + 1, color, colorLight, colorMuted, colorDark }
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phasesData: [...(prev.phasesData || []), newPhase],
    }))
    if (supabase) {
      dbWrite(supabase.from('phases').insert({
        phase_id: phaseId, label, emoji: emoji || '', sort_order: maxSort + 1,
      }))
    }
    return phaseId
  }, [setData, dbWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  const deletePhase = useCallback((phaseId) => {
    setData(prev => {
      const sectionsToDelete = (prev.sectionsData || []).filter(s => s.phase_id === phaseId)
      const next = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        phasesData: (prev.phasesData || []).filter(p => p.phase_id !== phaseId),
        sectionsData: (prev.sectionsData || []).filter(s => s.phase_id !== phaseId),
      }
      if (sectionsToDelete.length) {
        next.phaseCustomTasks = { ...prev.phaseCustomTasks }
        sectionsToDelete.forEach(s => { delete next.phaseCustomTasks[s.section_id] })
      }
      return next
    })
    if (supabase) {
      dbWrite(supabase.from('phases').delete().eq('phase_id', phaseId))
      dbWrite(supabase.from('sections').delete().eq('phase_id', phaseId))
    }
  }, [setData, dbWrite])

  const reorderSections = useCallback((phaseId, orderedSectionIds) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      sectionsData: (prev.sectionsData || []).map(s => {
        if (s.phase_id !== phaseId) return s
        const idx = orderedSectionIds.indexOf(s.section_id)
        return idx >= 0 ? { ...s, sort_order: idx } : s
      }),
    }))
    if (supabase) {
      dbWrite(supabase.from('sections').upsert(
        orderedSectionIds.map((id, idx) => ({ section_id: id, sort_order: idx }))
      ))
    }
  }, [setData, dbWrite])

  const mergedPhases = useMemo(
    () => getMergedPhases(data.phasesData, data.sectionsData),
    [data.phasesData, data.sectionsData]
  )

  return {
    data, activityLog,
    syncState, lastSynced,
    mergedPhases,
    updateTask, getCustomTasks, addCustomTask, updateCustomTask, deleteCustomTask,
    reorderSection, hideTask, showTask, bulkUpdateTasks,
    addPhaseTask, updatePhaseTask, deletePhaseTask, showPhaseTask, reorderPhaseSection, movePhaseTask,
    updatePhaseTitleOverride, updatePhaseNote,
    updatePhaseMeta, updateSectionMeta, addPhase, deletePhase, addCustomSection, deleteCustomSection, reorderPhases, reorderSections,
    updateBrandSetting, updateAppSetting, saveBrandMetrics,
    exportJSON, exportCSV, importData, resetData,
  }
}

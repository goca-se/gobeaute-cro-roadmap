import { useState, useEffect, useCallback, useRef } from 'react'
import { PHASES, BRANDS } from '../data/phases'
import { INITIAL_STATUSES } from '../data/initialData'
import { INITIAL_NOTES } from '../data/initialNotes'
import { supabase, isConfigured } from '../lib/supabase'

const STORAGE_KEY = 'gobeaute_cro_data'
const LOG_KEY = 'gobeaute_cro_log'
const REMOTE_ID = 'main'

export const DEFAULT_TASK = {
  status: 'pending',
  responsible: null,
  deadline: null,
  notes: '',
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
          if (task && !task.notes && INITIAL_NOTES[req.id]) {
            task.notes = INITIAL_NOTES[req.id]
          }
        })
      })
    })
  })
  return data
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
      parsed.tasks = ensureAllReqs(parsed.tasks, parsed.phaseCustomTasks)
      seedMissingNotes(parsed)
      return parsed
    }
  } catch {}
  return freshData()
}

export function useCROData() {
  const [data, setDataRaw] = useState(loadLocalData)
  const [activityLog, setActivityLog] = useState(() => {
    try { const r = localStorage.getItem(LOG_KEY); if (r) return JSON.parse(r) } catch {}
    return []
  })

  // Sync state
  const [syncState, setSyncState] = useState(isConfigured ? 'loading' : 'local') // local | loading | syncing | synced | error
  const [lastSynced, setLastSynced] = useState(null)
  const isRemoteUpdateRef = useRef(false)
  const pushTimerRef = useRef(null)
  const dataRef = useRef(data)

  // Keep ref up-to-date
  useEffect(() => { dataRef.current = data }, [data])

  // Wrapper: marks whether update is from remote
  const setData = useCallback((newData) => {
    setDataRaw(newData)
  }, [])

  const setDataFromRemote = useCallback((remoteData) => {
    isRemoteUpdateRef.current = true
    const patched = { ...remoteData }
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
    setLastSynced(new Date())
  }, [])

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data])
  useEffect(() => { localStorage.setItem(LOG_KEY, JSON.stringify(activityLog)) }, [activityLog])

  // ── Supabase: initial fetch ──────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      try {
        const { data: remote, error } = await supabase
          .from('cro_data')
          .select('data, updated_at')
          .eq('id', REMOTE_ID)
          .maybeSingle()

        if (error) throw error

        if (remote?.data && Object.keys(remote.data).length > 0) {
          const remoteDate = new Date(remote.updated_at)
          const localDate = new Date(dataRef.current.lastUpdated)
          if (remoteDate > localDate) {
            setDataFromRemote(remote.data)
          }
        } else if (!remote) {
          // First use: push local data to initialize remote
          await supabase.from('cro_data').upsert({
            id: REMOTE_ID, data: dataRef.current, updated_at: dataRef.current.lastUpdated,
          })
        }
        setSyncState('synced')
        setLastSynced(new Date())
      } catch (e) {
        console.error('[CRO sync] Initial fetch failed:', e)
        setSyncState('error')
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Supabase: push on change (debounced 800ms) ───────────────────────
  useEffect(() => {
    if (!supabase) return
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false
      return
    }
    clearTimeout(pushTimerRef.current)
    setSyncState('syncing')
    pushTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('cro_data')
          .upsert({ id: REMOTE_ID, data: dataRef.current, updated_at: dataRef.current.lastUpdated })
        if (error) throw error
        setSyncState('synced')
        setLastSynced(new Date())
      } catch (e) {
        console.error('[CRO sync] Push failed:', e)
        setSyncState('error')
      }
    }, 800)
    return () => clearTimeout(pushTimerRef.current)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Supabase: real-time subscription ────────────────────────────────
  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('cro_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cro_data', filter: `id=eq.${REMOTE_ID}` },
        payload => {
          if (!payload.new?.data) return
          const remoteDate = new Date(payload.new.updated_at)
          const localDate = new Date(dataRef.current.lastUpdated)
          if (remoteDate > localDate) {
            setDataFromRemote(payload.new.data)
            setSyncState('synced')
          }
        }
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') setSyncState('error')
      })
    return () => { supabase.removeChannel(channel) }
  }, [setDataFromRemote])

  // ── Mutations ────────────────────────────────────────────────────────

  const updateTask = useCallback((brandId, reqId, field, value) => {
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
      setActivityLog(log => [{
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        brandId, brandName: brand?.name || brandId, reqId,
        reqLabel: findReqLabel(reqId),
        oldStatus: data.tasks[brandId]?.[reqId]?.status || 'pending',
        newStatus: value,
      }, ...log].slice(0, 200))
    }
  }, [data, setData])

  const getCustomTasks = useCallback((brandId, sectionId) => data.customTasks?.[brandId]?.[sectionId] || [], [data])

  const addCustomTask = useCallback((brandId, sectionId) => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`
    setData(prev => ({
      ...prev, lastUpdated: new Date().toISOString(),
      customTasks: { ...prev.customTasks, [brandId]: { ...(prev.customTasks?.[brandId] || {}), [sectionId]: [...(prev.customTasks?.[brandId]?.[sectionId] || []), { id, title: '', status: 'pending', responsible: null, deadline: null, notes: '', priority: null }] } },
    }))
    return id
  }, [setData])

  const updateCustomTask = useCallback((brandId, sectionId, taskId, field, value) => {
    setData(prev => ({
      ...prev, lastUpdated: new Date().toISOString(),
      customTasks: { ...prev.customTasks, [brandId]: { ...(prev.customTasks?.[brandId] || {}), [sectionId]: (prev.customTasks?.[brandId]?.[sectionId] || []).map(t => t.id === taskId ? { ...t, [field]: value } : t) } },
    }))
  }, [setData])

  const deleteCustomTask = useCallback((brandId, sectionId, taskId) => {
    setData(prev => ({
      ...prev, lastUpdated: new Date().toISOString(),
      customTasks: { ...prev.customTasks, [brandId]: { ...(prev.customTasks?.[brandId] || {}), [sectionId]: (prev.customTasks?.[brandId]?.[sectionId] || []).filter(t => t.id !== taskId) } },
      taskOrder: { ...prev.taskOrder, [brandId]: { ...(prev.taskOrder?.[brandId] || {}), [sectionId]: (prev.taskOrder?.[brandId]?.[sectionId] || []).filter(id => id !== taskId) } },
    }))
  }, [setData])

  const reorderSection = useCallback((brandId, sectionId, orderedIds) => {
    setData(prev => ({ ...prev, lastUpdated: new Date().toISOString(), taskOrder: { ...prev.taskOrder, [brandId]: { ...(prev.taskOrder?.[brandId] || {}), [sectionId]: orderedIds } } }))
  }, [setData])

  const hideTask = useCallback((brandId, reqId) => {
    setData(prev => ({ ...prev, lastUpdated: new Date().toISOString(), hiddenTasks: { ...prev.hiddenTasks, [brandId]: [...new Set([...(prev.hiddenTasks?.[brandId] || []), reqId])] } }))
  }, [setData])

  const showTask = useCallback((brandId, reqId) => {
    setData(prev => ({ ...prev, lastUpdated: new Date().toISOString(), hiddenTasks: { ...prev.hiddenTasks, [brandId]: (prev.hiddenTasks?.[brandId] || []).filter(id => id !== reqId) } }))
  }, [setData])

  const bulkUpdateTasks = useCallback((brandId, taskIds, updates) => {
    if (!taskIds.length) return
    const reqIds = taskIds.filter(id => !id.startsWith('custom_'))
    const customIds = new Set(taskIds.filter(id => id.startsWith('custom_')))
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
  }, [setData])

  // ── Phase-level task management ──────────────────────────────────────

  const addPhaseTask = useCallback((sectionId) => {
    const id = `custom_phase_${Date.now()}_${Math.random().toString(36).slice(2)}`
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
          [sectionId]: [...(prev.phaseCustomTasks?.[sectionId] || []), { id, title: '', tooltip: '' }],
        },
      }
    })
    return id
  }, [setData])

  const updatePhaseTask = useCallback((sectionId, taskId, field, value) => {
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
  }, [setData])

  const deletePhaseTask = useCallback((sectionId, taskId) => {
    const isCustom = taskId.startsWith('custom_phase_')
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
  }, [setData])

  const showPhaseTask = useCallback((reqId) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseHiddenTasks: (prev.phaseHiddenTasks || []).filter(id => id !== reqId),
    }))
  }, [setData])

  const reorderPhaseSection = useCallback((sectionId, orderedIds) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseTaskOrder: { ...prev.phaseTaskOrder, [sectionId]: orderedIds },
    }))
  }, [setData])

  const updatePhaseTitleOverride = useCallback((taskId, title) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseTitles: { ...prev.phaseTitles, [taskId]: title },
    }))
  }, [setData])

  const updatePhaseNote = useCallback((taskId, note) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      phaseNotes: { ...prev.phaseNotes, [taskId]: note },
    }))
  }, [setData])

  // ── Brand/app settings + metrics ─────────────────────────────────────

  const updateBrandSetting = useCallback((brandId, path, value) => {
    setData(prev => {
      const current = prev.brandSettings?.[brandId] || { ...DEFAULT_BRAND_SETTINGS }
      return {
        ...prev,
        lastUpdated: new Date().toISOString(),
        brandSettings: { ...prev.brandSettings, [brandId]: setNestedValue(current, path, value) },
      }
    })
  }, [setData])

  const updateAppSetting = useCallback((path, value) => {
    setData(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      appSettings: setNestedValue(prev.appSettings || { ...DEFAULT_APP_SETTINGS }, path, value),
    }))
  }, [setData])

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
          const note = data.tasks?.[apiceId]?.[req.id]?.notes || INITIAL_NOTES[req.id] || ''
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

  return {
    data, activityLog,
    syncState, lastSynced,
    updateTask, getCustomTasks, addCustomTask, updateCustomTask, deleteCustomTask,
    reorderSection, hideTask, showTask, bulkUpdateTasks,
    addPhaseTask, updatePhaseTask, deletePhaseTask, showPhaseTask, reorderPhaseSection,
    updatePhaseTitleOverride, updatePhaseNote,
    updateBrandSetting, updateAppSetting, saveBrandMetrics,
    exportJSON, exportCSV, importData, resetData,
  }
}

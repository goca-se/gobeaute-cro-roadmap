import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const BRANDS_MAP = {
  apice: 'Ápice',
  barbours: "Barbour's",
  kokeshi: 'Kokeshi',
  rituaria: 'Rituária',
  lescent: 'Lescent',
}

const BRAND_IDS = Object.keys(BRANDS_MAP)

export function useABTestData() {
  const [tests, setTests] = useState([])
  const [notes, setNotes] = useState([])
  const [syncLogs, setSyncLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncState, setSyncState] = useState('idle') // idle | syncing | success | error
  const [lastSynced, setLastSynced] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    brandId: null, // null = all (Geral tab)
    status: null,  // null = all, 'running' | 'done' | 'paused' | 'draft'
    winner: null,  // null = all, 'winner' | 'loser' | 'inconclusive'
    dateRange: null, // null = all active, { start, end }
  })

  // Sort
  const [sortBy, setSortBy] = useState({ field: 'date', direction: 'desc' })

  // Fetch all data from Supabase
  const fetchData = useCallback(async () => {
    if (!isConfigured || !supabase) {
      setLoading(false)
      return
    }

    try {
      const [testsRes, notesRes, logsRes] = await Promise.all([
        supabase.from('ab_tests').select('*').order('started_at', { ascending: false }),
        supabase.from('ab_test_notes').select('*').order('created_at', { ascending: false }),
        supabase.from('ab_sync_log').select('*').order('started_at', { ascending: false }).limit(20),
      ])

      if (testsRes.data) setTests(testsRes.data)
      if (notesRes.data) setNotes(notesRes.data)
      if (logsRes.data) {
        setSyncLogs(logsRes.data)
        // Set last synced from most recent log
        if (logsRes.data.length > 0) {
          setLastSynced(logsRes.data[0].finished_at || logsRes.data[0].started_at)
        }
      }
    } catch (err) {
      console.error('Failed to fetch AB test data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Refresh data from Supabase (sync button)
  const triggerSync = useCallback(async () => {
    setSyncState('syncing')
    try {
      await fetchData()
      setSyncState('success')
      setTimeout(() => setSyncState('idle'), 3000)
    } catch {
      setSyncState('error')
      setTimeout(() => setSyncState('idle'), 5000)
    }
  }, [fetchData])

  // Filtered tests
  const filteredTests = useMemo(() => {
    let result = [...tests]

    // Brand filter
    if (filters.brandId) {
      result = result.filter(t => t.brand_id === filters.brandId)
    }

    // Status filter
    if (filters.status) {
      result = result.filter(t => t.status === filters.status)
    }

    // Winner filter
    if (filters.winner === 'winner') {
      result = result.filter(t => t.is_winner)
    } else if (filters.winner === 'loser') {
      result = result.filter(t => t.status === 'done' && !t.is_winner)
    } else if (filters.winner === 'inconclusive') {
      result = result.filter(t => t.status === 'done' && t.statistical_status !== 'Significant')
    }

    // Date range filter
    if (filters.dateRange?.start) {
      const start = new Date(filters.dateRange.start)
      result = result.filter(t => new Date(t.started_at) >= start)
    }
    if (filters.dateRange?.end) {
      const end = new Date(filters.dateRange.end)
      result = result.filter(t => new Date(t.started_at) <= end)
    }

    // Default: show active (running + recent done) if no filters set
    if (!filters.status && !filters.winner && !filters.dateRange) {
      result = result.filter(t => {
        if (t.status === 'running' || t.status === 'paused') return true
        if (t.status === 'done') return true // Show all done tests by default
        return t.status === 'draft'
      })
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB
      switch (sortBy.field) {
        case 'rpv':
          valA = a.lift_rpv_pct ?? -999
          valB = b.lift_rpv_pct ?? -999
          break
        case 'cr':
          valA = a.lift_cr_pct ?? -999
          valB = b.lift_cr_pct ?? -999
          break
        case 'aov':
          valA = a.lift_aov_pct ?? -999
          valB = b.lift_aov_pct ?? -999
          break
        case 'date':
        default:
          valA = a.started_at ? new Date(a.started_at).getTime() : 0
          valB = b.started_at ? new Date(b.started_at).getTime() : 0
          break
      }
      return sortBy.direction === 'asc' ? valA - valB : valB - valA
    })

    return result
  }, [tests, filters, sortBy])

  // Summary stats
  const summary = useMemo(() => {
    const source = filters.brandId ? tests.filter(t => t.brand_id === filters.brandId) : tests
    return {
      totalTests: source.length,
      running: source.filter(t => t.status === 'running').length,
      done: source.filter(t => t.status === 'done').length,
      paused: source.filter(t => t.status === 'paused').length,
      draft: source.filter(t => t.status === 'draft').length,
    }
  }, [tests, filters.brandId])

  // Brand summary for tabs
  const brandSummary = useMemo(() => {
    const result = {}
    BRAND_IDS.forEach(brandId => {
      const brandTests = tests.filter(t => t.brand_id === brandId)
      const winners = brandTests.filter(t => t.is_winner)
      result[brandId] = {
        total: brandTests.length,
        running: brandTests.filter(t => t.status === 'running').length,
        done: brandTests.filter(t => t.status === 'done').length,
        liftCr: winners.reduce((sum, t) => sum + (t.lift_cr_pct || 0), 0),
        liftRpv: winners.reduce((sum, t) => sum + (t.lift_rpv_pct || 0), 0),
        liftAov: winners.reduce((sum, t) => sum + (t.lift_aov_pct || 0), 0),
      }
    })
    return result
  }, [tests])

  // Global accumulated lifts (sum of winner lifts)
  const globalLifts = useMemo(() => {
    const source = filters.brandId ? tests.filter(t => t.brand_id === filters.brandId) : tests
    const winners = source.filter(t => t.is_winner)
    return {
      cr: Math.round(winners.reduce((sum, t) => sum + (t.lift_cr_pct || 0), 0) * 100) / 100,
      rpv: Math.round(winners.reduce((sum, t) => sum + (t.lift_rpv_pct || 0), 0) * 100) / 100,
      aov: Math.round(winners.reduce((sum, t) => sum + (t.lift_aov_pct || 0), 0) * 100) / 100,
      count: winners.length,
    }
  }, [tests, filters.brandId])

  // Notes mutations
  const addNote = useCallback(async (testId, brandId, content, tags = []) => {
    if (!isConfigured || !supabase) return
    const { data, error } = await supabase
      .from('ab_test_notes')
      .insert({ test_id: testId, brand_id: brandId, content, tags })
      .select()
      .single()
    if (!error && data) {
      setNotes(prev => [data, ...prev])
    }
  }, [])

  const updateNote = useCallback(async (noteId, content, tags) => {
    if (!isConfigured || !supabase) return
    const updates = { updated_at: new Date().toISOString() }
    if (content !== undefined) updates.content = content
    if (tags !== undefined) updates.tags = tags
    const { error } = await supabase
      .from('ab_test_notes')
      .update(updates)
      .eq('id', noteId)
    if (!error) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n))
    }
  }, [])

  const deleteNote = useCallback(async (noteId) => {
    if (!isConfigured || !supabase) return
    const { error } = await supabase
      .from('ab_test_notes')
      .delete()
      .eq('id', noteId)
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== noteId))
    }
  }, [])

  // Get notes for a specific test
  const getTestNotes = useCallback((testId, brandId) => {
    return notes.filter(n => n.test_id === testId && n.brand_id === brandId)
  }, [notes])

  return {
    tests: filteredTests,
    allTests: tests,
    notes,
    syncLogs,
    loading,
    summary,
    brandSummary,
    globalLifts,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    addNote,
    updateNote,
    deleteNote,
    getTestNotes,
    triggerSync,
    syncState,
    lastSynced,
    BRANDS_MAP,
    BRAND_IDS,
  }
}

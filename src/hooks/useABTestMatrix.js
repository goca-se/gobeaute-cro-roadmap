import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { hasEnoughData, getTestDate, BRANDS_MAP, BRAND_IDS } from './useABTestData'
import { classifyTest, FAMILIES, AREAS, UNCLASSIFIED_ID } from '../data/abTestFamilies'

// Lookup rápido de família por id (para label/area quando family_id vem carimbado).
const FAMILY_BY_ID = Object.fromEntries(FAMILIES.map(f => [f.id, f]))

/**
 * Resolve a família de um teste: prioriza o valor carimbado pelo sync
 * (test.family_id); se ausente, classifica pelo nome (fallback client-side).
 */
function resolveFamily(test) {
  if (test.family_id) {
    const f = FAMILY_BY_ID[test.family_id]
    return {
      id: test.family_id,
      label: test.family_label || f?.label || test.family_id,
      area: test.area || f?.area || 'outros',
    }
  }
  const c = classifyTest(test.name)
  return { id: c.id, label: c.label, area: test.area || c.area }
}

/**
 * Veredito de um teste — MESMA lógica da ABTestingView (hasEnoughData +
 * is_winner + statistical_status). Não-finalizados = 'running' ("em teste").
 */
export function computeVerdict(test) {
  if (test.status !== 'done') return 'running'
  if (test.is_winner && hasEnoughData(test)) return 'winner'
  if (!test.is_winner && test.statistical_status === 'Significant' && hasEnoughData(test)) return 'loser'
  return 'inconclusive'
}

export function useABTestMatrix() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncState, setSyncState] = useState('idle') // idle | syncing | success | error
  const [lastSynced, setLastSynced] = useState(null)

  const [filters, setFilters] = useState({
    verdict: null,   // null | 'winner' | 'loser' | 'inconclusive' | 'running'
    brandId: null,   // null = todas
    area: null,      // null = todas
    scope: 'all',    // 'all' | 'escalado' | 'exclusivo'
    search: '',
  })

  const fetchData = useCallback(async () => {
    if (!isConfigured || !supabase) {
      setLoading(false)
      return
    }
    try {
      const [testsRes, logsRes] = await Promise.all([
        supabase.from('ab_tests').select('*').order('started_at', { ascending: false }),
        supabase.from('ab_sync_log').select('*').order('started_at', { ascending: false }).limit(1),
      ])
      if (testsRes.data) setTests(testsRes.data)
      if (logsRes.data?.length) setLastSynced(logsRes.data[0].finished_at || logsRes.data[0].started_at)
    } catch (err) {
      console.error('Failed to fetch AB test matrix data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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

  // Monta as linhas (famílias) e o balde "A triar" a partir dos testes.
  const { allRows, unclassified } = useMemo(() => {
    const famMap = new Map() // familyId -> { id, label, area, byBrand: Map<brandId, test[]> }
    const untriaged = []

    for (const t of tests) {
      const fam = resolveFamily(t)
      if (fam.id === UNCLASSIFIED_ID) {
        untriaged.push({ ...t, _area: fam.area })
        continue
      }
      if (!famMap.has(fam.id)) {
        famMap.set(fam.id, { id: fam.id, label: fam.label, area: fam.area, byBrand: new Map() })
      }
      const entry = famMap.get(fam.id)
      if (!entry.byBrand.has(t.brand_id)) entry.byBrand.set(t.brand_id, [])
      entry.byBrand.get(t.brand_id).push(t)
    }

    const rows = []
    for (const entry of famMap.values()) {
      const cells = {}
      let brandCount = 0
      for (const brandId of BRAND_IDS) {
        const list = entry.byBrand.get(brandId)
        if (!list || list.length === 0) { cells[brandId] = null; continue }
        brandCount++
        // Último teste da família nessa marca (maior data).
        const latest = list.reduce((a, b) => (getTestDate(b) > getTestDate(a) ? b : a))
        cells[brandId] = {
          test: latest,
          count: list.length,
          verdict: computeVerdict(latest),
          liftRpv: latest.lift_rpv_pct ?? null,
          liftCr: latest.lift_cr_pct ?? null,
          liftAov: latest.lift_aov_pct ?? null,
        }
      }
      const isEscalada = brandCount >= 2
      const isValidada = Object.values(cells).some(c => c && c.verdict === 'winner')
      rows.push({ id: entry.id, label: entry.label, area: entry.area, cells, brandCount, isEscalada, isValidada })
    }

    // Ordena por cobertura (desc) e depois por label (asc).
    rows.sort((a, b) => (b.brandCount - a.brandCount) || a.label.localeCompare(b.label, 'pt-BR'))

    // Balde "A triar" agrupado por marca (ordem canônica).
    untriaged.sort((a, b) => BRAND_IDS.indexOf(a.brand_id) - BRAND_IDS.indexOf(b.brand_id))
    return { allRows: rows, unclassified: untriaged }
  }, [tests])

  // Aplica filtros.
  const rows = useMemo(() => {
    let result = allRows

    if (filters.brandId) {
      result = result.filter(r => r.cells[filters.brandId])
    }
    if (filters.area) {
      result = result.filter(r => r.area === filters.area)
    }
    if (filters.verdict) {
      result = result.filter(r =>
        Object.values(r.cells).some(c => {
          if (!c) return false
          // Quando uma marca está isolada, considera só a célula daquela marca.
          if (filters.brandId) return r.cells[filters.brandId]?.verdict === filters.verdict
          return c.verdict === filters.verdict
        })
      )
    }
    if (filters.scope === 'escalado') result = result.filter(r => r.isEscalada)
    else if (filters.scope === 'exclusivo') result = result.filter(r => r.brandCount === 1)

    const q = filters.search.trim().toLowerCase()
    if (q) {
      result = result.filter(r => {
        if (r.label.toLowerCase().includes(q)) return true
        return Object.values(r.cells).some(c => c && (c.test.name || '').toLowerCase().includes(q))
      })
    }
    return result
  }, [allRows, filters])

  // Estatísticas (sobre o conjunto completo, não filtrado).
  const stats = useMemo(() => {
    const totalFamilies = allRows.length
    const escaladas = allRows.filter(r => r.isEscalada).length
    const validadas = allRows.filter(r => r.isValidada).length
    const coberturaMedia = totalFamilies > 0
      ? allRows.reduce((s, r) => s + r.brandCount, 0) / totalFamilies / BRAND_IDS.length
      : 0
    return { totalFamilies, escaladas, validadas, coberturaMedia, unclassifiedCount: unclassified.length }
  }, [allRows, unclassified])

  // Áreas presentes (para o dropdown de filtro).
  const areasPresent = useMemo(() => {
    const set = new Set(allRows.map(r => r.area))
    return Object.keys(AREAS).filter(a => set.has(a))
  }, [allRows])

  return {
    loading,
    rows,
    allRows,
    unclassified,
    stats,
    areasPresent,
    filters,
    setFilters,
    triggerSync,
    syncState,
    lastSynced,
    brandsMap: BRANDS_MAP,
    brandIds: BRAND_IDS,
  }
}

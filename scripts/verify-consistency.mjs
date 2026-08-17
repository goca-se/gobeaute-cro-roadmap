#!/usr/bin/env node
// Deep consistency audit: DB rows vs Elevate sync-data, field by field.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dir, '..', '.env'), 'utf-8').split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())).filter(([k]) => k)
)
const sb = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_SERVICE_ROLE_KEY'])
const DATA = JSON.parse(readFileSync(join(__dir, process.argv[2] || 'sync-data-2026-06-08.json'), 'utf-8'))

const norm = s => (s || '').toLowerCase()
const dateEq = (a, b) => {
  const x = a ? new Date(a).getTime() : null
  const y = b ? new Date(b).getTime() : null
  return x === y
}
const numEq = (a, b) => {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return Math.abs(Number(a) - Number(b)) < 0.011
}

let problems = 0
const allDbIds = []

for (const [brandId, bd] of Object.entries(DATA)) {
  const { data: rows } = await sb.from('ab_tests').select('*').eq('brand_id', brandId)
  const byId = Object.fromEntries((rows || []).map(r => [r.id, r]))
  rows?.forEach(r => allDbIds.push(`${brandId}:${r.id}`))

  for (const li of bd.tests) {
    const row = byId[li.testId]
    if (!row) { console.log(`✗ [${brandId}] AUSENTE no banco: ${li.testId} (${li.name})`); problems++; continue }

    // status
    if (norm(row.status) !== norm(li.status)) { console.log(`✗ [${brandId}] status ${li.testId}: db=${row.status} elevate=${li.status}`); problems++ }
    // finished_at vs completedAt
    if (!dateEq(row.finished_at, li.completedAt)) { console.log(`✗ [${brandId}] finished_at ${li.testId}: db=${row.finished_at} elevate=${li.completedAt}`); problems++ }
    // name
    if ((row.name || '') !== (li.name || '')) { console.log(`✗ [${brandId}] name ${li.testId}: db="${row.name}" elevate="${li.name}"`); problems++ }

    // For refetched tests, verify metrics match the results payload
    const res = bd.results?.[li.testId]
    if (res) {
      const control = res.variations.find(v => v.isControl)
      const variant = res.variations.find(v => !v.isControl)
      const checks = [
        ['control_cr', control?.conversionRate], ['control_rpv', control?.revenuePerVisitor],
        ['control_aov', control?.averageOrderValue], ['control_revenue', control?.totalRevenue],
        ['control_visitors', control?.uniqueVisitors],
        ['variant_cr', variant?.conversionRate], ['variant_rpv', variant?.revenuePerVisitor],
        ['variant_aov', variant?.averageOrderValue], ['variant_revenue', variant?.totalRevenue],
        ['variant_visitors', variant?.uniqueVisitors],
        ['lift_rpv_pct', variant?.revenuePerVisitorLiftPercentage],
        ['lift_cr_pct', variant?.conversionRateLiftPercentage],
      ]
      for (const [col, expected] of checks) {
        if (expected !== undefined && !numEq(row[col], expected)) {
          console.log(`✗ [${brandId}] ${col} ${li.testId}: db=${row[col]} esperado=${expected}`); problems++
        }
      }
      // variant id should be set when a variant exists
      if (variant && String(row.variant_variation_id) !== String(variant.variationId)) {
        console.log(`✗ [${brandId}] variant_variation_id ${li.testId}: db=${row.variant_variation_id} esperado=${variant.variationId}`); problems++
      }
      // stat status
      const sig = bd.significance?.[li.testId]
      if (sig && row.statistical_status !== sig.statisticalStatus) {
        console.log(`✗ [${brandId}] statistical_status ${li.testId}: db=${row.statistical_status} esperado=${sig.statisticalStatus}`); problems++
      }
    }

    // last_synced_at should be today (data da execução)
    const TODAY = new Date().toISOString().slice(0, 10)
    if (!row.last_synced_at || !String(row.last_synced_at).startsWith(TODAY)) {
      console.log(`✗ [${brandId}] last_synced_at desatualizado ${li.testId}: ${row.last_synced_at}`); problems++
    }
  }

  // extra rows in DB not in Elevate (orphans)
  const elevSet = new Set(bd.tests.map(t => t.testId))
  for (const r of (rows || [])) if (!elevSet.has(r.id)) { console.log(`✗ [${brandId}] ÓRFÃO ainda presente: ${r.id}`); problems++ }
}

// global duplicate id check (same id under >1 brand)
const idOnly = allDbIds.map(x => x.split(':')[1])
const dupe = idOnly.filter((v, i) => idOnly.indexOf(v) !== i)
if (dupe.length) { console.log(`✗ IDs duplicados entre marcas: ${[...new Set(dupe)].join(', ')}`); problems += dupe.length }

console.log(`\n${problems === 0 ? '✅ AUDITORIA OK — zero divergências de conteúdo' : `⚠️ ${problems} divergência(s) encontrada(s)`}`)

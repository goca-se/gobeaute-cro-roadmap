#!/usr/bin/env node
// Sync Elevate -> Supabase WITH orphan cleanup.
// - Upserts tests that have results data (full normalization + snapshot).
// - For "done" tests present in DB but NOT refetched, light-updates status/finished_at/name only (keeps metrics).
// - Deletes tests present in DB but absent from Elevate (orphans), incl. snapshots + notes.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { classifyTest } from '../src/data/abTestFamilies.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8').split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())).filter(([k]) => k)
)

const SUPABASE_URL = env['VITE_SUPABASE_URL']
const SERVICE_KEY = env['VITE_SUPABASE_SERVICE_ROLE_KEY']
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não encontradas no .env')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)
const NOW = new Date().toISOString()
const DRY_RUN = process.argv.includes('--dry-run')

const safeNum = v => { if (v == null) return null; const n = typeof v === 'number' ? v : parseFloat(v); return isNaN(n) ? null : n }
const safeInt = v => { if (v == null) return null; const n = typeof v === 'number' ? Math.round(v) : parseInt(v, 10); return isNaN(n) ? null : n }
const safeDate = v => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString() }
const normalizeStatus = s => { const l = (s || '').toLowerCase(); return ['running','paused','done','draft'].includes(l) ? l : 'draft' }

function determineWinner(goal, sigData, variations) {
  const r = { isWinner: false, winnerVariationId: null, winnerVariationName: null }
  if (!sigData?.results || !goal || !variations?.length) return r
  const goalResults = sigData.results[goal]
  if (!Array.isArray(goalResults)) return r
  const winner = goalResults.find(x => x.percentage > 50)
  if (!winner) return r
  const winnerVarId = String(winner.variant)
  const control = variations.find(v => v.isControl)
  if (control && String(control.variationId) === winnerVarId) return r
  const winnerVar = variations.find(v => String(v.variationId) === winnerVarId)
  r.isWinner = true
  r.winnerVariationId = winnerVarId
  r.winnerVariationName = winnerVar?.variationName || null
  return r
}

function normalizeTest(brandId, listItem, resultsData, sigData) {
  const status = normalizeStatus(listItem.status)
  const variations = resultsData?.variations || []
  const control = variations.find(v => v.isControl)
  const variant = variations.find(v => !v.isControl)
  const controlAov = safeNum(control?.averageOrderValue)
  const variantAov = safeNum(variant?.averageOrderValue)
  let liftAovPct = null
  if (controlAov && controlAov !== 0 && variantAov !== null)
    liftAovPct = Math.round(((variantAov - controlAov) / controlAov) * 10000) / 100
  const goal = listItem.goal || 'REVENUE_PER_VISITOR'
  const winnerInfo = determineWinner(goal, sigData, variations)
  // Classificação de família (matriz cross-marca). Ver ADR-006.
  const fam = classifyTest(listItem.name || '')
  return {
    id: listItem.testId, brand_id: brandId, name: listItem.name || '', type: listItem.type || null, status, goal,
    family_id: fam.id === '__unclassified' ? null : fam.id,
    family_label: fam.id === '__unclassified' ? null : fam.label,
    area: fam.area || null,
    started_at: safeDate(listItem.startingAt), finished_at: safeDate(listItem.completedAt),
    traffic_percentage: safeInt(listItem.testTrafficPercentage),
    winner_variation_id: winnerInfo.winnerVariationId,
    winner_variation_name: winnerInfo.winnerVariationName,
    is_winner: winnerInfo.isWinner,
    control_visitors: safeInt(control?.uniqueVisitors), control_sessions: safeInt(control?.sessions),
    control_conversions: safeInt(control?.conversions), control_cr: safeNum(control?.conversionRate),
    control_rpv: safeNum(control?.revenuePerVisitor), control_aov: controlAov, control_revenue: safeNum(control?.totalRevenue),
    control_add_to_cart_rate: safeNum(control?.addToCartRate), control_checkout_start_rate: safeNum(control?.checkoutStartRate),
    variant_variation_id: variant ? String(variant.variationId) : null, variant_variation_name: variant?.variationName || null,
    variant_visitors: safeInt(variant?.uniqueVisitors), variant_sessions: safeInt(variant?.sessions),
    variant_conversions: safeInt(variant?.conversions), variant_cr: safeNum(variant?.conversionRate),
    variant_rpv: safeNum(variant?.revenuePerVisitor), variant_aov: variantAov, variant_revenue: safeNum(variant?.totalRevenue),
    variant_add_to_cart_rate: safeNum(variant?.addToCartRate), variant_checkout_start_rate: safeNum(variant?.checkoutStartRate),
    lift_cr_pct: safeNum(variant?.conversionRateLiftPercentage),
    lift_rpv_pct: safeNum(variant?.revenuePerVisitorLiftPercentage),
    lift_aov_pct: liftAovPct,
    statistical_status: sigData?.statisticalStatus || null,
    statistical_significance: sigData || null,
    raw_list_data: listItem, raw_results_data: resultsData, raw_significance_data: sigData,
    last_synced_at: NOW, updated_at: NOW,
  }
}

const dataPath = join(__dir, process.argv[2] || 'sync-data-2026-06-05.json')
const ALL_DATA = JSON.parse(readFileSync(dataPath, 'utf-8'))

// Blocklist: testes removidos manualmente que NÃO devem voltar, mesmo existindo na Elevate.
let IGNORED = {}
try { IGNORED = JSON.parse(readFileSync(join(__dir, 'ignored-tests.json'), 'utf-8')) } catch { /* sem blocklist */ }
for (const [brandId, bd] of Object.entries(ALL_DATA)) {
  const block = new Set(IGNORED[brandId] || [])
  if (block.size) bd.tests = (bd.tests || []).filter(t => !block.has(t.testId))
}

console.log(`🔄 Elevate Sync + Cleanup — ${NOW}${DRY_RUN ? '  [DRY RUN]' : ''}\n`)

const totals = { fetched: 0, upserted: 0, lightUpdated: 0, deleted: 0, errors: 0 }

for (const [brandId, brandData] of Object.entries(ALL_DATA)) {
  const stats = { fetched: 0, upserted: 0, lightUpdated: 0, deleted: 0, errors: 0 }
  const tests = brandData.tests || []
  stats.fetched = tests.length
  const elevateIds = new Set(tests.map(t => t.testId))

  // Current DB rows for this brand
  const { data: existingRows } = await sb.from('ab_tests').select('id').eq('brand_id', brandId)
  const existingIds = new Set((existingRows || []).map(r => r.id))

  // 1) Process each Elevate test
  for (const listItem of tests) {
    try {
      const resultsData = brandData.results?.[listItem.testId] || null
      const sigData = brandData.significance?.[listItem.testId] || null

      if (resultsData) {
        // Full refresh
        const normalized = normalizeTest(brandId, listItem, resultsData, sigData)
        const { error: upErr } = await DRY(sb.from('ab_tests').upsert(normalized, { onConflict: 'id,brand_id' }))
        if (upErr) { stats.errors++; console.error(`   ⚠️ upsert ${listItem.testId}: ${upErr.message}`); continue }
        const { error: snapErr } = await DRY(sb.from('ab_test_snapshots').insert({
          test_id: listItem.testId, brand_id: brandId,
          control_cr: normalized.control_cr, control_rpv: normalized.control_rpv, control_aov: normalized.control_aov,
          control_revenue: normalized.control_revenue, control_visitors: normalized.control_visitors,
          variant_cr: normalized.variant_cr, variant_rpv: normalized.variant_rpv, variant_aov: normalized.variant_aov,
          variant_revenue: normalized.variant_revenue, variant_visitors: normalized.variant_visitors,
          lift_cr_pct: normalized.lift_cr_pct, lift_rpv_pct: normalized.lift_rpv_pct, lift_aov_pct: normalized.lift_aov_pct,
          statistical_status: normalized.statistical_status,
        }))
        if (snapErr) { stats.errors++; console.error(`   ⚠️ snapshot ${listItem.testId}: ${snapErr.message}`) }
        stats.upserted++
      } else if (existingIds.has(listItem.testId)) {
        // Light update: keep metrics, sync status/finished_at/name to current Elevate state
        const fam = classifyTest(listItem.name || '')
        const { error: updErr } = await DRY(sb.from('ab_tests').update({
          status: normalizeStatus(listItem.status),
          finished_at: safeDate(listItem.completedAt),
          name: listItem.name || '',
          family_id: fam.id === '__unclassified' ? null : fam.id,
          family_label: fam.id === '__unclassified' ? null : fam.label,
          area: fam.area || null,
          last_synced_at: NOW, updated_at: NOW,
        }).eq('id', listItem.testId).eq('brand_id', brandId))
        if (updErr) { stats.errors++; console.error(`   ⚠️ light-update ${listItem.testId}: ${updErr.message}`); continue }
        stats.lightUpdated++
      } else {
        // In Elevate, not in DB, and no detail fetched — skip (would be incomplete)
        console.warn(`   ℹ️ ${listItem.testId} (${listItem.name}) está na Elevate mas sem detalhes coletados; não inserido.`)
      }
    } catch (err) {
      stats.errors++
      console.error(`   ⚠️ error ${listItem.testId}: ${err.message}`)
    }
  }

  // 2) Delete orphans (in DB, absent from Elevate)
  const orphans = [...existingIds].filter(id => !elevateIds.has(id))
  for (const orphanId of orphans) {
    try {
      await DRY(sb.from('ab_test_notes').delete().eq('test_id', orphanId).eq('brand_id', brandId))
      await DRY(sb.from('ab_test_snapshots').delete().eq('test_id', orphanId).eq('brand_id', brandId))
      const { error: delErr } = await DRY(sb.from('ab_tests').delete().eq('id', orphanId).eq('brand_id', brandId))
      if (delErr) { stats.errors++; console.error(`   ⚠️ delete ${orphanId}: ${delErr.message}`); continue }
      stats.deleted++
      console.log(`   🗑️  removido órfão ${brandId}/${orphanId}`)
    } catch (err) {
      stats.errors++
      console.error(`   ⚠️ delete error ${orphanId}: ${err.message}`)
    }
  }

  if (!DRY_RUN) {
    await sb.from('ab_sync_log').insert({
      brand_id: brandId, trigger_type: 'cron',
      tests_fetched: stats.fetched, tests_updated: stats.upserted + stats.lightUpdated, tests_skipped: 0,
      errors: stats.deleted ? [`deleted_orphans:${stats.deleted}`] : [],
      finished_at: NOW, status: stats.errors > 0 ? 'partial' : 'success',
    })
  }

  console.log(`✅ ${brandId.padEnd(10)} elevate=${stats.fetched} upserted=${stats.upserted} lightUpdated=${stats.lightUpdated} deleted=${stats.deleted} errors=${stats.errors}`)
  for (const k of Object.keys(totals)) totals[k] += stats[k]
}

console.log(`\n📊 Total: elevate=${totals.fetched} upserted=${totals.upserted} lightUpdated=${totals.lightUpdated} deleted=${totals.deleted} errors=${totals.errors}`)
console.log(DRY_RUN ? '\n🟡 DRY RUN — nada foi gravado.' : '\n✅ Sync + cleanup concluído!')

// Helper: in dry-run, do not execute the query (just report intent via thenable no-op)
function DRY(query) {
  if (!DRY_RUN) return query
  return Promise.resolve({ error: null, data: null })
}

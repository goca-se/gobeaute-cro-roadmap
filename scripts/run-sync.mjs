#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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
const TODAY = new Date()
const THREE_DAYS_AGO = new Date(TODAY.getTime() - 3 * 24 * 60 * 60 * 1000)

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
  return {
    id: listItem.testId, brand_id: brandId, name: listItem.name || '', type: listItem.type || null, status, goal,
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
    last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }
}

const dataPath = join(__dir, process.argv[2] || 'sync-data-2026-05-04.json')
const ALL_DATA = JSON.parse(readFileSync(dataPath, 'utf-8'))

console.log(`🔄 Elevate Sync — ${TODAY.toISOString()}`)
console.log()

const totals = { fetched: 0, updated: 0, skipped: 0, errors: 0 }

for (const [brandId, brandData] of Object.entries(ALL_DATA)) {
  const stats = { fetched: 0, updated: 0, skipped: 0, errors: 0 }
  const tests = brandData.tests || []
  stats.fetched = tests.length

  // Existing IDs for this brand
  const { data: existingRows } = await sb.from('ab_tests').select('id').eq('brand_id', brandId)
  const existingIds = new Set((existingRows || []).map(r => r.id))

  for (const listItem of tests) {
    try {
      // Skip rule: status=done, completedAt < 3 days ago, already in DB
      if (
        normalizeStatus(listItem.status) === 'done' &&
        listItem.completedAt &&
        new Date(listItem.completedAt) < THREE_DAYS_AGO &&
        existingIds.has(listItem.testId)
      ) {
        stats.skipped++
        continue
      }

      const resultsData = brandData.results?.[listItem.testId] || null
      const sigData = brandData.significance?.[listItem.testId] || null
      const normalized = normalizeTest(brandId, listItem, resultsData, sigData)

      const { error: upErr } = await sb.from('ab_tests').upsert(normalized, { onConflict: 'id,brand_id' })
      if (upErr) { stats.errors++; console.error(`   ⚠️ upsert ${listItem.testId}: ${upErr.message}`); continue }

      const { error: snapErr } = await sb.from('ab_test_snapshots').insert({
        test_id: listItem.testId, brand_id: brandId,
        control_cr: normalized.control_cr, control_rpv: normalized.control_rpv, control_aov: normalized.control_aov,
        control_revenue: normalized.control_revenue, control_visitors: normalized.control_visitors,
        variant_cr: normalized.variant_cr, variant_rpv: normalized.variant_rpv, variant_aov: normalized.variant_aov,
        variant_revenue: normalized.variant_revenue, variant_visitors: normalized.variant_visitors,
        lift_cr_pct: normalized.lift_cr_pct, lift_rpv_pct: normalized.lift_rpv_pct, lift_aov_pct: normalized.lift_aov_pct,
        statistical_status: normalized.statistical_status,
      })
      if (snapErr) { stats.errors++; console.error(`   ⚠️ snapshot ${listItem.testId}: ${snapErr.message}`) }
      stats.updated++
    } catch (err) {
      stats.errors++
      console.error(`   ⚠️ error ${listItem.testId}: ${err.message}`)
    }
  }

  await sb.from('ab_sync_log').insert({
    brand_id: brandId, trigger_type: 'cron',
    tests_fetched: stats.fetched, tests_updated: stats.updated, tests_skipped: stats.skipped,
    errors: [], finished_at: new Date().toISOString(),
    status: stats.errors > 0 ? 'partial' : 'success',
  })

  console.log(`✅ ${brandId.padEnd(10)} fetched=${stats.fetched} updated=${stats.updated} skipped=${stats.skipped} errors=${stats.errors}`)
  totals.fetched += stats.fetched
  totals.updated += stats.updated
  totals.skipped += stats.skipped
  totals.errors += stats.errors
}

console.log()
console.log(`📊 Total: fetched=${totals.fetched} updated=${totals.updated} skipped=${totals.skipped} errors=${totals.errors}`)
console.log()
console.log('✅ Sync concluído com sucesso!')

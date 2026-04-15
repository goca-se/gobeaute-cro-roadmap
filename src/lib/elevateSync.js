import { supabase, isConfigured } from './supabase'

/**
 * Normalizes a status string from Elevate MCP (capitalized) to lowercase.
 */
function normalizeStatus(status) {
  if (!status || typeof status !== 'string') return 'draft'
  const lower = status.toLowerCase()
  if (['running', 'paused', 'done', 'draft'].includes(lower)) return lower
  return 'draft'
}

/**
 * Safely parses a numeric value, returning null if invalid.
 */
function safeNum(val) {
  if (val === null || val === undefined) return null
  const n = typeof val === 'number' ? val : parseFloat(val)
  return isNaN(n) ? null : n
}

/**
 * Safely parses an integer value, returning null if invalid.
 */
function safeInt(val) {
  if (val === null || val === undefined) return null
  const n = typeof val === 'number' ? Math.round(val) : parseInt(val, 10)
  return isNaN(n) ? null : n
}

/**
 * Safely parses an ISO date string, returning null if invalid.
 */
function safeDate(val) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * Determines the winner of a test based on statistical significance and the test goal.
 *
 * Logic: In the significance results for the goal metric, the variant with percentage > 50
 * is the winner for that metric. If that variant is NOT the control, the test has a winner.
 */
export function determineWinner(goal, significanceData, variations) {
  const result = { isWinner: false, winnerVariationId: null, winnerVariationName: null }

  if (!significanceData?.results || !goal || !variations?.length) return result

  const goalResults = significanceData.results[goal]
  if (!goalResults || !Array.isArray(goalResults)) return result

  const winner = goalResults.find(r => r.percentage > 50)
  if (!winner) return result

  const winnerVarId = String(winner.variant)
  const control = variations.find(v => v.isControl)
  const controlVarId = control ? String(control.variationId) : null

  // If the control wins, the test didn't produce a winning variant
  if (winnerVarId === controlVarId) return result

  const winnerVariation = variations.find(v => String(v.variationId) === winnerVarId)
  result.isWinner = true
  result.winnerVariationId = winnerVarId
  result.winnerVariationName = winnerVariation?.variationName || null

  return result
}

/**
 * Checks if a test should be skipped during sync.
 * Skip if: status is "done", finished more than 3 days ago, and already exists in DB.
 */
export function shouldSkipTest(listItem, existingTestIds) {
  if (normalizeStatus(listItem.status) !== 'done') return false
  if (!listItem.completedAt) return false

  const finishedAt = new Date(listItem.completedAt)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  if (finishedAt >= threeDaysAgo) return false

  return existingTestIds.has(listItem.testId)
}

/**
 * Normalizes MCP data into the ab_tests schema.
 */
export function normalizeTest(listItem, resultsData, significanceData) {
  const errors = []
  const status = normalizeStatus(listItem.status)

  // Find control and main variant
  const variations = resultsData?.variations || []
  const control = variations.find(v => v.isControl)
  const variant = variations.find(v => !v.isControl)

  if (!control && variations.length > 0) {
    errors.push(`Test ${listItem.testId}: no control variation found`)
  }
  if (!variant && variations.length > 1) {
    errors.push(`Test ${listItem.testId}: no non-control variation found`)
  }

  // Calculate AOV lift
  const controlAov = safeNum(control?.averageOrderValue)
  const variantAov = safeNum(variant?.averageOrderValue)
  let liftAovPct = null
  if (controlAov && controlAov !== 0 && variantAov !== null) {
    liftAovPct = Math.round(((variantAov - controlAov) / controlAov) * 10000) / 100
  }

  // Determine winner
  const goal = listItem.goal || 'REVENUE_PER_VISITOR'
  const winnerInfo = determineWinner(goal, significanceData, variations)

  const normalized = {
    id: listItem.testId,
    name: listItem.name || '',
    type: listItem.type || null,
    status,
    goal,
    started_at: safeDate(listItem.startingAt),
    finished_at: safeDate(listItem.completedAt),
    traffic_percentage: safeInt(listItem.testTrafficPercentage),

    // Winner
    winner_variation_id: winnerInfo.winnerVariationId,
    winner_variation_name: winnerInfo.winnerVariationName,
    is_winner: winnerInfo.isWinner,

    // Control metrics
    control_visitors: safeInt(control?.uniqueVisitors),
    control_sessions: safeInt(control?.sessions),
    control_conversions: safeInt(control?.conversions),
    control_cr: safeNum(control?.conversionRate),
    control_rpv: safeNum(control?.revenuePerVisitor),
    control_aov: controlAov,
    control_revenue: safeNum(control?.totalRevenue),
    control_add_to_cart_rate: safeNum(control?.addToCartRate),
    control_checkout_start_rate: safeNum(control?.checkoutStartRate),

    // Variant metrics
    variant_variation_id: variant ? String(variant.variationId) : null,
    variant_variation_name: variant?.variationName || null,
    variant_visitors: safeInt(variant?.uniqueVisitors),
    variant_sessions: safeInt(variant?.sessions),
    variant_conversions: safeInt(variant?.conversions),
    variant_cr: safeNum(variant?.conversionRate),
    variant_rpv: safeNum(variant?.revenuePerVisitor),
    variant_aov: variantAov,
    variant_revenue: safeNum(variant?.totalRevenue),
    variant_add_to_cart_rate: safeNum(variant?.addToCartRate),
    variant_checkout_start_rate: safeNum(variant?.checkoutStartRate),

    // Lifts
    lift_cr_pct: safeNum(variant?.conversionRateLiftPercentage),
    lift_rpv_pct: safeNum(variant?.revenuePerVisitorLiftPercentage),
    lift_aov_pct: liftAovPct,

    // Significance
    statistical_status: significanceData?.statisticalStatus || null,
    statistical_significance: significanceData || null,

    // Raw data for auditing
    raw_list_data: listItem,
    raw_results_data: resultsData,
    raw_significance_data: significanceData,

    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return { normalized, errors }
}

/**
 * Syncs tests for a single brand to Supabase.
 * mcpData = { tests: listItem[], results: { [testId]: resultsData }, significance: { [testId]: sigData } }
 */
export async function syncBrandTests(brandId, mcpData) {
  if (!isConfigured || !supabase) {
    return { fetched: 0, updated: 0, skipped: 0, errors: ['Supabase not configured'] }
  }

  const stats = { fetched: 0, updated: 0, skipped: 0, errors: [] }
  const tests = mcpData.tests || []
  stats.fetched = tests.length

  // Get existing test IDs for skip logic
  const { data: existingTests } = await supabase
    .from('ab_tests')
    .select('id')
    .eq('brand_id', brandId)

  const existingIds = new Set((existingTests || []).map(t => t.id))

  for (const listItem of tests) {
    try {
      if (shouldSkipTest(listItem, existingIds)) {
        stats.skipped++
        continue
      }

      const resultsData = mcpData.results?.[listItem.testId] || null
      const sigData = mcpData.significance?.[listItem.testId] || null

      const { normalized, errors } = normalizeTest(listItem, resultsData, sigData)
      if (errors.length > 0) {
        stats.errors.push(...errors)
      }

      // Upsert into ab_tests
      const { error: upsertError } = await supabase
        .from('ab_tests')
        .upsert({
          ...normalized,
          brand_id: brandId,
        }, { onConflict: 'id,brand_id' })

      if (upsertError) {
        stats.errors.push(`Upsert failed for ${listItem.testId}: ${upsertError.message}`)
        continue
      }

      // Insert snapshot
      const { error: snapError } = await supabase
        .from('ab_test_snapshots')
        .insert({
          test_id: listItem.testId,
          brand_id: brandId,
          control_cr: normalized.control_cr,
          control_rpv: normalized.control_rpv,
          control_aov: normalized.control_aov,
          control_revenue: normalized.control_revenue,
          control_visitors: normalized.control_visitors,
          variant_cr: normalized.variant_cr,
          variant_rpv: normalized.variant_rpv,
          variant_aov: normalized.variant_aov,
          variant_revenue: normalized.variant_revenue,
          variant_visitors: normalized.variant_visitors,
          lift_cr_pct: normalized.lift_cr_pct,
          lift_rpv_pct: normalized.lift_rpv_pct,
          lift_aov_pct: normalized.lift_aov_pct,
          statistical_status: normalized.statistical_status,
        })

      if (snapError) {
        stats.errors.push(`Snapshot insert failed for ${listItem.testId}: ${snapError.message}`)
      }

      stats.updated++
    } catch (err) {
      stats.errors.push(`Error processing test ${listItem.testId}: ${err.message}`)
    }
  }

  return stats
}

/**
 * Logs a sync execution to ab_sync_log.
 */
export async function logSync(brandId, triggerType, stats) {
  if (!isConfigured || !supabase) return

  await supabase.from('ab_sync_log').insert({
    brand_id: brandId,
    trigger_type: triggerType,
    tests_fetched: stats.fetched,
    tests_updated: stats.updated,
    tests_skipped: stats.skipped,
    errors: stats.errors.length > 0 ? stats.errors : [],
    finished_at: new Date().toISOString(),
    status: stats.errors.length > 0 ? 'partial' : 'success',
  })
}

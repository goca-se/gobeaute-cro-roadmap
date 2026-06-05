/**
 * One-time seed script: inserts collected MCP data into Supabase ab_tests + ab_test_snapshots.
 * Run: node scripts/seed-ab-tests.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars')
  process.exit(1)
}
const supabase = createClient(url, key)

function safeNum(v) { if (v == null) return null; const n = parseFloat(v); return isNaN(n) ? null : n }
function safeInt(v) { if (v == null) return null; const n = parseInt(v, 10); return isNaN(n) ? null : n }
function safeDate(v) { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString() }

function determineWinner(goal, sig, variations) {
  const r = { isWinner: false, winnerVariationId: null, winnerVariationName: null }
  if (!sig?.results || !goal || !variations?.length) return r
  const goalResults = sig.results[goal]
  if (!goalResults || !Array.isArray(goalResults)) return r
  const winner = goalResults.find(x => x.percentage > 50)
  if (!winner) return r
  const wId = String(winner.variant)
  const control = variations.find(v => v.isControl)
  if (control && String(control.variationId) === wId) return r
  const wVar = variations.find(v => String(v.variationId) === wId)
  return { isWinner: true, winnerVariationId: wId, winnerVariationName: wVar?.variationName || null }
}

function normalize(brandId, listItem, results, sig) {
  const status = (listItem.status || '').toLowerCase()
  const variations = results?.variations || []
  const control = variations.find(v => v.isControl)
  const variant = variations.find(v => !v.isControl)
  const goal = listItem.goal || 'REVENUE_PER_VISITOR'
  const w = determineWinner(goal, sig, variations)
  const cAov = safeNum(control?.averageOrderValue)
  const vAov = safeNum(variant?.averageOrderValue)
  const liftAov = (cAov && cAov !== 0 && vAov != null) ? Math.round(((vAov - cAov) / cAov) * 10000) / 100 : null

  return {
    id: listItem.testId, brand_id: brandId,
    name: listItem.name || '', type: listItem.type || null,
    status: ['running','paused','done','draft'].includes(status) ? status : 'draft',
    goal,
    winner_variation_id: w.winnerVariationId, winner_variation_name: w.winnerVariationName, is_winner: w.isWinner,
    started_at: safeDate(listItem.startingAt), finished_at: safeDate(listItem.completedAt),
    traffic_percentage: safeInt(listItem.testTrafficPercentage),
    control_visitors: safeInt(control?.uniqueVisitors), control_sessions: safeInt(control?.sessions),
    control_conversions: safeInt(control?.conversions), control_cr: safeNum(control?.conversionRate),
    control_rpv: safeNum(control?.revenuePerVisitor), control_aov: cAov,
    control_revenue: safeNum(control?.totalRevenue),
    control_add_to_cart_rate: safeNum(control?.addToCartRate), control_checkout_start_rate: safeNum(control?.checkoutStartRate),
    variant_variation_id: variant ? String(variant.variationId) : null,
    variant_variation_name: variant?.variationName || null,
    variant_visitors: safeInt(variant?.uniqueVisitors), variant_sessions: safeInt(variant?.sessions),
    variant_conversions: safeInt(variant?.conversions), variant_cr: safeNum(variant?.conversionRate),
    variant_rpv: safeNum(variant?.revenuePerVisitor), variant_aov: vAov,
    variant_revenue: safeNum(variant?.totalRevenue),
    variant_add_to_cart_rate: safeNum(variant?.addToCartRate), variant_checkout_start_rate: safeNum(variant?.checkoutStartRate),
    lift_cr_pct: safeNum(variant?.conversionRateLiftPercentage), lift_rpv_pct: safeNum(variant?.revenuePerVisitorLiftPercentage),
    lift_aov_pct: liftAov,
    statistical_status: sig?.statisticalStatus || null, statistical_significance: sig || null,
    raw_list_data: listItem, raw_results_data: results, raw_significance_data: sig,
    last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }
}

// All collected data from MCP
const ALL_DATA = {
  apice: {
    tests: [
      {"testId":"55c9a13b-2ba9-4414-a73a-0b4cb27bffb2","name":"[Tema] Informações de Preço: completas vs. apenas parcelado","type":"THEME","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-27T20:59:02.000Z","completedAt":null,"testTrafficPercentage":25},
      {"testId":"80a42e9a-ca23-432e-8d15-7dc4c08e600b","name":"[Home] Trust Icons","type":"CUSTOM_CODE","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-12T02:52:16.000Z","completedAt":null,"testTrafficPercentage":25},
      {"testId":"a0898a11-23f6-45bd-adee-4126b716c3fe","name":"[PDP] Lista de Upsell Vertical","type":"PAGE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-27T20:35:41.000Z","completedAt":"2026-04-08T21:39:30.000Z","testTrafficPercentage":15},
      {"testId":"33660f21-9afb-45e9-a089-7f04cbf5bd81","name":"[PDP] Formatação de preço e desconto","type":"PAGE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-05T02:53:55.000Z","completedAt":"2026-04-06T14:09:57.000Z","testTrafficPercentage":25},
      {"testId":"49bea203-e3d0-40c5-8a5b-32a049a0b07b","name":"[URL] Teste de Pop-Up de WhatsApp de grupo de vendas (all pages)","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-10T13:00:02.000Z","completedAt":"2026-04-06T13:06:25.000Z","testTrafficPercentage":null},
      {"testId":"150b0597-0b92-4155-8685-ad9133385af9","name":"Destaque para desconto do Pix (5%)","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-13T17:27:53.000Z","completedAt":"2026-03-09T22:23:58.000Z","testTrafficPercentage":null},
      {"testId":"881cad55-d226-4ab4-9089-778e5e423475","name":"Refatoração do Card de Produto — Ápice","type":"THEME","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-27T21:52:35.000Z","completedAt":"2026-03-09T22:15:27.000Z","testTrafficPercentage":50},
      {"testId":"daac5554-1853-414b-bed6-2e319124b598","name":"Cronometro com CTA","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-27T22:23:41.000Z","completedAt":"2026-03-04T19:54:03.000Z","testTrafficPercentage":25},
      {"testId":"f5b72f53-3e51-4f09-b4e2-f7cff8998679","name":"Banner na Announcement Bar vs Sem Banner na Announcement Bar","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-11T21:57:52.000Z","completedAt":"2026-02-27T21:53:10.000Z","testTrafficPercentage":50},
      {"testId":"57a016b3-da96-416c-957b-9b147a6e8f1f","name":"Carrosel 2,5 vs. Carrosel 1,5 vs. Grid","type":"PAGE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-28T21:21:37.000Z","completedAt":"2026-02-13T17:15:43.000Z","testTrafficPercentage":null},
      {"testId":"2818305f-5920-418d-a57d-adedfaf8bb49","name":"Videowise vs. Sem Videowise","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-15T18:20:54.000Z","completedAt":"2026-01-29T13:44:47.000Z","testTrafficPercentage":null},
      {"testId":"bcd73e46-a1d4-42bb-9056-336a1ecaf5d6","name":"Carrinho Upcart vs. Carrinho Nativo","type":"THEME","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-15T13:57:24.000Z","completedAt":"2026-01-23T21:09:25.000Z","testTrafficPercentage":50},
    ],
    results: {
      "55c9a13b-2ba9-4414-a73a-0b4cb27bffb2":{"variations":[{"variationId":37693,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":117423,"sessions":117423,"conversions":5484,"conversionRate":4.67,"totalRevenue":872310.61,"revenuePerVisitor":7.43,"averageOrderValue":147.72,"addToCartRate":17.95,"checkoutStartRate":4.4},{"variationId":37694,"variationName":"Info de Preço Reduzida","isControl":false,"trafficPercentage":50,"uniqueVisitors":112784,"sessions":112784,"conversions":5386,"conversionRate":4.78,"totalRevenue":875234.09,"revenuePerVisitor":7.76,"averageOrderValue":150.13,"addToCartRate":18.68,"checkoutStartRate":4.47,"conversionRateLiftPercentage":2.36,"revenuePerVisitorLiftPercentage":4.44}]},
      "80a42e9a-ca23-432e-8d15-7dc4c08e600b":{"variations":[{"variationId":36096,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":123066,"sessions":123066,"conversions":6375,"conversionRate":5.18,"totalRevenue":1113328.77,"revenuePerVisitor":9.05,"averageOrderValue":161.03,"addToCartRate":19.53,"checkoutStartRate":4.89},{"variationId":36097,"variationName":"Trust Icon","isControl":false,"trafficPercentage":50,"uniqueVisitors":123611,"sessions":123611,"conversions":6490,"conversionRate":5.25,"totalRevenue":1139797.56,"revenuePerVisitor":9.22,"averageOrderValue":161.74,"addToCartRate":19.45,"checkoutStartRate":4.94,"conversionRateLiftPercentage":1.35,"revenuePerVisitorLiftPercentage":1.88}]},
      "a0898a11-23f6-45bd-adee-4126b716c3fe":{"variations":[{"variationId":37663,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":16642,"sessions":16642,"conversions":1433,"conversionRate":8.61,"totalRevenue":242428.97,"revenuePerVisitor":14.57,"averageOrderValue":157.93,"addToCartRate":31.71,"checkoutStartRate":8.12},{"variationId":37664,"variationName":"Lista de Upsell Vertical","isControl":false,"trafficPercentage":50,"uniqueVisitors":16525,"sessions":16525,"conversions":1367,"conversionRate":8.27,"totalRevenue":218791.02,"revenuePerVisitor":13.24,"averageOrderValue":151.73,"addToCartRate":31.59,"checkoutStartRate":7.91,"conversionRateLiftPercentage":-3.95,"revenuePerVisitorLiftPercentage":-9.13}]},
      "33660f21-9afb-45e9-a089-7f04cbf5bd81":{"variations":[{"variationId":35317,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":112684,"sessions":112684,"conversions":10361,"conversionRate":9.19,"totalRevenue":1796065,"revenuePerVisitor":15.94,"averageOrderValue":158.24,"addToCartRate":31.7,"checkoutStartRate":8.73},{"variationId":35318,"variationName":"Tag de Desconto","isControl":false,"trafficPercentage":50,"uniqueVisitors":111647,"sessions":111647,"conversions":9979,"conversionRate":8.94,"totalRevenue":1738339.41,"revenuePerVisitor":15.57,"averageOrderValue":159.61,"addToCartRate":31.32,"checkoutStartRate":8.47,"conversionRateLiftPercentage":-2.72,"revenuePerVisitorLiftPercentage":-2.32}]},
      "49bea203-e3d0-40c5-8a5b-32a049a0b07b":{"variations":[{"variationId":35873,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":98427,"sessions":98427,"conversions":4134,"conversionRate":4.2,"totalRevenue":717379.91,"revenuePerVisitor":7.29,"averageOrderValue":155.58,"addToCartRate":15.46,"checkoutStartRate":4.01},{"variationId":35874,"variationName":"WhatsPop","isControl":false,"trafficPercentage":50,"uniqueVisitors":98019,"sessions":98019,"conversions":4073,"conversionRate":4.16,"totalRevenue":723656.06,"revenuePerVisitor":7.38,"averageOrderValue":158.87,"addToCartRate":15.56,"checkoutStartRate":3.99,"conversionRateLiftPercentage":-0.95,"revenuePerVisitorLiftPercentage":1.23}]},
      "150b0597-0b92-4155-8685-ad9133385af9":{"variations":[{"variationId":33785,"variationName":"Sem PIX","isControl":true,"trafficPercentage":50,"uniqueVisitors":393865,"sessions":393865,"conversions":15263,"conversionRate":3.88,"totalRevenue":2631336.93,"revenuePerVisitor":6.68,"averageOrderValue":156.58,"addToCartRate":14.87,"checkoutStartRate":3.81},{"variationId":33786,"variationName":"Destaque PIX","isControl":false,"trafficPercentage":50,"uniqueVisitors":395898,"sessions":395898,"conversions":15543,"conversionRate":3.93,"totalRevenue":2682637.98,"revenuePerVisitor":6.78,"averageOrderValue":156.66,"addToCartRate":15.16,"checkoutStartRate":3.86,"conversionRateLiftPercentage":1.29,"revenuePerVisitorLiftPercentage":1.5}]},
      "881cad55-d226-4ab4-9089-778e5e423475":{"variations":[{"variationId":35012,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":117754,"sessions":117754,"conversions":4535,"conversionRate":3.85,"totalRevenue":776650.75,"revenuePerVisitor":6.6,"averageOrderValue":156.55,"addToCartRate":15.15,"checkoutStartRate":3.75},{"variationId":35013,"variationName":"Card Novo","isControl":false,"trafficPercentage":50,"uniqueVisitors":113011,"sessions":113011,"conversions":4552,"conversionRate":4.03,"totalRevenue":770668.38,"revenuePerVisitor":6.82,"averageOrderValue":154.72,"addToCartRate":15.68,"checkoutStartRate":3.93,"conversionRateLiftPercentage":4.68,"revenuePerVisitorLiftPercentage":3.33}]},
      "daac5554-1853-414b-bed6-2e319124b598":{"variations":[{"variationId":35018,"variationName":"Sem CTA","isControl":true,"trafficPercentage":50,"uniqueVisitors":17466,"sessions":17466,"conversions":655,"conversionRate":3.75,"totalRevenue":112363.74,"revenuePerVisitor":6.43,"averageOrderValue":155.63,"addToCartRate":15.17,"checkoutStartRate":3.7},{"variationId":35019,"variationName":"Com CTA","isControl":false,"trafficPercentage":50,"uniqueVisitors":17460,"sessions":17460,"conversions":595,"conversionRate":3.41,"totalRevenue":100253.01,"revenuePerVisitor":5.74,"averageOrderValue":156.4,"addToCartRate":15.42,"checkoutStartRate":3.33,"conversionRateLiftPercentage":-9.07,"revenuePerVisitorLiftPercentage":-10.73}]},
      "f5b72f53-3e51-4f09-b4e2-f7cff8998679":{"variations":[{"variationId":33572,"variationName":"Cronometro","isControl":true,"trafficPercentage":50,"uniqueVisitors":347773,"sessions":347773,"conversions":12082,"conversionRate":3.47,"totalRevenue":2061235.82,"revenuePerVisitor":5.93,"averageOrderValue":155.79,"addToCartRate":13.88,"checkoutStartRate":3.42},{"variationId":33573,"variationName":"Sem Cronometro","isControl":false,"trafficPercentage":50,"uniqueVisitors":349599,"sessions":349599,"conversions":11944,"conversionRate":3.42,"totalRevenue":2031054.67,"revenuePerVisitor":5.81,"averageOrderValue":155.98,"addToCartRate":13.84,"checkoutStartRate":3.36,"conversionRateLiftPercentage":-1.44,"revenuePerVisitorLiftPercentage":-2.02}]},
      "57a016b3-da96-416c-957b-9b147a6e8f1f":{"variations":[{"variationId":32221,"variationName":"Control","isControl":true,"trafficPercentage":34,"uniqueVisitors":186030,"sessions":186030,"conversions":6714,"conversionRate":3.61,"totalRevenue":1119098.04,"revenuePerVisitor":6.02,"averageOrderValue":157.73,"addToCartRate":14.36,"checkoutStartRate":3.51},{"variationId":32222,"variationName":"Carrosel 1,5","isControl":false,"trafficPercentage":33,"uniqueVisitors":180643,"sessions":180643,"conversions":6296,"conversionRate":3.49,"totalRevenue":1060323.62,"revenuePerVisitor":5.87,"averageOrderValue":157.9,"addToCartRate":14.83,"checkoutStartRate":3.4,"conversionRateLiftPercentage":-3.32,"revenuePerVisitorLiftPercentage":-2.49},{"variationId":32223,"variationName":"Grid","isControl":false,"trafficPercentage":33,"uniqueVisitors":180120,"sessions":180120,"conversions":6502,"conversionRate":3.61,"totalRevenue":1108481.42,"revenuePerVisitor":6.15,"averageOrderValue":160.32,"addToCartRate":15.11,"checkoutStartRate":3.52,"conversionRateLiftPercentage":0,"revenuePerVisitorLiftPercentage":2.16}]},
      "2818305f-5920-418d-a57d-adedfaf8bb49":{"variations":[{"variationId":31188,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":206779,"sessions":206779,"conversions":5603,"conversionRate":2.71,"totalRevenue":911178.42,"revenuePerVisitor":4.41,"averageOrderValue":144.79,"addToCartRate":12.9,"checkoutStartRate":2.65},{"variationId":31189,"variationName":"Sem Videowise","isControl":false,"trafficPercentage":50,"uniqueVisitors":206403,"sessions":206403,"conversions":5537,"conversionRate":2.68,"totalRevenue":910711.11,"revenuePerVisitor":4.41,"averageOrderValue":146.49,"addToCartRate":12.96,"checkoutStartRate":2.62,"conversionRateLiftPercentage":-1.11,"revenuePerVisitorLiftPercentage":0}]},
      "bcd73e46-a1d4-42bb-9056-336a1ecaf5d6":{"variations":[{"variationId":31055,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":98743,"sessions":98743,"conversions":2573,"conversionRate":2.61,"totalRevenue":405252.24,"revenuePerVisitor":4.1,"averageOrderValue":142.54,"addToCartRate":12.71,"checkoutStartRate":2.55},{"variationId":31056,"variationName":"Carrinho Nativo","isControl":false,"trafficPercentage":50,"uniqueVisitors":92784,"sessions":92784,"conversions":2494,"conversionRate":2.69,"totalRevenue":405232.32,"revenuePerVisitor":4.37,"averageOrderValue":144.67,"addToCartRate":13.42,"checkoutStartRate":2.62,"conversionRateLiftPercentage":3.07,"revenuePerVisitorLiftPercentage":6.59}]},
    },
    significance: {
      "55c9a13b-2ba9-4414-a73a-0b4cb27bffb2":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37693","percentage":0.48},{"variant":"37694","percentage":99.52}]}},
      "80a42e9a-ca23-432e-8d15-7dc4c08e600b":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"36096","percentage":0.05},{"variant":"36097","percentage":99.95}]}},
      "a0898a11-23f6-45bd-adee-4126b716c3fe":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37663","percentage":97.23},{"variant":"37664","percentage":2.77}]}},
      "33660f21-9afb-45e9-a089-7f04cbf5bd81":{"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"35317","percentage":69.84},{"variant":"35318","percentage":30.15}]}},
      "49bea203-e3d0-40c5-8a5b-32a049a0b07b":{"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"35873","percentage":45.53},{"variant":"35874","percentage":54.46}]}},
      "150b0597-0b92-4155-8685-ad9133385af9":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"33785","percentage":9.71},{"variant":"33786","percentage":90.29}]}},
      "881cad55-d226-4ab4-9089-778e5e423475":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"35012","percentage":8.78},{"variant":"35013","percentage":91.22}]}},
      "daac5554-1853-414b-bed6-2e319124b598":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"35018","percentage":96.76},{"variant":"35019","percentage":3.24}]}},
    },
  },
  barbours: {
    tests: [
      {"testId":"11ff784c-1ca7-42f2-948a-b88626bcd712","name":"[PDP] Simplificada (enfase para conteúdo relevante)","type":"CUSTOM_CODE","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-27T18:56:08.000Z","completedAt":null,"testTrafficPercentage":33},
      {"testId":"0f766344-835a-41eb-9ed7-3772838b2884","name":"[Cart] Barra de progresso de gift no carrinho","type":"CUSTOM_CODE","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-13T04:03:08.000Z","completedAt":null,"testTrafficPercentage":30},
      {"testId":"d3bfc221-ad6c-4d9f-87a7-c0c1777e61c0","name":"[Cart] Preço cheio destacado VS Preço parcelado destacado","type":"CUSTOM_CODE","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-27T17:48:59.000Z","completedAt":null,"testTrafficPercentage":37},
      {"testId":"2f6bed1b-0e22-4444-b94f-44d6876e7eae","name":"Collection Slider Acima do Hero na Home Page","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-27T23:12:54.000Z","completedAt":"2026-03-20T19:55:23.000Z","testTrafficPercentage":25},
      {"testId":"5bd320f4-2d9d-4acd-96fd-80d30c6be855","name":"Card de Produto - Refatorado","type":"THEME","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-03T18:07:00.000Z","completedAt":"2026-03-20T19:55:10.000Z","testTrafficPercentage":50},
      {"testId":"733a04d2-d9f0-4549-98d7-e05298848c64","name":"Carrosel 2,5 (Control) vs. Grid","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-03T19:47:08.000Z","completedAt":"2026-03-13T03:48:46.000Z","testTrafficPercentage":25},
      {"testId":"3fdcfeb1-99c8-4c6e-b55b-d96f0f08a758","name":"Carrosel 1,5 vs. Carrosel 2,5 vs. Grid","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-20T21:07:21.000Z","completedAt":"2026-03-03T17:54:04.000Z","testTrafficPercentage":50},
      {"testId":"34bf5c72-38b0-4b38-937a-61a12f6741f8","name":"Sem Banner na Announcement Bar","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-11T21:46:45.000Z","completedAt":"2026-02-25T16:42:04.000Z","testTrafficPercentage":50},
      {"testId":"62d3a532-25d3-4b00-8964-a37e653bd79e","name":"Carrinho Nativo GoCart+ vs. Carrinho Nativo Barbours","type":"THEME","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-29T14:41:15.000Z","completedAt":null,"testTrafficPercentage":50},
      {"testId":"64d20841-45d2-49f9-ae03-e02f30222ff9","name":"Videowise vs. Sem Videowise","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-15T19:14:07.000Z","completedAt":"2026-01-20T12:33:52.000Z","testTrafficPercentage":null},
      {"testId":"a08fb681-1118-4111-8205-3c19c9d7db76","name":"Inspirado em vs. Sem inspiração","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-13T17:42:56.000Z","completedAt":"2026-01-15T20:14:21.000Z","testTrafficPercentage":50},
    ],
    results: {
      "11ff784c-1ca7-42f2-948a-b88626bcd712":{"variations":[{"variationId":37676,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":151304,"sessions":151304,"conversions":6519,"conversionRate":4.31,"totalRevenue":903659.52,"revenuePerVisitor":5.97,"averageOrderValue":112.94,"addToCartRate":18.41,"checkoutStartRate":4.08},{"variationId":37677,"variationName":"Incrementada","isControl":false,"trafficPercentage":50,"uniqueVisitors":151100,"sessions":151100,"conversions":6767,"conversionRate":4.48,"totalRevenue":943436.37,"revenuePerVisitor":6.24,"averageOrderValue":113.53,"addToCartRate":18.52,"checkoutStartRate":4.26,"conversionRateLiftPercentage":3.94,"revenuePerVisitorLiftPercentage":4.52}]},
      "0f766344-835a-41eb-9ed7-3772838b2884":{"variations":[{"variationId":36233,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":281783,"sessions":281783,"conversions":12992,"conversionRate":4.61,"totalRevenue":1860317.78,"revenuePerVisitor":6.6,"averageOrderValue":116.74,"addToCartRate":18.82,"checkoutStartRate":4.4},{"variationId":36234,"variationName":"Progress Bar","isControl":false,"trafficPercentage":50,"uniqueVisitors":281158,"sessions":281158,"conversions":12555,"conversionRate":4.47,"totalRevenue":1801720.8,"revenuePerVisitor":6.41,"averageOrderValue":118.02,"addToCartRate":18.69,"checkoutStartRate":4.27,"conversionRateLiftPercentage":-3.04,"revenuePerVisitorLiftPercentage":-2.88}]},
      "d3bfc221-ad6c-4d9f-87a7-c0c1777e61c0":{"variations":[{"variationId":37665,"variationName":"Preço cheio","isControl":true,"trafficPercentage":50,"uniqueVisitors":170227,"sessions":170227,"conversions":7526,"conversionRate":4.42,"totalRevenue":1056148.54,"revenuePerVisitor":6.2,"averageOrderValue":114.34,"addToCartRate":18.27,"checkoutStartRate":4.2},{"variationId":37666,"variationName":"Preço parcelado","isControl":false,"trafficPercentage":50,"uniqueVisitors":170749,"sessions":170749,"conversions":7581,"conversionRate":4.44,"totalRevenue":1061891.39,"revenuePerVisitor":6.22,"averageOrderValue":115.25,"addToCartRate":18.56,"checkoutStartRate":4.22,"conversionRateLiftPercentage":0.45,"revenuePerVisitorLiftPercentage":0.32}]},
      "2f6bed1b-0e22-4444-b94f-44d6876e7eae":{"variations":[{"variationId":35024,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":332935,"sessions":332935,"conversions":14307,"conversionRate":4.3,"totalRevenue":2006432.84,"revenuePerVisitor":6.03,"averageOrderValue":118.58,"addToCartRate":18.27,"checkoutStartRate":4.16},{"variationId":35025,"variationName":"Collection Sider","isControl":false,"trafficPercentage":50,"uniqueVisitors":333249,"sessions":333249,"conversions":14297,"conversionRate":4.29,"totalRevenue":2016787.38,"revenuePerVisitor":6.05,"averageOrderValue":118.72,"addToCartRate":18.32,"checkoutStartRate":4.13,"conversionRateLiftPercentage":-0.23,"revenuePerVisitorLiftPercentage":0.33}]},
      "5bd320f4-2d9d-4acd-96fd-80d30c6be855":{"variations":[{"variationId":35301,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":342401,"sessions":342401,"conversions":13422,"conversionRate":3.92,"totalRevenue":1919857.46,"revenuePerVisitor":5.61,"averageOrderValue":119.26,"addToCartRate":17.32,"checkoutStartRate":3.72},{"variationId":35302,"variationName":"Card Novo","isControl":false,"trafficPercentage":50,"uniqueVisitors":335552,"sessions":335552,"conversions":13725,"conversionRate":4.09,"totalRevenue":1911217.22,"revenuePerVisitor":5.7,"averageOrderValue":116.75,"addToCartRate":17.03,"checkoutStartRate":3.87,"conversionRateLiftPercentage":4.34,"revenuePerVisitorLiftPercentage":1.6}]},
      "733a04d2-d9f0-4549-98d7-e05298848c64":{"variations":[{"variationId":35315,"variationName":"Carrossel 2,5","isControl":true,"trafficPercentage":50,"uniqueVisitors":10204,"sessions":10204,"conversions":765,"conversionRate":7.5,"totalRevenue":108882.03,"revenuePerVisitor":10.67,"averageOrderValue":131.18,"addToCartRate":25.7,"checkoutStartRate":6.92},{"variationId":35316,"variationName":"Grid","isControl":false,"trafficPercentage":50,"uniqueVisitors":9972,"sessions":9972,"conversions":710,"conversionRate":7.12,"totalRevenue":102550.51,"revenuePerVisitor":10.28,"averageOrderValue":131.64,"addToCartRate":24.94,"checkoutStartRate":6.38,"conversionRateLiftPercentage":-5.07,"revenuePerVisitorLiftPercentage":-3.66}]},
      "3fdcfeb1-99c8-4c6e-b55b-d96f0f08a758":{"variations":[{"variationId":34400,"variationName":"Control","isControl":true,"trafficPercentage":34,"uniqueVisitors":270260,"sessions":270260,"conversions":10793,"conversionRate":3.99,"totalRevenue":1446334.46,"revenuePerVisitor":5.35,"averageOrderValue":114.72,"addToCartRate":18.14,"checkoutStartRate":3.94},{"variationId":34401,"variationName":"Carrossel 2,5","isControl":false,"trafficPercentage":33,"uniqueVisitors":261743,"sessions":261743,"conversions":10639,"conversionRate":4.06,"totalRevenue":1428632.04,"revenuePerVisitor":5.46,"averageOrderValue":115.18,"addToCartRate":18.28,"checkoutStartRate":3.99,"conversionRateLiftPercentage":1.75,"revenuePerVisitorLiftPercentage":2.06}]},
      "34bf5c72-38b0-4b38-937a-61a12f6741f8":{"variations":[{"variationId":33570,"variationName":"Com Banner na Announcement Bar","isControl":true,"trafficPercentage":50,"uniqueVisitors":609563,"sessions":609563,"conversions":25426,"conversionRate":4.17,"totalRevenue":3396597.57,"revenuePerVisitor":5.57,"averageOrderValue":114.49,"addToCartRate":18.4,"checkoutStartRate":4.1},{"variationId":33571,"variationName":"Sem Banner","isControl":false,"trafficPercentage":50,"uniqueVisitors":609531,"sessions":609531,"conversions":25199,"conversionRate":4.13,"totalRevenue":3405756.74,"revenuePerVisitor":5.59,"averageOrderValue":114.34,"addToCartRate":18.63,"checkoutStartRate":4.06,"conversionRateLiftPercentage":-0.96,"revenuePerVisitorLiftPercentage":0.36}]},
      "62d3a532-25d3-4b00-8964-a37e653bd79e":{"variations":[{"variationId":32285,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":297561,"sessions":297561,"conversions":11927,"conversionRate":4.01,"totalRevenue":1623926.67,"revenuePerVisitor":5.46,"averageOrderValue":114.96,"addToCartRate":17.58,"checkoutStartRate":3.93},{"variationId":32286,"variationName":"Carrinho Barbours","isControl":false,"trafficPercentage":50,"uniqueVisitors":291915,"sessions":291915,"conversions":12235,"conversionRate":4.19,"totalRevenue":1559249.24,"revenuePerVisitor":5.34,"averageOrderValue":116.21,"addToCartRate":17.8,"checkoutStartRate":4.12,"conversionRateLiftPercentage":4.49,"revenuePerVisitorLiftPercentage":-2.2}]},
      "64d20841-45d2-49f9-ae03-e02f30222ff9":{"variations":[{"variationId":31206,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":410728,"sessions":410728,"conversions":15541,"conversionRate":3.78,"totalRevenue":1875431.84,"revenuePerVisitor":4.57,"averageOrderValue":102.78,"addToCartRate":16.35,"checkoutStartRate":3.71},{"variationId":31207,"variationName":"Sem Videowise","isControl":false,"trafficPercentage":50,"uniqueVisitors":410149,"sessions":410149,"conversions":15611,"conversionRate":3.81,"totalRevenue":1887989.24,"revenuePerVisitor":4.6,"averageOrderValue":103.02,"addToCartRate":16.46,"checkoutStartRate":3.74,"conversionRateLiftPercentage":0.79,"revenuePerVisitorLiftPercentage":0.66}]},
    },
    significance: {
      "11ff784c-1ca7-42f2-948a-b88626bcd712":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37676","percentage":0.16},{"variant":"37677","percentage":99.84}]}},
      "0f766344-835a-41eb-9ed7-3772838b2884":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"36233","percentage":99.59},{"variant":"36234","percentage":0.4}]}},
      "d3bfc221-ad6c-4d9f-87a7-c0c1777e61c0":{"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"37665","percentage":59.82},{"variant":"37666","percentage":40.17}]}},
    },
  },
  kokeshi: {
    tests: [
      {"testId":"42c85607-985e-4ccc-a8cf-0826aa31839f","name":"Fase 2 -  Kokeshi Novo Tema (sem rebranding) - melhorias PDP e Home","type":"THEME","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-04-09T04:53:05.000Z","completedAt":null,"testTrafficPercentage":null},
      {"testId":"45a5ddba-e272-4e9b-8c78-e897a6f0af53","name":"Kokeshi Novo Tema (sem rebranding)","type":"THEME","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-26T01:40:19.000Z","completedAt":"2026-04-09T00:11:46.000Z","testTrafficPercentage":null},
      {"testId":"05613043-5cd4-4aeb-b183-b4ebffd22cf8","name":"Kokeshi Rebrand (novo tema)","type":"THEME","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-13T20:05:20.000Z","completedAt":null,"testTrafficPercentage":null},
      {"testId":"1050c7a2-d78f-4729-a417-a5c3f3364e94","name":"Vídeos Judge.me Incrementados","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-29T20:18:50.000Z","completedAt":"2026-02-03T14:27:49.000Z","testTrafficPercentage":null},
      {"testId":"9b525a8a-492f-46fe-b156-d9e2bc8793d5","name":"Carrinho Upcart vs. Carrinho Nativo GoCart+","type":"THEME","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-14T18:29:41.000Z","completedAt":"2026-01-29T13:31:45.000Z","testTrafficPercentage":null},
      {"testId":"84c6a047-2d52-4468-847a-5ba03e26d329","name":"Videowise vs. Sem Videowise","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-15T19:45:46.000Z","completedAt":"2026-01-20T12:38:24.000Z","testTrafficPercentage":null},
    ],
    results: {
      "42c85607-985e-4ccc-a8cf-0826aa31839f":{"variations":[{"variationId":38877,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":89704,"sessions":89704,"conversions":3879,"conversionRate":4.32,"totalRevenue":408103.27,"revenuePerVisitor":4.55,"averageOrderValue":90.31,"addToCartRate":20.32,"checkoutStartRate":4.08},{"variationId":38878,"variationName":"Tema Novo","isControl":false,"trafficPercentage":50,"uniqueVisitors":88686,"sessions":88686,"conversions":3698,"conversionRate":4.17,"totalRevenue":378608.6,"revenuePerVisitor":4.27,"averageOrderValue":93.14,"addToCartRate":17.2,"checkoutStartRate":3.42,"conversionRateLiftPercentage":-3.47,"revenuePerVisitorLiftPercentage":-6.15}]},
      "45a5ddba-e272-4e9b-8c78-e897a6f0af53":{"variations":[{"variationId":37463,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":211999,"sessions":211999,"conversions":12090,"conversionRate":5.7,"totalRevenue":1253744.27,"revenuePerVisitor":5.91,"averageOrderValue":87.43,"addToCartRate":22.77,"checkoutStartRate":5.47},{"variationId":37464,"variationName":"Tema Novo","isControl":false,"trafficPercentage":50,"uniqueVisitors":209204,"sessions":209204,"conversions":11723,"conversionRate":5.6,"totalRevenue":1179593.37,"revenuePerVisitor":5.64,"averageOrderValue":89.21,"addToCartRate":19.45,"checkoutStartRate":4.58,"conversionRateLiftPercentage":-1.75,"revenuePerVisitorLiftPercentage":-4.57}]},
      "05613043-5cd4-4aeb-b183-b4ebffd22cf8":{"variations":[{"variationId":36298,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":239497,"sessions":239497,"conversions":12877,"conversionRate":5.38,"totalRevenue":1230886.5,"revenuePerVisitor":5.14,"averageOrderValue":80.72,"addToCartRate":21.57,"checkoutStartRate":5.21},{"variationId":36299,"variationName":"Rebrand","isControl":false,"trafficPercentage":50,"uniqueVisitors":238904,"sessions":238904,"conversions":12413,"conversionRate":5.2,"totalRevenue":1156130.52,"revenuePerVisitor":4.84,"averageOrderValue":83.22,"addToCartRate":18.51,"checkoutStartRate":4.21,"conversionRateLiftPercentage":-3.35,"revenuePerVisitorLiftPercentage":-5.84}]},
      "1050c7a2-d78f-4729-a417-a5c3f3364e94":{"variations":[{"variationId":32322,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":110117,"sessions":110117,"conversions":5503,"conversionRate":5,"totalRevenue":499316.04,"revenuePerVisitor":4.53,"averageOrderValue":76.12,"addToCartRate":21.39,"checkoutStartRate":4.95},{"variationId":32323,"variationName":"Sem Conteudos Judge.me","isControl":false,"trafficPercentage":50,"uniqueVisitors":110456,"sessions":110456,"conversions":5723,"conversionRate":5.18,"totalRevenue":516528.51,"revenuePerVisitor":4.68,"averageOrderValue":76.09,"addToCartRate":22.01,"checkoutStartRate":5.11,"conversionRateLiftPercentage":3.6,"revenuePerVisitorLiftPercentage":3.31}]},
      "9b525a8a-492f-46fe-b156-d9e2bc8793d5":{"variations":[{"variationId":31130,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":216285,"sessions":216285,"conversions":11122,"conversionRate":5.14,"totalRevenue":951912.42,"revenuePerVisitor":4.4,"averageOrderValue":76.71,"addToCartRate":20.75,"checkoutStartRate":5.06},{"variationId":31131,"variationName":"Carrinho Nativo","isControl":false,"trafficPercentage":50,"uniqueVisitors":213199,"sessions":213199,"conversions":10778,"conversionRate":5.06,"totalRevenue":948427.87,"revenuePerVisitor":4.45,"averageOrderValue":74.92,"addToCartRate":20.82,"checkoutStartRate":4.93,"conversionRateLiftPercentage":-1.56,"revenuePerVisitorLiftPercentage":1.14}]},
      "84c6a047-2d52-4468-847a-5ba03e26d329":{"variations":[{"variationId":31210,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":28035,"sessions":28035,"conversions":1179,"conversionRate":4.21,"totalRevenue":103046.01,"revenuePerVisitor":3.68,"averageOrderValue":79.02,"addToCartRate":19.1,"checkoutStartRate":4.24},{"variationId":31211,"variationName":"Sem Videowise","isControl":false,"trafficPercentage":50,"uniqueVisitors":27953,"sessions":27953,"conversions":1288,"conversionRate":4.61,"totalRevenue":109097.68,"revenuePerVisitor":3.9,"averageOrderValue":77.65,"addToCartRate":19.28,"checkoutStartRate":4.57,"conversionRateLiftPercentage":9.5,"revenuePerVisitorLiftPercentage":5.98}]},
    },
    significance: {
      "42c85607-985e-4ccc-a8cf-0826aa31839f":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"38877","percentage":98.43},{"variant":"38878","percentage":1.57}]}},
    },
  },
  rituaria: {
    tests: [
      {"testId":"29817541-3707-4dcb-b881-94f688071ba9","name":"[Home] Trust Icons vs. Brand CTA vs. Apenas Banner","type":"CUSTOM_CODE","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-27T20:28:02.000Z","completedAt":null,"testTrafficPercentage":50},
      {"testId":"ceac8a41-a475-4aa1-97ee-09cefad163b5","name":"[PDP] Mudança de CTA - \"Adicionar ao Carrinho\" vs \"Comprar","type":"PAGE","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-27T20:07:07.000Z","completedAt":null,"testTrafficPercentage":25},
      {"testId":"505c3dde-59cc-4868-9a9c-a63c1d1c0dd1","name":"[Tema] Card de produto refatorado","type":"THEME","status":"Running","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-27T20:06:06.000Z","completedAt":null,"testTrafficPercentage":25},
      {"testId":"cc80c3c5-6323-424c-82d7-b928dbaaec23","name":"[PDP] Sinalização de urgência na PDP (\"Vendendo rápido\")","type":"PAGE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-13T04:19:48.000Z","completedAt":"2026-04-06T14:00:52.000Z","testTrafficPercentage":25},
      {"testId":"4d143d13-2d0b-45cd-8e42-14b2d0e16f0a","name":"[Home] Sem Trust Icons na Home Page","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-27T22:39:52.000Z","completedAt":null,"testTrafficPercentage":25},
      {"testId":"6830bd19-ac3c-47f3-a868-e68b40ed961d","name":"Sem Lista de Upsell na PDP","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-27T22:47:07.000Z","completedAt":"2026-03-18T04:38:50.000Z","testTrafficPercentage":15},
      {"testId":"98dfde0a-c146-4737-8c07-ff25785d1dc0","name":"Carrinho Nativo GoCart+ vs. Carrinho Upcart","type":"THEME","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-03T17:06:19.000Z","completedAt":"2026-02-11T18:15:26.000Z","testTrafficPercentage":null},
    ],
    results: {
      "29817541-3707-4dcb-b881-94f688071ba9":{"variations":[{"variationId":37686,"variationName":"Trust Icons","isControl":true,"trafficPercentage":33.33,"uniqueVisitors":11431,"sessions":11431,"conversions":1560,"conversionRate":13.65,"totalRevenue":293169.92,"revenuePerVisitor":25.65,"averageOrderValue":174.3,"addToCartRate":36.29,"checkoutStartRate":12.46},{"variationId":37687,"variationName":"Brand Description ","isControl":false,"trafficPercentage":33.33,"uniqueVisitors":11472,"sessions":11472,"conversions":1566,"conversionRate":13.65,"totalRevenue":296541.83,"revenuePerVisitor":25.85,"averageOrderValue":175.16,"addToCartRate":36.15,"checkoutStartRate":12.47,"conversionRateLiftPercentage":0,"revenuePerVisitorLiftPercentage":0.78}]},
      "ceac8a41-a475-4aa1-97ee-09cefad163b5":{"variations":[{"variationId":37674,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":78985,"sessions":78985,"conversions":5480,"conversionRate":6.94,"totalRevenue":894114.32,"revenuePerVisitor":11.32,"averageOrderValue":147.69,"addToCartRate":21.39,"checkoutStartRate":6.47},{"variationId":37675,"variationName":"Buy button destacado","isControl":false,"trafficPercentage":50,"uniqueVisitors":78221,"sessions":78221,"conversions":5449,"conversionRate":6.97,"totalRevenue":894598.22,"revenuePerVisitor":11.44,"averageOrderValue":147.28,"addToCartRate":21.43,"checkoutStartRate":6.51,"conversionRateLiftPercentage":0.43,"revenuePerVisitorLiftPercentage":1.06}]},
      "505c3dde-59cc-4868-9a9c-a63c1d1c0dd1":{"variations":[{"variationId":37667,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":112623,"sessions":112623,"conversions":6229,"conversionRate":5.53,"totalRevenue":1063875.58,"revenuePerVisitor":9.45,"averageOrderValue":149.5,"addToCartRate":17.81,"checkoutStartRate":5.23},{"variationId":37668,"variationName":"Card novo","isControl":false,"trafficPercentage":50,"uniqueVisitors":109438,"sessions":109438,"conversions":6398,"conversionRate":5.85,"totalRevenue":1087318.28,"revenuePerVisitor":9.94,"averageOrderValue":149.69,"addToCartRate":18.13,"checkoutStartRate":5.49,"conversionRateLiftPercentage":5.79,"revenuePerVisitorLiftPercentage":5.19}]},
      "cc80c3c5-6323-424c-82d7-b928dbaaec23":{"variations":[{"variationId":36240,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":123284,"sessions":123284,"conversions":7113,"conversionRate":5.77,"totalRevenue":1117937.34,"revenuePerVisitor":9.07,"averageOrderValue":142.32,"addToCartRate":18.52,"checkoutStartRate":5.46},{"variationId":36241,"variationName":"Banner 'Vendendo rápido'","isControl":false,"trafficPercentage":50,"uniqueVisitors":122177,"sessions":122177,"conversions":7305,"conversionRate":5.98,"totalRevenue":1166985.81,"revenuePerVisitor":9.55,"averageOrderValue":144.52,"addToCartRate":18.62,"checkoutStartRate":5.64,"conversionRateLiftPercentage":3.64,"revenuePerVisitorLiftPercentage":5.29}]},
      "4d143d13-2d0b-45cd-8e42-14b2d0e16f0a":{"variations":[{"variationId":35020,"variationName":"Trust Icons","isControl":true,"trafficPercentage":50,"uniqueVisitors":90415,"sessions":90415,"conversions":9337,"conversionRate":10.33,"totalRevenue":1498592.93,"revenuePerVisitor":16.57,"averageOrderValue":145.69,"addToCartRate":31.25,"checkoutStartRate":9.8},{"variationId":35021,"variationName":"Sem Trust Icons","isControl":false,"trafficPercentage":50,"uniqueVisitors":90476,"sessions":90476,"conversions":9504,"conversionRate":10.5,"totalRevenue":1545269.96,"revenuePerVisitor":17.08,"averageOrderValue":146.72,"addToCartRate":31.71,"checkoutStartRate":9.99,"conversionRateLiftPercentage":1.65,"revenuePerVisitorLiftPercentage":3.08}]},
      "6830bd19-ac3c-47f3-a868-e68b40ed961d":{"variations":[{"variationId":35022,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":189295,"sessions":189295,"conversions":11162,"conversionRate":5.9,"totalRevenue":1685463.2,"revenuePerVisitor":8.9,"averageOrderValue":131.77,"addToCartRate":20.89,"checkoutStartRate":5.69},{"variationId":35023,"variationName":"Sem Lista de Upsell","isControl":false,"trafficPercentage":50,"uniqueVisitors":189151,"sessions":189151,"conversions":11237,"conversionRate":5.94,"totalRevenue":1646210.19,"revenuePerVisitor":8.7,"averageOrderValue":128.51,"addToCartRate":21.36,"checkoutStartRate":5.76,"conversionRateLiftPercentage":0.68,"revenuePerVisitorLiftPercentage":-2.25}]},
      "98dfde0a-c146-4737-8c07-ff25785d1dc0":{"variations":[{"variationId":32748,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":326507,"sessions":326507,"conversions":16004,"conversionRate":4.9,"totalRevenue":2521631.77,"revenuePerVisitor":7.72,"averageOrderValue":138.8,"addToCartRate":17.41,"checkoutStartRate":4.79},{"variationId":32749,"variationName":"Upcart","isControl":false,"trafficPercentage":50,"uniqueVisitors":320348,"sessions":320348,"conversions":15853,"conversionRate":4.95,"totalRevenue":2390152.77,"revenuePerVisitor":7.46,"averageOrderValue":138.65,"addToCartRate":16.93,"checkoutStartRate":4.77,"conversionRateLiftPercentage":1.02,"revenuePerVisitorLiftPercentage":-3.37}]},
    },
    significance: {
      "29817541-3707-4dcb-b881-94f688071ba9":{"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"37686","percentage":35.93},{"variant":"37687","percentage":56.26},{"variant":"37688","percentage":7.81}]}},
      "ceac8a41-a475-4aa1-97ee-09cefad163b5":{"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"37674","percentage":30.28},{"variant":"37675","percentage":69.72}]}},
      "505c3dde-59cc-4868-9a9c-a63c1d1c0dd1":{"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37667","percentage":0.36},{"variant":"37668","percentage":99.64}]}},
    },
  },
  lescent: {
    tests: [
      {"testId":"792bc857-6f2f-4a5e-8df1-070d21e8e004","name":"Prova Social na PDP","type":"PAGE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-03-13T03:36:00.000Z","completedAt":"2026-04-06T14:19:48.000Z","testTrafficPercentage":null},
      {"testId":"b5d1ef3a-4b17-4096-a7a5-053c882cd70e","name":"Com Review vs. Sem Review","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-25T20:03:16.000Z","completedAt":"2026-03-10T00:56:20.000Z","testTrafficPercentage":null},
      {"testId":"7f7aaf45-2b51-4b98-a6f0-c1989b4646cb","name":"Teste de Pop-Up de WhatsApp de grupo de vendas (all pages)","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-11T00:16:43.000Z","completedAt":"2026-02-27T13:05:32.000Z","testTrafficPercentage":null},
      {"testId":"7f2d73b1-7ea1-479b-9d10-0ac78637fc05","name":"Sem Seletor de Variante vs. Com Seletor de Variante","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-02-07T17:00:56.000Z","completedAt":"2026-02-13T20:30:13.000Z","testTrafficPercentage":null},
      {"testId":"31b4c473-2660-43da-ab19-c21f3bff58f0","name":"Com Videowise vs. Sem Videowise","type":"CUSTOM_CODE","status":"Done","goal":"REVENUE_PER_VISITOR","startingAt":"2026-01-29T13:27:07.000Z","completedAt":"2026-02-03T14:11:50.000Z","testTrafficPercentage":null},
    ],
    results: {
      "792bc857-6f2f-4a5e-8df1-070d21e8e004":{"variations":[{"variationId":36231,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":181410,"sessions":181410,"conversions":12671,"conversionRate":6.98,"totalRevenue":1484297.27,"revenuePerVisitor":8.18,"averageOrderValue":110.25,"addToCartRate":23.9,"checkoutStartRate":6.59},{"variationId":36232,"variationName":"Prova Social","isControl":false,"trafficPercentage":50,"uniqueVisitors":179954,"sessions":179954,"conversions":13010,"conversionRate":7.23,"totalRevenue":1524642.45,"revenuePerVisitor":8.47,"averageOrderValue":110.41,"addToCartRate":24.56,"checkoutStartRate":6.81,"conversionRateLiftPercentage":3.58,"revenuePerVisitorLiftPercentage":3.55}]},
      "b5d1ef3a-4b17-4096-a7a5-053c882cd70e":{"variations":[{"variationId":34799,"variationName":"Control (reviews)","isControl":true,"trafficPercentage":50,"uniqueVisitors":193815,"sessions":193815,"conversions":9555,"conversionRate":4.93,"totalRevenue":1001134.81,"revenuePerVisitor":5.17,"averageOrderValue":97.71,"addToCartRate":19.17,"checkoutStartRate":4.85},{"variationId":34800,"variationName":"Reviews Ocultos","isControl":false,"trafficPercentage":50,"uniqueVisitors":194355,"sessions":194355,"conversions":9878,"conversionRate":5.08,"totalRevenue":1040464.35,"revenuePerVisitor":5.35,"averageOrderValue":98.11,"addToCartRate":19.74,"checkoutStartRate":5,"conversionRateLiftPercentage":3.04,"revenuePerVisitorLiftPercentage":3.48}]},
      "7f7aaf45-2b51-4b98-a6f0-c1989b4646cb":{"variations":[{"variationId":33464,"variationName":"Sem Pop-Up","isControl":true,"trafficPercentage":50,"uniqueVisitors":213963,"sessions":213963,"conversions":9399,"conversionRate":4.39,"totalRevenue":1012481.85,"revenuePerVisitor":4.73,"averageOrderValue":99.59,"addToCartRate":17.27,"checkoutStartRate":4.36},{"variationId":33465,"variationName":"Com Pop-Up","isControl":false,"trafficPercentage":50,"uniqueVisitors":213793,"sessions":213793,"conversions":9341,"conversionRate":4.37,"totalRevenue":1001437,"revenuePerVisitor":4.68,"averageOrderValue":99.1,"addToCartRate":17.05,"checkoutStartRate":4.33,"conversionRateLiftPercentage":-0.46,"revenuePerVisitorLiftPercentage":-1.06}]},
      "7f2d73b1-7ea1-479b-9d10-0ac78637fc05":{"variations":[{"variationId":33126,"variationName":"Control","isControl":true,"trafficPercentage":50,"uniqueVisitors":99342,"sessions":99342,"conversions":3921,"conversionRate":3.95,"totalRevenue":464127.53,"revenuePerVisitor":4.67,"averageOrderValue":111.97,"addToCartRate":17.44,"checkoutStartRate":3.91},{"variationId":33127,"variationName":"Com Seletor de Variante","isControl":false,"trafficPercentage":50,"uniqueVisitors":99271,"sessions":99271,"conversions":4016,"conversionRate":4.05,"totalRevenue":477337.63,"revenuePerVisitor":4.81,"averageOrderValue":112.39,"addToCartRate":17.94,"checkoutStartRate":4,"conversionRateLiftPercentage":2.53,"revenuePerVisitorLiftPercentage":3}]},
      "31b4c473-2660-43da-ab19-c21f3bff58f0":{"variations":[{"variationId":32277,"variationName":"Com Videowise","isControl":true,"trafficPercentage":50,"uniqueVisitors":76837,"sessions":76837,"conversions":3439,"conversionRate":4.48,"totalRevenue":428575.85,"revenuePerVisitor":5.58,"averageOrderValue":117.84,"addToCartRate":18.15,"checkoutStartRate":4.43},{"variationId":32278,"variationName":"Sem Videowise","isControl":false,"trafficPercentage":50,"uniqueVisitors":76198,"sessions":76198,"conversions":3547,"conversionRate":4.65,"totalRevenue":449014.38,"revenuePerVisitor":5.89,"averageOrderValue":118.54,"addToCartRate":18.31,"checkoutStartRate":4.6,"conversionRateLiftPercentage":3.79,"revenuePerVisitorLiftPercentage":5.56}]},
    },
    significance: {},
  },
}

async function main() {
  let totalUpserted = 0, totalErrors = 0

  for (const [brandId, brandData] of Object.entries(ALL_DATA)) {
    console.log(`\n=== ${brandId.toUpperCase()} ===`)
    let updated = 0, errors = 0

    for (const test of brandData.tests) {
      const results = brandData.results[test.testId] || null
      const sig = brandData.significance[test.testId] || null
      const row = normalize(brandId, test, results, sig)

      const { error: upsertErr } = await supabase.from('ab_tests').upsert(row, { onConflict: 'id,brand_id' })
      if (upsertErr) {
        console.error(`  FAIL upsert ${test.testId}: ${upsertErr.message}`)
        errors++
        continue
      }

      // Snapshot
      const { error: snapErr } = await supabase.from('ab_test_snapshots').insert({
        test_id: test.testId, brand_id: brandId,
        control_cr: row.control_cr, control_rpv: row.control_rpv, control_aov: row.control_aov,
        control_revenue: row.control_revenue, control_visitors: row.control_visitors,
        variant_cr: row.variant_cr, variant_rpv: row.variant_rpv, variant_aov: row.variant_aov,
        variant_revenue: row.variant_revenue, variant_visitors: row.variant_visitors,
        lift_cr_pct: row.lift_cr_pct, lift_rpv_pct: row.lift_rpv_pct, lift_aov_pct: row.lift_aov_pct,
        statistical_status: row.statistical_status,
      })
      if (snapErr) console.warn(`  WARN snapshot ${test.testId}: ${snapErr.message}`)

      updated++
      console.log(`  OK ${test.name} [${row.status}] ${row.is_winner ? '🏆 WINNER' : ''}`)
    }

    // Sync log
    await supabase.from('ab_sync_log').insert({
      brand_id: brandId, trigger_type: 'cron',
      tests_fetched: brandData.tests.length, tests_updated: updated, tests_skipped: 0,
      errors: [], finished_at: new Date().toISOString(), status: errors > 0 ? 'partial' : 'success',
    })

    console.log(`  Total: ${updated} updated, ${errors} errors`)
    totalUpserted += updated
    totalErrors += errors
  }

  console.log(`\n=== DONE: ${totalUpserted} tests upserted, ${totalErrors} errors ===`)
}

main().catch(console.error)

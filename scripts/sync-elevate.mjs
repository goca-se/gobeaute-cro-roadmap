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

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function safeNum(val) { if (val == null) return null; const n = typeof val === 'number' ? val : parseFloat(val); return isNaN(n) ? null : n }
function safeInt(val) { if (val == null) return null; const n = typeof val === 'number' ? Math.round(val) : parseInt(val, 10); return isNaN(n) ? null : n }
function safeDate(val) { if (!val) return null; const d = new Date(val); return isNaN(d.getTime()) ? null : d.toISOString() }
function normalizeStatus(s) { const l = (s || '').toLowerCase(); return ['running','paused','done','draft'].includes(l) ? l : 'draft' }
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
  r.isWinner = true; r.winnerVariationId = winnerVarId; r.winnerVariationName = winnerVar?.variationName || null
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
    winner_variation_id: winnerInfo.winnerVariationId, winner_variation_name: winnerInfo.winnerVariationName, is_winner: winnerInfo.isWinner,
    control_visitors: safeInt(control?.uniqueVisitors), control_sessions: safeInt(control?.sessions),
    control_conversions: safeInt(control?.conversions), control_cr: safeNum(control?.conversionRate),
    control_rpv: safeNum(control?.revenuePerVisitor), control_aov: controlAov, control_revenue: safeNum(control?.totalRevenue),
    control_add_to_cart_rate: safeNum(control?.addToCartRate), control_checkout_start_rate: safeNum(control?.checkoutStartRate),
    variant_variation_id: variant ? String(variant.variationId) : null, variant_variation_name: variant?.variationName || null,
    variant_visitors: safeInt(variant?.uniqueVisitors), variant_sessions: safeInt(variant?.sessions),
    variant_conversions: safeInt(variant?.conversions), variant_cr: safeNum(variant?.conversionRate),
    variant_rpv: safeNum(variant?.revenuePerVisitor), variant_aov: variantAov, variant_revenue: safeNum(variant?.totalRevenue),
    variant_add_to_cart_rate: safeNum(variant?.addToCartRate), variant_checkout_start_rate: safeNum(variant?.checkoutStartRate),
    lift_cr_pct: safeNum(variant?.conversionRateLiftPercentage), lift_rpv_pct: safeNum(variant?.revenuePerVisitorLiftPercentage),
    lift_aov_pct: liftAovPct, statistical_status: sigData?.statisticalStatus || null, statistical_significance: sigData || null,
    raw_list_data: listItem, raw_results_data: resultsData, raw_significance_data: sigData,
    last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }
}

const BRANDS_DATA = {
  apice: {
    tests: [
      { testId: '910b6fea-1117-4fe2-937e-c09199fd313d', name: '[PDP] Kit Cachos com conteúdo incrementado', type: 'PAGE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-16T18:33:01.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '80a42e9a-ca23-432e-8d15-7dc4c08e600b', name: '[Home] Trust Icons', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-12T02:52:16.000Z', completedAt: '2026-04-15T22:21:22.000Z', testTrafficPercentage: 25 },
      { testId: '55c9a13b-2ba9-4414-a73a-0b4cb27bffb2', name: '[Tema] Informações de Preço: completas vs. apenas parcelado', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T20:59:02.000Z', completedAt: '2026-04-15T22:21:00.000Z', testTrafficPercentage: 25 },
      { testId: 'a0898a11-23f6-45bd-adee-4126b716c3fe', name: '[PDP] Lista de Upsell Vertical', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T20:35:41.000Z', completedAt: '2026-04-08T21:39:30.000Z', testTrafficPercentage: 15 },
      { testId: '33660f21-9afb-45e9-a089-7f04cbf5bd81', name: '[PDP] Formatação de preço e desconto', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-05T02:53:55.000Z', completedAt: '2026-04-06T14:09:57.000Z', testTrafficPercentage: 25 },
      { testId: '49bea203-e3d0-40c5-8a5b-32a049a0b07b', name: '[URL] Teste de Pop-Up de WhatsApp de grupo de vendas (all pages)', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-10T13:00:02.000Z', completedAt: '2026-04-06T13:06:25.000Z', testTrafficPercentage: null },
      { testId: '150b0597-0b92-4155-8685-ad9133385af9', name: 'Destaque para desconto do Pix (5%)', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-13T17:27:53.000Z', completedAt: '2026-03-09T22:23:58.000Z', testTrafficPercentage: null },
      { testId: '881cad55-d226-4ab4-9089-778e5e423475', name: 'Refatoração do Card de Produto — Ápice', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T21:52:35.000Z', completedAt: '2026-03-09T22:15:27.000Z', testTrafficPercentage: 50 },
      { testId: 'daac5554-1853-414b-bed6-2e319124b598', name: 'Cronometro com CTA', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T22:23:41.000Z', completedAt: '2026-03-04T19:54:03.000Z', testTrafficPercentage: 25 },
      { testId: 'f5b72f53-3e51-4f09-b4e2-f7cff8998679', name: 'Banner na Announcement Bar vs Sem Banner na Announcement Bar', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-11T21:57:52.000Z', completedAt: '2026-02-27T21:53:10.000Z', testTrafficPercentage: 50 },
      { testId: '57a016b3-da96-416c-957b-9b147a6e8f1f', name: 'Carrosel 2,5 vs. Carrosel 1,5 vs. Grid', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-28T21:21:37.000Z', completedAt: '2026-02-13T17:15:43.000Z', testTrafficPercentage: null },
      { testId: '2818305f-5920-418d-a57d-adedfaf8bb49', name: 'Videowise vs. Sem Videowise', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-15T18:20:54.000Z', completedAt: '2026-01-29T13:44:47.000Z', testTrafficPercentage: null },
      { testId: 'bcd73e46-a1d4-42bb-9056-336a1ecaf5d6', name: 'Carrinho Upcart vs. Carrinho Nativo', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-15T13:57:24.000Z', completedAt: '2026-01-23T21:09:25.000Z', testTrafficPercentage: 50 },
    ],
    results: {
      '910b6fea-1117-4fe2-937e-c09199fd313d': {"variations":[{"variationId":39618,"variationName":"Control","isControl":true,"uniqueVisitors":15092,"sessions":15092,"conversions":1158,"conversionRate":7.67,"totalRevenue":263343.81,"revenuePerVisitor":17.45,"averageOrderValue":213.93,"addToCartRate":34.62,"checkoutStartRate":7.17},{"variationId":39619,"variationName":"PDP Incrementada","isControl":false,"uniqueVisitors":14871,"sessions":14871,"conversions":1163,"conversionRate":7.82,"totalRevenue":260859.6,"revenuePerVisitor":17.54,"averageOrderValue":209.86,"addToCartRate":34.77,"checkoutStartRate":7.22,"conversionRateLiftPercentage":1.96,"revenuePerVisitorLiftPercentage":0.52}]},
      '80a42e9a-ca23-432e-8d15-7dc4c08e600b': {"variations":[{"variationId":36096,"variationName":"Control","isControl":true,"uniqueVisitors":125370,"sessions":125370,"conversions":6523,"conversionRate":5.2,"totalRevenue":1141682.63,"revenuePerVisitor":9.11,"averageOrderValue":161.28,"addToCartRate":19.59,"checkoutStartRate":4.92},{"variationId":36097,"variationName":"Trust Icon","isControl":false,"uniqueVisitors":125969,"sessions":125969,"conversions":6642,"conversionRate":5.27,"totalRevenue":1169542.15,"revenuePerVisitor":9.28,"averageOrderValue":161.99,"addToCartRate":19.51,"checkoutStartRate":4.96,"conversionRateLiftPercentage":1.35,"revenuePerVisitorLiftPercentage":1.87}]},
      '55c9a13b-2ba9-4414-a73a-0b4cb27bffb2': {"variations":[{"variationId":37693,"variationName":"Control","isControl":true,"uniqueVisitors":122155,"sessions":122155,"conversions":5736,"conversionRate":4.7,"totalRevenue":913094.24,"revenuePerVisitor":7.47,"averageOrderValue":147.92,"addToCartRate":18.04,"checkoutStartRate":4.42},{"variationId":37694,"variationName":"Info de Preço Reduzida","isControl":false,"uniqueVisitors":117420,"sessions":117420,"conversions":5634,"conversionRate":4.8,"totalRevenue":915597.07,"revenuePerVisitor":7.8,"averageOrderValue":150.1,"addToCartRate":18.75,"checkoutStartRate":4.5,"conversionRateLiftPercentage":2.13,"revenuePerVisitorLiftPercentage":4.42}]},
      'a0898a11-23f6-45bd-adee-4126b716c3fe': {"variations":[{"variationId":37663,"variationName":"Control","isControl":true,"uniqueVisitors":16642,"sessions":16642,"conversions":1433,"conversionRate":8.61,"totalRevenue":242428.97,"revenuePerVisitor":14.57,"averageOrderValue":157.93,"addToCartRate":31.71,"checkoutStartRate":8.12},{"variationId":37664,"variationName":"Lista de Upsell Vertical","isControl":false,"uniqueVisitors":16525,"sessions":16525,"conversions":1367,"conversionRate":8.27,"totalRevenue":218791.02,"revenuePerVisitor":13.24,"averageOrderValue":151.73,"addToCartRate":31.59,"checkoutStartRate":7.91,"conversionRateLiftPercentage":-3.95,"revenuePerVisitorLiftPercentage":-9.13}]},
      '33660f21-9afb-45e9-a089-7f04cbf5bd81': {"variations":[{"variationId":35317,"variationName":"Control","isControl":true,"uniqueVisitors":112684,"sessions":112684,"conversions":10361,"conversionRate":9.19,"totalRevenue":1796065,"revenuePerVisitor":15.94,"averageOrderValue":158.24,"addToCartRate":31.7,"checkoutStartRate":8.73},{"variationId":35318,"variationName":"Tag de Desconto","isControl":false,"uniqueVisitors":111648,"sessions":111648,"conversions":9979,"conversionRate":8.94,"totalRevenue":1737841.15,"revenuePerVisitor":15.57,"averageOrderValue":159.57,"addToCartRate":31.32,"checkoutStartRate":8.47,"conversionRateLiftPercentage":-2.72,"revenuePerVisitorLiftPercentage":-2.32}]},
      '49bea203-e3d0-40c5-8a5b-32a049a0b07b': {"variations":[{"variationId":35873,"variationName":"Control","isControl":true,"uniqueVisitors":98427,"sessions":98427,"conversions":4134,"conversionRate":4.2,"totalRevenue":717379.91,"revenuePerVisitor":7.29,"averageOrderValue":155.58,"addToCartRate":15.46,"checkoutStartRate":4.01},{"variationId":35874,"variationName":"WhatsPop","isControl":false,"uniqueVisitors":98019,"sessions":98019,"conversions":4073,"conversionRate":4.16,"totalRevenue":723656.06,"revenuePerVisitor":7.38,"averageOrderValue":158.87,"addToCartRate":15.56,"checkoutStartRate":3.99,"conversionRateLiftPercentage":-0.95,"revenuePerVisitorLiftPercentage":1.23}]},
      '150b0597-0b92-4155-8685-ad9133385af9': {"variations":[{"variationId":33785,"variationName":"Sem PIX","isControl":true,"uniqueVisitors":393865,"sessions":393865,"conversions":15263,"conversionRate":3.88,"totalRevenue":2631336.93,"revenuePerVisitor":6.68,"averageOrderValue":156.58,"addToCartRate":14.87,"checkoutStartRate":3.81},{"variationId":33786,"variationName":"Destaque PIX","isControl":false,"uniqueVisitors":395898,"sessions":395898,"conversions":15543,"conversionRate":3.93,"totalRevenue":2682637.98,"revenuePerVisitor":6.78,"averageOrderValue":156.66,"addToCartRate":15.16,"checkoutStartRate":3.86,"conversionRateLiftPercentage":1.29,"revenuePerVisitorLiftPercentage":1.5}]},
      '881cad55-d226-4ab4-9089-778e5e423475': {"variations":[{"variationId":35012,"variationName":"Control","isControl":true,"uniqueVisitors":117754,"sessions":117754,"conversions":4535,"conversionRate":3.85,"totalRevenue":776650.75,"revenuePerVisitor":6.6,"averageOrderValue":156.55,"addToCartRate":15.15,"checkoutStartRate":3.75},{"variationId":35013,"variationName":"Card Novo","isControl":false,"uniqueVisitors":113011,"sessions":113011,"conversions":4552,"conversionRate":4.03,"totalRevenue":770668.38,"revenuePerVisitor":6.82,"averageOrderValue":154.72,"addToCartRate":15.68,"checkoutStartRate":3.93,"conversionRateLiftPercentage":4.68,"revenuePerVisitorLiftPercentage":3.33}]},
      'daac5554-1853-414b-bed6-2e319124b598': {"variations":[{"variationId":35018,"variationName":"Sem CTA","isControl":true,"uniqueVisitors":17466,"sessions":17466,"conversions":655,"conversionRate":3.75,"totalRevenue":112363.74,"revenuePerVisitor":6.43,"averageOrderValue":155.63,"addToCartRate":15.17,"checkoutStartRate":3.7},{"variationId":35019,"variationName":"Com CTA","isControl":false,"uniqueVisitors":17460,"sessions":17460,"conversions":595,"conversionRate":3.41,"totalRevenue":100253.01,"revenuePerVisitor":5.74,"averageOrderValue":156.4,"addToCartRate":15.42,"checkoutStartRate":3.33,"conversionRateLiftPercentage":-9.07,"revenuePerVisitorLiftPercentage":-10.73}]},
      'f5b72f53-3e51-4f09-b4e2-f7cff8998679': {"variations":[{"variationId":33572,"variationName":"Cronometro","isControl":true,"uniqueVisitors":347773,"sessions":347773,"conversions":12082,"conversionRate":3.47,"totalRevenue":2061235.82,"revenuePerVisitor":5.93,"averageOrderValue":155.79,"addToCartRate":13.88,"checkoutStartRate":3.42},{"variationId":33573,"variationName":"Sem Cronometro","isControl":false,"uniqueVisitors":349599,"sessions":349599,"conversions":11944,"conversionRate":3.42,"totalRevenue":2031054.67,"revenuePerVisitor":5.81,"averageOrderValue":155.98,"addToCartRate":13.84,"checkoutStartRate":3.36,"conversionRateLiftPercentage":-1.44,"revenuePerVisitorLiftPercentage":-2.02}]},
      '57a016b3-da96-416c-957b-9b147a6e8f1f': {"variations":[{"variationId":32221,"variationName":"Control","isControl":true,"uniqueVisitors":186030,"sessions":186030,"conversions":6714,"conversionRate":3.61,"totalRevenue":1119098.04,"revenuePerVisitor":6.02,"averageOrderValue":157.73,"addToCartRate":14.36,"checkoutStartRate":3.51},{"variationId":32222,"variationName":"Carrosel 1,5","isControl":false,"uniqueVisitors":180643,"sessions":180643,"conversions":6296,"conversionRate":3.49,"totalRevenue":1060323.62,"revenuePerVisitor":5.87,"averageOrderValue":157.9,"addToCartRate":14.83,"checkoutStartRate":3.4,"conversionRateLiftPercentage":-3.32,"revenuePerVisitorLiftPercentage":-2.49}]},
      '2818305f-5920-418d-a57d-adedfaf8bb49': {"variations":[{"variationId":31188,"variationName":"Control","isControl":true,"uniqueVisitors":206779,"sessions":206779,"conversions":5603,"conversionRate":2.71,"totalRevenue":911178.42,"revenuePerVisitor":4.41,"averageOrderValue":144.79,"addToCartRate":12.9,"checkoutStartRate":2.65},{"variationId":31189,"variationName":"Sem Videowise","isControl":false,"uniqueVisitors":206403,"sessions":206403,"conversions":5537,"conversionRate":2.68,"totalRevenue":910711.11,"revenuePerVisitor":4.41,"averageOrderValue":146.49,"addToCartRate":12.96,"checkoutStartRate":2.62,"conversionRateLiftPercentage":-1.11,"revenuePerVisitorLiftPercentage":0}]},
      'bcd73e46-a1d4-42bb-9056-336a1ecaf5d6': {"variations":[{"variationId":31055,"variationName":"Control","isControl":true,"uniqueVisitors":98743,"sessions":98743,"conversions":2573,"conversionRate":2.61,"totalRevenue":405252.24,"revenuePerVisitor":4.1,"averageOrderValue":142.54,"addToCartRate":12.71,"checkoutStartRate":2.55},{"variationId":31056,"variationName":"Carrinho Nativo","isControl":false,"uniqueVisitors":92784,"sessions":92784,"conversions":2494,"conversionRate":2.69,"totalRevenue":405232.32,"revenuePerVisitor":4.37,"averageOrderValue":144.67,"addToCartRate":13.42,"checkoutStartRate":2.62,"conversionRateLiftPercentage":3.07,"revenuePerVisitorLiftPercentage":6.59}]},
    },
    significance: {
      '910b6fea-1117-4fe2-937e-c09199fd313d': {"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"39618","percentage":32.91},{"variant":"39619","percentage":67.09}]}},
      '80a42e9a-ca23-432e-8d15-7dc4c08e600b': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"36096","percentage":0.09},{"variant":"36097","percentage":99.91}]}},
      '55c9a13b-2ba9-4414-a73a-0b4cb27bffb2': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37693","percentage":0.7},{"variant":"37694","percentage":99.3}]}},
      'a0898a11-23f6-45bd-adee-4126b716c3fe': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37663","percentage":97.23},{"variant":"37664","percentage":2.77}]}},
      '33660f21-9afb-45e9-a089-7f04cbf5bd81': {"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"35317","percentage":69.84},{"variant":"35318","percentage":30.15}]}},
      '49bea203-e3d0-40c5-8a5b-32a049a0b07b': {"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"35873","percentage":45.53},{"variant":"35874","percentage":54.46}]}},
      '150b0597-0b92-4155-8685-ad9133385af9': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"33785","percentage":9.71},{"variant":"33786","percentage":90.29}]}},
      '881cad55-d226-4ab4-9089-778e5e423475': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"35012","percentage":8.78},{"variant":"35013","percentage":91.22}]}},
      'daac5554-1853-414b-bed6-2e319124b598': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"35018","percentage":96.76},{"variant":"35019","percentage":3.24}]}},
      'f5b72f53-3e51-4f09-b4e2-f7cff8998679': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"33572","percentage":92.92},{"variant":"33573","percentage":7.08}]}},
      '57a016b3-da96-416c-957b-9b147a6e8f1f': {"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"32221","percentage":26.88},{"variant":"32222","percentage":1.08}]}},
      '2818305f-5920-418d-a57d-adedfaf8bb49': {"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"31188","percentage":67.73},{"variant":"31189","percentage":32.27}]}},
      'bcd73e46-a1d4-42bb-9056-336a1ecaf5d6': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"31055","percentage":7.33},{"variant":"31056","percentage":92.67}]}},
    },
  },
  barbours: {
    tests: [
      { testId: '82f4ab64-01e0-4f75-97d6-8b8888cf7441', name: '[Home] Trust Icons', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-16T21:28:23.000Z', completedAt: null, testTrafficPercentage: 33 },
      { testId: '0f766344-835a-41eb-9ed7-3772838b2884', name: '[Cart] Barra de progresso de gift no carrinho', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-13T04:03:08.000Z', completedAt: null, testTrafficPercentage: 30 },
      { testId: 'd3bfc221-ad6c-4d9f-87a7-c0c1777e61c0', name: '[Cart] Preço cheio destacado VS Preço parcelado destacado', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T17:48:59.000Z', completedAt: null, testTrafficPercentage: 37 },
      { testId: '11ff784c-1ca7-42f2-948a-b88626bcd712', name: '[PDP] Simplificada (enfase para conteúdo relevante)', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T18:56:08.000Z', completedAt: '2026-04-16T21:14:11.000Z', testTrafficPercentage: 33 },
      { testId: '2f6bed1b-0e22-4444-b94f-44d6876e7eae', name: 'Collection Slider Acima do Hero na Home Page', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T23:12:54.000Z', completedAt: '2026-03-20T19:55:23.000Z', testTrafficPercentage: 25 },
      { testId: '5bd320f4-2d9d-4acd-96fd-80d30c6be855', name: 'Card de Produto - Refatorado', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-03T18:07:00.000Z', completedAt: '2026-03-20T19:55:10.000Z', testTrafficPercentage: 50 },
      { testId: '733a04d2-d9f0-4549-98d7-e05298848c64', name: 'Carrosel 2,5 (Control) vs. Grid', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-03T19:47:08.000Z', completedAt: '2026-03-13T03:48:46.000Z', testTrafficPercentage: 25 },
      { testId: '3fdcfeb1-99c8-4c6e-b55b-d96f0f08a758', name: 'Carrosel 1,5 vs. Carrosel 2,5 vs. Grid', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-20T21:07:21.000Z', completedAt: '2026-03-03T17:54:04.000Z', testTrafficPercentage: 50 },
      { testId: '34bf5c72-38b0-4b38-937a-61a12f6741f8', name: 'Sem Banner na Announcement Bar', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-11T21:46:45.000Z', completedAt: '2026-02-25T16:42:04.000Z', testTrafficPercentage: 50 },
      { testId: '62d3a532-25d3-4b00-8964-a37e653bd79e', name: 'Carrinho Nativo GoCart+ vs. Carrinho Nativo Barbours', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-29T14:41:15.000Z', completedAt: null, testTrafficPercentage: 50 },
      { testId: '64d20841-45d2-49f9-ae03-e02f30222ff9', name: 'Videowise vs. Sem Videowise', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-15T19:14:07.000Z', completedAt: '2026-01-20T12:33:52.000Z', testTrafficPercentage: null },
      { testId: 'a08fb681-1118-4111-8205-3c19c9d7db76', name: 'Inspirado em vs. Sem inspiração', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-13T17:42:56.000Z', completedAt: '2026-01-15T20:14:21.000Z', testTrafficPercentage: 50 },
    ],
    results: {
      '82f4ab64-01e0-4f75-97d6-8b8888cf7441': {"variations":[{"variationId":39646,"variationName":"Sem Trust ","isControl":true,"uniqueVisitors":8429,"sessions":8429,"conversions":526,"conversionRate":6.24,"totalRevenue":73584.87,"revenuePerVisitor":8.73,"averageOrderValue":129.1,"addToCartRate":23.76,"checkoutStartRate":5.84},{"variationId":39647,"variationName":"Com Trust","isControl":false,"uniqueVisitors":8283,"sessions":8283,"conversions":508,"conversionRate":6.13,"totalRevenue":69347.69,"revenuePerVisitor":8.37,"averageOrderValue":126.09,"addToCartRate":24.38,"checkoutStartRate":5.73,"conversionRateLiftPercentage":-1.76,"revenuePerVisitorLiftPercentage":-4.12}]},
      '0f766344-835a-41eb-9ed7-3772838b2884': {"variations":[{"variationId":36233,"variationName":"Control","isControl":true,"uniqueVisitors":372060,"sessions":372060,"conversions":17707,"conversionRate":4.76,"totalRevenue":2553368,"revenuePerVisitor":6.86,"averageOrderValue":117.03,"addToCartRate":19.29,"checkoutStartRate":4.56},{"variationId":36234,"variationName":"Progress Bar","isControl":false,"uniqueVisitors":371729,"sessions":371729,"conversions":17192,"conversionRate":4.62,"totalRevenue":2490803.21,"revenuePerVisitor":6.7,"averageOrderValue":118.4,"addToCartRate":19.17,"checkoutStartRate":4.44,"conversionRateLiftPercentage":-2.94,"revenuePerVisitorLiftPercentage":-2.33}]},
      'd3bfc221-ad6c-4d9f-87a7-c0c1777e61c0': {"variations":[{"variationId":37665,"variationName":"Preço cheio","isControl":true,"uniqueVisitors":280656,"sessions":280656,"conversions":12692,"conversionRate":4.52,"totalRevenue":1799803.36,"revenuePerVisitor":6.41,"averageOrderValue":115.66,"addToCartRate":18.78,"checkoutStartRate":4.33},{"variationId":37666,"variationName":"Preço parcelado","isControl":false,"uniqueVisitors":281230,"sessions":281230,"conversions":12841,"conversionRate":4.57,"totalRevenue":1829184.59,"revenuePerVisitor":6.5,"averageOrderValue":116.01,"addToCartRate":18.97,"checkoutStartRate":4.37,"conversionRateLiftPercentage":1.11,"revenuePerVisitorLiftPercentage":1.4}]},
      '11ff784c-1ca7-42f2-948a-b88626bcd712': {"variations":[{"variationId":37676,"variationName":"Control","isControl":true,"uniqueVisitors":162906,"sessions":162906,"conversions":7088,"conversionRate":4.35,"totalRevenue":979823.41,"revenuePerVisitor":6.01,"averageOrderValue":112.57,"addToCartRate":18.52,"checkoutStartRate":4.13},{"variationId":37677,"variationName":"Incrementada","isControl":false,"uniqueVisitors":162793,"sessions":162793,"conversions":7308,"conversionRate":4.49,"totalRevenue":1016061.26,"revenuePerVisitor":6.24,"averageOrderValue":112.98,"addToCartRate":18.59,"checkoutStartRate":4.28,"conversionRateLiftPercentage":3.22,"revenuePerVisitorLiftPercentage":3.83}]},
      '2f6bed1b-0e22-4444-b94f-44d6876e7eae': {"variations":[{"variationId":35024,"variationName":"Control","isControl":true,"uniqueVisitors":332935,"sessions":332935,"conversions":14307,"conversionRate":4.3,"totalRevenue":2006432.84,"revenuePerVisitor":6.03,"averageOrderValue":118.58,"addToCartRate":18.27,"checkoutStartRate":4.16},{"variationId":35025,"variationName":"Collection Sider","isControl":false,"uniqueVisitors":333249,"sessions":333249,"conversions":14297,"conversionRate":4.29,"totalRevenue":2016787.38,"revenuePerVisitor":6.05,"averageOrderValue":118.72,"addToCartRate":18.32,"checkoutStartRate":4.13,"conversionRateLiftPercentage":-0.23,"revenuePerVisitorLiftPercentage":0.33}]},
      '5bd320f4-2d9d-4acd-96fd-80d30c6be855': {"variations":[{"variationId":35301,"variationName":"Control","isControl":true,"uniqueVisitors":342401,"sessions":342401,"conversions":13422,"conversionRate":3.92,"totalRevenue":1919857.46,"revenuePerVisitor":5.61,"averageOrderValue":119.26,"addToCartRate":17.32,"checkoutStartRate":3.72},{"variationId":35302,"variationName":"Card Novo","isControl":false,"uniqueVisitors":335552,"sessions":335552,"conversions":13725,"conversionRate":4.09,"totalRevenue":1911217.22,"revenuePerVisitor":5.7,"averageOrderValue":116.75,"addToCartRate":17.03,"checkoutStartRate":3.87,"conversionRateLiftPercentage":4.34,"revenuePerVisitorLiftPercentage":1.6}]},
      '733a04d2-d9f0-4549-98d7-e05298848c64': {"variations":[{"variationId":35315,"variationName":"Carrossel 2,5","isControl":true,"uniqueVisitors":10204,"sessions":10204,"conversions":765,"conversionRate":7.5,"totalRevenue":108882.03,"revenuePerVisitor":10.67,"averageOrderValue":131.18,"addToCartRate":25.7,"checkoutStartRate":6.92},{"variationId":35316,"variationName":"Grid","isControl":false,"uniqueVisitors":9972,"sessions":9972,"conversions":710,"conversionRate":7.12,"totalRevenue":102550.51,"revenuePerVisitor":10.28,"averageOrderValue":131.64,"addToCartRate":24.94,"checkoutStartRate":6.38,"conversionRateLiftPercentage":-5.07,"revenuePerVisitorLiftPercentage":-3.66}]},
      '3fdcfeb1-99c8-4c6e-b55b-d96f0f08a758': {"variations":[{"variationId":34400,"variationName":"Control","isControl":true,"uniqueVisitors":270260,"sessions":270260,"conversions":10793,"conversionRate":3.99,"totalRevenue":1446334.46,"revenuePerVisitor":5.35,"averageOrderValue":114.72,"addToCartRate":18.14,"checkoutStartRate":3.94},{"variationId":34401,"variationName":"Carrossel 2,5","isControl":false,"uniqueVisitors":261743,"sessions":261743,"conversions":10639,"conversionRate":4.06,"totalRevenue":1428632.04,"revenuePerVisitor":5.46,"averageOrderValue":115.18,"addToCartRate":18.28,"checkoutStartRate":3.99,"conversionRateLiftPercentage":1.75,"revenuePerVisitorLiftPercentage":2.06}]},
      '34bf5c72-38b0-4b38-937a-61a12f6741f8': {"variations":[{"variationId":33570,"variationName":"Com Banner na Announcement Bar","isControl":true,"uniqueVisitors":609563,"sessions":609563,"conversions":25426,"conversionRate":4.17,"totalRevenue":3396597.57,"revenuePerVisitor":5.57,"averageOrderValue":114.49,"addToCartRate":18.4,"checkoutStartRate":4.1},{"variationId":33571,"variationName":"Sem Banner","isControl":false,"uniqueVisitors":609531,"sessions":609531,"conversions":25199,"conversionRate":4.13,"totalRevenue":3405756.74,"revenuePerVisitor":5.59,"averageOrderValue":114.34,"addToCartRate":18.63,"checkoutStartRate":4.06,"conversionRateLiftPercentage":-0.96,"revenuePerVisitorLiftPercentage":0.36}]},
      '62d3a532-25d3-4b00-8964-a37e653bd79e': {"variations":[{"variationId":32285,"variationName":"Control","isControl":true,"uniqueVisitors":297561,"sessions":297561,"conversions":11927,"conversionRate":4.01,"totalRevenue":1623926.67,"revenuePerVisitor":5.46,"averageOrderValue":114.96,"addToCartRate":17.58,"checkoutStartRate":3.93},{"variationId":32286,"variationName":"Carrinho Barbours","isControl":false,"uniqueVisitors":291915,"sessions":291915,"conversions":12235,"conversionRate":4.19,"totalRevenue":1559249.24,"revenuePerVisitor":5.34,"averageOrderValue":116.21,"addToCartRate":17.8,"checkoutStartRate":4.12,"conversionRateLiftPercentage":4.49,"revenuePerVisitorLiftPercentage":-2.2}]},
      '64d20841-45d2-49f9-ae03-e02f30222ff9': {"variations":[{"variationId":31206,"variationName":"Control","isControl":true,"uniqueVisitors":410728,"sessions":410728,"conversions":15541,"conversionRate":3.78,"totalRevenue":1875431.84,"revenuePerVisitor":4.57,"averageOrderValue":102.78,"addToCartRate":16.35,"checkoutStartRate":3.71},{"variationId":31207,"variationName":"Sem Videowise","isControl":false,"uniqueVisitors":410149,"sessions":410149,"conversions":15611,"conversionRate":3.81,"totalRevenue":1887989.24,"revenuePerVisitor":4.6,"averageOrderValue":103.02,"addToCartRate":16.46,"checkoutStartRate":3.74,"conversionRateLiftPercentage":0.79,"revenuePerVisitorLiftPercentage":0.66}]},
      'a08fb681-1118-4111-8205-3c19c9d7db76': {"variations":[{"variationId":31041,"variationName":"Control","isControl":true,"uniqueVisitors":55666,"sessions":55666,"conversions":2055,"conversionRate":3.69,"totalRevenue":263090.48,"revenuePerVisitor":4.73,"averageOrderValue":113.16,"addToCartRate":17.85,"checkoutStartRate":3.61},{"variationId":31042,"variationName":"Variation 1","isControl":false,"uniqueVisitors":55721,"sessions":55721,"conversions":1879,"conversionRate":3.37,"totalRevenue":234709.22,"revenuePerVisitor":4.21,"averageOrderValue":111.08,"addToCartRate":16.95,"checkoutStartRate":3.28,"conversionRateLiftPercentage":-8.67,"revenuePerVisitorLiftPercentage":-10.99}]},
    },
    significance: {
      '82f4ab64-01e0-4f75-97d6-8b8888cf7441': {"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"39646","percentage":71.19},{"variant":"39647","percentage":28.8}]}},
      '0f766344-835a-41eb-9ed7-3772838b2884': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"36233","percentage":99.19},{"variant":"36234","percentage":0.81}]}},
      'd3bfc221-ad6c-4d9f-87a7-c0c1777e61c0': {"statisticalStatus":"Near Significance","results":{"REVENUE_PER_VISITOR":[{"variant":"37665","percentage":20.4},{"variant":"37666","percentage":79.6}]}},
      '11ff784c-1ca7-42f2-948a-b88626bcd712': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37676","percentage":0.93},{"variant":"37677","percentage":99.07}]}},
      '2f6bed1b-0e22-4444-b94f-44d6876e7eae': {"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"35024","percentage":41.27},{"variant":"35025","percentage":58.74}]}},
      '5bd320f4-2d9d-4acd-96fd-80d30c6be855': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"35301","percentage":1.8},{"variant":"35302","percentage":98.2}]}},
      '733a04d2-d9f0-4549-98d7-e05298848c64': {"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"35315","percentage":59.82},{"variant":"35316","percentage":40.17}]}},
      '3fdcfeb1-99c8-4c6e-b55b-d96f0f08a758': {"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"34400","percentage":1.87},{"variant":"34401","percentage":59.01}]}},
      '34bf5c72-38b0-4b38-937a-61a12f6741f8': {"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"33570","percentage":48.54},{"variant":"33571","percentage":51.46}]}},
      '62d3a532-25d3-4b00-8964-a37e653bd79e': {"statisticalStatus":"Near Significance","results":{"REVENUE_PER_VISITOR":[{"variant":"32285","percentage":88.59},{"variant":"32286","percentage":11.4}]}},
      '64d20841-45d2-49f9-ae03-e02f30222ff9': {"statisticalStatus":"Near Significance","results":{"REVENUE_PER_VISITOR":[{"variant":"31206","percentage":18.94},{"variant":"31207","percentage":81.06}]}},
      'a08fb681-1118-4111-8205-3c19c9d7db76': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"31041","percentage":99.95},{"variant":"31042","percentage":0.04}]}},
    },
  },
  kokeshi: {
    tests: [
      { testId: '5947a5d9-58ea-4935-9bb7-47ae66b2eef7', name: 'Fase 4 - Kokeshi Novo Tema (sem rebranding) - ajustes descrição e estrelas de review', type: 'THEME', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-29T04:47:21.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '0d8e53cc-9dca-4c14-9b14-7eea50aa1e0a', name: 'Fase 3 - Kokeshi Novo Tema (sem rebranding) - melhorias PDP', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-16T15:08:02.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '42c85607-985e-4ccc-a8cf-0826aa31839f', name: 'Fase 2 - Kokeshi Novo Tema (sem rebranding) - melhorias PDP e Home', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-09T04:53:05.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '45a5ddba-e272-4e9b-8c78-e897a6f0af53', name: 'Kokeshi Novo Tema (sem rebranding)', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-26T01:40:19.000Z', completedAt: '2026-04-09T00:11:46.000Z', testTrafficPercentage: null },
      { testId: '05613043-5cd4-4aeb-b183-b4ebffd22cf8', name: 'Kokeshi Rebrand (novo tema)', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-13T20:05:20.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '1050c7a2-d78f-4729-a417-a5c3f3364e94', name: 'Vídeos Judge.me Incrementados', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-29T20:18:50.000Z', completedAt: '2026-02-03T14:27:49.000Z', testTrafficPercentage: null },
      { testId: '9b525a8a-492f-46fe-b156-d9e2bc8793d5', name: 'Carrinho Upcart vs. Carrinho Nativo GoCart+', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-14T18:29:41.000Z', completedAt: '2026-01-29T13:31:45.000Z', testTrafficPercentage: null },
      { testId: '84c6a047-2d52-4468-847a-5ba03e26d329', name: 'Videowise vs. Sem Videowise', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-15T19:45:46.000Z', completedAt: '2026-01-20T12:38:24.000Z', testTrafficPercentage: null },
    ],
    results: {
      '5947a5d9-58ea-4935-9bb7-47ae66b2eef7': {"variations":[{"variationId":40697,"variationName":"Control","isControl":true,"uniqueVisitors":64409,"sessions":64409,"conversions":2653,"conversionRate":4.12,"totalRevenue":225229.09,"revenuePerVisitor":3.5,"averageOrderValue":74.02,"addToCartRate":20.94,"checkoutStartRate":3.59},{"variationId":40698,"variationName":"Tema Novo","isControl":false,"uniqueVisitors":62855,"sessions":62855,"conversions":2600,"conversionRate":4.14,"totalRevenue":221743.23,"revenuePerVisitor":3.53,"averageOrderValue":77.02,"addToCartRate":17.24,"checkoutStartRate":2.99,"conversionRateLiftPercentage":0.49,"revenuePerVisitorLiftPercentage":0.86}]},
      '0d8e53cc-9dca-4c14-9b14-7eea50aa1e0a': {"variations":[{"variationId":39582,"variationName":"Control","isControl":true,"uniqueVisitors":361080,"sessions":361080,"conversions":16651,"conversionRate":4.61,"totalRevenue":1460865.56,"revenuePerVisitor":4.05,"averageOrderValue":74.03,"addToCartRate":20.04,"checkoutStartRate":4.46},{"variationId":39583,"variationName":"Tema Novo","isControl":false,"uniqueVisitors":349685,"sessions":349685,"conversions":16022,"conversionRate":4.58,"totalRevenue":1366134.28,"revenuePerVisitor":3.91,"averageOrderValue":75.54,"addToCartRate":17.02,"checkoutStartRate":3.63,"conversionRateLiftPercentage":-0.65,"revenuePerVisitorLiftPercentage":-3.46}]},
      '42c85607-985e-4ccc-a8cf-0826aa31839f': {"variations":[{"variationId":38877,"variationName":"Control","isControl":true,"uniqueVisitors":103853,"sessions":103853,"conversions":4645,"conversionRate":4.47,"totalRevenue":481850.77,"revenuePerVisitor":4.64,"averageOrderValue":89.12,"addToCartRate":20.78,"checkoutStartRate":4.26},{"variationId":38878,"variationName":"Tema Novo","isControl":false,"uniqueVisitors":102683,"sessions":102683,"conversions":4452,"conversionRate":4.34,"totalRevenue":449067.3,"revenuePerVisitor":4.37,"averageOrderValue":91.8,"addToCartRate":17.69,"checkoutStartRate":3.59,"conversionRateLiftPercentage":-2.91,"revenuePerVisitorLiftPercentage":-5.82}]},
      '45a5ddba-e272-4e9b-8c78-e897a6f0af53': {"variations":[{"variationId":37463,"variationName":"Control","isControl":true,"uniqueVisitors":211999,"sessions":211999,"conversions":12090,"conversionRate":5.7,"totalRevenue":1252668.85,"revenuePerVisitor":5.91,"averageOrderValue":87.35,"addToCartRate":22.77,"checkoutStartRate":5.47},{"variationId":37464,"variationName":"Tema Novo","isControl":false,"uniqueVisitors":209204,"sessions":209204,"conversions":11723,"conversionRate":5.6,"totalRevenue":1177580.77,"revenuePerVisitor":5.63,"averageOrderValue":89.06,"addToCartRate":19.45,"checkoutStartRate":4.58,"conversionRateLiftPercentage":-1.75,"revenuePerVisitorLiftPercentage":-4.74}]},
      '05613043-5cd4-4aeb-b183-b4ebffd22cf8': {"variations":[{"variationId":36298,"variationName":"Control","isControl":true,"uniqueVisitors":239497,"sessions":239497,"conversions":12877,"conversionRate":5.38,"totalRevenue":1230562.82,"revenuePerVisitor":5.14,"averageOrderValue":80.7,"addToCartRate":21.57,"checkoutStartRate":5.21},{"variationId":36299,"variationName":"Rebrand","isControl":false,"uniqueVisitors":238904,"sessions":238904,"conversions":12413,"conversionRate":5.2,"totalRevenue":1155657.28,"revenuePerVisitor":4.84,"averageOrderValue":83.19,"addToCartRate":18.51,"checkoutStartRate":4.21,"conversionRateLiftPercentage":-3.35,"revenuePerVisitorLiftPercentage":-5.84}]},
      '1050c7a2-d78f-4729-a417-a5c3f3364e94': {"variations":[{"variationId":32322,"variationName":"Control","isControl":true,"uniqueVisitors":110117,"sessions":110117,"conversions":5503,"conversionRate":5,"totalRevenue":499316.04,"revenuePerVisitor":4.53,"averageOrderValue":76.12,"addToCartRate":21.39,"checkoutStartRate":4.95},{"variationId":32323,"variationName":"Sem Conteudos Judge.me","isControl":false,"uniqueVisitors":110456,"sessions":110456,"conversions":5723,"conversionRate":5.18,"totalRevenue":516464,"revenuePerVisitor":4.68,"averageOrderValue":76.08,"addToCartRate":22.01,"checkoutStartRate":5.11,"conversionRateLiftPercentage":3.6,"revenuePerVisitorLiftPercentage":3.31}]},
      '9b525a8a-492f-46fe-b156-d9e2bc8793d5': {"variations":[{"variationId":31130,"variationName":"Control","isControl":true,"uniqueVisitors":216285,"sessions":216285,"conversions":11122,"conversionRate":5.14,"totalRevenue":951756.47,"revenuePerVisitor":4.4,"averageOrderValue":76.69,"addToCartRate":20.75,"checkoutStartRate":5.06},{"variationId":31131,"variationName":"Carrinho Nativo","isControl":false,"uniqueVisitors":213199,"sessions":213199,"conversions":10778,"conversionRate":5.06,"totalRevenue":948427.87,"revenuePerVisitor":4.45,"averageOrderValue":74.92,"addToCartRate":20.82,"checkoutStartRate":4.93,"conversionRateLiftPercentage":-1.56,"revenuePerVisitorLiftPercentage":1.14}]},
      '84c6a047-2d52-4468-847a-5ba03e26d329': {"variations":[{"variationId":31210,"variationName":"Control","isControl":true,"uniqueVisitors":28035,"sessions":28035,"conversions":1179,"conversionRate":4.21,"totalRevenue":103046.01,"revenuePerVisitor":3.68,"averageOrderValue":79.02,"addToCartRate":19.1,"checkoutStartRate":4.24},{"variationId":31211,"variationName":"Sem Videowise","isControl":false,"uniqueVisitors":27953,"sessions":27953,"conversions":1288,"conversionRate":4.61,"totalRevenue":109097.68,"revenuePerVisitor":3.9,"averageOrderValue":77.65,"addToCartRate":19.28,"checkoutStartRate":4.57,"conversionRateLiftPercentage":9.5,"revenuePerVisitorLiftPercentage":5.98}]},
    },
    significance: {
      '5947a5d9-58ea-4935-9bb7-47ae66b2eef7': {"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"40697","percentage":50.79},{"variant":"40698","percentage":49.21}]}},
      '0d8e53cc-9dca-4c14-9b14-7eea50aa1e0a': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"39582","percentage":99.84},{"variant":"39583","percentage":0.15}]}},
      '42c85607-985e-4ccc-a8cf-0826aa31839f': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"38877","percentage":99.51},{"variant":"38878","percentage":0.49}]}},
      '45a5ddba-e272-4e9b-8c78-e897a6f0af53': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37463","percentage":99.98},{"variant":"37464","percentage":0.03}]}},
      '05613043-5cd4-4aeb-b183-b4ebffd22cf8': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"36298","percentage":99.85},{"variant":"36299","percentage":0.15}]}},
      '1050c7a2-d78f-4729-a417-a5c3f3364e94': {"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"32322","percentage":35.57},{"variant":"32323","percentage":64.44}]}},
      '9b525a8a-492f-46fe-b156-d9e2bc8793d5': {"statisticalStatus":"Trending Positive","results":{"REVENUE_PER_VISITOR":[{"variant":"31130","percentage":26.36},{"variant":"31131","percentage":73.65}]}},
      '84c6a047-2d52-4468-847a-5ba03e26d329': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"31210","percentage":8.95},{"variant":"31211","percentage":91.05}]}},
    },
  },
  rituaria: {
    tests: [
      { testId: '29817541-3707-4dcb-b881-94f688071ba9', name: '[Home] Trust Icons vs. Brand CTA vs. Apenas Banner', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T20:28:02.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '18c2c1e0-e57a-4d93-88e9-4dc2237cd0f9', name: '[Cart] Adicionar mensagem de "Cupom no Checkout"', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-16T23:19:42.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '895ce978-c4cc-407d-af6b-46a0ac78f0fe', name: '[Imagens] Retirar Texto, Preço e Desconto das imagens de produto', type: 'PRODUCT_IMAGE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-17T17:26:04.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '505c3dde-59cc-4868-9a9c-a63c1d1c0dd1', name: '[Tema] Card de produto refatorado', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T20:06:06.000Z', completedAt: '2026-04-15T22:32:27.000Z', testTrafficPercentage: 25 },
      { testId: 'cc80c3c5-6323-424c-82d7-b928dbaaec23', name: '[PDP] Sinalização de urgência na PDP ("Vendendo rápido")', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-13T04:19:48.000Z', completedAt: '2026-04-06T14:00:52.000Z', testTrafficPercentage: 25 },
      { testId: '4d143d13-2d0b-45cd-8e42-14b2d0e16f0a', name: '[Home] Sem Trust Icons na Home Page', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T22:39:52.000Z', completedAt: null, testTrafficPercentage: 25 },
      { testId: '6830bd19-ac3c-47f3-a868-e68b40ed961d', name: 'Sem Lista de Upsell na PDP', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T22:47:07.000Z', completedAt: '2026-03-18T04:38:50.000Z', testTrafficPercentage: 15 },
      { testId: '98dfde0a-c146-4737-8c07-ff25785d1dc0', name: 'Carrinho Nativo GoCart+ vs. Carrinho Upcart', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-03T17:06:19.000Z', completedAt: '2026-02-11T18:15:26.000Z', testTrafficPercentage: null },
    ],
    results: {
      '29817541-3707-4dcb-b881-94f688071ba9': {"variations":[{"variationId":37686,"variationName":"Trust Icons","isControl":true,"uniqueVisitors":31980,"sessions":31980,"conversions":4278,"conversionRate":13.38,"totalRevenue":767883.62,"revenuePerVisitor":24.01,"averageOrderValue":166.61,"addToCartRate":36.06,"checkoutStartRate":12.38},{"variationId":37687,"variationName":"Brand Description","isControl":false,"uniqueVisitors":32021,"sessions":32021,"conversions":4244,"conversionRate":13.25,"totalRevenue":750075.23,"revenuePerVisitor":23.42,"averageOrderValue":164.17,"addToCartRate":35.61,"checkoutStartRate":12.26,"conversionRateLiftPercentage":-0.97,"revenuePerVisitorLiftPercentage":-2.46},{"variationId":37688,"variationName":"Apenas Banner","isControl":null,"uniqueVisitors":32109,"sessions":32109,"conversions":4234,"conversionRate":13.19,"totalRevenue":745472.23,"revenuePerVisitor":23.22,"averageOrderValue":163.62,"addToCartRate":35.77,"checkoutStartRate":12.15,"conversionRateLiftPercentage":-1.42,"revenuePerVisitorLiftPercentage":-3.29}]},
      '18c2c1e0-e57a-4d93-88e9-4dc2237cd0f9': {"variations":[{"variationId":39650,"variationName":"Control","isControl":true,"uniqueVisitors":280346,"sessions":280346,"conversions":13467,"conversionRate":4.8,"totalRevenue":2163343.01,"revenuePerVisitor":7.72,"averageOrderValue":139.7,"addToCartRate":16.98,"checkoutStartRate":4.59},{"variationId":39651,"variationName":"Mensagem de Cupom","isControl":false,"uniqueVisitors":280383,"sessions":280383,"conversions":13325,"conversionRate":4.75,"totalRevenue":2144194.41,"revenuePerVisitor":7.65,"averageOrderValue":139.06,"addToCartRate":16.92,"checkoutStartRate":4.54,"conversionRateLiftPercentage":-1.04,"revenuePerVisitorLiftPercentage":-0.91}]},
      '895ce978-c4cc-407d-af6b-46a0ac78f0fe': {"variations":[{"variationId":39725,"variationName":"Control","isControl":true,"uniqueVisitors":278287,"sessions":278287,"conversions":13338,"conversionRate":4.79,"totalRevenue":2147919.6,"revenuePerVisitor":7.72,"averageOrderValue":139.8,"addToCartRate":17.02,"checkoutStartRate":4.58},{"variationId":39726,"variationName":"Imagem Minimalista","isControl":false,"uniqueVisitors":276756,"sessions":276756,"conversions":13157,"conversionRate":4.75,"totalRevenue":2109836.07,"revenuePerVisitor":7.62,"averageOrderValue":139.01,"addToCartRate":16.92,"checkoutStartRate":4.54,"conversionRateLiftPercentage":-0.84,"revenuePerVisitorLiftPercentage":-1.3}]},
      '505c3dde-59cc-4868-9a9c-a63c1d1c0dd1': {"variations":[{"variationId":37667,"variationName":"Control","isControl":true,"uniqueVisitors":117099,"sessions":117099,"conversions":6478,"conversionRate":5.53,"totalRevenue":1107906.53,"revenuePerVisitor":9.46,"averageOrderValue":149.58,"addToCartRate":17.87,"checkoutStartRate":5.23},{"variationId":37668,"variationName":"Card novo","isControl":false,"uniqueVisitors":113617,"sessions":113617,"conversions":6651,"conversionRate":5.85,"totalRevenue":1126055.02,"revenuePerVisitor":9.91,"averageOrderValue":148.91,"addToCartRate":18.16,"checkoutStartRate":5.51,"conversionRateLiftPercentage":5.79,"revenuePerVisitorLiftPercentage":4.76}]},
      'cc80c3c5-6323-424c-82d7-b928dbaaec23': {"variations":[{"variationId":36240,"variationName":"Control","isControl":true,"uniqueVisitors":123284,"sessions":123284,"conversions":7113,"conversionRate":5.77,"totalRevenue":1117747.78,"revenuePerVisitor":9.07,"averageOrderValue":142.3,"addToCartRate":18.52,"checkoutStartRate":5.46},{"variationId":36241,"variationName":"Banner 'Vendendo rápido'","isControl":false,"uniqueVisitors":122177,"sessions":122177,"conversions":7305,"conversionRate":5.98,"totalRevenue":1166778.36,"revenuePerVisitor":9.55,"averageOrderValue":144.49,"addToCartRate":18.62,"checkoutStartRate":5.64,"conversionRateLiftPercentage":3.64,"revenuePerVisitorLiftPercentage":5.29}]},
      '4d143d13-2d0b-45cd-8e42-14b2d0e16f0a': {"variations":[{"variationId":35020,"variationName":"Trust Icons","isControl":true,"uniqueVisitors":90415,"sessions":90415,"conversions":9337,"conversionRate":10.33,"totalRevenue":1498592.93,"revenuePerVisitor":16.57,"averageOrderValue":145.69,"addToCartRate":31.25,"checkoutStartRate":9.8},{"variationId":35021,"variationName":"Sem Trust Icons","isControl":false,"uniqueVisitors":90476,"sessions":90476,"conversions":9504,"conversionRate":10.5,"totalRevenue":1545269.96,"revenuePerVisitor":17.08,"averageOrderValue":146.72,"addToCartRate":31.71,"checkoutStartRate":9.99,"conversionRateLiftPercentage":1.65,"revenuePerVisitorLiftPercentage":3.08}]},
      '6830bd19-ac3c-47f3-a868-e68b40ed961d': {"variations":[{"variationId":35022,"variationName":"Control","isControl":true,"uniqueVisitors":189295,"sessions":189295,"conversions":11162,"conversionRate":5.9,"totalRevenue":1685463.2,"revenuePerVisitor":8.9,"averageOrderValue":131.77,"addToCartRate":20.89,"checkoutStartRate":5.69},{"variationId":35023,"variationName":"Sem Lista de Upsell","isControl":false,"uniqueVisitors":189151,"sessions":189151,"conversions":11237,"conversionRate":5.94,"totalRevenue":1646210.19,"revenuePerVisitor":8.7,"averageOrderValue":128.51,"addToCartRate":21.36,"checkoutStartRate":5.76,"conversionRateLiftPercentage":0.68,"revenuePerVisitorLiftPercentage":-2.25}]},
      '98dfde0a-c146-4737-8c07-ff25785d1dc0': {"variations":[{"variationId":32748,"variationName":"Control","isControl":true,"uniqueVisitors":326507,"sessions":326507,"conversions":16004,"conversionRate":4.9,"totalRevenue":2521631.77,"revenuePerVisitor":7.72,"averageOrderValue":138.8,"addToCartRate":17.41,"checkoutStartRate":4.79},{"variationId":32749,"variationName":"Upcart","isControl":false,"uniqueVisitors":320348,"sessions":320348,"conversions":15853,"conversionRate":4.95,"totalRevenue":2390152.77,"revenuePerVisitor":7.46,"averageOrderValue":138.65,"addToCartRate":16.93,"checkoutStartRate":4.77,"conversionRateLiftPercentage":1.02,"revenuePerVisitorLiftPercentage":-3.37}]},
    },
    significance: {
      '29817541-3707-4dcb-b881-94f688071ba9': {"statisticalStatus":"Near Significance","results":{"REVENUE_PER_VISITOR":[{"variant":"37686","percentage":82.47},{"variant":"37687","percentage":10.48},{"variant":"37688","percentage":7.04}]}},
      '18c2c1e0-e57a-4d93-88e9-4dc2237cd0f9': {"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"39650","percentage":74.36},{"variant":"39651","percentage":25.64}]}},
      '895ce978-c4cc-407d-af6b-46a0ac78f0fe': {"statisticalStatus":"Near Significance","results":{"REVENUE_PER_VISITOR":[{"variant":"39725","percentage":84.88},{"variant":"39726","percentage":15.12}]}},
      '505c3dde-59cc-4868-9a9c-a63c1d1c0dd1': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"37667","percentage":0.43},{"variant":"37668","percentage":99.57}]}},
      'cc80c3c5-6323-424c-82d7-b928dbaaec23': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"36240","percentage":1.12},{"variant":"36241","percentage":98.88}]}},
      '4d143d13-2d0b-45cd-8e42-14b2d0e16f0a': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"35020","percentage":2.65},{"variant":"35021","percentage":97.36}]}},
      '6830bd19-ac3c-47f3-a868-e68b40ed961d': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"35022","percentage":95.95},{"variant":"35023","percentage":4.06}]}},
      '98dfde0a-c146-4737-8c07-ff25785d1dc0': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"32748","percentage":99.79},{"variant":"32749","percentage":0.21}]}},
    },
  },
  lescent: {
    tests: [
      { testId: '9c3504dd-40a2-49de-9de2-cf3b61b8a37e', name: '[Tema] Estrutura de Tema novo Lescent', type: 'THEME', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-29T21:56:44.000Z', completedAt: null, testTrafficPercentage: null },
      { testId: '792bc857-6f2f-4a5e-8df1-070d21e8e004', name: 'Prova Social na PDP', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-13T03:36:00.000Z', completedAt: '2026-04-06T14:19:48.000Z', testTrafficPercentage: null },
      { testId: 'b5d1ef3a-4b17-4096-a7a5-053c882cd70e', name: 'Com Review vs. Sem Review', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-25T20:03:16.000Z', completedAt: '2026-03-10T00:56:20.000Z', testTrafficPercentage: null },
      { testId: '7f7aaf45-2b51-4b98-a6f0-c1989b4646cb', name: 'Teste de Pop-Up de WhatsApp de grupo de vendas (all pages)', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-11T00:16:43.000Z', completedAt: '2026-02-27T13:05:32.000Z', testTrafficPercentage: null },
      { testId: '7f2d73b1-7ea1-479b-9d10-0ac78637fc05', name: 'Sem Seletor de Variante vs. Com Seletor de Variante', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-07T17:00:56.000Z', completedAt: '2026-02-13T20:30:13.000Z', testTrafficPercentage: null },
      { testId: '31b4c473-2660-43da-ab19-c21f3bff58f0', name: 'Com Videowise vs. Sem Videowise', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-29T13:27:07.000Z', completedAt: '2026-02-03T14:11:50.000Z', testTrafficPercentage: null },
    ],
    results: {
      '9c3504dd-40a2-49de-9de2-cf3b61b8a37e': {"variations":[{"variationId":40778,"variationName":"Control","isControl":true,"uniqueVisitors":12407,"sessions":12407,"conversions":451,"conversionRate":3.64,"totalRevenue":54023.43,"revenuePerVisitor":4.35,"averageOrderValue":112.31,"addToCartRate":15.89,"checkoutStartRate":3.08},{"variationId":40779,"variationName":"Tema novo","isControl":false,"uniqueVisitors":12055,"sessions":12055,"conversions":439,"conversionRate":3.64,"totalRevenue":60165.83,"revenuePerVisitor":4.99,"averageOrderValue":116.37,"addToCartRate":15.55,"checkoutStartRate":3.08,"conversionRateLiftPercentage":0,"revenuePerVisitorLiftPercentage":14.71}]},
      '792bc857-6f2f-4a5e-8df1-070d21e8e004': {"variations":[{"variationId":36231,"variationName":"Control","isControl":true,"uniqueVisitors":181410,"sessions":181410,"conversions":12671,"conversionRate":6.98,"totalRevenue":1481332.71,"revenuePerVisitor":8.17,"averageOrderValue":110.03,"addToCartRate":23.9,"checkoutStartRate":6.59},{"variationId":36232,"variationName":"Prova Social","isControl":false,"uniqueVisitors":179954,"sessions":179954,"conversions":13010,"conversionRate":7.23,"totalRevenue":1522523.05,"revenuePerVisitor":8.46,"averageOrderValue":110.26,"addToCartRate":24.56,"checkoutStartRate":6.81,"conversionRateLiftPercentage":3.58,"revenuePerVisitorLiftPercentage":3.55}]},
      'b5d1ef3a-4b17-4096-a7a5-053c882cd70e': {"variations":[{"variationId":34799,"variationName":"Control (reviews)","isControl":true,"uniqueVisitors":193815,"sessions":193815,"conversions":9555,"conversionRate":4.93,"totalRevenue":1001023.09,"revenuePerVisitor":5.16,"averageOrderValue":97.7,"addToCartRate":19.17,"checkoutStartRate":4.85},{"variationId":34800,"variationName":"Reviews Ocultos","isControl":false,"uniqueVisitors":194355,"sessions":194355,"conversions":9878,"conversionRate":5.08,"totalRevenue":1040306.42,"revenuePerVisitor":5.35,"averageOrderValue":98.1,"addToCartRate":19.74,"checkoutStartRate":5,"conversionRateLiftPercentage":3.04,"revenuePerVisitorLiftPercentage":3.68}]},
      '7f7aaf45-2b51-4b98-a6f0-c1989b4646cb': {"variations":[{"variationId":33464,"variationName":"Sem Pop-Up","isControl":true,"uniqueVisitors":213963,"sessions":213963,"conversions":9399,"conversionRate":4.39,"totalRevenue":1012481.85,"revenuePerVisitor":4.73,"averageOrderValue":99.59,"addToCartRate":17.27,"checkoutStartRate":4.36},{"variationId":33465,"variationName":"Com Pop-Up","isControl":false,"uniqueVisitors":213793,"sessions":213793,"conversions":9341,"conversionRate":4.37,"totalRevenue":1001354.72,"revenuePerVisitor":4.68,"averageOrderValue":99.09,"addToCartRate":17.05,"checkoutStartRate":4.33,"conversionRateLiftPercentage":-0.46,"revenuePerVisitorLiftPercentage":-1.06}]},
      '7f2d73b1-7ea1-479b-9d10-0ac78637fc05': {"variations":[{"variationId":33126,"variationName":"Control","isControl":true,"uniqueVisitors":99342,"sessions":99342,"conversions":3921,"conversionRate":3.95,"totalRevenue":464127.53,"revenuePerVisitor":4.67,"averageOrderValue":111.97,"addToCartRate":17.44,"checkoutStartRate":3.91},{"variationId":33127,"variationName":"Com Seletor de Variante","isControl":false,"uniqueVisitors":99271,"sessions":99271,"conversions":4016,"conversionRate":4.05,"totalRevenue":477337.63,"revenuePerVisitor":4.81,"averageOrderValue":112.39,"addToCartRate":17.94,"checkoutStartRate":4,"conversionRateLiftPercentage":2.53,"revenuePerVisitorLiftPercentage":3}]},
      '31b4c473-2660-43da-ab19-c21f3bff58f0': {"variations":[{"variationId":32277,"variationName":"Com Videowise","isControl":true,"uniqueVisitors":76837,"sessions":76837,"conversions":3439,"conversionRate":4.48,"totalRevenue":428575.85,"revenuePerVisitor":5.58,"averageOrderValue":117.84,"addToCartRate":18.15,"checkoutStartRate":4.43},{"variationId":32278,"variationName":"Sem Videowise","isControl":false,"uniqueVisitors":76198,"sessions":76198,"conversions":3547,"conversionRate":4.65,"totalRevenue":449014.38,"revenuePerVisitor":5.89,"averageOrderValue":118.54,"addToCartRate":18.31,"checkoutStartRate":4.6,"conversionRateLiftPercentage":3.79,"revenuePerVisitorLiftPercentage":5.56}]},
    },
    significance: {
      '9c3504dd-40a2-49de-9de2-cf3b61b8a37e': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"40778","percentage":2.86},{"variant":"40779","percentage":97.14}]}},
      '792bc857-6f2f-4a5e-8df1-070d21e8e004': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"36231","percentage":0.36},{"variant":"36232","percentage":99.63}]}},
      'b5d1ef3a-4b17-4096-a7a5-053c882cd70e': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"34799","percentage":0.69},{"variant":"34800","percentage":99.3}]}},
      '7f7aaf45-2b51-4b98-a6f0-c1989b4646cb': {"statisticalStatus":"Trending Negative","results":{"REVENUE_PER_VISITOR":[{"variant":"33464","percentage":74.13},{"variant":"33465","percentage":25.86}]}},
      '7f2d73b1-7ea1-479b-9d10-0ac78637fc05': {"statisticalStatus":"Near Significance","results":{"REVENUE_PER_VISITOR":[{"variant":"33126","percentage":14.4},{"variant":"33127","percentage":85.6}]}},
      '31b4c473-2660-43da-ab19-c21f3bff58f0': {"statisticalStatus":"Significant","results":{"REVENUE_PER_VISITOR":[{"variant":"32277","percentage":6.68},{"variant":"32278","percentage":93.33}]}},
    },
  },
}

async function syncBrand(brandId, data) {
  const stats = { fetched: data.tests.length, updated: 0, skipped: 0, errors: [] }
  const { data: existing } = await supabase.from('ab_tests').select('id').eq('brand_id', brandId)
  const existingIds = new Set((existing || []).map(t => t.id))

  for (const listItem of data.tests) {
    try {
      const status = normalizeStatus(listItem.status)
      if (status === 'done' && listItem.completedAt) {
        const finishedAt = new Date(listItem.completedAt)
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        if (finishedAt < threeDaysAgo && existingIds.has(listItem.testId)) {
          stats.skipped++
          continue
        }
      }

      const resultsData = data.results[listItem.testId] || null
      const sigData = data.significance[listItem.testId] || null
      const normalized = normalizeTest(brandId, listItem, resultsData, sigData)

      const { error: upsertErr } = await supabase.from('ab_tests').upsert(normalized, { onConflict: 'id,brand_id' })
      if (upsertErr) { stats.errors.push(`Upsert ${listItem.testId}: ${upsertErr.message}`); continue }

      const { error: snapErr } = await supabase.from('ab_test_snapshots').insert({
        test_id: listItem.testId, brand_id: brandId,
        control_cr: normalized.control_cr, control_rpv: normalized.control_rpv, control_aov: normalized.control_aov,
        control_revenue: normalized.control_revenue, control_visitors: normalized.control_visitors,
        variant_cr: normalized.variant_cr, variant_rpv: normalized.variant_rpv, variant_aov: normalized.variant_aov,
        variant_revenue: normalized.variant_revenue, variant_visitors: normalized.variant_visitors,
        lift_cr_pct: normalized.lift_cr_pct, lift_rpv_pct: normalized.lift_rpv_pct, lift_aov_pct: normalized.lift_aov_pct,
        statistical_status: normalized.statistical_status,
      })
      if (snapErr) stats.errors.push(`Snapshot ${listItem.testId}: ${snapErr.message}`)
      stats.updated++
    } catch (err) {
      stats.errors.push(`Error ${listItem.testId}: ${err.message}`)
    }
  }

  await supabase.from('ab_sync_log').insert({
    brand_id: brandId, trigger_type: 'cron',
    tests_fetched: stats.fetched, tests_updated: stats.updated, tests_skipped: stats.skipped,
    errors: stats.errors, finished_at: new Date().toISOString(),
    status: stats.errors.length > 0 ? 'partial' : 'success',
  })

  return stats
}

const brands = ['apice', 'barbours', 'kokeshi', 'rituaria', 'lescent']
console.log(`\n🔄 Elevate Sync — ${new Date().toISOString()}\n`)

let totalUpdated = 0, totalSkipped = 0, totalErrors = 0

for (const brand of brands) {
  const stats = await syncBrand(brand, BRANDS_DATA[brand])
  totalUpdated += stats.updated
  totalSkipped += stats.skipped
  totalErrors += stats.errors.length
  const icon = stats.errors.length > 0 ? '⚠️' : '✅'
  console.log(`${icon} ${brand.padEnd(10)} fetched=${stats.fetched} updated=${stats.updated} skipped=${stats.skipped} errors=${stats.errors.length}`)
  if (stats.errors.length > 0) stats.errors.forEach(e => console.log(`   ❌ ${e}`))
}

console.log(`\n📊 Total: updated=${totalUpdated} skipped=${totalSkipped} errors=${totalErrors}`)
console.log(totalErrors === 0 ? '\n✅ Sync concluído com sucesso!' : '\n⚠️ Sync concluído com erros.')

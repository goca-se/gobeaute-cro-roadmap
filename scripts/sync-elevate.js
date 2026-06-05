import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não definidos.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ─── RAW DATA COLLECTED VIA MCP ─────────────────────────────────────────────

const RAW = [
  // ── APICE ──────────────────────────────────────────────────────────────────
  {
    brand_id: 'apice',
    list: { testId: '4f666bbb-13a7-4456-8621-d2ace0da9009', name: '[Busca] Drawer de Busca Incrementado', type: 'THEME', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-17T14:42:53.000Z', completedAt: null, testTrafficPercentage: 10, createdAt: '2026-04-17T14:41:52.000Z', isPersonalization: false },
    results: { testId: '4f666bbb-13a7-4456-8621-d2ace0da9009', variations: [ { variationId: 39723, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 5018, sessions: 5018, conversions: 115, conversionRate: 2.29, totalRevenue: 17366.86, revenuePerVisitor: 3.46, averageOrderValue: 143.53, addToCartRate: 14.03, checkoutStartRate: 2.17, totalShippingRevenue: 651.7 }, { variationId: 39724, variationName: 'Drawer de Busca', isControl: false, trafficPercentage: 50, uniqueVisitors: 4923, sessions: 4923, conversions: 108, conversionRate: 2.19, totalRevenue: 19614.01, revenuePerVisitor: 3.98, averageOrderValue: 166.22, addToCartRate: 13.83, checkoutStartRate: 2.13, totalShippingRevenue: 648.25, conversionRateLiftPercentage: -4.37, revenuePerVisitorLiftPercentage: 15.03 } ] },
    significance: { testId: '4f666bbb-13a7-4456-8621-d2ace0da9009', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '39723', percentage: 42.34 }, { variant: '39724', percentage: 57.66 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '910b6fea-1117-4fe2-937e-c09199fd313d', name: '[PDP] Kit Cachos com conteúdo incrementado', type: 'PAGE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-16T18:33:01.000Z', completedAt: null, testTrafficPercentage: null, createdAt: '2026-04-16T18:29:56.000Z', isPersonalization: false },
    results: { testId: '910b6fea-1117-4fe2-937e-c09199fd313d', variations: [ { variationId: 39618, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 1372, sessions: 1372, conversions: 68, conversionRate: 4.96, totalRevenue: 14854.03, revenuePerVisitor: 10.83, averageOrderValue: 212.2, addToCartRate: 29.08, checkoutStartRate: 4.3, totalShippingRevenue: 465.89 }, { variationId: 39619, variationName: 'PDP Incrementada', isControl: false, trafficPercentage: 50, uniqueVisitors: 1337, sessions: 1337, conversions: 87, conversionRate: 6.51, totalRevenue: 17781.8, revenuePerVisitor: 13.3, averageOrderValue: 191.2, addToCartRate: 32.61, checkoutStartRate: 5.01, totalShippingRevenue: 636.12, conversionRateLiftPercentage: 31.25, revenuePerVisitorLiftPercentage: 22.81 } ] },
    significance: { testId: '910b6fea-1117-4fe2-937e-c09199fd313d', statisticalStatus: 'Near Significance', results: { REVENUE_PER_VISITOR: [ { variant: '39618', percentage: 19.3 }, { variant: '39619', percentage: 80.7 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '80a42e9a-ca23-432e-8d15-7dc4c08e600b', name: '[Home] Trust Icons', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-12T02:52:16.000Z', completedAt: '2026-04-15T22:21:22.000Z', testTrafficPercentage: 25, createdAt: '2026-03-12T02:51:15.000Z', isPersonalization: false },
    results: { testId: '80a42e9a-ca23-432e-8d15-7dc4c08e600b', variations: [ { variationId: 36096, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 125370, sessions: 125370, conversions: 6523, conversionRate: 5.2, totalRevenue: 1141682.63, revenuePerVisitor: 9.11, averageOrderValue: 161.28, addToCartRate: 19.59, checkoutStartRate: 4.92, totalShippingRevenue: 41548.82 }, { variationId: 36097, variationName: 'Trust Icon', isControl: false, trafficPercentage: 50, uniqueVisitors: 125969, sessions: 125969, conversions: 6642, conversionRate: 5.27, totalRevenue: 1169542.15, revenuePerVisitor: 9.28, averageOrderValue: 161.99, addToCartRate: 19.51, checkoutStartRate: 4.96, totalShippingRevenue: 43243.03, conversionRateLiftPercentage: 1.35, revenuePerVisitorLiftPercentage: 1.87 } ] },
    significance: { testId: '80a42e9a-ca23-432e-8d15-7dc4c08e600b', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '36096', percentage: 0.09 }, { variant: '36097', percentage: 99.91 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '55c9a13b-2ba9-4414-a73a-0b4cb27bffb2', name: '[Tema] Informações de Preço: completas vs. apenas parcelado', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T20:59:02.000Z', completedAt: '2026-04-15T22:21:00.000Z', testTrafficPercentage: 25, createdAt: '2026-03-27T20:57:18.000Z', isPersonalization: false },
    results: { testId: '55c9a13b-2ba9-4414-a73a-0b4cb27bffb2', variations: [ { variationId: 37693, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 122155, sessions: 122155, conversions: 5736, conversionRate: 4.7, totalRevenue: 913388.27, revenuePerVisitor: 7.48, averageOrderValue: 147.97, addToCartRate: 18.04, checkoutStartRate: 4.42, totalShippingRevenue: 37607.42 }, { variationId: 37694, variationName: 'Info de Preço Reduzida', isControl: false, trafficPercentage: 50, uniqueVisitors: 117420, sessions: 117420, conversions: 5634, conversionRate: 4.8, totalRevenue: 915664.09, revenuePerVisitor: 7.8, averageOrderValue: 150.11, addToCartRate: 18.75, checkoutStartRate: 4.5, totalShippingRevenue: 37617.72, conversionRateLiftPercentage: 2.13, revenuePerVisitorLiftPercentage: 4.28 } ] },
    significance: { testId: '55c9a13b-2ba9-4414-a73a-0b4cb27bffb2', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '37693', percentage: 0.7 }, { variant: '37694', percentage: 99.3 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: 'a0898a11-23f6-45bd-adee-4126b716c3fe', name: '[PDP] Lista de Upsell Vertical', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T20:35:41.000Z', completedAt: '2026-04-08T21:39:30.000Z', testTrafficPercentage: 15, createdAt: '2026-03-27T17:40:56.000Z', isPersonalization: false },
    results: { testId: 'a0898a11-23f6-45bd-adee-4126b716c3fe', variations: [ { variationId: 37663, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 16642, sessions: 16642, conversions: 1433, conversionRate: 8.61, totalRevenue: 242428.97, revenuePerVisitor: 14.57, averageOrderValue: 157.93, addToCartRate: 31.71, checkoutStartRate: 8.12, totalShippingRevenue: 9502.88 }, { variationId: 37664, variationName: 'Lista de Upsell Vertical', isControl: false, trafficPercentage: 50, uniqueVisitors: 16525, sessions: 16525, conversions: 1367, conversionRate: 8.27, totalRevenue: 218791.02, revenuePerVisitor: 13.24, averageOrderValue: 151.73, addToCartRate: 31.59, checkoutStartRate: 7.91, totalShippingRevenue: 8900.94, conversionRateLiftPercentage: -3.95, revenuePerVisitorLiftPercentage: -9.13 } ] },
    significance: { testId: 'a0898a11-23f6-45bd-adee-4126b716c3fe', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '37663', percentage: 97.23 }, { variant: '37664', percentage: 2.77 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '33660f21-9afb-45e9-a089-7f04cbf5bd81', name: '[PDP] Formatação de preço e desconto', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-05T02:53:55.000Z', completedAt: '2026-04-06T14:09:57.000Z', testTrafficPercentage: 25, createdAt: '2026-03-03T19:58:54.000Z', isPersonalization: false },
    results: { testId: '33660f21-9afb-45e9-a089-7f04cbf5bd81', variations: [ { variationId: 35317, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 112684, sessions: 112684, conversions: 10361, conversionRate: 9.19, totalRevenue: 1796065, revenuePerVisitor: 15.94, averageOrderValue: 158.24, addToCartRate: 31.7, checkoutStartRate: 8.73, totalShippingRevenue: 67325.36 }, { variationId: 35318, variationName: 'Tag de Desconto', isControl: false, trafficPercentage: 50, uniqueVisitors: 111647, sessions: 111647, conversions: 9979, conversionRate: 8.94, totalRevenue: 1737841.15, revenuePerVisitor: 15.57, averageOrderValue: 159.57, addToCartRate: 31.32, checkoutStartRate: 8.47, totalShippingRevenue: 65297.95, conversionRateLiftPercentage: -2.72, revenuePerVisitorLiftPercentage: -2.32 } ] },
    significance: { testId: '33660f21-9afb-45e9-a089-7f04cbf5bd81', statisticalStatus: 'Trending Negative', results: { REVENUE_PER_VISITOR: [ { variant: '35317', percentage: 69.84 }, { variant: '35318', percentage: 30.15 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '49bea203-e3d0-40c5-8a5b-32a049a0b07b', name: '[URL] Teste de Pop-Up de WhatsApp de grupo de vendas (all pages)', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-10T13:00:02.000Z', completedAt: '2026-04-06T13:06:25.000Z', testTrafficPercentage: null, createdAt: '2026-03-10T12:56:25.000Z', isPersonalization: false },
    results: { testId: '49bea203-e3d0-40c5-8a5b-32a049a0b07b', variations: [ { variationId: 35873, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 98427, sessions: 98427, conversions: 4134, conversionRate: 4.2, totalRevenue: 717379.91, revenuePerVisitor: 7.29, averageOrderValue: 155.58, addToCartRate: 15.46, checkoutStartRate: 4.01, totalShippingRevenue: 27621.5 }, { variationId: 35874, variationName: 'WhatsPop', isControl: false, trafficPercentage: 50, uniqueVisitors: 98019, sessions: 98019, conversions: 4073, conversionRate: 4.16, totalRevenue: 723656.06, revenuePerVisitor: 7.38, averageOrderValue: 158.87, addToCartRate: 15.56, checkoutStartRate: 3.99, totalShippingRevenue: 28318.9, conversionRateLiftPercentage: -0.95, revenuePerVisitorLiftPercentage: 1.23 } ] },
    significance: { testId: '49bea203-e3d0-40c5-8a5b-32a049a0b07b', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '35873', percentage: 45.53 }, { variant: '35874', percentage: 54.46 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '150b0597-0b92-4155-8685-ad9133385af9', name: 'Destaque para desconto do Pix (5%)', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-13T17:27:53.000Z', completedAt: '2026-03-09T22:23:58.000Z', testTrafficPercentage: null, createdAt: '2026-02-13T17:20:14.000Z', isPersonalization: false },
    results: { testId: '150b0597-0b92-4155-8685-ad9133385af9', variations: [ { variationId: 33785, variationName: 'Sem PIX', isControl: true, trafficPercentage: 50, uniqueVisitors: 393865, sessions: 393865, conversions: 15263, conversionRate: 3.88, totalRevenue: 2631336.93, revenuePerVisitor: 6.68, averageOrderValue: 156.58, addToCartRate: 14.87, checkoutStartRate: 3.81, totalShippingRevenue: 109844.31 }, { variationId: 33786, variationName: 'Destaque PIX', isControl: false, trafficPercentage: 50, uniqueVisitors: 395898, sessions: 395898, conversions: 15543, conversionRate: 3.93, totalRevenue: 2682637.98, revenuePerVisitor: 6.78, averageOrderValue: 156.66, addToCartRate: 15.16, checkoutStartRate: 3.86, totalShippingRevenue: 114003.89, conversionRateLiftPercentage: 1.29, revenuePerVisitorLiftPercentage: 1.5 } ] },
    significance: { testId: '150b0597-0b92-4155-8685-ad9133385af9', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '33785', percentage: 9.71 }, { variant: '33786', percentage: 90.29 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '881cad55-d226-4ab4-9089-778e5e423475', name: 'Refatoração do Card de Produto — Ápice', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T21:52:35.000Z', completedAt: '2026-03-09T22:15:27.000Z', testTrafficPercentage: 50, createdAt: '2026-02-27T21:51:48.000Z', isPersonalization: false },
    results: { testId: '881cad55-d226-4ab4-9089-778e5e423475', variations: [ { variationId: 35012, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 117754, sessions: 117754, conversions: 4535, conversionRate: 3.85, totalRevenue: 776650.75, revenuePerVisitor: 6.6, averageOrderValue: 156.55, addToCartRate: 15.15, checkoutStartRate: 3.75, totalShippingRevenue: 35480.05 }, { variationId: 35013, variationName: 'Card Novo', isControl: false, trafficPercentage: 50, uniqueVisitors: 113011, sessions: 113011, conversions: 4552, conversionRate: 4.03, totalRevenue: 770668.38, revenuePerVisitor: 6.82, averageOrderValue: 154.72, addToCartRate: 15.68, checkoutStartRate: 3.93, totalShippingRevenue: 35654.17, conversionRateLiftPercentage: 4.68, revenuePerVisitorLiftPercentage: 3.33 } ] },
    significance: { testId: '881cad55-d226-4ab4-9089-778e5e423475', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '35012', percentage: 8.78 }, { variant: '35013', percentage: 91.22 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: 'daac5554-1853-414b-bed6-2e319124b598', name: 'Cronometro com CTA', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T22:23:41.000Z', completedAt: '2026-03-04T19:54:03.000Z', testTrafficPercentage: 25, createdAt: '2026-02-27T22:23:20.000Z', isPersonalization: false },
    results: { testId: 'daac5554-1853-414b-bed6-2e319124b598', variations: [ { variationId: 35018, variationName: 'Sem CTA', isControl: true, trafficPercentage: 50, uniqueVisitors: 17466, sessions: 17466, conversions: 655, conversionRate: 3.75, totalRevenue: 112363.74, revenuePerVisitor: 6.43, averageOrderValue: 155.63, addToCartRate: 15.17, checkoutStartRate: 3.7, totalShippingRevenue: 5648 }, { variationId: 35019, variationName: 'Com CTA', isControl: false, trafficPercentage: 50, uniqueVisitors: 17460, sessions: 17460, conversions: 595, conversionRate: 3.41, totalRevenue: 100253.01, revenuePerVisitor: 5.74, averageOrderValue: 156.4, addToCartRate: 15.42, checkoutStartRate: 3.33, totalShippingRevenue: 4962.44, conversionRateLiftPercentage: -9.07, revenuePerVisitorLiftPercentage: -10.73 } ] },
    significance: { testId: 'daac5554-1853-414b-bed6-2e319124b598', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '35018', percentage: 96.76 }, { variant: '35019', percentage: 3.24 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: 'f5b72f53-3e51-4f09-b4e2-f7cff8998679', name: 'Banner na Announcement Bar vs Sem Banner na Announcement Bar', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-11T21:57:52.000Z', completedAt: '2026-02-27T21:53:10.000Z', testTrafficPercentage: 50, createdAt: '2026-02-11T21:55:06.000Z', isPersonalization: false },
    results: { testId: 'f5b72f53-3e51-4f09-b4e2-f7cff8998679', variations: [ { variationId: 33572, variationName: 'Cronometro', isControl: true, trafficPercentage: 50, uniqueVisitors: 347773, sessions: 347773, conversions: 12082, conversionRate: 3.47, totalRevenue: 2061235.82, revenuePerVisitor: 5.93, averageOrderValue: 155.79, addToCartRate: 13.88, checkoutStartRate: 3.42, totalShippingRevenue: 87639.59 }, { variationId: 33573, variationName: 'Sem Cronometro', isControl: false, trafficPercentage: 50, uniqueVisitors: 349599, sessions: 349599, conversions: 11944, conversionRate: 3.42, totalRevenue: 2031054.67, revenuePerVisitor: 5.81, averageOrderValue: 155.98, addToCartRate: 13.84, checkoutStartRate: 3.36, totalShippingRevenue: 84757.01, conversionRateLiftPercentage: -1.44, revenuePerVisitorLiftPercentage: -2.02 } ] },
    significance: { testId: 'f5b72f53-3e51-4f09-b4e2-f7cff8998679', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '33572', percentage: 92.92 }, { variant: '33573', percentage: 7.08 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '57a016b3-da96-416c-957b-9b147a6e8f1f', name: 'Carrosel 2,5 vs. Carrosel 1,5 vs. Grid', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-28T21:21:37.000Z', completedAt: '2026-02-13T17:15:43.000Z', testTrafficPercentage: null, createdAt: '2026-01-28T21:17:36.000Z', isPersonalization: false },
    results: { testId: '57a016b3-da96-416c-957b-9b147a6e8f1f', variations: [ { variationId: 32221, variationName: 'Control', isControl: true, trafficPercentage: 34, uniqueVisitors: 186030, sessions: 186030, conversions: 6714, conversionRate: 3.61, totalRevenue: 1119098.04, revenuePerVisitor: 6.02, averageOrderValue: 157.73, addToCartRate: 14.36, checkoutStartRate: 3.51, totalShippingRevenue: 63832.73 }, { variationId: 32222, variationName: 'Carrosel 1,5', isControl: false, trafficPercentage: 33, uniqueVisitors: 180643, sessions: 180643, conversions: 6296, conversionRate: 3.49, totalRevenue: 1060323.62, revenuePerVisitor: 5.87, averageOrderValue: 157.9, addToCartRate: 14.83, checkoutStartRate: 3.4, totalShippingRevenue: 59512.51, conversionRateLiftPercentage: -3.32, revenuePerVisitorLiftPercentage: -2.49 }, { variationId: 32223, variationName: 'Grid', isControl: false, trafficPercentage: 33, uniqueVisitors: 180120, sessions: 180120, conversions: 6502, conversionRate: 3.61, totalRevenue: 1108481.42, revenuePerVisitor: 6.15, averageOrderValue: 160.32, addToCartRate: 15.11, checkoutStartRate: 3.52, totalShippingRevenue: 61051.75, conversionRateLiftPercentage: 0, revenuePerVisitorLiftPercentage: 2.16 } ] },
    significance: { testId: '57a016b3-da96-416c-957b-9b147a6e8f1f', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '32221', percentage: 26.88 }, { variant: '32222', percentage: 1.08 }, { variant: '32223', percentage: 72.04 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: '2818305f-5920-418d-a57d-adedfaf8bb49', name: 'Videowise vs. Sem Videowise', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-15T18:20:54.000Z', completedAt: '2026-01-29T13:44:47.000Z', testTrafficPercentage: null, createdAt: '2026-01-15T14:21:26.000Z', isPersonalization: false },
    results: { testId: '2818305f-5920-418d-a57d-adedfaf8bb49', variations: [ { variationId: 31188, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 206779, sessions: 206779, conversions: 5603, conversionRate: 2.71, totalRevenue: 911178.42, revenuePerVisitor: 4.41, averageOrderValue: 144.79, addToCartRate: 12.9, checkoutStartRate: 2.65, totalShippingRevenue: 48174.01 }, { variationId: 31189, variationName: 'Sem Videowise', isControl: false, trafficPercentage: 50, uniqueVisitors: 206403, sessions: 206403, conversions: 5537, conversionRate: 2.68, totalRevenue: 910711.11, revenuePerVisitor: 4.41, averageOrderValue: 146.49, addToCartRate: 12.96, checkoutStartRate: 2.62, totalShippingRevenue: 46630.39, conversionRateLiftPercentage: -1.11, revenuePerVisitorLiftPercentage: 0 } ] },
    significance: { testId: '2818305f-5920-418d-a57d-adedfaf8bb49', statisticalStatus: 'Trending Negative', results: { REVENUE_PER_VISITOR: [ { variant: '31188', percentage: 67.73 }, { variant: '31189', percentage: 32.27 } ] } },
  },
  {
    brand_id: 'apice',
    list: { testId: 'bcd73e46-a1d4-42bb-9056-336a1ecaf5d6', name: 'Carrinho Upcart vs. Carrinho Nativo', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-15T13:57:24.000Z', completedAt: '2026-01-23T21:09:25.000Z', testTrafficPercentage: 50, createdAt: '2026-01-13T19:30:52.000Z', isPersonalization: false },
    results: { testId: 'bcd73e46-a1d4-42bb-9056-336a1ecaf5d6', variations: [ { variationId: 31055, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 98743, sessions: 98743, conversions: 2573, conversionRate: 2.61, totalRevenue: 405252.24, revenuePerVisitor: 4.1, averageOrderValue: 142.54, addToCartRate: 12.71, checkoutStartRate: 2.55, totalShippingRevenue: 21022.6 }, { variationId: 31056, variationName: 'Carrinho Nativo', isControl: false, trafficPercentage: 50, uniqueVisitors: 92784, sessions: 92784, conversions: 2494, conversionRate: 2.69, totalRevenue: 405232.32, revenuePerVisitor: 4.37, averageOrderValue: 144.67, addToCartRate: 13.42, checkoutStartRate: 2.62, totalShippingRevenue: 21456.11, conversionRateLiftPercentage: 3.07, revenuePerVisitorLiftPercentage: 6.59 } ] },
    significance: { testId: 'bcd73e46-a1d4-42bb-9056-336a1ecaf5d6', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '31055', percentage: 7.33 }, { variant: '31056', percentage: 92.67 } ] } },
  },

  // ── BARBOURS ───────────────────────────────────────────────────────────────
  {
    brand_id: 'barbours',
    list: { testId: '82f4ab64-01e0-4f75-97d6-8b8888cf7441', name: '[Home] Trust Icons', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-16T21:28:23.000Z', completedAt: null, testTrafficPercentage: 33, createdAt: '2026-04-16T21:24:49.000Z', isPersonalization: false },
    results: { testId: '82f4ab64-01e0-4f75-97d6-8b8888cf7441', variations: [ { variationId: 39646, variationName: 'Sem Trust ', isControl: true, trafficPercentage: 50, uniqueVisitors: 837, sessions: 837, conversions: 53, conversionRate: 6.33, totalRevenue: 6986.95, revenuePerVisitor: 8.35, averageOrderValue: 127.04, addToCartRate: 22.1, checkoutStartRate: 5.73, totalShippingRevenue: 453.47 }, { variationId: 39647, variationName: 'Com Trust', isControl: false, trafficPercentage: 50, uniqueVisitors: 823, sessions: 823, conversions: 47, conversionRate: 5.71, totalRevenue: 5552.73, revenuePerVisitor: 6.75, averageOrderValue: 115.68, addToCartRate: 20.66, checkoutStartRate: 5.1, totalShippingRevenue: 297.94, conversionRateLiftPercentage: -9.79, revenuePerVisitorLiftPercentage: -19.16 } ] },
    significance: { testId: '82f4ab64-01e0-4f75-97d6-8b8888cf7441', statisticalStatus: 'Trending Negative', results: { REVENUE_PER_VISITOR: [ { variant: '39646', percentage: 74.61 }, { variant: '39647', percentage: 25.39 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '0f766344-835a-41eb-9ed7-3772838b2884', name: '[Cart] Barra de progresso de gift no carrinho', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-13T04:03:08.000Z', completedAt: null, testTrafficPercentage: 30, createdAt: '2026-03-13T04:00:46.000Z', isPersonalization: false },
    results: { testId: '0f766344-835a-41eb-9ed7-3772838b2884', variations: [ { variationId: 36233, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 300847, sessions: 300847, conversions: 14047, conversionRate: 4.67, totalRevenue: 2017210.95, revenuePerVisitor: 6.71, averageOrderValue: 116.95, addToCartRate: 18.99, checkoutStartRate: 4.46, totalShippingRevenue: 113829.75 }, { variationId: 36234, variationName: 'Progress Bar', isControl: false, trafficPercentage: 50, uniqueVisitors: 300197, sessions: 300197, conversions: 13553, conversionRate: 4.51, totalRevenue: 1950677.62, revenuePerVisitor: 6.5, averageOrderValue: 118.26, addToCartRate: 18.86, checkoutStartRate: 4.32, totalShippingRevenue: 106886.61, conversionRateLiftPercentage: -3.43, revenuePerVisitorLiftPercentage: -3.13 } ] },
    significance: { testId: '0f766344-835a-41eb-9ed7-3772838b2884', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '36233', percentage: 99.7 }, { variant: '36234', percentage: 0.29 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: 'd3bfc221-ad6c-4d9f-87a7-c0c1777e61c0', name: '[Cart] Preço cheio destacado VS Preço parcelado destacado', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T17:48:59.000Z', completedAt: null, testTrafficPercentage: 37, createdAt: '2026-03-27T17:42:03.000Z', isPersonalization: false },
    results: { testId: 'd3bfc221-ad6c-4d9f-87a7-c0c1777e61c0', variations: [ { variationId: 37665, variationName: 'Preço cheio', isControl: true, trafficPercentage: 50, uniqueVisitors: 193631, sessions: 193631, conversions: 8711, conversionRate: 4.5, totalRevenue: 1225809.49, revenuePerVisitor: 6.33, averageOrderValue: 114.75, addToCartRate: 18.5, checkoutStartRate: 4.28, totalShippingRevenue: 74884.3 }, { variationId: 37666, variationName: 'Preço parcelado', isControl: false, trafficPercentage: 50, uniqueVisitors: 193935, sessions: 193935, conversions: 8744, conversionRate: 4.51, totalRevenue: 1231254.4, revenuePerVisitor: 6.35, averageOrderValue: 115.24, addToCartRate: 18.81, checkoutStartRate: 4.29, totalShippingRevenue: 74961.76, conversionRateLiftPercentage: 0.22, revenuePerVisitorLiftPercentage: 0.32 } ] },
    significance: { testId: 'd3bfc221-ad6c-4d9f-87a7-c0c1777e61c0', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '37665', percentage: 38.94 }, { variant: '37666', percentage: 61.06 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '11ff784c-1ca7-42f2-948a-b88626bcd712', name: '[PDP] Simplificada (enfase para conteúdo relevante)', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T18:56:08.000Z', completedAt: '2026-04-16T21:14:11.000Z', testTrafficPercentage: 33, createdAt: '2026-03-27T18:31:19.000Z', isPersonalization: false },
    results: { testId: '11ff784c-1ca7-42f2-948a-b88626bcd712', variations: [ { variationId: 37676, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 162906, sessions: 162906, conversions: 7088, conversionRate: 4.35, totalRevenue: 983276.98, revenuePerVisitor: 6.04, averageOrderValue: 112.97, addToCartRate: 18.52, checkoutStartRate: 4.13, totalShippingRevenue: 59693.58 }, { variationId: 37677, variationName: 'Incrementada', isControl: false, trafficPercentage: 50, uniqueVisitors: 162793, sessions: 162793, conversions: 7308, conversionRate: 4.49, totalRevenue: 1020065.12, revenuePerVisitor: 6.27, averageOrderValue: 113.43, addToCartRate: 18.59, checkoutStartRate: 4.28, totalShippingRevenue: 63653.47, conversionRateLiftPercentage: 3.22, revenuePerVisitorLiftPercentage: 3.81 } ] },
    significance: { testId: '11ff784c-1ca7-42f2-948a-b88626bcd712', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '37676', percentage: 0.93 }, { variant: '37677', percentage: 99.07 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '2f6bed1b-0e22-4444-b94f-44d6876e7eae', name: 'Collection Slider Acima do Hero na Home Page', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T23:12:54.000Z', completedAt: '2026-03-20T19:55:23.000Z', testTrafficPercentage: 25, createdAt: '2026-02-27T23:08:40.000Z', isPersonalization: false },
    results: { testId: '2f6bed1b-0e22-4444-b94f-44d6876e7eae', variations: [ { variationId: 35024, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 332935, sessions: 332935, conversions: 14307, conversionRate: 4.3, totalRevenue: 2006432.84, revenuePerVisitor: 6.03, averageOrderValue: 118.58, addToCartRate: 18.27, checkoutStartRate: 4.16, totalShippingRevenue: 110963.28 }, { variationId: 35025, variationName: 'Collection Sider', isControl: false, trafficPercentage: 50, uniqueVisitors: 333249, sessions: 333249, conversions: 14297, conversionRate: 4.29, totalRevenue: 2016787.38, revenuePerVisitor: 6.05, averageOrderValue: 118.72, addToCartRate: 18.32, checkoutStartRate: 4.13, totalShippingRevenue: 110222.87, conversionRateLiftPercentage: -0.23, revenuePerVisitorLiftPercentage: 0.33 } ] },
    significance: { testId: '2f6bed1b-0e22-4444-b94f-44d6876e7eae', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '35024', percentage: 41.27 }, { variant: '35025', percentage: 58.74 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '5bd320f4-2d9d-4acd-96fd-80d30c6be855', name: 'Card de Produto - Refatorado', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-03T18:07:00.000Z', completedAt: '2026-03-20T19:55:10.000Z', testTrafficPercentage: 50, createdAt: '2026-03-03T18:06:20.000Z', isPersonalization: false },
    results: { testId: '5bd320f4-2d9d-4acd-96fd-80d30c6be855', variations: [ { variationId: 35301, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 342401, sessions: 342401, conversions: 13422, conversionRate: 3.92, totalRevenue: 1919857.46, revenuePerVisitor: 5.61, averageOrderValue: 119.26, addToCartRate: 17.32, checkoutStartRate: 3.72, totalShippingRevenue: 94651.91 }, { variationId: 35302, variationName: 'Card Novo', isControl: false, trafficPercentage: 50, uniqueVisitors: 335552, sessions: 335552, conversions: 13725, conversionRate: 4.09, totalRevenue: 1911217.22, revenuePerVisitor: 5.7, averageOrderValue: 116.75, addToCartRate: 17.03, checkoutStartRate: 3.87, totalShippingRevenue: 99148.02, conversionRateLiftPercentage: 4.34, revenuePerVisitorLiftPercentage: 1.6 } ] },
    significance: { testId: '5bd320f4-2d9d-4acd-96fd-80d30c6be855', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '35301', percentage: 1.8 }, { variant: '35302', percentage: 98.2 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '733a04d2-d9f0-4549-98d7-e05298848c64', name: 'Carrosel 2,5 (Control) vs. Grid', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-03T19:47:08.000Z', completedAt: '2026-03-13T03:48:46.000Z', testTrafficPercentage: 25, createdAt: '2026-03-03T19:45:27.000Z', isPersonalization: false },
    results: { testId: '733a04d2-d9f0-4549-98d7-e05298848c64', variations: [ { variationId: 35315, variationName: 'Carrossel 2,5', isControl: true, trafficPercentage: 50, uniqueVisitors: 10204, sessions: 10204, conversions: 765, conversionRate: 7.5, totalRevenue: 108882.03, revenuePerVisitor: 10.67, averageOrderValue: 131.18, addToCartRate: 25.7, checkoutStartRate: 6.92, totalShippingRevenue: 4028.23 }, { variationId: 35316, variationName: 'Grid', isControl: false, trafficPercentage: 50, uniqueVisitors: 9972, sessions: 9972, conversions: 710, conversionRate: 7.12, totalRevenue: 102550.51, revenuePerVisitor: 10.28, averageOrderValue: 131.64, addToCartRate: 24.94, checkoutStartRate: 6.38, totalShippingRevenue: 4259.96, conversionRateLiftPercentage: -5.07, revenuePerVisitorLiftPercentage: -3.66 } ] },
    significance: { testId: '733a04d2-d9f0-4549-98d7-e05298848c64', statisticalStatus: 'Trending Negative', results: { REVENUE_PER_VISITOR: [ { variant: '35315', percentage: 59.82 }, { variant: '35316', percentage: 40.17 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '3fdcfeb1-99c8-4c6e-b55b-d96f0f08a758', name: 'Carrosel 1,5 vs. Carrosel 2,5 vs. Grid', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-20T21:07:21.000Z', completedAt: '2026-03-03T17:54:04.000Z', testTrafficPercentage: 50, createdAt: '2026-02-20T21:05:08.000Z', isPersonalization: false },
    results: { testId: '3fdcfeb1-99c8-4c6e-b55b-d96f0f08a758', variations: [ { variationId: 34400, variationName: 'Control', isControl: true, trafficPercentage: 34, uniqueVisitors: 270260, sessions: 270260, conversions: 10793, conversionRate: 3.99, totalRevenue: 1446334.46, revenuePerVisitor: 5.35, averageOrderValue: 114.72, addToCartRate: 18.14, checkoutStartRate: 3.94, totalShippingRevenue: 94257.94 }, { variationId: 34401, variationName: 'Carrossel 2,5', isControl: false, trafficPercentage: 33, uniqueVisitors: 261743, sessions: 261743, conversions: 10639, conversionRate: 4.06, totalRevenue: 1428632.04, revenuePerVisitor: 5.46, averageOrderValue: 115.18, addToCartRate: 18.28, checkoutStartRate: 3.99, totalShippingRevenue: 91732.48, conversionRateLiftPercentage: 1.75, revenuePerVisitorLiftPercentage: 2.06 }, { variationId: 34402, variationName: 'Grid', isControl: false, trafficPercentage: 33, uniqueVisitors: 261438, sessions: 261438, conversions: 10604, conversionRate: 4.06, totalRevenue: 1425529.32, revenuePerVisitor: 5.45, averageOrderValue: 115.55, addToCartRate: 18.1, checkoutStartRate: 3.99, totalShippingRevenue: 92216.77, conversionRateLiftPercentage: 1.75, revenuePerVisitorLiftPercentage: 1.87 } ] },
    significance: { testId: '3fdcfeb1-99c8-4c6e-b55b-d96f0f08a758', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '34400', percentage: 1.87 }, { variant: '34401', percentage: 59.01 }, { variant: '34402', percentage: 39.12 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '34bf5c72-38b0-4b38-937a-61a12f6741f8', name: 'Sem Banner na Announcement Bar', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-11T21:46:45.000Z', completedAt: '2026-02-25T16:42:04.000Z', testTrafficPercentage: 50, createdAt: '2026-02-11T21:42:32.000Z', isPersonalization: false },
    results: { testId: '34bf5c72-38b0-4b38-937a-61a12f6741f8', variations: [ { variationId: 33570, variationName: 'Com Banner na Announcement Bar', isControl: true, trafficPercentage: 50, uniqueVisitors: 609563, sessions: 609563, conversions: 25426, conversionRate: 4.17, totalRevenue: 3396597.57, revenuePerVisitor: 5.57, averageOrderValue: 114.49, addToCartRate: 18.4, checkoutStartRate: 4.1, totalShippingRevenue: 224139.63 }, { variationId: 33571, variationName: 'Sem Banner', isControl: false, trafficPercentage: 50, uniqueVisitors: 609531, sessions: 609531, conversions: 25199, conversionRate: 4.13, totalRevenue: 3405756.74, revenuePerVisitor: 5.59, averageOrderValue: 114.34, addToCartRate: 18.63, checkoutStartRate: 4.06, totalShippingRevenue: 223855.6, conversionRateLiftPercentage: -0.96, revenuePerVisitorLiftPercentage: 0.36 } ] },
    significance: { testId: '34bf5c72-38b0-4b38-937a-61a12f6741f8', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '33570', percentage: 48.54 }, { variant: '33571', percentage: 51.46 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '62d3a532-25d3-4b00-8964-a37e653bd79e', name: 'Carrinho Nativo GoCart+ vs. Carrinho Nativo Barbours', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-29T14:41:15.000Z', completedAt: null, testTrafficPercentage: 50, createdAt: '2026-01-29T14:40:09.000Z', isPersonalization: false },
    results: { testId: '62d3a532-25d3-4b00-8964-a37e653bd79e', variations: [ { variationId: 32285, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 297561, sessions: 297561, conversions: 11927, conversionRate: 4.01, totalRevenue: 1623926.67, revenuePerVisitor: 5.46, averageOrderValue: 114.96, addToCartRate: 17.58, checkoutStartRate: 3.93, totalShippingRevenue: 122737.39 }, { variationId: 32286, variationName: 'Carrinho Barbours', isControl: false, trafficPercentage: 50, uniqueVisitors: 291915, sessions: 291915, conversions: 12235, conversionRate: 4.19, totalRevenue: 1559249.24, revenuePerVisitor: 5.34, averageOrderValue: 116.21, addToCartRate: 17.8, checkoutStartRate: 4.12, totalShippingRevenue: 107241.21, conversionRateLiftPercentage: 4.49, revenuePerVisitorLiftPercentage: -2.2 } ] },
    significance: { testId: '62d3a532-25d3-4b00-8964-a37e653bd79e', statisticalStatus: 'Near Significance', results: { REVENUE_PER_VISITOR: [ { variant: '32285', percentage: 88.59 }, { variant: '32286', percentage: 11.4 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: '64d20841-45d2-49f9-ae03-e02f30222ff9', name: 'Videowise vs. Sem Videowise', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-15T19:14:07.000Z', completedAt: '2026-01-20T12:33:52.000Z', testTrafficPercentage: null, createdAt: '2026-01-15T19:13:20.000Z', isPersonalization: false },
    results: { testId: '64d20841-45d2-49f9-ae03-e02f30222ff9', variations: [ { variationId: 31206, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 410728, sessions: 410728, conversions: 15541, conversionRate: 3.78, totalRevenue: 1875431.84, revenuePerVisitor: 4.57, averageOrderValue: 102.78, addToCartRate: 16.35, checkoutStartRate: 3.71, totalShippingRevenue: 125617.59 }, { variationId: 31207, variationName: 'Sem Videowise', isControl: false, trafficPercentage: 50, uniqueVisitors: 410149, sessions: 410149, conversions: 15611, conversionRate: 3.81, totalRevenue: 1887989.24, revenuePerVisitor: 4.6, averageOrderValue: 103.02, addToCartRate: 16.46, checkoutStartRate: 3.74, totalShippingRevenue: 127276.92, conversionRateLiftPercentage: 0.79, revenuePerVisitorLiftPercentage: 0.66 } ] },
    significance: { testId: '64d20841-45d2-49f9-ae03-e02f30222ff9', statisticalStatus: 'Near Significance', results: { REVENUE_PER_VISITOR: [ { variant: '31206', percentage: 18.94 }, { variant: '31207', percentage: 81.06 } ] } },
  },
  {
    brand_id: 'barbours',
    list: { testId: 'a08fb681-1118-4111-8205-3c19c9d7db76', name: 'Inspirado em vs. Sem inspiração', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-13T17:42:56.000Z', completedAt: '2026-01-15T20:14:21.000Z', testTrafficPercentage: 50, createdAt: '2026-01-13T17:42:23.000Z', isPersonalization: false },
    results: { testId: 'a08fb681-1118-4111-8205-3c19c9d7db76', variations: [ { variationId: 31041, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 55666, sessions: 55666, conversions: 2055, conversionRate: 3.69, totalRevenue: 263090.48, revenuePerVisitor: 4.73, averageOrderValue: 113.16, addToCartRate: 17.85, checkoutStartRate: 3.61, totalShippingRevenue: 15993.73 }, { variationId: 31042, variationName: 'Variation 1', isControl: false, trafficPercentage: 50, uniqueVisitors: 55721, sessions: 55721, conversions: 1879, conversionRate: 3.37, totalRevenue: 234709.22, revenuePerVisitor: 4.21, averageOrderValue: 111.08, addToCartRate: 16.95, checkoutStartRate: 3.28, totalShippingRevenue: 14347.96, conversionRateLiftPercentage: -8.67, revenuePerVisitorLiftPercentage: -10.99 } ] },
    significance: { testId: 'a08fb681-1118-4111-8205-3c19c9d7db76', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '31041', percentage: 99.95 }, { variant: '31042', percentage: 0.04 } ] } },
  },

  // ── KOKESHI ────────────────────────────────────────────────────────────────
  {
    brand_id: 'kokeshi',
    list: { testId: '0d8e53cc-9dca-4c14-9b14-7eea50aa1e0a', name: 'Fase 3 -  Kokeshi Novo Tema (sem rebranding) - melhorias PDP', type: 'THEME', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-16T15:08:02.000Z', completedAt: null, testTrafficPercentage: null, createdAt: '2026-04-16T14:04:10.000Z', isPersonalization: false },
    results: { testId: '0d8e53cc-9dca-4c14-9b14-7eea50aa1e0a', variations: [ { variationId: 39582, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 34976, sessions: 34976, conversions: 1319, conversionRate: 3.77, totalRevenue: 121284.13, revenuePerVisitor: 3.47, averageOrderValue: 78.35, addToCartRate: 18.96, checkoutStartRate: 3.53, totalShippingRevenue: 8119.73 }, { variationId: 39583, variationName: 'Tema Novo', isControl: false, trafficPercentage: 50, uniqueVisitors: 34313, sessions: 34313, conversions: 1293, conversionRate: 3.77, totalRevenue: 121251.18, revenuePerVisitor: 3.53, averageOrderValue: 84.03, addToCartRate: 16.12, checkoutStartRate: 3.04, totalShippingRevenue: 7193.34, conversionRateLiftPercentage: 0, revenuePerVisitorLiftPercentage: 1.73 } ] },
    significance: { testId: '0d8e53cc-9dca-4c14-9b14-7eea50aa1e0a', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '39582', percentage: 36.2 }, { variant: '39583', percentage: 63.8 } ] } },
  },
  {
    brand_id: 'kokeshi',
    list: { testId: '42c85607-985e-4ccc-a8cf-0826aa31839f', name: 'Fase 2 -  Kokeshi Novo Tema (sem rebranding) - melhorias PDP e Home', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-09T04:53:05.000Z', completedAt: null, testTrafficPercentage: null, createdAt: '2026-04-09T00:11:55.000Z', isPersonalization: false },
    results: { testId: '42c85607-985e-4ccc-a8cf-0826aa31839f', variations: [ { variationId: 38877, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 103853, sessions: 103853, conversions: 4645, conversionRate: 4.47, totalRevenue: 482746.88, revenuePerVisitor: 4.65, averageOrderValue: 89.28, addToCartRate: 20.78, checkoutStartRate: 4.26, totalShippingRevenue: 25610.69 }, { variationId: 38878, variationName: 'Tema Novo', isControl: false, trafficPercentage: 50, uniqueVisitors: 102683, sessions: 102683, conversions: 4452, conversionRate: 4.34, totalRevenue: 449911.19, revenuePerVisitor: 4.38, averageOrderValue: 91.97, addToCartRate: 17.69, checkoutStartRate: 3.59, totalShippingRevenue: 21998.9, conversionRateLiftPercentage: -2.91, revenuePerVisitorLiftPercentage: -5.81 } ] },
    significance: { testId: '42c85607-985e-4ccc-a8cf-0826aa31839f', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '38877', percentage: 99.51 }, { variant: '38878', percentage: 0.49 } ] } },
  },
  {
    brand_id: 'kokeshi',
    list: { testId: '45a5ddba-e272-4e9b-8c78-e897a6f0af53', name: 'Kokeshi Novo Tema (sem rebranding)', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-26T01:40:19.000Z', completedAt: '2026-04-09T00:11:46.000Z', testTrafficPercentage: null, createdAt: '2026-03-26T01:37:23.000Z', isPersonalization: false },
    results: { testId: '45a5ddba-e272-4e9b-8c78-e897a6f0af53', variations: [ { variationId: 37463, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 211999, sessions: 211999, conversions: 12090, conversionRate: 5.7, totalRevenue: 1253161.07, revenuePerVisitor: 5.91, averageOrderValue: 87.39, addToCartRate: 22.77, checkoutStartRate: 5.47, totalShippingRevenue: 67183.89 }, { variationId: 37464, variationName: 'Tema Novo', isControl: false, trafficPercentage: 50, uniqueVisitors: 209204, sessions: 209204, conversions: 11723, conversionRate: 5.6, totalRevenue: 1179051.08, revenuePerVisitor: 5.64, averageOrderValue: 89.17, addToCartRate: 19.45, checkoutStartRate: 4.58, totalShippingRevenue: 59935.63, conversionRateLiftPercentage: -1.75, revenuePerVisitorLiftPercentage: -4.57 } ] },
    significance: { testId: '45a5ddba-e272-4e9b-8c78-e897a6f0af53', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '37463', percentage: 99.98 }, { variant: '37464', percentage: 0.03 } ] } },
  },
  {
    brand_id: 'kokeshi',
    list: { testId: '05613043-5cd4-4aeb-b183-b4ebffd22cf8', name: 'Kokeshi Rebrand (novo tema)', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-13T20:05:20.000Z', completedAt: null, testTrafficPercentage: null, createdAt: '2026-03-13T20:01:48.000Z', isPersonalization: false },
    results: { testId: '05613043-5cd4-4aeb-b183-b4ebffd22cf8', variations: [ { variationId: 36298, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 239497, sessions: 239497, conversions: 12877, conversionRate: 5.38, totalRevenue: 1230562.82, revenuePerVisitor: 5.14, averageOrderValue: 80.7, addToCartRate: 21.57, checkoutStartRate: 5.21, totalShippingRevenue: 56737.42 }, { variationId: 36299, variationName: 'Rebrand', isControl: false, trafficPercentage: 50, uniqueVisitors: 238904, sessions: 238904, conversions: 12413, conversionRate: 5.2, totalRevenue: 1155528.65, revenuePerVisitor: 4.84, averageOrderValue: 83.18, addToCartRate: 18.51, checkoutStartRate: 4.21, totalShippingRevenue: 50554.5, conversionRateLiftPercentage: -3.35, revenuePerVisitorLiftPercentage: -5.84 } ] },
    significance: { testId: '05613043-5cd4-4aeb-b183-b4ebffd22cf8', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '36298', percentage: 99.85 }, { variant: '36299', percentage: 0.15 } ] } },
  },
  {
    brand_id: 'kokeshi',
    list: { testId: '1050c7a2-d78f-4729-a417-a5c3f3364e94', name: 'Vídeos Judge.me Incrementados', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-29T20:18:50.000Z', completedAt: '2026-02-03T14:27:49.000Z', testTrafficPercentage: null, createdAt: '2026-01-29T20:14:25.000Z', isPersonalization: false },
    results: { testId: '1050c7a2-d78f-4729-a417-a5c3f3364e94', variations: [ { variationId: 32322, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 110117, sessions: 110117, conversions: 5503, conversionRate: 5, totalRevenue: 499316.04, revenuePerVisitor: 4.53, averageOrderValue: 76.12, addToCartRate: 21.39, checkoutStartRate: 4.95, totalShippingRevenue: 32515.52 }, { variationId: 32323, variationName: 'Sem Conteudos Judge.me', isControl: false, trafficPercentage: 50, uniqueVisitors: 110456, sessions: 110456, conversions: 5723, conversionRate: 5.18, totalRevenue: 516464, revenuePerVisitor: 4.68, averageOrderValue: 76.08, addToCartRate: 22.01, checkoutStartRate: 5.11, totalShippingRevenue: 33423.05, conversionRateLiftPercentage: 3.6, revenuePerVisitorLiftPercentage: 3.31 } ] },
    significance: { testId: '1050c7a2-d78f-4729-a417-a5c3f3364e94', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '32322', percentage: 35.57 }, { variant: '32323', percentage: 64.44 } ] } },
  },
  {
    brand_id: 'kokeshi',
    list: { testId: '9b525a8a-492f-46fe-b156-d9e2bc8793d5', name: 'Carrinho Upcart vs. Carrinho Nativo GoCart+', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-14T18:29:41.000Z', completedAt: '2026-01-29T13:31:45.000Z', testTrafficPercentage: null, createdAt: '2026-01-14T18:25:52.000Z', isPersonalization: false },
    results: { testId: '9b525a8a-492f-46fe-b156-d9e2bc8793d5', variations: [ { variationId: 31130, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 216285, sessions: 216285, conversions: 11122, conversionRate: 5.14, totalRevenue: 951756.47, revenuePerVisitor: 4.4, averageOrderValue: 76.69, addToCartRate: 20.75, checkoutStartRate: 5.06, totalShippingRevenue: 52515.93 }, { variationId: 31131, variationName: 'Carrinho Nativo', isControl: false, trafficPercentage: 50, uniqueVisitors: 213199, sessions: 213199, conversions: 10778, conversionRate: 5.06, totalRevenue: 948427.87, revenuePerVisitor: 4.45, averageOrderValue: 74.92, addToCartRate: 20.82, checkoutStartRate: 4.93, totalShippingRevenue: 54785.36, conversionRateLiftPercentage: -1.56, revenuePerVisitorLiftPercentage: 1.14 } ] },
    significance: { testId: '9b525a8a-492f-46fe-b156-d9e2bc8793d5', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '31130', percentage: 26.36 }, { variant: '31131', percentage: 73.65 } ] } },
  },
  {
    brand_id: 'kokeshi',
    list: { testId: '84c6a047-2d52-4468-847a-5ba03e26d329', name: 'Videowise vs. Sem Videowise', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-15T19:45:46.000Z', completedAt: '2026-01-20T12:38:24.000Z', testTrafficPercentage: null, createdAt: '2026-01-15T19:41:47.000Z', isPersonalization: false },
    results: { testId: '84c6a047-2d52-4468-847a-5ba03e26d329', variations: [ { variationId: 31210, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 28035, sessions: 28035, conversions: 1179, conversionRate: 4.21, totalRevenue: 103046.01, revenuePerVisitor: 3.68, averageOrderValue: 79.02, addToCartRate: 19.1, checkoutStartRate: 4.24, totalShippingRevenue: 5493.26 }, { variationId: 31211, variationName: 'Sem Videowise', isControl: false, trafficPercentage: 50, uniqueVisitors: 27953, sessions: 27953, conversions: 1288, conversionRate: 4.61, totalRevenue: 109097.68, revenuePerVisitor: 3.9, averageOrderValue: 77.65, addToCartRate: 19.28, checkoutStartRate: 4.57, totalShippingRevenue: 5708.27, conversionRateLiftPercentage: 9.5, revenuePerVisitorLiftPercentage: 5.98 } ] },
    significance: { testId: '84c6a047-2d52-4468-847a-5ba03e26d329', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '31210', percentage: 8.95 }, { variant: '31211', percentage: 91.05 } ] } },
  },

  // ── RITUARIA ───────────────────────────────────────────────────────────────
  {
    brand_id: 'rituaria',
    list: { testId: '29817541-3707-4dcb-b881-94f688071ba9', name: '[Home] Trust Icons vs. Brand CTA vs. Apenas Banner', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T20:28:02.000Z', completedAt: null, testTrafficPercentage: null, createdAt: '2026-03-27T20:19:51.000Z', isPersonalization: false },
    results: { testId: '29817541-3707-4dcb-b881-94f688071ba9', variations: [ { variationId: 37686, variationName: 'Trust Icons', isControl: true, trafficPercentage: 33.33, uniqueVisitors: 14412, sessions: 14412, conversions: 1956, conversionRate: 13.57, totalRevenue: 364377.57, revenuePerVisitor: 25.28, averageOrderValue: 173.02, addToCartRate: 35.73, checkoutStartRate: 12.39, totalShippingRevenue: 13088.98 }, { variationId: 37687, variationName: 'Brand Description ', isControl: false, trafficPercentage: 33.33, uniqueVisitors: 14477, sessions: 14477, conversions: 1955, conversionRate: 13.5, totalRevenue: 359608.25, revenuePerVisitor: 24.84, averageOrderValue: 170.75, addToCartRate: 35.53, checkoutStartRate: 12.37, totalShippingRevenue: 13142.99, conversionRateLiftPercentage: -0.52, revenuePerVisitorLiftPercentage: -1.74 }, { variationId: 37688, variationName: 'Apenas Banner', isControl: null, trafficPercentage: 33.34, uniqueVisitors: 14413, sessions: 14413, conversions: 1919, conversionRate: 13.31, totalRevenue: 350326.45, revenuePerVisitor: 24.31, averageOrderValue: 170.56, addToCartRate: 35.44, checkoutStartRate: 11.96, totalShippingRevenue: 12894.77, conversionRateLiftPercentage: -1.92, revenuePerVisitorLiftPercentage: -3.84 } ] },
    significance: { testId: '29817541-3707-4dcb-b881-94f688071ba9', statisticalStatus: 'Trending Negative', results: { REVENUE_PER_VISITOR: [ { variant: '37686', percentage: 63.81 }, { variant: '37687', percentage: 28.94 }, { variant: '37688', percentage: 7.25 } ] } },
  },
  {
    brand_id: 'rituaria',
    list: { testId: '18c2c1e0-e57a-4d93-88e9-4dc2237cd0f9', name: '[Cart] Adicionar mensagem de "Cupom no Checkout"', type: 'CUSTOM_CODE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-16T23:19:42.000Z', completedAt: null, testTrafficPercentage: null, createdAt: '2026-04-16T23:18:48.000Z', isPersonalization: false },
    results: { testId: '18c2c1e0-e57a-4d93-88e9-4dc2237cd0f9', variations: [ { variationId: 39650, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 20469, sessions: 20469, conversions: 586, conversionRate: 2.86, totalRevenue: 96500.35, revenuePerVisitor: 4.71, averageOrderValue: 144.9, addToCartRate: 12.13, checkoutStartRate: 2.67, totalShippingRevenue: 4361.91 }, { variationId: 39651, variationName: 'Mensagem de Cupom', isControl: false, trafficPercentage: 50, uniqueVisitors: 20558, sessions: 20558, conversions: 581, conversionRate: 2.83, totalRevenue: 99098.93, revenuePerVisitor: 4.82, averageOrderValue: 150.38, addToCartRate: 12.01, checkoutStartRate: 2.68, totalShippingRevenue: 4304.04, conversionRateLiftPercentage: -1.05, revenuePerVisitorLiftPercentage: 2.34 } ] },
    significance: { testId: '18c2c1e0-e57a-4d93-88e9-4dc2237cd0f9', statisticalStatus: 'Trending Positive', results: { REVENUE_PER_VISITOR: [ { variant: '39650', percentage: 47.89 }, { variant: '39651', percentage: 52.11 } ] } },
  },
  {
    brand_id: 'rituaria',
    list: { testId: '895ce978-c4cc-407d-af6b-46a0ac78f0fe', name: '[Imagens] Retirar Texto, Preço e Desconto das imagens de produto', type: 'PRODUCT_IMAGE', status: 'Running', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-04-17T17:26:04.000Z', completedAt: null, testTrafficPercentage: null, createdAt: '2026-04-17T15:00:47.000Z', isPersonalization: false },
    results: { testId: '895ce978-c4cc-407d-af6b-46a0ac78f0fe', variations: [ { variationId: 39725, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 17025, sessions: 17025, conversions: 458, conversionRate: 2.69, totalRevenue: 76444.58, revenuePerVisitor: 4.49, averageOrderValue: 151.68, addToCartRate: 12.26, checkoutStartRate: 2.6, totalShippingRevenue: 3192.91 }, { variationId: 39726, variationName: 'Imagem Minimalista', isControl: false, trafficPercentage: 50, uniqueVisitors: 17074, sessions: 17074, conversions: 418, conversionRate: 2.45, totalRevenue: 71703.9, revenuePerVisitor: 4.2, averageOrderValue: 152.56, addToCartRate: 11.24, checkoutStartRate: 2.33, totalShippingRevenue: 3156.32, conversionRateLiftPercentage: -8.92, revenuePerVisitorLiftPercentage: -6.46 } ] },
    significance: { testId: '895ce978-c4cc-407d-af6b-46a0ac78f0fe', statisticalStatus: 'Trending Negative', results: { REVENUE_PER_VISITOR: [ { variant: '39725', percentage: 63.7 }, { variant: '39726', percentage: 36.3 } ] } },
  },
  {
    brand_id: 'rituaria',
    list: { testId: '505c3dde-59cc-4868-9a9c-a63c1d1c0dd1', name: '[Tema] Card de produto refatorado', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-27T20:06:06.000Z', completedAt: '2026-04-15T22:32:27.000Z', testTrafficPercentage: 25, createdAt: '2026-03-27T17:58:30.000Z', isPersonalization: false },
    results: { testId: '505c3dde-59cc-4868-9a9c-a63c1d1c0dd1', variations: [ { variationId: 37667, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 117099, sessions: 117099, conversions: 6478, conversionRate: 5.53, totalRevenue: 1108238.37, revenuePerVisitor: 9.46, averageOrderValue: 149.62, addToCartRate: 17.87, checkoutStartRate: 5.23, totalShippingRevenue: 49334.46 }, { variationId: 37668, variationName: 'Card novo', isControl: false, trafficPercentage: 50, uniqueVisitors: 113617, sessions: 113617, conversions: 6651, conversionRate: 5.85, totalRevenue: 1126640.3, revenuePerVisitor: 9.92, averageOrderValue: 148.99, addToCartRate: 18.16, checkoutStartRate: 5.51, totalShippingRevenue: 49174.3, conversionRateLiftPercentage: 5.79, revenuePerVisitorLiftPercentage: 4.86 } ] },
    significance: { testId: '505c3dde-59cc-4868-9a9c-a63c1d1c0dd1', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '37667', percentage: 0.43 }, { variant: '37668', percentage: 99.57 } ] } },
  },
  {
    brand_id: 'rituaria',
    list: { testId: 'cc80c3c5-6323-424c-82d7-b928dbaaec23', name: '[PDP] Sinalização de urgência na PDP ("Vendendo rápido")', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-13T04:19:48.000Z', completedAt: '2026-04-06T14:00:52.000Z', testTrafficPercentage: 25, createdAt: '2026-03-13T04:19:00.000Z', isPersonalization: false },
    results: { testId: 'cc80c3c5-6323-424c-82d7-b928dbaaec23', variations: [ { variationId: 36240, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 123284, sessions: 123284, conversions: 7113, conversionRate: 5.77, totalRevenue: 1117747.78, revenuePerVisitor: 9.07, averageOrderValue: 142.3, addToCartRate: 18.52, checkoutStartRate: 5.46, totalShippingRevenue: 52962.97 }, { variationId: 36241, variationName: "Banner 'Vendendo rápido'", isControl: false, trafficPercentage: 50, uniqueVisitors: 122177, sessions: 122177, conversions: 7305, conversionRate: 5.98, totalRevenue: 1166851.34, revenuePerVisitor: 9.55, averageOrderValue: 144.5, addToCartRate: 18.62, checkoutStartRate: 5.64, totalShippingRevenue: 54476.42, conversionRateLiftPercentage: 3.64, revenuePerVisitorLiftPercentage: 5.29 } ] },
    significance: { testId: 'cc80c3c5-6323-424c-82d7-b928dbaaec23', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '36240', percentage: 1.12 }, { variant: '36241', percentage: 98.88 } ] } },
  },
  {
    brand_id: 'rituaria',
    list: { testId: '4d143d13-2d0b-45cd-8e42-14b2d0e16f0a', name: '[Home] Sem Trust Icons na Home Page', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T22:39:52.000Z', completedAt: null, testTrafficPercentage: 25, createdAt: '2026-02-27T22:38:37.000Z', isPersonalization: false },
    results: { testId: '4d143d13-2d0b-45cd-8e42-14b2d0e16f0a', variations: [ { variationId: 35020, variationName: 'Trust Icons', isControl: true, trafficPercentage: 50, uniqueVisitors: 90415, sessions: 90415, conversions: 9337, conversionRate: 10.33, totalRevenue: 1498592.93, revenuePerVisitor: 16.57, averageOrderValue: 145.69, addToCartRate: 31.25, checkoutStartRate: 9.8, totalShippingRevenue: 68597.26 }, { variationId: 35021, variationName: 'Sem Trust Icons', isControl: false, trafficPercentage: 50, uniqueVisitors: 90476, sessions: 90476, conversions: 9504, conversionRate: 10.5, totalRevenue: 1545269.96, revenuePerVisitor: 17.08, averageOrderValue: 146.72, addToCartRate: 31.71, checkoutStartRate: 9.99, totalShippingRevenue: 69979.35, conversionRateLiftPercentage: 1.65, revenuePerVisitorLiftPercentage: 3.08 } ] },
    significance: { testId: '4d143d13-2d0b-45cd-8e42-14b2d0e16f0a', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '35020', percentage: 2.65 }, { variant: '35021', percentage: 97.36 } ] } },
  },
  {
    brand_id: 'rituaria',
    list: { testId: '6830bd19-ac3c-47f3-a868-e68b40ed961d', name: 'Sem Lista de Upsell na PDP', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-27T22:47:07.000Z', completedAt: '2026-03-18T04:38:50.000Z', testTrafficPercentage: 15, createdAt: '2026-02-27T22:41:57.000Z', isPersonalization: false },
    results: { testId: '6830bd19-ac3c-47f3-a868-e68b40ed961d', variations: [ { variationId: 35022, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 189295, sessions: 189295, conversions: 11162, conversionRate: 5.9, totalRevenue: 1685463.2, revenuePerVisitor: 8.9, averageOrderValue: 131.77, addToCartRate: 20.89, checkoutStartRate: 5.69, totalShippingRevenue: 86018.03 }, { variationId: 35023, variationName: 'Sem Lista de Upsell', isControl: false, trafficPercentage: 50, uniqueVisitors: 189151, sessions: 189151, conversions: 11237, conversionRate: 5.94, totalRevenue: 1646210.19, revenuePerVisitor: 8.7, averageOrderValue: 128.51, addToCartRate: 21.36, checkoutStartRate: 5.76, totalShippingRevenue: 86090.25, conversionRateLiftPercentage: 0.68, revenuePerVisitorLiftPercentage: -2.25 } ] },
    significance: { testId: '6830bd19-ac3c-47f3-a868-e68b40ed961d', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '35022', percentage: 95.95 }, { variant: '35023', percentage: 4.06 } ] } },
  },
  {
    brand_id: 'rituaria',
    list: { testId: '98dfde0a-c146-4737-8c07-ff25785d1dc0', name: 'Carrinho Nativo GoCart+ vs. Carrinho Upcart', type: 'THEME', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-03T17:06:19.000Z', completedAt: '2026-02-11T18:15:26.000Z', testTrafficPercentage: null, createdAt: '2026-02-03T17:05:43.000Z', isPersonalization: false },
    results: { testId: '98dfde0a-c146-4737-8c07-ff25785d1dc0', variations: [ { variationId: 32748, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 326507, sessions: 326507, conversions: 16004, conversionRate: 4.9, totalRevenue: 2521631.77, revenuePerVisitor: 7.72, averageOrderValue: 138.8, addToCartRate: 17.41, checkoutStartRate: 4.79, totalShippingRevenue: 114904.78 }, { variationId: 32749, variationName: 'Upcart', isControl: false, trafficPercentage: 50, uniqueVisitors: 320348, sessions: 320348, conversions: 15853, conversionRate: 4.95, totalRevenue: 2390152.77, revenuePerVisitor: 7.46, averageOrderValue: 138.65, addToCartRate: 16.93, checkoutStartRate: 4.77, totalShippingRevenue: 109165.79, conversionRateLiftPercentage: 1.02, revenuePerVisitorLiftPercentage: -3.37 } ] },
    significance: { testId: '98dfde0a-c146-4737-8c07-ff25785d1dc0', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '32748', percentage: 99.79 }, { variant: '32749', percentage: 0.21 } ] } },
  },

  // ── LESCENT ────────────────────────────────────────────────────────────────
  {
    brand_id: 'lescent',
    list: { testId: '792bc857-6f2f-4a5e-8df1-070d21e8e004', name: 'Prova Social na PDP', type: 'PAGE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-03-13T03:36:00.000Z', completedAt: '2026-04-06T14:19:48.000Z', testTrafficPercentage: null, createdAt: '2026-03-13T03:35:05.000Z', isPersonalization: false },
    results: { testId: '792bc857-6f2f-4a5e-8df1-070d21e8e004', variations: [ { variationId: 36231, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 181410, sessions: 181410, conversions: 12671, conversionRate: 6.98, totalRevenue: 1484056.36, revenuePerVisitor: 8.18, averageOrderValue: 110.23, addToCartRate: 23.9, checkoutStartRate: 6.59, totalShippingRevenue: 99594.16 }, { variationId: 36232, variationName: 'Prova Social', isControl: false, trafficPercentage: 50, uniqueVisitors: 179954, sessions: 179954, conversions: 13010, conversionRate: 7.23, totalRevenue: 1523977.9, revenuePerVisitor: 8.47, averageOrderValue: 110.36, addToCartRate: 24.56, checkoutStartRate: 6.81, totalShippingRevenue: 103544.68, conversionRateLiftPercentage: 3.58, revenuePerVisitorLiftPercentage: 3.55 } ] },
    significance: { testId: '792bc857-6f2f-4a5e-8df1-070d21e8e004', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '36231', percentage: 0.36 }, { variant: '36232', percentage: 99.63 } ] } },
  },
  {
    brand_id: 'lescent',
    list: { testId: 'b5d1ef3a-4b17-4096-a7a5-053c882cd70e', name: 'Com Review vs. Sem Review', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-25T20:03:16.000Z', completedAt: '2026-03-10T00:56:20.000Z', testTrafficPercentage: null, createdAt: '2026-02-25T19:53:14.000Z', isPersonalization: false },
    results: { testId: 'b5d1ef3a-4b17-4096-a7a5-053c882cd70e', variations: [ { variationId: 34799, variationName: 'Control (reviews)', isControl: true, trafficPercentage: 50, uniqueVisitors: 193815, sessions: 193815, conversions: 9555, conversionRate: 4.93, totalRevenue: 1001023.09, revenuePerVisitor: 5.16, averageOrderValue: 97.7, addToCartRate: 19.17, checkoutStartRate: 4.85, totalShippingRevenue: 74823.74 }, { variationId: 34800, variationName: 'Reviews Ocultos', isControl: false, trafficPercentage: 50, uniqueVisitors: 194355, sessions: 194355, conversions: 9878, conversionRate: 5.08, totalRevenue: 1040306.42, revenuePerVisitor: 5.35, averageOrderValue: 98.1, addToCartRate: 19.74, checkoutStartRate: 5, totalShippingRevenue: 76238.95, conversionRateLiftPercentage: 3.04, revenuePerVisitorLiftPercentage: 3.68 } ] },
    significance: { testId: 'b5d1ef3a-4b17-4096-a7a5-053c882cd70e', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '34799', percentage: 0.69 }, { variant: '34800', percentage: 99.3 } ] } },
  },
  {
    brand_id: 'lescent',
    list: { testId: '7f7aaf45-2b51-4b98-a6f0-c1989b4646cb', name: 'Teste de Pop-Up de WhatsApp de grupo de vendas (all pages)', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-11T00:16:43.000Z', completedAt: '2026-02-27T13:05:32.000Z', testTrafficPercentage: null, createdAt: '2026-02-11T00:13:35.000Z', isPersonalization: false },
    results: { testId: '7f7aaf45-2b51-4b98-a6f0-c1989b4646cb', variations: [ { variationId: 33464, variationName: 'Sem Pop-Up', isControl: true, trafficPercentage: 50, uniqueVisitors: 213963, sessions: 213963, conversions: 9399, conversionRate: 4.39, totalRevenue: 1012481.85, revenuePerVisitor: 4.73, averageOrderValue: 99.59, addToCartRate: 17.27, checkoutStartRate: 4.36, totalShippingRevenue: 75252.52 }, { variationId: 33465, variationName: 'Com Pop-Up', isControl: false, trafficPercentage: 50, uniqueVisitors: 213793, sessions: 213793, conversions: 9341, conversionRate: 4.37, totalRevenue: 1001354.72, revenuePerVisitor: 4.68, averageOrderValue: 99.09, addToCartRate: 17.05, checkoutStartRate: 4.33, totalShippingRevenue: 73611.02, conversionRateLiftPercentage: -0.46, revenuePerVisitorLiftPercentage: -1.06 } ] },
    significance: { testId: '7f7aaf45-2b51-4b98-a6f0-c1989b4646cb', statisticalStatus: 'Trending Negative', results: { REVENUE_PER_VISITOR: [ { variant: '33464', percentage: 74.13 }, { variant: '33465', percentage: 25.86 } ] } },
  },
  {
    brand_id: 'lescent',
    list: { testId: '7f2d73b1-7ea1-479b-9d10-0ac78637fc05', name: 'Sem Seletor de Variante vs. Com Seletor de Variante', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-02-07T17:00:56.000Z', completedAt: '2026-02-13T20:30:13.000Z', testTrafficPercentage: null, createdAt: '2026-02-07T16:56:53.000Z', isPersonalization: false },
    results: { testId: '7f2d73b1-7ea1-479b-9d10-0ac78637fc05', variations: [ { variationId: 33126, variationName: 'Control', isControl: true, trafficPercentage: 50, uniqueVisitors: 99342, sessions: 99342, conversions: 3921, conversionRate: 3.95, totalRevenue: 464127.53, revenuePerVisitor: 4.67, averageOrderValue: 111.97, addToCartRate: 17.44, checkoutStartRate: 3.91, totalShippingRevenue: 30092.57 }, { variationId: 33127, variationName: 'Com Seletor de Variante', isControl: false, trafficPercentage: 50, uniqueVisitors: 99271, sessions: 99271, conversions: 4016, conversionRate: 4.05, totalRevenue: 477337.63, revenuePerVisitor: 4.81, averageOrderValue: 112.39, addToCartRate: 17.94, checkoutStartRate: 4, totalShippingRevenue: 30657.36, conversionRateLiftPercentage: 2.53, revenuePerVisitorLiftPercentage: 3 } ] },
    significance: { testId: '7f2d73b1-7ea1-479b-9d10-0ac78637fc05', statisticalStatus: 'Near Significance', results: { REVENUE_PER_VISITOR: [ { variant: '33126', percentage: 14.4 }, { variant: '33127', percentage: 85.6 } ] } },
  },
  {
    brand_id: 'lescent',
    list: { testId: '31b4c473-2660-43da-ab19-c21f3bff58f0', name: 'Com Videowise vs. Sem Videowise', type: 'CUSTOM_CODE', status: 'Done', goal: 'REVENUE_PER_VISITOR', startingAt: '2026-01-29T13:27:07.000Z', completedAt: '2026-02-03T14:11:50.000Z', testTrafficPercentage: null, createdAt: '2026-01-29T13:24:56.000Z', isPersonalization: false },
    results: { testId: '31b4c473-2660-43da-ab19-c21f3bff58f0', variations: [ { variationId: 32277, variationName: 'Com Videowise', isControl: true, trafficPercentage: 50, uniqueVisitors: 76837, sessions: 76837, conversions: 3439, conversionRate: 4.48, totalRevenue: 428575.85, revenuePerVisitor: 5.58, averageOrderValue: 117.84, addToCartRate: 18.15, checkoutStartRate: 4.43, totalShippingRevenue: 25835.13 }, { variationId: 32278, variationName: 'Sem Videowise', isControl: false, trafficPercentage: 50, uniqueVisitors: 76198, sessions: 76198, conversions: 3547, conversionRate: 4.65, totalRevenue: 449014.38, revenuePerVisitor: 5.89, averageOrderValue: 118.54, addToCartRate: 18.31, checkoutStartRate: 4.6, totalShippingRevenue: 26701.39, conversionRateLiftPercentage: 3.79, revenuePerVisitorLiftPercentage: 5.56 } ] },
    significance: { testId: '31b4c473-2660-43da-ab19-c21f3bff58f0', statisticalStatus: 'Significant', results: { REVENUE_PER_VISITOR: [ { variant: '32277', percentage: 6.68 }, { variant: '32278', percentage: 93.33 } ] } },
  },
]

// ─── NORMALIZATION ───────────────────────────────────────────────────────────

function pf(v) { const n = parseFloat(v); return isNaN(n) ? null : n }

function normalize(entry) {
  const { brand_id, list, results, significance } = entry
  const { testId: id, name, type, status, goal, startingAt, completedAt, testTrafficPercentage } = list

  const control = results.variations.find(v => v.isControl === true)
  const variant = results.variations.find(v => v.isControl === false)

  const goalKey = goal || 'REVENUE_PER_VISITOR'
  const sigResults = significance?.results?.[goalKey] || []

  // Find winner: non-control variant with significance percentage > 50
  let is_winner = null
  let winner_variation_id = null
  let winner_variation_name = null
  if (sigResults.length > 0 && variant) {
    const variantSig = sigResults.find(r => r.variant === String(variant.variationId))
    if (variantSig) {
      is_winner = variantSig.percentage > 50
      if (is_winner) {
        winner_variation_id = String(variant.variationId)
        winner_variation_name = variant.variationName || null
      }
    }
  }

  const control_aov = pf(control?.averageOrderValue)
  const variant_aov = pf(variant?.averageOrderValue)
  let lift_aov_pct = null
  if (control_aov != null && variant_aov != null && control_aov !== 0) {
    lift_aov_pct = Math.round(((variant_aov - control_aov) / control_aov) * 10000) / 100
  }

  return {
    id,
    brand_id,
    name,
    type: type || null,
    status: status.toLowerCase(),
    goal: goal || null,
    started_at: startingAt || null,
    finished_at: completedAt || null,
    traffic_percentage: testTrafficPercentage != null ? parseInt(testTrafficPercentage) : null,
    winner_variation_id,
    winner_variation_name,
    is_winner,
    // control metrics
    control_visitors: control?.uniqueVisitors || null,
    control_sessions: control?.sessions || null,
    control_conversions: control?.conversions || null,
    control_cr: pf(control?.conversionRate),
    control_rpv: pf(control?.revenuePerVisitor),
    control_aov,
    control_revenue: pf(control?.totalRevenue),
    control_add_to_cart_rate: pf(control?.addToCartRate),
    control_checkout_start_rate: pf(control?.checkoutStartRate),
    // variant metrics
    variant_variation_id: variant ? String(variant.variationId) : null,
    variant_variation_name: variant?.variationName || null,
    variant_visitors: variant?.uniqueVisitors || null,
    variant_sessions: variant?.sessions || null,
    variant_conversions: variant?.conversions || null,
    variant_cr: pf(variant?.conversionRate),
    variant_rpv: pf(variant?.revenuePerVisitor),
    variant_aov,
    variant_revenue: pf(variant?.totalRevenue),
    variant_add_to_cart_rate: pf(variant?.addToCartRate),
    variant_checkout_start_rate: pf(variant?.checkoutStartRate),
    // lifts
    lift_cr_pct: pf(variant?.conversionRateLiftPercentage),
    lift_rpv_pct: pf(variant?.revenuePerVisitorLiftPercentage),
    lift_aov_pct,
    // significance
    statistical_status: significance?.statisticalStatus || null,
    statistical_significance: significance?.results || null,
    // raw data
    raw_list_data: list,
    raw_results_data: results,
    raw_significance_data: significance,
    last_synced_at: new Date().toISOString(),
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const syncedAt = new Date().toISOString()
  const stats = {}

  for (const entry of RAW) {
    const { brand_id } = entry
    if (!stats[brand_id]) stats[brand_id] = { processed: 0, upserted: 0, errors: [] }
    stats[brand_id].processed++

    const normalized = normalize(entry)

    // Upsert ab_tests
    const { error: upsertErr } = await supabase
      .from('ab_tests')
      .upsert(normalized, { onConflict: 'id,brand_id' })

    if (upsertErr) {
      console.error(`❌ [${brand_id}] ${normalized.name}: ${upsertErr.message}`)
      stats[brand_id].errors.push(`${normalized.name}: ${upsertErr.message}`)
      continue
    }

    stats[brand_id].upserted = (stats[brand_id].upserted || 0) + 1

    // Insert snapshot
    const snapshot = {
      test_id: normalized.id,
      brand_id: normalized.brand_id,
      collected_at: syncedAt,
      statistical_status: normalized.statistical_status,
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
    }
    const { error: snapErr } = await supabase.from('ab_test_snapshots').insert(snapshot)
    if (snapErr) console.warn(`  ⚠️  snapshot [${brand_id}/${normalized.id}]: ${snapErr.message}`)
  }

  // Insert sync log per brand
  for (const [brand, s] of Object.entries(stats)) {
    await supabase.from('ab_sync_log').insert({
      brand_id: brand,
      trigger_type: 'cron',
      tests_fetched: s.processed,
      tests_updated: s.upserted || 0,
      tests_skipped: 0,
      errors: s.errors,
      started_at: syncedAt,
      finished_at: new Date().toISOString(),
      status: s.errors.length > 0 ? 'partial' : 'success',
    })
  }

  const totalProcessed = Object.values(stats).reduce((s, v) => s + v.processed, 0)
  const totalUpserted = Object.values(stats).reduce((s, v) => s + (v.upserted || 0), 0)
  const totalErrors = Object.values(stats).reduce((s, v) => s + v.errors.length, 0)

  console.log('\n✅ Sync concluído!\n')
  console.log('Marca         | Processados | Salvos | Erros')
  console.log('------------- | ----------- | ------ | -----')
  for (const [brand, s] of Object.entries(stats)) {
    console.log(`${brand.padEnd(13)} | ${String(s.processed).padEnd(11)} | ${String(s.upserted || 0).padEnd(6)} | ${s.errors.length}`)
  }
  console.log(`\nTotal: ${totalProcessed} processados, ${totalUpserted} salvos, ${totalErrors} erros`)
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1) })

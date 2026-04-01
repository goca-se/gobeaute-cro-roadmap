// Estado inicial pré-populado conforme metodologia vigente
// Todos os requisitos não listados aqui são inicializados como 'pending'
export const INITIAL_STATUSES = {
  apice: {
    // Fase 1 — Rastreamento
    ga4: 'in_progress',
    ga4_events: 'in_progress',
    clarity: 'done',
    clarity_sessions: 'done',
    metabase: 'in_progress',
    // Fase 1 — Performance
    cwv: 'in_progress',
    responsive: 'in_progress',
    bugs_audit: 'in_progress',
    // Fase 2 — Produto
    pdps_fold: 'in_progress',
    descriptions: 'in_progress',
    product_cards: 'in_progress',
    // Fase 2 — Navegação
    internal_search: 'in_progress',
    plp_filters: 'in_progress',
    collection_banners: 'in_progress',
    sticky_ctas: 'in_progress',
  },
  barbours: {
    // Fase 1 — Rastreamento
    ga4: 'in_progress',
    clarity: 'done',
    clarity_sessions: 'done',
    // Fase 1 — Performance
    cwv: 'in_progress',
    responsive: 'in_progress',
    bugs_audit: 'done',
    // Fase 2 — Produto
    pdps_fold: 'in_progress',
    // Fase 2 — Valor
    upsells: 'in_progress',
    // Fase 2 — Navegação
    sticky_ctas: 'in_progress',
  },
  lescent: {
    // Fase 1 — Rastreamento
    clarity: 'done',
    clarity_sessions: 'in_progress',
  },
  // rituaria, kokeshi, aua, bysamia: todos 'pending' por padrão
}

import { useState, useEffect } from 'react'
import { useABTestData, hasEnoughData } from '../hooks/useABTestData'
import { isConfigured } from '../lib/supabase'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatPct(val) {
  if (val === null || val === undefined) return '—'
  const sign = val > 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}%`
}

function formatCurrency(val) {
  if (val === null || val === undefined) return '—'
  return `R$${val.toFixed(2)}`
}

const STATUS_COLORS = {
  running: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Em andamento' },
  done: { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'Finalizado' },
  paused: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Pausado' },
  draft: { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', label: 'Rascunho' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 500, color: cfg.color,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function WinnerBadge({ test }) {
  if (test.status !== 'done') return null
  if (!hasEnoughData(test)) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px',
        background: '#FFFBEB', border: '1px solid #FDE68A',
        fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 500, color: '#D97706',
      }}>
        Dados insuficientes
      </span>
    )
  }
  if (test.is_winner) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px',
        background: '#ECFDF5', border: '1px solid #A7F3D0',
        fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 600, color: '#059669',
      }}>
        Vencedor: {test.winner_variation_name || 'Variante'}
      </span>
    )
  }
  if (test.statistical_status === 'Significant') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px',
        background: '#FEF2F2', border: '1px solid #FECACA',
        fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 500, color: '#DC2626',
      }}>
        Controle venceu
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px',
      background: '#F9FAFB', border: '1px solid #E5E7EB',
      fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 500, color: '#6B7280',
    }}>
      Inconclusivo
    </span>
  )
}

function LiftValue({ value, suffix = '%' }) {
  if (value === null || value === undefined) return <span style={{ color: '#A8A29E' }}>—</span>
  const isPositive = value > 0
  const isNeutral = value === 0
  const color = isPositive ? '#059669' : isNeutral ? '#6B7280' : '#DC2626'
  const sign = isPositive ? '+' : ''
  return (
    <span style={{ color, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
      {sign}{value.toFixed(2)}{suffix}
    </span>
  )
}

function SummaryCard({ value, label, sublabel, color, bg }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px',
      padding: '18px 20px', flex: '1 1 0', minWidth: '140px',
    }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 400, color, lineHeight: 1, letterSpacing: '-0.5px' }}>
        {value}
      </div>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C', marginTop: '4px' }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', marginTop: '2px' }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}

function SyncButton({ syncState, onSync }) {
  const isDisabled = syncState === 'syncing'
  const labels = { idle: 'Atualizar', syncing: 'Atualizando...', success: 'Atualizado!', error: 'Erro' }
  const colors = { idle: '#1D9E75', syncing: '#D97706', success: '#059669', error: '#DC2626' }

  return (
    <button
      onClick={onSync}
      disabled={isDisabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 14px', borderRadius: '8px',
        background: 'white', border: `1px solid ${colors[syncState] || '#E7E2DA'}`,
        fontFamily: "'Outfit', sans-serif", fontSize: '12px', fontWeight: 500,
        color: colors[syncState] || '#44403C',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.7 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{
        display: 'inline-block',
        animation: syncState === 'syncing' ? 'spin 1s linear infinite' : 'none',
        fontSize: '14px',
      }}>
        {syncState === 'success' ? '\u2713' : syncState === 'error' ? '\u2717' : '\u21BB'}
      </span>
      {labels[syncState] || 'Atualizar'}
    </button>
  )
}

function TestCard({ test, brandName, notes, onToggleNotes, isExpanded, onAddNote }) {
  const [noteText, setNoteText] = useState('')

  return (
    <div style={{
      background: 'white', border: '1px solid #E7E2DA', borderRadius: '10px',
      overflow: 'hidden', transition: 'box-shadow 0.2s ease',
    }}>
      <div style={{ padding: '16px 20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 600, color: '#1C1917', lineHeight: 1.4 }}>
              {test.name || 'Sem nome'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C' }}>
                {brandName}
              </span>
              <span style={{ color: '#D6D3D1' }}>|</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C' }}>
                {test.status === 'done' ? `Fim: ${formatDate(test.finished_at)}` : `Início: ${formatDate(test.started_at)}`}
              </span>
              {test.traffic_percentage && (
                <>
                  <span style={{ color: '#D6D3D1' }}>|</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C' }}>
                    Tráfego: {test.traffic_percentage}%
                  </span>
                </>
              )}
              {test.type && (
                <>
                  <span style={{ color: '#D6D3D1' }}>|</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', textTransform: 'uppercase' }}>
                    {test.type}
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
            <StatusBadge status={test.status} />
            <WinnerBadge test={test} />
          </div>
        </div>

        {/* Metrics row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px', marginTop: '12px',
        }}>
          <MetricCell label="CR" control={test.control_cr} variant={test.variant_cr} lift={test.lift_cr_pct} suffix="%" />
          <MetricCell label="RPV" control={test.control_rpv} variant={test.variant_rpv} lift={test.lift_rpv_pct} prefix="R$" />
          <MetricCell label="AOV" control={test.control_aov} variant={test.variant_aov} lift={test.lift_aov_pct} prefix="R$" />
          <MetricCell
            label="Add to Cart"
            control={test.control_add_to_cart_rate}
            variant={test.variant_add_to_cart_rate}
            lift={test.control_add_to_cart_rate && test.variant_add_to_cart_rate
              ? ((test.variant_add_to_cart_rate - test.control_add_to_cart_rate) / test.control_add_to_cart_rate) * 100
              : null}
            suffix="%"
          />
          {test.statistical_status && (
            <div style={{ padding: '8px 12px', background: '#FAFAF9', borderRadius: '8px', border: '1px solid #F5F0E8' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Significância
              </div>
              <div style={{
                fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: 600,
                color: test.statistical_status === 'Significant' ? '#059669' : '#D97706',
              }}>
                {test.statistical_status === 'Significant' ? 'Significativo' : test.statistical_status}
              </div>
            </div>
          )}
        </div>

        {/* Notes toggle */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onToggleNotes(test.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C',
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 0',
            }}
          >
            <span style={{ fontSize: '14px' }}>{isExpanded ? '\u25B4' : '\u25BE'}</span>
            Anotações ({notes.length})
          </button>
        </div>
      </div>

      {/* Notes panel */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid #F0EDE8', padding: '14px 20px', background: '#FAFAF9' }}>
          {notes.map(note => (
            <div key={note.id} style={{ marginBottom: '10px', padding: '10px 12px', background: 'white', borderRadius: '8px', border: '1px solid #E7E2DA' }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#44403C', lineHeight: 1.5 }}>
                {note.content}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                {(note.tags || []).map(tag => (
                  <span key={tag} style={{
                    padding: '2px 8px', borderRadius: '4px', background: '#F0EDE8',
                    fontFamily: "'Outfit', sans-serif", fontSize: '10px', color: '#78716C',
                  }}>
                    {tag}
                  </span>
                ))}
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', color: '#A8A29E', marginLeft: 'auto' }}>
                  {formatDateTime(note.created_at)}
                </span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: notes.length > 0 ? '8px' : 0 }}>
            <input
              type="text"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && noteText.trim()) {
                  onAddNote(test.id, test.brand_id, noteText.trim())
                  setNoteText('')
                }
              }}
              placeholder="Adicionar anotação..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '8px',
                border: '1px solid #E7E2DA', background: 'white',
                fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#44403C',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                if (noteText.trim()) {
                  onAddNote(test.id, test.brand_id, noteText.trim())
                  setNoteText('')
                }
              }}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                background: '#1D9E75', border: 'none', color: 'white',
                fontFamily: "'Outfit', sans-serif", fontSize: '12px', fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCell({ label, control, variant, lift, prefix = '', suffix = '' }) {
  return (
    <div style={{ padding: '8px 12px', background: '#FAFAF9', borderRadius: '8px', border: '1px solid #F5F0E8' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#44403C' }}>
        {control !== null && control !== undefined ? `${prefix}${control.toFixed(2)}${suffix}` : '—'}
        <span style={{ color: '#A8A29E', margin: '0 4px' }}>&rarr;</span>
        {variant !== null && variant !== undefined ? `${prefix}${variant.toFixed(2)}${suffix}` : '—'}
      </div>
      <div style={{ marginTop: '2px' }}>
        <LiftValue value={lift} suffix="%" />
      </div>
    </div>
  )
}

const CARDS_VISIBILITY_KEY = 'gobeaute_ab_metric_cards'
const DEFAULT_VISIBILITY = { rpv: true, rpvDelta: true, cr: true, aov: true, atcRate: true, winRate: true, avgDuration: true }

function useCardVisibility() {
  const [visibleCards, setVisibleCards] = useState(() => {
    try {
      const stored = localStorage.getItem(CARDS_VISIBILITY_KEY)
      return stored ? { ...DEFAULT_VISIBILITY, ...JSON.parse(stored) } : DEFAULT_VISIBILITY
    } catch {
      return DEFAULT_VISIBILITY
    }
  })

  function toggleCard(key) {
    setVisibleCards(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem(CARDS_VISIBILITY_KEY, JSON.stringify(next))
      return next
    })
  }

  return { visibleCards, toggleCard }
}

function ConsolidatedMetricCard({ label, value, sublabel, visible, onToggle }) {
  return (
    <div style={{
      background: visible ? 'white' : '#FAFAF9',
      border: `1px solid ${visible ? '#E7E2DA' : '#F0EDE8'}`,
      borderRadius: '10px',
      padding: visible ? '14px 16px' : '10px 16px',
      flex: '1 1 0', minWidth: '130px',
      position: 'relative',
      transition: 'all 0.2s ease',
      opacity: visible ? 1 : 0.6,
    }}>
      <button
        onClick={onToggle}
        title={visible ? 'Ocultar' : 'Exibir'}
        style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px', color: '#C7C3BD', fontSize: '12px',
          lineHeight: 1,
        }}
      >
        {visible ? '👁' : '👁\u0338'}
      </button>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        {label}
      </div>
      {visible ? (
        <>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 400, lineHeight: 1 }}>
            {value}
          </div>
          {sublabel && (
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', color: '#A8A29E', marginTop: '4px' }}>
              {sublabel}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#C7C3BD' }}>—</div>
      )}
    </div>
  )
}

function ConsolidatedMetricsRow({ metrics, visibleCards, onToggleCard }) {
  function liftColor(v) { return v > 0 ? '#059669' : v < 0 ? '#DC2626' : '#6B7280' }
  function liftLabel(v) {
    if (v === null || v === undefined) return '—'
    const sign = v > 0 ? '+' : ''
    return <span style={{ color: liftColor(v) }}>{sign}{v.toFixed(2)}%</span>
  }

  function rpvDeltaLabel(v, count) {
    if (count === 0) return <span style={{ color: '#A8A29E' }}>—</span>
    const sign = v > 0 ? '+' : ''
    const color = v > 0 ? '#059669' : v < 0 ? '#DC2626' : '#6B7280'
    return <span style={{ color }}>R$ {sign}{v.toFixed(2)}</span>
  }

  const cards = [
    {
      key: 'rpv',
      label: 'RPV (lift)',
      value: liftLabel(metrics.rpv.lift),
      sublabel: metrics.rpv.count > 0 ? `${metrics.rpv.count} testes` : 'Dados insuficientes',
    },
    {
      key: 'rpvDelta',
      label: 'Incremento RPV (R$)',
      value: rpvDeltaLabel(metrics.rpvDelta.value, metrics.rpvDelta.count),
      sublabel: metrics.rpvDelta.count > 0 ? `${metrics.rpvDelta.count} testes` : 'Sem dados',
    },
    {
      key: 'cr',
      label: 'CR (lift)',
      value: liftLabel(metrics.cr.lift),
      sublabel: metrics.cr.count > 0 ? `${metrics.cr.count} testes` : 'Dados insuficientes',
    },
    {
      key: 'aov',
      label: 'AOV (lift)',
      value: liftLabel(metrics.aov.lift),
      sublabel: metrics.aov.count > 0 ? `${metrics.aov.count} testes` : 'Dados insuficientes',
    },
    {
      key: 'atcRate',
      label: 'Add to Cart (lift)',
      value: liftLabel(metrics.atcRate.lift),
      sublabel: metrics.atcRate.count > 0 ? `${metrics.atcRate.count} testes` : 'Dados insuficientes',
    },
    {
      key: 'avgDuration',
      label: 'Duração média',
      value: metrics.avgDuration.days !== null ? <span style={{ color: '#44403C' }}>{Math.round(metrics.avgDuration.days)}d</span> : '—',
      sublabel: metrics.avgDuration.count > 0 ? `${metrics.avgDuration.count} testes finalizados` : 'Nenhum finalizado',
    },
  ]

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#C7C3BD', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        Métricas consolidadas
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {cards.map(card => (
          <ConsolidatedMetricCard
            key={card.key}
            label={card.label}
            value={card.value}
            sublabel={card.sublabel}
            visible={visibleCards[card.key]}
            onToggle={() => onToggleCard(card.key)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterBar({ filters, setFilters, sortBy, setSortBy }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      padding: '12px 0',
    }}>
      {/* Winner filter — first, most relevant */}
      <select
        value={filters.winner || ''}
        onChange={e => setFilters(prev => ({ ...prev, winner: e.target.value || null }))}
        style={{
          padding: '6px 12px', borderRadius: '8px', border: '1px solid #E7E2DA',
          background: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '12px',
          color: '#44403C', cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="">Todos os resultados</option>
        <option value="winner">Vencedor</option>
        <option value="loser">Controle venceu</option>
        <option value="inconclusive">Inconclusivo</option>
      </select>

      {/* Status filter */}
      <select
        value={filters.status || ''}
        onChange={e => setFilters(prev => ({ ...prev, status: e.target.value || null }))}
        style={{
          padding: '6px 12px', borderRadius: '8px', border: '1px solid #E7E2DA',
          background: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '12px',
          color: '#44403C', cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="">Todos os status</option>
        <option value="running">Em andamento</option>
        <option value="done">Finalizado</option>
        <option value="paused">Pausado</option>
        <option value="draft">Rascunho</option>
      </select>

      {/* Date range presets */}
      <select
        value={filters.dateRange?.preset || ''}
        onChange={e => {
          const val = e.target.value
          if (!val) {
            setFilters(prev => ({ ...prev, dateRange: null }))
            return
          }
          const now = new Date()
          if (val === '7d') {
            const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
            setFilters(prev => ({ ...prev, dateRange: { preset: '7d', start, end: null } }))
          } else if (val === '30d') {
            const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
            setFilters(prev => ({ ...prev, dateRange: { preset: '30d', start, end: null } }))
          } else if (val === '90d') {
            const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
            setFilters(prev => ({ ...prev, dateRange: { preset: '90d', start, end: null } }))
          } else if (val === 'current_month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            setFilters(prev => ({ ...prev, dateRange: { preset: 'current_month', start, end: null } }))
          } else if (val === 'last_month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString()
            setFilters(prev => ({ ...prev, dateRange: { preset: 'last_month', start, end } }))
          } else if (val === 'custom') {
            setFilters(prev => ({ ...prev, dateRange: { preset: 'custom', start: null, end: null } }))
          }
        }}
        style={{
          padding: '6px 12px', borderRadius: '8px', border: '1px solid #E7E2DA',
          background: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '12px',
          color: '#44403C', cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="">Todas as datas</option>
        <option value="7d">Últimos 7 dias</option>
        <option value="30d">Últimos 30 dias</option>
        <option value="90d">Últimos 90 dias</option>
        <option value="current_month">Mês atual</option>
        <option value="last_month">Mês passado</option>
        <option value="custom">Personalizado</option>
      </select>

      {/* Custom date range inputs */}
      {filters.dateRange?.preset === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="date"
            value={filters.dateRange?.start || ''}
            onChange={e => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value || null } }))}
            style={{
              padding: '5px 10px', borderRadius: '8px', border: '1px solid #E7E2DA',
              background: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '12px',
              color: '#44403C', outline: 'none',
            }}
          />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#A8A29E' }}>até</span>
          <input
            type="date"
            value={filters.dateRange?.end || ''}
            onChange={e => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value || null } }))}
            style={{
              padding: '5px 10px', borderRadius: '8px', border: '1px solid #E7E2DA',
              background: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '12px',
              color: '#44403C', outline: 'none',
            }}
          />
        </div>
      )}

      {/* Sort */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E' }}>Ordenar:</span>
        {['date', 'rpv', 'cr', 'aov'].map(field => {
          const isActive = sortBy.field === field
          const labels = { date: 'Data', rpv: 'RPV', cr: 'CR', aov: 'AOV' }
          return (
            <button
              key={field}
              onClick={() => {
                if (isActive) {
                  setSortBy({ field, direction: sortBy.direction === 'desc' ? 'asc' : 'desc' })
                } else {
                  setSortBy({ field, direction: 'desc' })
                }
              }}
              style={{
                padding: '4px 10px', borderRadius: '6px',
                border: `1px solid ${isActive ? '#1D9E75' : '#E7E2DA'}`,
                background: isActive ? '#ECFDF5' : 'white',
                fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: isActive ? 600 : 400,
                color: isActive ? '#059669' : '#78716C',
                cursor: 'pointer',
              }}
            >
              {labels[field]} {isActive ? (sortBy.direction === 'desc' ? '\u2193' : '\u2191') : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ABTestingView() {
  const {
    tests, loading, summary, brandSummary, globalLifts, consolidatedMetrics,
    filters, setFilters, sortBy, setSortBy,
    addNote, getTestNotes,
    triggerSync, syncState, lastSynced,
    BRANDS_MAP, BRAND_IDS,
  } = useABTestData()

  const { visibleCards, toggleCard } = useCardVisibility()
  const [expandedNotes, setExpandedNotes] = useState(new Set())
  const [activeTab, setActiveTab] = useState(null) // null = Geral

  // When tab changes, update brand filter
  function handleTabChange(brandId) {
    setActiveTab(brandId)
    setFilters(prev => ({ ...prev, brandId }))
  }

  function toggleNotes(testId) {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(testId)) next.delete(testId)
      else next.add(testId)
      return next
    })
  }

  if (!isConfigured) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', color: '#44403C', marginBottom: '12px' }}>
          Testes A/B
        </div>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#A8A29E' }}>
          Esta funcionalidade requer Supabase configurado.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2.5px solid #E7E2DA', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  const tabs = [
    { id: null, label: 'Geral', count: summary.totalTests },
    ...BRAND_IDS.map(id => ({
      id,
      label: BRANDS_MAP[id],
      count: brandSummary[id]?.total || 0,
    })),
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 400, color: '#1C1917', margin: 0, letterSpacing: '-0.5px' }}>
            Testes A/B
          </h1>
          {lastSynced && (
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', marginTop: '4px' }}>
              Última atualização: {formatDateTime(lastSynced)}
            </div>
          )}
        </div>
        <SyncButton syncState={syncState} onSync={triggerSync} />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '2px', borderBottom: '1px solid #E7E2DA',
        marginBottom: '20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id ?? 'geral'}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '10px 16px', background: 'none',
                border: 'none', borderBottom: isActive ? '2px solid #1D9E75' : '2px solid transparent',
                fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1D9E75' : '#78716C',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: '6px', padding: '1px 6px', borderRadius: '10px',
                background: isActive ? '#ECFDF5' : '#F5F0E8',
                fontSize: '10px', fontWeight: 600,
                color: isActive ? '#059669' : '#A8A29E',
              }}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <SummaryCard value={summary.totalTests} label="Total de testes" color="#1C1917" bg="#F5F0E8" />
        <SummaryCard value={summary.running} label="Em andamento" color="#059669" bg="#ECFDF5" />
        <SummaryCard value={summary.done} label="Finalizados" color="#7C3AED" bg="#F5F3FF" />
        <SummaryCard
          value={globalLifts.count > 0 ? `${globalLifts.count} testes` : '—'}
          label="Testes vencedores"
          sublabel={globalLifts.count > 0 ? `CR ${formatPct(globalLifts.cr)} · RPV ${formatPct(globalLifts.rpv)} · AOV ${formatPct(globalLifts.aov)}` : 'Nenhum teste vencedor'}
          color="#1D9E75"
          bg="#ECFDF5"
        />
      </div>

      {/* Consolidated metrics row */}
      <ConsolidatedMetricsRow metrics={consolidatedMetrics} visibleCards={visibleCards} onToggleCard={toggleCard} />

      {/* Filters */}
      <FilterBar filters={filters} setFilters={setFilters} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Test list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        {tests.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px',
          }}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#A8A29E' }}>
              {summary.totalTests === 0 ? 'Nenhum teste encontrado. Execute a sincronização para carregar dados do Elevate.' : 'Nenhum teste corresponde aos filtros selecionados.'}
            </div>
          </div>
        ) : (
          tests.map(test => (
            <TestCard
              key={`${test.id}-${test.brand_id}`}
              test={test}
              brandName={BRANDS_MAP[test.brand_id] || test.brand_id}
              notes={getTestNotes(test.id, test.brand_id)}
              isExpanded={expandedNotes.has(test.id)}
              onToggleNotes={toggleNotes}
              onAddNote={addNote}
            />
          ))
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

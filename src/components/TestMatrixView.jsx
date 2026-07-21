import { useState } from 'react'
import { useABTestMatrix } from '../hooks/useABTestMatrix'
import { isConfigured } from '../lib/supabase'
import { AREAS } from '../data/abTestFamilies'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatLift(v) {
  if (v === null || v === undefined) return null
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

const VERDICT_CFG = {
  winner: { label: 'Vencedor', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', dot: '#059669' },
  loser: { label: 'Controle venceu', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626' },
  inconclusive: { label: 'Inconclusivo', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', dot: '#9CA3AF' },
  running: { label: 'Em teste', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' },
}

const AREA_COLORS = {
  home: '#7C3AED', pdp: '#1D9E75', cart: '#D97706', collection: '#2563EB',
  tema: '#DB2777', feat: '#0891B2', preco: '#CA8A04', outros: '#78716C',
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
        cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.7 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ display: 'inline-block', animation: syncState === 'syncing' ? 'spin 1s linear infinite' : 'none', fontSize: '14px' }}>
        {syncState === 'success' ? '✓' : syncState === 'error' ? '✗' : '↻'}
      </span>
      {labels[syncState] || 'Atualizar'}
    </button>
  )
}

function AreaBadge({ area }) {
  const color = AREA_COLORS[area] || '#78716C'
  return (
    <span style={{
      padding: '1px 7px', borderRadius: '4px', background: `${color}14`,
      fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 600, color,
      textTransform: 'uppercase', letterSpacing: '0.3px',
    }}>
      {AREAS[area] || area}
    </span>
  )
}

function Seal({ label, color, bg, title }) {
  return (
    <span title={title} style={{
      padding: '1px 7px', borderRadius: '20px', background: bg,
      fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 600, color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function MatrixCell({ cell, brandName, familyLabel }) {
  if (!cell) {
    return (
      <td style={{ textAlign: 'center', padding: '10px 8px', borderBottom: '1px solid #F0EDE8', color: '#D6D3D1', fontFamily: "'Outfit', sans-serif", fontSize: '13px' }}>
        —
      </td>
    )
  }
  const cfg = VERDICT_CFG[cell.verdict] || VERDICT_CFG.inconclusive
  const lift = formatLift(cell.liftRpv)
  const title = `${familyLabel} · ${brandName}\n${cell.test.name}\n${cfg.label}${lift ? ` · RPV ${lift}` : ''}\n${cell.test.status === 'done' ? 'Fim' : 'Início'}: ${formatDate(cell.test.status === 'done' ? cell.test.finished_at : cell.test.started_at)}${cell.count > 1 ? `\n(+${cell.count - 1} outro(s) teste(s) nesta marca)` : ''}`
  return (
    <td style={{ padding: '6px', borderBottom: '1px solid #F0EDE8', verticalAlign: 'top' }}>
      <div title={title} style={{
        display: 'flex', flexDirection: 'column', gap: '3px',
        padding: '7px 9px', borderRadius: '8px',
        background: cfg.bg, border: `1px solid ${cfg.border}`, cursor: 'default',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 600, color: cfg.color, lineHeight: 1.2 }}>
            {cfg.label}
          </span>
          {cell.count > 1 && (
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', color: '#A8A29E', marginLeft: 'auto' }}>
              +{cell.count - 1}
            </span>
          )}
        </div>
        {lift && (
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: cell.liftRpv > 0 ? '#059669' : cell.liftRpv < 0 ? '#DC2626' : '#78716C' }}>
            RPV {lift}
          </span>
        )}
      </div>
    </td>
  )
}

function FilterBar({ filters, setFilters, areasPresent, brandsMap, brandIds }) {
  const selectStyle = {
    padding: '6px 12px', borderRadius: '8px', border: '1px solid #E7E2DA',
    background: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '12px',
    color: '#44403C', cursor: 'pointer', outline: 'none',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '12px 0' }}>
      <select value={filters.verdict || ''} onChange={e => setFilters(p => ({ ...p, verdict: e.target.value || null }))} style={selectStyle}>
        <option value="">Todos os resultados</option>
        <option value="winner">Vencedor</option>
        <option value="loser">Controle venceu</option>
        <option value="inconclusive">Inconclusivo</option>
        <option value="running">Em teste</option>
      </select>

      <select value={filters.brandId || ''} onChange={e => setFilters(p => ({ ...p, brandId: e.target.value || null }))} style={selectStyle}>
        <option value="">Todas as marcas</option>
        {brandIds.map(id => <option key={id} value={id}>{brandsMap[id]}</option>)}
      </select>

      <select value={filters.area || ''} onChange={e => setFilters(p => ({ ...p, area: e.target.value || null }))} style={selectStyle}>
        <option value="">Todas as áreas</option>
        {areasPresent.map(a => <option key={a} value={a}>{AREAS[a] || a}</option>)}
      </select>

      {/* Escopo: todos / escalado / exclusivo */}
      <div style={{ display: 'flex', gap: '2px', background: '#F5F0E8', borderRadius: '8px', padding: '2px' }}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'escalado', label: 'Escalados' },
          { key: 'exclusivo', label: 'Exclusivos' },
        ].map(opt => {
          const active = filters.scope === opt.key
          return (
            <button key={opt.key} onClick={() => setFilters(p => ({ ...p, scope: opt.key }))} style={{
              padding: '5px 12px', borderRadius: '6px', border: 'none',
              background: active ? 'white' : 'transparent',
              fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: active ? 600 : 500,
              color: active ? '#1D9E75' : '#78716C', cursor: 'pointer',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}>
              {opt.label}
            </button>
          )
        })}
      </div>

      <input
        type="text"
        value={filters.search}
        onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
        placeholder="Buscar família ou teste..."
        style={{
          marginLeft: 'auto', flex: '0 1 240px', minWidth: '160px',
          padding: '6px 12px', borderRadius: '8px', border: '1px solid #E7E2DA',
          background: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '12px',
          color: '#44403C', outline: 'none',
        }}
      />
    </div>
  )
}

export default function TestMatrixView() {
  const {
    loading, rows, unclassified, stats, areasPresent,
    filters, setFilters, triggerSync, syncState, lastSynced,
    brandsMap, brandIds,
  } = useABTestMatrix()

  const [showUnclassified, setShowUnclassified] = useState(false)

  if (!isConfigured) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', color: '#44403C', marginBottom: '12px' }}>
          Matriz de Testes
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const stickyCol = {
    position: 'sticky', left: 0, zIndex: 1, background: 'white',
    minWidth: '230px', maxWidth: '260px',
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 400, color: '#1C1917', margin: 0, letterSpacing: '-0.5px' }}>
            Matriz de Testes
          </h1>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C', marginTop: '4px' }}>
            {stats.totalFamilies} famílias · {stats.escaladas} escaladas · {stats.validadas} validadas · cobertura média {(stats.coberturaMedia * 100).toFixed(0)}%
          </div>
          {lastSynced && (
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', marginTop: '2px' }}>
              Última atualização: {formatDateTime(lastSynced)}
            </div>
          )}
        </div>
        <SyncButton syncState={syncState} onSync={triggerSync} />
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
        {Object.entries(VERDICT_CFG).map(([k, cfg]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#78716C' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.dot }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Filtros */}
      <FilterBar filters={filters} setFilters={setFilters} areasPresent={areasPresent} brandsMap={brandsMap} brandIds={brandIds} />

      {/* Matriz */}
      {rows.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px' }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#A8A29E' }}>
            {stats.totalFamilies === 0 ? 'Nenhum teste encontrado. Execute a sincronização para carregar dados do Elevate.' : 'Nenhuma família corresponde aos filtros selecionados.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #E7E2DA', borderRadius: '12px', background: 'white' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '760px' }}>
            <thead>
              <tr>
                <th style={{ ...stickyCol, textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #E7E2DA', fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Família de teste
                </th>
                {brandIds.map(id => (
                  <th key={id} style={{
                    textAlign: 'center', padding: '12px 8px', borderBottom: '1px solid #E7E2DA',
                    fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, color: '#44403C',
                    minWidth: '130px',
                    opacity: filters.brandId && filters.brandId !== id ? 0.35 : 1,
                  }}>
                    {brandsMap[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td style={{ ...stickyCol, padding: '10px 14px', borderBottom: '1px solid #F0EDE8', borderRight: '1px solid #F0EDE8' }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1C1917', lineHeight: 1.35, marginBottom: '5px' }}>
                      {row.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <AreaBadge area={row.area} />
                      {row.isEscalada && <Seal label={`🚀 ${row.brandCount} marcas`} color="#7C3AED" bg="#F5F3FF" title="Escalada: rodou em 2+ marcas" />}
                      {row.isValidada && <Seal label="✓ Validada" color="#059669" bg="#ECFDF5" title="Validada: venceu em ao menos uma marca" />}
                    </div>
                  </td>
                  {brandIds.map(id => (
                    <MatrixCell key={id} cell={row.cells[id]} brandName={brandsMap[id]} familyLabel={row.label} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* A triar */}
      {unclassified.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowUnclassified(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600,
              color: '#78716C', padding: '4px 0',
            }}
          >
            <span style={{ fontSize: '14px' }}>{showUnclassified ? '▴' : '▾'}</span>
            A triar ({unclassified.length})
          </button>
          {showUnclassified && (
            <div style={{ marginTop: '8px', background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', padding: '14px 18px' }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#A8A29E', marginBottom: '10px' }}>
                Testes ainda não mapeados a uma família. Para agrupá-los, adicione uma família (ou keyword) em <code style={{ fontFamily: 'monospace', fontSize: '11px', background: '#F5F0E8', padding: '1px 5px', borderRadius: '4px' }}>src/data/abTestFamilies.js</code>.
              </div>
              {unclassified.map(t => (
                <div key={`${t.id}-${t.brand_id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderTop: '1px solid #F5F0E8' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 600, color: '#78716C', minWidth: '70px' }}>
                    {brandsMap[t.brand_id] || t.brand_id}
                  </span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#44403C' }}>
                    {t.name || 'Sem nome'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

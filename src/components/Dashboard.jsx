import { useState } from 'react'
import ProgressBar from './ProgressBar'
import { getGlobalStats, getBrandPhaseStats, getPhaseGlobalStats, getSectionStats, getPctColor, getPctBg } from '../utils/stats'
import { VISIBLE_BRANDS, PHASES } from '../data/phases'

function StatCard({ value, label, color, bg, icon }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 400, color, lineHeight: 1, letterSpacing: '-1px' }}>
          {value}
        </div>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C', marginTop: '3px' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

function getSectionGlobalStats(data, section) {
  let done = 0, in_progress = 0, total = 0
  VISIBLE_BRANDS.forEach(brand => {
    const s = getSectionStats(data, brand.id, section)
    done += s.done
    in_progress += s.in_progress
    total += s.total
  })
  const pending = total - done - in_progress
  return { done, in_progress, pending, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

function PhaseAccordion({ phase, data }) {
  const [open, setOpen] = useState(false)
  const stats = getPhaseGlobalStats(data, phase.id)

  return (
    <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '10px', borderLeft: `3px solid ${phase.color}`, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: phase.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Fase {phase.number}</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#1C1917', fontWeight: 500 }}>{phase.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {stats.done} finalizados · {stats.in_progress} em andamento · {stats.pending} pendentes
            </span>
            <span style={{
              fontSize: '12px', color: '#9CA3AF', display: 'inline-block',
              transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease'
            }}>▾</span>
          </div>
        </div>
        <ProgressBar pct={stats.pct} color={phase.color} height={7} showPct />
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #F0EDE8', padding: '16px 20px', background: phase.colorLight }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#57534E', marginBottom: '16px', lineHeight: 1.65 }}>
            {phase.description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {phase.sections.map(section => {
              const ss = getSectionGlobalStats(data, section)
              return (
                <div key={section.id} style={{ background: 'white', borderRadius: '8px', padding: '12px 16px', border: '1px solid #E7E2DA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1C1917' }}>{section.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        {ss.done}/{ss.total} itens
                      </span>
                      <span style={{
                        fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 400,
                        color: ss.pct === 0 ? '#D1D5DB' : getPctColor(ss.pct), letterSpacing: '-0.3px'
                      }}>
                        {ss.pct}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar pct={ss.pct} color={ss.pct === 0 ? '#E5E7EB' : phase.color} height={5} showPct={false} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {section.requirements.map(req => (
                      <span key={req.id} style={{
                        fontSize: '10px', color: '#78716C', background: '#F5F4F2',
                        padding: '2px 7px', borderRadius: '4px', fontFamily: "'Outfit', sans-serif"
                      }}>
                        {req.label}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const TOTAL_WEEKS = 30

function CronogramaGeral() {
  return (
    <div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
        Cronograma geral
      </h2>
      <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', padding: '24px' }}>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#78716C', marginBottom: '20px', lineHeight: 1.6 }}>
          A metodologia CRO é sequencial e cumulativa — cada fase requer que a anterior esteja suficientemente concluída. Os prazos são estimativas baseadas em projetos similares e podem variar por marca e nível de maturidade digital.
        </p>

        {/* Gantt bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', height: '36px', borderRadius: '8px', overflow: 'hidden', gap: '2px' }}>
            {PHASES.map(phase => {
              const widthPct = ((phase.endWeek - phase.startWeek + 1) / TOTAL_WEEKS) * 100
              return (
                <div
                  key={phase.id}
                  style={{
                    width: `${widthPct}%`, background: phase.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: 'white', letterSpacing: '0.5px' }}>
                    Fase {phase.number}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Week labels */}
          <div style={{ display: 'flex', marginTop: '4px' }}>
            {PHASES.map(phase => {
              const widthPct = ((phase.endWeek - phase.startWeek + 1) / TOTAL_WEEKS) * 100
              return (
                <div key={phase.id} style={{ width: `${widthPct}%`, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', color: '#A8A29E' }}>
                    sem. {phase.startWeek}–{phase.endWeek}{phase.id === 'phase3' ? '+' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {PHASES.map((phase, i) => (
            <div key={phase.id} style={{ border: `1px solid ${phase.colorMuted}`, borderRadius: '10px', padding: '16px', background: phase.colorLight, position: 'relative' }}>
              {i < PHASES.length - 1 && (
                <div style={{
                  position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 1, width: '16px', height: '16px', background: 'white', border: '1px solid #E7E2DA',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: '#A8A29E'
                }}>→</div>
              )}
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: phase.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Fase {phase.number} · {phase.duration}
                </span>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1C1917', marginTop: '3px' }}>
                  {phase.name}
                </div>
              </div>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#57534E', lineHeight: 1.6, marginBottom: '12px' }}>
                {phase.tagline}
              </p>
              <div style={{ borderTop: `1px solid ${phase.colorMuted}`, paddingTop: '10px' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '9px', fontWeight: 700, color: phase.color, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '3px' }}>
                  Entrada
                </div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#78716C' }}>
                  {phase.entry}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ data, onNavigateBrandPhase }) {
  const global = getGlobalStats(data)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 400, color: '#1C1917', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Visão Geral
        </h1>
        <p style={{ color: '#78716C', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}>
          Progresso consolidado · {VISIBLE_BRANDS.length} marcas
        </p>
      </div>

      {/* Phase accordions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Progresso por fase
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PHASES.map(phase => (
            <PhaseAccordion key={phase.id} phase={phase} data={data} />
          ))}
        </div>
      </div>

      {/* Brand × Phase matrix */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Conclusão por marca e fase
        </h2>
        <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0EDE8' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.6px', width: '200px' }}>
                  Marca
                </th>
                {PHASES.map(phase => (
                  <th key={phase.id} style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', color: phase.color, textTransform: 'uppercase' }}>
                    Fase {phase.number}
                    <div style={{ fontSize: '10px', fontWeight: 400, color: '#A8A29E', textTransform: 'none', letterSpacing: 0, marginTop: '1px' }}>
                      {phase.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VISIBLE_BRANDS.map((brand, i) => {
                const bs = data.brandSettings?.[brand.id] || {}
                const logoUrl = bs.logoUrl
                const displayName = bs.customName || brand.name
                const segment = bs.customSegment || brand.segment
                return (
                <tr key={brand.id} style={{ borderBottom: i < VISIBLE_BRANDS.length - 1 ? '1px solid #F0EDE8' : 'none' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {logoUrl
                        ? <img src={logoUrl} alt={displayName} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'contain', border: '1px solid #E7E2DA', background: 'white', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
                        : <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#F0FDF4', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 600, color: '#1D9E75', flexShrink: 0 }}>{brand.initials}</div>
                      }
                      <div>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1C1917' }}>{displayName}</div>
                        <div style={{ fontSize: '11px', color: '#A8A29E', marginTop: '1px' }}>{segment}</div>
                      </div>
                    </div>
                  </td>
                  {PHASES.map(phase => {
                    const stats = getBrandPhaseStats(data, brand.id, phase.id)
                    const pctColor = getPctColor(stats.pct)
                    const pctBg = getPctBg(stats.pct)
                    return (
                      <td key={phase.id} style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => onNavigateBrandPhase(brand.id, phase.id)}
                          style={{ background: stats.pct === 0 ? '#F9FAFB' : pctBg, border: `1px solid ${stats.pct === 0 ? '#E5E7EB' : pctBg}`, borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', width: '100%', minWidth: '100px' }}
                        >
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 400, color: stats.pct === 0 ? '#D1D5DB' : pctColor, lineHeight: 1, letterSpacing: '-0.5px' }}>
                            {stats.pct}%
                          </div>
                          <div style={{ marginTop: '6px' }}>
                            <ProgressBar pct={stats.pct} color={stats.pct === 0 ? '#E5E7EB' : pctColor} height={3} showPct={false} />
                          </div>
                          <div style={{ fontSize: '10px', color: '#A8A29E', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>
                            {stats.done}/{stats.total}
                          </div>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '11px', color: '#A8A29E', marginTop: '8px', fontFamily: "'Outfit', sans-serif" }}>
          Clique em qualquer célula para ver o detalhamento.
        </p>
      </div>

      {/* Cronograma geral */}
      <div style={{ marginBottom: '32px' }}>
        <CronogramaGeral />
      </div>

      {/* Global stats — moved to bottom */}
      <div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Resumo de tarefas
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <StatCard value={global.done} label="finalizados" color="#16A34A" bg="#F0FDF4" icon="✓" />
          <StatCard value={global.in_progress} label="em andamento" color="#D97706" bg="#FFFBEB" icon="◎" />
          <StatCard value={global.pending} label="pendentes" color="#9CA3AF" bg="#F9FAFB" icon="○" />
        </div>
      </div>
    </div>
  )
}

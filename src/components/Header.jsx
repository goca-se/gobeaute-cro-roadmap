import { useState } from 'react'
import { isConfigured } from '../lib/supabase'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const SYNC_CONFIG = {
  local:    { color: '#A8A29E', label: 'Local', pulse: false },
  loading:  { color: '#D97706', label: 'Carregando...', pulse: true },
  syncing:  { color: '#2563EB', label: 'Sincronizando...', pulse: true },
  synced:   { color: '#16A34A', label: 'Sincronizado', pulse: false },
  error:    { color: '#DC2626', label: 'Erro de sincronização', pulse: false },
}

function SyncIndicator({ syncState, lastSynced }) {
  const cfg = SYNC_CONFIG[syncState] || SYNC_CONFIG.local
  const tooltip = lastSynced
    ? `Última sincronização: ${formatDate(lastSynced.toISOString())}`
    : cfg.label

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }} title={tooltip}>
      <div style={{ position: 'relative', width: '7px', height: '7px', flexShrink: 0 }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.color }} />
        {cfg.pulse && (
          <div style={{
            position: 'absolute', inset: '-3px', borderRadius: '50%',
            border: `1.5px solid ${cfg.color}`, opacity: 0.5,
            animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
          }} />
        )}
      </div>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', whiteSpace: 'nowrap' }}>
        {isConfigured ? cfg.label : 'Somente local'}
      </span>
    </div>
  )
}

const TABS = [
  { id: 'dashboard', label: 'Visão Geral' },
  { id: 'brand', label: 'Por Marca' },
  { id: 'matrix', label: 'Matriz de Progresso' },
  { id: 'analytics', label: 'Analítico' },
  { id: 'log', label: 'Histórico' },
  { id: 'settings', label: 'Configurações' },
]

function GroupLogo({ logoUrl, groupName }) {
  const [imgError, setImgError] = useState(false)
  const initials = (groupName || 'G')[0].toUpperCase()
  if (logoUrl && !imgError) {
    return (
      <img src={logoUrl} alt={groupName} onError={() => setImgError(true)}
        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #E7E2DA', background: 'white' }} />
    )
  }
  return (
    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #1D9E75 0%, #16845F 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '18px', color: 'white' }}>
      {initials}
    </div>
  )
}

export default function Header({ view, onNavigate, lastUpdated, syncState, lastSynced, appSettings }) {
  const groupName = appSettings?.groupName || 'Gobeaute'
  const logoUrl = appSettings?.logoUrl || ''

  return (
    <>
      <style>{`@keyframes ping { 0%{transform:scale(1);opacity:0.5} 75%,100%{transform:scale(2);opacity:0} }`}</style>
      <header style={{ background: 'white', borderBottom: '1px solid #E7E2DA', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '28px', height: '56px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <GroupLogo logoUrl={logoUrl} groupName={groupName} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: '16px', color: '#1C1917', letterSpacing: '-0.3px' }}>
              {groupName} <span style={{ color: '#1D9E75', fontWeight: 600 }}>CRO</span>
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => onNavigate(tab.id)}
                className={`nav-tab${view === tab.id ? ' active' : ''}`}
                style={{ padding: '6px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: view === tab.id ? 600 : 500, fontSize: '13px', color: view === tab.id ? '#1C1917' : '#78716C', borderRadius: '6px', letterSpacing: '0.1px' }}>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: sync + timestamp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <SyncIndicator syncState={syncState} lastSynced={lastSynced} />
            <div style={{ width: '1px', height: '16px', background: '#E7E2DA' }} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', whiteSpace: 'nowrap' }}>
              {formatDate(lastUpdated)}
            </span>
          </div>
        </div>
      </header>
    </>
  )
}

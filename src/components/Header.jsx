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
  { id: 'dashboard', label: 'Visão Geral',  mobileLabel: 'Visão', mobileIcon: '⊞' },
  { id: 'brand',     label: 'Por Marca',    mobileLabel: 'Marcas', mobileIcon: '◈' },
  { id: 'matrix',    label: 'Matriz',       mobileLabel: 'Matriz', mobileIcon: '▦' },
  { id: 'analytics', label: 'Analítico',    mobileLabel: 'Análise', mobileIcon: '◑' },
  { id: 'abtesting', label: 'Testes A/B',   mobileLabel: 'A/B',    mobileIcon: '⚗' },
  { id: 'log',       label: 'Histórico',    mobileLabel: 'Log',    mobileIcon: '◷' },
  { id: 'settings',  label: 'Configurações',mobileLabel: 'Config', mobileIcon: '⊙' },
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

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false)
  const avatarUrl = user?.user_metadata?.avatar_url
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '?'
  const initials = fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid #E7E2DA', borderRadius: '20px', padding: '4px 10px 4px 4px', cursor: 'pointer' }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #16845F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '11px', color: 'white' }}>
            {initials}
          </div>
        )}
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#44403C', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fullName}
        </span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'white', border: '1px solid #E7E2DA', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '180px', overflow: 'hidden', zIndex: 100 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #F5F0E8' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '13px', color: '#1C1917' }}>{fullName}</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', marginTop: '2px' }}>{user?.email}</div>
            </div>
            <button
              onClick={() => { setOpen(false); onSignOut() }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#78716C', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFF8F5'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.25 2.333H2.333A1.167 1.167 0 0 0 1.167 3.5v7a1.167 1.167 0 0 0 1.166 1.167H5.25M9.333 10.5 12.833 7l-3.5-3.5M12.833 7H5.25" stroke="#78716C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Header({ view, onNavigate, lastUpdated, syncState, lastSynced, appSettings, user, onSignOut }) {
  const groupName = appSettings?.groupName || 'Gobeaute'
  const logoUrl = appSettings?.logoUrl || ''

  return (
    <>
      <style>{`@keyframes ping { 0%{transform:scale(1);opacity:0.5} 75%,100%{transform:scale(2);opacity:0} }`}</style>
      <header style={{ background: 'white', borderBottom: '1px solid #E7E2DA', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="header-inner" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '28px', height: '56px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <GroupLogo logoUrl={logoUrl} groupName={groupName} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: '16px', color: '#1C1917', letterSpacing: '-0.3px' }}>
              {groupName} <span style={{ color: '#1D9E75', fontWeight: 600 }}>CRO</span>
            </span>
          </div>

          {/* Nav — hidden on mobile, replaced by bottom nav */}
          <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => onNavigate(tab.id)}
                className={`nav-tab${view === tab.id ? ' active' : ''}`}
                style={{ padding: '6px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: view === tab.id ? 600 : 500, fontSize: '13px', color: view === tab.id ? '#1C1917' : '#78716C', borderRadius: '6px', letterSpacing: '0.1px' }}>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: sync + timestamp + user */}
          <div className="header-meta" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <SyncIndicator syncState={syncState} lastSynced={lastSynced} />
            <div style={{ width: '1px', height: '16px', background: '#E7E2DA' }} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', whiteSpace: 'nowrap' }}>
              {formatDate(lastUpdated)}
            </span>
          </div>

          {/* User menu — always visible */}
          {user && onSignOut && (
            <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
              <UserMenu user={user} onSignOut={onSignOut} />
            </div>
          )}
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav" aria-label="Navegação principal">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`mobile-nav-item${view === tab.id ? ' active' : ''}`}
            aria-current={view === tab.id ? 'page' : undefined}
          >
            <span
              className="mobile-nav-icon"
              style={{ color: view === tab.id ? '#1D9E75' : '#A8A29E' }}
            >
              {tab.mobileIcon}
            </span>
            <span className="mobile-nav-label">{tab.mobileLabel}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

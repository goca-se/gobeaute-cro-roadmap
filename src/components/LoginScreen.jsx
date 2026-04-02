import { useState } from 'react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function GroupLogo({ logoUrl, groupName }) {
  const [imgError, setImgError] = useState(false)
  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={groupName}
        onError={() => setImgError(true)}
        style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'contain', border: '1px solid #E7E2DA', background: 'white', padding: '6px' }}
      />
    )
  }
  return (
    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #1D9E75 0%, #16845F 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(29,158,117,0.25)' }}>
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '26px', color: 'white' }}>
        {(groupName || 'G')[0].toUpperCase()}
      </span>
    </div>
  )
}

export default function LoginScreen({ onLogin, error, appSettings }) {
  const [loading, setLoading] = useState(false)
  const groupName = appSettings?.groupName || 'Gobeaute'
  const logoUrl = appSettings?.logoUrl || ''

  async function handleLogin() {
    setLoading(true)
    await onLogin()
    // Loading stays true — page will redirect
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div className="grain-overlay" />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px', padding: '24px' }}>

        {/* Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', maxWidth: '480px' }}>
          <GroupLogo logoUrl={logoUrl} groupName={groupName} />

          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '32px', color: '#1C1917', letterSpacing: '-0.8px', margin: 0, lineHeight: 1.1 }}>
              CRO Roadmap <span style={{ color: '#1D9E75' }}>{groupName}</span>
            </h1>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', color: '#78716C', margin: '12px 0 0', lineHeight: 1.6 }}>
              Acompanhe e evolua a maturidade de CRO<br />
              de cada site do grupo — fase a fase, tarefa a tarefa.
            </p>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E7E2DA', padding: '32px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5"/>
                <path d="M8 5v3.5M8 11h.01" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#DC2626', lineHeight: 1.4 }}>
                {error}
              </span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: loading ? '#F5F5F4' : 'white',
              border: '1px solid #E7E2DA',
              borderRadius: '10px',
              padding: '12px 20px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              color: loading ? '#A8A29E' : '#1C1917',
              width: '100%',
              transition: 'all 0.15s',
              boxShadow: loading ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = loading ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            {loading ? (
              <div style={{ width: '18px', height: '18px', border: '2px solid #E7E2DA', borderTopColor: '#A8A29E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Redirecionando...' : 'Entrar com Google'}
          </button>

          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#A8A29E', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            Apenas e-mails @gobeaute.com.br e @gocase.com têm acesso
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

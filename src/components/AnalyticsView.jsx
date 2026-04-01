import { useState, useEffect, useRef } from 'react'
import { generateEmbedUrl } from '../lib/metabase'

const REFRESH_INTERVAL = 9 * 60 * 1000 // 9 min — renova antes do JWT de 10 min expirar

export default function AnalyticsView({ appSettings }) {
  const mb = appSettings?.metabase || {}
  const { baseUrl, embedSecret, embedDashboardId } = mb

  const isConfigured = !!(baseUrl && embedSecret && embedDashboardId)

  const [iframeUrl, setIframeUrl] = useState(null)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  async function refreshUrl() {
    try {
      const url = await generateEmbedUrl(baseUrl, embedSecret, embedDashboardId)
      setIframeUrl(url)
      setError(null)
    } catch (e) {
      console.error('[Embed] JWT generation failed:', e)
      setError(e.message || 'Erro ao gerar token de incorporação')
    }
  }

  useEffect(() => {
    if (!isConfigured) { setIframeUrl(null); return }

    refreshUrl()

    timerRef.current = setInterval(refreshUrl, REFRESH_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [baseUrl, embedSecret, embedDashboardId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isConfigured) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#F5F4F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>
          📊
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 400, color: '#1C1917', marginBottom: '8px' }}>
          Analítico não configurado
        </h2>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#78716C', lineHeight: 1.65, marginBottom: '4px' }}>
          Configure a <strong>URL base</strong>, a <strong>chave secreta de embed</strong> e o <strong>ID do dashboard</strong> na aba Configurações → seção Metabase.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 400, color: '#DC2626', marginBottom: '8px' }}>
          Erro ao gerar token
        </h2>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#78716C', marginBottom: '16px' }}>{error}</p>
        <button onClick={refreshUrl}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E7E2DA', background: 'white', fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, color: '#57534E', cursor: 'pointer' }}>
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!iframeUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#A8A29E' }}>Carregando dashboard...</span>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      <iframe
        key={iframeUrl}
        src={iframeUrl}
        frameBorder="0"
        allowTransparency
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        title="Metabase Analytics"
      />
    </div>
  )
}

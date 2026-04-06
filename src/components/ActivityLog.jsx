import StatusBadge from './StatusBadge'

function formatTimestamp(iso) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function exportLogCSV(activityLog) {
  if (!activityLog.length) return
  const statusLabel = s => {
    const map = { done: 'Finalizado', in_progress: 'Em progresso', waiting_client: 'Esperando cliente', validating: 'Em validação', pending: 'Pendente' }
    return map[s] || s
  }
  const headers = ['Timestamp', 'Marca', 'Requisito', 'Status anterior', 'Novo status']
  const rows = activityLog.map(e => [
    new Date(e.timestamp).toLocaleString('pt-BR'),
    e.brandName,
    `"${e.reqLabel}"`,
    statusLabel(e.oldStatus),
    statusLabel(e.newStatus),
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gobeaute-cro-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ActivityLog({ activityLog }) {
  const entries = activityLog.slice(0, 50)

  return (
    <div className="page-pad-narrow">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 400, color: '#1C1917', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Histórico
          </h1>
          <p style={{ color: '#78716C', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}>
            Últimas {entries.length} alterações · {activityLog.length} no total
          </p>
        </div>
        <button
          onClick={() => exportLogCSV(activityLog)}
          disabled={!activityLog.length}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: activityLog.length ? 'white' : '#F9FAFB', border: '1px solid #E7E2DA', borderRadius: '8px', cursor: activityLog.length ? 'pointer' : 'not-allowed', fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, color: activityLog.length ? '#57534E' : '#A8A29E', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          CSV
        </button>
      </div>

      {!entries.length ? (
        <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#78716C' }}>
            Nenhuma alteração registrada ainda.<br />
            Atualize o status de um requisito para começar.
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Desktop column header */}
          <div className="log-grid-header" style={{ display: 'grid', gridTemplateColumns: '150px 100px 1fr 130px 130px', padding: '10px 20px', background: '#FAFAF8', borderBottom: '1px solid #F0EDE8' }}>
            {['Quando', 'Marca', 'Requisito', 'De', 'Para'].map(col => (
              <span key={col} style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {col}
              </span>
            ))}
          </div>

          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="log-grid-row"
              style={{ display: 'grid', gridTemplateColumns: '150px 100px 1fr 130px 130px', padding: '10px 20px', borderBottom: i < entries.length - 1 ? '1px solid #F7F4EF' : 'none', alignItems: 'center' }}
            >
              <span className="log-row-when" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C' }}>
                {formatTimestamp(entry.timestamp)}
              </span>
              <span className="log-row-brand" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1C1917' }}>
                {entry.brandName}
              </span>
              <span className="log-row-req" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#57534E', paddingRight: '12px' }}>
                {entry.reqLabel}
              </span>
              <div className="log-row-statuses" style={{ display: 'contents' }}>
                <div><StatusBadge status={entry.oldStatus} size="sm" /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#D6D3D1' }}>→</span>
                  <StatusBadge status={entry.newStatus} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activityLog.length > 50 && (
        <p style={{ marginTop: '10px', fontSize: '11px', color: '#A8A29E', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
          Mostrando 50 de {activityLog.length} alterações. Use "Exportar CSV" para o histórico completo.
        </p>
      )}
    </div>
  )
}

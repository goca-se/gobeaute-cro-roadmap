export default function ProgressBar({ pct, color, height = 6, showPct = true, showCount = false, done, total }) {
  const safeColor = color || '#1D9E75'
  const safePct = Math.min(100, Math.max(0, pct || 0))

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
      <div
        style={{
          flex: 1,
          height: `${height}px`,
          background: '#F0EDE8',
          borderRadius: `${height}px`,
          overflow: 'hidden',
        }}
      >
        <div
          className="progress-fill"
          style={{
            height: '100%',
            width: `${safePct}%`,
            background: safeColor,
            borderRadius: `${height}px`,
            minWidth: safePct > 0 ? '4px' : '0',
          }}
        />
      </div>
      {showPct && (
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: '12px',
            color: safePct > 0 ? safeColor : '#A8A29E',
            minWidth: '32px',
            textAlign: 'right',
          }}
        >
          {safePct}%
        </span>
      )}
      {showCount && done !== undefined && total !== undefined && (
        <span style={{ fontSize: '11px', color: '#78716C', minWidth: '40px', textAlign: 'right' }}>
          {done}/{total}
        </span>
      )}
    </div>
  )
}

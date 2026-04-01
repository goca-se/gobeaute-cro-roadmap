import { STATUS_CONFIG } from '../data/statusConfig'

export default function StatusBadge({ status, size = 'md', showLabel = true }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  const padding = size === 'sm' ? '2px 7px' : '3px 9px'
  const fontSize = size === 'sm' ? '11px' : '12px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding,
        borderRadius: '20px',
        fontSize,
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 500,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {showLabel && cfg.label}
    </span>
  )
}

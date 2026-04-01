export default function Tooltip({ text, children }) {
  if (!text) return children
  return (
    <div className="tooltip-container">
      {children}
      <div className="tooltip-content">{text}</div>
    </div>
  )
}

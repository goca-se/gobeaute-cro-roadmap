import { useRef, useEffect } from 'react'

const TOOLBAR_BUTTONS = [
  { cmd: 'bold',        label: 'B',  title: 'Negrito',          style: { fontWeight: 700 } },
  { cmd: 'italic',      label: 'I',  title: 'Itálico',          style: { fontStyle: 'italic' } },
  { cmd: 'formatBlock', label: 'H',  title: 'Título H3',        arg: 'h3' },
  { cmd: 'insertUnorderedList', label: '•', title: 'Lista' },
  { cmd: 'insertOrderedList',   label: '1.', title: 'Lista numerada' },
]

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null)
  const skipNextSync = useRef(false)

  // Sync value into editor only when value changes externally
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (skipNextSync.current) { skipNextSync.current = false; return }
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || ''
    }
  }, [value])

  function execCmd(cmd, arg) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, arg || null)
  }

  function handleBlur() {
    skipNextSync.current = true
    onChange(editorRef.current?.innerHTML || '')
  }

  return (
    <div style={{ border: '1px solid #E7E2DA', borderRadius: '6px', overflow: 'hidden', background: 'white' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '2px', padding: '4px 6px', borderBottom: '1px solid #E7E2DA', background: '#FAFAF8' }}>
        {TOOLBAR_BUTTONS.map(btn => (
          <button
            key={btn.cmd + btn.label}
            onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd, btn.arg) }}
            title={btn.title}
            style={{
              width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontFamily: 'monospace', fontSize: '12px', color: '#57534E', padding: 0,
              ...btn.style,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        data-placeholder={placeholder}
        style={{
          minHeight: '80px', padding: '8px 10px',
          fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#1C1917', lineHeight: 1.6,
          outline: 'none',
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #A8A29E;
          pointer-events: none;
        }
        [contenteditable] ul { margin: 4px 0; padding-left: 20px; }
        [contenteditable] ol { margin: 4px 0; padding-left: 20px; }
        [contenteditable] p  { margin: 0 0 4px 0; }
        [contenteditable] h3 { font-size: 13px; font-weight: 600; margin: 6px 0 2px 0; }
      `}</style>
    </div>
  )
}

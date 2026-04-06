import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ImageLightbox from './ImageLightbox'
import { compressImage, uploadImage, deleteImage, validateImageFile } from '../utils/imageUpload'

const TOOLBAR_BUTTONS = [
  { cmd: 'bold',                label: 'B',  title: 'Negrito',        style: { fontWeight: 700 } },
  { cmd: 'italic',              label: 'I',  title: 'Itálico',        style: { fontStyle: 'italic' } },
  { cmd: 'formatBlock',         label: 'H',  title: 'Título H3',      arg: 'h3' },
  { cmd: 'insertUnorderedList', label: '•',  title: 'Lista' },
  { cmd: 'insertOrderedList',   label: '1.', title: 'Lista numerada' },
]

// ── Selection helpers ─────────────────────────────────────────────────────────

function saveSelection() {
  const sel = window.getSelection()
  return sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null
}

function restoreSelection(range) {
  if (!range) return
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RichTextEditor({ value, onChange, placeholder, brandId = '', reqId = '' }) {
  const editorRef   = useRef(null)
  const fileInputRef = useRef(null)
  const skipNextSync = useRef(false)

  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState(null)
  const [lightbox,     setLightbox]     = useState(null) // { src, img }
  const [deleteHover,  setDeleteHover]  = useState(null) // { top, left, img }

  // ── Sync external value into DOM ─────────────────────────────────────────

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (skipNextSync.current) { skipNextSync.current = false; return }
    if (el.innerHTML !== (value || '')) el.innerHTML = value || ''
  }, [value])

  // ── Commit current HTML to parent ─────────────────────────────────────────

  function commit() {
    skipNextSync.current = true
    onChange(editorRef.current?.innerHTML || '')
  }

  // ── Toolbar commands ──────────────────────────────────────────────────────

  function execCmd(cmd, arg) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, arg ?? null)
  }

  // ── Core image insertion flow ─────────────────────────────────────────────

  async function handleImageFile(file, savedRange) {
    const error = validateImageFile(file)
    if (error) {
      setUploadError(error)
      setTimeout(() => setUploadError(null), 5000)
      return
    }

    setUploading(true)
    setUploadError(null)

    // Insert loading placeholder at cursor
    const placeholderId = 'img-ph-' + Date.now()
    editorRef.current?.focus()
    if (savedRange) restoreSelection(savedRange)
    document.execCommand('insertHTML', false,
      `<span id="${placeholderId}" class="task-img-loading" contenteditable="false"> </span>`
    )

    try {
      const blob = await compressImage(file)
      const { src, storagePath } = await uploadImage(blob, brandId || 'unknown', reqId || 'unknown')

      const el = editorRef.current
      if (!el) return
      const ph = el.querySelector(`#${placeholderId}`)
      if (ph) {
        ph.outerHTML = `<img
          src="${src}"
          ${storagePath ? `data-storage-path="${storagePath}"` : ''}
          class="task-inline-img"
          alt="screenshot"
        /><br/>`
      }
      commit()
    } catch (err) {
      const ph = editorRef.current?.querySelector(`#${placeholderId}`)
      if (ph) ph.remove()
      setUploadError(err.message || 'Erro no upload.')
      setTimeout(() => setUploadError(null), 6000)
    } finally {
      setUploading(false)
    }
  }

  // ── Paste handler ─────────────────────────────────────────────────────────

  function handlePaste(e) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (blob) handleImageFile(blob, saveSelection())
        return
      }
    }
  }

  // ── Drag & drop handlers ──────────────────────────────────────────────────

  function handleDragOver(e) {
    if ([...e.dataTransfer.types].includes('Files')) e.preventDefault()
  }

  function handleDrop(e) {
    const file = [...(e.dataTransfer.files || [])].find(f => f.type.startsWith('image/'))
    if (!file) return
    e.preventDefault()
    handleImageFile(file, null)
  }

  // ── File picker (toolbar button) ──────────────────────────────────────────

  function handlePickFile(e) {
    const file = e.target.files?.[0]
    if (file) handleImageFile(file, saveSelection())
    e.target.value = ''
  }

  // ── Image click → lightbox ────────────────────────────────────────────────

  function handleEditorClick(e) {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('task-inline-img')) {
      setLightbox({ src: e.target.src, img: e.target })
    }
  }

  // ── Hover → show delete button ────────────────────────────────────────────

  function handleEditorMouseMove(e) {
    const t = e.target
    if (t.tagName === 'IMG' && t.classList.contains('task-inline-img')) {
      const rect = t.getBoundingClientRect()
      setDeleteHover({ top: rect.top + 6, left: rect.right - 28, img: t })
    } else {
      setDeleteHover(null)
    }
  }

  // ── Delete image ──────────────────────────────────────────────────────────

  async function handleDeleteImage(img) {
    setDeleteHover(null)
    setLightbox(null)
    const storagePath = img.dataset?.storagePath || null
    img.remove()
    commit()
    if (storagePath) {
      deleteImage(storagePath).catch(console.error)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ border: '1px solid #E7E2DA', borderRadius: '6px', overflow: 'hidden', background: 'white' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '4px 6px', borderBottom: '1px solid #E7E2DA', background: '#FAFAF8' }}>
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

          {/* Divider */}
          <div style={{ width: '1px', height: '16px', background: '#E7E2DA', margin: '0 2px', flexShrink: 0 }} />

          {/* Image button */}
          <button
            onMouseDown={e => { e.preventDefault(); fileInputRef.current?.click() }}
            title="Inserir imagem (ou Ctrl+V / arrastar)"
            disabled={uploading}
            style={{
              width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', borderRadius: '4px', cursor: uploading ? 'wait' : 'pointer',
              fontSize: '14px', padding: 0, opacity: uploading ? 0.4 : 1,
            }}
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePickFile}
            style={{ display: 'none' }}
          />

          {uploading && (
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', marginLeft: '4px' }}>
              Enviando…
            </span>
          )}
        </div>

        {/* Editable area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={commit}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleEditorClick}
          onMouseMove={handleEditorMouseMove}
          onMouseLeave={() => setDeleteHover(null)}
          data-placeholder={placeholder}
          style={{
            minHeight: '80px', padding: '8px 10px',
            fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#1C1917', lineHeight: 1.6,
            outline: 'none',
          }}
        />

        {uploadError && (
          <div className="upload-error" style={{ margin: '0 8px 6px' }}>{uploadError}</div>
        )}

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

      {/* Delete button overlay — rendered in body to escape overflow:hidden parents */}
      {deleteHover && createPortal(
        <button
          className="img-delete-btn"
          style={{ top: deleteHover.top, left: deleteHover.left }}
          onMouseEnter={() => {/* keep visible */}}
          onMouseLeave={() => setDeleteHover(null)}
          onClick={() => handleDeleteImage(deleteHover.img)}
          title="Deletar imagem"
        >
          ×
        </button>,
        document.body
      )}

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          onClose={() => setLightbox(null)}
          onDelete={() => handleDeleteImage(lightbox.img)}
        />
      )}
    </>
  )
}

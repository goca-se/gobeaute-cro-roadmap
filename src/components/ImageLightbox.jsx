import { useEffect } from 'react'

export default function ImageLightbox({ src, onClose, onDelete }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleDownload() {
    const a = document.createElement('a')
    a.href = src
    a.download = 'screenshot-' + Date.now() + '.webp'
    a.target = '_blank'
    a.click()
  }

  return (
    <div
      className="lightbox-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <img src={src} alt="screenshot" className="lightbox-img" />

      <div className="lightbox-toolbar">
        <button className="lightbox-btn" onClick={handleDownload} title="Baixar imagem">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Baixar
        </button>
        {onDelete && (
          <button className="lightbox-btn danger" onClick={onDelete} title="Deletar imagem">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 3h12M5 3V2h4v1M2 3l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Deletar
          </button>
        )}
        <button className="lightbox-btn" onClick={onClose} title="Fechar (Esc)">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Fechar
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { VISIBLE_BRANDS } from '../data/phases'
import { BUILTIN_PHASE_LABELS, BUILTIN_SECTION_LABELS, BUILTIN_PHASE_IDS, CUSTOM_PHASE_COLORS } from '../utils/mergePhases'
import { testConnection } from '../lib/metabase'

// ── Helpers ────────────────────────────────────────────────────────────────

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', marginTop: '3px' }}>{hint}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E7E2DA',
  fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#1C1917',
  background: 'white', outline: 'none', boxSizing: 'border-box',
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onBlur={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '17px', fontWeight: 400, color: '#1C1917', letterSpacing: '-0.3px', marginBottom: '3px' }}>{title}</h3>
      {subtitle && <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C' }}>{subtitle}</p>}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: '#F0EDE8', margin: '20px 0' }} />
}

function LogoPreview({ url, fallback, size = 40 }) {
  const [imgError, setImgError] = useState(false)
  if (url && !imgError) {
    return (
      <img
        src={url} alt="Logo"
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '8px', objectFit: 'contain', border: '1px solid #E7E2DA', flexShrink: 0, background: 'white' }}
      />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '8px', background: 'linear-gradient(135deg, #1D9E75 0%, #16845F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: Math.round(size * 0.38) + 'px', color: 'white', flexShrink: 0 }}>
      {fallback}
    </div>
  )
}

// ── Metabase connection test ───────────────────────────────────────────────

function MetabaseSection({ appSettings, updateAppSetting }) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | 'ok' | string (error)

  const mb = appSettings.metabase || {}
  const canTest = !!(mb.baseUrl && mb.apiKey)

  async function runTest() {
    setTesting(true)
    setTestResult(null)
    try {
      await testConnection(mb.baseUrl, mb.apiKey)
      setTestResult('ok')
    } catch (e) {
      setTestResult(e.message || 'Erro desconhecido')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <SectionHeader title="Metabase" subtitle="URL e chave de API para buscar métricas de funil por loja" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <Field label="URL base">
          <TextInput value={mb.baseUrl} onChange={v => updateAppSetting('metabase.baseUrl', v)} placeholder="https://metabase.empresa.com" />
        </Field>
        <Field label="Chave de API" hint="Gerada em Configurações → Chaves de API no Metabase">
          <TextInput value={mb.apiKey} onChange={v => updateAppSetting('metabase.apiKey', v)} type="password" placeholder="mb_••••••••••••••••" />
        </Field>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={runTest}
          disabled={testing || !canTest}
          style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #E7E2DA', background: 'white', fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, color: '#57534E', cursor: (testing || !canTest) ? 'not-allowed' : 'pointer', opacity: !canTest ? 0.5 : 1 }}>
          {testing ? 'Testando...' : 'Testar conexão'}
        </button>
        {testResult === 'ok' && <span style={{ fontSize: '12px', color: '#16A34A', fontFamily: "'Outfit', sans-serif" }}>✓ Conectado com sucesso</span>}
        {testResult && testResult !== 'ok' && <span style={{ fontSize: '12px', color: '#DC2626', fontFamily: "'Outfit', sans-serif" }}>✗ {testResult}</span>}
      </div>

      <div style={{ height: '1px', background: '#F0EDE8', marginBottom: '20px' }} />
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Embed (aba Analítico)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Chave secreta de embed" hint="Configurações → Incorporação → Chave de assinatura">
          <TextInput value={mb.embedSecret} onChange={v => updateAppSetting('metabase.embedSecret', v)} type="password" placeholder="964847bd..." />
        </Field>
        <Field label="ID do dashboard" hint="Número do dashboard a incorporar">
          <TextInput value={mb.embedDashboardId} onChange={v => updateAppSetting('metabase.embedDashboardId', v)} placeholder="1289" />
        </Field>
      </div>
    </div>
  )
}

// ── Status labels ─────────────────────────────────────────────────────────

const STATUS_IDS = ['pending', 'in_progress', 'waiting_client', 'validating', 'done']
const STATUS_DEFAULTS = {
  pending: { label: 'Pendente', color: '#9CA3AF', bg: '#F9FAFB' },
  in_progress: { label: 'Em progresso', color: '#D97706', bg: '#FFFBEB' },
  waiting_client: { label: 'Esp. cliente', color: '#2563EB', bg: '#EFF6FF' },
  validating: { label: 'Em validação', color: '#7C3AED', bg: '#F5F3FF' },
  done: { label: 'Finalizado', color: '#16A34A', bg: '#F0FDF4' },
}

function StatusLabelsSection({ appSettings, updateAppSetting }) {
  const labels = appSettings.statusLabels || {}
  return (
    <div>
      <SectionHeader title="Rótulos de status" subtitle="Personalizar os nomes exibidos em cada status (cores e IDs são fixos)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {STATUS_IDS.map(id => {
          const def = STATUS_DEFAULTS[id]
          const value = labels[id] || def.label
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: def.color, flexShrink: 0 }} />
              <span style={{ width: '130px', fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#78716C', flexShrink: 0 }}>{def.label}</span>
              <input
                value={value}
                onChange={e => updateAppSetting(`statusLabels.${id}`, e.target.value)}
                onBlur={e => { if (!e.target.value.trim()) updateAppSetting(`statusLabels.${id}`, def.label) }}
                style={{ ...inputStyle, flex: 1, padding: '5px 8px' }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Responsible areas ──────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Verde' },
  { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'Roxo' },
  { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Azul' },
  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Amarelo' },
  { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Vermelho' },
  { color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', label: 'Ciano' },
  { color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB', label: 'Cinza' },
]

function ResponsibleAreasSection({ appSettings, updateAppSetting }) {
  const areas = appSettings.responsibleAreas || []

  function updateArea(idx, field, value) {
    const updated = areas.map((a, i) => i === idx ? { ...a, [field]: value } : a)
    updateAppSetting('responsibleAreas', updated)
  }

  function addArea() {
    const preset = COLOR_PRESETS[areas.length % COLOR_PRESETS.length]
    const newArea = { id: `area_${Date.now()}`, label: 'Nova área', color: preset.color, bg: preset.bg, border: preset.border }
    updateAppSetting('responsibleAreas', [...areas, newArea])
  }

  function removeArea(idx) {
    if (areas.length <= 1) return
    updateAppSetting('responsibleAreas', areas.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <SectionHeader title="Áreas responsáveis" subtitle="Lista de áreas que podem ser atribuídas às tarefas" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {areas.map((area, idx) => (
          <div key={area.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: area.bg, border: `1px solid ${area.border}`, borderRadius: '8px' }}>
            {/* Color picker */}
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {COLOR_PRESETS.map(p => (
                <button key={p.color} onClick={() => updateAppSetting('responsibleAreas', areas.map((a, i) => i === idx ? { ...a, color: p.color, bg: p.bg, border: p.border } : a))}
                  title={p.label}
                  style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.color, border: area.color === p.color ? '2px solid #1C1917' : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                />
              ))}
            </div>
            <div style={{ width: '1px', height: '18px', background: area.border, flexShrink: 0 }} />
            <input
              value={area.label}
              onChange={e => updateArea(idx, 'label', e.target.value)}
              style={{ flex: 1, padding: '3px 7px', border: `1px solid ${area.border}`, borderRadius: '6px', fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: area.color, background: 'white', outline: 'none', fontWeight: 500 }}
            />
            <button
              onClick={() => removeArea(idx)}
              disabled={areas.length <= 1}
              title="Remover área"
              style={{ background: 'none', border: 'none', cursor: areas.length <= 1 ? 'not-allowed' : 'pointer', color: '#D6D3D1', fontSize: '18px', lineHeight: 1, padding: '0 2px', opacity: areas.length <= 1 ? 0.3 : 1 }}>
              ×
            </button>
          </div>
        ))}
      </div>
      <button onClick={addArea}
        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px dashed #D6D3D1', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontFamily: "'Outfit', sans-serif", color: '#A8A29E' }}>
        + Adicionar área
      </button>
    </div>
  )
}

// ── Brand accordion ────────────────────────────────────────────────────────

function BrandSettings({ brand, brandSettings, updateBrandSetting }) {
  const [open, setOpen] = useState(false)
  const s = brandSettings || {}

  function update(path, value) {
    updateBrandSetting(brand.id, path, value)
  }

  const displayName = s.customName || brand.name
  const logoUrl = s.logoUrl

  return (
    <div style={{ border: '1px solid #E7E2DA', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '12px 16px', background: open ? '#FAFAF8' : 'white', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LogoPreview url={logoUrl} fallback={brand.initials} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1C1917' }}>{displayName}</div>
          <div style={{ fontSize: '11px', color: '#A8A29E' }}>{s.customSegment || brand.segment}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#A8A29E', flexShrink: 0 }}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: '20px', borderTop: '1px solid #F0EDE8' }}>
          {/* Identidade */}
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Identidade</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            <LogoPreview url={logoUrl} fallback={brand.initials} size={48} />
            <div style={{ flex: 1 }}>
              <Field label="URL do logo">
                <TextInput value={s.logoUrl} onChange={v => update('logoUrl', v)} placeholder="https://exemplo.com/logo.png" />
              </Field>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
            <Field label="Nome personalizado">
              <TextInput value={s.customName} onChange={v => update('customName', v)} placeholder={brand.name} />
            </Field>
            <Field label="Segmento personalizado">
              <TextInput value={s.customSegment} onChange={v => update('customSegment', v)} placeholder={brand.segment} />
            </Field>
          </div>

          <Divider />

          {/* Links */}
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Links de referência</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '8px' }}>
            <Field label="GA4">
              <TextInput value={s.links?.ga4} onChange={v => update('links.ga4', v)} placeholder="https://analytics.google.com/..." />
            </Field>
            <Field label="Link da loja">
              <TextInput value={s.links?.storeUrl} onChange={v => update('links.storeUrl', v)} placeholder="https://loja.com.br" />
            </Field>
            <Field label="Shopify Admin">
              <TextInput value={s.links?.shopify} onChange={v => update('links.shopify', v)} placeholder="https://admin.shopify.com/..." />
            </Field>
            <Field label="Google Drive">
              <TextInput value={s.links?.drive} onChange={v => update('links.drive', v)} placeholder="https://drive.google.com/..." />
            </Field>
          </div>

          <Divider />

          {/* Metabase card IDs */}
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>IDs de cards Metabase</div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', marginBottom: '12px' }}>Insira o ID numérico do card que retorna o valor escalar de cada métrica</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {[['cvr', 'CVR'], ['aov', 'AOV'], ['rpv', 'RPV'], ['sessions', 'Sessões'], ['revenue', 'Receita']].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  value={s.metabaseCards?.[key] ?? ''}
                  onChange={e => update(`metabaseCards.${key}`, e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="ID"
                  style={{ ...inputStyle, padding: '5px 8px' }}
                />
              </Field>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Phase Manager ──────────────────────────────────────────────────────────

const SUGGESTED_PHASE_EMOJIS = ['📊', '📈', '🎯', '🚀', '⚡', '🔍', '💡', '🧪', '📱', '🛒', '💰', '🌟', '🔬', '📋', '✅', '🎨', '🔧', '📣', '💎', '🏆', '🧭', '📦', '🌐', '⚙️']
const SUGGESTED_SECTION_EMOJIS = ['🔍', '⚡', '📊', '🎯', '🛒', '💡', '🔧', '📱', '🌟', '✅', '📈', '💰', '🧪', '🎨', '📣', '🔬', '📋', '💎', '🏆', '🌐', '🧭', '⚙️', '📦', '🚀']

function EmojiPicker({ value, onChange, suggested = SUGGESTED_PHASE_EMOJIS }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="🎯"
        style={{ width: '48px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #E7E2DA', fontFamily: "'Outfit', sans-serif", fontSize: '18px', textAlign: 'center', outline: 'none' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', flex: 1 }}>
        {suggested.map(e => (
          <button
            key={e}
            onClick={() => onChange(e)}
            style={{
              padding: '3px 5px', border: value === e ? '1.5px solid #1D9E75' : '1px solid #E7E2DA',
              borderRadius: '5px', background: value === e ? '#ECFDF5' : 'white',
              cursor: 'pointer', fontSize: '16px', lineHeight: 1,
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

function SectionRow({ section, isCustom, phaseId, onUpdateMeta, onDelete, dragHandleProps, isDragging, isDragOver }) {
  const originalName = BUILTIN_SECTION_LABELS[section.section_id || section.id] || null

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px',
        background: isDragOver ? '#F0FDF4' : 'white',
        border: `1px solid ${isDragOver ? '#A7F3D0' : '#F0EDE8'}`,
        borderRadius: '8px', opacity: isDragging ? 0.4 : 1,
        borderTop: isDragOver ? '2px solid #1D9E75' : undefined,
        transition: 'background 0.1s',
      }}
      {...dragHandleProps}
    >
      {/* Drag handle */}
      <div style={{ cursor: 'grab', color: '#D6D3D1', fontSize: '14px', lineHeight: '28px', flexShrink: 0, paddingTop: '2px' }}>⠿</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Emoji picker for section */}
        <div style={{ marginBottom: '6px' }}>
          <EmojiPicker
            value={section.emoji}
            onChange={v => onUpdateMeta(section.section_id || section.id, 'emoji', v)}
            suggested={SUGGESTED_SECTION_EMOJIS}
          />
        </div>
        {/* Name input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            defaultValue={section.name || section.label}
            onBlur={e => onUpdateMeta(section.section_id || section.id, 'label', e.target.value)}
            style={{ flex: 1, padding: '5px 8px', border: '1px solid #E7E2DA', borderRadius: '6px', fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#1C1917', outline: 'none' }}
          />
          {originalName && (section.name || section.label) !== originalName && (
            <button
              onClick={() => onUpdateMeta(section.section_id || section.id, 'label', originalName)}
              title="Restaurar nome original"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', fontSize: '14px', flexShrink: 0, padding: '2px' }}
            >↺</button>
          )}
        </div>
      </div>

      {/* Built-in tag or delete */}
      {isCustom ? (
        <button
          onClick={() => onDelete(section.section_id || section.id)}
          title="Remover seção personalizada"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D6D3D1', fontSize: '20px', lineHeight: 1, padding: '0 2px', flexShrink: 0, alignSelf: 'center' }}
        >×</button>
      ) : (
        <span style={{ fontSize: '10px', color: '#A8A29E', background: '#F5F4F2', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, alignSelf: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
          built-in
        </span>
      )}
    </div>
  )
}

function AddSectionForm({ phaseId, onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(phaseId, { name: name.trim(), emoji })
    setName('')
    setEmoji('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', padding: '10px 12px', background: '#FAFAF8', border: '1px dashed #D6D3D1', borderRadius: '8px' }}>
      <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Nome da seção</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nova seção..."
          autoFocus
          style={{ width: '100%', padding: '6px 8px', border: '1px solid #E7E2DA', borderRadius: '6px', fontFamily: "'Outfit', sans-serif", fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ width: '56px' }}>
        <label style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Emoji</label>
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          placeholder="🎯"
          style={{ width: '100%', padding: '6px 8px', border: '1px solid #E7E2DA', borderRadius: '6px', fontFamily: "'Outfit', sans-serif", fontSize: '18px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      <button
        type="submit"
        disabled={!name.trim()}
        style={{ padding: '7px 14px', borderRadius: '6px', background: '#1D9E75', border: 'none', color: 'white', fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.5, flexShrink: 0 }}
      >
        Adicionar
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{ padding: '7px 12px', borderRadius: '6px', background: 'white', border: '1px solid #E7E2DA', color: '#78716C', fontFamily: "'Syne', sans-serif", fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
      >
        Cancelar
      </button>
    </form>
  )
}

function AddPhaseForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [colorIdx, setColorIdx] = useState(0)
  const palette = CUSTOM_PHASE_COLORS[colorIdx]

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ label: name.trim(), emoji, ...palette })
    setName(''); setEmoji(''); setColorIdx(0)
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px', background: '#FAFAF8', border: '1px dashed #D6D3D1', borderRadius: '10px', marginTop: '4px' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
        Nova fase
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Nome</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da fase..."
            autoFocus
            style={{ width: '100%', padding: '7px 10px', border: '1px solid #E7E2DA', borderRadius: '6px', fontFamily: "'Outfit', sans-serif", fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ width: '56px' }}>
          <label style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Emoji</label>
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            placeholder="🎯"
            style={{ width: '100%', padding: '7px 8px', border: '1px solid #E7E2DA', borderRadius: '6px', fontFamily: "'Outfit', sans-serif", fontSize: '18px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Cor</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            {CUSTOM_PHASE_COLORS.map((c, i) => (
              <button
                key={i} type="button"
                onClick={() => setColorIdx(i)}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%', background: c.color, border: i === colorIdx ? '2.5px solid #1C1917' : '2px solid transparent',
                  cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          type="submit" disabled={!name.trim()}
          style={{ padding: '7px 16px', borderRadius: '6px', background: palette.color, border: 'none', color: 'white', fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.5 }}
        >
          Criar fase
        </button>
        <button
          type="button" onClick={onCancel}
          style={{ padding: '7px 12px', borderRadius: '6px', background: 'white', border: '1px solid #E7E2DA', color: '#78716C', fontFamily: "'Syne', sans-serif", fontSize: '12px', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function PhaseAccordionSettings({ phase, isBuiltinPhase, onUpdatePhaseMeta, onUpdateSectionMeta, onAddSection, onDeleteSection, onDeletePhase, onReorderSections }) {
  const [open, setOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [dragSectionId, setDragSectionId] = useState(null)
  const [dragOverSectionId, setDragOverSectionId] = useState(null)
  const originalName = BUILTIN_PHASE_LABELS[phase.id] || null

  // All sections for this phase
  const sections = phase.sections || []
  // Built-in section IDs (from BUILTIN_SECTION_LABELS)
  const isBuiltin = (sId) => !!BUILTIN_SECTION_LABELS[sId]

  function handleSectionDragStart(e, sectionId) {
    setDragSectionId(sectionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleSectionDragOver(e, sectionId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (sectionId !== dragSectionId) setDragOverSectionId(sectionId)
  }

  function handleSectionDrop(e, targetSectionId) {
    e.preventDefault()
    if (!dragSectionId || dragSectionId === targetSectionId) {
      setDragSectionId(null); setDragOverSectionId(null); return
    }
    const ids = sections.map(s => s.id)
    const fromIdx = ids.indexOf(dragSectionId)
    const toIdx = ids.indexOf(targetSectionId)
    if (fromIdx < 0 || toIdx < 0) { setDragSectionId(null); setDragOverSectionId(null); return }
    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, dragSectionId)
    onReorderSections(phase.id, reordered)
    setDragSectionId(null); setDragOverSectionId(null)
  }

  return (
    <div style={{ border: `1px solid #E7E2DA`, borderLeft: `3px solid ${phase.color}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', background: open ? '#FAFAF8' : 'white' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ flex: 1, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0, minWidth: '24px' }}>{phase.emoji || ''}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: phase.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Fase {phase.number}
            </div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1C1917', marginTop: '2px' }}>
              {phase.name}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#A8A29E' }}>{sections.length} seções</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#A8A29E', flexShrink: 0 }}>
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {!isBuiltinPhase && (
          <button
            onClick={() => { if (window.confirm(`Excluir a fase "${phase.name}"? Esta ação não pode ser desfeita.`)) onDeletePhase(phase.id) }}
            title="Excluir fase"
            style={{ padding: '0 16px', background: 'none', border: 'none', borderLeft: '1px solid #F0EDE8', cursor: 'pointer', color: '#D6D3D1', fontSize: '20px', lineHeight: 1, flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
            onMouseLeave={e => e.currentTarget.style.color = '#D6D3D1'}
          >×</button>
        )}
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #F0EDE8', padding: '16px' }}>
          {/* Phase meta editing */}
          <div style={{ marginBottom: '16px', padding: '14px', background: '#FAFAF8', borderRadius: '8px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Identidade da fase
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Emoji</label>
              <EmojiPicker
                value={phase.emoji}
                onChange={v => onUpdatePhaseMeta(phase.id, 'emoji', v)}
                suggested={SUGGESTED_PHASE_EMOJIS}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Nome</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  key={phase.name}
                  defaultValue={phase.name}
                  onBlur={e => onUpdatePhaseMeta(phase.id, 'label', e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #E7E2DA', borderRadius: '6px', fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#1C1917', outline: 'none' }}
                />
                {originalName && phase.name !== originalName && (
                  <button
                    onClick={() => onUpdatePhaseMeta(phase.id, 'label', originalName)}
                    title="Restaurar nome original"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', fontSize: '16px', padding: '2px' }}
                  >↺</button>
                )}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
            Seções
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {sections.map(section => (
              <div
                key={section.id}
                draggable
                onDragStart={e => handleSectionDragStart(e, section.id)}
                onDragOver={e => handleSectionDragOver(e, section.id)}
                onDrop={e => handleSectionDrop(e, section.id)}
                onDragEnd={() => { setDragSectionId(null); setDragOverSectionId(null) }}
              >
                <SectionRow
                  section={{ ...section, section_id: section.id }}
                  isCustom={!isBuiltin(section.id)}
                  phaseId={phase.id}
                  onUpdateMeta={onUpdateSectionMeta}
                  onDelete={onDeleteSection}
                  dragHandleProps={{}}
                  isDragging={dragSectionId === section.id}
                  isDragOver={dragOverSectionId === section.id}
                />
              </div>
            ))}
            {sections.length === 0 && (
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#A8A29E', fontStyle: 'italic' }}>Nenhuma seção. Adicione uma abaixo.</p>
            )}
          </div>

          {showAddForm ? (
            <AddSectionForm
              phaseId={phase.id}
              onAdd={(phaseId, opts) => { onAddSection(phaseId, opts); setShowAddForm(false) }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px dashed #D6D3D1', cursor: 'pointer', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontFamily: "'Outfit', sans-serif", color: '#A8A29E' }}
            >
              + Adicionar seção personalizada
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PhaseManagerSection({ mergedPhases, onUpdatePhaseMeta, onUpdateSectionMeta, onAddPhase, onDeletePhase, onAddSection, onDeleteSection, onReorderPhases, onReorderSections }) {
  const [dragPhaseId, setDragPhaseId] = useState(null)
  const [dragOverPhaseId, setDragOverPhaseId] = useState(null)
  const [showAddPhase, setShowAddPhase] = useState(false)

  if (!mergedPhases || !mergedPhases.length) return null

  function handlePhaseDragStart(e, phaseId) {
    setDragPhaseId(phaseId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handlePhaseDragOver(e, phaseId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (phaseId !== dragPhaseId) setDragOverPhaseId(phaseId)
  }

  function handlePhaseDrop(e, targetPhaseId) {
    e.preventDefault()
    if (!dragPhaseId || dragPhaseId === targetPhaseId) {
      setDragPhaseId(null); setDragOverPhaseId(null); return
    }
    const ids = mergedPhases.map(p => p.id)
    const fromIdx = ids.indexOf(dragPhaseId)
    const toIdx = ids.indexOf(targetPhaseId)
    if (fromIdx < 0 || toIdx < 0) { setDragPhaseId(null); setDragOverPhaseId(null); return }
    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, dragPhaseId)
    onReorderPhases(reordered)
    setDragPhaseId(null); setDragOverPhaseId(null)
  }

  return (
    <div>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#A8A29E', marginBottom: '14px' }}>
        Arraste ⠿ para reordenar · edições salvam automaticamente · fases e seções built-in não podem ser removidas
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {mergedPhases.map(phase => (
          <div
            key={phase.id}
            draggable
            onDragStart={e => handlePhaseDragStart(e, phase.id)}
            onDragOver={e => handlePhaseDragOver(e, phase.id)}
            onDrop={e => handlePhaseDrop(e, phase.id)}
            onDragEnd={() => { setDragPhaseId(null); setDragOverPhaseId(null) }}
            style={{
              opacity: dragPhaseId === phase.id ? 0.4 : 1,
              borderTop: dragOverPhaseId === phase.id ? '2px solid #1D9E75' : '2px solid transparent',
              transition: 'opacity 0.15s',
            }}
          >
            <PhaseAccordionSettings
              phase={phase}
              isBuiltinPhase={BUILTIN_PHASE_IDS.has(phase.id)}
              onUpdatePhaseMeta={onUpdatePhaseMeta}
              onUpdateSectionMeta={onUpdateSectionMeta}
              onAddSection={onAddSection}
              onDeleteSection={onDeleteSection}
              onDeletePhase={onDeletePhase}
              onReorderSections={onReorderSections}
            />
          </div>
        ))}
      </div>

      {showAddPhase ? (
        <AddPhaseForm
          onAdd={(opts) => { onAddPhase(opts); setShowAddPhase(false) }}
          onCancel={() => setShowAddPhase(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddPhase(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: 'none', border: '1px dashed #D6D3D1', cursor: 'pointer', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontFamily: "'Outfit', sans-serif", color: '#A8A29E', width: '100%', justifyContent: 'center' }}
        >
          + Adicionar fase
        </button>
      )}
    </div>
  )
}

// ── SettingsView (main) ────────────────────────────────────────────────────

export default function SettingsView({
  data, mergedPhases,
  updateBrandSetting, updateAppSetting,
  updatePhaseMeta, updateSectionMeta,
  addPhase, deletePhase,
  addCustomSection, deleteCustomSection,
  reorderPhases, reorderSections,
}) {
  const appSettings = data.appSettings || {}
  const brandSettings = data.brandSettings || {}

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 400, color: '#1C1917', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Configurações
        </h1>
        <p style={{ color: '#78716C', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}>
          Personalize a plataforma e configure as integrações por loja
        </p>
      </div>

      {/* Global settings */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Configurações globais
        </h2>

        <Card>
          <SectionHeader title="Identidade do grupo" />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            <LogoPreview url={appSettings.logoUrl} fallback="G" size={48} />
            <div style={{ flex: 1 }}>
              <Field label="Logo do grupo (URL)">
                <TextInput value={appSettings.logoUrl} onChange={v => updateAppSetting('logoUrl', v)} placeholder="https://exemplo.com/logo-grupo.png" />
              </Field>
            </div>
          </div>
          <Field label="Nome do grupo" hint="Exibido no cabeçalho da plataforma">
            <TextInput value={appSettings.groupName} onChange={v => updateAppSetting('groupName', v)} placeholder="Gobeaute" />
          </Field>
        </Card>

        <Card>
          <MetabaseSection appSettings={appSettings} updateAppSetting={updateAppSetting} />
        </Card>

        <Card>
          <StatusLabelsSection appSettings={appSettings} updateAppSetting={updateAppSetting} />
        </Card>

        <Card>
          <ResponsibleAreasSection appSettings={appSettings} updateAppSetting={updateAppSetting} />
        </Card>
      </div>

      {/* Phase Manager */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Gerenciador de fases
        </h2>
        <PhaseManagerSection
          mergedPhases={mergedPhases}
          onUpdatePhaseMeta={updatePhaseMeta}
          onUpdateSectionMeta={updateSectionMeta}
          onAddPhase={addPhase}
          onDeletePhase={deletePhase}
          onAddSection={addCustomSection}
          onDeleteSection={deleteCustomSection}
          onReorderPhases={reorderPhases}
          onReorderSections={reorderSections}
        />
      </div>

      {/* Per-brand settings */}
      <div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Configurações por marca
        </h2>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: '#A8A29E', marginBottom: '14px' }}>
          Os campos salvam automaticamente ao sair de cada campo.
        </p>
        {VISIBLE_BRANDS.map(brand => (
          <BrandSettings
            key={brand.id}
            brand={brand}
            brandSettings={brandSettings[brand.id]}
            updateBrandSetting={updateBrandSetting}
          />
        ))}
      </div>
    </div>
  )
}

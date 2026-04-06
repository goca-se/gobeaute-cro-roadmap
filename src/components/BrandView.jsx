import { useState, useEffect, useRef, createContext, useContext } from 'react'
import ProgressBar from './ProgressBar'
import Tooltip from './Tooltip'
import RichTextEditor from './RichTextEditor'
import { getBrandPhaseStats, getSectionStats } from '../utils/stats'
import { VISIBLE_BRANDS, PHASES } from '../data/phases'
import { STATUS_CONFIG, STATUS_ORDER, RESPONSIBLE_CONFIG, PRIORITY_CONFIG } from '../data/statusConfig'
import { fetchBrandMetrics } from '../lib/metabase'

// ── Config context (status + responsible area configs derived from appSettings) ─

const CfgCtx = createContext(null)
function useCfg() { return useContext(CfgCtx) }

function buildStatusConfig(appSettings) {
  const labels = appSettings?.statusLabels || {}
  const cfg = {}
  STATUS_ORDER.forEach(id => {
    cfg[id] = { ...STATUS_CONFIG[id] }
    if (labels[id]) { cfg[id].label = labels[id]; cfg[id].labelFull = labels[id] }
  })
  return cfg
}

function buildResponsibleAreas(appSettings) {
  if (appSettings?.responsibleAreas?.length) return appSettings.responsibleAreas
  return Object.entries(RESPONSIBLE_CONFIG).map(([id, v]) => ({ id, ...v }))
}

// ── Filter logic ────────────────────────────────────────────────────────────

const EMPTY_FILTERS = { search: '', statuses: [], responsible: [], priorities: [], overdueOnly: false }

function taskMatchesFilters(task, displayTitle, filters) {
  if (filters.search && !displayTitle.toLowerCase().includes(filters.search.toLowerCase())) return false
  if (filters.statuses.length && !filters.statuses.includes(task.status || 'pending')) return false
  if (filters.responsible.length && !filters.responsible.includes(task.assignee)) return false
  if (filters.priorities.length && !filters.priorities.includes(task.priority)) return false
  if (filters.overdueOnly) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (!(task.deadline && new Date(task.deadline) < today && task.status !== 'done')) return false
  }
  return true
}

function countActiveFilters(f) {
  return (f.search ? 1 : 0) + (f.statuses.length ? 1 : 0) + (f.responsible.length ? 1 : 0) + (f.priorities.length ? 1 : 0) + (f.overdueOnly ? 1 : 0)
}

// ── FilterDropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ label, options, selected, onChange, accentColor }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isActive = selected.length > 0

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${isActive ? accentColor : '#E7E2DA'}`, background: isActive ? accentColor + '12' : 'white', color: isActive ? accentColor : '#57534E', fontSize: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        {label}{isActive ? ` (${selected.length})` : ''}<span style={{ fontSize: '9px', marginLeft: '2px' }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: 'white', border: '1px solid #E7E2DA', borderRadius: '10px', padding: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 200, minWidth: '170px' }}>
          {options.map(opt => {
            const checked = selected.includes(opt.value)
            return (
              <label key={opt.value}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', background: checked ? opt.bg || '#F9FAFB' : 'transparent' }}>
                <input type="checkbox" checked={checked}
                  onChange={() => onChange(checked ? selected.filter(v => v !== opt.value) : [...selected, opt.value])}
                  style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: opt.color || accentColor, flexShrink: 0 }} />
                {opt.dot && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: opt.color, flexShrink: 0 }} />}
                <span style={{ fontSize: '12px', fontFamily: "'Outfit', sans-serif", color: opt.color || '#1C1917', fontWeight: 500 }}>{opt.label}</span>
              </label>
            )
          })}
          {selected.length > 0 && (
            <button onClick={() => { onChange([]); setOpen(false) }}
              style={{ marginTop: '4px', width: '100%', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#A8A29E', fontFamily: "'Outfit', sans-serif", borderTop: '1px solid #F0EDE8', paddingTop: '6px' }}>
              Limpar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── FilterBar ───────────────────────────────────────────────────────────────

function FilterBar({ filters, onChange }) {
  const active = countActiveFilters(filters)
  const { statusConfig, statusOrder, responsibleAreas } = useCfg()

  const statusOptions = statusOrder.map(s => ({ value: s, label: statusConfig[s].labelFull, color: statusConfig[s].color, bg: statusConfig[s].bg, dot: true }))
  const responsibleOptions = [
    ...responsibleAreas.map(a => ({ value: a.id, label: a.label, color: a.color, bg: a.bg, dot: true })),
    { value: null, label: 'Sem responsável', color: '#9CA3AF', dot: true },
  ]
  const priorityOptions = [
    { value: 'high', label: 'Alta', color: PRIORITY_CONFIG.high.color, bg: PRIORITY_CONFIG.high.bg, dot: true },
    { value: 'medium', label: 'Média', color: PRIORITY_CONFIG.medium.color, bg: PRIORITY_CONFIG.medium.bg, dot: true },
    { value: 'low', label: 'Baixa', color: PRIORITY_CONFIG.low.color, bg: PRIORITY_CONFIG.low.bg, dot: true },
    { value: null, label: 'Sem prioridade', color: '#9CA3AF', dot: true },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: active ? '#FFFBEB' : 'white', border: `1px solid ${active ? '#FDE68A' : '#E7E2DA'}`, borderRadius: '10px', marginBottom: '20px', flexWrap: 'wrap', transition: 'background 0.15s, border-color 0.15s' }}>
      {/* Search */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#A8A29E', pointerEvents: 'none' }}>
          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Buscar tarefa..."
          style={{ paddingLeft: '26px', paddingRight: filters.search ? '24px' : '10px', paddingTop: '5px', paddingBottom: '5px', borderRadius: '8px', border: `1px solid ${filters.search ? '#D97706' : '#E7E2DA'}`, background: filters.search ? '#FFFBEB' : 'white', fontSize: '12px', fontFamily: "'Outfit', sans-serif", outline: 'none', width: '180px', color: '#1C1917' }}
        />
        {filters.search && (
          <button onClick={() => onChange({ ...filters, search: '' })}
            style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>

      <div style={{ width: '1px', height: '20px', background: '#E7E2DA', flexShrink: 0 }} />

      <FilterDropdown label="Status" options={statusOptions} selected={filters.statuses}
        onChange={v => onChange({ ...filters, statuses: v })} accentColor="#D97706" />
      <FilterDropdown label="Responsável" options={responsibleOptions} selected={filters.responsible}
        onChange={v => onChange({ ...filters, responsible: v })} accentColor="#2563EB" />
      <FilterDropdown label="Prioridade" options={priorityOptions} selected={filters.priorities}
        onChange={v => onChange({ ...filters, priorities: v })} accentColor="#DC2626" />

      <button
        onClick={() => onChange({ ...filters, overdueOnly: !filters.overdueOnly })}
        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${filters.overdueOnly ? '#DC2626' : '#E7E2DA'}`, background: filters.overdueOnly ? '#FEF2F2' : 'white', color: filters.overdueOnly ? '#DC2626' : '#57534E', fontSize: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        ⚠ Atrasadas
      </button>

      {active > 0 && (
        <>
          <div style={{ width: '1px', height: '20px', background: '#E7E2DA', flexShrink: 0 }} />
          <button onClick={() => onChange(EMPTY_FILTERS)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: '1px solid #E7E2DA', background: 'white', color: '#78716C', fontSize: '12px', fontFamily: "'Outfit', sans-serif", cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ✕ Limpar filtros {active > 0 && <span style={{ background: '#F3F4F6', borderRadius: '10px', padding: '1px 5px', fontSize: '10px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#6B7280' }}>{active}</span>}
          </button>
        </>
      )}
    </div>
  )
}

// ── Styled select helpers ──────────────────────────────────────────────────

const baseSelect = {
  width: '100%', appearance: 'none', WebkitAppearance: 'none',
  cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 500, outline: 'none',
}

function SelectWrap({ color, children }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {children}
      <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '9px', color, lineHeight: 1 }}>▾</div>
    </div>
  )
}

function StatusSelect({ value, onChange }) {
  const { statusConfig, statusOrder } = useCfg()
  const cfg = statusConfig[value] || statusConfig.pending
  return (
    <SelectWrap color={cfg.color}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...baseSelect, padding: '4px 18px 4px 10px', border: `1.5px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, fontSize: '12px', borderRadius: '20px' }}>
        {statusOrder.map(s => <option key={s} value={s}>{statusConfig[s].labelFull}</option>)}
      </select>
    </SelectWrap>
  )
}

function PrioritySelect({ value, onChange }) {
  const cfg = value ? PRIORITY_CONFIG[value] : null
  return (
    <SelectWrap color={cfg?.color || '#A8A29E'}>
      <select value={value || ''} onChange={e => onChange(e.target.value || null)}
        style={{ ...baseSelect, padding: '4px 18px 4px 8px', border: `1px solid ${cfg?.border || '#E7E2DA'}`, background: cfg?.bg || '#F9FAFB', color: cfg?.color || '#A8A29E', fontSize: '11px', fontFamily: "'Syne', sans-serif", fontWeight: 600, borderRadius: '6px' }}>
        <option value="">Prioridade</option>
        <option value="high">● Alta</option>
        <option value="medium">● Média</option>
        <option value="low">● Baixa</option>
      </select>
    </SelectWrap>
  )
}

function ResponsibleSelect({ value, onChange }) {
  const { responsibleAreas } = useCfg()
  const area = value ? responsibleAreas.find(a => a.id === value) : null
  return (
    <SelectWrap color={area?.color || '#A8A29E'}>
      <select value={value || ''} onChange={e => onChange(e.target.value || null)}
        style={{ ...baseSelect, padding: '4px 18px 4px 8px', border: `1px solid ${area?.border || '#E7E2DA'}`, background: area?.bg || '#F9FAFB', color: area?.color || '#A8A29E', fontSize: '12px', borderRadius: '6px' }}>
        <option value="">Responsável</option>
        {responsibleAreas.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
    </SelectWrap>
  )
}

function DeadlineInput({ value, onChange, isOverdue }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input type="date" value={value || ''} onChange={e => onChange(e.target.value || null)}
        style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: `1px solid ${isOverdue ? '#FCA5A5' : '#E7E2DA'}`, background: isOverdue ? '#FEF2F2' : 'white', color: isOverdue ? '#DC2626' : '#57534E', fontSize: '12px', fontFamily: "'Outfit', sans-serif", cursor: 'pointer', outline: 'none' }} />
      {isOverdue && <span title="Atrasada" style={{ position: 'absolute', right: '-18px', fontSize: '13px', color: '#DC2626' }}>⚠</span>}
    </div>
  )
}

// ── DragHandle ──────────────────────────────────────────────────────────────
function DragHandle({ ...props }) {
  return (
    <div {...props} style={{ cursor: 'grab', color: '#D6D3D1', display: 'flex', alignItems: 'center', padding: '0 2px', userSelect: 'none', ...props.style }}>
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
        <circle cx="3" cy="3" r="1.2" fill="currentColor" />
        <circle cx="7" cy="3" r="1.2" fill="currentColor" />
        <circle cx="3" cy="7" r="1.2" fill="currentColor" />
        <circle cx="7" cy="7" r="1.2" fill="currentColor" />
        <circle cx="3" cy="11" r="1.2" fill="currentColor" />
        <circle cx="7" cy="11" r="1.2" fill="currentColor" />
      </svg>
    </div>
  )
}

// ── TaskRow ────────────────────────────────────────────────────────────────

function TaskRow({
  taskId, brandId, label, task, isCustom, tooltip,
  onUpdate, onDelete, onHide,
  phaseColor,
  // selection
  isSelected, onToggleSelect,
  // drag
  isDragging, isDragOver, onDragStart, onDragOver, onDragEnd, onDrop,
}) {
  const [editingTitle, setEditingTitle] = useState(isCustom && !task.title)
  const [titleDraft, setTitleDraft] = useState(isCustom ? (task.title || '') : (task.customTitle || label || ''))
  const [showNotes, setShowNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(task.description || '')
  const titleRef = useRef(null)

  const displayTitle = isCustom ? (task.title || '') : (task.customTitle || label)
  const isDone = task.status === 'done'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const isOverdue = task.deadline && new Date(task.deadline) < today && task.status !== 'done'

  useEffect(() => { if (editingTitle && titleRef.current) { titleRef.current.focus(); titleRef.current.select() } }, [editingTitle])
  useEffect(() => { setNotesDraft(task.description || '') }, [task.description])

  const saveTitle = () => {
    const t = titleDraft.trim()
    onUpdate(isCustom ? 'title' : 'customTitle', isCustom ? (t || 'Nova tarefa') : (t && t !== label ? t : null))
    setEditingTitle(false)
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={e => { e.preventDefault(); onDrop() }}
      onDragEnd={onDragEnd}
      style={{
        borderBottom: '1px solid #F7F4EF',
        background: isDragOver ? `${phaseColor}08` : isSelected ? `${phaseColor}06` : isOverdue ? '#FFFAFA' : isDone ? '#FAFFFE' : 'white',
        borderLeft: isDragOver ? `3px solid ${phaseColor}` : isOverdue ? '3px solid #FCA5A5' : isSelected ? `3px solid ${phaseColor}50` : '3px solid transparent',
        opacity: isDragging ? 0.4 : 1,
        transition: 'background 0.1s, border-color 0.1s, opacity 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '44px', padding: '4px 10px 4px 10px', gap: '6px' }}>

        {/* Checkbox */}
        <div style={{ width: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input type="checkbox" checked={isSelected} onChange={onToggleSelect}
            style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: phaseColor }} />
        </div>

        {/* Drag handle */}
        <DragHandle style={{ width: '16px', flexShrink: 0 }} />

        {/* Priority */}
        <div style={{ width: '88px', flexShrink: 0 }}>
          <PrioritySelect value={task.priority} onChange={p => onUpdate('priority', p)} />
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input ref={titleRef} value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
              onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleDraft(displayTitle); setEditingTitle(false) } }}
              placeholder={isCustom ? 'Digite o título...' : label}
              style={{ width: '100%', border: `1.5px solid ${phaseColor}60`, borderRadius: '5px', padding: '4px 8px', fontSize: '13px', fontFamily: "'Outfit', sans-serif", outline: 'none', background: 'white', color: '#1C1917', boxShadow: `0 0 0 3px ${phaseColor}10` }} />
          ) : (
            <div onClick={() => { setTitleDraft(displayTitle); setEditingTitle(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'text', padding: '4px 0' }}>
              {!isCustom && (
                tooltip ? (
                  <Tooltip text={tooltip}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="5.5" stroke="#D6D3D1" strokeWidth="1" />
                      <path d="M6 5v3.5" stroke="#A8A29E" strokeWidth="1.1" strokeLinecap="round" />
                      <circle cx="6" cy="3.5" r="0.55" fill="#A8A29E" />
                    </svg>
                  </Tooltip>
                ) : (
                  <span style={{ width: '12px', height: '12px', flexShrink: 0, display: 'inline-block' }} />
                )
              )}
              <span style={{ fontSize: '13px', fontFamily: "'Outfit', sans-serif", color: isDone ? '#A8A29E' : '#1C1917', textDecoration: isDone ? 'line-through' : 'none', textDecorationColor: '#D6D3D1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayTitle || <span style={{ color: '#D6D3D1', fontStyle: 'italic', fontSize: '12px' }}>Digite o título...</span>}
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}>
                <path d="M1.5 8l1.5-.5 4.5-4.5-.9-.9-4.5 4.5-.6 1.4zM7.5 2.5l.9.9" stroke="#9CA3AF" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ width: '158px', flexShrink: 0 }}>
          <StatusSelect value={task.status} onChange={s => onUpdate('status', s)} />
        </div>

        {/* Responsible */}
        <div style={{ width: '115px', flexShrink: 0 }}>
          <ResponsibleSelect value={task.assignee} onChange={r => onUpdate('assignee', r)} />
        </div>

        {/* Deadline */}
        <div style={{ width: '120px', flexShrink: 0, paddingRight: isOverdue ? '20px' : '0' }}>
          <DeadlineInput value={task.deadline} onChange={d => onUpdate('deadline', d)} isOverdue={isOverdue} />
        </div>

        {/* Notes */}
        <div style={{ width: '30px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setShowNotes(v => !v)} title={task.description ? 'Ver observações' : 'Adicionar observações'}
            style={{ background: showNotes ? phaseColor + '18' : 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: task.description ? phaseColor : '#D6D3D1', transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 3h9M2 6.5h6M2 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Delete / Hide */}
        <div style={{ width: '28px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => isCustom ? onDelete() : onHide()}
            title={isCustom ? 'Remover tarefa' : 'Ocultar tarefa'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#D6D3D1', fontSize: '17px', lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}>
            ×
          </button>
        </div>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div style={{ padding: '8px 14px 10px 108px', background: '#FAFAF8', borderTop: '1px solid #F0EDE8' }}>
          <RichTextEditor
            value={notesDraft}
            onChange={v => { setNotesDraft(v); onUpdate('description', v) }}
            placeholder="Observações, contexto, links, bloqueios..."
            brandId={brandId}
            reqId={taskId}
          />
        </div>
      )}
    </div>
  )
}

// ── SectionBlock ────────────────────────────────────────────────────────────

function SectionBlock({
  section, phaseColor,
  tasks, data, customTasksList, brandId,
  onUpdateTask, onUpdateCustomTask, onAddCustomTask, onDeleteCustomTask,
  hideTask, showTask,
  hiddenReqIds,
  taskOrder,
  onReorder,
  // selection
  selectedIds, onToggleSelect,
  // filters
  filters,
}) {
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [showHidden, setShowHidden] = useState(false)

  // Build ordered list of visible task IDs
  const visibleReqIds = section.requirements.map(r => r.id).filter(id => !hiddenReqIds.has(id))
  const customIds = customTasksList.map(t => t.id)
  const allVisibleIds = [...visibleReqIds, ...customIds]

  // Apply stored order
  const storedOrder = taskOrder?.[brandId]?.[section.id]
  let orderedIds = allVisibleIds
  if (storedOrder) {
    const orderMap = new Map(storedOrder.map((id, i) => [id, i]))
    orderedIds = [...allVisibleIds].sort((a, b) => {
      const ia = orderMap.has(a) ? orderMap.get(a) : Infinity
      const ib = orderMap.has(b) ? orderMap.get(b) : Infinity
      return ia - ib
    })
  }

  // All tasks lookup
  const taskById = {}
  section.requirements.forEach(req => {
    taskById[req.id] = { ...req, task: tasks[brandId]?.[req.id] || { status: 'pending', assignee: null, deadline: null, description: '', priority: null, customTitle: null }, isCustom: false }
  })
  customTasksList.forEach(ct => {
    taskById[ct.id] = { id: ct.id, label: ct.title, task: ct, isCustom: true }
  })

  // Apply filters
  const isFiltering = countActiveFilters(filters) > 0
  const visibleFilteredIds = isFiltering
    ? orderedIds.filter(id => {
        const item = taskById[id]
        if (!item) return false
        const displayTitle = item.isCustom ? (item.task.title || '') : (item.task.customTitle || item.label || '')
        return taskMatchesFilters(item.task, displayTitle, filters)
      })
    : orderedIds

  const hiddenReqs = section.requirements.filter(r => hiddenReqIds.has(r.id))
  const stats = getSectionStats(data || tasks, brandId, section)
  const sectionSelectedIds = orderedIds.filter(id => selectedIds.has(id))
  const allSelected = orderedIds.length > 0 && sectionSelectedIds.length === orderedIds.length
  const someSelected = sectionSelectedIds.length > 0 && !allSelected

  const handleDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return }
    const newOrder = [...orderedIds]
    const fromIdx = newOrder.indexOf(draggingId)
    const toIdx = newOrder.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, draggingId)
    onReorder(brandId, section.id, newOrder)
    setDraggingId(null)
    setDragOverId(null)
  }

  return (
    <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
      {/* Section header */}
      <div style={{ padding: '8px 12px 8px 16px', background: '#FAFAF8', borderBottom: '1px solid #F0EDE8', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Select all checkbox */}
        <input type="checkbox"
          checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected }}
          onChange={() => {
            if (allSelected) orderedIds.forEach(id => selectedIds.has(id) && onToggleSelect(id))
            else orderedIds.forEach(id => !selectedIds.has(id) && onToggleSelect(id))
          }}
          style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: phaseColor, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.6px', flex: 1 }}>
          {section.name}
        </span>
        <span style={{ fontSize: '11px', color: isFiltering && visibleFilteredIds.length < orderedIds.length ? '#D97706' : '#A8A29E' }}>
          {isFiltering ? `${visibleFilteredIds.length} de ${orderedIds.length}` : `${orderedIds.length}`} tarefa{orderedIds.length !== 1 ? 's' : ''}
        </span>
        <div style={{ minWidth: '130px' }}>
          <ProgressBar pct={stats.pct} color={phaseColor} height={4} showPct showCount done={stats.done} total={stats.total} />
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 10px 5px 10px', background: '#F7F4EF', borderBottom: '1px solid #EDEBE6', gap: '6px' }}>
        <div style={{ width: '24px', flexShrink: 0 }} />
        <div style={{ width: '16px', flexShrink: 0 }} />
        {[
          { label: 'Prioridade', width: '88px' },
          { label: 'Tarefa', flex: true },
          { label: 'Status', width: '158px' },
          { label: 'Responsável', width: '115px' },
          { label: 'Prazo', width: '120px' },
        ].map(col => (
          <div key={col.label} style={{ width: col.width, flex: col.flex ? 1 : undefined, flexShrink: 0 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{col.label}</span>
          </div>
        ))}
        <div style={{ width: '30px', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Obs.</span>
        </div>
        <div style={{ width: '28px', flexShrink: 0 }} />
      </div>

      {/* Task rows */}
      {isFiltering && visibleFilteredIds.length === 0 && orderedIds.length > 0 && (
        <div style={{ padding: '14px 16px', fontSize: '12px', color: '#A8A29E', fontFamily: "'Outfit', sans-serif", textAlign: 'center', borderBottom: '1px solid #F7F4EF' }}>
          Nenhuma tarefa corresponde aos filtros ativos.
        </div>
      )}
      {visibleFilteredIds.map(id => {
        const item = taskById[id]
        if (!item) return null
        return (
          <TaskRow
            key={id}
            taskId={id}
            brandId={brandId}
            label={item.label}
            tooltip={item.tooltip}
            task={item.task}
            isCustom={item.isCustom}
            phaseColor={phaseColor}
            isSelected={selectedIds.has(id)}
            onToggleSelect={() => onToggleSelect(id)}
            isDragging={draggingId === id}
            isDragOver={dragOverId === id}
            onDragStart={() => setDraggingId(id)}
            onDragOver={() => setDragOverId(id)}
            onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
            onDrop={() => handleDrop(id)}
            onUpdate={(field, value) =>
              item.isCustom
                ? onUpdateCustomTask(brandId, section.id, id, field, value)
                : onUpdateTask(brandId, id, field, value)
            }
            onDelete={() => onDeleteCustomTask(brandId, section.id, id)}
            onHide={() => hideTask(brandId, id)}
          />
        )
      })}

      {/* Hidden tasks reveal */}
      {hiddenReqs.length > 0 && (
        <div style={{ borderTop: '1px dashed #E7E2DA' }}>
          <button onClick={() => setShowHidden(v => !v)}
            style={{ width: '100%', padding: '7px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: "'Outfit', sans-serif", color: '#A8A29E' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showHidden ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {hiddenReqs.length} requisito{hiddenReqs.length !== 1 ? 's' : ''} oculto{hiddenReqs.length !== 1 ? 's' : ''}
          </button>
          {showHidden && (
            <div style={{ padding: '0 12px 8px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {hiddenReqs.map(req => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: '#F9F7F4', borderRadius: '6px', border: '1px solid #F0EDE8' }}>
                  <span style={{ fontSize: '12px', color: '#A8A29E', textDecoration: 'line-through' }}>{req.label}</span>
                  <button onClick={() => showTask(brandId, req.id)}
                    style={{ background: 'none', border: '1px solid #E7E2DA', cursor: 'pointer', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: "'Outfit', sans-serif", color: '#78716C', whiteSpace: 'nowrap' }}>
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add task */}
      <div style={{ padding: '7px 16px', borderTop: '1px dashed #EDEBE6' }}>
        <button onClick={() => onAddCustomTask(brandId, section.id)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: '5px', fontSize: '12px', fontFamily: "'Outfit', sans-serif", color: '#A8A29E' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6.5 4v5M4 6.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Adicionar tarefa
        </button>
      </div>
    </div>
  )
}

// ── PhaseCard ───────────────────────────────────────────────────────────────

function PhaseCard({ phase, data, tasks, customTasks, taskOrder, hiddenTasks, brandId, isInitiallyOpen,
  onUpdateTask, onUpdateCustomTask, onAddCustomTask, onDeleteCustomTask, hideTask, showTask, onReorder,
  selectedIds, onToggleSelect, filters }) {
  const [open, setOpen] = useState(isInitiallyOpen)
  const stats = getBrandPhaseStats(data || tasks, brandId, phase.id)
  const hiddenSet = new Set(hiddenTasks?.[brandId] || [])

  return (
    <div style={{ marginBottom: '16px' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '13px 20px', background: open ? phase.colorLight : 'white', border: `1px solid ${open ? phase.colorMuted : '#E7E2DA'}`, borderRadius: open ? '12px 12px 0 0' : '12px', borderLeft: `4px solid ${phase.color}`, transition: 'background 0.15s, border-color 0.15s' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 300, color: phase.color, opacity: 0.35, lineHeight: 1, width: '32px', flexShrink: 0 }}>{phase.number}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700, color: phase.color, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1px' }}>Fase {phase.number}</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1C1917' }}>{phase.name}</div>
            <div style={{ fontSize: '11px', color: '#A8A29E', marginTop: '1px' }}>{phase.tagline}</div>
          </div>
          <div style={{ minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ProgressBar pct={stats.pct} color={phase.color} height={6} showPct showCount done={stats.done} total={stats.total} />
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#A8A29E', flexShrink: 0 }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{ background: phase.colorLight, border: `1px solid ${phase.colorMuted}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '12px' }}>
          {phase.sections.map(section => (
            <SectionBlock
              key={section.id}
              section={section}
              phaseColor={phase.color}
              tasks={tasks}
              data={data}
              customTasksList={customTasks?.[brandId]?.[section.id] || []}
              brandId={brandId}
              onUpdateTask={onUpdateTask}
              onUpdateCustomTask={onUpdateCustomTask}
              onAddCustomTask={onAddCustomTask}
              onDeleteCustomTask={onDeleteCustomTask}
              hideTask={hideTask}
              showTask={showTask}
              hiddenReqIds={hiddenSet}
              taskOrder={taskOrder}
              onReorder={onReorder}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              filters={filters}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── BulkActionBar ───────────────────────────────────────────────────────────

function BulkActionBar({ count, brandId, onApply, onClear }) {
  const { statusConfig, statusOrder, responsibleAreas } = useCfg()
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkResponsible, setBulkResponsible] = useState('')
  const [bulkPriority, setBulkPriority] = useState('')

  const canApply = bulkStatus || bulkResponsible || bulkPriority

  const apply = () => {
    const updates = {}
    if (bulkStatus) updates.status = bulkStatus
    if (bulkResponsible) updates.assignee = bulkResponsible
    if (bulkPriority) updates.priority = bulkPriority
    onApply(updates)
    setBulkStatus(''); setBulkResponsible(''); setBulkPriority('')
  }

  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, background: '#1C1917', borderRadius: '14px', padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      minWidth: '680px', flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>
        {count} selecionada{count !== 1 ? 's' : ''}
      </span>

      <div style={{ width: '1px', height: '20px', background: '#3F3B37', flexShrink: 0 }} />

      {/* Status */}
      <div style={{ position: 'relative', minWidth: '160px' }}>
        <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
          style={{ width: '100%', padding: '6px 24px 6px 10px', borderRadius: '8px', border: '1px solid #3F3B37', background: '#2A2724', color: bulkStatus ? statusConfig[bulkStatus]?.color : '#9CA3AF', fontSize: '12px', fontFamily: "'Outfit', sans-serif", fontWeight: 500, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
          <option value="">Status...</option>
          {statusOrder.map(s => <option key={s} value={s}>{statusConfig[s].labelFull}</option>)}
        </select>
        <div style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '9px', color: '#9CA3AF' }}>▾</div>
      </div>

      {/* Responsible */}
      <div style={{ position: 'relative', minWidth: '130px' }}>
        <select value={bulkResponsible} onChange={e => setBulkResponsible(e.target.value)}
          style={{ width: '100%', padding: '6px 24px 6px 10px', borderRadius: '8px', border: '1px solid #3F3B37', background: '#2A2724', color: bulkResponsible ? responsibleAreas.find(a => a.id === bulkResponsible)?.color : '#9CA3AF', fontSize: '12px', fontFamily: "'Outfit', sans-serif", fontWeight: 500, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
          <option value="">Responsável...</option>
          {responsibleAreas.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <div style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '9px', color: '#9CA3AF' }}>▾</div>
      </div>

      {/* Priority */}
      <div style={{ position: 'relative', minWidth: '120px' }}>
        <select value={bulkPriority} onChange={e => setBulkPriority(e.target.value)}
          style={{ width: '100%', padding: '6px 24px 6px 10px', borderRadius: '8px', border: '1px solid #3F3B37', background: '#2A2724', color: bulkPriority ? PRIORITY_CONFIG[bulkPriority]?.color : '#9CA3AF', fontSize: '12px', fontFamily: "'Outfit', sans-serif", fontWeight: 500, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
          <option value="">Prioridade...</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
        <div style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '9px', color: '#9CA3AF' }}>▾</div>
      </div>

      <button onClick={apply} disabled={!canApply}
        style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: canApply ? '#1D9E75' : '#3F3B37', color: canApply ? 'white' : '#9CA3AF', fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 700, cursor: canApply ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: 'background 0.15s' }}>
        Aplicar
      </button>

      <button onClick={onClear}
        style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #3F3B37', background: 'none', color: '#78716C', fontFamily: "'Outfit', sans-serif", fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        Cancelar
      </button>
    </div>
  )
}

// ── BrandProfile ─────────────────────────────────────────────────────────────

function BrandLogo({ logoUrl, initials, size = 48 }) {
  const [imgError, setImgError] = useState(false)
  if (logoUrl && !imgError) {
    return (
      <img src={logoUrl} alt={initials} onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '10px', objectFit: 'contain', border: '1px solid #E7E2DA', background: 'white', flexShrink: 0 }} />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '10px', background: '#F0FDF4', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', serif", fontSize: Math.round(size * 0.33) + 'px', fontWeight: 600, color: '#1D9E75', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function MetricChip({ label, value, format }) {
  if (value == null) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 12px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E7E2DA' }}>
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: '16px', color: '#D1D5DB' }}>—</span>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '9px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>{label}</span>
    </div>
  )
  const formatted = format === 'pct' ? `${Number(value).toFixed(1)}%`
    : format === 'brl' ? `R$${Number(value).toFixed(0)}`
    : Number(value).toLocaleString('pt-BR')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 12px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: '16px', color: '#16A34A', letterSpacing: '-0.3px' }}>{formatted}</span>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '9px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>{label}</span>
    </div>
  )
}

function LinkButton({ href, label, color, bg, border }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${border || '#E7E2DA'}`, background: bg || 'white', color: color || '#57534E', fontSize: '12px', fontFamily: "'Outfit', sans-serif", textDecoration: 'none', whiteSpace: 'nowrap' }}>
      ↗ {label}
    </a>
  )
}

function BrandProfile({ brand, brandSettings, brandMetrics, appSettings, saveBrandMetrics }) {
  const [loading, setLoading] = useState(false)
  const s = brandSettings || {}
  const m = brandMetrics || {}
  const displayName = s.customName || brand.name
  const segment = s.customSegment || brand.segment

  async function refresh() {
    setLoading(true)
    try {
      const result = await fetchBrandMetrics(appSettings, s.metabaseCards)
      if (result) saveBrandMetrics(brand.id, result)
    } finally {
      setLoading(false)
    }
  }

  const hasLinks = s.links?.ga4 || s.links?.storeUrl || s.links?.shopify || s.links?.drive
  const hasMetabaseCards = s.metabaseCards && Object.values(s.metabaseCards).some(v => v != null)

  return (
    <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: (hasLinks || hasMetabaseCards) ? '12px' : 0 }}>
        <BrandLogo logoUrl={s.logoUrl} initials={brand.initials} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 400, color: '#1C1917', letterSpacing: '-0.3px' }}>{displayName}</div>
          <div style={{ fontSize: '12px', color: '#78716C' }}>{segment}</div>
        </div>
        {(hasLinks || hasMetabaseCards) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[['cvr', 'CVR', 'pct'], ['aov', 'AOV', 'brl'], ['rpv', 'RPV', 'brl'], ['sessions', 'Sessões', 'num'], ['revenue', 'Receita', 'brl']].map(([k, l, fmt]) => (
              <MetricChip key={k} label={l} value={m[k] ?? null} format={fmt} />
            ))}
          </div>
        )}
      </div>
      {(hasLinks || hasMetabaseCards) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #F0EDE8' }}>
          <LinkButton href={s.links?.ga4} label="GA4" color="#D97706" bg="#FFFBEB" border="#FDE68A" />
          <LinkButton href={s.links?.storeUrl} label="Link da loja" color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
          <LinkButton href={s.links?.shopify} label="Shopify Admin" color="#059669" bg="#ECFDF5" border="#A7F3D0" />
          <LinkButton href={s.links?.drive} label="Drive" color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" />
          {hasMetabaseCards && (
            <button onClick={refresh} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E7E2DA', background: loading ? '#F9FAFB' : 'white', color: loading ? '#A8A29E' : '#57534E', fontSize: '12px', fontFamily: "'Outfit', sans-serif", cursor: loading ? 'not-allowed' : 'pointer', marginLeft: 'auto' }}>
              {loading ? '...' : '⟳'} {loading ? 'Atualizando' : 'Atualizar métricas'}
            </button>
          )}
          {m.updatedAt && (
            <span style={{ fontSize: '11px', color: '#A8A29E', fontFamily: "'Outfit', sans-serif" }}>
              {m.period} · {new Date(m.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── BrandView (main) ────────────────────────────────────────────────────────

export default function BrandView({
  data, mergedPhases, updateTask, addCustomTask, updateCustomTask, deleteCustomTask,
  reorderSection, hideTask, showTask, bulkUpdateTasks,
  updateBrandSetting, saveBrandMetrics,
  selectedBrand, selectedPhase, onSelectBrand,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const phases = mergedPhases || PHASES
  const brand = VISIBLE_BRANDS.find(b => b.id === selectedBrand) || VISIBLE_BRANDS[0]

  const statusConfig = buildStatusConfig(data.appSettings)
  const responsibleAreas = buildResponsibleAreas(data.appSettings)

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const clearSelection = () => setSelectedIds(new Set())

  // Clear selection and filters when brand changes
  useEffect(() => { clearSelection(); setFilters(EMPTY_FILTERS) }, [selectedBrand])

  const handleBulkApply = (updates) => {
    bulkUpdateTasks(selectedBrand, [...selectedIds], updates)
    clearSelection()
  }

  return (
    <CfgCtx.Provider value={{ statusConfig, statusOrder: STATUS_ORDER, responsibleAreas }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', paddingBottom: selectedIds.size > 0 ? '100px' : '32px' }} className="page-pad brand-page">
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 400, color: '#1C1917', letterSpacing: '-0.5px', marginBottom: '4px' }}>Por Marca</h1>
        <p style={{ color: '#78716C', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}>
          Clique no título para editar · arraste ⠿ para reordenar · marque itens para editar em massa
        </p>
      </div>

      {/* Brand selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px', padding: '12px', background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px' }}>
        {VISIBLE_BRANDS.map(b => {
          const isActive = b.id === selectedBrand
          const bs = data.brandSettings?.[b.id] || {}
          return (
            <button key={b.id} onClick={() => onSelectBrand(b.id)}
              style={{ padding: '14px 22px', borderRadius: '8px', border: isActive ? '1.5px solid #1D9E75' : '1.5px solid transparent', background: isActive ? '#F0FDF4' : '#F7F4EF', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: isActive ? 600 : 400, color: isActive ? '#16A34A' : '#57534E', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}>
              <BrandLogo logoUrl={bs.logoUrl} initials={b.initials} size={28} />
              <span>{b.name}</span>
            </button>
          )
        })}
      </div>

      {/* Brand profile */}
      <BrandProfile
        brand={brand}
        brandSettings={data.brandSettings?.[selectedBrand]}
        brandMetrics={data.brandMetrics?.[selectedBrand]}
        appSettings={data.appSettings}
        saveBrandMetrics={saveBrandMetrics}
      />

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Phase cards */}
      {phases.map((phase, i) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          data={data}
          tasks={data.tasks}
          customTasks={data.customTasks || {}}
          taskOrder={data.taskOrder || {}}
          hiddenTasks={data.hiddenTasks || {}}
          brandId={selectedBrand}
          isInitiallyOpen={phase.id === selectedPhase || (selectedPhase === null && i === 0)}
          onUpdateTask={updateTask}
          onUpdateCustomTask={updateCustomTask}
          onAddCustomTask={addCustomTask}
          onDeleteCustomTask={deleteCustomTask}
          hideTask={hideTask}
          showTask={showTask}
          onReorder={reorderSection}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          filters={filters}
        />
      ))}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          brandId={selectedBrand}
          onApply={handleBulkApply}
          onClear={clearSelection}
        />
      )}
    </div>
    </CfgCtx.Provider>
  )
}

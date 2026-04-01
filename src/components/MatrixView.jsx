import { useState, useRef, useEffect, createContext, useContext } from 'react'
import Tooltip from './Tooltip'
import RichTextEditor from './RichTextEditor'
import { VISIBLE_BRANDS, PHASES } from '../data/phases'
import { STATUS_CONFIG, STATUS_ORDER } from '../data/statusConfig'

// ── Config context ────────────────────────────────────────────────────────────

const MatrixCfgCtx = createContext(null)
function useMatrixCfg() { return useContext(MatrixCfgCtx) }

function buildStatusConfig(appSettings) {
  const labels = appSettings?.statusLabels || {}
  const cfg = {}
  STATUS_ORDER.forEach(id => {
    cfg[id] = { ...STATUS_CONFIG[id] }
    if (labels[id]) { cfg[id].label = labels[id]; cfg[id].labelFull = labels[id] }
  })
  return cfg
}

// ── StatusCell ───────────────────────────────────────────────────────────────

function StatusCell({ status, onChange }) {
  const { statusConfig } = useMatrixCfg()
  const cfg = statusConfig[status] || statusConfig.pending
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={status}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '5px 20px 5px 8px',
          borderRadius: '8px', border: `1.5px solid ${cfg.border}`,
          background: cfg.bg, color: cfg.color, fontSize: '11px',
          fontFamily: "'Outfit', sans-serif", fontWeight: 500,
          cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
          outline: 'none', textAlign: 'center', minWidth: '110px',
        }}
      >
        {STATUS_ORDER.map(s => (
          <option key={s} value={s}>{statusConfig[s].label}</option>
        ))}
      </select>
      <div style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '9px', color: cfg.color }}>▾</div>
    </div>
  )
}

// ── DragHandle ───────────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <div style={{ cursor: 'grab', color: '#D6D3D1', display: 'flex', alignItems: 'center', padding: '0 3px', userSelect: 'none', flexShrink: 0 }}>
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

// ── Build sorted + filtered task list ────────────────────────────────────────

function buildTaskList(section, phaseCustomTasks, phaseTaskOrder, phaseHiddenTasks, phaseTitles, phaseNotes) {
  const hiddenSet = new Set(phaseHiddenTasks || [])
  const builtIn = section.requirements
    .filter(r => !hiddenSet.has(r.id))
    .map(r => ({
      id: r.id,
      label: (phaseTitles || {})[r.id] || r.label,
      originalLabel: r.label,
      tooltip: r.tooltip,
      isCustom: false,
      notes: (phaseNotes || {})[r.id] || '',
    }))
  const custom = (phaseCustomTasks?.[section.id] || [])
    .map(ct => ({
      id: ct.id,
      label: ct.title || '',
      originalLabel: '',
      tooltip: '',
      isCustom: true,
      notes: (phaseNotes || {})[ct.id] || '',
    }))
  const combined = [...builtIn, ...custom]
  const order = phaseTaskOrder?.[section.id]
  if (order?.length) {
    const orderMap = new Map(order.map((id, i) => [id, i]))
    combined.sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999))
  }
  return combined
}

// ── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({
  task, phase, data, updateTask,
  onDelete, onUpdateTitle, onUpdateNote,
  isDragging, isDragOver,
  onDragStart, onDragOver, onDragEnd, onDrop,
}) {
  const [editingTitle, setEditingTitle] = useState(task.isCustom && !task.label)
  const [titleDraft, setTitleDraft] = useState(task.label || '')
  const [showNotes, setShowNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(task.notes || '')
  const titleRef = useRef(null)

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus()
      titleRef.current.select()
    }
  }, [editingTitle])

  useEffect(() => { setNotesDraft(task.notes || '') }, [task.notes])

  function startEditing() {
    setTitleDraft(task.label || '')
    setEditingTitle(true)
  }

  function commitTitle() {
    const trimmed = titleDraft.trim()
    if (trimmed || !task.isCustom) onUpdateTitle(task.id, trimmed)
    setEditingTitle(false)
  }

  const hasNotes = !!(task.notes && task.notes.trim())
  const colSpan = VISIBLE_BRANDS.length + 2

  return (
    <>
      <tr
        draggable
        onDragStart={onDragStart}
        onDragOver={e => { e.preventDefault(); onDragOver() }}
        onDragEnd={onDragEnd}
        onDrop={e => { e.preventDefault(); onDrop() }}
        style={{
          background: isDragOver ? phase.colorLight : 'white',
          opacity: isDragging ? 0.4 : 1,
          borderBottom: showNotes ? 'none' : '1px solid #F7F4EF',
          transition: 'background 0.1s',
          outline: isDragOver ? `2px solid ${phase.color}` : 'none',
          outlineOffset: '-2px',
        }}
      >
        {/* Label cell */}
        <td style={{ padding: '8px 12px 8px 6px', borderRight: '1px solid #F0EDE8', minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DragHandle />
            {editingTitle ? (
              <input
                ref={titleRef}
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                placeholder={task.isCustom ? 'Nome da tarefa...' : task.originalLabel}
                style={{
                  flex: 1, padding: '3px 8px', border: `1.5px solid ${phase.color}`,
                  borderRadius: '6px', fontSize: '13px', fontFamily: "'Outfit', sans-serif",
                  outline: 'none', background: phase.colorLight, color: '#1C1917',
                }}
              />
            ) : (
              <span
                onClick={startEditing}
                title="Clique para editar"
                style={{
                  cursor: 'text', fontFamily: "'Outfit', sans-serif", fontSize: '13px',
                  color: (task.isCustom && !task.label) ? '#A8A29E' : '#1C1917',
                  fontStyle: (task.isCustom && !task.label) ? 'italic' : 'normal',
                  flex: 1, padding: '2px 4px', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                <span style={{ flex: 1 }}>{task.label || 'Clique para nomear...'}</span>
                {hasNotes && (
                  <span title="Tem observação" style={{ width: '5px', height: '5px', borderRadius: '50%', background: phase.color, flexShrink: 0, opacity: 0.7 }} />
                )}
                {!task.isCustom && task.tooltip && (
                  <Tooltip text={task.tooltip}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                      <circle cx="5.5" cy="5.5" r="5" stroke="#D6D3D1" strokeWidth="1" />
                      <path d="M5.5 4.5v3" stroke="#A8A29E" strokeWidth="1.1" strokeLinecap="round" />
                      <circle cx="5.5" cy="3.2" r="0.5" fill="#A8A29E" />
                    </svg>
                  </Tooltip>
                )}
              </span>
            )}
          </div>
        </td>

        {/* Brand status cells */}
        {VISIBLE_BRANDS.map(brand => {
          const status = data.tasks[brand.id]?.[task.id]?.status || 'pending'
          return (
            <td key={brand.id} style={{ padding: '6px 8px', textAlign: 'center' }}>
              <StatusCell status={status} onChange={s => updateTask(brand.id, task.id, 'status', s)} />
            </td>
          )
        })}

        {/* Action buttons */}
        <td style={{ padding: '6px 8px', textAlign: 'center', width: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
            <button
              onClick={() => setShowNotes(v => !v)}
              title="Observação"
              style={{
                background: showNotes ? phase.colorLight : 'none',
                border: showNotes ? `1px solid ${phase.colorMuted}` : 'none',
                cursor: 'pointer', color: hasNotes ? phase.color : '#D6D3D1',
                padding: '2px 5px', borderRadius: '4px', lineHeight: 1, transition: 'color 0.1s',
              }}
              onMouseEnter={e => { if (!hasNotes && !showNotes) e.currentTarget.style.color = '#9CA3AF' }}
              onMouseLeave={e => { if (!hasNotes && !showNotes) e.currentTarget.style.color = '#D6D3D1' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 2h10v7H7l-2 2-1-2H1V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              title={task.isCustom ? 'Excluir tarefa' : 'Ocultar desta fase'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D6D3D1', fontSize: '17px', lineHeight: 1, padding: '2px 5px', borderRadius: '4px', transition: 'color 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#D6D3D1'}
            >×</button>
          </div>
        </td>
      </tr>

      {/* Notes row */}
      {showNotes && (
        <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F7F4EF' }}>
          <td colSpan={colSpan} style={{ padding: '6px 20px 10px 30px' }}>
            <RichTextEditor
              value={notesDraft}
              onChange={v => { setNotesDraft(v); onUpdateNote(task.id, v) }}
              placeholder="Observação sobre esta tarefa..."
            />
          </td>
        </tr>
      )}
    </>
  )
}

// ── SectionBlock ─────────────────────────────────────────────────────────────

function SectionBlock({
  section, phase, data, updateTask,
  phaseCustomTasks, phaseTaskOrder, phaseHiddenTasks, phaseTitles, phaseNotes,
  onAddTask, onUpdatePhaseTask, onDeleteTask, onRestoreTask, onReorderSection,
  onUpdateTitleOverride, onUpdateNote,
  sectionIndex,
}) {
  const [dragId, setDragId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [showHidden, setShowHidden] = useState(false)

  const tasks = buildTaskList(section, phaseCustomTasks, phaseTaskOrder, phaseHiddenTasks, phaseTitles, phaseNotes)
  const hiddenReqs = section.requirements.filter(r => (phaseHiddenTasks || []).includes(r.id))
  const colSpan = VISIBLE_BRANDS.length + 2

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) return
    const ids = tasks.map(t => t.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    const newOrder = [...ids]
    newOrder.splice(from, 1)
    newOrder.splice(to, 0, dragId)
    onReorderSection(section.id, newOrder)
    setDragId(null)
    setDragOverId(null)
  }

  function handleTitleUpdate(taskId, newTitle) {
    if (taskId.startsWith('custom_phase_')) {
      onUpdatePhaseTask(section.id, taskId, 'title', newTitle)
    } else {
      onUpdateTitleOverride(taskId, newTitle)
    }
  }

  return (
    <>
      {/* Section header */}
      <tr>
        <td
          colSpan={colSpan}
          style={{
            padding: '7px 20px',
            fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700,
            color: phase.color, textTransform: 'uppercase', letterSpacing: '0.8px',
            background: phase.colorLight,
            borderTop: sectionIndex > 0 ? '2px solid #E7E2DA' : 'none',
            borderBottom: `1px solid ${phase.colorMuted}`,
          }}
        >
          {section.name}
        </td>
      </tr>

      {/* Task rows */}
      {tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          phase={phase}
          data={data}
          updateTask={updateTask}
          onDelete={id => onDeleteTask(section.id, id)}
          onUpdateTitle={handleTitleUpdate}
          onUpdateNote={onUpdateNote}
          isDragging={dragId === task.id}
          isDragOver={dragOverId === task.id && dragId !== task.id}
          onDragStart={() => setDragId(task.id)}
          onDragOver={() => setDragOverId(task.id)}
          onDragEnd={() => { setDragId(null); setDragOverId(null) }}
          onDrop={() => handleDrop(task.id)}
        />
      ))}

      {/* Hidden tasks toggle */}
      {hiddenReqs.length > 0 && (
        <tr>
          <td colSpan={colSpan} style={{ padding: '5px 20px', borderTop: '1px dashed #E7E2DA' }}>
            <button
              onClick={() => setShowHidden(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '11px', color: '#A8A29E', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span style={{ fontSize: '9px' }}>{showHidden ? '▲' : '▼'}</span>
              {hiddenReqs.length} tarefa{hiddenReqs.length > 1 ? 's' : ''} oculta{hiddenReqs.length > 1 ? 's' : ''}
            </button>
          </td>
        </tr>
      )}
      {showHidden && hiddenReqs.map(req => (
        <tr key={req.id} style={{ background: '#F9FAFB' }}>
          <td style={{ padding: '7px 20px', borderRight: '1px solid #F0EDE8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '16px', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#C4B5A0', textDecoration: 'line-through' }}>{req.label}</span>
              <button
                onClick={() => onRestoreTask(req.id)}
                style={{ fontSize: '11px', color: phase.color, background: 'none', border: `1px solid ${phase.colorMuted}`, borderRadius: '4px', padding: '1px 8px', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Restaurar
              </button>
            </div>
          </td>
          <td colSpan={VISIBLE_BRANDS.length + 1} />
        </tr>
      ))}

      {/* Add task row */}
      <tr>
        <td colSpan={colSpan} style={{ padding: '6px 20px 10px' }}>
          <button
            onClick={() => onAddTask(section.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: `1px dashed ${phase.colorMuted}`, borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '12px', color: phase.color, fontWeight: 500, transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = phase.colorLight}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            + Adicionar tarefa
          </button>
        </td>
      </tr>
    </>
  )
}

// ── MatrixView ────────────────────────────────────────────────────────────────

export default function MatrixView({
  data, updateTask, exportCSV,
  addPhaseTask, updatePhaseTask, deletePhaseTask, showPhaseTask, reorderPhaseSection,
  updatePhaseTitleOverride, updatePhaseNote,
}) {
  const [selectedPhase, setSelectedPhase] = useState(PHASES[0].id)
  const phase = PHASES.find(p => p.id === selectedPhase)
  const statusConfig = buildStatusConfig(data.appSettings)

  return (
    <MatrixCfgCtx.Provider value={{ statusConfig }}>
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 400, color: '#1C1917', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Por Fase
          </h1>
          <p style={{ color: '#78716C', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}>
            Gerencie o checklist de cada fase — adicione, reordene e oculte tarefas. Edite status por marca diretamente nas células.
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'white', border: '1px solid #E7E2DA', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, color: '#57534E', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Phase selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPhase(p.id)}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              border: `1.5px solid ${selectedPhase === p.id ? p.color : '#E7E2DA'}`,
              background: selectedPhase === p.id ? p.colorLight : 'white',
              cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: '12px',
              fontWeight: selectedPhase === p.id ? 700 : 500,
              color: selectedPhase === p.id ? p.color : '#78716C',
              transition: 'all 0.15s ease',
            }}
          >
            Fase {p.number} — {p.name}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      {phase && (
        <div style={{ background: 'white', border: '1px solid #E7E2DA', borderRadius: '12px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E7E2DA', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.6px', minWidth: '280px', borderRight: '1px solid #F0EDE8' }}>
                  Tarefa
                </th>
                {VISIBLE_BRANDS.map(brand => (
                  <th key={brand.id} style={{ padding: '10px 8px', textAlign: 'center', fontFamily: "'Outfit', sans-serif", fontSize: '12px', fontWeight: 500, color: '#57534E', minWidth: '120px' }}>
                    {brand.name}
                  </th>
                ))}
                <th style={{ width: '60px' }} />
              </tr>
            </thead>
            <tbody>
              {phase.sections.map((section, si) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  phase={phase}
                  data={data}
                  updateTask={updateTask}
                  phaseCustomTasks={data.phaseCustomTasks}
                  phaseTaskOrder={data.phaseTaskOrder}
                  phaseHiddenTasks={data.phaseHiddenTasks}
                  phaseTitles={data.phaseTitles}
                  phaseNotes={data.phaseNotes}
                  onAddTask={addPhaseTask}
                  onUpdatePhaseTask={updatePhaseTask}
                  onDeleteTask={deletePhaseTask}
                  onRestoreTask={showPhaseTask}
                  onReorderSection={reorderPhaseSection}
                  onUpdateTitleOverride={updatePhaseTitleOverride}
                  onUpdateNote={updatePhaseNote}
                  sectionIndex={si}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </MatrixCfgCtx.Provider>
  )
}

import { PHASES, VISIBLE_BRANDS } from '../data/phases'

// 'done' = finalizado; 'active' = in_progress | waiting_client | validating; 'pending' = pending
export function categorize(status) {
  if (status === 'done') return 'done'
  if (!status || status === 'pending') return 'pending'
  return 'in_progress' // in_progress, waiting_client, validating all count as active
}

// Accepts full `data` object to count per-brand custom tasks and phase tasks.
// Also backward-compatible if called with raw `tasks` (fields will just be empty/undefined).
export function getBrandPhaseStats(data, brandId, phaseId, phases = PHASES) {
  const phase = phases.find(p => p.id === phaseId)
  if (!phase) return { done: 0, in_progress: 0, pending: 0, total: 0, pct: 0 }

  const tasks = data.tasks || data
  const phaseHidden = new Set(data.phaseHiddenTasks || [])
  const brandHidden = new Set((data.hiddenTasks || {})[brandId] || [])

  let done = 0, in_progress = 0, pending = 0

  phase.sections.forEach(section => {
    // Built-in requirements (minus globally or brand-hidden)
    section.requirements
      .filter(r => !phaseHidden.has(r.id) && !brandHidden.has(r.id))
      .forEach(req => {
        const c = categorize(tasks[brandId]?.[req.id]?.status)
        if (c === 'done') done++
        else if (c === 'in_progress') in_progress++
        else pending++
      })

    // Phase-level custom tasks (visible to all brands)
    ;(data.phaseCustomTasks?.[section.id] || []).forEach(ct => {
      const c = categorize(tasks[brandId]?.[ct.id]?.status)
      if (c === 'done') done++
      else if (c === 'in_progress') in_progress++
      else pending++
    })

    // Brand-specific custom tasks for this section
    ;((data.customTasks || {})[brandId]?.[section.id] || []).forEach(ct => {
      const c = categorize(ct.status)
      if (c === 'done') done++
      else if (c === 'in_progress') in_progress++
      else pending++
    })
  })

  const total = done + in_progress + pending
  return { done, in_progress, pending, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

export function getPhaseGlobalStats(data, phaseId, phases = PHASES) {
  let done = 0, in_progress = 0, pending = 0
  VISIBLE_BRANDS.forEach(brand => {
    const s = getBrandPhaseStats(data, brand.id, phaseId, phases)
    done += s.done
    in_progress += s.in_progress
    pending += s.pending
  })
  const total = done + in_progress + pending
  return { done, in_progress, pending, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

export function getGlobalStats(data, phases = PHASES) {
  let done = 0, in_progress = 0, pending = 0
  VISIBLE_BRANDS.forEach(brand => {
    phases.forEach(phase => {
      const s = getBrandPhaseStats(data, brand.id, phase.id, phases)
      done += s.done
      in_progress += s.in_progress
      pending += s.pending
    })
  })
  return { done, in_progress, pending, total: done + in_progress + pending }
}

export function getSectionStats(data, brandId, section) {
  const tasks = data.tasks || data
  const brandHidden = new Set((data.hiddenTasks || {})[brandId] || [])

  let done = 0, in_progress = 0

  section.requirements
    .filter(r => !brandHidden.has(r.id))
    .forEach(req => {
      const c = categorize(tasks[brandId]?.[req.id]?.status)
      if (c === 'done') done++
      else if (c === 'in_progress') in_progress++
    })

  ;(data.phaseCustomTasks?.[section.id] || []).forEach(ct => {
    const c = categorize(tasks[brandId]?.[ct.id]?.status)
    if (c === 'done') done++
    else if (c === 'in_progress') in_progress++
  })

  ;((data.customTasks || {})[brandId]?.[section.id] || []).forEach(ct => {
    const c = categorize(ct.status)
    if (c === 'done') done++
    else if (c === 'in_progress') in_progress++
  })

  const builtInCount = section.requirements.filter(r => !brandHidden.has(r.id)).length
  const phaseCustomCount = (data.phaseCustomTasks?.[section.id] || []).length
  const brandCustomCount = ((data.customTasks || {})[brandId]?.[section.id] || []).length
  const total = builtInCount + phaseCustomCount + brandCustomCount

  return { done, in_progress, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

export function getBrandLastActivePhase(tasks, brandId, phases = PHASES) {
  let lastPhase = null
  for (const phase of phases) {
    const reqs = phase.sections.flatMap(s => s.requirements)
    const hasActivity = reqs.some(req => {
      const s = tasks[brandId]?.[req.id]?.status
      return s && s !== 'pending'
    })
    if (hasActivity) lastPhase = phase
  }
  return lastPhase
}

export function getPctColor(pct) {
  if (pct >= 70) return '#16A34A'
  if (pct >= 30) return '#D97706'
  return '#DC2626'
}

export function getPctBg(pct) {
  if (pct >= 70) return '#F0FDF4'
  if (pct >= 30) return '#FFFBEB'
  return '#FEF2F2'
}

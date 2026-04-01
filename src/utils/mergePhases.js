import { PHASES } from '../data/phases'

// Build lookup: section_id → requirements[]
const BUILTIN_REQUIREMENTS = {}
PHASES.forEach(phase => {
  phase.sections.forEach(section => {
    BUILTIN_REQUIREMENTS[section.id] = section.requirements
  })
})

// Build lookup: phase_id → visual metadata
const PHASE_META = {}
PHASES.forEach(phase => {
  PHASE_META[phase.id] = {
    number: phase.number,
    color: phase.color,
    colorLight: phase.colorLight,
    colorMuted: phase.colorMuted,
    colorDark: phase.colorDark,
    cssClass: phase.cssClass,
    duration: phase.duration,
    startWeek: phase.startWeek,
    endWeek: phase.endWeek,
    entry: phase.entry,
    description: phase.description,
    tagline: phase.tagline,
  }
})

// Original labels from constants (for reset)
export const BUILTIN_PHASE_LABELS = {}
export const BUILTIN_SECTION_LABELS = {}
export const BUILTIN_PHASE_IDS = new Set()
PHASES.forEach(phase => {
  BUILTIN_PHASE_LABELS[phase.id] = phase.name
  BUILTIN_PHASE_IDS.add(phase.id)
  phase.sections.forEach(section => {
    BUILTIN_SECTION_LABELS[section.id] = section.name
  })
})

// Fallback color palette for custom phases (cycles by position)
export const CUSTOM_PHASE_COLORS = [
  { color: '#D97706', colorLight: '#FFFBEB', colorMuted: '#FDE68A', colorDark: '#92400E' },
  { color: '#DC2626', colorLight: '#FEF2F2', colorMuted: '#FECACA', colorDark: '#991B1B' },
  { color: '#0891B2', colorLight: '#ECFEFF', colorMuted: '#A5F3FC', colorDark: '#164E63' },
  { color: '#7C3AED', colorLight: '#F5F3FF', colorMuted: '#DDD6FE', colorDark: '#4C1D95' },
  { color: '#059669', colorLight: '#ECFDF5', colorMuted: '#A7F3D0', colorDark: '#064E3B' },
  { color: '#9CA3AF', colorLight: '#F9FAFB', colorMuted: '#E5E7EB', colorDark: '#374151' },
]

export function getMergedPhases(phasesData, sectionsData) {
  if (!phasesData || !phasesData.length) return PHASES

  const sorted = [...phasesData].sort((a, b) => a.sort_order - b.sort_order)
  // Count custom phases seen so far for cycling palette
  let customIdx = 0

  return sorted.map(phaseRow => {
    const meta = PHASE_META[phaseRow.phase_id] || {}
    const isCustom = !BUILTIN_PHASE_IDS.has(phaseRow.phase_id)
    const palette = isCustom ? CUSTOM_PHASE_COLORS[customIdx++ % CUSTOM_PHASE_COLORS.length] : {}

    const phaseSections = (sectionsData || [])
      .filter(s => s.phase_id === phaseRow.phase_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(sectionRow => ({
        id: sectionRow.section_id,
        name: sectionRow.label,
        emoji: sectionRow.emoji || '',
        requirements: BUILTIN_REQUIREMENTS[sectionRow.section_id] || [],
      }))

    return {
      id: phaseRow.phase_id,
      number: meta.number || sorted.indexOf(phaseRow) + 1,
      name: phaseRow.label,
      emoji: phaseRow.emoji || '',
      tagline: meta.tagline || '',
      color: meta.color || phaseRow.color || palette.color || '#1D9E75',
      colorLight: meta.colorLight || phaseRow.colorLight || palette.colorLight || '#ECFDF5',
      colorMuted: meta.colorMuted || phaseRow.colorMuted || palette.colorMuted || '#A7F3D0',
      colorDark: meta.colorDark || phaseRow.colorDark || palette.colorDark || '#065F46',
      cssClass: meta.cssClass || '',
      duration: meta.duration || '',
      startWeek: meta.startWeek || 1,
      endWeek: meta.endWeek || 6,
      entry: meta.entry || '',
      description: meta.description || '',
      sections: phaseSections,
    }
  })
}

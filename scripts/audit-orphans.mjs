#!/usr/bin/env node
// Auditoria de consistência DB <-> Elevate a partir dos JSONs de coleta (inventário completo: running/done/paused/draft).
// Reporta órfãos (no banco, sem NENHUMA correspondência na Elevate), faltantes e divergências de status.
// Deleta órfãos apenas com --apply (senão só reporta).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dir, '..', '.env'), 'utf-8').split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())).filter(([k]) => k)
)
const sb = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_SERVICE_ROLE_KEY'])
const APPLY = process.argv.includes('--apply')

// Inventário Elevate = união dos arquivos de coleta passados como argumentos
const files = process.argv.slice(2).filter(a => a.endsWith('.json'))
if (!files.length) { console.error('uso: node scripts/audit-orphans.mjs <arquivo1.json> [arquivo2.json] [--apply]'); process.exit(1) }

const elevate = {} // brandId -> Map(testId -> listItem)
for (const f of files) {
  const data = JSON.parse(readFileSync(join(__dir, f), 'utf-8'))
  for (const [brandId, bd] of Object.entries(data)) {
    elevate[brandId] ||= new Map()
    for (const t of bd.tests || []) elevate[brandId].set(t.testId, t)
  }
}

const normalizeStatus = s => { const l = (s || '').toLowerCase(); return ['running', 'paused', 'done', 'draft'].includes(l) ? l : 'draft' }

let IGNORED = {}
try { IGNORED = JSON.parse(readFileSync(join(__dir, 'ignored-tests.json'), 'utf-8')) } catch {}

const { data: rows, error } = await sb.from('ab_tests').select('id,brand_id,name,status,family_id,control_cr,last_synced_at')
if (error) { console.error(error); process.exit(1) }

const byBrand = {}
for (const r of rows) (byBrand[r.brand_id] ||= []).push(r)

const TODAY = new Date().toISOString().slice(0, 10)
console.log(`🔍 Auditoria DB <-> Elevate${APPLY ? '  [APLICANDO DELEÇÕES]' : '  [somente relatório]'}`)
console.log(`   inventário de: ${files.join(', ')}\n`)

let totalOrphans = 0, totalDeleted = 0, totalProblems = 0
const allBrands = new Set([...Object.keys(byBrand), ...Object.keys(elevate)])

for (const brandId of [...allBrands].sort()) {
  const dbRows = byBrand[brandId] || []
  const elv = elevate[brandId]

  if (!elv) {
    console.log(`⏭️  ${brandId.padEnd(10)} db=${dbRows.length} — SEM inventário Elevate nesta execução; ignorado (nada apagado)`)
    continue
  }

  const dbIds = new Set(dbRows.map(r => r.id))
  const orphans = dbRows.filter(r => !elv.has(r.id))
  const missing = [...elv.keys()].filter(id => !dbIds.has(id))

  // divergências de status (paused deve continuar paused)
  const statusDiff = dbRows
    .filter(r => elv.has(r.id))
    .map(r => ({ r, want: normalizeStatus(elv.get(r.id).status) }))
    .filter(x => x.r.status !== x.want)

  const stale = dbRows.filter(r => !String(r.last_synced_at).startsWith(TODAY))
  const noMetrics = dbRows.filter(r => r.control_cr == null)
  const st = {}
  dbRows.forEach(r => { st[r.status] = (st[r.status] || 0) + 1 })

  console.log(`${orphans.length || missing.length || statusDiff.length || stale.length ? '⚠️ ' : '✅'} ${brandId.padEnd(10)} db=${String(dbRows.length).padEnd(3)} elevate=${String(elv.size).padEnd(3)} ${JSON.stringify(st)}`)
  if (noMetrics.length) console.log(`     ℹ️  ${noMetrics.length} sem métricas (control_cr null)`)
  if (stale.length) { console.log(`     ⚠️  ${stale.length} com last_synced_at != ${TODAY}`); totalProblems += stale.length }
  for (const m of missing) { console.log(`     ⚠️  FALTANDO no banco: ${m.slice(0, 8)} (${elv.get(m).status}) ${elv.get(m).name}`); totalProblems++ }
  for (const d of statusDiff) { console.log(`     ⚠️  STATUS divergente ${d.r.id.slice(0, 8)}: db=${d.r.status} elevate=${d.want} — ${d.r.name}`); totalProblems++ }

  for (const o of orphans) {
    totalOrphans++
    const blocked = (IGNORED[brandId] || []).includes(o.id)
    console.log(`     🗑️  ÓRFÃO ${o.id.slice(0, 8)} [${o.status}] ${o.name}${blocked ? ' (na blocklist)' : ''}`)
    if (APPLY) {
      await sb.from('ab_test_notes').delete().eq('test_id', o.id).eq('brand_id', brandId)
      await sb.from('ab_test_snapshots').delete().eq('test_id', o.id).eq('brand_id', brandId)
      const { error: delErr } = await sb.from('ab_tests').delete().eq('id', o.id).eq('brand_id', brandId)
      if (delErr) { console.log(`         ⚠️ falha ao apagar: ${delErr.message}`); totalProblems++ }
      else { totalDeleted++; console.log('         ✔ apagado (test + snapshots + notes)') }
    }
  }
}

// blocklist não deve estar no banco
for (const [brandId, ids] of Object.entries(IGNORED)) {
  if (brandId.startsWith('_')) continue
  for (const id of ids) {
    const present = (byBrand[brandId] || []).some(r => r.id === id)
    console.log(`${present ? '⚠️ ' : '✅'} blocklist ${brandId}/${id.slice(0, 8)}: ${present ? 'PRESENTE no banco (deveria estar fora)' : 'ausente, ok'}`)
    if (present) totalProblems++
  }
}

console.log(`\n📊 órfãos=${totalOrphans} apagados=${totalDeleted} outros_problemas=${totalProblems}`)
if (!APPLY && totalOrphans) console.log('   rode com --apply para apagar os órfãos listados')
if (!totalOrphans && !totalProblems) console.log('   ✅ banco consistente com a Elevate')

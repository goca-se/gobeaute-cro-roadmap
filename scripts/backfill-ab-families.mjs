// Backfill único de family_id / family_label / area em ab_tests.
// Percorre todos os testes, roda classifyTest(name) e atualiza os registros.
//
// Pré-requisito: as colunas family_id/family_label/area devem existir em
// ab_tests (ver supabase-ab-tests-setup.sql). Se não existirem, o script aborta
// com instrução clara.
//
// Uso: node scripts/backfill-ab-families.mjs
import fs from 'node:fs'
import { classifyTest, UNCLASSIFIED_ID } from '../src/data/abTestFamilies.js'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltando VITE_SUPABASE_URL / VITE_SUPABASE_SERVICE_ROLE_KEY no .env.')
  process.exit(1)
}
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

// Checagem de pré-requisito: coluna family_id existe?
const probe = await fetch(`${url}/rest/v1/ab_tests?select=id,family_id&limit=1`, { headers })
if (!probe.ok) {
  const body = await probe.text()
  if (body.includes('family_id')) {
    console.error('\n❌ As colunas de família ainda não existem em ab_tests.')
    console.error('   Rode este SQL no Supabase SQL Editor antes do backfill:\n')
    console.error('   ALTER TABLE public.ab_tests ADD COLUMN IF NOT EXISTS family_id    text;')
    console.error('   ALTER TABLE public.ab_tests ADD COLUMN IF NOT EXISTS family_label text;')
    console.error('   ALTER TABLE public.ab_tests ADD COLUMN IF NOT EXISTS area         text;')
    console.error('   CREATE INDEX IF NOT EXISTS idx_ab_tests_family ON public.ab_tests(family_id);\n')
    process.exit(2)
  }
  console.error('Falha ao consultar ab_tests:', body)
  process.exit(1)
}

const res = await fetch(`${url}/rest/v1/ab_tests?select=id,brand_id,name`, { headers })
const rows = await res.json()
if (!Array.isArray(rows)) {
  console.error('Resposta inesperada:', JSON.stringify(rows))
  process.exit(1)
}

let updated = 0, classified = 0, failed = 0
for (const t of rows) {
  const fam = classifyTest(t.name)
  const payload = {
    family_id: fam.id === UNCLASSIFIED_ID ? null : fam.id,
    family_label: fam.id === UNCLASSIFIED_ID ? null : fam.label,
    area: fam.area || null,
  }
  if (fam.id !== UNCLASSIFIED_ID) classified++
  const q = `${url}/rest/v1/ab_tests?id=eq.${encodeURIComponent(t.id)}&brand_id=eq.${encodeURIComponent(t.brand_id)}`
  const upd = await fetch(q, { method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(payload) })
  if (upd.ok) updated++
  else { failed++; console.error(`  falha ${t.brand_id}/${t.id}: ${await upd.text()}`) }
}

console.log(`\nBackfill concluído: ${updated}/${rows.length} atualizados | ${classified} classificados | ${rows.length - classified} a triar | ${failed} falhas`)
process.exit(failed > 0 ? 1 : 0)

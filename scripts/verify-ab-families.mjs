// Verificação da taxonomia de famílias de testes A/B.
// Roda `classifyTest` sobre os nomes reais em `ab_tests` (Supabase) e imprime
// a matriz família × marca + o balde "A triar". Também roda asserts unitários.
//
// Uso: node scripts/verify-ab-families.mjs
import fs from 'node:fs'
import { classifyTest, normalizeTestName, FAMILIES, UNCLASSIFIED_ID } from '../src/data/abTestFamilies.js'

// --- asserts unitários (casos representativos) ---
const CASES = [
  ['[TEMA] Desconto 5% no pix', 'desconto-pix'],
  ['Carrinho Upcart vs. Carrinho Nativo', 'carrinho-tipo'],
  ['Fase 6 - Virada de Tema Kokeshi - teste de tema novo publicado', 'virada-tema'],
  ['[PDP] Upsell IOS layout', 'upsell-ios-toggle'],
  ['Videowise vs. Sem Videowise', 'videowise'],
  ['[Home] Trust Icons', 'trust-icons'],
  ['Teste Elevate', UNCLASSIFIED_ID],
]
let unitFail = 0
for (const [name, expected] of CASES) {
  const got = classifyTest(name).id
  const ok = got === expected
  if (!ok) unitFail++
  console.log(`${ok ? '✓' : '✗'} "${name}" -> ${got}${ok ? '' : ` (esperado ${expected})`}`)
}
console.log(`\nAsserts unitários: ${CASES.length - unitFail}/${CASES.length} ok\n`)

// --- classificação sobre dados reais ---
const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Sem VITE_SUPABASE_URL / key no .env — pulando checagem contra dados reais.')
  process.exit(unitFail > 0 ? 1 : 0)
}

const res = await fetch(`${url}/rest/v1/ab_tests?select=brand_id,name`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
})
const data = await res.json()
if (!Array.isArray(data)) {
  console.error('Falha ao buscar ab_tests:', JSON.stringify(data))
  process.exit(1)
}

const BR = ['apice', 'barbours', 'kokeshi', 'rituaria', 'lescent']
const fam = {}
const unclassified = []
for (const t of data) {
  const c = classifyTest(t.name)
  if (c.id === UNCLASSIFIED_ID) unclassified.push(`${t.brand_id}: ${t.name}`)
  const f = (fam[c.id] ||= { label: c.label, brands: {} })
  f.brands[t.brand_id] = (f.brands[t.brand_id] || 0) + 1
}

const rows = Object.entries(fam).filter(([id]) => id !== UNCLASSIFIED_ID)
  .map(([id, v]) => ({ id, label: v.label, brands: v.brands, nb: BR.filter(b => v.brands[b]).length }))
  .sort((a, b) => b.nb - a.nb)

console.log('FAMILY'.padEnd(34), BR.map(b => b.slice(0, 4).padStart(5)).join(''), '  #br')
for (const r of rows) {
  console.log(r.label.padEnd(34), BR.map(b => String(r.brands[b] || '·').padStart(5)).join(''), '  ' + r.nb)
}

const classified = data.length - unclassified.length
console.log(`\nClassificados: ${classified}/${data.length}  |  Famílias ativas: ${rows.length}  |  Config: ${FAMILIES.length}`)
console.log(`\n=== A TRIAR (${unclassified.length}) ===`)
unclassified.forEach(u => console.log('  ' + u))

// Critério de sucesso do PRP: ≥85% classificados.
const pct = classified / data.length
console.log(`\nCobertura: ${(pct * 100).toFixed(1)}% (meta ≥85%)`)
process.exit(unitFail === 0 && pct >= 0.85 ? 0 : 1)

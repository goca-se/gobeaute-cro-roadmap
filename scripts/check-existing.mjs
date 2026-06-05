#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8').split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())).filter(([k]) => k)
)

const sb = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_SERVICE_ROLE_KEY'])

const brands = ['apice', 'barbours', 'kokeshi', 'rituaria', 'lescent']
const out = {}
for (const b of brands) {
  const { data } = await sb.from('ab_tests').select('id').eq('brand_id', b)
  out[b] = (data || []).map(r => r.id)
}
console.log(JSON.stringify(out, null, 2))

Coleta dados de testes A/B do Elevate para todas as 5 marcas via MCP e salva no Supabase.

## Fluxo de execução

Para cada marca (apice, barbours, kokeshi, rituaria, lescent):

1. **Listar testes**: Chama `mcp__elevate-{brand}__list_tests` com status `running` (limit: 50) e depois com status `done` (limit: 50). Combina os resultados.

2. **Para cada teste**:
   - Se status = "Done" e `completedAt` < 3 dias atrás → verificar se já existe no Supabase (`ab_tests` com mesmo `id` e `brand_id`). Se existe → **skip**.
   - Caso contrário, buscar dados detalhados:
     - `mcp__elevate-{brand}__get_test_results(testId)`
     - `mcp__elevate-{brand}__get_statistical_significance(testId)`

3. **Normalizar dados**:
   - Status: toLowerCase ("Running" → "running", "Done" → "done")
   - Métricas: parseFloat, null se inválido
   - AOV lift: calcular `((variant_aov - control_aov) / control_aov) * 100`
   - Winner: usar `get_statistical_significance.results[goal]` → variant com percentage > 50. Se for o control → is_winner = false. Se variante → is_winner = true.
   - Variante principal: primeira variação com `isControl: false`

4. **Salvar no Supabase**:
   - **Classificar família**: rodar `classifyTest(name)` de `src/data/abTestFamilies.js` e gravar `family_id`, `family_label`, `area` (null quando `__unclassified`). Usado pela "Matriz de Testes" cross-marca (ADR-006). Se estiver usando `normalizeTest` de `elevateSync.js`, o carimbo já é feito automaticamente.
   - Upsert em `ab_tests` (PK: `id` + `brand_id`)
   - Insert em `ab_test_snapshots` (histórico)
   - Insert em `ab_sync_log` (trigger_type: 'cron')

   > **Pré-requisito de schema:** as colunas `family_id`, `family_label`, `area` precisam existir em `ab_tests` (ver `supabase-ab-tests-setup.sql`). Sem elas o upsert com esses campos falha.

## Pré-requisito: Service Role Key

Para salvar no Supabase o sync usa o **`VITE_SUPABASE_SERVICE_ROLE_KEY`** do `.env` (não a anon key), pois as tabelas `ab_tests`, `ab_test_snapshots` e `ab_sync_log` têm RLS que exige usuário `authenticated`. A service role key bypassa o RLS.

Ao escrever o script de sync, inicializar o cliente assim:
```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)
```

Se a variável não estiver no `.env`, o script deve abortar com erro claro antes de tentar salvar.

## Regras importantes

- **NÃO usar** `get_test` — endpoint instável (retorna fetch failed)
- Status vem **capitalizado** do Elevate ("Running", "Done") — sempre normalizar para lowercase
- `variationId` é **number**, não UUID — converter para string ao salvar
- Salvar raw JSONs em `raw_list_data`, `raw_results_data`, `raw_significance_data` para auditoria
- Best-effort: se um campo estiver ausente ou malformado, salvar null e continuar

## Mapeamento brand_id ↔ MCP

| brand_id | MCP tools prefix |
|----------|-----------------|
| apice | mcp__elevate-apice |
| barbours | mcp__elevate-barbours |
| kokeshi | mcp__elevate-kokeshi |
| rituaria | mcp__elevate-rituaria |
| lescent | mcp__elevate-lescent |

## Formato esperado dos dados

### list_tests
```json
{ "testId": "uuid", "name": "...", "type": "THEME", "status": "Running", "goal": "REVENUE_PER_VISITOR", "startingAt": "ISO", "completedAt": null }
```

### get_test_results
```json
{ "testId": "...", "variations": [{ "variationId": 12345, "isControl": true, "conversionRate": 4.32, "revenuePerVisitor": 4.56, "averageOrderValue": 90.47, ... }] }
```

### get_statistical_significance
```json
{ "statisticalStatus": "Significant", "results": { "REVENUE_PER_VISITOR": [{ "variant": "12345", "percentage": 90.79 }] } }
```

Ao finalizar, reportar quantos testes foram processados, atualizados e skipados por marca.

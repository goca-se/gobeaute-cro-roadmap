# ADR-006: Classificação de Testes A/B por Similaridade de Nome (carimbada no sync)

**Status:** Accepted
**Date:** 2026-07-21
**Version:** 1.0

## Context

Os testes A/B são armazenados por marca em `ab_tests` (PK `id + brand_id`), sem
qualquer vínculo entre marcas. Para a nova "Matriz de Testes" (cross-marca) é
preciso identificar "o mesmo teste" rodando em marcas diferentes e evidenciar
cobertura, vencedores e escalonamento. Não existe chave compartilhada entre as
marcas, e a plataforma Elevate não fornece um conceito de "aplicado/escalado".

## Decision

Agrupar testes por **similaridade de nome** através de uma taxonomia de
"famílias" declarada em código (`src/data/abTestFamilies.js`):

- `normalizeTestName` limpa o nome (remove `[tags]`, acentos, "Fase N", nome da
  marca, sufixos de variação como "50/50", "v2", "abc").
- `classifyTest(name)` casa o nome normalizado, por keyword, contra uma lista
  **ordenada** de famílias (primeiro match vence; regras específicas antes das
  genéricas). Sem match → `__unclassified` (balde "A triar").
- A config em código é a **fonte de verdade** da taxonomia (validada: 90/102 =
  88% dos testes atuais classificados em 26 famílias).

**A classificação é produzida pelo sync do Elevate:** `src/lib/elevateSync.js`
(`normalizeTest`) importa `classifyTest` e carimba `family_id`, `family_label` e
`area` em `ab_tests` a cada upsert. A matriz lê esse dado sincronizado, com
**fallback client-side** (`classifyTest(name)`) quando `family_id` está nulo
(registro ainda não re-sincronizado ou config alterada).

**"Escalado" e "validado" são inferidos** do próprio agrupamento, sem input
manual e sem tabela nova:
- **Escalada** = a família aparece em ≥2 marcas.
- **Validada** = a família venceu (`verdict === 'winner'`) em ≥1 marca.

O módulo `abTestFamilies.js` é mantido **sem imports** (funções puras) para ser
usável tanto no browser (Vite/React) quanto no Node do sync/scripts.

## Consequences

- **Positive:** Agrupamento cross-marca sem schema pesado (apenas 3 colunas
  nullable em `ab_tests`). Testes novos se auto-classificam sem alterar código.
  A classificação vive no pipeline do sync (consistente para app, cron e
  relatórios). Fallback client-side garante robustez quando a config muda.
- **Negative:** Classificação por keyword pode errar em nomes ambíguos; exige
  curadoria pontual da lista de famílias. `family_id` gravado pode ficar
  desatualizado até o próximo sync/backfill (mitigado pelo fallback). O balde
  "A triar" precisa de acompanhamento humano para virar novas famílias.

## History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-21 | Decisão inicial (PRP: Matriz de Testes A/B Cross-Marca) |

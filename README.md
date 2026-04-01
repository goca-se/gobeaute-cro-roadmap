# Gobeaute CRO Roadmap

Dashboard para acompanhamento da metodologia CRO (Conversion Rate Optimization) nas marcas de beleza do grupo Gobeaute.

## Marcas

| Marca | Segmento |
|-------|----------|
| Ápice | Shampoo e condicionador |
| Barbour's | Aromas e body splash |
| Rituária | Suplementos e rituais |
| Kokeshi | Skincare |
| Lescent | Perfumaria |

## Metodologia

A metodologia é dividida em 3 fases sequenciais:

- **Fase 1 — Analytics & Performance** (4–6 semanas): fundação de dados, GA4, Core Web Vitals e estabilidade técnica
- **Fase 2 — UX & Conversão** (6–8 semanas): experiência do usuário, copywriting e trust signals
- **Fase 3 — Testes & Escala** (contínuo): experimentação estruturada, personalização e crescimento

Cada fase contém seções com requisitos rastreáveis por marca: `pendente → em andamento → concluído`.

## Stack

- React 18 + Vite
- Tailwind CSS
- Estado persistido em `localStorage`
- Sync opcional com Supabase (realtime)
- Integração opcional com Metabase (métricas embed)

## Rodando localmente

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de produção em dist/
npm run preview   # preview do build
```

## Variáveis de ambiente (opcionais)

Copie `.env.example` para `.env` e preencha para habilitar Supabase:

```bash
cp .env.example .env
```

Sem essas variáveis, o app funciona normalmente usando apenas `localStorage`.

## Utilitários de console

Com o app aberto no browser, os seguintes helpers estão disponíveis no console:

```js
exportData()        // baixa backup JSON
importData(json)    // restaura de um backup JSON
exportCSV()         // baixa CSV marca × requisito × status
resetData()         // volta ao estado inicial
```

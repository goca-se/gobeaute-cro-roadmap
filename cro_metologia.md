# Metodologia de CRO — Grupo Gobeaute

**Versão 1.0 · 2025 · Confidencial**

---

## Marcas do grupo

| Marca | Segmento |
|---|---|
| Ápice | Shampoo e condicionador |
| Barbour's | Aromas e body splash |
| Rituária | Suplementos e rituais |
| Kokeshi | Skincare |
| Lescent | Perfumaria |
| Auá | Produtos naturais |
| By Samia | Aromaterapia |

---

## Visão geral

Este documento descreve a abordagem de **Conversion Rate Optimization (CRO)** adotada para todas as marcas do Grupo Gobeaute. O objetivo é garantir que cada loja evolua de forma estruturada — com dados confiáveis antes de qualquer teste, conteúdo sólido antes de personalização, e métricas claras para avaliar cada avanço.

---

## Princípios da metodologia

| Princípio | Descrição |
|---|---|
| **Dados antes de testes** | Sem rastreamento confiável, nenhum teste A/B tem validade. Fase 1 é pré-requisito absoluto. |
| **Conteúdo antes de personalização** | Não adianta personalizar uma experiência mal construída. Fase 2 garante o conteúdo base. |
| **Mobile-first** | Tráfego majoritariamente mobile em todas as marcas. Toda validação parte de 390px. |
| **Bug é bug, não é teste** | Interações quebradas são corrigidas imediatamente — não testadas via A/B. |
| **Qualitativo + quantitativo** | Clarity valida hipóteses com sessões reais. GA4 quantifica impacto. Os dois andam juntos. |
| **CRO é processo, não projeto** | A metodologia cria um ciclo contínuo de hipóteses, testes, aprendizados e iteração. |

---

## Fase 1 · Analytics & performance

> Dados confiáveis · site rápido · zero bugs críticos — base para tudo que vem depois

**Objetivo:** garantir que todas as lojas tenham dados analíticos confiáveis, performance técnica adequada e ausência de bugs críticos. *Nenhuma loja avança para a Fase 2 sem esta fase estabilizada.*

### Rastreamento e dados

| Requisito | Ápice | Barbour's | Rituária | Kokeshi | Lescent | Auá | By Samia |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **GA4 implementado e validado** | ~ | ~ | | | | | |
| Eventos de funil mapeados no GA4 | ~ | | | | | | |
| **Clarity instalado e configurado** | ✓ | ✓ | | | ✓ | | |
| Sessões, heatmaps e rage/dead clicks ativos | ✓ | ✓ | | | ~ | | |
| Metabase com dados consolidados | ~ | | | | | | |
| Plausible — monitoramento D0 *(opcional)* | | | | | | | |

### Performance e qualidade técnica

| Requisito | Ápice | Barbour's | Rituária | Kokeshi | Lescent | Auá | By Samia |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Core Web Vitals satisfatórios (LCP, CLS, INP)** | ~ | ~ | | | | | |
| Site responsivo validado em 390px | ~ | ~ | | | | | |
| Contraste e acessibilidade básica nos CTAs | | | | | | | |
| **Auditoria de bugs críticos mobile concluída** | ~ | ✓ | | | | | |

> **Nota:** Plausible (monitoramento D0 em tempo real) é opcional e será avaliado como iniciativa futura, sem impacto no critério de entrada para Fase 2.

---

## Fase 2 · Apresentação, valor e navegação

> Produto bem comunicado · percepção de valor clara · cliente encontra o que busca

**Objetivo:** garantir que cada loja apresente seus produtos de forma clara, comunique valor nos pontos estratégicos da jornada e ofereça navegação fluida. A fase é dividida em **3 frentes paralelas** que evoluem simultaneamente.

---

### Protocolo de Teste A/B

Todas as melhorias da Fase 2 devem ser implementadas via Teste A/B antes de se tornarem definitivas. **Duração mínima de 2 semanas por teste** — exceto quando a diferença entre variantes for estatisticamente expressiva antes desse prazo.

Cada teste deve ter:

- Hipótese clara com métrica de sucesso definida antes do início
- Tamanho de amostra calculado previamente (mín. 95% de significância)
- Critério de parada definido — nunca encerrar por "parecer melhor"
- Registro no backlog de hipóteses com resultado e aprendizado

---

### Frente 1 — Produto bem apresentado

| Requisito | Ápice | Barbour's | Rituária | Kokeshi | Lescent | Auá | By Samia |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **PDPs com benefícios e bullet points acima do fold** | ~ | ~ | | | | | |
| Descrições curtas, atrativas e escaneáveis | ~ | | | | | | |
| Cards de produto com tag de diferenciação | ~ | | | | | | |
| Seção antes/depois por produto ou linha | | | | | | | |
| FAQ por produto — top 50 best-sellers | | | | | | | |
| Ingredientes e modo de uso customizados | | | | | | | |

### Frente 2 — Percepção de valor

| Requisito | Ápice | Barbour's | Rituária | Kokeshi | Lescent | Auá | By Samia |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Trust icons visíveis em home e PDP** | | | | | | | |
| Comunicação clara de frete, promoções e brindes | | | | | | | |
| Upsells contextuais — kits e complementos de linha | | ~ | | | | | |
| Banner de garantia de satisfação | | | | | | | |
| Comparativo marca vs. concorrente | | | | | | | |
| **Ancoragem de preço e comunicação de parcelamento/PIX** | | | | | | | |

### Frente 3 — Encontrabilidade e navegação

| Requisito | Ápice | Barbour's | Rituária | Kokeshi | Lescent | Auá | By Samia |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Busca interna funcional e relevante** | ~ | | | | | | |
| Quiz ou chatbot com IA para recomendação | | | | | | | |
| Filtros de PLP organizados e estilizados | ~ | | | | | | |
| Banners e títulos nas principais collection pages | ~ | | | | | | |
| **CTAs claros e sticky em mobile** | ~ | ~ | | | | | |

> **Destaque:** Quiz ou chatbot com IA para recomendação de produto é o item de maior esforço/impacto desta fase — maior retenção, menos dúvidas pré-compra e incremento direto em CVR.

---

## Fase 3 · Personalização e inteligência de receita

> Segmentação · conteúdo adaptado · exploração de preço

**Fase embrionária.** Organizada em 3 ações macro que evoluem após as Fases 1 e 2 estabilizadas. Sem dados confiáveis não há segmentação; sem conteúdo sólido não há o que personalizar.

| Requisito | Ápice | Barbour's | Rituária | Kokeshi | Lescent | Auá | By Samia |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Segmentação de entrada e conteúdo adaptado** | | | | | | | |
| Identificação novo vs. recorrente na entrada | | | | | | | |
| Conteúdo e vitrines adaptados por perfil de cliente | | | | | | | |
| Pop-up e banners personalizados por segmento | | | | | | | |
| **2. Jornada e CRM personalizado** | | | | | | | |
| Condições especiais por localização (frete, promos) | | | | | | | |
| Recuperação de carrinho personalizada por segmento | | | | | | | |
| Campanhas de CRM segmentadas por jornada | | | | | | | |
| **3. Exploração de variação de preço** | | | | | | | |
| Testes de elasticidade de preço por produto/período | | | | | | | |
| Análise de impacto de promoções sazonais em CVR | | | | | | | |
| Variantes de preço por segmento e canal de entrada | | | | | | | |

> **Exploração de preço:** A análise de elasticidade avalia como variações em determinados produtos e períodos impactam CVR, AOV e receita total — sem comprometer o posicionamento de marca. Os testes seguem o mesmo protocolo A/B da Fase 2.

> **Pré-requisito:** Esta fase não deve ser iniciada sem que a Fase 1 esteja verde e as frentes 1 e 2 da Fase 2 estejam concluídas.

---

## Legenda

| Símbolo | Significado |
|:---:|---|
| ✓ | Concluído |
| ~ | Em progresso |
| *(vazio)* | Não iniciado |

---

## Próximos passos prioritários

| Ação | Descrição |
|---|---|
| **Concluir GA4 em Ápice e Barbour's** | Desbloqueia análise de funil completo e valida os primeiros testes A/B. |
| **Finalizar auditoria de bugs mobile** | Todas as marcas com Clarity ativo — base para Fase 2 começar limpa. |
| **Avançar Fase 2 em Ápice e Barbour's** | Frentes 1 e 2 em paralelo — produto bem apresentado e percepção de valor. |
| **Rollout de Clarity e GA4 nas demais marcas** | Rituária, Kokeshi, Lescent, Auá e By Samia entrando na Fase 1. |
| **Mapear quiz/IA de recomendação** | Avaliar plataforma e esforço para as marcas de maior volume de tráfego. |

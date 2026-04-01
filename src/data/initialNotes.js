export const INITIAL_NOTES = {
  // ── Fase 1 · Rastreamento ──────────────────────────────────────────────────
  ga4: `<p>Verificar se o gtag.js está carregado via Tag Manager em todas as páginas. Validar no GA4 DebugView com sessão ativa.</p><ul><li>Eventos <strong>purchase</strong> e <strong>begin_checkout</strong> disparando com parâmetros corretos (items, value, currency)</li><li>Relatório de funil de e-commerce populando sem gaps</li><li>Sem duplicação de eventos de conversão</li></ul>`,

  ga4_events: `<p>Mapear e validar os 4 eventos essenciais do funil de compra.</p><ul><li><strong>view_item</strong> — na abertura de qualquer PDP</li><li><strong>add_to_cart</strong> — ao adicionar produto ao carrinho</li><li><strong>begin_checkout</strong> — ao iniciar checkout</li><li><strong>purchase</strong> — na confirmação do pedido com item_id, item_name e value</li></ul><p>Usar GA4 DebugView para validar cada evento em tempo real.</p>`,

  clarity: `<p>Confirmar que o script do Clarity está ativo em todas as páginas (home, PLPs, PDPs, carrinho e checkout).</p><ul><li>Verificar presença do script via DevTools (Sources ou Network)</li><li>Acessar o painel do Clarity e confirmar sessões sendo gravadas</li><li>Checar se há dados de sessão de usuários mobile</li></ul>`,

  clarity_sessions: `<p>Ativar e revisar os recursos avançados do Clarity para identificar fricções.</p><ul><li>Habilitar filtros de <strong>Rage Click</strong> e <strong>Dead Click</strong></li><li>Assistir mínimo 10 sessões mobile para cada página crítica (home, PDP, carrinho)</li><li>Exportar heatmaps de scroll das PDPs com maior tráfego</li><li>Documentar principais pontos de abandono encontrados</li></ul>`,

  metabase: `<p>Dashboard no Metabase conectado ao GA4 com KPIs de performance de e-commerce.</p><ul><li>Métricas obrigatórias: sessões, taxa de conversão (CVR), AOV, RPV e receita total</li><li>Validar se os números batem com GA4 no mesmo período (tolerância de ±2%)</li><li>Dashboard acessível para toda a equipe sem necessidade de login técnico</li></ul>`,

  plausible: `<p>Instalação opcional do Plausible Analytics para monitoramento leve em tempo real.</p><ul><li>Instalar script no &lt;head&gt; de todas as páginas</li><li>Validar pageviews no painel em tempo real</li><li>Não substitui GA4 — complementa com dados de sessão sem cookies</li></ul><p><em>Item opcional: não é pré-requisito para entrada na Fase 2.</em></p>`,

  // ── Fase 1 · Performance ───────────────────────────────────────────────────
  cwv: `<p>Medir e otimizar os Core Web Vitals no PageSpeed Insights em mobile.</p><ul><li><strong>LCP</strong> (Largest Contentful Paint) &lt; 2.5s — geralmente imagens hero ou produto</li><li><strong>CLS</strong> (Cumulative Layout Shift) &lt; 0.1 — verificar carregamento de banners e fontes</li><li><strong>INP</strong> (Interaction to Next Paint) &lt; 200ms — checar scripts bloqueantes</li></ul><p>Testar a homepage, uma PLP e uma PDP representativa. Documentar scores antes e depois das otimizações.</p>`,

  responsive: `<p>Validar todos os fluxos críticos no viewport de 390px (iPhone 14).</p><ul><li>Home → PLP → PDP → Adicionar ao carrinho → Checkout → Confirmação</li><li>Verificar CTAs visíveis e clicáveis sem overflow horizontal</li><li>Formulários (checkout, cadastro) funcionando corretamente em mobile</li><li>Imagens e banners sem distorção ou corte</li></ul>`,

  accessibility: `<p>Garantir acessibilidade mínima nos elementos interativos principais.</p><ul><li>Verificar contraste dos CTAs principais com ferramenta WCAG (mínimo 4.5:1 para texto normal)</li><li>Adicionar <strong>aria-label</strong> em botões que usam apenas ícones</li><li>Links com texto descritivo (evitar "clique aqui")</li><li>Checar com extensão Lighthouse ou axe DevTools</li></ul>`,

  bugs_audit: `<p>Levantamento completo de bugs críticos mobile antes de avançar para Fase 2.</p><ul><li>Usar gravações do Clarity para identificar erros de usabilidade em mobile</li><li>Testar em pelo menos 3 dispositivos reais (iOS Safari, Android Chrome)</li><li>Documentar cada bug com screenshot, dispositivo e URL afetada</li><li>Todos os bugs críticos resolvidos e re-testados antes de fechar esta etapa</li></ul>`,

  // ── Fase 2 · Produto bem apresentado ──────────────────────────────────────
  pdps_fold: `<p>Garantir que os principais benefícios do produto sejam visíveis sem scroll na versão mobile (390px).</p><ul><li>Verificar em dispositivo real ou Chrome DevTools com viewport 390px</li><li>Benefícios devem estar acima do botão "Comprar"</li><li>Nome, preço e CTA principal visíveis no fold</li><li>Imagem principal do produto carregando rapidamente (LCP)</li></ul>`,

  descriptions: `<p>Reescrever descrições de produto com foco em benefícios, não apenas características.</p><ul><li>Estrutura: problema que resolve → ingrediente chave → resultado esperado → modo de uso</li><li>Usar bullet points para escaneabilidade</li><li>Linguagem direta, sem termos técnicos desnecessários</li><li>Priorizar os 50 produtos com maior receita</li></ul>`,

  product_cards: `<p>Adicionar tags de diferenciação visíveis nos cards de PLP.</p><ul><li>Tags sugeridas: "Mais vendido", "Novo", "Exclusivo", "Favorito das clientes"</li><li>Tags devem ser visíveis na grade de produtos sem precisar de hover</li><li>Implementar lógica de destaque baseada em dados de venda (top X produtos)</li></ul>`,

  before_after: `<p>Criar seção de evidência visual de resultado por produto ou linha.</p><ul><li>Fotos ou vídeos reais de clientes (antes/depois) — preferência sobre imagens de banco</li><li>Depoimentos com resultado específico e tempo de uso</li><li>Posicionar abaixo da imagem principal ou como galeria dedicada na PDP</li><li>Priorizar produtos com maior volume de avaliações positivas</li></ul>`,

  faq: `<p>Criar FAQ por produto nas PDPs dos 50 melhores produtos.</p><ul><li>Extrair perguntas reais de avaliações, SAC e comentários nas redes sociais</li><li>Mínimo 5 perguntas por produto — máximo 10</li><li>Formato acordeão (expandir/recolher) para não poluir a página</li><li>Focar em: resultados, modo de uso, pele/cabelo para quem é indicado, tempo para ver resultado</li></ul>`,

  ingredients: `<p>Criar seção de ingredientes e modo de uso personalizada por produto (não genérica).</p><ul><li>Listar os 3–5 ingredientes ativos principais com breve explicação do benefício de cada um</li><li>Modo de uso em passos numerados, específico para aquele produto</li><li>Evitar copiar o mesmo texto para todos os produtos da linha</li><li>Verificar com a equipe de produto/formulação para precisão técnica</li></ul>`,

  // ── Fase 2 · Percepção de valor ────────────────────────────────────────────
  trust_icons: `<p>Posicionar selos de confiança e diferenciais da marca acima do fold nas páginas principais.</p><ul><li>Selos sugeridos: pagamento seguro, frete rápido, garantia de satisfação, cruelty-free</li><li>Visíveis na home (header ou banner), na PDP (próximo ao CTA) e no checkout</li><li>Usar ícones vetoriais simples — evitar imagens pesadas</li></ul>`,

  shipping_communication: `<p>Tornar a comunicação de frete, promoções e brindes clara e visível em toda a jornada.</p><ul><li>Barra de frete grátis progressivo no header — ex: "Faltam R$50 para frete grátis"</li><li>Comunicação de brindes e promoções na PDP e no carrinho</li><li>Política de frete clara e acessível antes do checkout</li><li>Testar se a barra atualiza corretamente ao adicionar produtos ao carrinho</li></ul>`,

  upsells: `<p>Implementar sugestões contextuais de produtos complementares.</p><ul><li>Na PDP: "Completa a rotina" com 3–4 produtos da mesma linha</li><li>No carrinho: "Monte seu kit" com produto complementar ao que está no carrinho</li><li>Lógica baseada em dados de compra (produtos frequentemente comprados juntos)</li><li>Não mostrar produtos concorrentes diretos na mesma linha</li></ul>`,

  guarantee_banner: `<p>Comunicar a garantia de satisfação com destaque na PDP e no checkout.</p><ul><li>Prazo da garantia visível (ex: "30 dias de garantia ou seu dinheiro de volta")</li><li>Condições simplificadas — sem juridiquês</li><li>Posicionar próximo ao botão "Comprar" na PDP</li><li>Repetir no resumo do carrinho e no checkout</li></ul>`,

  competitor_comparison: `<p>Criar comparativo posicionando a marca frente ao principal concorrente da categoria.</p><ul><li>Identificar o top-1 concorrente de cada linha de produto</li><li>Tabela comparativa com atributos relevantes para o cliente (ingredientes, resultado, preço, garantia)</li><li>Posicionar na PDP das linhas mais competitivas</li><li>Revisão jurídica antes de publicar (claims comparativos)</li></ul>`,

  price_anchoring: `<p>Maximizar a percepção de valor com ancoragem de preço e comunicação de condições de pagamento.</p><ul><li>Preço original riscado visível quando há desconto</li><li>Desconto PIX destacado (ex: "5% de desconto no PIX")</li><li>Parcelamento sem juros em destaque (ex: "ou 3x de R$X sem juros")</li><li>Testar visibilidade em mobile — todos os elementos no fold da PDP</li></ul>`,

  // ── Fase 2 · Encontrabilidade e navegação ─────────────────────────────────
  internal_search: `<p>Otimizar a busca interna para retornar resultados relevantes e tolerar variações.</p><ul><li>Testar com termos genéricos (ex: "hidratante", "shampoo seco") e com erros de digitação</li><li>Verificar se há autocomplete sugerindo produtos e categorias</li><li>Configurar sinônimos para termos-chave da marca</li><li>Busca sem resultado = oportunidade: documentar os termos mais buscados sem resultado</li></ul>`,

  quiz_chatbot: `<p>Implementar ferramenta interativa de recomendação personalizada (quiz ou chat com IA).</p><ul><li>Fluxo máximo de 5 perguntas para chegar à recomendação</li><li>Resultado deve sugerir 2–3 produtos com link direto para PDP</li><li>Disponível na home, na PLP de categorias e como popup de saída</li><li>Testar fluxo completo em mobile — validar que não há abandono por usabilidade</li></ul><p><em>Item de maior esforço da Fase 2 — priorizar se a marca tem catálogo extenso ou perfis de pele/cabelo muito diferentes.</em></p>`,

  plp_filters: `<p>Organizar e estilizar os filtros de PLP para facilitar a navegação.</p><ul><li>Filtros relevantes para beauty: tipo de cabelo/pele, linha, resultado esperado, faixa de preço</li><li>Filtros visíveis sem scroll em desktop e acessíveis via botão em mobile</li><li>Integrados ao design da marca — não parecendo elemento genérico do tema</li><li>Testar se os filtros são URL-friendly (para SEO e compartilhamento)</li></ul>`,

  collection_banners: `<p>Criar identidade visual e copy relevante nas principais páginas de coleção.</p><ul><li>Priorizar as collections com maior volume de tráfego orgânico e pago</li><li>Banner com imagem da linha, headline de benefício e CTA secundário</li><li>Descrição da coleção com palavras-chave relevantes (SEO)</li><li>Atualizar sazonalmente (datas comemorativas, lançamentos)</li></ul>`,

  sticky_ctas: `<p>Implementar botão "Comprar" sticky e sempre visível durante o scroll da PDP mobile.</p><ul><li>Botão fixo no bottom da tela durante todo o scroll em mobile (390px)</li><li>Deve incluir: nome do produto abreviado + preço + ação (Comprar / Adicionar ao carrinho)</li><li>Desaparecer ou recolher quando o CTA principal estiver visível na tela</li><li>Testar em iOS Safari e Android Chrome — verificar sobreposição com barra de navegação do browser</li></ul>`,

  // ── Fase 3 · Segmentação ───────────────────────────────────────────────────
  new_vs_returning: `<p>Implementar lógica de identificação do perfil do visitante na entrada da sessão.</p><ul><li>Novo: primeira visita ou sem histórico de compra</li><li>Recorrente: já comprou ou visitou mais de X vezes</li><li>Usar cookie de sessão + dados de CRM/login quando disponível</li><li>Validar a segmentação via GA4 (segmentos de audiência)</li></ul>`,

  adapted_content: `<p>Exibir vitrines de produto e banners diferentes conforme o perfil identificado.</p><ul><li>Novo: destacar best-sellers, kits de entrada, garantia e prova social</li><li>Recorrente: produtos complementares, lançamentos, programa de fidelidade</li><li>Testar em staging antes de ativar em produção</li><li>Medir CTR e CVR por segmento para validar a personalização</li></ul>`,

  personalized_popups: `<p>Criar pop-ups de captura e banners com mensagem adaptada ao segmento.</p><ul><li>Novo: oferta de boas-vindas (desconto na primeira compra ou frete grátis)</li><li>Recorrente: acesso antecipado a lançamento ou oferta de reposição</li><li>Abandono: recuperação com oferta específica + urgência real (estoque, prazo)</li><li>Frequência máxima: 1 pop-up por sessão, com delay de 15–30s</li></ul>`,

  // ── Fase 3 · CRM ──────────────────────────────────────────────────────────
  location_conditions: `<p>Exibir condições de frete e promoções dinamicamente conforme localização do visitante.</p><ul><li>Detectar estado/região via IP ou CEP informado</li><li>Mostrar frete estimado antes do checkout</li><li>Promoções regionais (ex: frete grátis para SP) exibidas automaticamente para o segmento correto</li><li>Validar com VPN simulando regiões diferentes</li></ul>`,

  cart_recovery: `<p>Criar fluxo de recuperação de carrinho com mensagem adaptada ao segmento do cliente.</p><ul><li>E-mail de recuperação enviado em até 1h após abandono</li><li>Mensagem diferente para novo (oferta) vs. recorrente (lembrete de rotina)</li><li>Incluir imagem do produto abandonado e link direto para o carrinho</li><li>Testar taxas de abertura e clique — otimizar assunto do e-mail</li></ul>`,

  crm_campaigns: `<p>Criar campanhas de e-mail e WhatsApp segmentadas por estágio na jornada.</p><ul><li>Segmentos mínimos: novo comprador, comprador recorrente, inativo (sem compra há 60d), abandono de carrinho</li><li>Cadência: boas-vindas (D+0), onboarding de produto (D+7), recompra (D+30 ou D+45)</li><li>Personalizar com nome, produto comprado e sugestão de complemento</li><li>KPIs de acompanhamento: taxa de abertura, clique e receita por campanha</li></ul>`,

  // ── Fase 3 · Preço ────────────────────────────────────────────────────────
  price_elasticity: `<p>Estruturar testes A/B de preço em produtos selecionados para medir elasticidade.</p><ul><li>Selecionar 3–5 produtos com volume de tráfego suficiente para resultado estatístico</li><li>Testar variação de ±10–15% no preço base</li><li>Medir impacto em CVR, AOV e receita total — não apenas em unidades vendidas</li><li>Duração mínima: 2 semanas por teste, evitando datas sazonais</li></ul>`,

  seasonal_promos: `<p>Analisar o impacto de promoções sazonais na conversão para otimizar calendário comercial.</p><ul><li>Mapear Black Friday, Dia das Mães, Natal e datas relevantes para a categoria de beauty</li><li>Comparar CVR, AOV e ticket médio durante vs. fora do período promocional</li><li>Identificar quais promoções canibalizaram margem sem aumento proporcional de conversão</li><li>Criar playbook de promoções com aprendizados documentados</li></ul>`,

  price_variants: `<p>Criar variantes de preço ou condição por perfil de cliente e canal de entrada.</p><ul><li>Canal pago (Meta/Google): landing pages com oferta específica para o tráfego de anúncio</li><li>Orgânico: preço padrão com destaque de parcelamento e benefícios</li><li>CRM/e-mail: cupom exclusivo para a base fidelizada</li><li>Validar que não há conflito entre canais (cliente vê preços diferentes na mesma sessão)</li></ul>`,
}

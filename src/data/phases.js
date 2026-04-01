export const BRANDS = [
  { id: 'apice', name: 'Ápice', segment: 'Shampoo e condicionador', initials: 'Áp' },
  { id: 'barbours', name: "Barbour's", segment: 'Aromas e body splash', initials: 'Ba' },
  { id: 'rituaria', name: 'Rituária', segment: 'Suplementos e rituais', initials: 'Ri' },
  { id: 'kokeshi', name: 'Kokeshi', segment: 'Skincare', initials: 'Ko' },
  { id: 'lescent', name: 'Lescent', segment: 'Perfumaria', initials: 'Le' },
  { id: 'aua', name: 'Auá', segment: 'Produtos naturais', initials: 'Au', hidden: true },
  { id: 'bysamia', name: 'By Samia', segment: 'Aromaterapia', initials: 'BS', hidden: true },
]

export const VISIBLE_BRANDS = BRANDS.filter(b => !b.hidden)

export const PHASES = [
  {
    id: 'phase1',
    number: 1,
    name: 'Analytics & Performance',
    tagline: 'Dados confiáveis · site rápido · zero bugs críticos',
    color: '#1D9E75',
    colorLight: '#ECFDF5',
    colorMuted: '#A7F3D0',
    colorDark: '#065F46',
    cssClass: 'phase-accent-1',
    duration: '4–6 semanas',
    startWeek: 1,
    endWeek: 6,
    entry: 'Ponto de partida — sem pré-requisitos',
    description: 'Fase de fundação. Antes de otimizar qualquer coisa, é preciso ter dados confiáveis e um site tecnicamente estável. Sem GA4, Clarity e Core Web Vitals adequados, qualquer resultado de teste será questionável.',
    sections: [
      {
        id: 'tracking',
        name: 'Rastreamento e dados',
        requirements: [
          {
            id: 'ga4',
            label: 'GA4 implementado e validado',
            tooltip: 'GA4 configurado com eventos customizados validados via DebugView. Pré-requisito para análise de funil completo.',
          },
          {
            id: 'ga4_events',
            label: 'Eventos de funil mapeados no GA4',
            tooltip: 'Eventos de pageview, add_to_cart, begin_checkout e purchase mapeados e validados em produção.',
          },
          {
            id: 'clarity',
            label: 'Clarity instalado e configurado',
            tooltip: 'Microsoft Clarity instalado com script ativo em todas as páginas. Confirmado no painel do Clarity.',
          },
          {
            id: 'clarity_sessions',
            label: 'Sessões, heatmaps e rage/dead clicks ativos',
            tooltip: 'Gravações de sessão, heatmaps de clique/scroll e filtros de rage clicks e dead clicks configurados.',
          },
          {
            id: 'metabase',
            label: 'Metabase com dados consolidados',
            tooltip: 'Dashboard no Metabase com KPIs principais (sessões, taxa de conversão, receita) conectados ao GA4.',
          },
          {
            id: 'plausible',
            label: 'Plausible — monitoramento D0 (opcional)',
            tooltip: 'Monitoramento em tempo real via Plausible Analytics. Opcional — sem impacto no critério de entrada para Fase 2.',
          },
        ],
      },
      {
        id: 'performance',
        name: 'Performance e qualidade técnica',
        requirements: [
          {
            id: 'cwv',
            label: 'Core Web Vitals satisfatórios (LCP, CLS, INP)',
            tooltip: 'LCP < 2.5s, CLS < 0.1, INP < 200ms medidos no PageSpeed Insights em mobile. Base para qualquer teste.',
          },
          {
            id: 'responsive',
            label: 'Site responsivo validado em 390px',
            tooltip: 'Todos os fluxos críticos (home, PLP, PDP, carrinho, checkout) testados em iPhone 14 (390px).',
          },
          {
            id: 'accessibility',
            label: 'Contraste e acessibilidade básica nos CTAs',
            tooltip: 'CTAs principais com contraste mínimo WCAG AA (4.5:1) e aria-labels adequados.',
          },
          {
            id: 'bugs_audit',
            label: 'Auditoria de bugs críticos mobile concluída',
            tooltip: 'Lista completa de bugs críticos mobile levantada via Clarity e testada manualmente. Todos resolvidos antes da Fase 2.',
          },
        ],
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    name: 'Apresentação, Valor e Navegação',
    tagline: 'Produto comunicado · valor claro · cliente encontra o que busca',
    color: '#2E6FD8',
    colorLight: '#EFF6FF',
    colorMuted: '#BFDBFE',
    colorDark: '#1E3A5F',
    cssClass: 'phase-accent-2',
    duration: '8–12 semanas',
    startWeek: 7,
    endWeek: 18,
    entry: 'GA4 validado · CWV satisfatórios · bugs críticos resolvidos',
    description: 'Com a fundação pronta, o foco muda para os maiores alavancadores de conversão: produto bem apresentado, percepção de valor clara e navegação facilitada. São as frentes de maior impacto direto em CVR.',
    sections: [
      {
        id: 'product_presentation',
        name: 'Frente 1 — Produto bem apresentado',
        requirements: [
          {
            id: 'pdps_fold',
            label: 'PDPs com benefícios e bullet points acima do fold',
            tooltip: 'Principais benefícios do produto visíveis sem scroll na versão mobile (390px) da PDP.',
          },
          {
            id: 'descriptions',
            label: 'Descrições curtas, atrativas e escaneáveis',
            tooltip: 'Descrições revisadas com copywriting orientado a benefícios, bullet points e linguagem direta.',
          },
          {
            id: 'product_cards',
            label: 'Cards de produto com tag de diferenciação',
            tooltip: 'Tags visuais como "Mais vendido", "Novo" ou diferencial principal visíveis nos cards de PLP.',
          },
          {
            id: 'before_after',
            label: 'Seção antes/depois por produto ou linha',
            tooltip: 'Evidência visual de resultado — fotos ou depoimentos antes/depois por produto ou linha de produto.',
          },
          {
            id: 'faq',
            label: 'FAQ por produto — top 50 best-sellers',
            tooltip: 'Seção de perguntas e respostas nas PDPs dos 50 produtos mais vendidos, baseada em dúvidas reais.',
          },
          {
            id: 'ingredients',
            label: 'Ingredientes e modo de uso customizados',
            tooltip: 'Seção de ingredientes principais e modo de uso otimizada por produto — não genérica.',
          },
        ],
      },
      {
        id: 'value_perception',
        name: 'Frente 2 — Percepção de valor',
        requirements: [
          {
            id: 'trust_icons',
            label: 'Trust icons visíveis em home e PDP',
            tooltip: 'Selos de segurança, garantia e diferenciais da marca visíveis acima do fold nas páginas principais.',
          },
          {
            id: 'shipping_communication',
            label: 'Comunicação clara de frete, promoções e brindes',
            tooltip: 'Barra de frete grátis progressivo e comunicação de promoções/brindes no header, PDP e carrinho.',
          },
          {
            id: 'upsells',
            label: 'Upsells contextuais — kits e complementos de linha',
            tooltip: 'Produtos complementares sugeridos na PDP ("complementa a rotina") e no carrinho ("monte seu kit").',
          },
          {
            id: 'guarantee_banner',
            label: 'Banner de garantia de satisfação',
            tooltip: 'Garantia de satisfação com prazo e condições claras visível na PDP e no checkout.',
          },
          {
            id: 'competitor_comparison',
            label: 'Comparativo marca vs. concorrente',
            tooltip: 'Tabela ou seção comparativa posicionando a marca frente ao concorrente principal da categoria.',
          },
          {
            id: 'price_anchoring',
            label: 'Ancoragem de preço e comunicação de parcelamento/PIX',
            tooltip: 'Preço original riscado, parcelamento sem juros e desconto PIX claramente destacados na PDP.',
          },
        ],
      },
      {
        id: 'navigation',
        name: 'Frente 3 — Encontrabilidade e navegação',
        requirements: [
          {
            id: 'internal_search',
            label: 'Busca interna funcional e relevante',
            tooltip: 'Busca retornando resultados relevantes com autocomplete, sinônimos e tolerância a typos.',
          },
          {
            id: 'quiz_chatbot',
            label: 'Quiz ou chatbot com IA para recomendação',
            tooltip: 'Ferramenta interativa (quiz ou chat) para recomendação personalizada. Maior esforço/impacto da Fase 2.',
          },
          {
            id: 'plp_filters',
            label: 'Filtros de PLP organizados e estilizados',
            tooltip: 'Filtros funcionais, visualmente integrados ao design e organizados por critérios relevantes ao cliente.',
          },
          {
            id: 'collection_banners',
            label: 'Banners e títulos nas principais collection pages',
            tooltip: 'Identidade visual e copy nas principais páginas de coleção — especialmente as de maior tráfego.',
          },
          {
            id: 'sticky_ctas',
            label: 'CTAs claros e sticky em mobile',
            tooltip: 'Botão "Comprar" sticky e sempre visível no scroll da PDP mobile. Validado em 390px.',
          },
        ],
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    name: 'Personalização e Inteligência de Receita',
    tagline: 'Segmentação · conteúdo adaptado · exploração de preço',
    color: '#6B52D4',
    colorLight: '#F5F3FF',
    colorMuted: '#DDD6FE',
    colorDark: '#3B1FA3',
    cssClass: 'phase-accent-3',
    duration: '12+ semanas',
    startWeek: 19,
    endWeek: 30,
    entry: 'Frentes 1–3 da Fase 2 concluídas · funil de conversão validado',
    description: 'Quando a base converte bem, personalização e inteligência de preço desbloqueiam o próximo nível de crescimento. Segmentação de público, CRM avançado e testes de elasticidade ampliam o LTV e a receita por visita.',
    sections: [
      {
        id: 'segmentation',
        name: 'Ação 1 — Segmentação e conteúdo adaptado',
        requirements: [
          {
            id: 'new_vs_returning',
            label: 'Identificação novo vs. recorrente na entrada',
            tooltip: 'Lógica de identificação de visitante novo vs. recorrente implementada e validada na sessão.',
          },
          {
            id: 'adapted_content',
            label: 'Conteúdo e vitrines adaptados por perfil de cliente',
            tooltip: 'Vitrines de produto e banners com conteúdo dinâmico baseado no perfil identificado do visitante.',
          },
          {
            id: 'personalized_popups',
            label: 'Pop-up e banners personalizados por segmento',
            tooltip: 'Pop-ups de captura e banners com mensagens segmentadas por perfil (novo, recorrente, abandono).',
          },
        ],
      },
      {
        id: 'crm_journey',
        name: 'Ação 2 — Jornada e CRM personalizado',
        requirements: [
          {
            id: 'location_conditions',
            label: 'Condições especiais por localização',
            tooltip: 'Promoções de frete e condições exibidas dinamicamente pela região/estado do visitante.',
          },
          {
            id: 'cart_recovery',
            label: 'Recuperação de carrinho personalizada por segmento',
            tooltip: 'Fluxo de recuperação com mensagem e oferta adaptadas ao segmento do cliente abandonador.',
          },
          {
            id: 'crm_campaigns',
            label: 'Campanhas de CRM segmentadas por jornada',
            tooltip: 'Campanhas de e-mail e WhatsApp segmentadas por estágio na jornada de compra.',
          },
        ],
      },
      {
        id: 'price_intelligence',
        name: 'Ação 3 — Exploração de variação de preço',
        requirements: [
          {
            id: 'price_elasticity',
            label: 'Testes de elasticidade de preço por produto/período',
            tooltip: 'Testes A/B de preço em produtos selecionados para medir impacto em CVR, AOV e receita total.',
          },
          {
            id: 'seasonal_promos',
            label: 'Análise de impacto de promoções sazonais em CVR',
            tooltip: 'Análise estruturada do impacto de promoções sazonais (BF, datas comemorativas) na conversão.',
          },
          {
            id: 'price_variants',
            label: 'Variantes de preço por segmento e canal de entrada',
            tooltip: 'Variação de preço ou condição (parcelamento, brinde) por perfil de cliente e origem do tráfego.',
          },
        ],
      },
    ],
  },
]

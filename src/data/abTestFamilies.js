// Taxonomia de "famílias" de testes A/B para agrupamento cross-marca.
//
// Este módulo é PROPOSITALMENTE sem imports (só funções puras + dados), para
// poder ser importado tanto pelo browser (Vite/React) quanto pelo Node do
// comando de sync (`elevateSync.js` / scripts). NÃO adicione dependências aqui.
//
// Estratégia: cada teste (nome livre digitado no Elevate) é normalizado e
// casado, por keyword, contra uma lista ordenada de famílias. A primeira
// família cujo ALGUM keywordGroup tiver TODAS as keywords contidas no nome
// normalizado vence. Sem match → '__unclassified' (vai para o balde "A triar").
//
// Para mapear um teste novo a uma família existente, basta que o nome contenha
// as keywords — sem alterar código. Para criar uma família nova, adicione uma
// entrada em FAMILIES (regras mais específicas ANTES das genéricas).

/** Áreas do site usadas para filtro/rotulagem. */
export const AREAS = {
  home: 'Home',
  pdp: 'PDP',
  cart: 'Carrinho',
  collection: 'Coleção',
  tema: 'Tema',
  feat: 'Feature',
  preco: 'Preço',
  outros: 'Outros',
}

/**
 * Normaliza o nome de um teste para matching:
 * lowercase, sem acentos, sem [tags], sem "fase N", sem nome de marca,
 * sem sufixos de variação ("50/50", "v2", "abc", "(control)"...).
 */
export function normalizeTestName(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/\[[^\]]*\]/g, ' ') // remove [tags]
    .replace(/\bfase\s*\d+\b/g, ' ') // remove "fase N"
    .replace(/\b(apice|barbours|kokeshi|rituaria|lescent)\b/g, ' ')
    .replace(/\b50\/50\b|\bv2\b|\ba\/b\/c\b|\babc\b|\(control\)|\(main\)|\(develop\)/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Deriva a área a partir do prefixo [TAG] do nome (ou de palavras-chave soltas).
 * Usado principalmente para os testes não classificados ("A triar").
 */
export function extractArea(name) {
  const raw = (name || '').toLowerCase()
  const tagMatch = raw.match(/\[([^\]]+)\]/)
  const tag = tagMatch ? tagMatch[1].trim() : ''
  const n = normalizeTestName(name)

  const map = [
    ['home', ['home', 'hero', 'announcement', 'vitrine']],
    ['pdp', ['pdp', 'produto', 'upsell', 'imagens']],
    ['cart', ['cart', 'carrinho', 'checkout']],
    ['collection', ['collection', 'colecao', 'plp']],
    ['tema', ['tema', 'theme', 'rebrand']],
    ['preco', ['preco', 'price', 'pix', 'desconto', 'parcelado']],
    ['feat', ['feat', 'feature', 'url', 'whatsapp']],
  ]
  for (const [area, keys] of map) {
    if (keys.some(k => tag.includes(k))) return area
  }
  for (const [area, keys] of map) {
    if (keys.some(k => n.includes(k))) return area
  }
  return 'outros'
}

/**
 * Famílias de teste. ORDEM IMPORTA: primeiro match vence, então regras mais
 * específicas devem vir antes das genéricas (ex.: `upsell-ios-toggle` antes de
 * `upsell-pdp`). Casa se ALGUM keywordGroup tiver TODAS as suas keywords no
 * nome normalizado.
 */
export const FAMILIES = [
  { id: 'videowise', label: 'Videowise (vídeos UGC)', area: 'pdp', keywordGroups: [['videowise'], ['judge me'], ['videos']] },
  { id: 'carrinho-tipo', label: 'Tipo de carrinho (Upcart/GoCart+)', area: 'cart', keywordGroups: [['carrinho', 'upcart'], ['carrinho', 'gocart'], ['carrinho', 'nativo'], ['upcart']] },
  { id: 'carrossel-vitrine', label: 'Carrossel x Grid na vitrine', area: 'home', keywordGroups: [['carrosel'], ['carrossel'], ['vitrine', 'grid']] },
  { id: 'announcement-bar', label: 'Banner na Announcement Bar', area: 'home', keywordGroups: [['announcement bar'], ['banner', 'announcement']] },
  { id: 'trust-icons', label: 'Trust Icons na Home', area: 'home', keywordGroups: [['trust icons']] },
  { id: 'desconto-pix', label: 'Desconto no Pix', area: 'preco', keywordGroups: [['desconto', 'pix'], ['pix']] },
  { id: 'card-produto', label: 'Card de produto refatorado', area: 'tema', keywordGroups: [['card', 'produto']] },
  { id: 'hero-slider', label: 'Hero slider layout (Home)', area: 'home', keywordGroups: [['hero', 'slider'], ['hero slider']] },
  { id: 'popup-whatsapp', label: 'Pop-up / captação WhatsApp', area: 'feat', keywordGroups: [['whatsapp'], ['pop up', 'whatsapp']] },
  { id: 'vitrine-seletor', label: 'Vitrine com seletor de linha', area: 'home', keywordGroups: [['vitrine', 'seletor'], ['seletor', 'linha'], ['seletor', 'tipo']] },
  { id: 'collection-1stfold', label: 'Collection 1st fold enriquecido', area: 'collection', keywordGroups: [['1st fold'], ['collection', 'enriquec'], ['collection', 'banner']] },
  { id: 'selo-dinamico', label: 'Selo dinâmico na PDP', area: 'pdp', keywordGroups: [['selo', 'dinamico'], ['selos'], ['selo']] },
  { id: 'preco-parcelado', label: 'Formatação / preço parcelado', area: 'preco', keywordGroups: [['preco', 'parcelado'], ['parcelado'], ['formatacao', 'preco'], ['informacoes', 'preco']] },
  { id: 'upsell-ios-toggle', label: 'Upsell / toggle iOS na PDP', area: 'pdp', keywordGroups: [['ios', 'upsell'], ['toggle', 'ios'], ['upsell', 'ios'], ['ios', 'layout']] },
  { id: 'upsell-pdp', label: 'Upsell na PDP (geral)', area: 'pdp', keywordGroups: [['upsell']] },
  { id: 'tema-gogroup', label: 'Tema Gogroup x atual', area: 'tema', keywordGroups: [['gogroup']] },
  { id: 'virada-tema', label: 'Virada de tema / rebranding', area: 'tema', keywordGroups: [['virada', 'tema'], ['novo tema'], ['rebrand'], ['tema novo'], ['estrutura', 'tema']] },
  { id: 'prova-social-review', label: 'Prova social / reviews na PDP', area: 'pdp', keywordGroups: [['prova social'], ['review'], ['estrelas']] },
  { id: 'credibilidade-desc', label: 'Credibilidade de desconto', area: 'preco', keywordGroups: [['credibilidade', 'desconto']] },
  { id: 'cupom-carrinho', label: 'Mensagem de cupom no carrinho', area: 'cart', keywordGroups: [['cupom', 'carrinho'], ['cupom', 'checkout'], ['cupom']] },
  { id: 'conteudo-pdp', label: 'PDP incrementada (conteúdo)', area: 'pdp', keywordGroups: [['incremento', 'conteudo'], ['conteudo incrementado'], ['pdp incrementada'], ['incrementad']] },
  { id: 'cta-pdp', label: 'CTA / botão de compra na PDP', area: 'pdp', keywordGroups: [['cta'], ['adicionar ao carrinho', 'comprar']] },
  { id: 'urgencia-pdp', label: 'Urgência / escassez na PDP', area: 'pdp', keywordGroups: [['urgencia'], ['vendendo rapido'], ['cronometro']] },
  { id: 'frete-gratis', label: 'Comunicação de frete grátis', area: 'pdp', keywordGroups: [['frete gratis']] },
  { id: 'reembolso-garantia', label: 'Menções a reembolso / garantia', area: 'feat', keywordGroups: [['reembolso'], ['garantia']] },
  { id: 'home-institucional', label: 'Home institucional / hero', area: 'home', keywordGroups: [['home institucional']] },
]

/** Sentinela para testes que não casaram nenhuma família. */
export const UNCLASSIFIED_ID = '__unclassified'

/**
 * Classifica um nome de teste numa família.
 * @returns {{ id: string, label: string|null, area: string }}
 */
export function classifyTest(name) {
  const n = normalizeTestName(name)
  for (const fam of FAMILIES) {
    for (const group of fam.keywordGroups) {
      if (group.every(k => n.includes(k))) {
        return { id: fam.id, label: fam.label, area: fam.area }
      }
    }
  }
  return { id: UNCLASSIFIED_ID, label: null, area: extractArea(name) }
}

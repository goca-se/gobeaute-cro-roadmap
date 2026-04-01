// ── JWT signing via Web Crypto (browser-native, sem dependências) ─────────────

function b64url(input) {
  const str = input instanceof Uint8Array
    ? String.fromCharCode(...input)
    : input
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function generateEmbedUrl(baseUrl, secretKey, dashboardId, params = {}) {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    resource: { dashboard: Number(dashboardId) },
    params,
    exp: Math.round(Date.now() / 1000) + 600, // 10 min
  }))
  const message = `${header}.${payload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
  const token = `${message}.${b64url(sig)}`
  return `${baseUrl}/embed/dashboard/${token}#background=false&bordered=true&titled=true`
}

// ─────────────────────────────────────────────────────────────────────────────

export async function fetchCardValue(baseUrl, embedSecret, cardId) {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    resource: { question: Number(cardId) },
    params: {},
    exp: Math.round(Date.now() / 1000) + 600,
  }))
  const message = `${header}.${payload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(embedSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
  const token = `${message}.${b64url(sig)}`

  const res = await fetch(`${baseUrl}/api/embed/card/${token}/query/json`)
  if (!res.ok) throw new Error(`Card ${cardId} fetch failed (${res.status})`)
  const json = await res.json()

  // Handle both response formats: { data: { rows: [[val]] } } and [[val]]
  const firstRow = json.data?.rows?.[0] ?? json[0] ?? null
  if (!firstRow) return null
  return (Array.isArray(firstRow) ? firstRow[0] : Object.values(firstRow)[0]) ?? null
}

export async function testConnection(baseUrl, apiKey) {
  const res = await fetch(`${baseUrl}/api/user/current`, {
    headers: { 'X-Api-Key': apiKey },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Falha na autenticação (${res.status}): ${text}`)
  }
  return await res.json()
}

export async function fetchBrandMetrics(appSettings, brandCardIds) {
  const { baseUrl, embedSecret } = appSettings?.metabase || {}
  if (!baseUrl || !embedSecret) return null

  const cards = brandCardIds || {}
  const metricKeys = ['cvr', 'aov', 'rpv', 'sessions', 'revenue']
  const results = {}

  await Promise.all(metricKeys.map(async key => {
    const cardId = cards[key]
    if (cardId == null) { results[key] = null; return }
    try {
      results[key] = await fetchCardValue(baseUrl, embedSecret, cardId)
    } catch (e) {
      console.error(`[Metabase] Card ${cardId} (${key}) error:`, e)
      results[key] = null
    }
  }))

  const now = new Date()
  return {
    ...results,
    updatedAt: now.toISOString(),
    period: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  }
}

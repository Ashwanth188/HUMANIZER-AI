const SAPLING_URL = 'https://api.sapling.ai/api/v1/aidetect'

/**
 * Score text with Sapling's trained AI-detection model (real classifier,
 * not a heuristic). Returns null when no API key is configured so callers
 * can treat this as an optional extra signal.
 * @param {string} text
 * @returns {Promise<{ score: number, provider: string } | null>}
 */
export async function detectAIExternal(text) {
  const apiKey = (process.env.SAPLING_API_KEY || '').trim().replace(/^["']|["']$/g, '')
  if (!apiKey) return null

  const res = await fetch(SAPLING_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: apiKey, text, sent_scores: false }),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[detect] Sapling API error (${res.status}): ${body.slice(0, 300)}`)
    const err = new Error(`Sapling API error (${res.status})`)
    err.status = 502
    throw err
  }

  const data = await res.json()
  if (typeof data.score !== 'number' || Number.isNaN(data.score)) {
    throw new Error('Sapling API returned no score')
  }
  return {
    score: Math.max(0, Math.min(100, Math.round(data.score * 100))),
    provider: 'Sapling',
  }
}

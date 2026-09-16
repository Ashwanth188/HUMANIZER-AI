const SAPLING_URL = 'https://api.sapling.ai/api/v1/aidetect'

/**
 * Score text with Sapling's trained AI-detection model (real classifier,
 * not a heuristic). Returns null when no API key is configured so callers
 * can treat this as an optional extra signal.
 * @param {string} text
 * @returns {Promise<{ score: number, provider: string } | null>}
 */
export async function detectAIExternal(text) {
  const apiKey = process.env.SAPLING_API_KEY
  if (!apiKey) return null

  const res = await fetch(SAPLING_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: apiKey, text, sent_scores: false }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = new Error(`Sapling API error (${res.status}): ${body.slice(0, 300)}`)
    err.status = 502
    throw err
  }

  const data = await res.json()
  return {
    score: Math.round((data.score || 0) * 100),
    provider: 'Sapling',
  }
}

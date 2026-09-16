const BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/api`

async function postJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export function humanizeText({ text, tone, strength }) {
  return postJSON('/humanize', { text, tone, strength })
}

export function detectText({ text }) {
  return postJSON('/detect', { text })
}

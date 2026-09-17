const BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/api`

async function postJSON(path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running and try again.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (data && data.error) throw new Error(data.error)
    if ([502, 503, 504].includes(res.status)) {
      throw new Error('The server is not responding. Make sure the backend is running (cd server && npm run dev).')
    }
    throw new Error(`Request failed (${res.status})`)
  }
  if (!data) {
    // e.g. a static host returned index.html because VITE_API_BASE_URL isn't set
    throw new Error('Unexpected response from the server. Check that VITE_API_BASE_URL points to your API.')
  }
  return data
}

export function humanizeText({ text, tone, strength }) {
  return postJSON('/humanize', { text, tone, strength })
}

export function detectText({ text }) {
  return postJSON('/detect', { text })
}

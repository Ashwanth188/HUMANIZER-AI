import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { humanizeText } from './lib/humanize.js'
import { detectAIText } from './lib/detect.js'
import { detectAIExternal } from './lib/externalDetect.js'

const app = express()
const PORT = process.env.PORT || 8787

app.set('trust proxy', 1)
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a few minutes and try again.' },
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/humanize', apiLimiter, async (req, res) => {
  try {
    const { text, tone, strength } = req.body || {}
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Provide non-empty "text" to humanize.' })
    }
    if (text.length > 20000) {
      return res.status(400).json({ error: 'Text is too long (max 20,000 characters).' })
    }
    const outcome = await humanizeText({ text, tone, strength })
    res.json({
      result: typeof outcome === 'string' ? outcome : outcome.text,
      score: outcome?.score,
    })
  } catch (err) {
    console.error('[humanize] error:', err.message)
    res.status(err.status || 500).json({ error: err.message || 'Humanize failed.' })
  }
})

app.post('/api/detect', apiLimiter, async (req, res) => {
  try {
    const { text } = req.body || {}
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Provide non-empty "text" to analyze.' })
    }
    if (text.length > 50000) {
      return res.status(400).json({ error: 'Text is too long (max 50,000 characters).' })
    }
    const result = detectAIText(text)

    try {
      result.external = await detectAIExternal(text)
    } catch (err) {
      console.error('[detect] external provider error:', err.message)
      result.external = null
      result.externalError = err.message
    }

    res.json(result)
  } catch (err) {
    console.error('[detect] error:', err.message)
    res.status(500).json({ error: err.message || 'Detection failed.' })
  }
})

// Malformed JSON / oversized bodies: respond with JSON instead of Express's HTML page.
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' })
  }
  console.error('[server] unhandled error:', err)
  res.status(500).json({ error: 'Internal server error.' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Smart server listening on http://0.0.0.0:${PORT} (http://localhost:${PORT})`)
  if (!process.env.GROQ_API_KEY) {
    console.warn('Warning: GROQ_API_KEY is not set — /api/humanize will fail until it is configured in server/.env')
  }
  if (!process.env.SAPLING_API_KEY) {
    console.warn('Note: SAPLING_API_KEY is not set — /api/detect will only return the local heuristic score, no real-detector score.')
  }
})

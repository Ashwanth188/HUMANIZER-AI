# Smart

A small full-stack app with two tools:

1. **Humanize** — rewrites AI-generated text in a more natural, human voice (calls the Groq API, free tier).
2. **AI Check %** — estimates how likely a piece of text is to be AI-generated, using writing-pattern heuristics (sentence-length variance, stock AI phrases, repetitive openers, contraction usage, repeated phrasing, punctuation patterns). This runs entirely locally — no external API, no key required.

## Stack

- **Client**: React + Vite + Tailwind CSS
- **Server**: Node + Express

## Project structure

```
humanize-ai/
  client/     # React frontend (Vite)
  server/     # Express backend (API)
```

## Setup

### 1. Server

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and add your Groq API key (get a free one at https://console.groq.com/keys):

```
GROQ_API_KEY=gsk_...
```

The **AI Check %** feature works without any key. The **Humanize** feature requires this key — without it, `/api/humanize` will return a clear error.

Run the server:

```bash
npm run dev
```

It starts on `http://localhost:8787`.

### 2. Client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

It starts on `http://localhost:5173` and proxies `/api/*` requests to the server automatically (see `client/vite.config.js`).

Open `http://localhost:5173` in your browser.

## How AI Check % works

`server/lib/detect.js` combines six heuristic signals into a single 0–100 score:

| Signal | What it measures |
| --- | --- |
| Sentence length uniformity | AI text tends to have more uniform sentence lengths (low variance) |
| Stock AI phrases | Detects common ChatGPT-style filler ("moreover", "it's important to note", "delve into", etc.) |
| Repetitive sentence openers | Overuse of transition words to start sentences |
| Contraction usage | Human writing tends to use more contractions |
| Repeated phrasing | Exact repeated word-pairs (bigrams) |
| Punctuation patterns | Overuse of em-dashes / semicolons |

This is a **heuristic estimate**, not a trained ML classifier — it's a useful signal, not a definitive verdict. It can be fooled and can misjudge short or unusual text. For production-grade accuracy you'd want to swap `detect.js` for a call to a trained detection model/API, but this keeps the feature free and dependency-free out of the box.

## How Humanize works

`server/lib/humanize.js` sends your text to the Groq API (default model: `openai/gpt-oss-20b`, chosen for speed — configurable via `GROQ_MODEL` in `.env`, e.g. set it to `openai/gpt-oss-120b` for higher quality at the cost of latency) with a system prompt that rewrites it naturally while preserving meaning. You can choose a **tone** (Neutral / Casual / Professional / Academic) and a **rewrite strength** (Light touch / Balanced / Heavy rewrite) in the UI.

## Notes / next steps

- No database or auth yet — it's a stateless two-endpoint API. Add a DB if you want to save history.
- Rate limiting is enabled via `express-rate-limit` (30 requests / 15 min per IP on `/api/humanize` and `/api/detect`). Tune it in `server/index.js` before deploying publicly.
- When deploying the client separately (e.g. Vercel), set `VITE_API_BASE_URL` to your deployed API's origin at build time — otherwise `/api/*` requests hit the static host and fail.
- To deploy: host `server/` anywhere that runs Node (Render, Railway, Fly.io, etc.) with `GROQ_API_KEY` set as an env var, run `npm run build` in `client/` and serve the static output (e.g. via Vercel/Netlify, or have Express serve `client/dist`) pointed at your deployed API URL.

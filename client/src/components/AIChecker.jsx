import React, { useState } from 'react'
import { detectText } from '../api.js'

function scoreColor(pct) {
  if (pct >= 66) return { ring: '#f87171', text: 'text-red-500 dark:text-red-400', label: 'Likely AI-generated' }
  if (pct >= 33) return { ring: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', label: 'Mixed signals' }
  return { ring: '#22c55e', text: 'text-emerald-600 dark:text-emerald-400', label: 'Likely human-written' }
}

function Gauge({ pct }) {
  const c = scoreColor(pct)
  const r = 54
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct / 100)

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg className="h-40 w-40 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={c.ring}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">AI likelihood</span>
      </div>
    </div>
  )
}

export default function AIChecker() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheck() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await detectText({ text: input })
      setResult(data)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const primaryScore = result ? (result.external ? result.external.score : result.score) : null
  const primaryIsReal = Boolean(result && result.external)
  const c = result ? scoreColor(primaryScore) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <label className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Text to analyze</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text to check…"
          rows={16}
          className="scroll-thin w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-600"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-600">
          <span>{input.trim() ? `${input.trim().split(/\s+/).length} words` : ''}</span>
          <span>{input.length} chars</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleCheck}
        disabled={loading || !input.trim()}
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? 'Analyzing…' : 'Check AI %'}
      </button>

      {result && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-col items-center gap-2">
            <Gauge pct={primaryScore} />
            <span className={`text-sm font-medium ${c.text}`}>{c.label}</span>
            <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-600">
              {primaryIsReal ? `Real detector (${result.external.provider})` : 'Local heuristic estimate'}
            </span>
          </div>

          {primaryIsReal && (
            <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600">
              Trained classifier score. Note: even well-humanized text is often still caught —
              detectors like this are built specifically to recognize AI-assisted rewrites.
            </p>
          )}

          {!primaryIsReal && !result.externalError && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400">
              This is a local heuristic, not a trained classifier — add SAPLING_API_KEY in server/.env for a real AI-detection verdict.
            </p>
          )}
          {!primaryIsReal && result.externalError && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400">
              Real detector check failed ({result.externalError}), showing the local heuristic instead.
            </p>
          )}

          <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Writing-pattern signals (heuristic breakdown{primaryIsReal ? ', not the primary score' : ''})
            </h3>
            {result.signals.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{s.name}</span>
                  <span className="text-slate-400 dark:text-slate-500">{s.value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${s.contribution}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

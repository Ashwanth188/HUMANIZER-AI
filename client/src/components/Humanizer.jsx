import React, { useEffect, useRef, useState } from 'react'
import { humanizeText } from '../api.js'
import { exportAsDocx, exportAsPdf, exportAsTxt } from '../exportUtils.js'
import { extractTextFromFile } from '../fileImport.js'

const EXPORT_FORMATS = [
  { id: 'txt', label: '.TXT' },
  { id: 'docx', label: '.DOCX' },
  { id: 'pdf', label: '.PDF' },
]

const TONES = [
  { id: 'Neutral', description: 'Balanced, everyday phrasing.' },
  { id: 'Casual', description: 'Relaxed and conversational.' },
  { id: 'Professional', description: 'Polished, workplace-ready.' },
  { id: 'Academic', description: 'Formal, precise language.' },
]
const STRENGTHS = [
  { id: 'light', label: 'Light touch', description: 'Minor smoothing, stays close to the original.' },
  { id: 'balanced', label: 'Balanced', description: 'Natural rewrite with moderate changes.' },
  { id: 'aggressive', label: 'Heavy rewrite', description: 'Full restructure for maximum human voice.' },
]

export default function Humanizer({ onCheckInDetector }) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [aiScore, setAiScore] = useState(null)
  const [tone, setTone] = useState('Neutral')
  const [strength, setStrength] = useState('balanced')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const exportRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleHumanize() {
    if (!input.trim()) return
    if (input.length > 20000) {
      setError(`Text is too long (${input.length.toLocaleString()} / 20,000 characters). Please shorten it.`)
      return
    }
    setLoading(true)
    setError('')
    setOutput('')
    setAiScore(null)
    try {
      const data = await humanizeText({ text: input, tone, strength })
      setOutput(data.result)
      if (typeof data.score === 'number') setAiScore(data.score)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!output) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(output)
      } else {
        // navigator.clipboard is unavailable over plain http on a LAN IP
        const ta = document.createElement('textarea')
        ta.value = output
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (!ok) throw new Error('copy failed')
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy to clipboard — select the text and copy it manually.')
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const text = await extractTextFromFile(file)
      if (!text || !text.trim()) {
        setError('No readable text found in that file.')
      } else {
        setInput(text)
      }
    } catch (err) {
      setError(err.message || 'Could not read that file.')
    } finally {
      setUploading(false)
    }
  }

  async function handleExport(format) {
    if (!output) return
    setExportOpen(false)
    setExporting(true)
    try {
      if (format === 'txt') exportAsTxt(output)
      else if (format === 'docx') await exportAsDocx(output)
      else if (format === 'pdf') await exportAsPdf(output)
    } catch (e) {
      setError(e.message || 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tone</span>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              title={t.description}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                tone === t.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {t.id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rewrite strength</span>
        <div className="flex flex-wrap gap-1.5">
          {STRENGTHS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStrength(s.id)}
              title={s.description}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                strength === s.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Original text</label>
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={uploading}
              className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {uploading ? 'Reading…' : 'Upload file'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste AI-generated text here, or upload a .txt/.docx/.pdf…"
            rows={18}
            className="scroll-thin w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-600">
            <span>{input.trim() ? `${input.trim().split(/\s+/).length} words` : ''}</span>
            <span className={input.length > 20000 ? 'font-semibold text-red-500 dark:text-red-400' : ''}>
              {input.length.toLocaleString()} / 20,000 chars
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Humanized text</label>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="Your rewritten text will appear here…"
            rows={18}
            className="scroll-thin w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
          <div className="mt-1 flex min-h-[28px] items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600">
              {output && <span>{output.length.toLocaleString()} chars</span>}
              {typeof aiScore === 'number' && (
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                  aiScore < 35
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : aiScore < 65
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                }`}>
                  ~{aiScore}% AI score
                </span>
              )}
            </div>

            {output && (
              <div className="flex items-center gap-1.5">
                {onCheckInDetector && (
                  <button
                    onClick={() => onCheckInDetector(output)}
                    className="rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50"
                    title="Analyze this humanized text in the AI Checker"
                  >
                    Check AI % ➔
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>

                <div className="relative" ref={exportRef}>
                  <button
                    onClick={() => setExportOpen((v) => !v)}
                    disabled={exporting}
                    className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {exporting ? 'Exporting…' : 'Export as ▾'}
                  </button>

                  {exportOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                      {EXPORT_FORMATS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => handleExport(f.id)}
                          className="block w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleHumanize}
        disabled={loading || !input.trim()}
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? 'Humanizing…' : 'Humanize text'}
      </button>

      <p className="text-xs text-slate-400 dark:text-slate-600">
        This rewrites text for a more natural tone and voice. It's a writing-quality tool, not a
        guaranteed way to beat trained AI detectors — services like Sapling, GPTZero, and
        Turnitin are specifically built to catch AI-assisted rewrites, humanized or not.
      </p>
    </div>
  )
}

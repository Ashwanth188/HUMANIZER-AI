import React, { useState } from 'react'
import Humanizer from './components/Humanizer.jsx'
import AIChecker from './components/AIChecker.jsx'
import Logo from './components/Logo.jsx'
import { useTheme } from './useTheme.js'

const TABS = [
  { id: 'humanize', label: 'Humanize' },
  { id: 'detect', label: 'AI Check %' },
]

function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" strokeWidth="1.8" stroke="currentColor">
          <circle cx="12" cy="12" r="4.5" />
          <path strokeLinecap="round" d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
          <path d="M20.5 14.6a8.5 8.5 0 1 1-9.1-11 7 7 0 0 0 9.1 11Z" />
        </svg>
      )}
    </button>
  )
}

export default function App() {
  const [tab, setTab] = useState('humanize')
  const [theme, setTheme] = useTheme()

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-600/20" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/10" />
      </div>

      <div className="relative mx-auto flex min-h-full max-w-4xl flex-col px-4 py-10 sm:px-6">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <div className="flex flex-col leading-none">
                <span className="bg-gradient-to-r from-brand-400 via-brand-500 to-violet-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                  Smart
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Humanizer
                </span>
              </div>
            </div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Write like a human. Let Smart handle the rest.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            However you bring it — pasted, uploaded, or typed live — we'll make it sound like you wrote it.
          </p>
        </header>

        <nav className="mb-6 flex w-fit rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900/60">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="flex-1">
          {tab === 'humanize' ? <Humanizer /> : <AIChecker />}
        </main>

        <footer className="mt-10 text-center text-xs font-medium text-slate-400 dark:text-slate-600">
          <p>AI Humanizer &middot; Built by Ashwanth</p>
        </footer>
      </div>
    </div>
  )
}

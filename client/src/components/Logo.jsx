import React from 'react'

export default function Logo({ className = 'h-11 w-11' }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-violet-500 shadow-[0_0_20px_2px_rgba(124,143,255,0.45)] ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-[60%] w-[60%]" fill="none">
        <path
          d="M4.5 10.5 L9.5 7.5 L12.5 11.5 L17.5 6.5 L21.5 10.5 L27.5 8"
          stroke="white"
          strokeOpacity="0.85"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 22.5 C9.5 17 12.5 27.5 17.5 22.5 C20.5 19.5 23.5 25 27.5 21"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

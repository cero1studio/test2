'use client'

import { useRef, useState } from 'react'

/** Cuatro casillas que avanzan solas; admite pegar el PIN completo. */
export function PinInput({ name = 'pin' }: { name?: string }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const set = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, '')
    if (clean.length > 1) {
      const next = clean.slice(0, 4).padEnd(4, ' ').split('').map((c) => c.trim())
      setDigits(next)
      refs.current[Math.min(clean.length, 4) - 1]?.focus()
      return
    }
    setDigits((d) => d.map((v, j) => (j === i ? clean : v)))
    if (clean && i < 3) refs.current[i + 1]?.focus()
  }

  return (
    <div className="flex justify-center gap-2.5" role="group" aria-label="PIN de 4 dígitos">
      <input type="hidden" name={name} value={digits.join('')} />
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          value={d}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus() }}
          inputMode="numeric" autoComplete="one-time-code" maxLength={4} aria-label={`Dígito ${i + 1}`}
          className="size-14 rounded-2xl border border-white/12 bg-black/40 text-center font-mono text-2xl font-bold transition focus:scale-105 focus:border-rose focus:outline-none"
        />
      ))}
    </div>
  )
}

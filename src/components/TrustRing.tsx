'use client'

import { motion } from 'motion/react'
import type { Trust } from '@/lib/trust'

const color = (level: Trust['level']) => (level === 'Alta' ? '#6ee7b7' : level === 'Media' ? '#fcd34d' : '#a199ad')

export function TrustRing({ trust, size = 112 }: { trust: Trust; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Índice de confianza ${trust.score} de 100, nivel ${trust.level}`}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r="43" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="7" />
        <motion.circle
          cx="50" cy="50" r="43" fill="none" stroke={color(trust.level)} strokeWidth="7" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: trust.score / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.21, 0.6, 0.35, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="display text-3xl tabular-nums" style={{ fontSize: size * 0.3 }}>{trust.score}</p>
          <p className="text-[0.6rem] font-semibold tracking-widest text-mute uppercase">Confianza</p>
        </div>
      </div>
    </div>
  )
}

export function TrustBreakdown({ trust }: { trust: Trust }) {
  return (
    <ul className="space-y-2 text-sm">
      {trust.parts.map((p) => (
        <li key={p.label} className="flex justify-between gap-3">
          <span className="text-mute">{p.label}</span>
          <span className={`shrink-0 tabular-nums ${p.points < 0 ? 'text-rose' : ''}`}>{p.points < 0 ? p.points : `${p.points}/${p.max}`}</span>
        </li>
      ))}
    </ul>
  )
}

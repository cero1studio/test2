import { BadgeCheck, Building2, Camera, EyeOff, UserRound } from 'lucide-react'
import { useId } from 'react'
import { availabilityLabel } from '@/lib/availability'

type Verified = { identityVerifiedAt: Date | null; photosVerifiedAt: Date | null; discreet?: boolean; kind?: string }

export function Badges({ p }: { p: Verified }) {
  return (
    <>
      {p.identityVerifiedAt && <span className="chip chip-ok"><BadgeCheck className="size-3.5" />Identidad 18+</span>}
      {p.photosVerifiedAt
        ? <span className="chip chip-ok"><Camera className="size-3.5" />Fotos reales</span>
        : <span className="chip chip-warn"><Camera className="size-3.5" />Fotos sin verificar</span>}
      {p.kind === 'AGENCY' && <span className="chip chip-warn"><Building2 className="size-3.5" />Agencia</span>}
      {p.kind === 'INDEPENDENT' && <span className="chip"><UserRound className="size-3.5" />Independiente</span>}
      {p.discreet && <span className="chip"><EyeOff className="size-3.5" />Perfil discreto</span>}
    </>
  )
}

export function Availability({ p, className = '' }: { p: Parameters<typeof availabilityLabel>[0]; className?: string }) {
  const a = availabilityLabel(p)
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${a.now ? 'text-mint' : 'text-mute'} ${className}`}>
      <span className={a.now ? 'dot-live' : 'dot-off'} />{a.text}
    </span>
  )
}

export function Stars({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`text-amber ${className}`} aria-label={`${value} de 5`}>
      {'★'.repeat(value)}<span className="text-white/15">{'★'.repeat(5 - value)}</span>
    </span>
  )
}

export function StarsInput({ name = 'rating' }: { name?: string }) {
  const id = useId()
  return (
    <div className="stars" role="radiogroup" aria-label="Calificación">
      {[5, 4, 3, 2, 1].map((n) => (
        <span key={n} className="contents">
          <input type="radio" name={name} value={n} id={`${id}-${n}`} required defaultChecked={n === 5} />
          <label htmlFor={`${id}-${n}`} title={`${n} de 5`}>★</label>
        </span>
      ))}
    </div>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`display inline-flex items-center gap-2 text-2xl ${className}`}>
      <svg viewBox="8 8 52 48" className="h-[0.95em] w-auto" aria-hidden>
        <defs><linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff6b97" /><stop offset="1" stopColor="#ffb07a" /></linearGradient></defs>
        <path d="M46.6 20.4A19 19 0 1 0 51 32" fill="none" stroke="url(#logo-g)" strokeWidth="7" strokeLinecap="round" />
        <circle cx="49" cy="16" r="5" fill="url(#logo-g)" />
      </svg>
      sigila
    </span>
  )
}

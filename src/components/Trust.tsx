import type { Trust } from '@/lib/trust'

const tone = (level: Trust['level']) => (level === 'Alta' ? 'text-ok' : level === 'Media' ? 'text-warn' : 'text-mute')
const bar = (level: Trust['level']) => (level === 'Alta' ? 'bg-ok' : level === 'Media' ? 'bg-warn' : 'bg-mute')

export function TrustPill({ trust }: { trust: Trust }) {
  return (
    <span className={`badge border-line bg-ink/80 ${tone(trust.level)}`} title={`Confianza ${trust.level}`}>
      Confianza {trust.score}
    </span>
  )
}

export function TrustPanel({ trust }: { trust: Trust }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="label">Índice de confianza</p>
          <p className={`text-4xl font-black tabular-nums ${tone(trust.level)}`}>
            {trust.score}<span className="text-base font-semibold text-mute"> / 100</span>
          </p>
        </div>
        <span className={`badge border-line ${tone(trust.level)}`}>{trust.level}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink" role="meter" aria-valuenow={trust.score} aria-valuemin={0} aria-valuemax={100} aria-label="Índice de confianza">
        <div className={`h-full ${bar(trust.level)}`} style={{ width: `${trust.score}%` }} />
      </div>
      <ul className="space-y-1.5 text-sm">
        {trust.parts.map((p) => (
          <li key={p.label} className="flex justify-between gap-3">
            <span className="text-mute">{p.label}</span>
            <span className={`shrink-0 tabular-nums ${p.points < 0 ? 'text-rose' : ''}`}>
              {p.points < 0 ? p.points : `${p.points} / ${p.max}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-mute">El índice se calcula igual para todos y no se puede comprar.</p>
    </div>
  )
}

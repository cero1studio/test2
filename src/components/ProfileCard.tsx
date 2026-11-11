import Link from 'next/link'
import { copFormat } from '@/lib/constants'
import { trustOf, type CardProfile } from '@/lib/profiles'
import { TrustPill } from './Trust'

export function Badges({ p }: { p: { identityVerifiedAt: Date | null; photosVerifiedAt: Date | null } }) {
  return (
    <>
      {p.identityVerifiedAt && <span className="badge badge-ok">✓ Identidad 18+</span>}
      {p.photosVerifiedAt
        ? <span className="badge badge-ok">✓ Fotos reales</span>
        : <span className="badge badge-warn">Fotos sin verificar</span>}
    </>
  )
}

export function ProfileCard({ p }: { p: CardProfile }) {
  const n = p.reviews.length
  const avg = n ? p.reviews.reduce((s, r) => s + r.rating, 0) / n : 0
  return (
    <Link href={`/p/${p.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-rose">
      <div className="relative aspect-[4/5] bg-ink">
        {p.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/${p.photos[0].id}`} alt={`Foto de ${p.displayName}`} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        )}
        <div className="absolute top-2 left-2"><TrustPill trust={trustOf(p)} /></div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-bold">{p.displayName}, {p.age}</h3>
          <span className="shrink-0 text-xs text-mute">{n ? `★ ${avg.toFixed(1)} (${n})` : 'Sin reseñas'}</span>
        </div>
        <p className="truncate text-sm text-mute">{p.city}{p.zone && ` · ${p.zone}`}</p>
        <div className="flex flex-wrap gap-1.5"><Badges p={p} /></div>
        <p className="text-sm">Desde <strong>{copFormat.format(p.priceFrom)}</strong></p>
      </div>
    </Link>
  )
}

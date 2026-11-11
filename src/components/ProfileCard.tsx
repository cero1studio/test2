import { Lock, Star } from 'lucide-react'
import Link from 'next/link'
import { isAvailableNow } from '@/lib/availability'
import { copFormat } from '@/lib/constants'
import { trustOf, type CardProfile } from '@/lib/profiles'
import { Availability, Badges } from './ui'

const tone = { Alta: 'text-mint', Media: 'text-amber', 'En construcción': 'text-mute' } as const

export function ProfileCard({ p, member }: { p: CardProfile; member: boolean }) {
  const n = p.reviews.length
  const avg = n ? p.reviews.reduce((s, r) => s + r.rating, 0) / n : 0
  const trust = trustOf(p)
  const locked = p.discreet && !member
  return (
    <Link href={`/p/${p.slug}`} className="group block overflow-hidden rounded-3xl border border-white/8 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_24px_60px_-24px_rgb(255_107_151/0.45)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-raise">
        {p.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/${p.photos[0].id}`} alt={locked ? 'Foto difuminada' : `Foto de ${p.displayName}`} loading="lazy" className="size-full object-cover transition duration-700 ease-out group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent" />
        <span className={`absolute top-3 left-3 rounded-full bg-bg/70 px-2.5 py-1 text-xs font-semibold backdrop-blur ${tone[trust.level]}`}>
          Confianza {trust.score}
        </span>
        {isAvailableNow(p) && (
          <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-bg/70 px-2.5 py-1 text-xs font-semibold text-mint backdrop-blur">
            <span className="dot-live" />Ahora
          </span>
        )}
        {locked && (
          <span className="absolute inset-x-0 top-1/2 mx-auto flex w-fit -translate-y-1/2 items-center gap-1.5 rounded-full bg-bg/70 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <Lock className="size-3.5" />Fotos nítidas con cuenta
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end justify-between gap-2">
            <h3 className="display truncate text-2xl">{p.displayName}<span className="text-base text-cream/70">, {p.age}</span></h3>
            {n > 0 && <span className="flex shrink-0 items-center gap-1 text-xs text-cream/80"><Star className="size-3.5 fill-amber text-amber" />{avg.toFixed(1)} · {n}</span>}
          </div>
          <p className="truncate text-sm text-cream/70">{p.city}{p.zone && ` · ${p.zone}`}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5"><Badges p={p} /></div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-mute">Desde <strong className="text-cream">{copFormat.format(p.priceFrom)}</strong></p>
          {!isAvailableNow(p) && <Availability p={p} />}
        </div>
      </div>
    </Link>
  )
}

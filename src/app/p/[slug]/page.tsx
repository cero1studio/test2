import { BadgeCheck, CalendarClock, Home, Lock, MapPin, QrCode, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { submitReport } from '@/app/actions/public'
import { ActionForm } from '@/components/ActionForm'
import { confirmByPin } from '@/app/actions/public'
import { ContactBuilder } from '@/components/ContactBuilder'
import { FavoriteButton } from '@/components/FavoriteButton'
import { PinInput } from '@/components/PinInput'
import { Reveal } from '@/components/motion'
import { TrustBreakdown, TrustRing } from '@/components/TrustRing'
import { Availability, Badges, Stars } from '@/components/ui'
import { getUser } from '@/lib/auth'
import { scheduleLabel } from '@/lib/availability'
import { copFormat, monthFormat, REPORT_REASONS } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewer } from '@/lib/geo'
import { parseList, serviceLabel, serviceScores } from '@/lib/services'
import { tagLabel } from '@/lib/tags'
import { cardInclude, isHiddenFrom, isPublic, releasedReviewWhere, trustOf } from '@/lib/profiles'

type Props = { params: Promise<{ slug: string }> }

const load = cache(async (slug: string) => {
  const p = await db.profile.findUnique({ where: { slug }, include: cardInclude() })
  if (!p) return null
  const user = await getUser()
  if (user?.role === 'ADMIN' || user?.id === p.userId) return { p, user, preview: !isPublic(p) }
  return isPublic(p) && !isHiddenFrom(p, await viewer()) ? { p, user, preview: false } : null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug)
  if (!data) return {}
  const { p } = data
  return {
    title: `${p.displayName}, ${p.age} · ${p.category} en ${p.city}`,
    description: `Perfil verificado de ${p.displayName} en ${p.city}: identidad comprobada y reseñas de encuentros reales.`,
    alternates: { canonical: `/p/${p.slug}` },
    // Privacidad primero: los perfiles discretos o con bloqueos no se indexan en buscadores.
    robots: p.discreet || p.blockedRegions ? { index: false, follow: false } : undefined,
  }
}

export default async function ProfilePage({ params }: Props) {
  const data = await load((await params).slug)
  if (!data) notFound()
  const { p, user, preview } = data
  const trust = trustOf(p)
  const reviews = await db.review.findMany({
    where: { profileId: p.id, ...releasedReviewWhere() },
    include: { encounter: { select: { publicId: true, confirmedAt: true } } },
    orderBy: { createdAt: 'desc' }, take: 50,
  })
  const deposits = reviews.filter((r) => r.askedDeposit).length
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  const locked = p.discreet && !user
  const schedule = scheduleLabel(p)
  const isClient = user?.role === 'CLIENT'
  const [favorite, lastRequest] = isClient
    ? await Promise.all([
        db.favorite.findUnique({ where: { userId_profileId: { userId: user.id, profileId: p.id } } }),
        db.contactRequest.findFirst({ where: { profileId: p.id, clientId: user.id, createdAt: { gt: new Date(Date.now() - 2 * 864e5) } }, orderBy: { createdAt: 'desc' } }),
      ])
    : [null, null]
  const joinHref = `/registro?next=/p/${p.slug}`
  const offered = parseList(p.services)
  const scores = serviceScores(offered, reviews)
  let extras: { label: string; price: number }[] = []
  try { extras = JSON.parse(p.extras) } catch { /* sin adicionales */ }

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        {preview && <p className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">Vista previa: este perfil no es visible al público (estado: {p.status}).</p>}

        <header className="space-y-4">
          <Availability p={p} />
          <h1 className="display text-5xl md:text-6xl">{p.displayName}<span className="text-3xl text-cream/60">, {p.age}</span></h1>
          <p className="text-mute">{p.category} · {p.city}{p.zone && ` · ${p.zone}`}</p>
          <div className="flex flex-wrap gap-2"><Badges p={p} /></div>
          {parseList(p.tags).length > 0 && <div className="flex flex-wrap gap-1.5">{parseList(p.tags).map((t) => <span key={t} className="chip">{tagLabel(t)}</span>)}</div>}
          {isPublic(p) && <FavoriteButton profileId={p.id} initial={!!favorite} canUse={!!isClient} loginHref={joinHref} />}
        </header>

        {p.photos.length > 0 && (
          <div className="relative">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {p.photos.map((ph, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={ph.id} src={`/media/${ph.id}`} alt={locked ? 'Foto difuminada' : `Foto de ${p.displayName}`} loading={i ? 'lazy' : 'eager'}
                  className={`w-full rounded-3xl border border-white/8 object-cover ${i === 0 ? 'col-span-2 row-span-2 aspect-[4/5] md:aspect-auto md:h-full' : 'aspect-[4/5]'}`} />
              ))}
            </div>
            {locked && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="card max-w-xs space-y-3 bg-bg/80 text-center">
                  <Lock className="mx-auto size-6 text-rose" />
                  <p className="font-semibold">Perfil discreto</p>
                  <p className="text-sm text-mute">{p.displayName} solo muestra sus fotos nítidas y su contacto a miembros con cuenta.</p>
                  <Link href={`/registro?next=/p/${p.slug}`} className="btn btn-primary btn-sm">Crear cuenta gratis</Link>
                </div>
              </div>
            )}
          </div>
        )}

        <Reveal className="grid grid-cols-3 gap-3 text-center">
          {[
            [String(p._count.encounters), 'Encuentros verificados'],
            [avg ? avg.toFixed(1) : '—', 'Calificación'],
            [monthFormat.format(p.createdAt), 'Miembro desde'],
          ].map(([v, l]) => (
            <div key={l} className="card p-4"><p className="display text-2xl md:text-3xl">{v}</p><p className="mt-1 text-xs text-mute">{l}</p></div>
          ))}
        </Reveal>

        <section className="card space-y-3">
          <h2 className="h-section">Sobre mí</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-cream/85">{p.description}</p>
          <ul className="space-y-2 border-t border-white/8 pt-3 text-sm text-mute">
            {schedule && <li className="flex items-center gap-2"><CalendarClock className="size-4" />Horario habitual: {schedule}</li>}
            {p.incall && <li className="flex items-center gap-2"><Home className="size-4" />Atiende en lugar propio</li>}
            {p.outcall && <li className="flex items-center gap-2"><MapPin className="size-4" />Va a domicilio u hotel</li>}
            {p.kind === 'AGENCY' && <li className="text-amber">Este perfil lo publica una agencia o establecimiento, no una persona independiente.</li>}
          </ul>
        </section>

        {scores.length > 0 && (
          <section className="card space-y-4">
            <div><h2 className="h-section">Calificación por servicio</h2><p className="text-xs text-mute">Cada cliente califica solo los servicios que tomó, en encuentros verificados.</p></div>
            <ul className="space-y-3">
              {scores.map((sc) => (
                <li key={sc.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 text-sm">
                  <span>{sc.label}</span>
                  <span className="flex items-center gap-1 text-xs text-mute tabular-nums">
                    {sc.count ? <><Star className="size-3.5 fill-amber text-amber" /><strong className="text-cream">{sc.average.toFixed(1)}</strong> · {sc.count} {sc.count === 1 ? 'reseña' : 'reseñas'}</> : 'Sin calificar aún'}
                  </span>
                  <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-white/8"><span className="block h-full rounded-full bg-gradient-to-r from-rose to-peach" style={{ width: `${(sc.average / 5) * 100}%` }} /></span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="display text-3xl">Reseñas verificadas <span className="text-xl text-mute">({reviews.length})</span></h2>
          {deposits > 0 && <p className="rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">{deposits} de {reviews.length} clientes verificados indican que este perfil pidió un anticipo.</p>}
          {reviews.length === 0 && <p className="card text-sm text-mute">Todavía no tiene reseñas. Solo pueden escribirlas clientes que confirmaron un encuentro en persona.</p>}
          {reviews.map((r) => {
            const hidden = r.visibility === 'MEMBERS' && !user
            return (
              <article key={r.id} className="card space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Stars value={r.rating} />
                  {r.photosMatch ? <span className="chip chip-ok">Es la persona de las fotos</span> : <span className="chip chip-warn">No coincide con las fotos</span>}
                  <span className="ml-auto text-xs text-mute">{monthFormat.format(r.encounter.confirmedAt ?? r.createdAt)}</span>
                </div>
                {hidden
                  ? <p className="flex items-center gap-2 text-sm text-mute"><Lock className="size-4" />Reseña privada: el texto solo lo ven miembros con cuenta.</p>
                  : <p className="text-sm leading-relaxed text-cream/85">{r.body}</p>}
                {(() => {
                  let sr: Record<string, number> = {}
                  try { sr = JSON.parse(r.serviceRatings) } catch { /* sin detalle */ }
                  const items = Object.entries(sr)
                  return items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">{items.map(([k, v]) => <span key={k} className="chip">{serviceLabel(k)} <strong className="text-amber">★ {v}</strong></span>)}</div>
                  )
                })()}
                <Link href={`/verificar/${r.encounter.publicId}`} className="inline-flex items-center gap-1.5 text-xs text-mint hover:underline">
                  <BadgeCheck className="size-3.5" />Encuentro verificado · <span className="font-mono">{r.encounter.publicId}</span>
                </Link>
              </article>
            )
          })}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-4">
          <div><p className="text-xs text-mute">Tarifa desde</p><p className="display text-4xl">{copFormat.format(p.priceFrom)}</p></div>
          {!isPublic(p) ? <p className="text-sm text-mute">Contacto no disponible.</p>
            : locked ? <Link href={`/ingresar?next=/p/${p.slug}`} className="btn btn-primary w-full"><Lock className="size-4" />Ingresa para ver el contacto</Link>
            : <ContactBuilder profileId={p.id} name={p.displayName} priceFrom={p.priceFrom} incall={p.incall} outcall={p.outcall} extras={extras}
                services={offered.map((k) => ({ key: k, label: serviceLabel(k) }))} mode={p.contactMode} isClient={!!isClient} loginHref={joinHref}
                request={(lastRequest?.status as 'PENDING' | 'ACCEPTED' | 'DECLINED' | undefined) ?? 'NONE'} />}
        </div>
        {isPublic(p) && (
          <details className="card group" id="pin">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><QrCode className="size-4 text-rose" />¿Estás con {p.displayName}? Confirma el encuentro</summary>
            <div className="mt-4 space-y-4">
              <p className="text-xs leading-relaxed text-mute">Pídele su PIN de 4 dígitos (o escanea su QR). Queda un encuentro verificado y ambos pueden calificarse. Tu identidad no se muestra.</p>
              {isClient
                ? <ActionForm action={confirmByPin.bind(null, p.id)} submit="Confirmar encuentro" buttonClass="btn btn-primary w-full"><PinInput /></ActionForm>
                : <Link href={`/registro?next=/p/${p.slug}`} className="btn btn-sm w-full">Crea una cuenta anónima para confirmar</Link>}
            </div>
          </details>
        )}
        <div className="card space-y-5">
          <div className="flex items-center gap-4">
            <TrustRing trust={trust} />
            <div><p className="font-semibold">Confianza {trust.level.toLowerCase()}</p><p className="text-xs leading-relaxed text-mute">Se calcula igual para todos y no se puede comprar.</p></div>
          </div>
          <TrustBreakdown trust={trust} />
        </div>
        <details className="card group">
          <summary className="cursor-pointer text-sm font-semibold text-rose">Denunciar este perfil</summary>
          <div className="mt-4">
            <ActionForm action={submitReport.bind(null, p.id)} submit="Enviar denuncia">
              <label className="block"><span className="label">Motivo</span>
                <select name="reason" className="input" required defaultValue="">
                  <option value="" disabled>Elige un motivo</option>
                  {REPORT_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </label>
              <label className="block"><span className="label">¿Qué pasó?</span>
                <textarea name="details" className="input" rows={4} required minLength={15} maxLength={2000} />
              </label>
              <p className="text-xs text-mute">Si hay una persona en peligro o una posible menor de edad, llama también a la línea 141 (ICBF) o al 123.</p>
            </ActionForm>
          </div>
        </details>
      </aside>
    </div>
  )
}

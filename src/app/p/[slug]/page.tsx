import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { submitReport } from '@/app/actions/public'
import { ActionForm } from '@/components/ActionForm'
import { ContactReveal } from '@/components/ContactReveal'
import { Badges } from '@/components/ProfileCard'
import { TrustPanel } from '@/components/Trust'
import { getUser } from '@/lib/auth'
import { copFormat, dateFormat, REPORT_REASONS } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewerRegion } from '@/lib/geo'
import { cardInclude, isBlockedIn, isPublic, trustOf } from '@/lib/profiles'

type Props = { params: Promise<{ slug: string }> }

const load = cache(async (slug: string) => {
  const p = await db.profile.findUnique({ where: { slug }, include: cardInclude })
  if (!p) return null
  const user = await getUser()
  const privileged = user?.role === 'ADMIN' || user?.id === p.userId
  if (privileged) return { p, preview: !isPublic(p) }
  return isPublic(p) && !isBlockedIn(p, await viewerRegion()) ? { p, preview: false } : null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug)
  return data ? { title: `${data.p.displayName}, ${data.p.age} · ${data.p.city}` } : {}
}

export default async function ProfilePage({ params }: Props) {
  const data = await load((await params).slug)
  if (!data) notFound()
  const { p, preview } = data
  const trust = trustOf(p)
  const reviews = await db.review.findMany({
    where: { profileId: p.id, status: 'VISIBLE' }, orderBy: { createdAt: 'desc' }, take: 50,
  })
  const deposits = reviews.filter((r) => r.askedDeposit).length

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        {preview && (
          <p className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
            Vista previa: este perfil no es visible al público (estado: {p.status}).
          </p>
        )}
        <header className="space-y-3">
          <h1 className="text-3xl font-black">{p.displayName}, {p.age}</h1>
          <p className="text-mute">{p.category} · {p.city}{p.zone && ` · ${p.zone}`}</p>
          <div className="flex flex-wrap gap-2">
            <Badges p={p} />
            <span className="badge badge-mute">En Veraz desde {dateFormat.format(p.createdAt)}</span>
          </div>
        </header>

        {p.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {p.photos.map((ph) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={ph.id} src={`/media/${ph.id}`} alt={`Foto de ${p.displayName}`} loading="lazy" className="aspect-[4/5] w-full rounded-xl border border-line object-cover" />
            ))}
          </div>
        )}

        <section className="card space-y-2">
          <h2 className="h-section">Sobre mí</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-300">{p.description}</p>
        </section>

        <section className="space-y-3">
          <h2 className="h-section">Reseñas de encuentros comprobados ({reviews.length})</h2>
          {deposits > 0 && (
            <p className="rounded-xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
              {deposits} de {reviews.length} clientes verificados indican que este perfil pidió un anticipo.
            </p>
          )}
          {reviews.length === 0 && <p className="card text-sm text-mute">Todavía no tiene reseñas. Solo pueden escribirlas clientes con un código de encuentro.</p>}
          {reviews.map((r) => (
            <article key={r.id} className="card space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-warn" aria-label={`${r.rating} de 5`}>{'★'.repeat(r.rating)}<span className="text-line">{'★'.repeat(5 - r.rating)}</span></span>
                <span className="badge badge-ok">✓ Encuentro comprobado</span>
                {r.photosMatch
                  ? <span className="badge badge-ok">Es la persona de las fotos</span>
                  : <span className="badge badge-warn">No coincide con las fotos</span>}
                <span className="ml-auto text-xs text-mute">{dateFormat.format(r.createdAt)}</span>
              </div>
              <p className="text-sm text-zinc-300">{r.body}</p>
            </article>
          ))}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card space-y-3">
          <p className="text-sm text-mute">Tarifa desde</p>
          <p className="text-2xl font-black">{copFormat.format(p.priceFrom)}</p>
          {isPublic(p) ? <ContactReveal profileId={p.id} name={p.displayName} /> : <p className="text-sm text-mute">Contacto no disponible.</p>}
        </div>
        <TrustPanel trust={trust} />
        <details className="card">
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
              <p className="text-xs text-mute">
                Si hay una persona en peligro o una posible menor de edad, llama también a la línea 141 (ICBF) o al 123.
              </p>
            </ActionForm>
          </div>
        </details>
      </aside>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { createReviewCode, deletePhoto, saveProfile, setPublished, submitVerification, uploadPhoto } from '@/app/actions/profile'
import { submitReview } from '@/app/actions/public'
import { ActionForm } from '@/components/ActionForm'
import { requireUser } from '@/lib/auth'
import { CATEGORIES, CITIES, dateFormat } from '@/lib/constants'
import { db } from '@/lib/db'
import { REGIONS } from '@/lib/regions'

export const metadata: Metadata = { title: 'Mi panel' }

const STATUS: Record<string, string> = {
  DRAFT: 'Borrador (no visible)', ACTIVE: 'Publicado', PAUSED: 'Pausado (no visible)',
  REVIEW: 'Oculto mientras moderación revisa denuncias', SUSPENDED: 'Suspendido por moderación',
}

export default async function Panel() {
  const user = await requireUser()
  if (user.role === 'ADVERTISER') return <AdvertiserPanel userId={user.id} />
  if (user.role === 'ADMIN') {
    return <div className="container-page py-10"><Link href="/admin" className="btn btn-primary">Ir a moderación</Link></div>
  }
  return <ClientPanel userId={user.id} />
}

async function ClientPanel({ userId }: { userId: string }) {
  const reviews = await db.review.findMany({ where: { authorId: userId }, include: { profile: true }, orderBy: { createdAt: 'desc' } })
  return (
    <div className="container-page grid max-w-4xl gap-6 py-8 md:grid-cols-2">
      <section className="card space-y-4">
        <h1 className="h-section">Escribir una reseña</h1>
        <p className="text-sm text-mute">
          Al terminar el encuentro, pide tu código de reseña. Cada código sirve una sola vez: así garantizamos que
          toda reseña viene de un encuentro real.
        </p>
        <ActionForm action={submitReview} submit="Publicar reseña">
          <label className="block"><span className="label">Código de encuentro</span>
            <input name="code" className="input font-mono uppercase" placeholder="ABCD-2345" required />
          </label>
          <label className="block"><span className="label">Calificación</span>
            <select name="rating" className="input" defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="photosMatch" defaultChecked className="accent-rose" /> Es la persona de las fotos</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="askedDeposit" className="accent-rose" /> Me pidió anticipo o depósito</label>
          <label className="block"><span className="label">Tu experiencia</span>
            <textarea name="body" className="input" rows={4} required minLength={20} maxLength={1500} placeholder="Puntualidad, trato, si coincidía con el anuncio…" />
          </label>
        </ActionForm>
      </section>
      <section className="space-y-3">
        <h2 className="h-section">Mis reseñas</h2>
        {reviews.length === 0 && <p className="card text-sm text-mute">Aún no has escrito reseñas.</p>}
        {reviews.map((r) => (
          <Link key={r.id} href={`/p/${r.profile.slug}`} className="card block text-sm hover:border-rose">
            <strong>{r.profile.displayName}</strong> · <span className="text-warn">{'★'.repeat(r.rating)}</span>
            <p className="mt-1 text-mute">{r.body}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}

async function AdvertiserPanel({ userId }: { userId: string }) {
  const p = await db.profile.findUnique({
    where: { userId },
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      reviewCodes: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  const approved = p?.photos.filter((ph) => ph.status === 'APPROVED').length ?? 0
  const lastV = p?.verifications[0]
  const canPublish = !!p?.identityVerifiedAt && approved > 0
  const steps: [string, boolean][] = [
    ['Completa tu perfil', !!p],
    ['Verifica tu identidad (18+)', !!p?.identityVerifiedAt],
    ['Ten al menos una foto aprobada', approved > 0],
    ['Publica', p?.status === 'ACTIVE'],
  ]
  const blocked = p?.blockedRegions.split(',').filter(Boolean) ?? []

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <section className="card space-y-4">
          <h1 className="h-section">Mi perfil</h1>
          <ActionForm action={saveProfile} submit="Guardar perfil" className="grid gap-3 sm:grid-cols-2">
            <label><span className="label">Nombre artístico</span><input name="displayName" className="input" required defaultValue={p?.displayName} maxLength={40} /></label>
            <label><span className="label">Edad</span><input name="age" type="number" min={18} max={99} className="input" required defaultValue={p?.age} /></label>
            <label><span className="label">Ciudad</span>
              <select name="city" className="input" defaultValue={p?.city ?? CITIES[0]}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label><span className="label">Zona o barrio (opcional)</span><input name="zone" className="input" defaultValue={p?.zone} maxLength={60} /></label>
            <label><span className="label">Categoría</span>
              <select name="category" className="input" defaultValue={p?.category ?? CATEGORIES[0]}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label><span className="label">Tarifa desde (COP)</span><input name="priceFrom" type="number" min={10000} step={10000} className="input" required defaultValue={p?.priceFrom} /></label>
            <label className="sm:col-span-2"><span className="label">WhatsApp (con indicativo, solo números)</span>
              <input name="whatsapp" className="input" required defaultValue={p?.whatsapp} placeholder="573001234567" inputMode="tel" />
            </label>
            <label className="sm:col-span-2"><span className="label">Descripción</span>
              <textarea name="description" className="input" rows={5} required minLength={40} maxLength={2000} defaultValue={p?.description} />
            </label>
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="label">Dónde NO quieres que se vea tu perfil</legend>
              <p className="text-xs text-mute">
                Quien navegue desde los lugares marcados no verá tu perfil, tus fotos ni tu contacto, ni siquiera con
                el enlace directo. Se basa en la ubicación de la conexión del visitante: protege frente a la mayoría
                de la gente, pero alguien con VPN podría saltárselo.
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm md:grid-cols-3">
                {REGIONS.map((r) => (
                  <label key={r.code} className="flex items-center gap-2">
                    <input type="checkbox" name="blocked" value={r.code} defaultChecked={blocked.includes(r.code)} className="accent-rose" />
                    {r.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </ActionForm>
        </section>

        {p && (
          <section className="card space-y-4">
            <h2 className="h-section">Fotos</h2>
            <p className="text-sm text-mute">Eliminamos los metadatos (incluida la ubicación) de cada foto. Se publican tras la revisión de moderación.</p>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
              {p.photos.map((ph) => (
                <div key={ph.id} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/${ph.id}`} alt="" className="aspect-[4/5] w-full rounded-lg border border-line object-cover" />
                  <div className="flex items-center justify-between text-xs">
                    <span className={ph.status === 'APPROVED' ? 'text-ok' : 'text-warn'}>{ph.status === 'APPROVED' ? 'Aprobada' : 'En revisión'}</span>
                    <form action={deletePhoto.bind(null, ph.id)}><button className="cursor-pointer text-rose">Eliminar</button></form>
                  </div>
                </div>
              ))}
            </div>
            <ActionForm action={uploadPhoto} submit="Subir foto" className="flex flex-wrap items-center gap-3">
              <input type="file" name="photo" accept="image/*" required className="text-sm" />
            </ActionForm>
          </section>
        )}

        {p && !p.identityVerifiedAt && (
          <section className="card space-y-4">
            <h2 className="h-section">Verificación de identidad</h2>
            {lastV?.status === 'PENDING' ? (
              <p className="text-sm text-warn">Tu solicitud está en revisión.</p>
            ) : (
              <>
                {lastV?.status === 'REJECTED' && <p className="text-sm text-rose">Solicitud rechazada: {lastV.note || 'sin detalle'}. Puedes volver a intentarlo.</p>}
                <ol className="list-decimal space-y-1 pl-5 text-sm text-mute">
                  <li>Escribe en un papel el código <strong className="font-mono text-white">{p.verifyCode}</strong> y la fecha de hoy.</li>
                  <li>Tómate una selfie sosteniendo el papel, con el rostro visible.</li>
                  <li>Toma una foto de tu documento de identidad (cara frontal).</li>
                </ol>
                <ActionForm action={submitVerification} submit="Enviar a verificación">
                  <label className="block"><span className="label">Documento de identidad</span><input type="file" name="doc" accept="image/*" required className="text-sm" /></label>
                  <label className="block"><span className="label">Selfie con el código</span><input type="file" name="selfie" accept="image/*" required className="text-sm" /></label>
                  <label className="flex items-start gap-2 text-sm text-mute">
                    <input type="checkbox" name="consent" required className="mt-1 accent-rose" />
                    Autorizo el uso de estas imágenes solo para verificar mi identidad y mayoría de edad. El documento se
                    elimina al terminar la revisión; la selfie se conserva en privado para validar tus fotos.
                  </label>
                </ActionForm>
              </>
            )}
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card space-y-3">
          <h2 className="h-section">Estado</h2>
          <p className="text-sm">{p ? STATUS[p.status] : 'Sin perfil'}</p>
          <ul className="space-y-1 text-sm">
            {steps.map(([label, done]) => (
              <li key={label} className={done ? 'text-ok' : 'text-mute'}>{done ? '✓' : '○'} {label}</li>
            ))}
          </ul>
          {p && ['DRAFT', 'PAUSED', 'ACTIVE'].includes(p.status) && (
            <form action={setPublished.bind(null, p.status !== 'ACTIVE')}>
              <button className={`btn w-full ${p.status === 'ACTIVE' ? '' : 'btn-primary'}`} disabled={p.status !== 'ACTIVE' && !canPublish}>
                {p.status === 'ACTIVE' ? 'Pausar perfil' : 'Publicar perfil'}
              </button>
            </form>
          )}
          {p && <Link href={`/p/${p.slug}`} className="block text-sm text-rose underline">Ver mi perfil</Link>}
        </div>

        {p?.identityVerifiedAt && (
          <div className="card space-y-3">
            <h2 className="h-section">Códigos de reseña</h2>
            <p className="text-sm text-mute">Entrega un código a tu cliente al terminar el encuentro. Un solo uso, vence en 7 días, máximo 5 por día.</p>
            <form action={createReviewCode}><button className="btn btn-primary w-full">Generar código</button></form>
            <ul className="space-y-1 text-sm">
              {p.reviewCodes.map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span className={`font-mono ${c.usedAt ? 'text-mute line-through' : ''}`}>{c.code}</span>
                  <span className="text-xs text-mute">
                    {c.usedAt ? 'Usado' : c.expiresAt < new Date() ? 'Vencido' : `Vence ${dateFormat.format(c.expiresAt)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}

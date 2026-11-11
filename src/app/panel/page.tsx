import { BadgeCheck, CalendarClock, Camera, EyeOff, Power, QrCode, ShieldCheck, Star, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  deletePhoto, openEncounter, rateClient, savePrivacy, saveProfile, saveSchedule, setAvailability, setPublished,
  submitVerification, uploadPhoto,
} from '@/app/actions/profile'
import { goToEncounter, submitReview } from '@/app/actions/public'
import { ActionForm } from '@/components/ActionForm'
import { Availability, Stars, StarsInput } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { isAvailableNow } from '@/lib/availability'
import { clientStats } from '@/lib/clients'
import { CATEGORIES, CITIES, dateFormat, DAYS, hourLabel, SITE_URL, timeFormat } from '@/lib/constants'
import { db } from '@/lib/db'
import { RATE_WINDOW_DAYS } from '@/lib/profiles'
import { REGIONS } from '@/lib/regions'

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false } }

const STATUS: Record<string, string> = {
  DRAFT: 'Borrador · no visible', ACTIVE: 'Publicado', PAUSED: 'Pausado · no visible',
  REVIEW: 'Oculto mientras moderación revisa denuncias', SUSPENDED: 'Suspendido por moderación',
}
const rateWindow = () => new Date(Date.now() - RATE_WINDOW_DAYS * 864e5)
const qr = (text: string) => QRCode.toString(text, { type: 'svg', margin: 1, color: { dark: '#0b0a0e', light: '#f6f0e9' } })
async function origin() {
  const h = await headers()
  const host = h.get('host')
  return host ? `${h.get('x-forwarded-proto') ?? 'http'}://${host}` : SITE_URL
}

const Section = ({ icon: Icon, title, children, id }: { icon: typeof Star; title: string; children: React.ReactNode; id?: string }) => (
  <section id={id} className="card scroll-mt-24 space-y-5">
    <h2 className="h-section flex items-center gap-2.5"><Icon className="size-5 text-rose" />{title}</h2>
    {children}
  </section>
)

export default async function Panel({ searchParams }: { searchParams: Promise<{ encuentro?: string; sello?: string; calificado?: string }> }) {
  const user = await requireUser()
  const q = await searchParams
  if (user.role === 'ADVERTISER') return <AdvertiserPanel userId={user.id} rated={q.calificado === '1'} />
  if (user.role === 'ADMIN') return <div className="container-page py-12"><Link href="/admin" className="btn btn-primary">Ir a moderación</Link></div>
  return <ClientPanel userId={user.id} handle={user.handle} justConfirmed={q.encuentro === 'ok'} seal={/^ENC-[A-Z0-9]+$/.test(q.sello ?? '') ? q.sello : undefined} />
}

async function ClientPanel({ userId, handle, justConfirmed, seal }: { userId: string; handle: string; justConfirmed: boolean; seal?: string }) {
  const [pending, reviews, stats, base] = await Promise.all([
    db.encounter.findMany({ where: { clientId: userId, review: null, confirmedAt: { gt: rateWindow() } }, include: { profile: true }, orderBy: { confirmedAt: 'desc' } }),
    db.review.findMany({ where: { authorId: userId }, include: { profile: true, encounter: true }, orderBy: { createdAt: 'desc' } }),
    clientStats(userId),
    origin(),
  ])
  const passUrl = `${base}/c/${handle}`
  return (
    <div className="container-page grid gap-6 py-10 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <header className="space-y-2"><p className="eyebrow">Mi cuenta</p><h1 className="display text-4xl">Hola, <em className="grad-text">{handle}</em></h1></header>
        {justConfirmed && <p role="status" className="rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">Encuentro confirmado. Ya puedes dejar tu reseña verificada aquí abajo.</p>}

        {seal && <p role="status" className="rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">Reseña guardada con el sello <Link href={`/verificar/${seal}`} className="font-mono underline">{seal}</Link>. Se publica cuando la otra parte también califique, o en 7 días.</p>}

        <Section icon={QrCode} title="Confirmar un encuentro">
          <p className="text-sm text-mute">Escanea el QR que te muestra la anunciante con la cámara del celular, o escribe su código de 6 caracteres.</p>
          <form action={goToEncounter} className="flex flex-col gap-2 sm:flex-row">
            <input name="code" className="input font-mono tracking-[0.3em] uppercase" placeholder="ABC234" required maxLength={8} aria-label="Código de encuentro" />
            <button className="btn btn-primary shrink-0">Continuar</button>
          </form>
        </Section>

        {pending.map((e) => (
          <Section key={e.id} icon={Star} title={`Califica tu encuentro con ${e.profile.displayName}`}>
            <p className="text-xs text-mute">Encuentro del {dateFormat.format(e.confirmedAt!)} · sello <span className="font-mono">{e.publicId}</span>. Tu reseña es anónima y se publica cuando ambos califiquen o en 7 días.</p>
            <ActionForm action={submitReview.bind(null, e.id)} submit="Publicar reseña verificada">
              <StarsInput />
              <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="photosMatch" defaultChecked className="check" />Es la persona de las fotos</label>
              <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="askedDeposit" className="check" />Me pidió anticipo o depósito</label>
              <label className="block"><span className="label">Tu experiencia</span>
                <textarea name="body" className="input" rows={4} required minLength={20} maxLength={1500} placeholder="Puntualidad, trato, si coincidía con el anuncio…" />
              </label>
              <label className="block"><span className="label">¿Quién puede leer el texto?</span>
                <select name="visibility" className="input" defaultValue="MEMBERS">
                  <option value="MEMBERS">Privada · solo miembros con cuenta</option>
                  <option value="PUBLIC">Pública · cualquiera</option>
                </select>
              </label>
            </ActionForm>
          </Section>
        ))}

        <Section icon={BadgeCheck} title="Mis reseñas">
          {reviews.length === 0 && <p className="text-sm text-mute">Aún no has escrito reseñas.</p>}
          <ul className="divide-y divide-white/8">
            {reviews.map((r) => (
              <li key={r.id} className="space-y-1 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/p/${r.profile.slug}`} className="font-semibold hover:text-rose">{r.profile.displayName}</Link>
                  <Stars value={r.rating} />
                  <span className="chip">{r.visibility === 'PUBLIC' ? 'Pública' : 'Privada'}</span>
                  <span className="ml-auto font-mono text-xs text-mute">{r.encounter.publicId}</span>
                </div>
                <p className="text-mute">{r.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <aside className="space-y-4">
        <Section icon={ShieldCheck} title="Mi pase de cliente">
          <p className="text-sm text-mute">Tu reputación, sin tu identidad. Muéstralo antes de un encuentro para que confíen en ti.</p>
          <div className="mx-auto w-40 overflow-hidden rounded-2xl" dangerouslySetInnerHTML={{ __html: await qr(passUrl) }} />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-mute">Encuentros verificados</dt><dd className="font-semibold">{stats.encounters}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">Calificación</dt><dd className="font-semibold">{stats.average ? `${stats.average.toFixed(1)} / 5` : '—'}</dd></div>
          </dl>
          <Link href={`/c/${handle}`} className="btn w-full">Ver mi pase</Link>
        </Section>
      </aside>
    </div>
  )
}

async function AdvertiserPanel({ userId, rated }: { userId: string; rated: boolean }) {
  const now = new Date()
  let p = await db.profile.findUnique({
    where: { userId },
    include: { photos: { orderBy: { createdAt: 'asc' } }, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  // "Activa hace…" se actualiza cuando la anunciante usa su panel.
  if (p && (!p.lastSeenAt || now.getTime() - p.lastSeenAt.getTime() > 5 * 60_000)) {
    await db.profile.update({ where: { id: p.id }, data: { lastSeenAt: now } })
    p = { ...p, lastSeenAt: now }
  }
  const [active, toRate, base] = p
    ? await Promise.all([
        db.encounter.findFirst({ where: { profileId: p.id, clientId: null, expiresAt: { gt: now } } }),
        db.encounter.findMany({ where: { profileId: p.id, clientId: { not: null }, clientRating: null, confirmedAt: { gt: rateWindow() } }, include: { client: true }, orderBy: { confirmedAt: 'desc' } }),
        origin(),
      ])
    : [null, [], '']
  const approved = p?.photos.filter((ph) => ph.status === 'APPROVED').length ?? 0
  const lastV = p?.verifications[0]
  const canPublish = !!p?.identityVerifiedAt && approved > 0
  const steps: [string, boolean][] = [
    ['Completa tu perfil', !!p], ['Verifica tu identidad (18+)', !!p?.identityVerifiedAt],
    ['Ten al menos una foto aprobada', approved > 0], ['Publica', p?.status === 'ACTIVE'],
  ]
  const blocked = p?.blockedRegions.split(',').filter(Boolean) ?? []
  const days = p?.scheduleDays.split(',').filter(Boolean) ?? []

  return (
    <div className="container-page grid gap-6 py-10 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <header className="space-y-2"><p className="eyebrow">Mi cuenta</p><h1 className="display text-4xl">{p ? <>Hola, <em className="grad-text">{p.displayName}</em></> : 'Crea tu perfil'}</h1></header>

        {rated && <p role="status" className="rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">Calificación guardada. Gracias por cuidar a la comunidad.</p>}

        {p?.status === 'ACTIVE' && (
          <Section icon={Power} title="Disponibilidad" id="disponibilidad">
            <Availability p={p} className="text-sm" />
            <p className="text-sm text-mute">Enciéndela solo cuando de verdad puedas atender. Se apaga sola al cumplirse el tiempo, así quien te busca siempre ve información real.</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 4, 8].map((h) => (
                <form key={h} action={setAvailability.bind(null, h)}><button className="btn btn-sm">Disponible {h} h</button></form>
              ))}
              {isAvailableNow(p) && <form action={setAvailability.bind(null, 0)}><button className="btn btn-sm text-rose">Apagar ahora</button></form>}
            </div>
            <ActionForm action={saveSchedule} submit="Guardar horario" buttonClass="btn btn-sm" className="space-y-3 border-t border-white/8 pt-5">
              <p className="label flex items-center gap-2"><CalendarClock className="size-4" />Horario habitual (informativo)</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d, i) => (
                  <label key={d} className="cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium transition has-checked:border-rose has-checked:bg-rose/15 has-checked:text-rose">
                    <input type="checkbox" name="day" value={i} defaultChecked={days.includes(String(i))} className="sr-only" />{d}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['from', 'to'] as const).map((k) => (
                  <label key={k}><span className="label">{k === 'from' ? 'Desde' : 'Hasta'}</span>
                    <select name={k} className="input" defaultValue={k === 'from' ? p.scheduleFrom : p.scheduleTo}>
                      {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </ActionForm>
          </Section>
        )}

        {toRate.map((e) => (
          <Section key={e.id} icon={UserRound} title={`Califica a ${e.client?.handle ?? 'tu cliente'}`}>
            <p className="text-xs text-mute">Encuentro del {dateFormat.format(e.confirmedAt!)}. Tu calificación alimenta su pase de cliente y protege a las demás. Él no la ve hasta que ambos califiquen o pasen 7 días.</p>
            <ActionForm action={rateClient.bind(null, e.id)} submit="Guardar calificación">
              <StarsInput />
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <label className="flex items-center gap-2.5"><input type="checkbox" name="respectful" defaultChecked className="check" />Trato respetuoso</label>
                <label className="flex items-center gap-2.5"><input type="checkbox" name="paidAsAgreed" defaultChecked className="check" />Pagó lo acordado</label>
                <label className="flex items-center gap-2.5"><input type="checkbox" name="punctual" defaultChecked className="check" />Puntual</label>
              </div>
            </ActionForm>
          </Section>
        ))}

        <Section icon={UserRound} title="Mi perfil" id="perfil">
          <ActionForm action={saveProfile} submit="Guardar perfil" className="grid gap-4 sm:grid-cols-2">
            <label><span className="label">Nombre artístico</span><input name="displayName" className="input" required defaultValue={p?.displayName} maxLength={40} /></label>
            <label><span className="label">Edad</span><input name="age" type="number" min={18} max={99} className="input" required defaultValue={p?.age} /></label>
            <label><span className="label">Ciudad</span><select name="city" className="input" defaultValue={p?.city ?? CITIES[0]}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label><span className="label">Zona o barrio (opcional)</span><input name="zone" className="input" defaultValue={p?.zone} maxLength={60} /></label>
            <label><span className="label">Categoría</span><select name="category" className="input" defaultValue={p?.category ?? CATEGORIES[0]}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label><span className="label">Tarifa desde (COP)</span><input name="priceFrom" type="number" min={10000} step={10000} className="input" required defaultValue={p?.priceFrom} /></label>
            <label className="sm:col-span-2"><span className="label">WhatsApp (con indicativo, solo números)</span><input name="whatsapp" className="input" required defaultValue={p?.whatsapp} placeholder="573001234567" inputMode="tel" /></label>
            <label className="sm:col-span-2"><span className="label">Descripción</span><textarea name="description" className="input" rows={5} required minLength={40} maxLength={2000} defaultValue={p?.description} /></label>
          </ActionForm>
        </Section>

        {p && (
          <Section icon={EyeOff} title="Privacidad" id="privacidad">
            <ActionForm action={savePrivacy} submit="Guardar privacidad">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 transition has-checked:border-rose has-checked:bg-rose/10">
                <input type="checkbox" name="discreet" defaultChecked={p.discreet} className="check mt-0.5" />
                <span><span className="font-semibold">Modo discreto</span><span className="mt-1 block text-sm text-mute">Quien no tenga cuenta verá tus fotos difuminadas y no podrá ver tu contacto. Tu perfil tampoco aparecerá en Google.</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 transition has-checked:border-rose has-checked:bg-rose/10">
                <input type="checkbox" name="onlyAbroad" defaultChecked={blocked.length === REGIONS.length - 1 && !blocked.includes('EXT')} className="check mt-0.5" />
                <span><span className="font-semibold">Solo visible fuera de Colombia</span><span className="mt-1 block text-sm text-mute">Tu perfil solo aparecerá a quien navegue desde otro país. Ojo: un extranjero que ya está en Colombia navega con conexión colombiana y no te verá.</span></span>
              </label>
              <fieldset className="space-y-3">
                <legend className="label">Dónde NO quieres aparecer</legend>
                <p className="text-xs leading-relaxed text-mute">Quien navegue desde los lugares marcados no verá tu perfil, tus fotos ni tu contacto, ni siquiera con el enlace directo. Se basa en la ubicación de la conexión: protege frente a la mayoría, pero alguien con VPN podría saltárselo.</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-3">
                  {REGIONS.map((r) => (
                    <label key={r.code} className="flex cursor-pointer items-center gap-2"><input type="checkbox" name="blocked" value={r.code} defaultChecked={blocked.includes(r.code)} className="check" />{r.name}</label>
                  ))}
                </div>
              </fieldset>
            </ActionForm>
          </Section>
        )}

        {p && (
          <Section icon={Camera} title="Fotos" id="fotos">
            <p className="text-sm text-mute">Eliminamos la ubicación y demás metadatos de cada foto y le ponemos una marca de agua para que no la usen en perfiles falsos. Se publican tras la revisión de moderación.</p>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
              {p.photos.map((ph) => (
                <div key={ph.id} className="space-y-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/${ph.id}`} alt="" className="aspect-[4/5] w-full rounded-2xl border border-white/8 object-cover" />
                  <div className="flex items-center justify-between text-xs">
                    <span className={ph.status === 'APPROVED' ? 'text-mint' : 'text-amber'}>{ph.status === 'APPROVED' ? 'Aprobada' : 'En revisión'}</span>
                    <form action={deletePhoto.bind(null, ph.id)}><button className="cursor-pointer text-rose hover:underline">Eliminar</button></form>
                  </div>
                </div>
              ))}
            </div>
            <ActionForm action={uploadPhoto} submit="Subir foto" buttonClass="btn btn-sm" className="flex flex-wrap items-center gap-3">
              <input type="file" name="photo" accept="image/*" required className="text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream" />
            </ActionForm>
          </Section>
        )}

        {p && !p.identityVerifiedAt && (
          <Section icon={ShieldCheck} title="Verificación de identidad" id="verificacion">
            {lastV?.status === 'PENDING' ? <p className="text-sm text-amber">Tu solicitud está en revisión.</p> : (
              <>
                {lastV?.status === 'REJECTED' && <p className="text-sm text-rose">Solicitud rechazada: {lastV.note || 'sin detalle'}. Puedes volver a intentarlo.</p>}
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-mute">
                  <li>Escribe en un papel el código <strong className="font-mono text-cream">{p.verifyCode}</strong> y la fecha de hoy.</li>
                  <li>Tómate una selfie sosteniendo el papel, con el rostro visible.</li>
                  <li>Toma una foto de tu documento de identidad (cara frontal).</li>
                </ol>
                <ActionForm action={submitVerification} submit="Enviar a verificación">
                  <label className="block"><span className="label">Documento de identidad</span><input type="file" name="doc" accept="image/*" required className="text-sm" /></label>
                  <label className="block"><span className="label">Selfie con el código</span><input type="file" name="selfie" accept="image/*" required className="text-sm" /></label>
                  <label className="flex items-start gap-2.5 text-sm text-mute">
                    <input type="checkbox" name="consent" required className="check mt-0.5" />
                    <span>Autorizo el uso de estas imágenes solo para verificar mi identidad y mayoría de edad. El documento se elimina al terminar la revisión; la selfie se conserva en privado para validar mis fotos. Ver <Link href="/legal/privacidad" className="text-rose hover:underline">tratamiento de datos</Link>.</span>
                  </label>
                </ActionForm>
              </>
            )}
          </Section>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Section icon={BadgeCheck} title="Estado">
          <p className="text-sm">{p ? STATUS[p.status] : 'Sin perfil'}</p>
          <ul className="space-y-1.5 text-sm">
            {steps.map(([label, done]) => <li key={label} className={done ? 'text-mint' : 'text-mute'}>{done ? '✓' : '○'} {label}</li>)}
          </ul>
          {p && ['DRAFT', 'PAUSED', 'ACTIVE'].includes(p.status) && (
            <form action={setPublished.bind(null, p.status !== 'ACTIVE')}>
              <button className={`btn w-full ${p.status === 'ACTIVE' ? '' : 'btn-primary'}`} disabled={p.status !== 'ACTIVE' && !canPublish}>{p.status === 'ACTIVE' ? 'Pausar perfil' : 'Publicar perfil'}</button>
            </form>
          )}
          {p && <Link href={`/p/${p.slug}`} className="block text-sm text-rose hover:underline">Ver mi perfil →</Link>}
        </Section>

        {p?.identityVerifiedAt && (
          <Section icon={QrCode} title="Código de encuentro" id="encuentro">
            {active ? (
              <div className="space-y-3 text-center">
                <div className="mx-auto w-48 overflow-hidden rounded-2xl" dangerouslySetInnerHTML={{ __html: await qr(`${base}/e/${active.code}`) }} />
                <p className="font-mono text-3xl font-bold tracking-[0.3em]" data-testid="encounter-code">{active.code}</p>
                <p className="text-xs text-mute">Muéstraselo a tu cliente. Vence a las {timeFormat.format(active.expiresAt)} y sirve una sola vez.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-mute">Durante el encuentro, genera un código y muéstraselo a tu cliente. Al confirmarlo, ambos podrán calificarse y tu reputación crece.</p>
                <form action={openEncounter}><button className="btn btn-primary w-full">Generar código</button></form>
              </>
            )}
          </Section>
        )}
      </aside>
    </div>
  )
}

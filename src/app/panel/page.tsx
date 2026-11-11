import { BadgeCheck, BellRing, CalendarClock, Camera, CircleFadingPlus, EyeOff, Inbox, Power, QrCode, ShieldCheck, Star, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  decideRequest, deletePhoto, openEncounter, rateClient, savePrivacy, saveProfile, saveSchedule, setAvailability, setPublished,
  submitVerification, uploadPhoto, uploadStory,
} from '@/app/actions/profile'
import { submitReview } from '@/app/actions/public'
import { ActionForm } from '@/components/ActionForm'
import { Availability, Stars, StarsInput } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { isAvailableNow } from '@/lib/availability'
import { clientStats } from '@/lib/clients'
import { CATEGORIES, CITIES, dateFormat, DAYS, hourLabel, SITE_URL, timeFormat } from '@/lib/constants'
import { db } from '@/lib/db'
import { RATE_WINDOW_DAYS } from '@/lib/profiles'
import { REGIONS } from '@/lib/regions'
import { parseList, serviceLabel, SERVICES } from '@/lib/services'
import { TAG_GROUPS } from '@/lib/tags'

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

export default async function Panel({ searchParams }: { searchParams: Promise<{ encuentro?: string; sello?: string; calificado?: string; nueva?: string }> }) {
  const user = await requireUser()
  const q = await searchParams
  if (user.role === 'ADVERTISER') return <AdvertiserPanel userId={user.id} rated={q.calificado === '1'} />
  if (user.role === 'ADMIN') return <div className="container-page py-12"><Link href="/admin" className="btn btn-primary">Ir a moderación</Link></div>
  return <ClientPanel userId={user.id} handle={user.handle} justConfirmed={q.encuentro === 'ok'} seal={/^ENC-[A-Z0-9]+$/.test(q.sello ?? '') ? q.sello : undefined} anonymous={!user.email} isNew={q.nueva === '1'} />
}

async function ClientPanel({ userId, handle, justConfirmed, seal, anonymous, isNew }: { userId: string; handle: string; justConfirmed: boolean; seal?: string; anonymous: boolean; isNew: boolean }) {
  const [favorites, requests] = await Promise.all([
    db.favorite.findMany({ where: { userId }, include: { profile: true }, orderBy: { createdAt: 'desc' } }),
    db.contactRequest.findMany({ where: { clientId: userId, createdAt: { gt: new Date(Date.now() - 7 * 864e5) } }, include: { profile: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ])
  const favs = favorites.filter((f) => f.profile.status === 'ACTIVE').sort((a, b) => Number(isAvailableNow(b.profile)) - Number(isAvailableNow(a.profile)))
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
        {anonymous && (
          <p className={`rounded-2xl border px-4 py-3 text-sm ${isNew ? 'border-amber/30 bg-amber/10 text-amber' : 'border-white/10 text-mute'}`}>
            Cuenta anónima. Para volver a entrar usa tu alias <strong className="font-mono text-cream">{handle}</strong> y tu contraseña. Guárdalos: sin correo no hay forma de recuperar la cuenta.
          </p>
        )}
        {justConfirmed && <p role="status" className="rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">Encuentro confirmado. Ya puedes dejar tu reseña verificada aquí abajo.</p>}

        {seal && <p role="status" className="rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">Reseña guardada con el sello <Link href={`/verificar/${seal}`} className="font-mono underline">{seal}</Link>. Se publica cuando la otra parte también califique, o en 7 días.</p>}

        <Section icon={BellRing} title="Favoritas">
          {favs.length === 0 ? <p className="text-sm text-mute">Toca «Avísame cuando esté disponible» en un perfil y aparecerá aquí, con las disponibles primero.</p> : (
            <ul className="divide-y divide-white/8">
              {favs.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link href={`/p/${f.profile.slug}`} className="font-semibold hover:text-rose">{f.profile.displayName} <span className="font-normal text-mute">· {f.profile.city}</span></Link>
                  <Availability p={f.profile} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {requests.length > 0 && (
          <Section icon={Inbox} title="Mis solicitudes">
            <ul className="divide-y divide-white/8">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-semibold">{r.profile.displayName}</span>
                  {r.status === 'ACCEPTED' ? <Link href={`/p/${r.profile.slug}`} className="btn btn-primary btn-sm">Aceptada · ver su WhatsApp</Link>
                    : <span className={`chip ${r.status === 'PENDING' ? 'chip-warn' : ''}`}>{r.status === 'PENDING' ? 'Esperando respuesta' : 'No aceptada'}</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section icon={QrCode} title="Confirmar un encuentro">
          <p className="text-sm text-mute">Entra al perfil de la persona y escribe su PIN de 4 dígitos en «Confirma el encuentro», o escanea su QR con la cámara del celular.</p>
        </Section>

        {pending.map((e) => (
          <Section key={e.id} icon={Star} title={`Califica tu encuentro con ${e.profile.displayName}`}>
            <p className="text-xs text-mute">Encuentro del {dateFormat.format(e.confirmedAt!)} · sello <span className="font-mono">{e.publicId}</span>. Tu reseña es anónima y se publica cuando ambos califiquen o en 7 días.</p>
            <ActionForm action={submitReview.bind(null, e.id)} submit="Publicar reseña verificada">
              <StarsInput />
              <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="photosMatch" defaultChecked className="check" />Es la persona de las fotos</label>
              <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="askedDeposit" className="check" />Me pidió anticipo o depósito</label>
              {parseList(e.profile.services).length > 0 && (
                <fieldset className="space-y-2"><legend className="label">Califica los servicios que tomaste</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {parseList(e.profile.services).map((k) => (
                      <label key={k} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 px-3 py-2 text-sm">
                        {serviceLabel(k)}
                        <select name={`svc_${k}`} className="rounded-lg bg-black/40 px-2 py-1 text-xs" defaultValue="" aria-label={`Calificación de ${serviceLabel(k)}`}>
                          <option value="">No lo tomé</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
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
  const [active, toRate, base, inbox] = p
    ? await Promise.all([
        db.encounter.findFirst({ where: { profileId: p.id, clientId: null, expiresAt: { gt: now } } }),
        db.encounter.findMany({ where: { profileId: p.id, clientId: { not: null }, clientRating: null, confirmedAt: { gt: rateWindow() } }, include: { client: true }, orderBy: { confirmedAt: 'desc' } }),
        origin(),
        db.contactRequest.findMany({ where: { profileId: p.id, status: 'PENDING', createdAt: { gt: new Date(now.getTime() - 864e5) } }, include: { client: true }, orderBy: { createdAt: 'asc' } }),
      ])
    : [null, [], '', []]
  const inboxStats = await Promise.all(inbox.map((r) => clientStats(r.clientId)))
  const approved = p?.photos.filter((ph) => ph.status === 'APPROVED' && ph.kind === 'GALLERY').length ?? 0
  const lastV = p?.verifications[0]
  const canPublish = !!p?.identityVerifiedAt && approved > 0
  const steps: [string, boolean][] = [
    ['Completa tu perfil', !!p], ['Verifica tu identidad (18+)', !!p?.identityVerifiedAt],
    ['Ten al menos una foto aprobada', approved > 0], ['Publica', p?.status === 'ACTIVE'],
  ]
  const blocked = p?.blockedRegions.split(',').filter(Boolean) ?? []
  const days = p?.scheduleDays.split(',').filter(Boolean) ?? []
  const offered = p ? parseList(p.services) : []
  const myTags = p ? parseList(p.tags) : []
  let extras: { label: string; price: number }[] = []
  try { extras = JSON.parse(p?.extras ?? '[]') } catch { /* sin adicionales */ }
  const gallery = p?.photos.filter((ph) => ph.kind === 'GALLERY') ?? []
  const stories = p?.photos.filter((ph) => ph.kind === 'STORY' && (ph.status === 'PENDING' || (ph.expiresAt && ph.expiresAt > now))) ?? []

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

        {inbox.length > 0 && (
          <Section icon={Inbox} title={`Solicitudes (${inbox.length})`} id="solicitudes">
            <p className="text-xs text-mute">Tu número sigue oculto. Solo quien aceptes podrá verlo durante 48 horas.</p>
            {inbox.map((r, i) => {
              const st = inboxStats[i]
              return (
                <article key={r.id} className="space-y-3 rounded-2xl border border-white/8 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-cream">{r.client.handle}</span>
                    <span className={`chip ${st.encounters ? 'chip-ok' : ''}`}>{st.encounters} encuentros verificados</span>
                    {st.average !== null && <span className="chip chip-ok">★ {st.average.toFixed(1)} de anunciantes</span>}
                    {st.paidAsAgreed !== null && <span className="chip">Pagó lo acordado {st.paidAsAgreed} %</span>}
                    {st.encounters === 0 && <span className="chip chip-warn">Cliente nuevo, sin historial</span>}
                  </div>
                  <p className="text-sm whitespace-pre-line text-cream/85">{r.message}</p>
                  <div className="flex gap-2">
                    <form action={decideRequest.bind(null, r.id, true)}><button className="btn btn-primary btn-sm">Aceptar y mostrar mi WhatsApp</button></form>
                    <form action={decideRequest.bind(null, r.id, false)}><button className="btn btn-sm">No aceptar</button></form>
                  </div>
                </article>
              )
            })}
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
            <fieldset className="grid grid-cols-2 gap-2 text-sm sm:col-span-2">
              <legend className="label">¿Quién publica?</legend>
              {[['INDEPENDENT', 'Soy independiente', 'Anuncio por mi cuenta.'], ['AGENCY', 'Agencia o establecimiento', 'Se mostrará claramente en el perfil.']].map(([v, t, d]) => (
                <label key={v} className="cursor-pointer rounded-2xl border border-white/10 p-3.5 transition has-checked:border-rose has-checked:bg-rose/10">
                  <input type="radio" name="kind" value={v} defaultChecked={(p?.kind ?? 'INDEPENDENT') === v} className="sr-only" />
                  <span className="font-semibold">{t}</span><span className="block text-xs text-mute">{d}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="label">Servicios que ofreces</legend>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((sv) => (
                  <label key={sv.key} className="cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-mute transition has-checked:border-rose has-checked:bg-rose/15 has-checked:text-rose">
                    <input type="checkbox" name="service" value={sv.key} defaultChecked={offered.includes(sv.key)} className="sr-only" />{sv.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-3 sm:col-span-2">
              <legend className="label">Apariencia y estilo (máximo 8): así te encuentran con los filtros</legend>
              {TAG_GROUPS.map((g) => (
                <div key={g.group} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-xs text-mute">{g.group}</span>
                  {g.tags.map(([key, label]) => (
                    <label key={key} className="cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-mute transition has-checked:border-rose has-checked:bg-rose/15 has-checked:text-rose">
                      <input type="checkbox" name="tag" value={key} defaultChecked={myTags.includes(key)} className="sr-only" />{label}
                    </label>
                  ))}
                </div>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" name="incall" defaultChecked={p?.incall} className="check" />Tengo lugar propio</label>
              <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" name="outcall" defaultChecked={p?.outcall} className="check" />Voy a domicilio u hotel</label>
            </div>
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="label">Adicionales (nombre y precio extra; 0 = incluido)</legend>
              <p className="text-xs text-mute">Tu cliente los elige en tu perfil y te llegan escritos en el primer mensaje de WhatsApp, junto con el servicio, el lugar y el horario.</p>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="grid grid-cols-[1fr_8rem] gap-2">
                  <input name="extraLabel" className="input" maxLength={40} defaultValue={extras[i]?.label} placeholder={['Hora adicional', 'Ducha juntos', 'Lencería a elección', '', '', ''][i]} aria-label={`Adicional ${i + 1}`} />
                  <input name="extraPrice" type="number" min={0} step={1000} className="input" defaultValue={extras[i]?.price || ''} placeholder="Precio" aria-label={`Precio del adicional ${i + 1}`} />
                </div>
              ))}
            </fieldset>
          </ActionForm>
        </Section>

        {p && (
          <Section icon={EyeOff} title="Privacidad" id="privacidad">
            <ActionForm action={savePrivacy} submit="Guardar privacidad">
              <fieldset className="grid gap-2 text-sm sm:grid-cols-2">
                <legend className="label">¿Cómo te contactan?</legend>
                {[['DIRECT', 'Contacto directo', 'Tu WhatsApp se entrega a quien pulse «Escribir».'], ['REQUEST', 'Con solicitud', 'Tu número queda oculto. Recibes la solicitud con la reputación del cliente y decides a quién mostrárselo.']].map(([v, t, d]) => (
                  <label key={v} className="cursor-pointer rounded-2xl border border-white/10 p-3.5 transition has-checked:border-rose has-checked:bg-rose/10">
                    <input type="radio" name="contactMode" value={v} defaultChecked={p.contactMode === v} className="sr-only" />
                    <span className="font-semibold">{t}</span><span className="mt-0.5 block text-xs text-mute">{d}</span>
                  </label>
                ))}
              </fieldset>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 transition has-checked:border-rose has-checked:bg-rose/10">
                <input type="checkbox" name="discreet" defaultChecked={p.discreet} className="check mt-0.5" />
                <span><span className="font-semibold">Modo discreto</span><span className="mt-1 block text-sm text-mute">Quien no tenga cuenta verá tus fotos difuminadas y no podrá ver tu contacto. Tu perfil tampoco aparecerá en Google.</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 transition has-checked:border-rose has-checked:bg-rose/10">
                <input type="checkbox" name="foreignersOnly" defaultChecked={p.foreignersOnly} className="check mt-0.5" />
                <span><span className="font-semibold">Solo para visitantes extranjeros</span><span className="mt-1 block text-sm text-mute">Tu perfil solo aparece a quien navega desde otro país o tiene su teléfono o navegador en un idioma distinto al español (así también te ve un turista que ya está en Colombia). Es un filtro por indicios, no una garantía: confirma siempre por chat.</span></span>
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
              {gallery.map((ph) => (
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

        {p?.identityVerifiedAt && (
          <Section icon={CircleFadingPlus} title="Historias" id="historias">
            <p className="text-sm text-mute">Una foto del día que aparece arriba en inicio y explorar durante 24 horas. Sirve para mostrar que estás activa hoy. Máximo 5 a la vez; pasan por moderación.</p>
            {stories.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {stories.map((st) => (
                  <div key={st.id} className="w-20 space-y-1 text-center text-[0.65rem]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/${st.id}`} alt="" className="aspect-[9/16] w-full rounded-xl border border-white/8 object-cover" />
                    <span className={st.status === 'APPROVED' ? 'text-mint' : 'text-amber'}>{st.status === 'APPROVED' ? `Hasta ${timeFormat.format(st.expiresAt!)}` : 'En revisión'}</span>
                    <form action={deletePhoto.bind(null, st.id)}><button className="cursor-pointer text-rose hover:underline">Eliminar</button></form>
                  </div>
                ))}
              </div>
            )}
            <ActionForm action={uploadStory} submit="Publicar historia" buttonClass="btn btn-sm" className="flex flex-wrap items-center gap-3">
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
                <p className="font-mono text-5xl font-bold tracking-[0.25em]" data-testid="encounter-pin">{active.pin}</p>
                <a href={`/e/${active.code}`} data-testid="encounter-link" className="sr-only">Enlace del QR</a>
                <p className="text-xs text-mute">Dile el PIN a tu cliente o muéstrale el QR. Vence a las {timeFormat.format(active.expiresAt)}, sirve una sola vez y se anula tras 5 intentos fallidos.</p>
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

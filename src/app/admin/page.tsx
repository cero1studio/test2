import type { Metadata } from 'next'
import Link from 'next/link'
import { resolveReport, reviewPhoto, reviewVerification } from '@/app/actions/admin'
import { requireUser } from '@/lib/auth'
import { dateFormat, REPORT_REASONS } from '@/lib/constants'
import { db } from '@/lib/db'
import { hashDistance, SAME_PHOTO_MAX_DISTANCE } from '@/lib/scam'

export const metadata: Metadata = { title: 'Moderación', robots: { index: false } }

const reason = (key: string) => REPORT_REASONS.find((r) => r.key === key)

export default async function Admin() {
  await requireUser('ADMIN')
  const [verifications, photos, reports] = await Promise.all([
    db.verification.findMany({ where: { status: 'PENDING' }, include: { profile: true }, orderBy: { createdAt: 'asc' } }),
    db.photo.findMany({
      where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, take: 60,
      include: { profile: { include: { verifications: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 1 } } } },
    }),
    db.report.findMany({ where: { status: 'OPEN' }, include: { profile: true }, orderBy: { createdAt: 'asc' } }),
  ])
  // Señal de estafa: la misma foto ya publicada en el perfil de otra persona.
  const known = photos.length ? await db.photo.findMany({ where: { status: 'APPROVED', hash: { not: '' } }, select: { hash: true, profileId: true, profile: { select: { displayName: true, slug: true } } }, take: 5000 }) : []
  const duplicateOf = (ph: { hash: string; profileId: string }) =>
    ph.hash ? known.find((k) => k.profileId !== ph.profileId && hashDistance(k.hash, ph.hash) <= SAME_PHOTO_MAX_DISTANCE)?.profile : undefined
  reports.sort((a, b) => Number(!!reason(b.reason)?.severe) - Number(!!reason(a.reason)?.severe))

  return (
    <div className="container-page space-y-12 py-10">
      <header className="space-y-2"><p className="eyebrow">Panel interno</p><h1 className="display text-4xl">Moderación</h1></header>

      <section className="space-y-4">
        <h2 className="h-section">Denuncias abiertas ({reports.length})</h2>
        {reports.length === 0 && <p className="card text-sm text-mute">Sin denuncias pendientes.</p>}
        {reports.map((r) => (
          <article key={r.id} className={`card space-y-3 ${reason(r.reason)?.severe ? 'border-rose/60' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {reason(r.reason)?.severe && <span className="chip chip-rose">PRIORITARIA</span>}
              <strong>{reason(r.reason)?.label ?? r.reason}</strong>
              <Link href={`/p/${r.profile.slug}`} className="text-rose hover:underline">{r.profile.displayName}</Link>
              <span className="chip">{r.profile.status}</span>
              <span className="ml-auto text-xs text-mute">{dateFormat.format(r.createdAt)} · {r.reporterId ? 'usuario registrado' : 'anónima'}</span>
            </div>
            <p className="text-sm text-cream/85">{r.details}</p>
            <div className="flex gap-2">
              <form action={resolveReport.bind(null, r.id, 'suspend')}><button className="btn btn-primary btn-sm">Suspender perfil</button></form>
              <form action={resolveReport.bind(null, r.id, 'dismiss')}><button className="btn btn-sm">Descartar</button></form>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="h-section">Verificaciones de identidad ({verifications.length})</h2>
        {verifications.length === 0 && <p className="card text-sm text-mute">Sin solicitudes pendientes.</p>}
        {verifications.map((v) => (
          <article key={v.id} className="card grid gap-5 md:grid-cols-[1fr_1fr_18rem]">
            {(['doc', 'selfie'] as const).map((t) => (
              <figure key={t}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/admin/archivo/${v.id}?t=${t}`} alt={t === 'doc' ? 'Documento' : 'Selfie con código'} className="max-h-80 w-full rounded-2xl border border-white/8 object-contain" />
                <figcaption className="mt-1.5 text-xs text-mute">{t === 'doc' ? 'Documento' : 'Selfie con código'}</figcaption>
              </figure>
            ))}
            <form action={reviewVerification.bind(null, v.id)} className="space-y-3 text-sm">
              <p><Link href={`/p/${v.profile.slug}`} className="font-semibold text-rose hover:underline">{v.profile.displayName}</Link> · declara {v.profile.age} años</p>
              <p>Código esperado: <strong className="font-mono">{v.code}</strong></p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-mute">
                <li>El documento es auténtico y confirma 18 años o más.</li>
                <li>El rostro de la selfie coincide con el del documento.</li>
                <li>El código y una fecha reciente se leen en el papel.</li>
                <li>Las fotos públicas muestran a la misma persona (para «fotos reales»).</li>
                <li>No hay señales de coacción ni de que un tercero controle la cuenta.</li>
              </ul>
              <select name="decision" className="input" required defaultValue="">
                <option value="" disabled>Decisión…</option>
                <option value="identity+photos">Aprobar identidad y fotos</option>
                <option value="identity">Aprobar solo identidad</option>
                <option value="reject">Rechazar</option>
              </select>
              <input name="note" className="input" placeholder="Motivo (si rechazas)" maxLength={500} />
              <button className="btn btn-primary w-full">Resolver</button>
            </form>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="h-section">Fotos por aprobar ({photos.length})</h2>
        {photos.length === 0 && <p className="card text-sm text-mute">Sin fotos pendientes.</p>}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((ph) => {
            const ref = ph.profile.verifications[0]
            const dup = duplicateOf(ph)
            return (
              <div key={ph.id} className="card space-y-2.5 p-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${ph.id}`} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover" />
                <p className="truncate font-semibold">{ph.profile.displayName} {ph.kind === 'STORY' && <span className="chip ml-1">Historia</span>}</p>
                {dup && <p className="rounded-xl border border-rose/40 bg-rose/10 p-2 text-xs text-rose">Posible foto robada: coincide con una de <Link href={`/p/${dup.slug}`} className="underline">{dup.displayName}</Link>.</p>}
                {ref?.selfieFile
                  ? <a href={`/admin/archivo/${ref.id}?t=selfie`} target="_blank" className="text-xs text-rose hover:underline">Comparar con selfie verificada</a>
                  : <p className="text-xs text-amber">Sin selfie de referencia</p>}
                <div className="flex gap-2">
                  <form action={reviewPhoto.bind(null, ph.id, true)} className="flex-1"><button className="btn btn-primary btn-sm w-full">Aprobar</button></form>
                  <form action={reviewPhoto.bind(null, ph.id, false)} className="flex-1"><button className="btn btn-sm w-full">Rechazar</button></form>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { resolveReport, reviewPhoto, reviewVerification } from '@/app/actions/admin'
import { requireUser } from '@/lib/auth'
import { dateFormat, REPORT_REASONS } from '@/lib/constants'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Moderación' }

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
  reports.sort((a, b) => Number(!!reason(b.reason)?.severe) - Number(!!reason(a.reason)?.severe))

  return (
    <div className="container-page space-y-10 py-8">
      <h1 className="text-3xl font-black">Moderación</h1>

      <section className="space-y-3">
        <h2 className="h-section">Denuncias abiertas ({reports.length})</h2>
        {reports.length === 0 && <p className="card text-sm text-mute">Sin denuncias pendientes.</p>}
        {reports.map((r) => (
          <article key={r.id} className={`card space-y-2 ${reason(r.reason)?.severe ? 'border-rose' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {reason(r.reason)?.severe && <span className="badge border-rose bg-rose/10 text-rose">PRIORITARIA</span>}
              <strong>{reason(r.reason)?.label ?? r.reason}</strong>
              <Link href={`/p/${r.profile.slug}`} className="text-rose underline">{r.profile.displayName}</Link>
              <span className="badge badge-mute">{r.profile.status}</span>
              <span className="ml-auto text-xs text-mute">{dateFormat.format(r.createdAt)} · {r.reporterId ? 'usuario registrado' : 'anónima'}</span>
            </div>
            <p className="text-sm text-zinc-300">{r.details}</p>
            <div className="flex gap-2">
              <form action={resolveReport.bind(null, r.id, 'suspend')}><button className="btn btn-primary">Suspender perfil</button></form>
              <form action={resolveReport.bind(null, r.id, 'dismiss')}><button className="btn">Descartar</button></form>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="h-section">Verificaciones de identidad ({verifications.length})</h2>
        {verifications.length === 0 && <p className="card text-sm text-mute">Sin solicitudes pendientes.</p>}
        {verifications.map((v) => (
          <article key={v.id} className="card grid gap-4 md:grid-cols-[1fr_1fr_18rem]">
            {(['doc', 'selfie'] as const).map((t) => (
              <figure key={t}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/admin/archivo/${v.id}?t=${t}`} alt={t === 'doc' ? 'Documento' : 'Selfie con código'} className="max-h-80 w-full rounded-lg border border-line object-contain" />
                <figcaption className="mt-1 text-xs text-mute">{t === 'doc' ? 'Documento' : 'Selfie con código'}</figcaption>
              </figure>
            ))}
            <form action={reviewVerification.bind(null, v.id)} className="space-y-3 text-sm">
              <p><Link href={`/p/${v.profile.slug}`} className="font-bold text-rose underline">{v.profile.displayName}</Link> · declara {v.profile.age} años</p>
              <p>Código esperado: <strong className="font-mono">{v.code}</strong></p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-mute">
                <li>El documento es auténtico y confirma 18 años o más.</li>
                <li>El rostro de la selfie coincide con el del documento.</li>
                <li>El código y una fecha reciente se leen en el papel.</li>
                <li>Las fotos públicas muestran a la misma persona (para «fotos reales»).</li>
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

      <section className="space-y-3">
        <h2 className="h-section">Fotos por aprobar ({photos.length})</h2>
        {photos.length === 0 && <p className="card text-sm text-mute">Sin fotos pendientes.</p>}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((ph) => {
            const ref = ph.profile.verifications[0]
            return (
              <div key={ph.id} className="card space-y-2 p-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${ph.id}`} alt="" className="aspect-[4/5] w-full rounded-lg object-cover" />
                <p className="truncate font-semibold">{ph.profile.displayName}</p>
                {ref?.selfieFile
                  ? <a href={`/admin/archivo/${ref.id}?t=selfie`} target="_blank" className="text-xs text-rose underline">Comparar con selfie verificada</a>
                  : <p className="text-xs text-warn">Sin selfie de referencia</p>}
                <div className="flex gap-2">
                  <form action={reviewPhoto.bind(null, ph.id, true)} className="flex-1"><button className="btn btn-ok w-full">Aprobar</button></form>
                  <form action={reviewPhoto.bind(null, ph.id, false)} className="flex-1"><button className="btn w-full">Rechazar</button></form>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

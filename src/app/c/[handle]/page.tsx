import { ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { clientStats } from '@/lib/clients'
import { monthFormat } from '@/lib/constants'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Pase de cliente', robots: { index: false } }

// Pase de cliente: el cliente lo comparte voluntariamente con la anunciante
// antes de un encuentro. Solo muestra cifras agregadas.
export default async function ClientPass({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const client = await db.user.findFirst({ where: { handle, role: 'CLIENT' } })
  if (!client) notFound()
  const s = await clientStats(client.id)
  const rows: [string, string][] = [
    ['Encuentros verificados', String(s.encounters)],
    ['Calificación de anunciantes', s.average ? `${s.average.toFixed(1)} / 5 (${s.ratings})` : 'Aún sin calificaciones'],
    ['Trato respetuoso', s.respectful === null ? '—' : `${s.respectful} %`],
    ['Pagó lo acordado', s.paidAsAgreed === null ? '—' : `${s.paidAsAgreed} %`],
    ['Puntual', s.punctual === null ? '—' : `${s.punctual} %`],
  ]
  return (
    <div className="container-page max-w-md py-16">
      <div className="card space-y-6 p-8">
        <div className="space-y-2 text-center">
          <ShieldCheck className="mx-auto size-10 text-mint" />
          <p className="eyebrow">Pase de cliente</p>
          <h1 className="display text-4xl">{client.handle}</h1>
          <p className="text-xs text-mute">Miembro desde {monthFormat.format(client.createdAt).toLowerCase()}</p>
        </div>
        <dl className="divide-y divide-white/8 text-sm">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-mute">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>)}
        </dl>
        <p className="text-xs leading-relaxed text-mute">
          Estas cifras provienen de calificaciones que solo pueden dejar anunciantes verificadas tras un encuentro
          confirmado en persona. No revelan con quién ni cuándo.
        </p>
      </div>
    </div>
  )
}

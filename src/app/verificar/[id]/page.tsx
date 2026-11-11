import { BadgeCheck, CircleX } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { monthFormat } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewer } from '@/lib/geo'
import { isHiddenFrom, isPublic } from '@/lib/profiles'

export const metadata: Metadata = { title: 'Sello de encuentro', robots: { index: false } }

export default async function Seal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const enc = await db.encounter.findFirst({
    where: { publicId: id.toUpperCase(), confirmedAt: { not: null } },
    include: { profile: true, review: { select: { id: true } }, clientRating: { select: { id: true } } },
  })
  // El sello no debe delatar perfiles que el visitante no puede ver.
  const visible = enc && isPublic(enc.profile) && !isHiddenFrom(enc.profile, await viewer())

  return (
    <div className="container-page max-w-xl py-16">
      <div className="card space-y-6 p-8">
        {!enc ? (
          <>
            <CircleX className="size-10 text-rose" />
            <h1 className="display text-4xl">Sello no encontrado</h1>
            <p className="text-sm text-mute">No existe un encuentro verificado con el sello <span className="font-mono text-cream">{id.toUpperCase()}</span>. Si lo viste en una reseña fuera de esta plataforma, no es auténtica.</p>
          </>
        ) : (
          <>
            <BadgeCheck className="size-10 text-mint" />
            <div className="space-y-1"><p className="eyebrow">Sello auténtico</p><h1 className="display font-mono text-4xl">{enc.publicId}</h1></div>
            <dl className="divide-y divide-white/8 text-sm">
              {([
                ['Encuentro confirmado', <span key="d" >{monthFormat.format(enc.confirmedAt!)}</span>],
                ['Método', 'Código presencial de un solo uso'],
                ['Perfil', visible ? <Link key="p" href={`/p/${enc.profile.slug}`} className="text-rose hover:underline">{enc.profile.displayName} · {enc.profile.city}</Link> : 'Perfil verificado (no visible)'],
                ['Cliente', 'Cuenta verificada · identidad protegida'],
                ['Reseña del cliente', enc.review ? 'Registrada' : 'Sin reseña'],
                ['Calificación al cliente', enc.clientRating ? 'Registrada' : 'Sin calificación'],
              ] as const).map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-mute">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
            </dl>
          </>
        )}
        <Link href="/verificar" className="btn">Verificar otro sello</Link>
      </div>
    </div>
  )
}

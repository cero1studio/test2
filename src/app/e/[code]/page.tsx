import { BadgeCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { confirmEncounter } from '@/app/actions/public'
import { ActionForm } from '@/components/ActionForm'
import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Confirmar encuentro', robots: { index: false } }

export default async function EncounterPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const user = await getUser()
  const enc = await db.encounter.findUnique({ where: { code: code.toUpperCase().replace(/[^A-Z0-9]/g, '') }, include: { profile: { select: { displayName: true, city: true } } } })
  const valid = enc && !enc.clientId && enc.expiresAt > new Date()

  return (
    <div className="container-page max-w-md py-16">
      <div className="card space-y-6 p-8 text-center">
        <BadgeCheck className="mx-auto size-10 text-mint" />
        {!valid ? (
          <>
            <h1 className="display text-3xl">Código no válido</h1>
            <p className="text-sm text-mute">El código no existe, ya se usó o venció. Los códigos duran 15 minutos: pide uno nuevo.</p>
            <Link href="/panel" className="btn">Ir a mi cuenta</Link>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <p className="eyebrow">Confirmar encuentro</p>
              <h1 className="display text-4xl">{enc.profile.displayName}</h1>
              <p className="text-sm text-mute">{enc.profile.city}</p>
            </div>
            <p className="text-sm leading-relaxed text-mute">
              Confirma solo si estás con esta persona ahora. Quedará registrado un encuentro verificado y ambos
              podrán calificarse. Nadie más verá tu identidad.
            </p>
            {user?.role === 'CLIENT' ? (
              <ActionForm action={confirmEncounter.bind(null, enc.code)} submit="Confirmar encuentro" buttonClass="btn btn-primary w-full" />
            ) : user ? (
              <p className="text-sm text-amber">Solo las cuentas de cliente pueden confirmar encuentros.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href={`/ingresar?next=/e/${enc.code}`} className="btn btn-primary">Ingresar para confirmar</Link>
                <Link href={`/registro?next=/e/${enc.code}`} className="btn">Crear cuenta gratis</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { revealContact } from '@/app/actions/public'

export function ContactReveal({ profileId, name }: { profileId: string; name: string }) {
  const [res, setRes] = useState<{ whatsapp?: string; error?: string }>({})
  const [pending, start] = useTransition()

  if (res.whatsapp) {
    const msg = encodeURIComponent(`Hola ${name}, vi tu perfil verificado en Veraz.`)
    return (
      <div className="space-y-3">
        <a className="btn btn-ok w-full" href={`https://wa.me/${res.whatsapp}?text=${msg}`} target="_blank" rel="noopener noreferrer">
          Escribir por WhatsApp · +{res.whatsapp}
        </a>
        <p className="text-xs text-warn">
          Recuerda: no envíes anticipos, recargas ni «pagos de reserva». Si te lo piden, denuncia el perfil.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <button className="btn btn-primary w-full" disabled={pending} onClick={() => start(async () => setRes(await revealContact(profileId)))}>
        {pending ? 'Cargando…' : 'Ver contacto'}
      </button>
      {res.error && <p role="alert" className="text-sm text-rose">{res.error}</p>}
    </div>
  )
}

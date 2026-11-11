'use client'

import { MessageCircle, ShieldAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { revealContact } from '@/app/actions/public'
import { APP_NAME } from '@/lib/constants'

export function ContactReveal({ profileId, name }: { profileId: string; name: string }) {
  const [res, setRes] = useState<{ whatsapp?: string; error?: string }>({})
  const [pending, start] = useTransition()

  return (
    <AnimatePresence mode="wait" initial={false}>
      {res.whatsapp ? (
        <motion.div key="shown" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <a
            className="btn btn-primary w-full"
            href={`https://wa.me/${res.whatsapp}?text=${encodeURIComponent(`Hola ${name}, vi tu perfil verificado en ${APP_NAME}.`)}`}
            target="_blank" rel="noopener noreferrer"
          >
            <MessageCircle className="size-4" /> WhatsApp · +{res.whatsapp}
          </a>
          <p className="flex gap-2 rounded-2xl border border-amber/20 bg-amber/5 p-3 text-xs text-amber">
            <ShieldAlert className="size-4 shrink-0" />
            No envíes anticipos, recargas ni «pagos de reserva». Si te lo piden, denuncia el perfil.
          </p>
        </motion.div>
      ) : (
        <motion.div key="hidden" exit={{ opacity: 0 }} className="space-y-2">
          <button className="btn btn-primary w-full" disabled={pending} onClick={() => start(async () => setRes(await revealContact(profileId)))}>
            <MessageCircle className="size-4" /> {pending ? 'Cargando…' : 'Ver contacto'}
          </button>
          {res.error && <p role="alert" className="text-sm text-rose">{res.error}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

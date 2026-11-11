import { BadgeCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Verificar un sello de encuentro', alternates: { canonical: '/verificar' } }

async function go(fd: FormData) {
  'use server'
  const id = String(fd.get('id') ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
  redirect(`/verificar/${id.startsWith('ENC-') ? id : `ENC-${id}`}`)
}

export default function Verify() {
  return (
    <div className="container-page max-w-xl py-16">
      <div className="card space-y-6 p-8">
        <BadgeCheck className="size-10 text-mint" />
        <div className="space-y-2">
          <h1 className="display text-4xl">Verifica un <em className="grad-text">sello</em></h1>
          <p className="text-sm leading-relaxed text-mute">
            Cada reseña lleva un sello como <span className="font-mono text-cream">ENC-7K3MQ2X</span>. Escríbelo aquí para
            comprobar que corresponde a un encuentro confirmado en persona. No se revela la identidad de nadie.
          </p>
        </div>
        <form action={go} className="flex flex-col gap-2 sm:flex-row">
          <input name="id" className="input font-mono uppercase" placeholder="ENC-XXXXXXX" required aria-label="Sello de encuentro" />
          <button className="btn btn-primary shrink-0">Verificar</button>
        </form>
      </div>
    </div>
  )
}

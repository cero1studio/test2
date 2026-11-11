'use client'

import { MessageCircle, ShieldAlert } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { revealContact } from '@/app/actions/public'
import { APP_NAME, copFormat } from '@/lib/constants'

type Props = {
  profileId: string; name: string; priceFrom: number
  services: { key: string; label: string }[]
  extras: { label: string; price: number }[]
  incall: boolean; outcall: boolean
}
const WHEN = ['Ahora', 'Hoy más tarde', 'Mañana', 'Otro día']

const pill = 'cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-mute transition select-none hover:border-white/30 has-checked:border-rose has-checked:bg-rose/15 has-checked:text-rose'

/** El cliente arma su solicitud y el mensaje de WhatsApp sale ya escrito: menos ida y vuelta. */
export function ContactBuilder({ profileId, name, priceFrom, services, extras, incall, outcall }: Props) {
  const [svc, setSvc] = useState<string[]>([])
  const [ext, setExt] = useState<number[]>([])
  const [place, setPlace] = useState(incall && !outcall ? 'En su lugar' : outcall && !incall ? 'A domicilio / hotel' : '')
  const [when, setWhen] = useState('')
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [pending, start] = useTransition()
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const extrasTotal = ext.reduce((s, i) => s + extras[i].price, 0)
  const message = useMemo(() => {
    const lines = [`Hola ${name}, vi tu perfil verificado en ${APP_NAME}.`]
    if (svc.length) lines.push(`Me interesa: ${svc.join(', ')}.`)
    if (ext.length) lines.push(`Adicionales: ${ext.map((i) => extras[i].label).join(', ')}.`)
    if (place) lines.push(`Lugar: ${place}.`)
    if (when) lines.push(`Cuándo: ${when}.`)
    lines.push('¿Tienes disponibilidad?')
    return lines.join('\n')
  }, [name, svc, ext, place, when, extras])

  const open = () => start(async () => {
    setError('')
    let number = phone
    if (!number) {
      const res = await revealContact(profileId)
      if (!res.whatsapp) return setError(res.error ?? 'No se pudo obtener el contacto.')
      number = res.whatsapp
      setPhone(number)
    }
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  })

  return (
    <div className="space-y-4">
      {services.length > 0 && (
        <fieldset className="space-y-2"><legend className="label">¿Qué te interesa?</legend>
          <div className="flex flex-wrap gap-1.5">
            {services.map((s) => <label key={s.key} className={pill}><input type="checkbox" className="sr-only" checked={svc.includes(s.label)} onChange={() => setSvc(toggle(svc, s.label))} />{s.label}</label>)}
          </div>
        </fieldset>
      )}
      {extras.length > 0 && (
        <fieldset className="space-y-2"><legend className="label">Adicionales</legend>
          <ul className="space-y-1.5">
            {extras.map((e, i) => (
              <li key={e.label}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/8 px-3 py-2 text-sm transition has-checked:border-rose/60 has-checked:bg-rose/10">
                  <input type="checkbox" className="check" checked={ext.includes(i)} onChange={() => setExt(toggle(ext, i))} />
                  <span className="flex-1">{e.label}</span>
                  <span className="text-xs text-mute tabular-nums">{e.price ? `+ ${copFormat.format(e.price)}` : 'Incluido'}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      {incall && outcall && (
        <fieldset className="space-y-2"><legend className="label">Lugar</legend>
          <div className="flex flex-wrap gap-1.5">
            {['En su lugar', 'A domicilio / hotel'].map((p) => <label key={p} className={pill}><input type="radio" name="place" className="sr-only" checked={place === p} onChange={() => setPlace(p)} />{p}</label>)}
          </div>
        </fieldset>
      )}
      <fieldset className="space-y-2"><legend className="label">¿Cuándo?</legend>
        <div className="flex flex-wrap gap-1.5">
          {WHEN.map((w) => <label key={w} className={pill}><input type="radio" name="when" className="sr-only" checked={when === w} onChange={() => setWhen(w)} />{w}</label>)}
        </div>
      </fieldset>

      {ext.length > 0 && (
        <p className="flex justify-between border-t border-white/8 pt-3 text-sm">
          <span className="text-mute">Estimado (tarifa base + adicionales)</span>
          <strong className="tabular-nums" data-testid="estimate">{copFormat.format(priceFrom + extrasTotal)}</strong>
        </p>
      )}
      <button className="btn btn-primary w-full" disabled={pending} onClick={open}>
        <MessageCircle className="size-4" />{pending ? 'Abriendo…' : phone ? `WhatsApp · +${phone}` : 'Escribir por WhatsApp'}
      </button>
      {error && <p role="alert" className="text-sm text-rose">{error}</p>}
      <details className="text-xs text-mute">
        <summary className="cursor-pointer hover:text-cream">Ver el mensaje que se enviará</summary>
        <p className="mt-2 rounded-xl bg-black/30 p-3 whitespace-pre-line" data-testid="wa-message">{message}</p>
      </details>
      <p className="flex gap-2 rounded-2xl border border-amber/20 bg-amber/5 p-3 text-xs text-amber">
        <ShieldAlert className="size-4 shrink-0" />El pago se acuerda y se hace en persona. No envíes anticipos, recargas ni «reservas»: si te lo piden, denuncia el perfil.
      </p>
    </div>
  )
}

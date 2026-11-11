import type { Metadata } from 'next'
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import { ActionForm } from '@/components/ActionForm'

export const metadata: Metadata = { title: 'Crear cuenta', robots: { index: false } }

export default async function Register({ searchParams }: { searchParams: Promise<{ rol?: string; next?: string }> }) {
  const { rol, next } = await searchParams
  const advertiser = rol === 'anunciante'
  return (
    <div className="container-page max-w-md py-16">
      <div className="card space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="display text-4xl">Crea tu <em className="grad-text">cuenta</em></h1>
          <p className="text-sm text-mute">Para buscar no necesitas ni correo: solo una contraseña. Te damos un alias anónimo y nunca pedimos tu nombre ni tu teléfono.</p>
        </div>
        <ActionForm action={register} submit="Crear cuenta" buttonClass="btn btn-primary w-full">
          {next && <input type="hidden" name="next" value={next} />}
          <fieldset className="grid grid-cols-2 gap-2 text-sm">
            <legend className="label">Quiero</legend>
            {[['CLIENT', 'Buscar', !advertiser], ['ADVERTISER', 'Anunciar', advertiser]].map(([v, l, c]) => (
              <label key={String(v)} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 p-3.5 transition has-checked:border-rose has-checked:bg-rose/10">
                <input type="radio" name="role" value={String(v)} defaultChecked={!!c} className="check" />{l}
              </label>
            ))}
          </fieldset>
          <label className="block"><span className="label">Correo <span className="normal-case">(opcional si solo buscas)</span></span><input name="email" type="email" className="input" autoComplete="email" placeholder="Déjalo vacío para una cuenta anónima" /></label>
          <label className="block"><span className="label">Contraseña (mínimo 10 caracteres)</span><input name="password" type="password" className="input" required minLength={10} autoComplete="new-password" /></label>
          <label className="flex items-start gap-2.5 text-sm text-mute">
            <input type="checkbox" name="adult" required className="check mt-0.5" />
            <span>Soy mayor de 18 años y acepto los <Link href="/legal/terminos" className="text-rose hover:underline">términos</Link> y el <Link href="/legal/privacidad" className="text-rose hover:underline">tratamiento de datos</Link>.</span>
          </label>
        </ActionForm>
        <p className="text-sm text-mute">¿Ya tienes cuenta? <Link href="/ingresar" className="text-rose hover:underline">Ingresa</Link>.</p>
      </div>
    </div>
  )
}

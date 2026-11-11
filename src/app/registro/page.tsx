import type { Metadata } from 'next'
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import { ActionForm } from '@/components/ActionForm'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default async function Register({ searchParams }: { searchParams: Promise<{ rol?: string }> }) {
  const advertiser = (await searchParams).rol === 'anunciante'
  return (
    <div className="container-page max-w-md py-12">
      <div className="card space-y-5">
        <h1 className="text-2xl font-black">Crear cuenta</h1>
        <ActionForm action={register} submit="Crear cuenta">
          <fieldset className="grid grid-cols-2 gap-2 text-sm">
            <legend className="label">Tipo de cuenta</legend>
            <label className="flex items-center gap-2 rounded-xl border border-line p-3">
              <input type="radio" name="role" value="CLIENT" defaultChecked={!advertiser} className="accent-rose" /> Cliente
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-line p-3">
              <input type="radio" name="role" value="ADVERTISER" defaultChecked={advertiser} className="accent-rose" /> Anunciante
            </label>
          </fieldset>
          <label className="block"><span className="label">Correo</span>
            <input name="email" type="email" className="input" required autoComplete="email" />
          </label>
          <label className="block"><span className="label">Contraseña (mínimo 10 caracteres)</span>
            <input name="password" type="password" className="input" required minLength={10} autoComplete="new-password" />
          </label>
          <label className="flex items-start gap-2 text-sm text-mute">
            <input type="checkbox" name="adult" required className="mt-1 accent-rose" />
            Declaro que soy mayor de 18 años y acepto las reglas de la comunidad.
          </label>
        </ActionForm>
        <p className="text-sm text-mute">¿Ya tienes cuenta? <Link href="/ingresar" className="text-rose underline">Ingresa</Link>.</p>
      </div>
    </div>
  )
}

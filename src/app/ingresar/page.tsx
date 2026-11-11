import type { Metadata } from 'next'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { ActionForm } from '@/components/ActionForm'

export const metadata: Metadata = { title: 'Ingresar' }

export default function Login() {
  return (
    <div className="container-page max-w-md py-12">
      <div className="card space-y-5">
        <h1 className="text-2xl font-black">Ingresar</h1>
        <ActionForm action={login} submit="Ingresar">
          <label className="block"><span className="label">Correo</span>
            <input name="email" type="email" className="input" required autoComplete="email" />
          </label>
          <label className="block"><span className="label">Contraseña</span>
            <input name="password" type="password" className="input" required autoComplete="current-password" />
          </label>
        </ActionForm>
        <p className="text-sm text-mute">¿No tienes cuenta? <Link href="/registro" className="text-rose underline">Créala aquí</Link>.</p>
      </div>
    </div>
  )
}

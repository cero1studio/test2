import type { Metadata } from 'next'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { ActionForm } from '@/components/ActionForm'

export const metadata: Metadata = { title: 'Ingresar', robots: { index: false } }

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <div className="container-page max-w-md py-16">
      <div className="card space-y-6 p-8">
        <h1 className="display text-4xl">Bienvenida, <em className="grad-text">bienvenido</em></h1>
        <ActionForm action={login} submit="Ingresar" buttonClass="btn btn-primary w-full">
          {next && <input type="hidden" name="next" value={next} />}
          <label className="block"><span className="label">Correo o alias</span><input name="email" className="input" required autoComplete="username" placeholder="tu@correo.com o cliente-ab12cd" /></label>
          <label className="block"><span className="label">Contraseña</span><input name="password" type="password" className="input" required autoComplete="current-password" /></label>
        </ActionForm>
        <p className="text-sm text-mute">¿No tienes cuenta? <Link href={`/registro${next ? `?next=${next}` : ''}`} className="text-rose hover:underline">Créala aquí</Link>.</p>
      </div>
    </div>
  )
}

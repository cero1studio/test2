import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { AgeGate } from '@/components/AgeGate'
import { getUser } from '@/lib/auth'
import { APP_NAME } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · Perfiles verificados, cero estafas`, template: `%s · ${APP_NAME}` },
  description: 'Anuncios para adultos con identidad verificada, fotos reales y reseñas de encuentros comprobados.',
  other: { rating: 'adult' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const adult = (await cookies()).get('adulto')?.value === '1'
  const user = adult ? await getUser() : null
  return (
    <html lang="es">
      <body>
        {!adult ? <AgeGate /> : (
          <div className="flex min-h-dvh flex-col">
            <header className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur">
              <nav className="container-page flex h-14 items-center gap-4 text-sm">
                <Link href="/" className="text-xl font-black">{APP_NAME}<span className="text-rose">.</span></Link>
                <Link href="/explorar" className="text-mute hover:text-white">Explorar</Link>
                <Link href="/seguridad" className="text-mute hover:text-white">Seguridad</Link>
                <span className="flex-1" />
                {user ? (
                  <>
                    {user.role === 'ADMIN' && <Link href="/admin" className="text-mute hover:text-white">Moderación</Link>}
                    <Link href="/panel" className="btn">Mi panel</Link>
                    <form action={logout}><button className="cursor-pointer text-mute hover:text-white">Salir</button></form>
                  </>
                ) : (
                  <>
                    <Link href="/ingresar" className="text-mute hover:text-white">Ingresar</Link>
                    <Link href="/registro" className="btn btn-primary">Crear cuenta</Link>
                  </>
                )}
              </nav>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-16 border-t border-line py-8 text-xs text-mute">
              <div className="container-page space-y-2">
                <p>
                  {APP_NAME} es una plataforma de anuncios entre adultos. Solo se publican personas mayores de 18
                  años con identidad verificada que anuncian de forma voluntaria e independiente.
                </p>
                <p>
                  Cero tolerancia a la explotación sexual y a la trata de personas.{' '}
                  <Link href="/seguridad#denunciar" className="text-rose underline">Cómo denunciar</Link>.
                </p>
              </div>
            </footer>
          </div>
        )}
      </body>
    </html>
  )
}

import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/fraunces/opsz-italic.css'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { AgeGate } from '@/components/AgeGate'
import { MobileNav } from '@/components/MobileNav'
import { MotionProvider } from '@/components/motion'
import { Logo } from '@/components/ui'
import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { APP_NAME, SITE_URL, TAGLINE } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${APP_NAME} · ${TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: 'Perfiles con identidad verificada, fotos reales y reseñas de encuentros comprobados. Privacidad para quien anuncia, seguridad para quien busca.',
  other: { rating: 'adult' },
}
export const viewport: Viewport = { themeColor: '#0b0a0e' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const adult = (await cookies()).get('adulto')?.value === '1'
  const user = await getUser()
  // Avisos en la cuenta: favoritas disponibles y solicitudes aceptadas (cliente); solicitudes por responder (anunciante).
  const now = new Date()
  const alerts = !user ? 0
    : user.role === 'CLIENT'
      ? (await db.favorite.count({ where: { userId: user.id, profile: { status: 'ACTIVE', availableUntil: { gt: now } } } }))
        + (await db.contactRequest.count({ where: { clientId: user.id, status: 'ACCEPTED', decidedAt: { gt: new Date(now.getTime() - 864e5) } } }))
      : user.role === 'ADVERTISER'
        ? await db.contactRequest.count({ where: { profile: { userId: user.id }, status: 'PENDING', createdAt: { gt: new Date(now.getTime() - 864e5) } } })
        : 0
  return (
    <html lang="es" className={GeistSans.variable}>
      <body>
        <MotionProvider>
          {!adult && <AgeGate />}
          {(
            <div className="flex min-h-dvh flex-col pb-16 md:pb-0" inert={!adult}>
              <header className="sticky top-0 z-20 border-b border-white/6 bg-bg/70 backdrop-blur-xl">
                <nav className="container-page flex h-16 items-center gap-7 text-sm">
                  <Link href="/" aria-label={`${APP_NAME}, inicio`}><Logo /></Link>
                  <div className="hidden items-center gap-6 text-mute md:flex">
                    <Link href="/explorar" className="transition hover:text-cream">Explorar</Link>
                    <Link href="/verificar" className="transition hover:text-cream">Verificar un sello</Link>
                    <Link href="/seguridad" className="transition hover:text-cream">Seguridad</Link>
                  </div>
                  <span className="flex-1" />
                  {user ? (
                    <>
                      {user.role === 'ADMIN' && <Link href="/admin" className="text-mute transition hover:text-cream">Moderación</Link>}
                      <Link href="/panel" className="btn btn-sm">Mi cuenta{alerts > 0 && <span className="grid size-5 place-items-center rounded-full bg-rose text-[0.65rem] font-bold text-bg" aria-label={`${alerts} avisos`}>{alerts}</span>}</Link>
                      <form action={logout}><button className="cursor-pointer text-mute transition hover:text-cream">Salir</button></form>
                    </>
                  ) : (
                    <>
                      <Link href="/ingresar" className="text-mute transition hover:text-cream">Ingresar</Link>
                      <Link href="/registro" className="btn btn-primary btn-sm">Crear cuenta</Link>
                    </>
                  )}
                </nav>
              </header>
              <main className="flex-1">{children}</main>
              <footer className="mt-24 border-t border-white/6 py-10 text-xs text-mute">
                <div className="container-page grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
                  <div className="space-y-3">
                    <Logo />
                    <p className="max-w-sm leading-relaxed">
                      Plataforma de anuncios entre adultos. Solo se publican personas mayores de 18 años con
                      identidad verificada, que anuncian de forma voluntaria e independiente. {APP_NAME} no
                      intermedia ni cobra por los encuentros.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    <li className="font-semibold text-cream">Plataforma</li>
                    <li><Link href="/explorar" className="hover:text-cream">Explorar perfiles</Link></li>
                    <li><Link href="/verificar" className="hover:text-cream">Verificar un sello</Link></li>
                    <li><Link href="/registro?rol=anunciante" className="hover:text-cream">Publicar mi perfil</Link></li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="font-semibold text-cream">Legal y seguridad</li>
                    <li><Link href="/seguridad" className="hover:text-cream">Seguridad y reglas</Link></li>
                    <li><Link href="/legal/terminos" className="hover:text-cream">Términos y condiciones</Link></li>
                    <li><Link href="/legal/privacidad" className="hover:text-cream">Tratamiento de datos</Link></li>
                    <li><Link href="/seguridad#denunciar" className="text-rose hover:underline">Denunciar explotación o trata</Link></li>
                  </ul>
                </div>
              </footer>
              <MobileNav />
            </div>
          )}
        </MotionProvider>
      </body>
    </html>
  )
}

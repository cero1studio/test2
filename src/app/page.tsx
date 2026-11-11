import Link from 'next/link'
import { ProfileCard } from '@/components/ProfileCard'
import { CITIES } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewerRegion } from '@/lib/geo'
import { cardInclude, trustOf, visibleWhere } from '@/lib/profiles'

const PROMISES = [
  ['Identidad verificada', 'Nadie publica sin validar su documento y una selfie con un código único. Todas las personas son mayores de edad comprobadas.'],
  ['Fotos reales', 'Moderación compara cada foto con la selfie de verificación. Si no es la misma persona, la foto no sale.'],
  ['Reseñas de encuentros reales', 'Solo puede reseñar quien recibió un código de un solo uso al terminar el encuentro. No hay reseñas inventadas.'],
  ['Cero anticipos', 'Pedir depósitos por adelantado está prohibido. Una denuncia confirmada suspende el perfil.'],
] as const

export default async function Home() {
  const profiles = await db.profile.findMany({ where: visibleWhere(await viewerRegion()), include: cardInclude, take: 100 })
  const top = profiles.map((p) => ({ p, s: trustOf(p).score })).sort((a, b) => b.s - a.s).slice(0, 8)

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-panel to-ink">
        <div className="container-page space-y-6 py-14 md:py-20">
          <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
            La persona de las fotos es la que llega. <span className="text-rose">Sin estafas, sin anticipos.</span>
          </h1>
          <p className="max-w-2xl text-lg text-mute">
            Cada perfil pasa verificación de identidad y de fotos, y las reseñas solo las escriben clientes de
            encuentros comprobados.
          </p>
          <form action="/explorar" className="flex max-w-xl flex-col gap-2 sm:flex-row">
            <select name="ciudad" className="input" aria-label="Ciudad" defaultValue="">
              <option value="">Todas las ciudades</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary shrink-0">Buscar perfiles verificados</button>
          </form>
        </div>
      </section>

      <section className="container-page grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {PROMISES.map(([title, text]) => (
          <div key={title} className="card space-y-2">
            <h2 className="font-bold text-ok">✓ {title}</h2>
            <p className="text-sm text-mute">{text}</p>
          </div>
        ))}
      </section>

      <section className="container-page space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">Perfiles con mayor confianza</h2>
          <Link href="/explorar" className="text-sm text-rose">Ver todos →</Link>
        </div>
        {top.length === 0 ? (
          <p className="card text-mute">Aún no hay perfiles publicados.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{top.map(({ p }) => <ProfileCard key={p.id} p={p} />)}</div>
        )}
      </section>

      <section className="container-page mt-12">
        <div className="card flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="h-section">¿Anuncias de forma independiente?</h2>
            <p className="text-sm text-mute">Verifícate una vez y destaca por confianza, no por pagar más. Tus documentos se eliminan al terminar la revisión.</p>
          </div>
          <Link href="/registro?rol=anunciante" className="btn btn-primary shrink-0">Publicar mi perfil</Link>
        </div>
      </section>
    </>
  )
}

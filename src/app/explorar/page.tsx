import type { Metadata } from 'next'
import { ProfileCard } from '@/components/ProfileCard'
import { CATEGORIES, CITIES } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewerRegion } from '@/lib/geo'
import { cardInclude, trustOf, visibleWhere } from '@/lib/profiles'

export const metadata: Metadata = { title: 'Explorar perfiles verificados' }

type Search = { ciudad?: string; categoria?: string; fotos?: string; max?: string; orden?: string }

export default async function Explore({ searchParams }: { searchParams: Promise<Search> }) {
  const q = await searchParams
  const max = Number(q.max) || undefined
  const profiles = await db.profile.findMany({
    where: {
      ...visibleWhere(await viewerRegion()),
      ...(CITIES.includes(q.ciudad as never) && { city: q.ciudad }),
      ...(CATEGORIES.includes(q.categoria as never) && { category: q.categoria }),
      ...(q.fotos === '1' && { photosVerifiedAt: { not: null } }),
      ...(max && { priceFrom: { lte: max } }),
    },
    include: cardInclude,
    take: 300,
  })
  const sorted = profiles
    .map((p) => ({ p, s: trustOf(p).score }))
    .sort((a, b) => (q.orden === 'precio' ? a.p.priceFrom - b.p.priceFrom : b.s - a.s))

  return (
    <div className="container-page space-y-6 py-8">
      <h1 className="text-3xl font-black">Explorar</h1>
      <form className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <label><span className="label">Ciudad</span>
          <select name="ciudad" className="input" defaultValue={q.ciudad ?? ''}>
            <option value="">Todas</option>{CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label><span className="label">Categoría</span>
          <select name="categoria" className="input" defaultValue={q.categoria ?? ''}>
            <option value="">Todas</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label><span className="label">Tarifa máxima (COP)</span>
          <input name="max" type="number" min={0} step={10000} className="input" defaultValue={q.max ?? ''} placeholder="Sin límite" />
        </label>
        <label><span className="label">Ordenar por</span>
          <select name="orden" className="input" defaultValue={q.orden ?? ''}>
            <option value="">Mayor confianza</option><option value="precio">Menor tarifa</option>
          </select>
        </label>
        <label className="flex items-center gap-2 py-2 text-sm">
          <input type="checkbox" name="fotos" value="1" defaultChecked={q.fotos === '1'} className="accent-rose" />
          Solo fotos verificadas
        </label>
        <button className="btn btn-primary">Filtrar</button>
      </form>

      <p className="text-sm text-mute">
        {sorted.length} {sorted.length === 1 ? 'perfil' : 'perfiles'} · todos con identidad y mayoría de edad verificadas
      </p>
      {sorted.length === 0 ? (
        <p className="card text-mute">No hay perfiles con esos filtros. Prueba ampliando la búsqueda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map(({ p }) => <ProfileCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}

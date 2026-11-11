import { ProfileCard } from '@/components/ProfileCard'
import { Stagger, StaggerItem } from '@/components/motion'
import { getUser } from '@/lib/auth'
import { isAvailableNow } from '@/lib/availability'
import { CATEGORIES, CITIES } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewerRegion } from '@/lib/geo'
import { cardInclude, trustOf, visibleWhere } from '@/lib/profiles'

export type ListingQuery = { ciudad?: string; categoria?: string; fotos?: string; ahora?: string; max?: string; orden?: string }

export async function Listing({ q, fixedCity, action }: { q: ListingQuery; fixedCity?: string; action: string }) {
  const city = fixedCity ?? q.ciudad
  const max = Number(q.max) || undefined
  const [profiles, user] = await Promise.all([
    db.profile.findMany({
      where: {
        ...visibleWhere(await viewerRegion()),
        ...(CITIES.includes(city as never) && { city }),
        ...(CATEGORIES.includes(q.categoria as never) && { category: q.categoria }),
        ...(q.fotos === '1' && { photosVerifiedAt: { not: null } }),
        ...(q.ahora === '1' && { availableUntil: { gt: new Date() } }),
        ...(max && { priceFrom: { lte: max } }),
      },
      include: cardInclude(),
      take: 300,
    }),
    getUser(),
  ])
  // Primero quien está disponible ahora; dentro de cada grupo, por confianza.
  const sorted = profiles
    .map((p) => ({ p, s: trustOf(p).score, a: Number(isAvailableNow(p)) }))
    .sort((x, y) => (q.orden === 'precio' ? x.p.priceFrom - y.p.priceFrom : y.a - x.a || y.s - x.s))
  const live = sorted.filter((x) => x.a).length

  return (
    <div className="space-y-6">
      <form action={action} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto] lg:items-end">
        {!fixedCity && (
          <label><span className="label">Ciudad</span>
            <select name="ciudad" className="input" defaultValue={q.ciudad ?? ''}>
              <option value="">Todas</option>{CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        )}
        <label><span className="label">Categoría</span>
          <select name="categoria" className="input" defaultValue={q.categoria ?? ''}>
            <option value="">Todas</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label><span className="label">Tarifa máxima</span>
          <input name="max" type="number" min={0} step={10000} className="input" defaultValue={q.max ?? ''} placeholder="Sin límite" />
        </label>
        <label><span className="label">Ordenar</span>
          <select name="orden" className="input" defaultValue={q.orden ?? ''}>
            <option value="">Disponibles y confianza</option><option value="precio">Menor tarifa</option>
          </select>
        </label>
        <button className="btn btn-primary">Filtrar</button>
        <div className="col-span-full flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" name="ahora" value="1" defaultChecked={q.ahora === '1'} className="check" />Disponibles ahora</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" name="fotos" value="1" defaultChecked={q.fotos === '1'} className="check" />Solo fotos verificadas</label>
        </div>
      </form>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mute">
        <span>{sorted.length} {sorted.length === 1 ? 'perfil verificado' : 'perfiles verificados'}</span>
        <span className="flex items-center gap-2 text-mint"><span className="dot-live" />{live} {live === 1 ? 'disponible' : 'disponibles'} ahora</span>
      </p>
      {sorted.length === 0 ? (
        <p className="card text-mute">No hay perfiles con esos filtros. Prueba ampliando la búsqueda.</p>
      ) : (
        <Stagger className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map(({ p }) => <StaggerItem key={p.id}><ProfileCard p={p} member={!!user} /></StaggerItem>)}
        </Stagger>
      )}
    </div>
  )
}

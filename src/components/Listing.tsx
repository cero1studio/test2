import { Search } from 'lucide-react'
import { FilterForm } from '@/components/FilterForm'
import { ProfileCard } from '@/components/ProfileCard'
import { Stagger, StaggerItem } from '@/components/motion'
import { getUser } from '@/lib/auth'
import { isAvailableNow } from '@/lib/availability'
import { CATEGORIES, CITIES } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewer } from '@/lib/geo'
import { cardInclude, trustOf, visibleWhere } from '@/lib/profiles'
import { SERVICES } from '@/lib/services'

export type ListingQuery = {
  q?: string; ciudad?: string; categoria?: string; servicio?: string; lugar?: string; edad?: string; max?: string
  fotos?: string; ahora?: string; indep?: string; orden?: string
}

const AGES: Record<string, [number, number]> = { '18-24': [18, 24], '25-29': [25, 29], '30-39': [30, 39], '40+': [40, 99] }
const Pill = ({ name, label, on }: { name: string; label: string; on: boolean }) => (
  <label className="cursor-pointer rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-medium text-mute transition select-none hover:border-white/30 has-checked:border-rose has-checked:bg-rose/15 has-checked:text-rose">
    <input type="checkbox" name={name} value="1" defaultChecked={on} className="sr-only" />{label}
  </label>
)

export async function Listing({ q, fixedCity, action }: { q: ListingQuery; fixedCity?: string; action: string }) {
  const city = fixedCity ?? q.ciudad
  const max = Number(q.max) || undefined
  const age = AGES[q.edad ?? '']
  const text = q.q?.trim().slice(0, 60)
  const [profiles, user] = await Promise.all([
    db.profile.findMany({
      where: {
        ...visibleWhere(await viewer()),
        ...(CITIES.includes(city as never) && { city }),
        ...(CATEGORIES.includes(q.categoria as never) && { category: q.categoria }),
        ...(SERVICES.some((s) => s.key === q.servicio) && { services: { contains: `,${q.servicio},` } }),
        ...(q.lugar === 'propio' && { incall: true }),
        ...(q.lugar === 'domicilio' && { outcall: true }),
        ...(age && { age: { gte: age[0], lte: age[1] } }),
        ...(q.fotos === '1' && { photosVerifiedAt: { not: null } }),
        ...(q.ahora === '1' && { availableUntil: { gt: new Date() } }),
        ...(q.indep === '1' && { kind: 'INDEPENDENT' }),
        ...(max && { priceFrom: { lte: max } }),
        ...(text && { AND: [{ OR: [{ displayName: { contains: text } }, { zone: { contains: text } }, { description: { contains: text } }] }] }),
      },
      include: cardInclude(),
      take: 300,
    }),
    getUser(),
  ])
  // Primero quien está disponible ahora; dentro de cada grupo, por confianza.
  const sorted = profiles
    .map((p) => ({ p, s: trustOf(p).score, a: Number(isAvailableNow(p)) }))
    .sort((x, y) => (q.orden === 'precio' ? x.p.priceFrom - y.p.priceFrom : q.orden === 'resenas' ? y.p.reviews.length - x.p.reviews.length : y.a - x.a || y.s - x.s))
  const live = sorted.filter((x) => x.a).length
  const filtered = Object.entries(q).some(([k, v]) => v && k !== 'orden')

  return (
    <div className="space-y-6">
      <FilterForm action={action} className="card space-y-4 p-4 sm:p-5">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mute" />
            <input name="q" defaultValue={q.q ?? ''} className="input pl-11" placeholder="Busca por nombre, zona o palabra clave" aria-label="Buscar" />
          </label>
          <button className="btn btn-primary shrink-0">Buscar</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill name="ahora" label="● Disponibles ahora" on={q.ahora === '1'} />
          <Pill name="fotos" label="Fotos verificadas" on={q.fotos === '1'} />
          <Pill name="indep" label="Solo independientes" on={q.indep === '1'} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {!fixedCity && (
            <label><span className="label">Ciudad</span>
              <select name="ciudad" className="input" defaultValue={q.ciudad ?? ''}><option value="">Todas</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
          )}
          <label><span className="label">Categoría</span>
            <select name="categoria" className="input" defaultValue={q.categoria ?? ''}><option value="">Todas</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label><span className="label">Servicio</span>
            <select name="servicio" className="input" defaultValue={q.servicio ?? ''}><option value="">Cualquiera</option>{SERVICES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          </label>
          <label><span className="label">Lugar</span>
            <select name="lugar" className="input" defaultValue={q.lugar ?? ''}><option value="">Cualquiera</option><option value="propio">Tiene lugar</option><option value="domicilio">Va a domicilio / hotel</option></select>
          </label>
          <label><span className="label">Edad</span>
            <select name="edad" className="input" defaultValue={q.edad ?? ''}><option value="">Todas</option>{Object.keys(AGES).map((a) => <option key={a}>{a}</option>)}</select>
          </label>
          <label><span className="label">Tarifa máxima</span>
            <select name="max" className="input" defaultValue={q.max ?? ''}>
              <option value="">Sin límite</option>{[150000, 200000, 300000, 500000].map((v) => <option key={v} value={v}>Hasta ${v / 1000} mil</option>)}
            </select>
          </label>
          <label><span className="label">Ordenar</span>
            <select name="orden" className="input" defaultValue={q.orden ?? ''}><option value="">Disponibles y confianza</option><option value="precio">Menor tarifa</option><option value="resenas">Más reseñas</option></select>
          </label>
        </div>
      </FilterForm>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mute">
        <span>{sorted.length} {sorted.length === 1 ? 'perfil verificado' : 'perfiles verificados'}</span>
        <span className="flex items-center gap-2 text-mint"><span className="dot-live" />{live} {live === 1 ? 'disponible' : 'disponibles'} ahora</span>
        {filtered && <a href={action} className="text-rose hover:underline">Quitar filtros</a>}
      </p>
      {sorted.length === 0 ? (
        <p className="card text-mute">No hay perfiles con esos filtros. Prueba quitando alguno.</p>
      ) : (
        <Stagger className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map(({ p }) => <StaggerItem key={p.id}><ProfileCard p={p} member={!!user} /></StaggerItem>)}
        </Stagger>
      )}
    </div>
  )
}

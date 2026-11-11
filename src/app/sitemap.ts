import type { MetadataRoute } from 'next'
import { CITIES, citySlug, SITE_URL } from '@/lib/constants'
import { db } from '@/lib/db'
import { LANDINGS } from '@/lib/landing'
import { publicWhere } from '@/lib/profiles'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Privacidad primero: los perfiles discretos o con regiones bloqueadas no se envían a buscadores.
  const profiles = await db.profile.findMany({
    where: { ...publicWhere, discreet: false, blockedRegions: '' },
    select: { slug: true, updatedAt: true, city: true, category: true, tags: true, services: true },
  })
  // Solo las combinaciones ciudad + palabra clave que tienen al menos un perfil.
  const combos = CITIES.flatMap((c) =>
    LANDINGS.filter((l) => profiles.some((p) => p.city === c
      && (!l.fixed.category || p.category === l.fixed.category)
      && (!l.fixed.tag || p.tags.includes(`,${l.fixed.tag},`))
      && (!l.fixed.service || p.services.includes(`,${l.fixed.service},`)))).map((l) => `${SITE_URL}/prepagos/${citySlug(c)}/${l.slug}`))
  return [
    ...['', '/explorar', '/seguridad', '/verificar'].map((p) => ({ url: `${SITE_URL}${p}` })),
    ...CITIES.map((c) => ({ url: `${SITE_URL}/prepagos/${citySlug(c)}`, changeFrequency: 'hourly' as const })),
    ...combos.map((url) => ({ url, changeFrequency: 'daily' as const })),
    ...profiles.map((p) => ({ url: `${SITE_URL}/p/${p.slug}`, lastModified: p.updatedAt })),
  ]
}

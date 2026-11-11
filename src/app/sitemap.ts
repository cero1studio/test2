import type { MetadataRoute } from 'next'
import { CITIES, citySlug, SITE_URL } from '@/lib/constants'
import { db } from '@/lib/db'
import { publicWhere } from '@/lib/profiles'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Privacidad primero: los perfiles discretos o con regiones bloqueadas no se envían a buscadores.
  const profiles = await db.profile.findMany({
    where: { ...publicWhere, discreet: false, blockedRegions: '' },
    select: { slug: true, updatedAt: true },
  })
  return [
    ...['', '/explorar', '/seguridad', '/verificar'].map((p) => ({ url: `${SITE_URL}${p}` })),
    ...CITIES.map((c) => ({ url: `${SITE_URL}/prepagos/${citySlug(c)}`, changeFrequency: 'hourly' as const })),
    ...profiles.map((p) => ({ url: `${SITE_URL}/p/${p.slug}`, lastModified: p.updatedAt })),
  ]
}

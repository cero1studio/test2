import { isAvailableNow } from '@/lib/availability'
import { db } from '@/lib/db'
import { viewer } from '@/lib/geo'
import { visibleWhere } from '@/lib/profiles'
import { Stories } from './Stories'

export async function StoriesBar({ city }: { city?: string }) {
  const now = new Date()
  const profiles = await db.profile.findMany({
    where: {
      ...visibleWhere(await viewer()),
      ...(city && { city }),
      photos: { some: { kind: 'STORY', status: 'APPROVED', expiresAt: { gt: now } } },
    },
    include: { photos: { where: { kind: 'STORY', status: 'APPROVED', expiresAt: { gt: now } }, orderBy: { createdAt: 'asc' } } },
    take: 30,
  })
  const groups = profiles
    .map((p) => ({ slug: p.slug, name: p.displayName, city: p.city, live: isAvailableNow(p), photoIds: p.photos.map((ph) => ph.id) }))
    .sort((a, b) => Number(b.live) - Number(a.live))
  return <Stories groups={groups} />
}

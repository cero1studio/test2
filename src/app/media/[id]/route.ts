import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { viewerRegion } from '@/lib/geo'
import { isBlockedIn, isPublic } from '@/lib/profiles'
import { imageResponse, readImage } from '@/lib/storage'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photo = await db.photo.findUnique({ where: { id }, include: { profile: true } })
  if (!photo) return imageResponse(null)
  if (!(photo.status === 'APPROVED' && isPublic(photo.profile)) || isBlockedIn(photo.profile, await viewerRegion())) {
    const user = await getUser()
    if (!user || (user.role !== 'ADMIN' && user.id !== photo.profile.userId)) return imageResponse(null)
  }
  return imageResponse(await readImage(photo.file))
}

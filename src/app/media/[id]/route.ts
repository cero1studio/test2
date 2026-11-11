import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { viewerRegion } from '@/lib/geo'
import { isBlockedIn, isPublic } from '@/lib/profiles'
import { imageResponse, readImage } from '@/lib/storage'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photo = await db.photo.findUnique({ where: { id }, include: { profile: true } })
  if (!photo) return imageResponse(null)
  const user = await getUser()
  const privileged = user?.role === 'ADMIN' || user?.id === photo.profile.userId
  if (!privileged) {
    const open = photo.status === 'APPROVED' && isPublic(photo.profile) && !isBlockedIn(photo.profile, await viewerRegion())
    if (!open) return imageResponse(null)
  }
  // Modo discreto: sin cuenta solo se entrega la versión difuminada. El
  // difuminado está en el archivo, no en CSS: no se puede "quitar" desde el navegador.
  const blurred = photo.profile.discreet && !user
  return imageResponse(await readImage(blurred ? photo.blurFile : photo.file), 'private, no-store')
}

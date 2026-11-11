import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { imageResponse, readImage } from '@/lib/storage'

// Documentos y selfies de verificación: solo moderación puede verlos.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (user?.role !== 'ADMIN') return imageResponse(null)
  const { id } = await params
  const v = await db.verification.findUnique({ where: { id } })
  const file = new URL(req.url).searchParams.get('t') === 'doc' ? v?.docFile : v?.selfieFile
  return imageResponse(file ? await readImage(file) : null, 'no-store')
}

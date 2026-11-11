import { mkdir, readFile, unlink } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'

// Los archivos viven fuera de /public: solo se sirven a través de rutas que
// comprueban permisos (ver app/media y app/admin/archivo).
const dir = () => path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? './storage')

const MAX_BYTES = 8 * 1024 * 1024

/** Re-codifica a WebP. Esto elimina EXIF (incluida la geolocalización). */
export async function saveImage(file: unknown): Promise<string> {
  if (!(file instanceof File) || file.size === 0) throw new Error('Selecciona una imagen.')
  if (file.size > MAX_BYTES) throw new Error('La imagen supera 8 MB.')
  await mkdir(dir(), { recursive: true })
  const name = `${randomBytes(16).toString('hex')}.webp`
  try {
    await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(/* turbopackIgnore: true */ dir(), name))
  } catch {
    throw new Error('El archivo no es una imagen válida.')
  }
  return name
}

export async function saveBuffer(buf: Buffer): Promise<string> {
  await mkdir(dir(), { recursive: true })
  const name = `${randomBytes(16).toString('hex')}.webp`
  await sharp(buf).webp({ quality: 82 }).toFile(path.join(/* turbopackIgnore: true */ dir(), name))
  return name
}

const safe = (name: string) => /^[a-f0-9]{32}\.webp$/.test(name)

export async function readImage(name: string): Promise<Buffer | null> {
  if (!safe(name)) return null
  return readFile(path.join(/* turbopackIgnore: true */ dir(), name)).catch(() => null)
}

export async function deleteImage(name: string | null | undefined) {
  if (name && safe(name)) await unlink(path.join(/* turbopackIgnore: true */ dir(), name)).catch(() => {})
}

export function imageResponse(buf: Buffer | null, cache = 'private, max-age=300') {
  if (!buf) return new Response('No encontrado', { status: 404 })
  return new Response(new Uint8Array(buf), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': cache },
  })
}

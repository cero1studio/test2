import { mkdir, readFile, unlink } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
import { APP_NAME } from './constants'
import { photoHash } from './scam'

// Los archivos viven fuera de /public: solo se sirven a través de rutas que
// comprueban permisos (ver app/media y app/admin/archivo).
const dir = () => path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? './storage')
const newName = () => `${randomBytes(16).toString('hex')}.webp`
const target = (name: string) => path.join(/* turbopackIgnore: true */ dir(), name)

const MAX_BYTES = 8 * 1024 * 1024

async function toBuffer(file: unknown): Promise<Buffer> {
  if (!(file instanceof File) || file.size === 0) throw new Error('Selecciona una imagen.')
  if (file.size > MAX_BYTES) throw new Error('La imagen supera 8 MB.')
  return Buffer.from(await file.arrayBuffer())
}

// Re-codificar a WebP elimina EXIF (incluida la geolocalización).
const normalize = (buf: Buffer) =>
  sharp(buf).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })

// Marca de agua en mosaico: desalienta que roben las fotos para perfiles falsos.
const watermark = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="200">
    <text x="130" y="100" transform="rotate(-28 130 100)" text-anchor="middle" font-family="sans-serif"
      font-size="22" font-weight="700" fill="white" fill-opacity="0.13">${APP_NAME.toLowerCase()}</text></svg>`,
)

async function run<T>(job: () => Promise<T>): Promise<T> {
  await mkdir(dir(), { recursive: true })
  try {
    return await job()
  } catch {
    throw new Error('El archivo no es una imagen válida.')
  }
}

/** Documento o selfie de verificación: sin marca de agua. */
export async function saveImage(file: unknown): Promise<string> {
  const buf = await toBuffer(file)
  return run(async () => {
    const name = newName()
    await normalize(buf).webp({ quality: 82 }).toFile(target(name))
    return name
  })
}

/** Foto de perfil: versión nítida con marca de agua + versión difuminada en servidor. */
export async function savePhoto(input: unknown | Buffer): Promise<{ file: string; blurFile: string; hash: string }> {
  const buf = Buffer.isBuffer(input) ? input : await toBuffer(input)
  return run(async () => {
    const file = newName()
    const blurFile = newName()
    const clean = await normalize(buf).toBuffer()
    await sharp(clean).composite([{ input: watermark, tile: true }]).webp({ quality: 82 }).toFile(target(file))
    await sharp(clean).resize({ width: 480, withoutEnlargement: true }).blur(26).webp({ quality: 60 }).toFile(target(blurFile))
    return { file, blurFile, hash: await photoHash(clean) }
  })
}

const safe = (name: string) => /^[a-f0-9]{32}\.webp$/.test(name)

export async function readImage(name: string): Promise<Buffer | null> {
  if (!safe(name)) return null
  return readFile(target(name)).catch(() => null)
}

export async function deleteImage(...names: (string | null | undefined)[]) {
  await Promise.all(names.map((n) => (n && safe(n) ? unlink(target(n)).catch(() => {}) : null)))
}

export function imageResponse(buf: Buffer | null, cache = 'private, max-age=300') {
  if (!buf) return new Response('No encontrado', { status: 404 })
  return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': cache, Vary: 'Cookie' } })
}

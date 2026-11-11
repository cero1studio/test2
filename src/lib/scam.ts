import sharp from 'sharp'

// Señales automáticas de estafa. Ninguna sanciona sola: bloquean lo obvio al
// publicar y le dan contexto a moderación.

const DEPOSIT = /\b(anticip\w*|adelantad\w*|consign\w*|abono\s+previo|pago\s+previo|reserva\s+con\s+(pago|dinero|transferencia)|dep[oó]sito|recarga\w*|tarjeta\s+de\s+regalo|gift\s*card)\b/i

/** El anuncio no puede pedir dinero antes del encuentro. Devuelve la frase detectada. */
export const depositLanguage = (text: string) => text.match(DEPOSIT)?.[0] ?? null

/** Huella perceptual (dHash de 64 bits): fotos visualmente iguales dan huellas casi iguales. */
export async function photoHash(buf: Buffer): Promise<string> {
  const px = await sharp(buf).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer()
  let bits = ''
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0'
  return BigInt(`0b${bits}`).toString(16).padStart(16, '0')
}

export function hashDistance(a: string, b: string): number {
  if (a.length !== 16 || b.length !== 16) return 64
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`)
  let n = 0
  while (x) { n += Number(x & 1n); x >>= 1n }
  return n
}

export const SAME_PHOTO_MAX_DISTANCE = 6

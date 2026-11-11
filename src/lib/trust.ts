// Índice de confianza: una función pura y transparente. Cada punto se puede
// explicar al usuario; no hay forma de comprarlo.

export type TrustInput = {
  identity: boolean
  photos: boolean
  reviews: { rating: number; photosMatch: boolean; askedDeposit: boolean }[]
  createdAt: Date
  openReports: number
  now?: Date
}

export type TrustPart = { label: string; points: number; max: number }
export type Trust = { score: number; level: 'Alta' | 'Media' | 'En construcción'; parts: TrustPart[] }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function computeTrust(i: TrustInput): Trust {
  const n = i.reviews.length
  const avg = n ? i.reviews.reduce((s, r) => s + r.rating, 0) / n : 0
  const matchRatio = n ? i.reviews.filter((r) => r.photosMatch).length / n : 0
  const depositRatio = n ? i.reviews.filter((r) => r.askedDeposit).length / n : 0
  const months = ((i.now ?? new Date()).getTime() - i.createdAt.getTime()) / (30 * 864e5)

  const parts: TrustPart[] = [
    { label: 'Identidad y mayoría de edad verificadas', points: i.identity ? 35 : 0, max: 35 },
    { label: 'Fotos verificadas contra selfie', points: i.photos ? 20 : 0, max: 20 },
    { label: 'Reseñas de encuentros verificados', points: Math.round((Math.min(n, 10) / 10) * 15), max: 15 },
    { label: 'Calificación promedio', points: n ? Math.round(clamp((avg - 3) / 2, 0, 1) * 10) : 0, max: 10 },
    { label: 'Clientes confirman que es la persona de las fotos', points: Math.round(matchRatio * 10), max: 10 },
    { label: 'Antigüedad del perfil', points: Math.round(clamp(months / 6, 0, 1) * 10), max: 10 },
  ]
  const penalties = Math.min(i.openReports * 8, 24) + Math.round(depositRatio * 20)
  if (penalties > 0) parts.push({ label: 'Denuncias abiertas y anticipos reportados', points: -penalties, max: 0 })

  const score = clamp(parts.reduce((s, p) => s + p.points, 0), 0, 100)
  return { score, level: score >= 80 ? 'Alta' : score >= 55 ? 'Media' : 'En construcción', parts }
}

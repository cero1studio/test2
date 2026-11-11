// Catálogo de servicios anunciables. Se amplía aquí; las claves se guardan en el perfil.
export const SERVICES = [
  { key: 'cena', label: 'Cenas y eventos' },
  { key: 'masaje', label: 'Masaje relajante' },
  { key: 'pareja', label: 'Trato de pareja' },
  { key: 'parejas', label: 'Atención a parejas' },
  { key: 'noche', label: 'Noche completa' },
  { key: 'viajes', label: 'Salidas y viajes' },
  { key: 'videollamada', label: 'Videollamada' },
] as const

export const serviceLabel = (key: string) => SERVICES.find((s) => s.key === key)?.label ?? key
export const parseList = (csv: string) => csv.split(',').filter(Boolean)
export const toList = (items: string[]) => (items.length ? `,${items.join(',')},` : '')

export type ServiceScore = { key: string; label: string; average: number; count: number }

/** Promedio por servicio a partir de las reseñas verificadas. */
export function serviceScores(offered: string[], reviews: { serviceRatings: string }[]): ServiceScore[] {
  const acc = new Map<string, { sum: number; n: number }>()
  for (const r of reviews) {
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(r.serviceRatings) } catch { /* reseña sin detalle */ }
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v !== 'number' || v < 1 || v > 5) continue
      const a = acc.get(k) ?? { sum: 0, n: 0 }
      acc.set(k, { sum: a.sum + v, n: a.n + 1 })
    }
  }
  return offered.map((key) => {
    const a = acc.get(key)
    return { key, label: serviceLabel(key), average: a ? a.sum / a.n : 0, count: a?.n ?? 0 }
  })
}

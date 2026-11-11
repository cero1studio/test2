import { db } from './db'
import { releasedRatingWhere } from './profiles'

/** Reputación de un cliente: solo cifras agregadas, nunca con quién se vio. */
export async function clientStats(clientId: string) {
  const [encounters, ratings] = await Promise.all([
    db.encounter.count({ where: { clientId, confirmedAt: { not: null } } }),
    db.clientRating.findMany({ where: { clientId, ...releasedRatingWhere() } }),
  ])
  const n = ratings.length
  const pct = (k: 'respectful' | 'paidAsAgreed' | 'punctual') => (n ? Math.round((ratings.filter((r) => r[k]).length / n) * 100) : null)
  return {
    encounters,
    ratings: n,
    average: n ? ratings.reduce((s, r) => s + r.rating, 0) / n : null,
    respectful: pct('respectful'),
    paidAsAgreed: pct('paidAsAgreed'),
    punctual: pct('punctual'),
  }
}

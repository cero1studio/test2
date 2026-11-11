import { describe, expect, it } from 'vitest'
import { computeTrust } from '@/lib/trust'

const now = new Date('2026-06-01')
const base = { identity: false, photos: false, reviews: [], createdAt: now, openReports: 0, now }
const good = { rating: 5, photosMatch: true, askedDeposit: false }

describe('computeTrust', () => {
  it('perfil nuevo sin verificar empieza en 0', () => {
    expect(computeTrust(base)).toMatchObject({ score: 0, level: 'En construcción' })
  })

  it('verificación de identidad y fotos suma 55', () => {
    expect(computeTrust({ ...base, identity: true, photos: true }).score).toBe(55)
  })

  it('perfil verificado, antiguo y con 10 reseñas excelentes llega a 100', () => {
    const t = computeTrust({
      ...base, identity: true, photos: true, createdAt: new Date('2025-01-01'), reviews: Array(10).fill(good),
    })
    expect(t).toMatchObject({ score: 100, level: 'Alta' })
  })

  it('pedir anticipos y tener denuncias abiertas penaliza', () => {
    const clean = computeTrust({ ...base, identity: true, photos: true, reviews: [good, good] })
    const dirty = computeTrust({
      ...base, identity: true, photos: true, openReports: 2,
      reviews: [good, { ...good, askedDeposit: true }],
    })
    expect(clean.score - dirty.score).toBe(26)
  })

  it('nunca sale del rango 0-100', () => {
    expect(computeTrust({ ...base, openReports: 50 }).score).toBe(0)
  })
})

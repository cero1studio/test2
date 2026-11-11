import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { isForeignLanguage } from '@/lib/geo'
import { depositLanguage, hashDistance, photoHash, SAME_PHOTO_MAX_DISTANCE } from '@/lib/scam'
import { serviceScores } from '@/lib/services'

describe('detección de estafas', () => {
  it('detecta anuncios que piden dinero por adelantado', () => {
    expect(depositLanguage('Se requiere anticipo del 50% por Nequi')).toBe('anticipo')
    expect(depositLanguage('Reserva con transferencia antes de la cita')).not.toBeNull()
    expect(depositLanguage('Debes consignar para separar')).not.toBeNull()
  })
  it('no marca anuncios normales', () => {
    expect(depositLanguage('Trato respetuoso y puntual. Reserva con una hora de antelación por WhatsApp.')).toBeNull()
  })

  const img = (stops: string) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="140" cy="180" r="90" fill="#111"/></svg>`)
  it('la misma foto recomprimida y reescalada conserva la huella; otra foto no', async () => {
    const a = await sharp(img('<stop offset="0" stop-color="#f6c"/><stop offset="1" stop-color="#206"/>')).png().toBuffer()
    const copy = await sharp(a).resize(250).jpeg({ quality: 55 }).toBuffer()
    const other = await sharp(img('<stop offset="0" stop-color="#021"/><stop offset="1" stop-color="#fe9"/>')).flop().png().toBuffer()
    const [ha, hc, ho] = await Promise.all([photoHash(a), photoHash(copy), photoHash(other)])
    expect(hashDistance(ha, hc)).toBeLessThanOrEqual(SAME_PHOTO_MAX_DISTANCE)
    expect(hashDistance(ha, ho)).toBeGreaterThan(SAME_PHOTO_MAX_DISTANCE)
  })
})

describe('señal de visitante extranjero', () => {
  it('usa el idioma principal del navegador', () => {
    expect(isForeignLanguage('en-US,en;q=0.9,es;q=0.8')).toBe(true)
    expect(isForeignLanguage('es-CO,es;q=0.9,en;q=0.8')).toBe(false)
    expect(isForeignLanguage(null)).toBe(false)
  })
})

describe('calificación por servicio', () => {
  it('promedia solo los servicios calificados e ignora datos inválidos', () => {
    const scores = serviceScores(['masaje', 'cena'], [
      { serviceRatings: '{"masaje":5}' }, { serviceRatings: '{"masaje":4,"cena":9}' }, { serviceRatings: 'no-json' },
    ])
    expect(scores).toEqual([
      { key: 'masaje', label: 'Masaje relajante', average: 4.5, count: 2 },
      { key: 'cena', label: 'Cenas y eventos', average: 0, count: 0 },
    ])
  })
})

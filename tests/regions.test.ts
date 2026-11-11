import { describe, expect, it } from 'vitest'
import { isHiddenFrom } from '@/lib/profiles'
import { toRegion } from '@/lib/regions'

describe('toRegion', () => {
  it('visitante fuera de Colombia es EXT', () => expect(toRegion('US', 'CA')).toBe('EXT'))
  it('acepta códigos con o sin prefijo CO-', () => {
    expect(toRegion('CO', 'ANT')).toBe('ANT')
    expect(toRegion('co', 'CO-DC')).toBe('DC')
  })
  it('sin datos o con código desconocido devuelve null', () => {
    expect(toRegion(null, null)).toBeNull()
    expect(toRegion('CO', 'XX')).toBeNull()
  })
})

describe('isHiddenFrom', () => {
  const p = { blockedRegions: ',ANT,EXT,', foreignersOnly: false }
  const at = (region: string | null, foreign = false) => ({ region, foreign })
  it('oculta en regiones bloqueadas', () => expect(isHiddenFrom(p, at('ANT'))).toBe(true))
  it('muestra en regiones no bloqueadas', () => expect(isHiddenFrom(p, at('DC'))).toBe(false))
  it('si no se conoce la ubicación, un perfil con bloqueos se oculta', () => expect(isHiddenFrom(p, at(null))).toBe(true))
  it('un perfil sin bloqueos se muestra siempre', () => expect(isHiddenFrom({ blockedRegions: '', foreignersOnly: false }, at(null))).toBe(false))
  it('no confunde códigos parecidos', () => expect(isHiddenFrom({ blockedRegions: ',SAN,', foreignersOnly: false }, at('SAP'))).toBe(false))
  it('«solo extranjeros» se oculta a visitantes locales y se muestra a extranjeros', () => {
    const f = { blockedRegions: '', foreignersOnly: true }
    expect(isHiddenFrom(f, at('DC', false))).toBe(true)
    expect(isHiddenFrom(f, at('DC', true))).toBe(false)
  })
})

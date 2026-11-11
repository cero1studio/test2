import { describe, expect, it } from 'vitest'
import { isBlockedIn } from '@/lib/profiles'
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

describe('isBlockedIn', () => {
  const p = { blockedRegions: ',ANT,EXT,' }
  it('oculta en regiones bloqueadas', () => expect(isBlockedIn(p, 'ANT')).toBe(true))
  it('muestra en regiones no bloqueadas', () => expect(isBlockedIn(p, 'DC')).toBe(false))
  it('si no se conoce la ubicación, un perfil con bloqueos se oculta', () => expect(isBlockedIn(p, null)).toBe(true))
  it('un perfil sin bloqueos se muestra siempre', () => expect(isBlockedIn({ blockedRegions: '' }, null)).toBe(false))
  it('no confunde códigos parecidos', () => expect(isBlockedIn({ blockedRegions: ',SAN,' }, 'SAP')).toBe(false))
})

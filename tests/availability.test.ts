import { describe, expect, it } from 'vitest'
import { availabilityLabel, isAvailableNow, lastSeenLabel, scheduleLabel } from '@/lib/availability'

const now = new Date('2026-06-01T20:00:00Z')
const base = { availableUntil: null, lastSeenAt: null, scheduleDays: '', scheduleFrom: 0, scheduleTo: 0 }

describe('disponibilidad', () => {
  it('solo está disponible mientras no venza', () => {
    expect(isAvailableNow({ availableUntil: new Date('2026-06-01T21:00:00Z') }, now)).toBe(true)
    expect(isAvailableNow({ availableUntil: new Date('2026-06-01T19:59:00Z') }, now)).toBe(false)
    expect(isAvailableNow({ availableUntil: null }, now)).toBe(false)
  })

  it('una disponibilidad vencida cae a "última vez activa"', () => {
    const a = availabilityLabel({ ...base, availableUntil: new Date('2026-06-01T19:00:00Z'), lastSeenAt: new Date('2026-06-01T17:00:00Z') }, now)
    expect(a).toEqual({ now: false, text: 'Activa hace 3 h' })
  })

  it('describe la última actividad con la unidad adecuada', () => {
    expect(lastSeenLabel(new Date('2026-06-01T19:55:00Z'), now)).toBe('Activa hace un momento')
    expect(lastSeenLabel(new Date('2026-06-01T19:20:00Z'), now)).toBe('Activa hace 40 min')
    expect(lastSeenLabel(new Date('2026-05-31T19:00:00Z'), now)).toBe('Activa hace 1 día')
    expect(lastSeenLabel(new Date('2026-03-01T00:00:00Z'), now)).toBe('Inactiva hace más de un mes')
    expect(lastSeenLabel(null, now)).toBeNull()
  })

  it('formatea el horario habitual', () => {
    expect(scheduleLabel({ scheduleDays: ',1,2,3,', scheduleFrom: 14, scheduleTo: 22 })).toBe('Lun, Mar, Mié · 2 p. m. a 10 p. m.')
    expect(scheduleLabel({ scheduleDays: ',0,1,2,3,4,5,6,', scheduleFrom: 0, scheduleTo: 0 })).toBe('Todos los días · 24 horas')
    expect(scheduleLabel({ scheduleDays: '', scheduleFrom: 0, scheduleTo: 0 })).toBeNull()
  })
})

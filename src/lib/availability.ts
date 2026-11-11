import { DAYS, hourLabel, timeFormat } from './constants'

type Avail = {
  availableUntil: Date | null
  lastSeenAt: Date | null
  scheduleDays: string
  scheduleFrom: number
  scheduleTo: number
}

/** "Disponible ahora" es una declaración activa que vence sola: nunca queda encendida por olvido. */
export const isAvailableNow = (p: Pick<Avail, 'availableUntil'>, now = new Date()) =>
  !!p.availableUntil && p.availableUntil > now

export function lastSeenLabel(at: Date | null, now = new Date()): string | null {
  if (!at) return null
  const min = Math.floor((now.getTime() - at.getTime()) / 60_000)
  if (min < 10) return 'Activa hace un momento'
  if (min < 60) return `Activa hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Activa hace ${h} h`
  const d = Math.floor(h / 24)
  return d <= 30 ? `Activa hace ${d} ${d === 1 ? 'día' : 'días'}` : 'Inactiva hace más de un mes'
}

export function scheduleLabel(p: Pick<Avail, 'scheduleDays' | 'scheduleFrom' | 'scheduleTo'>): string | null {
  const days = p.scheduleDays.split(',').filter(Boolean).map(Number).sort()
  if (days.length === 0) return null
  const dayText = days.length === 7 ? 'Todos los días' : days.map((d) => DAYS[d]).join(', ')
  return p.scheduleFrom === p.scheduleTo ? `${dayText} · 24 horas` : `${dayText} · ${hourLabel(p.scheduleFrom)} a ${hourLabel(p.scheduleTo)}`
}

export function availabilityLabel(p: Avail, now = new Date()) {
  return isAvailableNow(p, now)
    ? { now: true, text: `Disponible ahora · hasta las ${timeFormat.format(p.availableUntil!)}` }
    : { now: false, text: lastSeenLabel(p.lastSeenAt, now) ?? 'No disponible ahora' }
}

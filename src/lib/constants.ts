export const APP_NAME = 'Sigila'
export const TAGLINE = 'Discreta para ellas. Segura para ellos.'

export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000'

export const CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Cúcuta',
] as const

export const CATEGORIES = ['Mujeres', 'Hombres', 'Trans'] as const

export const REPORT_REASONS = [
  { key: 'ANTICIPO', label: 'Pidió anticipo o depósito antes del encuentro', severe: false },
  { key: 'FOTOS_FALSAS', label: 'Las fotos no corresponden a la persona', severe: false },
  { key: 'ROBO_EXTORSION', label: 'Robo, extorsión o amenaza', severe: false },
  { key: 'MENOR_DE_EDAD', label: 'Podría ser menor de edad', severe: true },
  { key: 'TRATA_COACCION', label: 'Podría estar siendo explotada o coaccionada', severe: true },
  { key: 'OTRO', label: 'Otro', severe: false },
] as const

export const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const

export type ActionState = { error?: string; ok?: string }

const TZ = 'America/Bogota'
export const copFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: TZ })
const monthFmt = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: TZ })
/** «Junio de 2026» */
export const monthFormat = { format: (d: Date) => monthFmt.format(d).replace(/^./, (c) => c.toUpperCase()) }
export const timeFormat = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
export const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'a. m.' : 'p. m.'}`

export const citySlug = (c: string) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const cityFromSlug = (slug: string) => CITIES.find((c) => citySlug(c) === slug)

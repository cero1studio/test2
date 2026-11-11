export const APP_NAME = 'Veraz'

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

export type ActionState = { error?: string; ok?: string }

export const copFormat = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
})
export const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

import { CATEGORIES } from './constants'
import { SERVICES } from './services'
import { TAGS } from './tags'

export type Landing = { slug: string; title: (city: string) => string; fixed: { category?: string; tag?: string; service?: string } }

// Páginas «ciudad + palabra clave»: /prepagos/bogota/tatuajes, /prepagos/medellin/trans…
export const LANDINGS: Landing[] = [
  ...CATEGORIES.map((c) => ({
    slug: c.toLowerCase(),
    title: (city: string) => (c === 'Mujeres' ? `Prepagos y acompañantes mujeres en ${city}` : c === 'Hombres' ? `Acompañantes hombres en ${city}` : `Acompañantes trans en ${city}`),
    fixed: { category: c },
  })),
  ...TAGS.map((t) => ({ slug: t.key, title: (city: string) => `Prepagos «${t.label.toLowerCase()}» en ${city}`, fixed: { tag: t.key } })),
  ...SERVICES.map((s) => ({ slug: s.key, title: (city: string) => `${s.label} con acompañantes en ${city}`, fixed: { service: s.key } })),
]

export const landingFromSlug = (slug: string) => LANDINGS.find((l) => l.slug === slug)

export const landingWhere = (f: Landing['fixed']) => ({
  ...(f.category && { category: f.category }),
  ...(f.tag && { tags: { contains: `,${f.tag},` } }),
  ...(f.service && { services: { contains: `,${f.service},` } }),
})

import { headers } from 'next/headers'
import { cache } from 'react'
import { toRegion } from './regions'

export type Viewer = { region: string | null; foreign: boolean }

/**
 * Quién mira, según señales de la conexión:
 * - region: departamento o «EXT», por las cabeceras de geolocalización del CDN
 *   (Vercel o Cloudflare). null si no se puede determinar.
 * - foreign: visitante probablemente extranjero. Se cumple si navega desde otro
 *   país O si el idioma principal de su navegador no es español (un turista que
 *   ya está en Colombia navega con IP colombiana, pero su teléfono sigue en su idioma).
 *
 * Son indicios, no pruebas: una VPN o cambiar el idioma los alteran. Las
 * cabeceras de región solo son confiables si el CDN las sobrescribe.
 * En desarrollo, GEO_DEV_REGION simula la región (p. ej. "ANT" o "EXT").
 */
export const viewer = cache(async (): Promise<Viewer> => {
  const h = await headers()
  const region =
    process.env.NODE_ENV !== 'production' && process.env.GEO_DEV_REGION
      ? process.env.GEO_DEV_REGION
      : toRegion(h.get('x-vercel-ip-country') ?? h.get('cf-ipcountry'), h.get('x-vercel-ip-country-region') ?? h.get('cf-region-code'))
  return { region, foreign: region === 'EXT' || isForeignLanguage(h.get('accept-language')) }
})

export function isForeignLanguage(acceptLanguage: string | null): boolean {
  const primary = acceptLanguage?.split(',')[0]?.trim().toLowerCase()
  return !!primary && primary !== '*' && !primary.startsWith('es')
}

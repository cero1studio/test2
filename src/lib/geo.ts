import { headers } from 'next/headers'
import { toRegion } from './regions'

/**
 * Región del visitante según las cabeceras de geolocalización del CDN
 * (Vercel o Cloudflare). Devuelve null si no se puede determinar; en ese caso
 * los perfiles con bloqueos NO se muestran.
 *
 * Importante: estas cabeceras solo son confiables si el CDN las sobrescribe.
 * No expongas la app directamente a internet sin un proxy que las fije.
 * En desarrollo, GEO_DEV_REGION simula la ubicación (p. ej. "ANT" o "EXT").
 */
export async function viewerRegion(): Promise<string | null> {
  if (process.env.NODE_ENV !== 'production' && process.env.GEO_DEV_REGION) return process.env.GEO_DEV_REGION
  const h = await headers()
  return toRegion(
    h.get('x-vercel-ip-country') ?? h.get('cf-ipcountry'),
    h.get('x-vercel-ip-country-region') ?? h.get('cf-region-code'),
  )
}

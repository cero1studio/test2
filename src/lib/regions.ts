// Departamentos de Colombia (códigos ISO 3166-2:CO) + «EXT» para visitantes fuera del país.
export const REGIONS = [
  { code: 'EXT', name: 'Fuera de Colombia' },
  { code: 'DC', name: 'Bogotá D.C.' }, { code: 'ANT', name: 'Antioquia' }, { code: 'VAC', name: 'Valle del Cauca' },
  { code: 'ATL', name: 'Atlántico' }, { code: 'BOL', name: 'Bolívar' }, { code: 'SAN', name: 'Santander' },
  { code: 'RIS', name: 'Risaralda' }, { code: 'NSA', name: 'Norte de Santander' }, { code: 'CUN', name: 'Cundinamarca' },
  { code: 'AMA', name: 'Amazonas' }, { code: 'ARA', name: 'Arauca' }, { code: 'BOY', name: 'Boyacá' },
  { code: 'CAL', name: 'Caldas' }, { code: 'CAQ', name: 'Caquetá' }, { code: 'CAS', name: 'Casanare' },
  { code: 'CAU', name: 'Cauca' }, { code: 'CES', name: 'Cesar' }, { code: 'CHO', name: 'Chocó' },
  { code: 'COR', name: 'Córdoba' }, { code: 'GUA', name: 'Guainía' }, { code: 'GUV', name: 'Guaviare' },
  { code: 'HUI', name: 'Huila' }, { code: 'LAG', name: 'La Guajira' }, { code: 'MAG', name: 'Magdalena' },
  { code: 'MET', name: 'Meta' }, { code: 'NAR', name: 'Nariño' }, { code: 'PUT', name: 'Putumayo' },
  { code: 'QUI', name: 'Quindío' }, { code: 'SAP', name: 'San Andrés y Providencia' }, { code: 'SUC', name: 'Sucre' },
  { code: 'TOL', name: 'Tolima' }, { code: 'VAU', name: 'Vaupés' }, { code: 'VID', name: 'Vichada' },
] as const

/** Traduce país + subdivisión (cabeceras del CDN) al código de región que usamos. */
export function toRegion(country: string | null, subdivision: string | null): string | null {
  if (country && country.toUpperCase() !== 'CO') return 'EXT'
  const code = subdivision?.toUpperCase().replace(/^CO-/, '') ?? ''
  return REGIONS.some((r) => r.code === code) ? code : null
}

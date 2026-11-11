import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Listing, type ListingQuery } from '@/components/Listing'
import { cityFromSlug } from '@/lib/constants'
import { db } from '@/lib/db'
import { landingFromSlug, landingWhere } from '@/lib/landing'
import { publicWhere } from '@/lib/profiles'

type Props = { params: Promise<{ ciudad: string; filtro: string }>; searchParams: Promise<ListingQuery> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad, filtro } = await params
  const city = cityFromSlug(ciudad)
  const landing = landingFromSlug(filtro)
  if (!city || !landing) return {}
  // Una página sin perfiles no aporta nada a quien busca: no se indexa.
  const count = await db.profile.count({ where: { ...publicWhere, discreet: false, blockedRegions: '', city, ...landingWhere(landing.fixed) } })
  return {
    title: `${landing.title(city)} · verificadas`,
    description: `${landing.title(city)}: perfiles con identidad verificada, fotos reales, disponibilidad en tiempo real y reseñas de encuentros comprobados.`,
    alternates: { canonical: `/prepagos/${ciudad}/${filtro}` },
    robots: count === 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function KeywordPage({ params, searchParams }: Props) {
  const { ciudad, filtro } = await params
  const city = cityFromSlug(ciudad)
  const landing = landingFromSlug(filtro)
  if (!city || !landing) notFound()
  return (
    <div className="container-page space-y-8 py-10">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow"><Link href={`/prepagos/${ciudad}`} className="hover:text-cream">{city}</Link></p>
        <h1 className="display text-4xl md:text-5xl">{landing.title(city)}</h1>
        <p className="text-mute">Solo perfiles con identidad y mayoría de edad verificadas. Primero quienes están disponibles ahora.</p>
      </header>
      <Listing q={await searchParams} fixed={{ city, ...landing.fixed }} action={`/prepagos/${ciudad}/${filtro}`} />
    </div>
  )
}

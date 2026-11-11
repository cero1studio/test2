import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Listing, type ListingQuery } from '@/components/Listing'
import Link from 'next/link'
import { APP_NAME, CATEGORIES, cityFromSlug } from '@/lib/constants'
import { SERVICES } from '@/lib/services'
import { TAGS } from '@/lib/tags'

type Props = { params: Promise<{ ciudad: string }>; searchParams: Promise<ListingQuery> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad } = await params
  const city = cityFromSlug(ciudad)
  if (!city) return {}
  return {
    title: `Prepagos y acompañantes verificadas en ${city}`,
    description: `Acompañantes en ${city} con identidad verificada, fotos reales y reseñas de encuentros comprobados. Sin anticipos ni perfiles falsos.`,
    alternates: { canonical: `/prepagos/${ciudad}` },
  }
}

// Página de aterrizaje por ciudad: URL limpia y contenido propio para buscadores.
export default async function CityPage({ params, searchParams }: Props) {
  const { ciudad } = await params
  const city = cityFromSlug(ciudad)
  if (!city) notFound()
  return (
    <div className="container-page space-y-8 py-10">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">{city}</p>
        <h1 className="display text-4xl md:text-5xl">Prepagos y acompañantes <em className="grad-text">verificadas</em> en {city}</h1>
        <p className="text-mute">
          Todos los perfiles de {city} en {APP_NAME} pasaron verificación de identidad y mayoría de edad. Las
          reseñas provienen de encuentros confirmados en persona y la disponibilidad se actualiza en tiempo real.
        </p>
      </header>
      <nav aria-label={`Búsquedas en ${city}`} className="flex flex-wrap gap-2">
        {[...CATEGORIES.map((c) => [c.toLowerCase(), c]), ...TAGS.map((t) => [t.key, t.label]), ...SERVICES.map((sv) => [sv.key, sv.label])].map(([slug, label]) => (
          <Link key={slug} href={`/prepagos/${ciudad}/${slug}`} className="chip transition hover:border-white/30 hover:text-cream">{label}</Link>
        ))}
      </nav>
      <Listing q={await searchParams} fixed={{ city }} action={`/prepagos/${ciudad}`} />
    </div>
  )
}

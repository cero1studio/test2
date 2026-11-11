import type { Metadata } from 'next'
import { Listing, type ListingQuery } from '@/components/Listing'
import { StoriesBar } from '@/components/StoriesBar'

export const metadata: Metadata = { title: 'Explorar perfiles verificados', alternates: { canonical: '/explorar' } }

export default async function Explore({ searchParams }: { searchParams: Promise<ListingQuery> }) {
  return (
    <div className="container-page space-y-8 py-10">
      <header className="space-y-2">
        <p className="eyebrow">Explorar</p>
        <h1 className="display text-4xl md:text-5xl">Perfiles <em className="grad-text">verificados</em></h1>
      </header>
      <StoriesBar />
      <Listing q={await searchParams} action="/explorar" />
    </div>
  )
}

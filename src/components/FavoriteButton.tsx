'use client'

import { BellRing, Heart } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toggleFavorite } from '@/app/actions/public'

export function FavoriteButton({ profileId, initial, canUse, loginHref }: { profileId: string; initial: boolean; canUse: boolean; loginHref: string }) {
  const [on, setOn] = useState(initial)
  const [pending, start] = useTransition()
  if (!canUse) return <Link href={loginHref} className="btn btn-sm"><Heart className="size-4" />Avísame cuando esté disponible</Link>
  return (
    <button
      className={`btn btn-sm ${on ? 'border-rose/60 bg-rose/15 text-rose' : ''}`} aria-pressed={on} disabled={pending}
      onClick={() => start(async () => { const r = await toggleFavorite(profileId); if (r.on !== undefined) setOn(r.on) })}
    >
      <motion.span key={String(on)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }} className="inline-flex">
        {on ? <BellRing className="size-4" /> : <Heart className="size-4" />}
      </motion.span>
      {on ? 'Te avisaremos' : 'Avísame cuando esté disponible'}
    </button>
  )
}

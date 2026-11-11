'use client'

import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

export type StoryGroup = { slug: string; name: string; city: string; live: boolean; photoIds: string[] }

const DURATION = 5000

export function Stories({ groups }: { groups: StoryGroup[] }) {
  const [at, setAt] = useState<{ g: number; i: number } | null>(null)
  const close = useCallback(() => setAt(null), [])
  const step = useCallback((dir: 1 | -1) => {
    setAt((cur) => {
      if (!cur) return cur
      const i = cur.i + dir
      if (i >= 0 && i < groups[cur.g].photoIds.length) return { g: cur.g, i }
      const g = cur.g + dir
      if (g < 0 || g >= groups.length) return null
      return { g, i: dir === 1 ? 0 : groups[g].photoIds.length - 1 }
    })
  }, [groups])

  useEffect(() => {
    if (!at) return
    const timer = setTimeout(() => step(1), DURATION)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKey) }
  }, [at, step, close])

  if (groups.length === 0) return null
  const group = at && groups[at.g]

  return (
    <>
      <ul className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]" aria-label="Historias">
        {groups.map((g, gi) => (
          <li key={g.slug} className="shrink-0">
            <button onClick={() => setAt({ g: gi, i: 0 })} className="group flex w-[4.5rem] cursor-pointer flex-col items-center gap-1.5" aria-label={`Ver historia de ${g.name}`}>
              <span className="relative rounded-full bg-gradient-to-tr from-rose to-peach p-[2.5px] transition group-hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${g.photoIds[0]}`} alt="" className="size-16 rounded-full border-[3px] border-bg object-cover" />
                {g.live && <span className="dot-live absolute right-0.5 bottom-0.5 size-3 border-2 border-bg" />}
              </span>
              <span className="w-full truncate text-center text-xs text-mute group-hover:text-cream">{g.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {at && group && (
          <motion.div
            role="dialog" aria-modal="true" aria-label={`Historia de ${group.name}`}
            className="fixed inset-0 z-50 grid place-items-center bg-black/90 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              key={group.slug}
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}
              className="relative aspect-[9/16] h-[min(92dvh,48rem)] max-w-[100vw] overflow-hidden rounded-3xl bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${group.photoIds[at.i]}`} alt={`Historia de ${group.name}`} className="size-full object-cover" />
              <div className="absolute inset-x-0 top-0 space-y-3 bg-gradient-to-b from-black/70 to-transparent p-4">
                <div className="flex gap-1">
                  {group.photoIds.map((id, i) => (
                    <span key={id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
                      {i < at.i && <span className="block size-full bg-white" />}
                      {i === at.i && <motion.span key={`${at.g}-${at.i}`} className="block h-full bg-white" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: DURATION / 1000, ease: 'linear' }} />}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <Link href={`/p/${group.slug}`} className="text-sm font-semibold hover:underline">{group.name} <span className="font-normal text-white/60">· {group.city}</span></Link>
                  <button onClick={close} aria-label="Cerrar" className="cursor-pointer rounded-full p-1 hover:bg-white/10"><X className="size-5" /></button>
                </div>
              </div>
              <button aria-label="Anterior" onClick={() => step(-1)} className="absolute inset-y-16 left-0 w-1/3 cursor-pointer" />
              <button aria-label="Siguiente" onClick={() => step(1)} className="absolute inset-y-16 right-0 w-1/3 cursor-pointer" />
              <Link href={`/p/${group.slug}`} className="btn btn-primary btn-sm absolute inset-x-6 bottom-5">Ver perfil</Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

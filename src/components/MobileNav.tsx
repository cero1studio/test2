'use client'

import { Compass, Home, ShieldCheck, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/explorar', label: 'Explorar', icon: Compass },
  { href: '/seguridad', label: 'Seguridad', icon: ShieldCheck },
  { href: '/panel', label: 'Mi cuenta', icon: UserRound },
]

export function MobileNav() {
  const path = usePathname()
  return (
    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? 'page' : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium ${active ? 'text-rose' : 'text-mute'}`}>
                <Icon className="size-5" />{label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

'use client'

import type { ReactNode } from 'react'

/** Formulario GET que se envía solo al cambiar un selector o casilla: filtrar sin pulsar botones. */
export function FilterForm({ action, children, className }: { action: string; children: ReactNode; className?: string }) {
  return (
    <form
      action={action}
      className={className}
      onChange={(e) => {
        const t = e.target as HTMLElement
        if (t instanceof HTMLSelectElement || (t instanceof HTMLInputElement && t.type === 'checkbox')) e.currentTarget.requestSubmit()
      }}
    >
      {children}
    </form>
  )
}

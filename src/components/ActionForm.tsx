'use client'

import { useActionState, type ReactNode } from 'react'
import type { ActionState } from '@/lib/constants'

export function ActionForm({
  action, children, submit, className = 'space-y-3',
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>
  children: ReactNode
  submit: string
  className?: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && <p role="alert" className="rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-sm text-rose">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{state.ok}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Enviando…' : submit}</button>
    </form>
  )
}

'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useActionState, type ReactNode } from 'react'
import type { ActionState } from '@/lib/constants'

export function ActionForm({
  action, children, submit, className = 'space-y-4', buttonClass = 'btn btn-primary',
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>
  children?: ReactNode
  submit: string
  className?: string
  buttonClass?: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const msg = state.error ?? state.ok
  return (
    <form action={formAction} className={className}>
      {children}
      <AnimatePresence mode="wait">
        {msg && (
          <motion.p
            key={msg}
            role={state.error ? 'alert' : 'status'}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`col-span-full rounded-2xl border px-4 py-2.5 text-sm ${state.error ? 'border-rose/30 bg-rose/10 text-rose' : 'border-mint/30 bg-mint/10 text-mint'}`}
          >
            {msg}
          </motion.p>
        )}
      </AnimatePresence>
      <button className={buttonClass} disabled={pending}>{pending ? 'Enviando…' : submit}</button>
    </form>
  )
}

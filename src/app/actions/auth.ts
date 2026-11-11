'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSession, destroySession } from '@/lib/auth'
import type { ActionState } from '@/lib/constants'
import { db } from '@/lib/db'
import { randomCode } from '@/lib/profiles'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const passwordSchema = z.string().min(10, 'La contraseña debe tener al menos 10 caracteres.').max(200)
const emailSchema = z.string().trim().toLowerCase().email('Correo inválido.')

// Solo se permite volver a rutas internas (evita redirecciones abiertas).
const safeNext = (v: FormDataEntryValue | null) => (typeof v === 'string' && /^\/[a-zA-Z0-9/_-]*$/.test(v) ? v : null)

export async function register(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!rateLimit(`reg:${await clientIp()}`, 5, 60 * 60_000)) return { error: 'Demasiados intentos. Prueba más tarde.' }
  const password = passwordSchema.safeParse(fd.get('password'))
  if (!password.success) return { error: password.error.issues[0].message }
  if (fd.get('adult') !== 'on') return { error: 'Debes confirmar que eres mayor de 18 años y aceptar los términos.' }
  const role = fd.get('role') === 'ADVERTISER' ? 'ADVERTISER' : 'CLIENT'

  // Clientes: el correo es opcional (cuenta anónima). Anunciantes: obligatorio,
  // porque moderación necesita un canal para avisar sobre su verificación.
  const rawEmail = String(fd.get('email') ?? '').trim()
  let email: string | null = null
  if (rawEmail || role === 'ADVERTISER') {
    const parsed = emailSchema.safeParse(rawEmail)
    if (!parsed.success) return { error: role === 'ADVERTISER' ? 'Para anunciar necesitas un correo válido.' : parsed.error.issues[0].message }
    email = parsed.data
    if (await db.user.findUnique({ where: { email } })) return { error: 'Ya existe una cuenta con ese correo.' }
  }
  const user = await db.user.create({
    data: { email, role, handle: `${role === 'CLIENT' ? 'cliente' : 'perfil'}-${randomCode(6).toLowerCase()}`, passwordHash: await bcrypt.hash(password.data, 12) },
  })
  await createSession(user.id)
  redirect(safeNext(fd.get('next')) ?? (email ? '/panel' : '/panel?nueva=1'))
}

export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  // Se ingresa con el correo o con el alias (cuentas anónimas).
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const password = String(fd.get('password') ?? '')
  if (!rateLimit(`login:${await clientIp()}:${email}`, 8, 15 * 60_000)) return { error: 'Demasiados intentos. Espera 15 minutos.' }
  const user = await db.user.findFirst({ where: email.includes('@') ? { email } : { handle: email } })
  // Se compara siempre contra un hash para no revelar si el correo existe.
  const hash = user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi'
  if (!(await bcrypt.compare(password, hash)) || !user) return { error: 'Datos de ingreso incorrectos.' }
  await createSession(user.id)
  redirect(safeNext(fd.get('next')) ?? (user.role === 'ADMIN' ? '/admin' : '/panel'))
}

export async function logout() {
  await destroySession()
  redirect('/')
}

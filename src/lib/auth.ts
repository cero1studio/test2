import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createHash, randomBytes } from 'node:crypto'
import { db } from './db'

const COOKIE = 'sid'
const MAX_AGE = 60 * 60 * 24 * 30
const sha = (t: string) => createHash('sha256').update(t).digest('hex')

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  await db.session.create({
    data: { id: sha(token), userId, expiresAt: new Date(Date.now() + MAX_AGE * 1000) },
  })
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE,
  })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) await db.session.deleteMany({ where: { id: sha(token) } })
  jar.delete(COOKIE)
}

export const getUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const session = await db.session.findUnique({ where: { id: sha(token) }, include: { user: true } })
  if (!session || session.expiresAt < new Date()) return null
  const { id, email, role, handle } = session.user
  return { id, email, role, handle }
})

export async function requireUser(role?: 'CLIENT' | 'ADVERTISER' | 'ADMIN') {
  const user = await getUser()
  if (!user) redirect('/ingresar')
  if (role && user.role !== role) redirect('/panel')
  return user
}

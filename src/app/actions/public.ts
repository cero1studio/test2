'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getUser } from '@/lib/auth'
import { REPORT_REASONS, type ActionState } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewerRegion } from '@/lib/geo'
import { isBlockedIn, isPublic } from '@/lib/profiles'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export async function confirmAge() {
  ;(await cookies()).set('adulto', '1', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
}

/** El número no viaja en el HTML: se entrega bajo demanda y con límite por IP. */
export async function revealContact(profileId: string): Promise<{ whatsapp?: string; error?: string }> {
  if (!rateLimit(`contact:${await clientIp()}`, 15, 60 * 60_000)) {
    return { error: 'Has consultado muchos contactos. Intenta más tarde.' }
  }
  const p = await db.profile.findUnique({ where: { id: profileId } })
  if (!p || !isPublic(p) || isBlockedIn(p, await viewerRegion())) return { error: 'Perfil no disponible.' }
  return { whatsapp: p.whatsapp.replace(/^\+/, '') }
}

const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS.map((r) => r.key) as [string, ...string[]], 'Elige un motivo.'),
  details: z.string().trim().min(15, 'Cuéntanos qué pasó (mínimo 15 caracteres).').max(2000),
})

export async function submitReport(profileId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  if (!rateLimit(`report:${await clientIp()}`, 5, 60 * 60_000)) return { error: 'Demasiadas denuncias. Intenta más tarde.' }
  const parsed = reportSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const profile = await db.profile.findUnique({ where: { id: profileId } })
  if (!profile) return { error: 'Perfil no encontrado.' }
  const user = await getUser()
  if (user?.id === profile.userId) return { error: 'No puedes denunciar tu propio perfil.' }
  await db.report.create({ data: { profileId, reporterId: user?.id, ...parsed.data } })

  // Ocultamiento preventivo: una denuncia grave de un usuario registrado, o
  // tres denuncias abiertas de cuentas distintas, sacan el perfil del aire
  // hasta que moderación lo revise.
  if (profile.status === 'ACTIVE' && user) {
    const severe = REPORT_REASONS.find((r) => r.key === parsed.data.reason)?.severe
    const reporters = await db.report.findMany({
      where: { profileId, status: 'OPEN', reporterId: { not: null } },
      distinct: ['reporterId'],
      select: { reporterId: true },
    })
    if (severe || reporters.length >= 3) {
      // Sin revalidar: quien denuncia debe ver la confirmación, no un 404.
      await db.profile.update({ where: { id: profileId }, data: { status: 'REVIEW' } })
    }
  }
  return { ok: 'Denuncia recibida. Moderación la revisará; tu identidad no se comparte con el perfil.' }
}

const reviewSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Código inválido.'),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(20, 'Escribe al menos 20 caracteres.').max(1500),
})

export async function submitReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getUser()
  if (!user || user.role !== 'CLIENT') return { error: 'Solo las cuentas de cliente pueden reseñar.' }
  if (!rateLimit(`review:${user.id}`, 10, 60 * 60_000)) return { error: 'Demasiados intentos. Prueba más tarde.' }
  const parsed = reviewSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { code, rating, body } = parsed.data

  const rc = await db.reviewCode.findUnique({ where: { code }, include: { profile: true } })
  if (!rc || rc.usedAt || rc.expiresAt < new Date()) return { error: 'El código no existe, ya se usó o venció.' }
  const recent = await db.review.findFirst({
    where: { profileId: rc.profileId, authorId: user.id, createdAt: { gt: new Date(Date.now() - 30 * 864e5) } },
  })
  if (recent) return { error: 'Ya reseñaste este perfil en los últimos 30 días.' }

  try {
    await db.$transaction(async (tx) => {
      const claimed = await tx.reviewCode.updateMany({ where: { id: rc.id, usedAt: null }, data: { usedAt: new Date() } })
      if (claimed.count !== 1) throw new Error('used')
      await tx.review.create({
        data: {
          profileId: rc.profileId, authorId: user.id, codeId: rc.id, rating, body,
          photosMatch: fd.get('photosMatch') === 'on',
          askedDeposit: fd.get('askedDeposit') === 'on',
        },
      })
    })
  } catch {
    return { error: 'El código ya fue usado.' }
  }
  revalidatePath(`/p/${rc.profile.slug}`)
  revalidatePath('/panel')
  return { ok: `Reseña publicada en el perfil de ${rc.profile.displayName}. Gracias por ayudar a la comunidad.` }
}

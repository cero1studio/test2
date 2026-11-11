'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getUser } from '@/lib/auth'
import { REPORT_REASONS, type ActionState } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewer } from '@/lib/geo'
import { isHiddenFrom, isPublic, RATE_WINDOW_DAYS } from '@/lib/profiles'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { parseList } from '@/lib/services'

export async function confirmAge() {
  ;(await cookies()).set('adulto', '1', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
}

/** El número no viaja en el HTML: se entrega bajo demanda y con límite por IP. */
export async function revealContact(profileId: string): Promise<{ whatsapp?: string; error?: string }> {
  if (!rateLimit(`contact:${await clientIp()}`, 15, 60 * 60_000)) return { error: 'Has consultado muchos contactos. Intenta más tarde.' }
  const p = await db.profile.findUnique({ where: { id: profileId } })
  if (!p || !isPublic(p) || isHiddenFrom(p, await viewer())) return { error: 'Perfil no disponible.' }
  if (p.discreet && !(await getUser())) return { error: 'Este perfil solo comparte su contacto con miembros. Crea una cuenta gratis.' }
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

const normalizeCode = (v: unknown) => String(v ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

export async function goToEncounter(fd: FormData) {
  redirect(`/e/${normalizeCode(fd.get('code')) || '0'}`)
}

/** El cliente confirma en persona el código que le muestra la anunciante. */
export async function confirmEncounter(rawCode: string, _: ActionState, __: FormData): Promise<ActionState> {
  const user = await getUser()
  if (!user || user.role !== 'CLIENT') return { error: 'Ingresa con una cuenta de cliente para confirmar.' }
  if (!rateLimit(`enc:${user.id}`, 10, 60 * 60_000)) return { error: 'Demasiados intentos. Prueba más tarde.' }
  const enc = await db.encounter.findUnique({ where: { code: normalizeCode(rawCode) } })
  if (!enc || enc.clientId || enc.expiresAt < new Date()) return { error: 'El código no existe, ya se usó o venció. Pide uno nuevo.' }
  const recent = await db.encounter.findFirst({
    where: { profileId: enc.profileId, clientId: user.id, confirmedAt: { gt: new Date(Date.now() - 7 * 864e5) } },
  })
  if (recent) return { error: 'Ya registraste un encuentro con este perfil en los últimos 7 días.' }
  const claimed = await db.encounter.updateMany({
    where: { id: enc.id, clientId: null },
    data: { clientId: user.id, confirmedAt: new Date() },
  })
  if (claimed.count !== 1) return { error: 'El código ya fue usado.' }
  revalidatePath('/panel')
  redirect('/panel?encuentro=ok')
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(20, 'Escribe al menos 20 caracteres.').max(1500),
})

export async function submitReview(encounterId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getUser()
  if (!user || user.role !== 'CLIENT') return { error: 'Solo las cuentas de cliente pueden reseñar.' }
  const parsed = reviewSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const enc = await db.encounter.findFirst({
    where: {
      id: encounterId, clientId: user.id, review: null,
      confirmedAt: { gt: new Date(Date.now() - RATE_WINDOW_DAYS * 864e5) },
    },
    include: { profile: true },
  })
  if (!enc) return { error: 'Este encuentro ya no se puede reseñar.' }
  // Calificación por servicio: solo los que el perfil ofrece y el cliente marcó.
  const serviceRatings: Record<string, number> = {}
  for (const key of parseList(enc.profile.services)) {
    const v = Math.trunc(Number(fd.get(`svc_${key}`)))
    if (v >= 1 && v <= 5) serviceRatings[key] = v
  }
  await db.review.create({
    data: {
      encounterId: enc.id, profileId: enc.profileId, authorId: user.id, ...parsed.data,
      serviceRatings: JSON.stringify(serviceRatings),
      photosMatch: fd.get('photosMatch') === 'on',
      askedDeposit: fd.get('askedDeposit') === 'on',
      visibility: fd.get('visibility') === 'PUBLIC' ? 'PUBLIC' : 'MEMBERS',
    },
  })
  // Se redirige porque el formulario desaparece al guardar: el aviso vive en el panel.
  redirect(`/panel?sello=${enc.publicId}`)
}

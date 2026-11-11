'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { CATEGORIES, CITIES, type ActionState } from '@/lib/constants'
import { db } from '@/lib/db'
import { RATE_WINDOW_DAYS, randomCode, slugify } from '@/lib/profiles'
import { REGIONS } from '@/lib/regions'
import { depositLanguage } from '@/lib/scam'
import { SERVICES, toList } from '@/lib/services'
import { deleteImage, saveImage, savePhoto } from '@/lib/storage'

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Nombre muy corto.').max(40),
  age: z.coerce.number().int().min(18, 'Solo se permiten personas mayores de 18 años.').max(99),
  city: z.enum(CITIES, 'Ciudad inválida.'),
  zone: z.string().trim().max(60),
  category: z.enum(CATEGORIES, 'Categoría inválida.'),
  description: z.string().trim().min(40, 'Describe tu servicio con al menos 40 caracteres.').max(2000),
  priceFrom: z.coerce.number().int().min(10_000, 'Tarifa mínima inválida.').max(50_000_000),
  whatsapp: z.string().trim().regex(/^\+?\d{10,13}$/, 'WhatsApp inválido: usa solo números, p. ej. 573001234567.'),
})

async function ownProfile() {
  const user = await requireUser('ADVERTISER')
  return { user, profile: await db.profile.findUnique({ where: { userId: user.id } }) }
}

export async function saveProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { user, profile } = await ownProfile()
  const parsed = profileSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Adicionales configurables: hasta 8 filas de nombre + precio.
  const labels = fd.getAll('extraLabel').map((v) => String(v).trim().slice(0, 40))
  const prices = fd.getAll('extraPrice').map((v) => Math.max(0, Math.trunc(Number(v)) || 0))
  const extras = labels.map((label, i) => ({ label, price: prices[i] ?? 0 })).filter((e) => e.label).slice(0, 8)

  // Señales de estafa que se frenan antes de publicar.
  const flagged = depositLanguage([parsed.data.description, ...extras.map((e) => e.label)].join(' '))
  if (flagged) return { error: `Tu anuncio menciona «${flagged}». Aquí está prohibido pedir dinero antes del encuentro: quítalo para guardar.` }
  const sameNumber = await db.profile.findFirst({ where: { whatsapp: parsed.data.whatsapp, userId: { not: user.id } } })
  if (sameNumber) return { error: 'Ese número de WhatsApp ya está en otro perfil. Cada número solo puede anunciar un perfil.' }

  const data = {
    ...parsed.data,
    kind: fd.get('kind') === 'AGENCY' ? 'AGENCY' : 'INDEPENDENT',
    services: toList(fd.getAll('service').map(String).filter((k) => SERVICES.some((x) => x.key === k))),
    extras: JSON.stringify(extras),
    incall: fd.get('incall') === 'on',
    outcall: fd.get('outcall') === 'on',
  }
  if (profile) {
    await db.profile.update({ where: { id: profile.id }, data })
  } else {
    await db.profile.create({
      data: {
        ...data,
        userId: user.id,
        slug: `${slugify(parsed.data.displayName) || 'perfil'}-${randomCode(5).toLowerCase()}`,
        verifyCode: `SGL-${randomCode(5)}`,
      },
    })
  }
  revalidatePath('/panel')
  return { ok: 'Perfil guardado.' }
}

export async function savePrivacy(_: ActionState, fd: FormData): Promise<ActionState> {
  const { profile } = await ownProfile()
  if (!profile) return { error: 'Primero guarda tu perfil.' }
  const blocked = fd.getAll('blocked').filter((c) => REGIONS.some((r) => r.code === c))
  await db.profile.update({
    where: { id: profile.id },
    data: { discreet: fd.get('discreet') === 'on', foreignersOnly: fd.get('foreignersOnly') === 'on', blockedRegions: blocked.length ? `,${blocked.join(',')},` : '' },
  })
  revalidatePath('/panel')
  return { ok: 'Privacidad actualizada. Aplica de inmediato.' }
}

export async function saveSchedule(_: ActionState, fd: FormData): Promise<ActionState> {
  const { profile } = await ownProfile()
  if (!profile) return { error: 'Primero guarda tu perfil.' }
  const days = fd.getAll('day').map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  const hour = (k: string) => Math.min(23, Math.max(0, Math.trunc(Number(fd.get(k))) || 0))
  await db.profile.update({
    where: { id: profile.id },
    data: { scheduleDays: days.length ? `,${days.join(',')},` : '', scheduleFrom: hour('from'), scheduleTo: hour('to') },
  })
  revalidatePath('/panel')
  return { ok: 'Horario guardado.' }
}

/** hours = 0 apaga la disponibilidad. Siempre vence sola (máximo 12 h). */
export async function setAvailability(hours: number) {
  const { profile } = await ownProfile()
  if (!profile) return
  const h = Math.min(12, Math.max(0, Math.trunc(hours)))
  await db.profile.update({
    where: { id: profile.id },
    data: { availableUntil: h ? new Date(Date.now() + h * 3600_000) : null, lastSeenAt: new Date() },
  })
  revalidatePath('/panel')
}

export async function uploadPhoto(_: ActionState, fd: FormData): Promise<ActionState> {
  const { profile } = await ownProfile()
  if (!profile) return { error: 'Primero guarda tu perfil.' }
  if ((await db.photo.count({ where: { profileId: profile.id, kind: 'GALLERY' } })) >= 12) return { error: 'Máximo 12 fotos.' }
  try {
    await db.photo.create({ data: { profileId: profile.id, ...(await savePhoto(fd.get('photo'))) } })
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath('/panel')
  return { ok: 'Foto subida. Será visible cuando moderación la apruebe.' }
}

/** Historia: una foto que dura 24 h desde que moderación la aprueba. */
export async function uploadStory(_: ActionState, fd: FormData): Promise<ActionState> {
  const { profile } = await ownProfile()
  if (!profile?.identityVerifiedAt) return { error: 'Verifica tu identidad para publicar historias.' }
  const live = await db.photo.count({
    where: { profileId: profile.id, kind: 'STORY', OR: [{ status: 'PENDING' }, { expiresAt: { gt: new Date() } }] },
  })
  if (live >= 5) return { error: 'Máximo 5 historias activas a la vez.' }
  try {
    await db.photo.create({ data: { profileId: profile.id, kind: 'STORY', ...(await savePhoto(fd.get('photo'))) } })
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath('/panel')
  return { ok: 'Historia enviada. Dura 24 horas desde que moderación la apruebe.' }
}

export async function deletePhoto(photoId: string) {
  const { profile } = await ownProfile()
  const photo = await db.photo.findFirst({ where: { id: photoId, profileId: profile?.id ?? '' } })
  if (!photo) return
  await db.photo.delete({ where: { id: photo.id } })
  await deleteImage(photo.file, photo.blurFile)
  revalidatePath('/panel')
}

export async function submitVerification(_: ActionState, fd: FormData): Promise<ActionState> {
  const { profile } = await ownProfile()
  if (!profile) return { error: 'Primero guarda tu perfil.' }
  if (await db.verification.findFirst({ where: { profileId: profile.id, status: 'PENDING' } })) {
    return { error: 'Ya tienes una solicitud en revisión.' }
  }
  if (fd.get('consent') !== 'on') return { error: 'Debes autorizar el tratamiento de tus datos para verificarte.' }
  let docFile: string | undefined
  try {
    docFile = await saveImage(fd.get('doc'))
    const selfieFile = await saveImage(fd.get('selfie'))
    await db.verification.create({ data: { profileId: profile.id, code: profile.verifyCode, docFile, selfieFile } })
  } catch (e) {
    await deleteImage(docFile)
    return { error: (e as Error).message }
  }
  revalidatePath('/panel')
  return { ok: 'Solicitud enviada. Te avisaremos cuando sea revisada.' }
}

export async function setPublished(publish: boolean) {
  const { profile } = await ownProfile()
  if (!profile || !['DRAFT', 'ACTIVE', 'PAUSED'].includes(profile.status)) return
  if (publish) {
    const approved = await db.photo.count({ where: { profileId: profile.id, status: 'APPROVED' } })
    if (!profile.identityVerifiedAt || approved === 0) return
  }
  await db.profile.update({
    where: { id: profile.id },
    data: { status: publish ? 'ACTIVE' : 'PAUSED', ...(!publish && { availableUntil: null }) },
  })
  revalidatePath('/panel')
}

/** Código presencial: la anunciante lo muestra al cliente durante el encuentro. */
export async function openEncounter() {
  const { profile } = await ownProfile()
  if (!profile?.identityVerifiedAt) return
  const now = new Date()
  const active = await db.encounter.findFirst({ where: { profileId: profile.id, clientId: null, expiresAt: { gt: now } } })
  const today = await db.encounter.count({ where: { profileId: profile.id, createdAt: { gt: new Date(now.getTime() - 864e5) } } })
  if (active || today >= 8) return
  await db.encounter.create({
    data: {
      profileId: profile.id,
      code: randomCode(6),
      publicId: `ENC-${randomCode(7)}`,
      expiresAt: new Date(now.getTime() + 15 * 60_000),
    },
  })
  revalidatePath('/panel')
}

export async function rateClient(encounterId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { profile } = await ownProfile()
  const rating = Math.trunc(Number(fd.get('rating')))
  if (!profile || !(rating >= 1 && rating <= 5)) return { error: 'Elige una calificación.' }
  const enc = await db.encounter.findFirst({
    where: {
      id: encounterId, profileId: profile.id, clientId: { not: null }, clientRating: null,
      confirmedAt: { gt: new Date(Date.now() - RATE_WINDOW_DAYS * 864e5) },
    },
  })
  if (!enc?.clientId) return { error: 'Este encuentro ya no se puede calificar.' }
  await db.clientRating.create({
    data: {
      encounterId: enc.id, clientId: enc.clientId, profileId: profile.id, rating,
      respectful: fd.get('respectful') === 'on',
      paidAsAgreed: fd.get('paidAsAgreed') === 'on',
      punctual: fd.get('punctual') === 'on',
    },
  })
  redirect('/panel?calificado=1')
}

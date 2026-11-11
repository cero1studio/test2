'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { CATEGORIES, CITIES, type ActionState } from '@/lib/constants'
import { REGIONS } from '@/lib/regions'
import { db } from '@/lib/db'
import { randomCode, slugify } from '@/lib/profiles'
import { deleteImage, saveImage } from '@/lib/storage'

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
  const blocked = fd.getAll('blocked').filter((c) => REGIONS.some((r) => r.code === c))
  const data = { ...parsed.data, blockedRegions: blocked.length ? `,${blocked.join(',')},` : '' }
  if (profile) {
    await db.profile.update({ where: { id: profile.id }, data })
    revalidatePath(`/p/${profile.slug}`)
  } else {
    await db.profile.create({
      data: {
        ...data,
        userId: user.id,
        slug: `${slugify(parsed.data.displayName) || 'perfil'}-${randomCode(5).toLowerCase()}`,
        verifyCode: `VRZ-${randomCode(5)}`,
      },
    })
  }
  revalidatePath('/panel')
  return { ok: 'Perfil guardado.' }
}

export async function uploadPhoto(_: ActionState, fd: FormData): Promise<ActionState> {
  const { profile } = await ownProfile()
  if (!profile) return { error: 'Primero guarda tu perfil.' }
  if ((await db.photo.count({ where: { profileId: profile.id } })) >= 12) return { error: 'Máximo 12 fotos.' }
  try {
    await db.photo.create({ data: { profileId: profile.id, file: await saveImage(fd.get('photo')) } })
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath('/panel')
  return { ok: 'Foto subida. Será visible cuando moderación la apruebe.' }
}

export async function deletePhoto(photoId: string) {
  const { profile } = await ownProfile()
  const photo = await db.photo.findFirst({ where: { id: photoId, profileId: profile?.id ?? '' } })
  if (!photo) return
  await db.photo.delete({ where: { id: photo.id } })
  await deleteImage(photo.file)
  revalidatePath('/panel')
}

export async function submitVerification(_: ActionState, fd: FormData): Promise<ActionState> {
  const { profile } = await ownProfile()
  if (!profile) return { error: 'Primero guarda tu perfil.' }
  if (await db.verification.findFirst({ where: { profileId: profile.id, status: 'PENDING' } })) {
    return { error: 'Ya tienes una solicitud en revisión.' }
  }
  if (fd.get('consent') !== 'on') return { error: 'Debes aceptar el tratamiento de tus datos para verificarte.' }
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
  await db.profile.update({ where: { id: profile.id }, data: { status: publish ? 'ACTIVE' : 'PAUSED' } })
  revalidatePath('/panel')
}

export async function createReviewCode() {
  const { profile } = await ownProfile()
  if (!profile?.identityVerifiedAt) return
  const today = await db.reviewCode.count({
    where: { profileId: profile.id, createdAt: { gt: new Date(Date.now() - 864e5) } },
  })
  if (today >= 5) return
  const raw = randomCode(8)
  await db.reviewCode.create({
    data: {
      profileId: profile.id,
      code: `${raw.slice(0, 4)}-${raw.slice(4)}`,
      expiresAt: new Date(Date.now() + 7 * 864e5),
    },
  })
  revalidatePath('/panel')
}

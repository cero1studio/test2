'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteImage } from '@/lib/storage'

export async function reviewVerification(id: string, fd: FormData) {
  await requireUser('ADMIN')
  const v = await db.verification.findUnique({ where: { id } })
  if (!v || v.status !== 'PENDING') return
  const decision = String(fd.get('decision'))
  const approved = decision === 'identity' || decision === 'identity+photos'
  const now = new Date()
  await db.$transaction([
    db.verification.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        note: String(fd.get('note') ?? '').slice(0, 500),
        reviewedAt: now,
        docFile: null,
        selfieFile: approved ? v.selfieFile : null,
      },
    }),
    ...(approved
      ? [db.profile.update({
          where: { id: v.profileId },
          data: { identityVerifiedAt: now, ...(decision === 'identity+photos' && { photosVerifiedAt: now }) },
        })]
      : []),
  ])
  // Minimización de datos: el documento nunca se conserva tras la revisión.
  await deleteImage(v.docFile, approved ? null : v.selfieFile)
  revalidatePath('/admin')
}

export async function reviewPhoto(id: string, approve: boolean) {
  await requireUser('ADMIN')
  const photo = await db.photo.findUnique({ where: { id } })
  if (!photo) return
  if (approve) {
    await db.photo.update({
      where: { id },
      data: { status: 'APPROVED', ...(photo.kind === 'STORY' && { expiresAt: new Date(Date.now() + 864e5) }) },
    })
  } else {
    await db.photo.delete({ where: { id } })
    await deleteImage(photo.file, photo.blurFile)
  }
  revalidatePath('/admin')
}

export async function resolveReport(id: string, outcome: 'dismiss' | 'suspend') {
  await requireUser('ADMIN')
  const report = await db.report.findUnique({ where: { id }, include: { profile: true } })
  if (!report || report.status !== 'OPEN') return
  if (outcome === 'suspend') {
    // Suspender cierra todas las denuncias abiertas del perfil.
    await db.$transaction([
      db.report.updateMany({ where: { profileId: report.profileId, status: 'OPEN' }, data: { status: 'RESOLVED' } }),
      db.profile.update({ where: { id: report.profileId }, data: { status: 'SUSPENDED', availableUntil: null } }),
    ])
  } else {
    await db.report.update({ where: { id }, data: { status: 'DISMISSED' } })
    const open = await db.report.count({ where: { profileId: report.profileId, status: 'OPEN' } })
    if (open === 0 && report.profile.status === 'REVIEW') {
      await db.profile.update({ where: { id: report.profileId }, data: { status: 'ACTIVE' } })
    }
  }
  revalidatePath('/admin')
}

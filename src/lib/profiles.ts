import type { Prisma } from '@prisma/client'
import { computeTrust } from './trust'

/** Un perfil solo es público si está activo Y su identidad (18+) fue verificada. */
export const publicWhere = { status: 'ACTIVE', identityVerifiedAt: { not: null } } satisfies Prisma.ProfileWhereInput

/** Filtro de listados: perfiles públicos que no bloquearon la región del visitante. */
export const visibleWhere = (region: string | null) =>
  ({
    ...publicWhere,
    // Sin ubicación conocida solo se muestran perfiles sin bloqueos (privacidad primero).
    ...(region ? { NOT: { blockedRegions: { contains: `,${region},` } } } : { blockedRegions: '' }),
  }) satisfies Prisma.ProfileWhereInput

export const isBlockedIn = (p: { blockedRegions: string }, region: string | null) =>
  p.blockedRegions !== '' && (!region || p.blockedRegions.includes(`,${region},`))

export const isPublic = (p: { status: string; identityVerifiedAt: Date | null }) =>
  p.status === 'ACTIVE' && p.identityVerifiedAt !== null

export const cardInclude = {
  photos: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'asc' } },
  reviews: { where: { status: 'VISIBLE' }, select: { rating: true, photosMatch: true, askedDeposit: true } },
  _count: { select: { reports: { where: { status: 'OPEN' } } } },
} satisfies Prisma.ProfileInclude

export type CardProfile = Prisma.ProfileGetPayload<{ include: typeof cardInclude }>

export const trustOf = (p: CardProfile) =>
  computeTrust({
    identity: !!p.identityVerifiedAt,
    photos: !!p.photosVerifiedAt,
    reviews: p.reviews,
    createdAt: p.createdAt,
    openReports: p._count.reports,
  })

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export function randomCode(len: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

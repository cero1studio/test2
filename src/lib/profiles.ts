import type { Prisma } from '@prisma/client'
import { computeTrust } from './trust'

/** Un perfil solo es público si está activo Y su identidad (18+) fue verificada. */
export const publicWhere = { status: 'ACTIVE', identityVerifiedAt: { not: null } } satisfies Prisma.ProfileWhereInput

type ViewerLike = { region: string | null; foreign: boolean }

/** Filtro de listados: perfiles públicos que este visitante puede ver. */
export const visibleWhere = (v: ViewerLike) =>
  ({
    ...publicWhere,
    // Sin ubicación conocida solo se muestran perfiles sin bloqueos (privacidad primero).
    ...(v.region ? { NOT: { blockedRegions: { contains: `,${v.region},` } } } : { blockedRegions: '' }),
    ...(!v.foreign && { foreignersOnly: false }),
  }) satisfies Prisma.ProfileWhereInput

export const isHiddenFrom = (p: { blockedRegions: string; foreignersOnly: boolean }, v: ViewerLike) =>
  (p.blockedRegions !== '' && (!v.region || p.blockedRegions.includes(`,${v.region},`))) || (p.foreignersOnly && !v.foreign)

export const isPublic = (p: { status: string; identityVerifiedAt: Date | null }) =>
  p.status === 'ACTIVE' && p.identityVerifiedAt !== null

/**
 * Calificación a ciegas: lo que una parte escribe solo se publica cuando la
 * otra también calificó, o pasados 7 días. Así nadie califica por represalia.
 */
export const RELEASE_DAYS = 7
export const RATE_WINDOW_DAYS = 14
const releaseCutoff = () => new Date(Date.now() - RELEASE_DAYS * 864e5)

export const releasedReviewWhere = () =>
  ({
    status: 'VISIBLE',
    OR: [{ encounter: { clientRating: { isNot: null } } }, { encounter: { confirmedAt: { lt: releaseCutoff() } } }],
  }) satisfies Prisma.ReviewWhereInput

export const releasedRatingWhere = () =>
  ({
    OR: [{ encounter: { review: { isNot: null } } }, { encounter: { confirmedAt: { lt: releaseCutoff() } } }],
  }) satisfies Prisma.ClientRatingWhereInput

export const cardInclude = () =>
  ({
    photos: { where: { status: 'APPROVED', kind: 'GALLERY' }, orderBy: { createdAt: 'asc' } },
    reviews: { where: releasedReviewWhere(), select: { rating: true, photosMatch: true, askedDeposit: true, serviceRatings: true } },
    _count: { select: { reports: { where: { status: 'OPEN' } }, encounters: { where: { confirmedAt: { not: null } } } } },
  }) satisfies Prisma.ProfileInclude

export type CardProfile = Prisma.ProfileGetPayload<{ include: ReturnType<typeof cardInclude> }>

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

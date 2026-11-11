// Datos de demostración. Los "retratos" son ilustraciones generadas: no hay fotos de personas reales.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { savePhoto } from '../src/lib/storage'

const db = new PrismaClient()
const ago = (d: number, h = 0) => new Date(Date.now() - d * 864e5 - h * 36e5)
const inHours = (h: number) => new Date(Date.now() + h * 36e5)
const deburr = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type Demo = {
  name: string; age: number; city: string; zone: string; cat: string; price: number; hue: number; months: number
  photos: boolean; ratings: number[]; kind?: string; services: string[]; tags: string[]; request?: boolean; story?: boolean; foreign?: boolean; blocked?: string; discreet?: boolean; availH?: number; seenH: number; days: string; from: number; to: number
}
const DEMO: Demo[] = [
  { name: 'Valentina', tags: ['tatuajes','morena','conversadora','alta'], services: ['cena','masaje','pareja','noche'], story: true, age: 26, city: 'Bogotá', zone: 'Chapinero', cat: 'Mujeres', price: 250000, hue: 335, months: 9, photos: true, ratings: [5, 5, 4, 5, 5, 5], availH: 3, seenH: 0, days: ',1,2,3,4,5,6,', from: 14, to: 23 },
  { name: 'Camila', tags: ['elegante','rubia','alta'], services: ['cena','viajes','pareja'], age: 29, city: 'Medellín', zone: 'El Poblado', cat: 'Mujeres', price: 300000, hue: 275, months: 5, photos: true, ratings: [5, 4, 5], blocked: ',VAC,EXT,', discreet: true, availH: 2, seenH: 0, days: ',4,5,6,0,', from: 18, to: 2 },
  { name: 'Sara', tags: ['bajita','rizada','risuena','natural'], services: ['masaje','pareja'], story: true, age: 24, city: 'Cali', zone: 'Granada', cat: 'Mujeres', price: 180000, hue: 18, months: 2, photos: true, ratings: [4, 5], seenH: 5, days: ',1,2,3,4,5,', from: 10, to: 18 },
  { name: 'Mateo', tags: ['deportiva','tatuajes','alta'], request: true, services: ['cena','masaje','parejas'], story: true, age: 31, city: 'Bogotá', zone: 'Usaquén', cat: 'Hombres', price: 220000, hue: 205, months: 7, photos: true, ratings: [5, 5, 5, 4], availH: 6, seenH: 0, days: ',0,1,2,3,4,5,6,', from: 0, to: 0 },
  { name: 'Luna', tags: ['gotica','color','piercings','tatuajes'], services: ['masaje','videollamada'], age: 27, city: 'Barranquilla', zone: 'Norte', cat: 'Trans', price: 200000, hue: 165, months: 4, photos: true, ratings: [5], seenH: 30, days: ',5,6,', from: 20, to: 4 },
  { name: 'Isabella', tags: ['curvy','morena','extrovertida'], services: ['cena','viajes'], foreign: true, age: 23, city: 'Cartagena', zone: 'Bocagrande', cat: 'Mujeres', price: 350000, hue: 42, months: 1, photos: false, ratings: [], seenH: 2, days: '', from: 0, to: 0 },
  { name: 'Daniela', tags: ['pelirroja','gafas','timida'], services: ['masaje','pareja','noche'], age: 30, city: 'Medellín', zone: 'Laureles', cat: 'Mujeres', price: 240000, hue: 305, months: 12, photos: true, ratings: [5, 5, 3, 5, 4, 5, 5, 5], blocked: ',DC,', seenH: 1, days: ',1,2,3,4,5,6,', from: 12, to: 22 },
  { name: 'Andrés', tags: ['deportiva','conversadora'], services: ['masaje'], kind: 'AGENCY', age: 28, city: 'Pereira', zone: 'Centro', cat: 'Hombres', price: 160000, hue: 232, months: 3, photos: false, ratings: [4], seenH: 80, days: ',6,0,', from: 15, to: 23 },
  { name: 'Mariana', tags: ['gotica','delgada','piercings'], services: ['cena','pareja','videollamada'], story: true, age: 25, city: 'Bogotá', zone: 'Zona T', cat: 'Mujeres', price: 280000, hue: 355, months: 6, photos: true, ratings: [5, 5, 5], discreet: true, seenH: 0, availH: 1, days: ',2,3,4,5,6,', from: 16, to: 24 % 24 },
]

// Ilustración abstracta: silueta sobre degradado, con grano. Variantes por foto.
const portrait = (hue: number, v: number) => {
  const h2 = hue + 40 + v * 18
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125" viewBox="0 0 900 1125">
  <defs>
    <linearGradient id="g" x1="${v % 2}" y1="0" x2="${1 - (v % 2)}" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 78% ${52 - v * 4}%)"/><stop offset="1" stop-color="hsl(${h2} 62% 16%)"/>
    </linearGradient>
    <radialGradient id="l" cx="${0.3 + v * 0.2}" cy="0.25" r="0.7"><stop offset="0" stop-color="white" stop-opacity=".35"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 40% 12%)" stop-opacity=".75"/><stop offset="1" stop-color="hsl(${hue} 50% 6%)" stop-opacity=".95"/></linearGradient>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/></filter>
  </defs>
  <rect width="900" height="1125" fill="url(#g)"/><rect width="900" height="1125" fill="url(#l)"/>
  <g transform="translate(${v * 40 - 40} ${v * 20})" fill="url(#s)">
    <ellipse cx="450" cy="430" rx="128" ry="150"/>
    <path d="M300 420c-10-150 80-230 160-230s180 70 150 250c-10 70 10 190 40 250H270c40-80 40-190 30-270z" opacity=".8"/>
    <path d="M150 1125c10-230 130-360 300-360s290 130 300 360z"/>
  </g>
  <rect width="900" height="1125" filter="url(#n)"/>
</svg>`)
}

async function main() {
  // En despliegues: `--if-empty` carga la demo solo la primera vez.
  if (process.argv.includes('--if-empty') && (await db.user.count()) > 0) return console.log('Base con datos: se omite la demo.')
  for (const m of ['favorite', 'contactRequest', 'clientRating', 'review', 'encounter', 'report', 'verification', 'photo', 'profile', 'session', 'user'] as const) {
    await (db[m] as { deleteMany: () => Promise<unknown> }).deleteMany()
  }
  const hash = (pw: string) => bcrypt.hash(pw, 10)
  const adminPw = process.env.SEED_ADMIN_PASSWORD ?? 'cambia-esto-123'
  await db.user.create({ data: { email: 'admin@sigila.test', handle: 'moderacion', role: 'ADMIN', passwordHash: await hash(adminPw) } })
  const clientHash = await hash('demo-cliente-123')
  const clients = await Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
      db.user.create({ data: { email: `cliente${i}@sigila.test`, handle: `cliente-demo${i}`, role: 'CLIENT', passwordHash: clientHash, createdAt: ago(200 - i * 10) } })),
  )
  const advHash = await hash('demo-anunciante-123')
  let seq = 0

  for (const [i, d] of DEMO.entries()) {
    const created = ago(d.months * 30)
    const user = await db.user.create({
      data: { email: `anunciante${i + 1}@sigila.test`, handle: `perfil-demo${i + 1}`, role: 'ADVERTISER', passwordHash: advHash, createdAt: created },
    })
    const profile = await db.profile.create({
      data: {
        userId: user.id, slug: `${deburr(d.name)}-demo${i + 1}`, displayName: d.name, age: d.age, city: d.city, zone: d.zone,
        category: d.cat, priceFrom: d.price, whatsapp: `57300555${1000 + i}`, verifyCode: `SGL-DEMO${i + 1}`, status: 'ACTIVE',
        createdAt: created, blockedRegions: d.blocked ?? '', discreet: !!d.discreet,
        availableUntil: d.availH ? inHours(d.availH) : null, lastSeenAt: ago(0, d.seenH),
        scheduleDays: d.days, scheduleFrom: d.from, scheduleTo: d.to,
        identityVerifiedAt: created, photosVerifiedAt: d.photos ? created : null,
        tags: `,${d.tags.join(',')},`, contactMode: d.request ? 'REQUEST' : 'DIRECT',
        kind: d.kind ?? 'INDEPENDENT', services: `,${d.services.join(',')},`, foreignersOnly: !!d.foreign,
        incall: i % 3 !== 1, outcall: i % 2 === 0,
        extras: JSON.stringify([{ label: 'Hora adicional', price: Math.round((d.price * 0.8) / 10000) * 10000 }, { label: 'Lencería a elección', price: 0 }, { label: 'Cena previa', price: 60000 }].slice(0, 2 + (i % 2))),
        description: `Perfil de demostración. Acompañante independiente en ${d.city}. Trato respetuoso, puntualidad y discreción. Atiendo con cita previa; escríbeme por WhatsApp para coordinar.`,
      },
    })
    for (const v of [0, 1, 2]) {
      await db.photo.create({ data: { profileId: profile.id, status: 'APPROVED', ...(await savePhoto(portrait(d.hue, v))) } })
    }
    if (d.story) {
      for (const v of [3, 4]) {
        await db.photo.create({ data: { profileId: profile.id, kind: 'STORY', status: 'APPROVED', expiresAt: inHours(20 - v), ...(await savePhoto(portrait(d.hue + 20, v))) } })
      }
    }
    for (const [j, rating] of d.ratings.entries()) {
      const at = ago(3 + j * 9)
      const client = clients[(i + j) % clients.length]
      const n = String(1000 + seq++)
      const enc = await db.encounter.create({
        data: { profileId: profile.id, clientId: client.id, code: `DEMOCODE${n}`, pin: '0000', publicId: `ENC-DEMO${n}`, createdAt: at, expiresAt: at, confirmedAt: at },
      })
      await db.review.create({
        data: {
          encounterId: enc.id, profileId: profile.id, authorId: client.id, rating, createdAt: at,
          serviceRatings: JSON.stringify(Object.fromEntries(d.services.slice(0, 1 + (j % 2)).map((k, n) => [k, Math.max(3, rating - n)]))),
          photosMatch: rating >= 4, askedDeposit: false, visibility: j % 3 === 1 ? 'MEMBERS' : 'PUBLIC',
          body: rating >= 4
            ? 'Reseña de demostración: llegó puntual, es la persona de las fotos y todo fue como se acordó. Sin anticipos.'
            : 'Reseña de demostración: buen trato, pero las fotos se veían algo distintas a la realidad.',
        },
      })
      await db.clientRating.create({
        data: { encounterId: enc.id, clientId: client.id, profileId: profile.id, rating: 5, respectful: true, paidAsAgreed: true, punctual: j % 4 !== 3, createdAt: at },
      })
    }
  }
  const [valentina, mateo, sara] = await Promise.all(['valentina-demo1', 'mateo-demo4', 'sara-demo3'].map((slug) => db.profile.findUniqueOrThrow({ where: { slug } })))
  await db.favorite.createMany({ data: [valentina, mateo, sara].map((p) => ({ userId: clients[0].id, profileId: p.id })) })
  await db.contactRequest.create({ data: { profileId: valentina.id, clientId: clients[1].id, message: 'Hola Valentina, vi tu perfil verificado en Sigila.\nMe interesa: Cenas y eventos.\nCuándo: Mañana.\n¿Tienes disponibilidad?' } })
  console.log(`Seed listo. Moderación: admin@sigila.test / ${adminPw}`)
  console.log('Cliente: cliente1@sigila.test / demo-cliente-123 · Anunciante: anunciante1@sigila.test / demo-anunciante-123')
}

main().finally(() => db.$disconnect())

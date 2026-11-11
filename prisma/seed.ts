// Datos de demostración. Los "retratos" son degradados generados: no hay fotos de personas reales.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { saveBuffer } from '../src/lib/storage'

const db = new PrismaClient()
const days = (n: number) => new Date(Date.now() - n * 864e5)

const DEMO = [
  { name: 'Valentina', age: 26, city: 'Bogotá', zone: 'Chapinero', cat: 'Mujeres', price: 250000, hue: 330, months: 9, photos: true, reviews: [5, 5, 4, 5, 5, 5], blocked: '' },
  { name: 'Camila', age: 29, city: 'Medellín', zone: 'El Poblado', cat: 'Mujeres', price: 300000, hue: 280, months: 5, photos: true, reviews: [5, 4, 5], blocked: ',VAC,EXT,' },
  { name: 'Sara', age: 24, city: 'Cali', zone: 'Granada', cat: 'Mujeres', price: 180000, hue: 20, months: 2, photos: true, reviews: [4, 5], blocked: '' },
  { name: 'Mateo', age: 31, city: 'Bogotá', zone: 'Usaquén', cat: 'Hombres', price: 220000, hue: 200, months: 7, photos: true, reviews: [5, 5, 5, 4], blocked: '' },
  { name: 'Luna', age: 27, city: 'Barranquilla', zone: 'Norte', cat: 'Trans', price: 200000, hue: 160, months: 4, photos: true, reviews: [5], blocked: '' },
  { name: 'Isabella', age: 23, city: 'Cartagena', zone: 'Bocagrande', cat: 'Mujeres', price: 350000, hue: 45, months: 1, photos: false, reviews: [], blocked: '' },
  { name: 'Daniela', age: 30, city: 'Medellín', zone: 'Laureles', cat: 'Mujeres', price: 240000, hue: 300, months: 12, photos: true, reviews: [5, 5, 3, 5, 4, 5, 5, 5], blocked: ',DC,' },
  { name: 'Andrés', age: 28, city: 'Pereira', zone: 'Centro', cat: 'Hombres', price: 160000, hue: 230, months: 3, photos: false, reviews: [4], blocked: '' },
]

const portrait = (name: string, hue: number, shift: number) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue + shift} 70% 45%)"/><stop offset="1" stop-color="hsl(${hue + shift + 50} 60% 18%)"/>
  </linearGradient></defs>
  <rect width="800" height="1000" fill="url(#g)"/>
  <circle cx="400" cy="400" r="150" fill="rgba(255,255,255,.18)"/>
  <path d="M130 1000c0-190 120-320 270-320s270 130 270 320z" fill="rgba(255,255,255,.18)"/>
  <text x="400" y="950" font-family="sans-serif" font-size="34" fill="rgba(255,255,255,.7)" text-anchor="middle">Demo · ${name}</text>
</svg>`)

async function main() {
  for (const m of ['review', 'reviewCode', 'report', 'verification', 'photo', 'profile', 'session', 'user'] as const) {
    await (db[m] as { deleteMany: () => Promise<unknown> }).deleteMany()
  }
  const hash = (pw: string) => bcrypt.hash(pw, 10)
  const adminPw = process.env.SEED_ADMIN_PASSWORD ?? 'cambia-esto-123'
  await db.user.create({ data: { email: 'admin@veraz.test', role: 'ADMIN', passwordHash: await hash(adminPw) } })
  const clients = await Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8].map(async (i) =>
      db.user.create({ data: { email: `cliente${i}@veraz.test`, role: 'CLIENT', passwordHash: await hash('demo-cliente-123') } })),
  )

  for (const [i, d] of DEMO.entries()) {
    const created = days(d.months * 30)
    const user = await db.user.create({
      data: { email: `anunciante${i + 1}@veraz.test`, role: 'ADVERTISER', passwordHash: await hash('demo-anunciante-123'), createdAt: created },
    })
    const profile = await db.profile.create({
      data: {
        userId: user.id, slug: `${d.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}-demo${i + 1}`,
        displayName: d.name, age: d.age, city: d.city, zone: d.zone, category: d.cat, priceFrom: d.price,
        whatsapp: `57300555${String(1000 + i)}`, verifyCode: `VRZ-DEMO${i + 1}`, status: 'ACTIVE', createdAt: created,
        blockedRegions: d.blocked,
        identityVerifiedAt: created, photosVerifiedAt: d.photos ? created : null,
        description: `Perfil de demostración. Acompañante independiente en ${d.city}. Trato respetuoso, puntualidad y discreción. Atiendo con cita previa; escríbeme por WhatsApp para coordinar.`,
      },
    })
    for (const shift of [0, 25, -25]) {
      await db.photo.create({ data: { profileId: profile.id, status: 'APPROVED', file: await saveBuffer(portrait(d.name, d.hue, shift)) } })
    }
    for (const [j, rating] of d.reviews.entries()) {
      const at = days(3 + j * 9)
      const code = await db.reviewCode.create({
        data: { profileId: profile.id, code: `DM${i}${j}-${String(1000 + i * 10 + j)}`, createdAt: at, expiresAt: at, usedAt: at },
      })
      await db.review.create({
        data: {
          profileId: profile.id, authorId: clients[j % clients.length].id, codeId: code.id, rating, createdAt: at,
          photosMatch: rating >= 4, askedDeposit: false,
          body: rating >= 4
            ? 'Reseña de demostración: llegó puntual, es la persona de las fotos y todo fue como se acordó. Sin anticipos.'
            : 'Reseña de demostración: buen trato, pero las fotos se veían algo distintas a la realidad.',
        },
      })
    }
  }
  console.log(`Seed listo. Admin: admin@veraz.test / ${adminPw}`)
  console.log('Cliente demo: cliente1@veraz.test / demo-cliente-123 · Anunciante demo: anunciante1@veraz.test / demo-anunciante-123')
}

main().finally(() => db.$disconnect())

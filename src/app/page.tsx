import { BadgeCheck, Clock, EyeOff, Fingerprint, MapPinOff, MessageCircle, QrCode, ScanFace, Search, ShieldCheck, Star, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { ProfileCard } from '@/components/ProfileCard'
import { StoriesBar } from '@/components/StoriesBar'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { getUser } from '@/lib/auth'
import { isAvailableNow } from '@/lib/availability'
import { APP_NAME, CITIES, citySlug } from '@/lib/constants'
import { db } from '@/lib/db'
import { viewer } from '@/lib/geo'
import { cardInclude, trustOf, visibleWhere } from '@/lib/profiles'

const FOR_HER = [
  [EyeOff, 'Modo discreto', 'Tus fotos se ven difuminadas y tu contacto queda oculto para quien no tiene cuenta.'],
  [MapPinOff, 'Tú decides dónde apareces', 'Oculta tu perfil por departamento o para quien navega desde fuera del país.'],
  [Fingerprint, 'Tu documento no se guarda', 'Se usa una sola vez para comprobar tu mayoría de edad y se elimina.'],
  [UserCheck, 'Sabes quién te escribe', 'Cada cliente tiene un pase con su reputación: respeto, puntualidad y pago.'],
] as const
const FOR_HIM = [
  [ScanFace, 'La persona de las fotos', 'Cada foto se compara con una selfie verificada antes de publicarse.'],
  [ShieldCheck, 'Cero anticipos', 'Pedir depósitos está prohibido y las reseñas registran si alguien lo hizo.'],
  [Star, 'Reseñas imposibles de inventar', 'Solo existen si hubo un encuentro confirmado en persona por ambas partes.'],
  [Clock, 'Disponibilidad real', '«Disponible ahora» vence sola: nadie queda activa por olvido.'],
] as const
const HOW = [
  [Search, 'Busca sin registrarte', 'Filtra por ciudad, servicio, tarifa y quién está disponible ahora. No pedimos nombre, correo ni teléfono.'],
  [ShieldCheck, 'Revisa antes de escribir', 'Identidad y fotos verificadas, índice de confianza y reseñas de encuentros reales, servicio por servicio.'],
  [MessageCircle, 'Contacta directo', 'Elige servicio, adicionales, lugar y hora: el mensaje de WhatsApp sale escrito. Tratas directamente con la persona.'],
] as const
const STEPS = [
  [QrCode, 'Código en persona', 'Durante el encuentro, ella genera un código QR de un solo uso y él lo confirma desde su cuenta.'],
  [Star, 'Ambos califican a ciegas', 'Ninguno ve lo que escribió el otro hasta que los dos califican, o pasan 7 días. Sin represalias.'],
  [BadgeCheck, 'Sello verificable', 'Cada reseña lleva un sello público que cualquiera puede comprobar, sin revelar identidades.'],
] as const

export default async function Home() {
  const [profiles, user, encounters] = await Promise.all([
    db.profile.findMany({ where: visibleWhere(await viewer()), include: cardInclude(), take: 100 }),
    getUser(),
    db.encounter.count({ where: { confirmedAt: { not: null } } }),
  ])
  const top = profiles
    .map((p) => ({ p, s: trustOf(p).score, a: Number(isAvailableNow(p)) }))
    .sort((x, y) => y.a - x.a || y.s - x.s)
    .slice(0, 8)
  const live = profiles.filter((p) => isAvailableNow(p)).length

  return (
    <>
      <section className="container-page grid items-center gap-12 pt-14 pb-20 md:pt-24 lg:grid-cols-[1.15fr_1fr]">
        <Reveal className="space-y-7">
          <p className="chip chip-ok"><span className="dot-live" />{live} disponibles ahora · {encounters} encuentros verificados</p>
          <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
            Discreta para <em className="grad-text">ellas.</em><br />Segura para <em className="grad-text">ellos.</em>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-mute">
            Encuentra acompañantes verificadas — mujeres, hombres y trans — y escríbeles directo por WhatsApp.
            Sin registro, sin intermediarios y sin anticipos.
          </p>
          <form action="/explorar" className="flex max-w-lg flex-col gap-2 sm:flex-row">
            <select name="ciudad" className="input" aria-label="Ciudad" defaultValue="">
              <option value="">Todas las ciudades</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary shrink-0">Buscar perfiles</button>
          </form>
        </Reveal>

        <Reveal delay={0.15} className="relative mx-auto hidden h-[26rem] w-full max-w-md lg:block" >
          <div aria-hidden className="absolute inset-8 rounded-full bg-gradient-to-br from-rose/30 to-violet-500/20 blur-3xl" />
          <div className="card absolute top-2 left-0 w-64 animate-float space-y-3 bg-surface/80" style={{ '--tilt': '-4deg' } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-gradient-to-br from-rose to-peach" />
              <div><p className="font-semibold">Valentina, 26</p><p className="flex items-center gap-1.5 text-xs text-mint"><span className="dot-live" />Disponible ahora</p></div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="chip chip-ok"><BadgeCheck className="size-3.5" />Identidad 18+</span>
              <span className="chip chip-ok">Fotos reales</span>
            </div>
          </div>
          <div className="card absolute top-36 right-0 w-72 animate-float-slow space-y-2 bg-surface/80" style={{ '--tilt': '3deg' } as React.CSSProperties}>
            <p className="text-amber">★★★★★</p>
            <p className="text-sm text-cream/90">«Llegó puntual y es exactamente la persona de las fotos.»</p>
            <p className="flex items-center gap-1.5 text-xs text-mint"><BadgeCheck className="size-3.5" />Encuentro verificado · ENC-7K3MQ2X</p>
          </div>
          <div className="card absolute bottom-0 left-10 flex w-60 animate-float items-center gap-4 bg-surface/80" style={{ '--tilt': '-2deg' } as React.CSSProperties}>
            <div className="grid size-14 place-items-center rounded-full border-4 border-mint/70"><span className="display text-xl">93</span></div>
            <div><p className="text-sm font-semibold">Confianza alta</p><p className="text-xs text-mute">No se puede comprar</p></div>
          </div>
        </Reveal>
      </section>

      <div className="overflow-hidden border-y border-white/6 py-4" aria-hidden>
        <div className="flex w-max animate-marquee gap-10 text-sm text-mute">
          {[...Array(2)].flatMap((_, i) => ['Identidad verificada', 'Fotos reales', 'Encuentros comprobados', 'Cero anticipos', 'Modo discreto', 'Disponibilidad real', 'Calificación mutua', 'Sello verificable'].map((t) => (
            <span key={`${t}${i}`} className="flex items-center gap-10">{t}<span className="text-rose">✦</span></span>
          )))}
        </div>
      </div>

      <section className="container-page space-y-4 pt-10">
        <p className="eyebrow">Historias de hoy</p>
        <StoriesBar />
      </section>

      <section className="container-page space-y-8 pt-16">
        <Reveal className="max-w-2xl space-y-3">
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="display text-4xl md:text-5xl">De la búsqueda al contacto en <em className="grad-text">un minuto</em></h2>
        </Reveal>
        <Stagger className="grid gap-5 md:grid-cols-3">
          {HOW.map(([Icon, t, d], i) => (
            <StaggerItem key={t} className="card card-hover space-y-4">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-rose/25 to-peach/15"><Icon className="size-6 text-rose" /></span>
                <span className="display text-5xl text-white/10">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="text-sm leading-relaxed text-mute">{d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="container-page grid gap-6 py-20 md:grid-cols-2">
        {([['Si anuncias', 'Privacidad', FOR_HER], ['Si buscas', 'Seguridad', FOR_HIM]] as const).map(([eyebrow, title, items], i) => (
          <Reveal key={title} delay={i * 0.1} className="card space-y-6 p-8">
            <div><p className="eyebrow">{eyebrow}</p><h2 className="display mt-2 text-4xl"><em className="grad-text">{title}</em> primero</h2></div>
            <ul className="space-y-5">
              {items.map(([Icon, t, d]) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5"><Icon className="size-5 text-rose" /></span>
                  <div><p className="font-semibold">{t}</p><p className="text-sm leading-relaxed text-mute">{d}</p></div>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </section>

      <section className="container-page space-y-10 pb-20">
        <Reveal className="max-w-2xl space-y-3">
          <p className="eyebrow">Encuentros verificados</p>
          <h2 className="display text-4xl md:text-5xl">Reseñas que solo existen si el encuentro <em className="grad-text">ocurrió</em></h2>
        </Reveal>
        <Stagger className="grid gap-5 md:grid-cols-3">
          {STEPS.map(([Icon, t, d], i) => (
            <StaggerItem key={t} className="card card-hover space-y-4">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-rose/25 to-peach/15"><Icon className="size-6 text-rose" /></span>
                <span className="display text-5xl text-white/10">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="text-sm leading-relaxed text-mute">{d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="container-page space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display text-3xl md:text-4xl">Mayor confianza</h2>
          <Link href="/explorar" className="text-sm text-rose hover:underline">Ver todos →</Link>
        </div>
        {top.length === 0 ? <p className="card text-mute">Aún no hay perfiles publicados.</p> : (
          <Stagger className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {top.map(({ p }) => <StaggerItem key={p.id}><ProfileCard p={p} member={!!user} /></StaggerItem>)}
          </Stagger>
        )}
        <nav aria-label="Ciudades" className="flex flex-wrap gap-2 pt-4">
          {CITIES.map((c) => <Link key={c} href={`/prepagos/${citySlug(c)}`} className="chip transition hover:border-white/30 hover:text-cream">{c}</Link>)}
        </nav>
      </section>

      <section className="container-page mt-20">
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-rose/20 via-surface to-violet-500/10 p-10 md:p-14">
          <div className="max-w-xl space-y-5">
            <h2 className="display text-4xl md:text-5xl">Publica sin <em className="grad-text">exponerte</em></h2>
            <p className="text-mute">Verifícate una vez, controla quién te ve y destaca por tu reputación, no por pagar más. {APP_NAME} no cobra comisión por tus encuentros.</p>
            <Link href="/registro?rol=anunciante" className="btn btn-primary">Crear mi perfil</Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}

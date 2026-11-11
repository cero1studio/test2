import type { Metadata } from 'next'
import { Reveal } from '@/components/motion'

export const metadata: Metadata = { title: 'Seguridad y reglas', alternates: { canonical: '/seguridad' } }

const CLIENTS = [
  'Nunca pagues por adelantado: ni «reserva», ni «taxi», ni recargas, ni tarjetas de regalo. Aquí está prohibido pedirlo.',
  'Prefiere perfiles con «Identidad 18+» y «Fotos reales», y revisa cuántos encuentros verificados tienen.',
  'Si te escriben desde un número distinto al del perfil diciendo ser la misma persona, desconfía y denuncia.',
  'Nadie de la plataforma te llamará para pedirte dinero, códigos o «multas». Eso es extorsión: no pagues y denuncia.',
  'Tu reseña es anónima: en el perfil nunca aparece tu alias, tu correo ni tu nombre.',
  'Al terminar, confirma el código de encuentro y cuenta cómo te fue. Así proteges al siguiente.',
]
const ADVERTISERS = [
  'Tu documento solo lo ve moderación y se elimina al terminar la revisión.',
  'Con el modo discreto, quien no tiene cuenta ve tus fotos difuminadas y no ve tu contacto.',
  'Tú decides dónde apareces: oculta tu perfil por departamento o para quien navega desde fuera del país.',
  'Borramos la ubicación de todas tus fotos y les ponemos marca de agua.',
  'Pide el pase de cliente antes de aceptar: verás si otras lo calificaron como respetuoso y cumplido.',
  'Cuéntale a alguien de confianza dónde y con quién estarás, y acuerda una hora para avisar que todo está bien.',
]
const RULES = [
  'Solo personas mayores de 18 años con identidad verificada, que anuncian de forma voluntaria e independiente.',
  'Prohibido publicar en nombre de terceros o administrar perfiles de otras personas.',
  'Prohibido pedir anticipos o depósitos antes del encuentro.',
  'Prohibidas las fotos de otra persona, editadas para engañar o tomadas de internet.',
  'La plataforma solo publica anuncios: no organiza, no intermedia y no cobra comisión por los encuentros.',
  'Una denuncia grave oculta el perfil de inmediato mientras moderación la revisa.',
]
const LINES = [
  ['Línea 141 · ICBF', 'Niñas, niños y adolescentes en riesgo o víctimas de explotación.'],
  ['Línea 122 · Fiscalía', 'Denuncia de delitos, incluidas extorsión y trata de personas.'],
  ['Línea 123', 'Emergencias: alguien está en peligro ahora.'],
  ['Te Protejo · teprotejo.org', 'Reporte en línea de explotación sexual de menores de edad.'],
]

const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-3 text-sm leading-relaxed text-cream/85">{items.map((t) => <li key={t} className="flex gap-3"><span className="text-mint">✓</span>{t}</li>)}</ul>
)

export default function Safety() {
  return (
    <div className="container-page max-w-4xl space-y-8 py-12">
      <header className="space-y-3"><p className="eyebrow">Seguridad</p><h1 className="display text-5xl">Reglas claras, <em className="grad-text">para todos</em></h1></header>
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal className="card space-y-4"><h2 className="h-section">Si buscas un servicio</h2><List items={CLIENTS} /></Reveal>
        <Reveal delay={0.1} className="card space-y-4"><h2 className="h-section">Si anuncias</h2><List items={ADVERTISERS} /></Reveal>
      </div>
      <Reveal className="card space-y-4"><h2 className="h-section">Reglas de la comunidad</h2><List items={RULES} /></Reveal>
      <section id="denunciar" className="card scroll-mt-24 space-y-4 border-rose/50">
        <h2 className="h-section">Explotación, trata o menores de edad</h2>
        <p className="text-sm leading-relaxed text-cream/85">
          La explotación sexual de niñas, niños y adolescentes y la trata de personas son delitos. Si crees que alguien
          es menor de edad o está siendo obligada, usa «Denunciar este perfil» (lo ocultamos de inmediato) y comunícate
          con las autoridades:
        </p>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {LINES.map(([name, text]) => <div key={name}><dt className="font-semibold">{name}</dt><dd className="text-mute">{text}</dd></div>)}
        </dl>
      </section>
    </div>
  )
}

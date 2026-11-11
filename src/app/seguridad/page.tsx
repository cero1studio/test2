import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Seguridad y reglas' }

const CLIENTS = [
  'Nunca pagues por adelantado: ni «reserva», ni «taxi», ni recargas, ni tarjetas de regalo. En Veraz está prohibido pedirlo.',
  'Prefiere perfiles con «Identidad 18+» y «Fotos reales», y lee las reseñas de encuentros comprobados.',
  'Si te contactan desde un número distinto al del perfil diciendo ser la misma persona, desconfía y denuncia.',
  'Nadie de Veraz te llamará para pedirte dinero, códigos o «multas». Eso es extorsión: no pagues y denuncia.',
  'Al terminar, pide tu código de reseña y cuenta cómo te fue. Así proteges al siguiente.',
]
const ADVERTISERS = [
  'Tu documento solo lo ve moderación y se elimina al terminar la revisión.',
  'Borramos la ubicación y demás metadatos de todas tus fotos.',
  'Tú decides dónde se ve tu perfil: puedes ocultarlo por departamento o para quien navega desde fuera del país.',
  'Tu número no aparece en la página: se entrega bajo demanda y con límites para frenar la copia masiva.',
  'Puedes pausar tu perfil cuando quieras, sin perder tu verificación ni tus reseñas.',
  'Cuéntale a alguien de confianza dónde y con quién estarás, y acuerda una hora para avisar que todo está bien.',
]
const RULES = [
  'Solo personas mayores de 18 años con identidad verificada, que anuncian de forma voluntaria e independiente.',
  'Prohibido publicar en nombre de terceros o gestionar perfiles de otras personas.',
  'Prohibido pedir anticipos o depósitos antes del encuentro.',
  'Prohibidas las fotos de otra persona, editadas para engañar o tomadas de internet.',
  'Una denuncia grave oculta el perfil de inmediato mientras moderación la revisa.',
]
const LINES = [
  ['Línea 141 · ICBF', 'Niñas, niños y adolescentes en riesgo o víctimas de explotación.'],
  ['Línea 122 · Fiscalía', 'Denuncia de delitos, incluidas extorsión y trata de personas.'],
  ['Línea 123', 'Emergencias: alguien está en peligro ahora.'],
  ['Te Protejo · teprotejo.org', 'Reporte en línea de explotación sexual de menores de edad.'],
]

const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-sm text-zinc-300">{items.map((t) => <li key={t} className="flex gap-2"><span className="text-ok">✓</span>{t}</li>)}</ul>
)

export default function Safety() {
  return (
    <div className="container-page max-w-4xl space-y-6 py-10">
      <h1 className="text-3xl font-black">Seguridad y reglas</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card space-y-3"><h2 className="h-section">Si buscas un servicio</h2><List items={CLIENTS} /></section>
        <section className="card space-y-3"><h2 className="h-section">Si anuncias</h2><List items={ADVERTISERS} /></section>
      </div>
      <section className="card space-y-3"><h2 className="h-section">Reglas de la comunidad</h2><List items={RULES} /></section>
      <section id="denunciar" className="card space-y-3 border-rose">
        <h2 className="h-section">Explotación, trata o menores de edad</h2>
        <p className="text-sm text-zinc-300">
          Si crees que alguien es menor de edad o está siendo obligada, usa «Denunciar este perfil» (lo ocultamos de
          inmediato) y comunícate con las autoridades:
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {LINES.map(([name, text]) => (
            <div key={name}><dt className="font-bold">{name}</dt><dd className="text-mute">{text}</dd></div>
          ))}
        </dl>
      </section>
    </div>
  )
}

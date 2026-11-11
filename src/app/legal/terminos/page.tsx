import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = { title: 'Términos y condiciones', alternates: { canonical: '/legal/terminos' } }

const N = APP_NAME

export default function Terms() {
  return (
    <LegalPage title="Términos y condiciones" sections={[
      ['Aceptación y definiciones', [
        `Estos términos regulan el acceso y uso de ${N} (la «plataforma»). Al navegar, crear una cuenta o publicar un anuncio, aceptas estos términos y la política de tratamiento de datos. Si no estás de acuerdo, no uses la plataforma.`,
        '«Anunciante» es quien publica un perfil. «Cliente» o «visitante» es quien consulta perfiles. «Encuentro verificado» es el registro que se crea cuando un cliente confirma, desde su cuenta, el código presencial generado por una anunciante. «Sello» es el identificador público de ese registro.',
      ]],
      ['Naturaleza del servicio', [
        `${N} es un servicio de publicación de anuncios entre personas adultas, con herramientas de verificación, privacidad y reputación. Esa es su única actividad.`,
        `${N} no presta, ofrece, organiza, agenda ni supervisa servicios de acompañamiento; no selecciona ni dirige a las personas anunciantes; no fija tarifas; no recibe, retiene ni procesa pagos entre usuarios; y no cobra comisión, porcentaje ni participación alguna sobre los encuentros.`,
        `La herramienta para «armar el mensaje» de contacto solo redacta un texto que el visitante envía por su cuenta a través de un servicio de mensajería de terceros. No constituye una reserva, un contrato ni una intermediación de ${N}.`,
        'Los acuerdos entre anunciantes y clientes son exclusivamente suyos. Cada usuario es responsable de cumplir la ley aplicable en el lugar donde se encuentre.',
      ]],
      ['Mayoría de edad', [
        'El acceso está reservado a personas de 18 años o más. Al entrar declaras bajo tu responsabilidad que eres mayor de edad.',
        'Para publicar es obligatorio superar una verificación de identidad y mayoría de edad. Está prohibido cualquier contenido que involucre, sugiera o aparente involucrar a menores de edad: se eliminará de inmediato, la cuenta se cerrará y el caso se reportará a las autoridades competentes.',
      ]],
      ['Cuentas', [
        'Navegar y contactar perfiles no discretos no requiere cuenta. Las cuentas de cliente pueden ser anónimas: solo requieren una contraseña y reciben un alias. Sin correo asociado no es posible recuperar una cuenta cuya contraseña se pierda.',
        'Las cuentas de anunciante requieren un correo válido. Cada persona es responsable de la confidencialidad de sus credenciales y de la actividad de su cuenta. No está permitido ceder, vender o compartir cuentas.',
      ]],
      ['Anunciantes independientes, agencias y establecimientos', [
        'Cada perfil corresponde a una única persona real, mayor de edad, que consintió personalmente su publicación y superó la verificación con su propio documento y su propia selfie.',
        'Quien publica debe declarar con veracidad si es una persona independiente o una agencia o establecimiento. Los perfiles de agencias o establecimientos se identifican de forma visible. Declarar falsamente ser independiente es causal de suspensión.',
        'Una agencia o establecimiento solo puede anunciar a personas que hayan consentido libremente y que conserven en todo momento la posibilidad de retirar su perfil. Está prohibido retener documentos, controlar las credenciales de la persona anunciada, o publicar a alguien que actúe bajo deuda, amenaza, engaño o cualquier forma de coacción.',
        `${N} puede exigir en cualquier momento una nueva verificación directa con la persona anunciada y suspender perfiles ante cualquier indicio de control por terceros.`,
      ]],
      ['Verificación e insignias', [
        'Las insignias «Identidad 18+» y «Fotos reales» indican que se superó una revisión en una fecha determinada. No son una garantía sobre la conducta, la salud ni los servicios de ninguna persona.',
        'El índice de confianza se calcula con las mismas reglas públicas para todos los perfiles. No puede comprarse, y ningún plan de pago presente o futuro lo modifica.',
      ]],
      ['Contenido de los anuncios e historias', [
        'El anunciante garantiza que las fotos, historias y textos son propios, actuales y la muestran a ella o a él. Están prohibidas las fotos de otra persona, las tomadas de internet y las editadas para engañar.',
        'No se permite contenido que muestre actos sexuales explícitos, violencia, armas, drogas, datos personales de terceros, ni ofertas de actividades ilegales.',
        'Las fotos e historias pasan por moderación antes de publicarse. Las historias se retiran automáticamente a las 24 horas de su aprobación.',
        `El anunciante conserva sus derechos sobre su contenido y concede a ${N} una licencia limitada, no exclusiva y revocable para alojarlo, adaptarlo técnicamente (incluida marca de agua y versión difuminada) y mostrarlo dentro de la plataforma mientras el perfil exista.`,
      ]],
      ['Disponibilidad', [
        'El estado «Disponible ahora» es una declaración de la persona anunciante, vence automáticamente y debe activarse solo cuando sea cierto. El uso reiterado de disponibilidad falsa puede dar lugar a restricciones.',
      ]],
      ['Conductas prohibidas', [
        'Pedir anticipos, depósitos, recargas, «reservas» o cualquier pago antes del encuentro. La plataforma bloquea anuncios que lo mencionen.',
        'Suplantar identidades, publicar a nombre de otra persona, usar un mismo número de contacto en varios perfiles, crear cuentas para evadir una suspensión.',
        'Cualquier forma de explotación sexual, trata de personas, inducción o constreñimiento. Extorsionar, amenazar, acosar o grabar a otra persona sin su consentimiento.',
        'Extraer datos de forma automatizada, copiar fotos o perfiles, intentar identificar a otros usuarios, eludir el modo discreto o los bloqueos de visibilidad, o interferir con el funcionamiento del sitio.',
        'Usar las reseñas o calificaciones para presionar, chantajear o tomar represalias.',
      ]],
      ['Encuentros verificados, reseñas y calificaciones', [
        'Un encuentro verificado solo acredita que una anunciante generó un código presencial y que un cliente lo confirmó desde su cuenta. No acredita qué ocurrió entre ellos.',
        'Solo pueden emitirse reseñas y calificaciones a partir de un encuentro verificado, dentro de los 14 días siguientes. Lo que escribe cada parte se publica cuando ambas califican o al cumplirse 7 días.',
        'Las reseñas expresan la opinión de su autor, se muestran sin su alias y pueden ser públicas o visibles solo para miembros. Deben referirse a la experiencia real y no pueden incluir datos personales, descripciones sexuales explícitas, insultos ni acusaciones de delitos (para eso existe el canal de denuncias).',
        'Está prohibido intercambiar códigos sin que exista un encuentro, comprar o vender reseñas y calificarse a sí mismo. Los sellos pueden ser anulados si se comprueba fraude.',
        'La calificación que una anunciante da a un cliente alimenta su «pase de cliente», que solo muestra cifras agregadas y que el cliente decide a quién mostrar.',
      ]],
      ['Privacidad y visibilidad', [
        'La anunciante puede activar el modo discreto, limitar su visibilidad por región o a visitantes extranjeros, y pausar su perfil en cualquier momento.',
        'Los filtros de visibilidad se basan en indicios técnicos (ubicación aproximada de la conexión e idioma del navegador). Reducen la exposición pero no constituyen una garantía absoluta.',
      ]],
      ['Denuncias y moderación', [
        'Cualquier persona puede denunciar un perfil, incluso sin cuenta. Las denuncias por posible minoría de edad, explotación o coacción ocultan el perfil de forma preventiva mientras se revisan.',
        `${N} puede rechazar, ocultar, pausar o suspender contenidos y cuentas que incumplan estos términos. La persona afectada puede solicitar una revisión de la decisión a través del canal de atención.`,
        `${N} colaborará con las autoridades competentes cuando exista una obligación legal o un requerimiento válido.`,
      ]],
      ['Retiro de contenido', [
        'Si crees que un perfil usa tus fotos o tus datos sin autorización, denúncialo o escribe al canal de atención. Los contenidos señalados se retiran de forma preventiva mientras se verifican.',
      ]],
      ['Planes de pago', [
        `Si ${N} ofrece planes de pago a anunciantes, serán por servicios de publicación y visibilidad dentro de la plataforma, se informarán antes de contratarse y nunca dependerán del número o valor de los encuentros.`,
      ]],
      ['Limitación de responsabilidad', [
        `${N} no es parte de los acuerdos entre usuarios y no responde por su cumplimiento, por pagos, ni por hechos ocurridos fuera de la plataforma. Las herramientas de verificación y reputación reducen riesgos pero no los eliminan: cada usuario debe actuar con prudencia.`,
        'La plataforma se ofrece «tal cual». No se garantiza disponibilidad ininterrumpida ni ausencia de errores.',
      ]],
      ['Cambios, ley aplicable y contacto', [
        'Estos términos pueden actualizarse; los cambios relevantes se anunciarán en la plataforma. El uso posterior implica su aceptación.',
        'Ley aplicable, jurisdicción, razón social, identificación tributaria, domicilio y canal de atención: por completar por el responsable legal antes del lanzamiento.',
      ]],
    ]} />
  )
}

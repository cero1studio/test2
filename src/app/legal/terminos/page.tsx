import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = { title: 'Términos y condiciones' }

export default function Terms() {
  return (
    <LegalPage title="Términos y condiciones" sections={[
      ['Qué es la plataforma', [
        `${APP_NAME} es un servicio de publicación de anuncios entre personas adultas. Su única actividad es alojar anuncios y herramientas de verificación y reputación.`,
        `${APP_NAME} no organiza, no agenda, no intermedia ni participa en los encuentros; no recibe ni procesa pagos entre usuarios y no cobra comisión alguna por ellos. Cada anunciante actúa por cuenta propia, de forma voluntaria e independiente.`,
      ]],
      ['Solo mayores de edad', [
        'El acceso y el uso están reservados a personas de 18 años o más. Para publicar un anuncio es obligatorio superar una verificación de identidad y mayoría de edad.',
        'Está prohibido cualquier contenido que involucre, sugiera o aparente involucrar a menores de edad. Se eliminará de inmediato y se reportará a las autoridades competentes.',
      ]],
      ['Conductas prohibidas', [
        'Publicar a nombre de otra persona, administrar perfiles de terceros u obtener provecho económico de la actividad de otra persona.',
        'Cualquier forma de coacción, explotación o trata de personas. La plataforma colaborará con las autoridades cuando la ley lo exija.',
        'Pedir anticipos o depósitos antes del encuentro, usar fotos de otra persona, suplantar identidades, extorsionar o amenazar.',
        'Extraer datos de forma automatizada, copiar fotos o intentar identificar a otros usuarios.',
      ]],
      ['Verificación, encuentros y reseñas', [
        'Las insignias indican que se superó una revisión en una fecha determinada; no son una garantía sobre la conducta futura de nadie.',
        'Un «encuentro verificado» significa que la anunciante generó un código presencial y un cliente lo confirmó desde su cuenta. Las reseñas y calificaciones solo pueden emitirse a partir de esos encuentros y expresan la opinión de su autor.',
        'El índice de confianza se calcula con las mismas reglas para todos los perfiles y no puede adquirirse mediante pago.',
      ]],
      ['Moderación', [
        'La plataforma puede ocultar, pausar o suspender perfiles y contenidos que incumplan estas reglas. Las denuncias graves ocultan el perfil de forma preventiva mientras se revisan.',
      ]],
      ['Responsabilidad', [
        'Cada usuario es responsable de sus actos y de cumplir la ley aplicable en su lugar de residencia. La plataforma no responde por acuerdos, pagos o hechos ocurridos entre usuarios fuera de ella.',
      ]],
    ]} />
  )
}

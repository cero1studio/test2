import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = { title: 'Tratamiento de datos personales' }

export default function Privacy() {
  return (
    <LegalPage title="Tratamiento de datos personales" sections={[
      ['Principio: guardar lo mínimo', [
        `${APP_NAME} trata datos personales conforme a la Ley 1581 de 2012 y sus normas reglamentarias. Recogemos solo lo necesario para operar el servicio y proteger a sus usuarios.`,
      ]],
      ['Qué datos tratamos', [
        'Cuenta: correo electrónico y contraseña (almacenada cifrada con hash). A cada cuenta se le asigna un alias anónimo; el correo nunca se muestra a otros usuarios.',
        'Anunciantes: los datos del anuncio que deciden publicar (nombre artístico, ciudad, tarifa, descripción, fotos y número de contacto).',
        'Verificación: una imagen del documento de identidad y una selfie con un código. Son datos sensibles y solo se tratan con autorización expresa.',
        'Actividad: encuentros confirmados, reseñas, calificaciones y denuncias.',
      ]],
      ['Datos sensibles y verificación', [
        'La imagen del documento se usa únicamente para comprobar identidad y mayoría de edad, solo la ve el equipo de moderación y se elimina al resolver la solicitud.',
        'La selfie de verificación se conserva de forma privada con el único fin de comprobar que las fotos publicadas corresponden a la misma persona. Puede solicitarse su eliminación, lo que retira la insignia de fotos verificadas.',
        'Nadie está obligado a autorizar el tratamiento de datos sensibles; sin esa autorización no es posible publicar un anuncio.',
      ]],
      ['Privacidad por diseño', [
        'Se eliminan los metadatos de las fotos, incluida la geolocalización. El número de contacto no se incluye en la página y se entrega bajo demanda.',
        'La anunciante puede activar el modo discreto, bloquear regiones y pausar su perfil en cualquier momento. Los perfiles discretos o con bloqueos no se envían a buscadores.',
        'Las reseñas se muestran sin el alias de su autor. El sello público de un encuentro no revela la identidad del cliente.',
      ]],
      ['Derechos del titular', [
        'Toda persona puede conocer, actualizar, rectificar y suprimir sus datos, y revocar la autorización, escribiendo al canal de atención del responsable del tratamiento. También puede presentar quejas ante la Superintendencia de Industria y Comercio.',
      ]],
      ['Con quién se comparten', [
        'No vendemos datos personales. Solo se comparten con proveedores que prestan servicios técnicos bajo deber de confidencialidad, y con autoridades cuando exista obligación legal.',
      ]],
    ]} />
  )
}

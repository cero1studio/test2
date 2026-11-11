import { confirmAge } from '@/app/actions/public'
import { Logo } from './ui'

// Capa sobre el contenido (no lo reemplaza): los buscadores pueden leer la
// página, y el visitante no interactúa con nada hasta confirmar su edad.
export function AgeGate() {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="age-title" className="fixed inset-0 z-50 grid place-items-center bg-bg/80 px-5 backdrop-blur-2xl">
      <div className="max-w-md space-y-6 rounded-3xl border border-white/10 bg-surface p-8 text-center shadow-2xl">
        <Logo className="text-4xl" />
        <div className="space-y-3">
          <h2 id="age-title" className="display text-3xl">Solo para adultos</h2>
          <p className="text-sm leading-relaxed text-mute">
            Este sitio contiene anuncios de servicios para adultos publicados por personas mayores de edad
            verificadas. Al entrar declaras que tienes 18 años o más y que aceptas los términos.
          </p>
        </div>
        <form action={confirmAge} className="flex flex-col gap-2">
          <button className="btn btn-primary">Tengo 18 años o más · Entrar</button>
          <a className="btn" href="https://www.google.com">Salir</a>
        </form>
        <p className="text-xs text-mute">Cero tolerancia a la explotación sexual y a la trata de personas.</p>
      </div>
    </div>
  )
}

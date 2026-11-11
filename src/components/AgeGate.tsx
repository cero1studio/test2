import { confirmAge } from '@/app/actions/public'
import { APP_NAME } from '@/lib/constants'

export function AgeGate() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card max-w-md space-y-5 text-center">
        <p className="text-2xl font-black">{APP_NAME}<span className="text-rose">.</span></p>
        <h1 className="text-xl font-bold">Contenido solo para adultos</h1>
        <p className="text-sm text-mute">
          Este sitio contiene anuncios de servicios para adultos publicados por personas mayores de edad
          verificadas. Al entrar declaras que tienes 18 años o más.
        </p>
        <form action={confirmAge} className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button className="btn btn-primary">Tengo 18 años o más · Entrar</button>
          <a className="btn" href="https://www.google.com">Salir</a>
        </form>
      </div>
    </main>
  )
}

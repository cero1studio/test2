# Contexto del proyecto (para continuar en otra sesión)

Sigila (nombre de trabajo): plataforma de anuncios de acompañantes adultos — mujeres, hombres y trans —
para Colombia. Idioma del producto y de la conversación con el dueño: **español**.
Lee `README.md` para el detalle funcional. Rama de trabajo: `ccr-319828cf-gf6fxi`.

## Principios que el dueño definió
- **Ellas quieren privacidad; ellos quieren seguridad.** El cliente debe poder ser totalmente anónimo.
- El producto se diseña para **quien busca** (encontrar fácil, filtros, contacto sin fricción), no solo para quien anuncia.
- Enfoque en **independientes**; las agencias se permiten pero siempre etiquetadas y aparte.
- Debe ser **legal**: la plataforma solo publica anuncios. No agenda, no intermedia, no procesa pagos entre usuarios, no cobra comisión por encuentros.
- Interfaz de alto nivel: Tailwind 4 + Motion, Fraunces + Geist, móvil primero.

## Decisiones tomadas (no reabrir sin que el dueño lo pida)
- Nadie se publica sin verificación de identidad 18+ (documento + selfie con código; el documento se borra al resolver).
- **No se hace scraping** de perfiles de otros sitios, ni con atribución ni «solo verificadas»: publicar a alguien sin su consentimiento rompe la promesa de privacidad y la ley de datos.
- **No hay bolsa de «plazas»/reclutamiento** para agencias.
- No hay operadores ni «centralita» humana que responda por las anunciantes; la alternativa es el modo **solicitud** (software, ella decide).
- El índice de confianza nunca se puede comprar.
- Las etiquetas de apariencia no admiten nada que aluda a minoría de edad.

## Pendiente
- Despliegue en Railway (ver README, sección «Desplegar en Railway»). Con la CLI: `railway login`, `railway init` o `railway link`,
  crear un volumen en `/data`, definir `DATABASE_URL=file:/data/app.db`, `STORAGE_DIR=/data/storage`, `SITE_URL`, `SEED_ADMIN_PASSWORD`, y `railway up`.
- Dominio y marca sin verificar. El dueño propuso «wawisreales.com»; candidatos previos: sigila, avalada, fidedigna.
- El repositorio debe pasar a **privado** (solo el dueño puede hacerlo en GitHub).
- Términos y política de datos son borradores: faltan razón social, NIT, jurisdicción y revisión de abogado.
- Sin hacer: video en perfiles/historias, notificaciones push, verificación de correo/teléfono, recuperación de contraseña,
  cuentas de agencia con varios perfiles, directorio de lugares aliados, PostgreSQL y almacenamiento cifrado, proveedor KYC, modelo de cobro.

## Cómo trabajar aquí
- `pnpm setup && pnpm dev`. Cuentas demo en el README. `GEO_DEV_REGION` simula la región del visitante.
- Antes de subir: `pnpm typecheck && pnpm test && pnpm build`, y probar los flujos en navegador.
- Tras cambiar `prisma/schema.prisma`: `pnpm db:push` y **reiniciar** `pnpm dev` (el cliente de Prisma queda en memoria).
- Toda escritura pasa por `src/app/actions/` con validación y permisos; los archivos subidos viven fuera de `/public`.

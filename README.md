# Veraz

Plataforma de anuncios para adultos pensada para resolver lo que falla en los clasificados
tradicionales: estafas con anticipos, fotos falsas, reseñas inventadas y nula privacidad para
quien anuncia. «Veraz» es un nombre provisional (se cambia en `src/lib/constants.ts`).

![Inicio](docs/inicio.png)

## Qué resuelve y cómo

| Problema | Solución implementada |
| --- | --- |
| Perfiles falsos y menores de edad | Nadie se publica sin verificación de identidad: documento + selfie con un código único. Un perfil solo es público si está activo **y** verificado. |
| Fotos que no son de la persona | Cada foto pasa por moderación, que la compara con la selfie verificada. Insignia «Fotos reales». |
| Reseñas inventadas | Solo se reseña con un código de un solo uso que la anunciante entrega al terminar el encuentro (vence en 7 días, máx. 5 por día, 1 reseña por cliente cada 30 días). |
| Estafa del anticipo | Prohibido por reglas; aviso al revelar el contacto; cada reseña registra si pidieron anticipo y eso baja el índice de confianza. |
| No saber en quién confiar | Índice de confianza 0-100 transparente y desglosado (`src/lib/trust.ts`). No se puede comprar. |
| Privacidad de quien anuncia | Bloqueo de visibilidad por departamento o «fuera de Colombia» (listados, perfil, fotos y contacto). Se eliminan los metadatos EXIF/GPS de las fotos. El documento se borra al resolver la verificación. |
| Copia masiva de teléfonos | El número no está en el HTML: se entrega bajo demanda con límite por IP. |
| Explotación y trata | Denuncias anónimas; una denuncia grave de un usuario registrado oculta el perfil de inmediato; cola prioritaria en moderación; líneas oficiales en `/seguridad`. |

## Puesta en marcha

```bash
pnpm install
cp .env.example .env
pnpm setup        # crea la base SQLite y carga datos de demostración
pnpm dev          # http://localhost:3000
```

Cuentas de demostración (las crea `pnpm db:seed`):

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Moderación | `admin@veraz.test` | valor de `SEED_ADMIN_PASSWORD` |
| Cliente | `cliente1@veraz.test` | `demo-cliente-123` |
| Anunciante | `anunciante1@veraz.test` | `demo-anunciante-123` |

Los «retratos» de demostración son degradados generados; no hay fotos de personas reales.

Otros comandos: `pnpm test` (pruebas unitarias), `pnpm typecheck`, `pnpm build`.

## Estructura

- `prisma/schema.prisma`: modelo de datos (usuarios, perfiles, fotos, verificaciones, códigos, reseñas, denuncias).
- `src/app/actions/`: toda la lógica de escritura (server actions) con validación y permisos.
- `src/lib/trust.ts`: índice de confianza. `src/lib/geo.ts` y `regions.ts`: bloqueo por ubicación.
- `src/lib/storage.ts`: archivos privados fuera de `/public`, servidos solo por rutas con permisos.
- `src/app/panel`: panel de anunciante y cliente. `src/app/admin`: moderación.

## Pendiente antes de producción

Esto es un MVP funcional, no un producto listo para lanzar. Falta:

1. **Revisión legal** (habeas data / Ley 1581, términos, obligaciones frente a explotación sexual y trata, y la normativa de cada país donde opere).
2. **Geolocalización**: el bloqueo por región lee las cabeceras del CDN (Vercel o Cloudflare). Sin un CDN que las fije, la región es desconocida y los perfiles con bloqueos se ocultan a todos. Es una barrera por IP: una VPN la evita.
3. **Verificación con proveedor KYC** (prueba de vida y validación documental) en lugar de revisión solo manual.
4. **PostgreSQL y almacenamiento cifrado** (S3 o similar) en vez de SQLite y disco local; limitador de peticiones en Redis.
5. Verificación de correo y teléfono, recuperación de contraseña, 2FA para moderación y registro de auditoría.
6. Modelo de ingresos (por ejemplo suscripción de anunciantes) que no altere el índice de confianza.

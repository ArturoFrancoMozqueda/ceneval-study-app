# Alta segura de la administradora

La aplicación no tiene registro público mientras esté vigente ADR-014. La
primera administradora se crea o promueve mediante un procedimiento explícito
desde una terminal confiable; visitar una página nunca cambia roles.

## Antes de empezar

1. Confirma que estás trabajando en el proyecto Supabase de CENEVAL, no Kova.
2. Conserva `PRIVATE_ACCESS_ONLY=true`.
3. Configura en `.env.local` la URL, la clave pública, `SUPABASE_SECRET_KEY`,
   `NEXT_PUBLIC_SITE_URL` y `ADMIN_EMAIL`. No compartas ni subas `.env.local`
   a Git. El correo del comando debe coincidir exactamente con la allowlist
   `ADMIN_EMAIL`; esa variable no promueve cuentas durante una visita.
4. En Supabase Auth, agrega a las URL permitidas exactamente la URL que genera
   el comando:
   `<NEXT_PUBLIC_SITE_URL>/auth/confirm?next=%2Factualizar-contrasena`.
5. Verifica que el proveedor de correo de Supabase puede enviar invitaciones.

## Ejecutar una sola vez

```powershell
npm.cmd run admin:bootstrap -- --email=correo@dominio.com --confirm-production
```

El comando exige una confirmación escrita, busca primero una cuenta existente,
envía o reenvía una invitación solo si la cuenta no está confirmada, asigna
`profiles.role = 'admin'` y
vuelve a leer la fila para comprobar el resultado. Nunca genera ni imprime una
contraseña o un enlace de acceso.

Resultado esperado:

- cuenta nueva: llega una invitación al correo indicado;
- cuenta existente: no se envía otra invitación y se verifica su rol;
- cualquier error: el proceso termina con código distinto de cero y no declara
  éxito.

La administradora abre el correo, acepta la invitación, establece su contraseña
en `/actualizar-contrasena` e inicia sesión. Después se debe comprobar el panel
`/administrar` desde una sesión nueva.

## Recuperación y operación

- Si la invitación vence, vuelve a ejecutar el comando con el mismo correo.
- Si se escribió un correo equivocado, no intentes corregirlo mediante otra
  variable de entorno: revisa el usuario en Supabase Auth y revoca/elimina la
  cuenta incorrecta antes de continuar.
- Para una futura segunda administradora de emergencia se usa el mismo proceso,
  después de cambiar deliberadamente `ADMIN_EMAIL`, con aprobación explícita
  de la dueña y registro de la fecha y responsable.
- `SUPABASE_SECRET_KEY` solo debe existir en entornos administrativos
  confiables; nunca usa el prefijo `NEXT_PUBLIC_`.

Este comando escribe en Auth y `profiles`. No forma parte de CI ni debe
ejecutarse como prueba local.

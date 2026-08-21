# Activación privada de la administradora

La aplicación permanece cerrada con `PRIVATE_ACCESS_ONLY=true`. Esta guía no
habilita registro público ni acceso de estudiantes: únicamente permite activar
el correo exacto configurado en `ADMIN_EMAIL`.

## Configuración obligatoria

En el almacén seguro del entorno define:

- `ADMIN_EMAIL`: correo de la administradora, normalizado sin espacios;
- `SUPABASE_SECRET_KEY`: clave secreta de CENEVAL, solo en servidor;
- `NEXT_PUBLIC_SITE_URL`: origen HTTPS de la aplicación;
- las dos variables públicas de Supabase descritas en `.env.example`;
- `PRIVATE_ACCESS_ONLY=true`.

En Supabase Auth configura `NEXT_PUBLIC_SITE_URL` como Site URL y permite
`<NEXT_PUBLIC_SITE_URL>/auth/confirm` entre las Redirect URLs. Mantén activa la
confirmación de correo. La URL permitida debe pertenecer al proyecto CENEVAL,
nunca al de otra aplicación.

## Opción 1: activación inicial

1. Abre `/registro` desde el enlace **Activa tu cuenta** de la pantalla de
   acceso.
2. Escribe el mismo correo de `ADMIN_EMAIL`, el nombre y una contraseña de 12 a
   128 caracteres con al menos una letra y un número.
3. La pantalla siempre muestra una respuesta genérica. Esto evita revelar qué
   correo está autorizado o si ya existe una cuenta.
4. Abre el correo de confirmación. `/auth/confirm` intercambia el código por una
   sesión y vuelve a comprobar que el correo coincida con `ADMIN_EMAIL`.
5. La confirmación crea la identidad, pero no concede el rol. Si el bootstrap
   aún no asignó `admin`, el callback cierra la sesión y muestra que la
   activación administrativa está pendiente; la cuenta no puede entrar en modo
   privado.

## Bootstrap obligatorio del rol

La invitación y la asignación de `admin` se realizan desde una terminal
confiable con el comando canónico:

```bash
npm run admin:bootstrap -- --email=correo@dominio.com --confirm-production
```

El correo debe coincidir exactamente con `ADMIN_EMAIL`. Este comando es el
camino recomendado: invita o reenvía la invitación cuando corresponde, asigna
el rol y lo vuelve a leer para verificarlo. La aceptación del correo sigue
siendo obligatoria y el callback de la aplicación nunca concede el rol.

## Opción 2: invitación desde Supabase

Como alternativa operativa, en Authentication → Users del proyecto CENEVAL
puedes usar **Send invitation** para `ADMIN_EMAIL`. La invitación debe volver a:

```text
<NEXT_PUBLIC_SITE_URL>/auth/confirm?next=/actualizar-contrasena
```

Después debe ejecutarse igualmente `admin:bootstrap` para verificar y asignar
el rol. El callback acepta la sesión de la invitación, verifica nuevamente el
correo y lleva a elegir una contraseña. Si el enlace está vencido, incompleto,
intenta salir del sitio o pertenece a otro correo, se cierra cualquier sesión
y se muestra el mismo error genérico.

## Comprobación esperada

Después de confirmar:

1. iniciar sesión con `ADMIN_EMAIL` funciona;
2. un correo distinto recibe una respuesta indistinguible pero no se crea
   desde la aplicación;
3. una cuenta con rol `student` no puede entrar mientras el modo privado siga
   activo;
4. ningún secreto aparece en el navegador ni en Git.

No desactives `PRIVATE_ACCESS_ONLY` para resolver un problema de activación.

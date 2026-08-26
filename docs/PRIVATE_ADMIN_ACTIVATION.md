# Activación privada de la administradora

La aplicación permanece cerrada con `PRIVATE_ACCESS_ONLY=true`. Esta guía no
habilita registro público ni acceso de estudiantes. `/registro` muestra un
aviso y no recopila datos en este modo; la cuenta administrativa se prepara
exclusivamente mediante invitación y bootstrap desde una terminal confiable.

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

## Activación inicial y bootstrap obligatorio

La invitación y la asignación de `admin` se realizan desde una terminal
confiable con el comando canónico:

```bash
npm run admin:bootstrap -- --email=correo@dominio.com --confirm-production
```

El correo debe coincidir exactamente con `ADMIN_EMAIL`. Este es el camino
canónico: invita o reenvía la invitación cuando corresponde, asigna el rol y
lo vuelve a leer para verificarlo. La aceptación del correo sigue siendo
obligatoria y el callback de la aplicación nunca concede el rol.

## Alternativa: invitación desde Supabase

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
2. `/registro` informa que el acceso es privado y no envía datos a Supabase;
3. una cuenta con rol `student` no puede entrar mientras el modo privado siga
   activo;
4. ningún secreto aparece en el navegador ni en Git.

No desactives `PRIVATE_ACCESS_ONLY` para resolver un problema de activación.

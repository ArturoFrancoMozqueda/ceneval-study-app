# Activación de la administradora

La aplicación usa acceso por invitación. Esta guía no habilita registro
público: `/registro` muestra un aviso y no recopila datos. La cuenta
administrativa se prepara mediante invitación y bootstrap desde una terminal
confiable; las cuentas `student` invitadas pueden entrar, sin capacidades
editoriales.

## Configuración obligatoria

En el almacén seguro del entorno define:

- `ADMIN_EMAIL`: correo de la administradora, normalizado sin espacios;
- `SUPABASE_SECRET_KEY`: clave secreta de CENEVAL, solo en servidor;
- `NEXT_PUBLIC_SITE_URL`: origen HTTPS de la aplicación;
- las dos variables públicas de Supabase descritas en `.env.example`.

En Supabase Auth configura `NEXT_PUBLIC_SITE_URL` como Site URL, permite
`<NEXT_PUBLIC_SITE_URL>/auth/confirm` entre las Redirect URLs, conserva activa
la confirmación de correo y desactiva **Allow new users to sign up**. La URL
permitida debe pertenecer al proyecto CENEVAL, nunca al de otra aplicación.

## Activación inicial y bootstrap obligatorio

La invitación y la asignación de `admin` se realizan desde una terminal
confiable con el comando canónico:

```bash
npm run admin:bootstrap -- --email=correo@dominio.com --confirm-production
```

El correo debe coincidir exactamente con `ADMIN_EMAIL`. Este camino invita o
reenvía la invitación cuando corresponde, asigna el rol y lo vuelve a leer para
verificarlo. La aceptación del correo sigue siendo obligatoria y el callback
de la aplicación nunca concede el rol.

## Invitación de una estudiante

En `Authentication → Users` del proyecto CENEVAL usa **Send invitation** con
el correo exacto autorizado. El trigger crea el perfil con rol `student`; no
ejecutes `admin:bootstrap` ni cambies ese rol. Registra el nombre en
`profiles.full_name` mediante una operación administrativa acotada al UUID de
esa invitación y vuelve a leer `id`, `full_name` y `role` para comprobarlo.

La invitada confirma su correo, define la contraseña y pasa por
`/aceptar-terminos`. `accept_terms_v1` conserva la primera hora emitida por la
base y la RLS no entrega el catálogo antes de ese paso. Conserva en el registro
privado de altas la fecha, el correo autorizado y quién envió la invitación;
no copies tokens ni enlaces de confirmación.

## Alternativa: invitación desde Supabase

En Authentication → Users del proyecto CENEVAL puedes usar **Send invitation**
para `ADMIN_EMAIL`. La invitación debe volver a:

```text
<NEXT_PUBLIC_SITE_URL>/auth/confirm?next=/actualizar-contrasena
```

Después debe ejecutarse igualmente `admin:bootstrap` para verificar y asignar
el rol. El callback acepta la sesión de la invitación, exige un perfil con rol
válido y lleva a elegir una contraseña. Si el enlace está vencido, incompleto
o intenta salir del sitio, cierra la sesión y muestra un error genérico.

## Comprobación esperada

Después de confirmar:

1. iniciar sesión con `ADMIN_EMAIL` funciona;
2. `/registro` informa que el acceso es por invitación y no envía datos;
3. una cuenta invitada con rol `student` confirma el correo, elige contraseña y
   acepta términos y privacidad en `/aceptar-terminos`; antes de ese paso la RLS
   tampoco entrega el catálogo;
4. después puede estudiar, pero no entra a
   `/administrar`;
5. ningún secreto aparece en el navegador ni en Git.

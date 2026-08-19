# Pruebas de seguridad y RLS

## Ejecución

```text
npm run security:rls
```

El comando utiliza las variables privadas de `.env.local`. No imprime claves ni
contraseñas.

## Qué comprueba

- el rol anónimo no puede consultar clases;
- una estudiante autenticada puede leer clases publicadas;
- una estudiante no puede leer una clase borrador;
- una administradora puede leer la misma clase borrador;
- dos estudiantes no pueden leer ni escribir el progreso de la otra;
- una estudiante no puede registrar revisiones de flashcards para otra;
- los intentos de examen permanecen aislados por estudiante;
- las respuestas individuales solo son visibles para la dueña del intento;
- `exam_answer_keys` no es consultable por estudiantes;
- una estudiante no puede cambiar el estado editorial;
- una estudiante puede actualizar su progreso, pero no borrarlo directamente;
- una estudiante solo puede leer su propio perfil.

## Datos temporales

Cada ejecución crea:

- dos cuentas estudiante confirmadas;
- una cuenta administradora confirmada;
- una clase en estado `draft`;
- progreso, revisiones e intentos asociados a las cuentas de prueba.

La suite cierra las sesiones y elimina la clase y las cuentas temporales dentro
de su bloque de limpieza, incluso cuando una comprobación falla. Las relaciones
con borrado en cascada eliminan el progreso temporal.

## Último resultado

Fecha: 29 de julio de 2026.

Resultado: 20 de 20 comprobaciones aprobadas.

## Auditoría de funciones privilegiadas

Fecha: 29 de julio de 2026.

Se revisaron todas las funciones declaradas en las migraciones:

- `public.set_updated_at()` usa `security invoker`, fija `search_path = ''` y
  revoca `EXECUTE` a `public`, `anon` y `authenticated`;
- `private.handle_new_user()` usa `security definer`, fija
  `search_path = ''`, califica la tabla como `public.profiles` y revoca la
  ejecución directa a `public`, `anon` y `authenticated`; solo se usa mediante
  el trigger de creación de usuarios;
- `private.is_admin()` usa `security definer`, fija `search_path = ''`,
  consulta explícitamente `public.profiles` y compara el perfil con
  `auth.uid()`; revoca el acceso general y concede `EXECUTE` únicamente a
  `authenticated`, porque las políticas RLS necesitan invocarla.

Resultado: no se encontraron funciones privilegiadas expuestas a `anon`, rutas
de búsqueda mutables ni permisos `EXECUTE` innecesarios. No fue necesario
modificar el esquema.

La revisión sigue las recomendaciones de Supabase para preferir
`security invoker`, fijar el `search_path` en funciones `security definer`,
revocar la ejecución predeterminada y alojar auxiliares de RLS en un esquema no
expuesto.

## Asesores de Supabase

Fecha: 29 de julio de 2026.

Los asesores de seguridad y rendimiento se ejecutaron mediante Supabase CLI
2.110.0 contra el proyecto vinculado `lcfdlhgpwmqeggsfbnbo`.

Resultados y decisiones:

- se detectó que `public.rls_auto_enable()` conservaba el permiso `EXECUTE`
  predeterminado para `anon` y `authenticated`;
- se revocaron esos permisos y se verificó mediante
  `has_function_privilege` que ambos roles devuelven `false`;
- al repetir el asesor desaparecieron las dos advertencias de la función;
- `exam_answer_keys` mantiene RLS sin políticas de forma intencional, pues sus
  claves solo deben ser accesibles desde el servidor;
- la protección contra contraseñas filtradas permanece como advertencia porque
  Supabase la ofrece únicamente en el plan Pro o superior;
- los índices todavía no utilizados se conservan: la base tiene poco uso y
  varios respaldan relaciones o consultas previstas.

La corrección quedó registrada en la migración
`20260729173157_restrict_rls_auto_enable_execute.sql`.

## Cobertura pendiente

- cuenta registrada pero todavía no verificada;
- activar la protección contra contraseñas filtradas si el proyecto cambia al
  plan Pro.

## Estados editoriales

Fecha: 29 de julio de 2026.

La suite prueba el recorrido temporal `draft` → `review` → `published` →
`withdrawn` y confirma que:

- una clase en revisión permanece oculta para estudiantes;
- una clase publicada se vuelve visible;
- una clase retirada vuelve a quedar oculta;
- la administradora conserva acceso a la clase retirada;
- la fecha de publicación se conserva al retirar;
- los datos temporales se eliminan al terminar.

Resultado: las cuatro comprobaciones editoriales pasaron y la suite completa
alcanzó 20 de 20 pruebas.

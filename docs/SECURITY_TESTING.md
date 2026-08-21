# Pruebas de seguridad y RLS

Última conciliación documental: 20 de agosto de 2026.

Hay dos niveles de comprobación y no deben confundirse:

1. pruebas locales y estáticas, seguras para CI;
2. una suite de integración que crea datos en Supabase remoto.

## Pruebas locales

```text
npm run test:local
```

Este comando no usa `.env.local`, Supabase remoto ni el disco `F:`. Incluye:

- validación estricta y pertenencia de respuestas de examen;
- exposición mínima de retroalimentación;
- cálculo del repaso espaciado a partir de la respuesta más reciente;
- esquema de paquetes académicos;
- destinos permitidos de confirmación de autenticación;
- validación local del inicio de sesión;
- cabeceras de seguridad;
- entradas válidas de acciones de estudio;
- estructura de las políticas RLS que limitan actividad a contenido publicado;
- estructura de las políticas RLS y filtros DAL que limitan la lectura a temas
  aprobados de clases publicadas, sin retirar el acceso editorial;
- integridad del procedimiento de respaldo con SQL sintético.

GitHub Actions ejecuta estas pruebas, lint y build en pull requests y pushes a
`main`, sin secretos y sin acceso a Supabase.

La comprobación `test:rls-policies` es estática: confirma que la migración
versionada contiene ownership, rol `authenticated`, encadenamiento a clase
publicada y `USING`/`WITH CHECK` para actualizaciones. No demuestra por sí sola
que la migración ya esté activa en la base remota.

La comprobación `test:topic-approval-policies` revisa de forma local que la
migración `20260821023330_restrict_reading_to_approved_topics.sql` reemplace de
manera atómica e idempotente las nueve políticas de lectura, exija tema
`approved` y clase `published`, preserve `private.is_admin()` y mantenga los
filtros redundantes de `getTopic` y `getLessonBundle`.

## Suite RLS remota

```text
npm run security:rls
```

El comando usa las variables privadas de `.env.local` y escribe en Supabase.
No debe ejecutarse como una verificación rutinaria ni dentro de CI. Cada corrida
crea cuentas, una clase temporal y actividad asociada; durante la prueba cambia
la clase por `draft → review → published → withdrawn` y luego limpia los datos.

La suite actual contiene **31 comprobaciones**. Cubre:

- anónimo sin acceso a clases;
- contenido publicado visible y borrador, revisión o retirada ocultos;
- acceso editorial a contenido no publicado;
- aislamiento de perfiles, progreso, revisiones e intentos por propietario;
- claves de examen inaccesibles;
- estudiante sin permisos editoriales;
- actividad de estudio denegada sobre borradores y retiradas;
- actividad permitida mientras la clase está publicada;
- progreso retirado sin mutaciones posteriores;
- rol editorial sin convertir un borrador en contenido estudiable.

## Estado real de ejecución

La última ejecución remota documentada fue el **29 de julio de 2026**:

- versión anterior de la suite;
- 20 de 20 comprobaciones aprobadas;
- recorrido editorial básico aprobado.

Desde entonces, el código amplió la suite a 31 comprobaciones y añadió la
migración `20260821021203_restrict_learning_activity_to_published_content.sql`.
Las once migraciones se aplicaron al proyecto CENEVAL y su historial y catálogo
se verificaron el 20 de agosto de 2026. La suite ampliada todavía no se ha
ejecutado allí.

La migración de aprobación de temas se aplicó después de esa verificación
inicial y su historial remoto también quedó confirmado. La suite dinámica
debe ampliarse para comprobar con dos identidades que una estudiante no puede
leer un tema pendiente o rechazado ni sus descendientes, mientras la
administradora conserva acceso.

Por lo tanto, la afirmación correcta es:

> Las once migraciones están aplicadas en CENEVAL. El comportamiento dinámico
> de ambas capas sigue pendiente de una ejecución autorizada de la suite
> actualizada.

## Orden seguro para cerrar la verificación

1. Configurar las credenciales locales exclusivamente para CENEVAL.
2. Revisar y aplicar la migración de aprobación de temas en una ventana
   autorizada, sin mezclarla con otros proyectos.
3. Ampliar y ejecutar `npm run security:rls` una sola vez para cubrir temas
   pendientes y rechazados.
4. Registrar fecha, commit, conteo y resultado sin copiar secretos.
5. Crear el primer respaldo verificable después de importar datos reales.

## Auditoría previa de funciones privilegiadas

El 29 de julio se revisaron las funciones declaradas entonces:

- `public.set_updated_at()` usa `security invoker` y fija `search_path`;
- `private.handle_new_user()` usa `security definer`, califica sus tablas y no
  concede ejecución directa a roles públicos;
- `private.is_admin()` usa `security definer`, compara con `auth.uid()` y solo
  puede ser invocada por `authenticated` para resolver políticas RLS.

La migración `20260821020934_restrict_rls_auto_enable_execute.sql` es portable:
revoca `public.rls_auto_enable()` solo cuando esa función existe. Los asesores
se ejecutaron después de aplicar todas las migraciones; el único aviso de
seguridad fue `exam_answer_keys` con RLS sin políticas, que es deliberado.

## Cobertura pendiente

- cuenta registrada pero todavía no verificada;
- pruebas de interfaz y recorridos reales en navegador;
- ejecutar la suite actual de 31 comprobaciones;
- activar protección contra contraseñas filtradas si el plan de Supabase lo
  permite en el futuro.

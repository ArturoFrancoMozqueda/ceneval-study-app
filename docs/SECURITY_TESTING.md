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
- integridad del procedimiento de respaldo con SQL sintético.

GitHub Actions ejecuta estas pruebas, lint y build en pull requests y pushes a
`main`, sin secretos y sin acceso a Supabase.

La comprobación `test:rls-policies` es estática: confirma que la migración
versionada contiene ownership, rol `authenticated`, encadenamiento a clase
publicada y `USING`/`WITH CHECK` para actualizaciones. No demuestra por sí sola
que la migración ya esté activa en la base remota.

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
migración
`20260820225524_restrict_learning_activity_to_published_content.sql`. No existe
evidencia en el repositorio de que esa migración se haya aplicado a Supabase ni
de que la suite ampliada se haya ejecutado allí.

Por lo tanto, la afirmación correcta es:

> Las políticas nuevas están versionadas y comprobadas de forma estática; su
> aplicación y comportamiento en Supabase remoto siguen pendientes de
> verificación autorizada.

## Orden seguro para cerrar la verificación

1. Completar el procedimiento autorizado de `docs/SUPABASE_BACKUP.md` y
   conservar una exportación verificable fuera del equipo.
2. Consultar el historial de migraciones del proyecto remoto.
3. Aplicar la migración pendiente, si corresponde, en una ventana autorizada.
4. Ejecutar `npm run security:rls` una sola vez después de aplicarla.
5. Registrar fecha, commit, conteo y resultado sin copiar secretos.
6. Repetir los asesores de seguridad y rendimiento de Supabase.

## Auditoría previa de funciones privilegiadas

El 29 de julio se revisaron las funciones declaradas entonces:

- `public.set_updated_at()` usa `security invoker` y fija `search_path`;
- `private.handle_new_user()` usa `security definer`, califica sus tablas y no
  concede ejecución directa a roles públicos;
- `private.is_admin()` usa `security definer`, compara con `auth.uid()` y solo
  puede ser invocada por `authenticated` para resolver políticas RLS.

También se restringió la ejecución de `public.rls_auto_enable()` mediante
`20260729173157_restrict_rls_auto_enable_execute.sql`. Esta evidencia pertenece
a esa fecha y no sustituye una nueva corrida de asesores tras las migraciones
posteriores.

## Cobertura pendiente

- cuenta registrada pero todavía no verificada;
- pruebas de interfaz y recorridos reales en navegador;
- confirmar la migración del 20 de agosto en remoto;
- repetir la suite actual de 31 comprobaciones y asesores;
- activar protección contra contraseñas filtradas si el plan de Supabase lo
  permite en el futuro.

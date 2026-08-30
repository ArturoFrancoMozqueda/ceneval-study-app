# Pruebas de seguridad y RLS

Última conciliación documental: 21 de agosto de 2026.

Hay dos niveles de comprobación y no deben confundirse:

1. pruebas locales y estáticas, seguras para CI;
2. una suite dinámica fail-closed que crea datos solo en Supabase local.

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
- contrato fail-closed, cobertura y diagnóstico seguro del runner RLS local;
- integridad del procedimiento de respaldo con SQL sintético.

GitHub Actions ejecuta estas pruebas, lint y build en pull requests y pushes a
`main`, sin secretos y sin acceso a Supabase remoto. Además, el workflow
`E2E local nocturno` ejecuta diariamente y bajo demanda el recorrido completo
con una instancia efímera de Supabase en loopback y Chromium. El job no recibe
credenciales de producción y ejecuta `supabase stop --no-backup` aun si falla.

La comprobación `test:rls-policies` es estática: confirma que la migración
versionada contiene ownership, rol `authenticated`, encadenamiento a clase
publicada y `USING`/`WITH CHECK` para actualizaciones. No demuestra por sí sola
que la migración ya esté activa en la base remota.

La comprobación `test:topic-approval-policies` revisa de forma local que la
migración `20260821023330_restrict_reading_to_approved_topics.sql` reemplace de
manera atómica e idempotente las nueve políticas de lectura, exija tema
`approved` y clase `published`, preserve `private.is_admin()` y mantenga los
filtros redundantes de `getTopic` y `getLessonBundle`.

## Suite RLS dinámica local

```text
npm run security:rls
```

El comando obtiene las credenciales con `supabase status`, exige el
`project_id` del repositorio, API y Postgres en puertos loopback conocidos y
rechaza cualquier destino remoto antes de escribir. Crea tres cuentas y un
paquete sintético 1.2, lo publica, ejecuta la suite y verifica en `finally` que
no queden clase, materia, referencia ni usuarios propios.

La suite actual contiene **141 comprobaciones**. Cubre:

- anónimo sin acceso a clases;
- contenido publicado y aprobado visible;
- temas pendientes y rechazados, junto con todos sus descendientes, ocultos;
- acceso editorial a contenido no aprobado;
- aislamiento de perfiles, progreso, comprobaciones y repasos por propietario;
- claves de examen inaccesibles;
- actividad permitida solo cuando la clase está publicada y el tema aprobado;
- las cuatro tablas de evidencia 1.2 y sus relaciones;
- RPC de importación y exportación denegadas a `anon` y `authenticated`;
- grants explícitos separados de RLS.

## Estado real de ejecución

La última ejecución remota histórica fue el **29 de julio de 2026**:

- versión anterior de la suite;
- 20 de 20 comprobaciones aprobadas;
- recorrido editorial básico aprobado.

Desde entonces, el runner se aisló de producción y la suite ampliada se ejecutó
en PG17 local después de aplicar las 17 migraciones desde cero. El 21 de agosto
de 2026 aprobó 141 de 141 comprobaciones y cleanup sin residuos. Durante el gate
se detectaron y corrigieron dos fallos: actividad permitida sobre temas no
aprobados y recursión `42P17` entre las políticas de evidencia.

Las once migraciones verificadas previamente continúan aplicadas en CENEVAL.
Las migraciones de persistencia y hardening aprobadas después de ese corte
siguen siendo locales hasta una aplicación remota expresamente autorizada.

Por lo tanto, la afirmación correcta es:

> Las once migraciones del corte remoto están aplicadas en CENEVAL. Las 17
> migraciones actuales y su comportamiento RLS están aprobados en PG17 local;
> aplicar las posteriores al remoto sigue requiriendo autorización explícita.

## Orden seguro para cerrar la verificación

1. Iniciar Supabase local y ejecutar `npm run security:rls`.
2. Confirmar 141 comprobaciones y cleanup con cuatro conteos en cero.
3. Registrar fecha, commit y resultado sin copiar secretos.
4. Antes de aplicar migraciones al remoto, generar y verificar un respaldo.
5. Aplicarlas solo en una ventana expresamente autorizada y repetir un smoke
   test no destructivo sobre el esquema resultante.

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
- aplicar las migraciones posteriores al corte remoto cuando se autorice;
- activar protección contra contraseñas filtradas si el plan de Supabase lo
  permite en el futuro.

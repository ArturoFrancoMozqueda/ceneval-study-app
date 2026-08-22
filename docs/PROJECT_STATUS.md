# Estado actual y siguientes pasos — CENEVAL Study App

Última actualización: 22 de agosto de 2026 (hora de México)

Base documental: `main` en `9c74f58` y verificación remota de solo lectura del
22 de agosto de 2026 (hora de México) contra el proyecto Supabase `CENEVAL
Study App` y el proyecto Vercel `ceneval-study-app`. El plan vigente para
comercializar la aplicación, con el estado verificado, los bloqueos y sus
evidencias de cierre, está en
[`PLAN_ACCION_VENTA.md`](PLAN_ACCION_VENTA.md); las decisiones de producto,
precio, proveedor y nombre comercial ya cerradas están en
[`PLAN_VENTA_DECISIONES.md`](PLAN_VENTA_DECISIONES.md).

Responsables: Fatima (administración y validación) y Codex (desarrollo y contenido)

Este documento describe el estado del código integrado. Los datos de Supabase
se citan con la fecha de su última auditoría; no se vuelven a dar por
verificados sin consultar el proyecto remoto.

## 1. Resumen ejecutivo

La aplicación tiene un núcleo local funcional: autenticación privada,
biblioteca académica, sesiones en orden curricular, materiales, mapas,
flashcards, repaso espaciado, exámenes, progreso, búsqueda y panel editorial.
Desde la auditoría del 19 de agosto se integraron correcciones de seguridad,
navegación, accesibilidad, estados de interfaz, dependencias y CI, y desde
entonces **el catálogo completo C01–C57 se importó, revisó y publicó** en el
proyecto remoto.

La verificación de solo lectura del 22 de agosto de 2026 confirmó que Vercel
está **conectado a Git**, con el último deployment `READY` en producción
correspondiente al commit actual de `main` (`9c74f58`); que las **19
migraciones** del repositorio están aplicadas en Supabase y coinciden una a
una con `supabase/migrations/`; y que el catálogo publicado tiene **24
materias, 57 clases (todas `published`), 57 temas (todos `approved`), 513
materiales, 57 mapas conceptuales, 685 flashcards, 57 exámenes, 570 preguntas
y 570 claves de respuesta**. `npm run lint` pasa sin hallazgos y el build de
producción del mismo commit se completó en Vercel. El detalle completo,
incluidos los asesores de seguridad, está en
[`PLAN_ACCION_VENTA.md`](PLAN_ACCION_VENTA.md) §1.

En términos simples: la brecha entre las migraciones locales y las remotas ya
se cerró, el despliegue ya no está desfasado de `main`, y C01–C57 ya no están
pendientes de importar ni publicar.

Los bloqueos operativos reales siguen siendo:

1. los 70 TXT originales ya tienen una primera copia privada verificada con
   SHA-256, pero todavía falta una segunda copia independiente y ensayar su
   restauración;
2. el mecanismo PostgreSQL ya pasó un respaldo y una restauración reales en
   local, pero todavía no existe una exportación del remoto, una copia externa
   cifrada ni una restauración de esa copia en un proyecto de ensayo;
3. C58 está bloqueada por insuficiencia de fuente y los tres bancos
   transversales y 16 exámenes acumulativos siguen pendientes de decisión de
   alcance;
4. **vender sigue bloqueado por razones no técnicas, no por el estado del
   código o del contenido**: no hay pagos, planes, checkout ni webhook; el
   registro sigue cerrado (`PRIVATE_ACCESS_ONLY=true`); no hay aviso de
   privacidad ni términos de uso publicados (dos equipos los están redactando
   en paralelo); no hay página pública de presentación (en desarrollo en
   paralelo); no hay dominio propio, respaldo real de la base remota ni
   monitoreo. El plan completo de qué falta para poder cobrar, con evidencia
   de cierre por tarea, está en [`PLAN_ACCION_VENTA.md`](PLAN_ACCION_VENTA.md);
   las decisiones de producto, precio y proveedor ya cerradas están en
   [`PLAN_VENTA_DECISIONES.md`](PLAN_VENTA_DECISIONES.md).

El historial de Git ya es útil y existe CI. Esos dos hallazgos de la auditoría
original están resueltos, pero ninguno reemplaza un respaldo real de la base
remota.

### Estado actual y producto objetivo

Hoy la aplicación es privada, la usa únicamente la administradora (1 usuario,
1 perfil administrador, 0 intentos de examen en producción), el registro de
estudiantes sigue pospuesto y no existen cobros. El objetivo de producto es
ofrecer acceso mediante suscripción cuando el marco legal, la infraestructura
apta para cobrar y la etapa de suscripción estén listos.

El producto comercial, el precio, el proveedor de pagos y el nombre comercial
**ya están decididos**: una sola suscripción a la biblioteca completa, $399
MXN/mes vía Stripe, bajo el nombre *Sube Legal*, sin periodo de prueba
gratuito. El detalle completo está en
[`PLAN_VENTA_DECISIONES.md`](PLAN_VENTA_DECISIONES.md). Esas decisiones no
autorizan por sí solas a abrir el registro ni a cobrar: falta el marco legal
(aviso de privacidad, términos de uso), la infraestructura apta para cobrar
(planes comerciales de Vercel y Supabase, dominio propio, correo
transaccional) y completar las etapas de `SUBSCRIPTION_ARCHITECTURE.md`, en
ese orden. El plan completo con sus evidencias de cierre está en
[`PLAN_ACCION_VENTA.md`](PLAN_ACCION_VENTA.md).

La arquitectura técnica objetivo ya está documentada en
[`SUBSCRIPTION_ARCHITECTURE.md`](SUBSCRIPTION_ARCHITECTURE.md) y registrada en
ADR-015. Separa rol y entitlement, deniega acceso por defecto y define
webhooks, RLS, conciliación, entornos y recuperación. Es diseño, no
funcionalidad integrada: no existe proveedor, checkout, webhook ni tabla de
suscripciones.

La decisión de datos y su roadmap están documentados en
[`DATA_ARCHITECTURE.md`](DATA_ARCHITECTURE.md) y ADR-016. Supabase PostgreSQL se
mantiene como fuente única de verdad; NoSQL, Redis, búsqueda vectorial,
particionado y réplicas solo se evaluarán al cruzar umbrales medidos. Esta
decisión no añade infraestructura ni reemplaza los gates operativos vigentes.

## 2. Inventario académico conocido

La verificación de solo lectura del proyecto remoto **CENEVAL Study App**
actualizada el 22 de agosto de 2026 (hora de México) confirmó **1 usuario con
inicio de sesión, 1 perfil administrador, 0 intentos de examen, 24 materias,
57 clases (todas `published`), 57 temas (todos `approved`), 513 materiales, 57
mapas conceptuales, 685 flashcards, 57 exámenes, 570 preguntas y 570 claves de
respuesta**. El catálogo C01–C57 ya está importado, revisado y publicado. Esto
confirma que el bootstrap administrativo ya ocurrió, pero no sustituye una
prueba E2E autenticada con más de una cuenta estudiante real (bloqueo B5 de
[`PLAN_ACCION_VENTA.md`](PLAN_ACCION_VENTA.md)). Sus 20 migraciones están
aplicadas (la más reciente, `terms_accepted_at`, del 22 de agosto por la
tarde, tarea `L-3`), coinciden una a una con `supabase/migrations/` y todas
las tablas
públicas tienen RLS.

| Elemento | Dato verificado el 22 de agosto de 2026 |
| --- | ---: |
| Clases académicas previstas (C01–C58) | 58 |
| Clases publicadas | 57 |
| Clases restantes (C58, bloqueada) | 1 |
| Materias con clases publicadas | 24 |
| Temas aprobados | 57 |
| Materiales publicados | 513 |
| Mapas conceptuales | 57 |
| Flashcards | 685 |
| Exámenes publicados | 57 |
| Preguntas de examen | 570 |
| Claves de respuesta | 570 |

El repositorio conserva C01–C57 como paquetes trazables en contrato 1.2 y una
versión retirada en el archivo editorial; esos mismos 57 ya están publicados
en el proyecto remoto. C41 usa Audio 54 y solo las líneas
13–69 pertinentes de Audio 55; C42 usa las líneas 85–295 de Audio 55; C43 usa
Audio 56, líneas 23–199; C44 usa Audio 58, líneas 13–297; C45 usa la línea
física 3 de Audio 59 solo como contexto amplio y sustenta las reglas en la
LFT oficial; C46 usa rangos acotados de Audio 59 y Audio 60, excluyendo esa
línea mixta no delimitable; C47 usa rangos pertinentes de Audio 60 y corrige
las generalizaciones procesales con la LFT; C48 usa líneas breves de Audio
61 y la línea 31 solo como contexto amplio, excluyendo las líneas gigantes 29
y 33; C49 usa rangos verificables de Audio 62 y limita sus reglas al régimen
vigente de Michoacán; C50 usa solo las líneas 15–19 y 21–25 de Audio 69
para enseñar el modelo nacional condicionado a declaratoria territorial; C51
usa rangos mínimos de Audio 46 y corrige la formalidad de capitulaciones con el
Código Familiar de Michoacán; C52 usa únicamente el bloque familiar de Audio
63 y excluye la sucesión que comienza en la línea 57; C53 cubre los subrangos
académicos de Audio 67, líneas 169–265, y separa el régimen michoacano del
modelo nacional gradual; C54 usa las líneas físicas completas 3, 5 y 9 de
Audio 68 sin inventar sublíneas, porcentajes ni recursos automáticos; C55 usa
solo subrangos sucesorios pertinentes de Audio 63, líneas 75–155; y C56 usa
Audio 63, líneas 157–209, y Audio 64, líneas 17–45, excluyendo el cierre no
pertinente 211–231; y C57 usa subrangos académicos de Audio 64, líneas 47–109,
para inventario, avalúo y oposición. C58 permanece bloqueada: la auditoría de
70/70 TXT y 14/14 lotes no encontró una transcripción suficiente sobre
administración, cuentas, partición y adjudicación (`docs/C58_SOURCE_AUDIT.md`).
C01–C57 ya están importados, revisados y publicados en el proyecto CENEVAL; no
queda una importación pendiente para ellos.

Existen tres identificadores distintos:

- Audio 01–70: procedencia de las transcripciones;
- C01–C58: orden académico recomendado;
- ID de Supabase: identificador técnico sin significado curricular.

C40 tiene el ID 49; eso no significa que existan 49 clases vigentes.

## 3. Estado técnico integrado

### Plataforma y dependencias

- Next.js 16.3.1 con App Router.
- React y React DOM 19.2.4.
- Supabase JS 2.110.8 y `@supabase/ssr` 0.12.3.
- Supabase CLI 2.115.0 fijada como dependencia de desarrollo para respaldos.
- Zod 4.4.3, TypeScript 5 y Tailwind 4.
- Node 24.14.0 fijado en `.node-version`.
- `npm audit --audit-level=moderate` reportó cero vulnerabilidades el 20 de
  agosto de 2026 sobre el árbol versionado.

### Integración continua

`.github/workflows/ci.yml` ejecuta en cada pull request y cada push a `main`:

1. `npm ci --ignore-scripts`;
2. `npm run test:local`;
3. `npm run lint`;
4. `npm run build`.

Las acciones de terceros están fijadas por SHA, el job tiene permisos de solo
lectura y no recibe secretos. La CI no se conecta a Supabase ni sustituye las
pruebas de interfaz o la suite RLS remota.

El contrato del gate `npm run db:lint:local` usa exclusivamente la instancia
local de Supabase y falla ante cualquier advertencia de `plpgsql_check`. Antes
de ejecutarlo, Supabase local debe estar activo; el comando no acepta
`--linked`, una URL ni una referencia de proyecto remoto.

### Despliegue técnico en Vercel

CENEVAL tiene un despliegue técnico privado en Vercel sobre Hobby; la cuenta no
se cambió a Pro (sigue sin permitir uso comercial, bloqueo B2 de
[`PLAN_ACCION_VENTA.md`](PLAN_ACCION_VENTA.md)). La verificación de solo
lectura del 22 de agosto de 2026 (hora de México) encontró que **el proyecto
ya está conectado a Git**: el último deployment está `READY`, target
`production`, y corresponde al commit actual de `main` (`9c74f58`). Ya no
depende de una publicación manual para reflejar el código más reciente.
`GET /api/health/live` responde `200`; `GET /api/health/ready` responde `404`
sin token, que es el comportamiento correcto y esperado (exige el token de
operaciones). Esto reemplaza el hallazgo del 21 de agosto, que había
encontrado cuatro deployments manuales desfasados de `main` (`5f0c7e0`), con
ambos endpoints de health respondiendo `404` por estar desactualizados.
`npm run lint` pasa sin hallazgos y el build de producción del mismo commit se
completó en Vercel.

La consulta de solo lectura de los metadatos de entorno de Vercel del 21 de
agosto, sin leer ni imprimir valores, no encontró ninguna de las siete
variables obligatorias de `.env.example` en el proyecto; esa comprobación
específica no se repitió el 22 de agosto y sigue sin confirmarse que las
variables persistan separadas por entorno Preview/Production. Antes de operar
deben configurarse y comprobarse los alcances Preview/Production de
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`,
`PRIVATE_ACCESS_ONLY` y `OPS_READINESS_TOKEN`, además de las redirecciones de
Supabase Auth (tarea `I-6` de `PLAN_ACCION_VENTA.md`). El bootstrap de
`docs/ADMIN_BOOTSTRAP.md` ya produjo el único perfil administrador con inicio
de sesión confirmado hoy; falta repetir el E2E autenticado sobre el artefacto
publicado con más de una cuenta.

`docs/DEPLOYMENT_RUNBOOK.md` ya define un flujo fail-closed para registrar SHA,
CI, proyecto, deployment anterior, preview, digest del build Production,
health, recorrido administrativo, logs y rollback de aplicación. Distingue las
configuraciones Preview/Production porque `NEXT_PUBLIC_*` queda congelado en
cada build, y no promete rollback de base de datos. El procedimiento todavía no
se ha ejecutado contra Vercel.

### Respaldo de Supabase

`docs/SUPABASE_BACKUP.md` documenta un respaldo lógico con la CLI fijada:

- `npm run test:backup` crea datos sintéticos y comprueba integridad local sin
  red ni credenciales;
- `npm run backup:supabase -- -ConfirmProduction` es el único comando que lee
  el proyecto remoto y exige autorización expresa;
- `npm run backup:verify` valida archivos, tamaños y sumas SHA-256;
- el procedimiento exige copia cifrada externa y restauración separada en un
  proyecto de ensayo.

El mecanismo está versionado y su prueba sintética forma parte de
`test:local`. Además, `npm run test:backup-restore:local` pasó el 21 de agosto
de 2026 contra PostgreSQL 17 local: creó un dump binario, lo restauró en una
base temporal, comparó esquema, RLS, datos, evidencia, digests y round-trip 1.2,
y terminó sin bases, archivos ni datos sintéticos residuales. Esta comprobación
no equivale a restaurar una exportación de CENEVAL: todavía no se ha generado un
respaldo remoto real ni existe una copia externa comprobada. Los respaldos
pueden contener datos privados y están excluidos de Git.

### Navegación y estados

- `/sesiones` muestra las clases publicadas por orden Cxx y por audio.
- La navegación anterior/siguiente usa el orden curricular.
- Las vistas de materia muestran el código Cxx; ya no numeran por posición.
- Existen `app/error.tsx`, `app/global-error.tsx`, `app/loading.tsx` y
  `app/not-found.tsx`, todos en español y con una salida comprensible.
- Hay estados vacíos con acciones en sesiones, materias, clase, estudio y
  administración, además de un estado específico para una cola de repaso vacía.
- Los estados editoriales se traducen mediante `lib/status-labels.ts`.
- La cuenta móvil permite cambiar contraseña y cerrar sesión.
- El foco visible usa un anillo opaco de alto contraste.
- La navegación ofrece un enlace para saltar al contenido y el progreso expone
  semántica ARIA.
- La interfaz solo confirma el guardado después de recibir éxito del servidor y
  muestra un error cuando falla.
- Los pasos completados describen el recorrido, no afirman dominio académico;
  se retiraron el selector de minutos sin efecto y la falsa comprobación que
  repetía una flashcard.

Esto resuelve los hallazgos generales de ausencia de estados y numeración. No
equivale todavía a una prueba automática de cada URL inválida o de todos los
recorridos en navegador.

### Gate editorial e importación

El contrato 1.2 añade el gate de confianza editorial:

- exige evidencias estables para cada dinámica y localizadores verificables;
- todo tema nuevo debe comenzar en `pending`;
- la transición de clase es `draft → review → published`;
- el dictamen registra administradora, fecha, notas, versión y digest;
- modificar o rechazar contenido invalida la aprobación anterior;
- la evidencia transcriptiva conserva audio y localizador, sin guardar ni
  mostrar el texto privado en la aplicación.

Los 57 paquetes C01–C57 tienen código, orden y fuentes portables. C01–C57 ya
usan 1.2: sus 139, 130, 133, 133, 137, 137, 138, 138, 140, 141, 139, 142, 144
y 138, 137, 142, 142, 142, 143, 148, 150, 152, 151, 150, 152, 150, 150, 149, 151, 151, 151, 151, 151, 151, 151, 151, 154, 155, 156, 155, 150, 153, 148, 154, 148, 150, 148, 150, 150, 151, 153, 150, 154, 149, 153, 149 y 149 artefactos quedaron enlazados a
12, 17, 12, 12, 14, 18, 10, 15, 13, 18, 21, 16, 12, 12, 12, 12, 15, 10, 18,
15, 18, 14, 16, 19, 19, 21, 15, 20, 15, 16, 15, 13, 13, 15, 14, 17, 13, 14, 16, 24, 16, 15, 12, 16, 9, 16, 12, 12, 10, 12, 10, 10, 16, 11, 18, 10 y 10 evidencias verificables, respectivamente, y pasan el gate
local sin importar contenido. El importador acepta
exclusivamente 1.2 y delega la escritura a
una única RPC transaccional que persiste el registro de
evidencias, journeys y vínculos editoriales; 1.0 y 1.1 fallan antes de llamar a
Supabase. La versión sustituida de C14 permanece en el archivo 1.0 no
importable.

La implementación pasó pruebas unitarias, TypeScript, lint y build. Las
migraciones locales (19, coincidentes con el remoto) se aplicaron desde cero en
PostgreSQL 17.6 y el runner dinámico comprobó round-trip semántico, 2
evidencias, 118 artefactos, 236 vínculos, estados `draft`/`pending`, rechazo de
duplicados sin residuos y RPC denegadas a `anon` y `authenticated`. Esa
persistencia de 1.2 ya está aplicada en el proyecto remoto y C01–C57 ya se
importaron, revisaron y publicaron: verificado el 22 de agosto de 2026 con 57
clases y 57 temas en estado `published`/`approved`.

### Controles editoriales concurrentes

La revisión de temas evita solicitudes duplicadas desde la interfaz: desactiva
aprobar y rechazar mientras hay un cambio pendiente, muestra el estado de la
operación y anuncia el resultado o error a tecnologías de asistencia. Las
Server Actions vuelven a validar rol, identificadores y estado, y no devuelven
detalles internos de Supabase.

La migración
`20260821021205_create_topic_with_next_position.sql` reemplaza el cálculo
separado de `count + 1` por una función transaccional. Un bloqueo asesor por
clase serializa únicamente las altas que compiten por la siguiente posición;
la función usa `security invoker` y solo concede ejecución a `service_role`.

**Estado remoto:** la migración está aplicada en CENEVAL y se verificó en su
historial. La comprobación estática local también forma parte de CI. La función
puede usarse en ese proyecto; una instalación nueva debe aplicar todas las
migraciones antes de habilitar la Server Action.

### Examen y retroalimentación

- La Server Action valida con Zod IDs enteros positivos y una forma estricta.
- Comprueba que el examen sea visible para la sesión autenticada.
- Rechaza preguntas ajenas, respuestas incompletas y opciones que no
  pertenecen a la pregunta o al examen entregado.
- La calificación sigue en servidor y `exam_answer_keys` permanece bloqueada
  por RLS para clientes autenticados.
- Al terminar, la interfaz muestra la explicación general y la explicación de
  la opción elegida.
- No se envían explicaciones de opciones no elegidas.
- Hay pruebas locales para selección cruzada, forma inválida y exposición
  mínima de retroalimentación.
- `/progreso/examenes` lista únicamente los intentos de la sesión autenticada,
  con paginación por cursor, fecha, puntuación y etiquetas de examen vigente o
  histórico. Los intentos anteriores no se sobrescriben.
- El detalle recupera las respuestas mediante RLS y muestra solo la opción
  elegida y si fue correcta; no consulta ni expone `exam_answer_keys` u otras
  opciones. Los exámenes vigentes enlazan de vuelta al tema para repetirlos.

### Repaso y progreso

- `/estudiar/repaso` usa `next_review_at` para construir la cola vencida.
- La prioridad considera dificultad y antigüedad.
- `getReviewOverview` obtiene el resumen mediante una sola RPC `security
  invoker`, en una llamada y una ola. La identidad procede de `auth.uid()` y
  nunca se acepta como parámetro; la función entrega una sola fila JSON y no
  transfiere el historial completo a Node.
- Los contadores usan únicamente la revisión más reciente de cada tarjeta y la
  comprobación más reciente de cada tema; ya no crecen indefinidamente por el
  historial acumulado.
- Los empates se resuelven de forma determinista por fecha y después por ID;
  solo cuentan temas aprobados de clases publicadas y actividad propia. La
  respuesta no trunca las tarjetas vencidas: si una medición real muestra un
  payload excesivo, el siguiente hito será paginar la experiencia de repaso,
  no ocultar pendientes.
- Una cola vacía informa cuándo será el próximo repaso, si existe fecha.
- `getStudyProgress` filtra por `topic_id` y por el `user_id` autenticado.
- `/progreso` compara por materia temas con actividad y temas con sus cinco
  pasos completos contra el total aprobado de clases publicadas.
- La misma vista separa evidencia verificable: aciertos sobre preguntas en
  intentos finalizados del examen vigente y la última autoevaluación de cada
  tema comprobado. No convierte la señal `needs_review` en una calificación.
- Las cuatro consultas se ejecutan en paralelo, filtran por el `user_id` de la
  sesión cuando leen actividad y encadenan el contenido a clases publicadas.

### Acciones de estudio y RLS

Las acciones de revisión, progreso y comprobación rápida:

- validan la entrada con esquemas estrictos;
- derivan `user_id` de la sesión;
- resuelven primero el recurso con el cliente autenticado sujeto a RLS;
- solo escriben si la cadena termina en una clase publicada;
- devuelven mensajes que no permiten enumerar borradores o IDs inexistentes.

La migración
`20260821021203_restrict_learning_activity_to_published_content.sql` añade la
misma condición a la Data API para `flashcard_reviews`, `study_progress` y
`quick_check_responses`. La migración es transaccional y su estructura se
comprueba localmente en CI.

**Estado de despliegue de esa migración:** aplicada en CENEVAL y verificada en
el historial el 20 de agosto de 2026. Aún no existe una ejecución posterior de
las 31 comprobaciones actuales; la última ejecución dinámica documentada sigue
siendo la suite anterior de 20 comprobaciones, aprobada el 29 de julio de 2026.

### Lectura limitada a temas aprobados

La migración
`20260821023330_restrict_reading_to_approved_topics.sql` corrige una separación
incompleta entre publicación de clase y aprobación de tema. Para estudiantes,
un tema ahora debe estar `approved` y pertenecer a una clase `published`. La
misma cadena protege materiales, mapas, referencias, flashcards, exámenes,
preguntas y opciones. `private.is_admin()` conserva la visibilidad editorial.

Como defensa adicional, `getTopic` filtra explícitamente por aprobación y
`getLessonBundle` rechaza cualquier tema que no esté aprobado. La prueba
`test:topic-approval-policies` verifica localmente la migración y ambos filtros
sin conectarse a Supabase.

**Estado remoto:** esta undécima migración se aplicó en CENEVAL y se verificó
en el historial el 20 de agosto de 2026. La revisión de solo lectura del 21 de
agosto (hora de México) mantuvo el `INFO` esperado de `exam_answer_keys` sin
políticas —bloqueo deliberado— y encontró un `WARN` porque la protección contra
contraseñas filtradas está desactivada. Antes de abrir el acceso estudiantil, una persona
autorizada debe habilitar esa protección y ejecutar la suite RLS dinámica con
temas pendientes y rechazados, primero en un proyecto de ensayo.

**Estado local posterior:** PostgreSQL 17.6 aplica dieciocho migraciones desde
cero. `npm run security:rls:local` ejecuta 141 comprobaciones sobre contenido
sintético y verifica RPC, ownership, tablas trazables, temas `pending` y
`rejected`, claves de examen y limpieza sin residuos. El ensayo detectó y
corrigió que la actividad debía exigir tema aprobado y una recursión entre
políticas de evidencia. Estas correcciones aún no están en CENEVAL remoto.

El 21 de agosto de 2026 se repitió el gate con Supabase CLI 2.115.0 y Docker
29.6.1: las 141 comprobaciones RLS pasaron con limpieza final en cero;
`test:content-db-local` conservó 2 evidencias y 236 vínculos en el round-trip,
rechazó el segundo import duplicado y no dejó residuos; y los asesores locales
reportaron cero problemas de rendimiento. El único aviso de seguridad fue el
`INFO` esperado de `exam_answer_keys` sin políticas, cuyo bloqueo deliberado
también cubre la suite. Estos resultados son exclusivamente locales y no
sustituyen el gate pendiente en un proyecto remoto de ensayo.

Ese mismo entorno aplicó la migración 18 del resumen de repaso y ejecutó una
prueba específica con dos estudiantes, una administradora y más de 500 eventos
históricos. La RPC devolvió una sola fila, respetó el último evento por fecha e
ID, calculó vencimiento, dificultad y próxima fecha, ocultó temas y clases no
publicables, denegó ejecución a `anon` y `service_role` y terminó con cero
residuos. El lint de base quedó en cero advertencias y la suite RLS conservó
141/141 comprobaciones. Es evidencia exclusivamente local.

## 4. Seguridad y calidad: qué está probado

`npm run test:local` reúne pruebas sin Supabase ni disco `F:` para:

- entrega y calificación segura del examen;
- derivación, paginación y enlaces seguros del historial de intentos;
- cálculo de repaso espaciado;
- derivación de progreso por materia y ausencia explícita de desempeño cuando
  no existen intentos válidos;
- esquema del paquete académico;
- honestidad del progreso, autosave, onboarding y semántica accesible;
- redirecciones permitidas en confirmación de autenticación;
- validación y mensajes del inicio de sesión;
- cabeceras de seguridad;
- entrada de acciones de estudio;
- estructura esperada de las políticas RLS nuevas;
- bloqueo de lectura de temas no aprobados y sus descendientes en RLS y DAL;
- integridad del procedimiento de respaldo con datos sintéticos.

También existen cabeceras de seguridad, redirección de autenticación limitada
a destinos internos y un aviso educativo/de vigencia en la interfaz.

Con Supabase local activo, `npm run test:content-db-local` prueba el round-trip
1.2 y `npm run test:e2e:local` prepara usuarios y contenido sintéticos, compila
y levanta la app en un puerto loopback dedicado. El 21 de agosto el E2E recorrió
en Chromium el acceso privado, skip-link, navegación por teclado, autosave,
diez tarjetas, examen de diez reactivos, resultado, historial, panel editorial
de solo lectura y cuatro rutas inválidas. También pasó en un viewport móvil
táctil de 320 px, comprobó targets de 24 px, movimiento reducido computado y
un proxy de reflow para zoom de 200%, con cero errores de consola, página, HTTP
5xx o red no permitidos y limpieza final en cero. La evidencia y sus límites
están en `docs/ACCESSIBILITY_TESTING.md`: todavía no sustituye pruebas manuales
con lectores de pantalla ni zoom real. Ese mismo día
`test:backup-restore:local` volvió a completar en PostgreSQL 17 el respaldo,
restauración y round-trip sin artefactos residuales. Los runners rechazan URLs
no locales; ninguna de estas pruebas escribió en CENEVAL remoto.

Queda pendiente:

- crear un proyecto de ensayo aparte de producción, aplicar allí las 20
  migraciones desde cero y repetir la suite RLS con datos sintéticos (tarea
  `M-1` de `PLAN_ACCION_VENTA.md`); las 20 migraciones ya están aplicadas en
  CENEVAL, pero ese ensayo con datos no reales sigue sin hacerse;
- mantener `npm run db:lint:local` sin advertencias; la migración nueva ya
  eliminó los doce avisos de `private.import_class_package_v12` y el reset,
  lint, round-trip RPC y RLS local volvieron a pasar;
- ejecutar y registrar la matriz manual de accesibilidad con lectores de
  pantalla, zoom real, contraste alto y dispositivos físicos;
- dejar de degradar silenciosamente ciertos errores de progreso a `null`.

## 5. Contenido terminado y pendiente

El inventario editorial registra contenido preparado para C01–C57: cada clase
tiene transcripción conservada, versión depurada, nueve materiales, mapa,
flashcards, diez reactivos y fuentes. C01–C57 pasan el gate local 1.2 y **ya
están importados, revisados y publicados** en el proyecto remoto (verificado
el 22 de agosto de 2026: 57 clases publicadas, 57 temas aprobados).

La decisión de minimización ya está implementada localmente. El cargador lee
los TXT privados y valida el paquete editorial completo; antes de invocar la
RPC proyecta el contrato 1.2 sin la clave `transcript`. Supabase conserva las
dinámicas, el registro de evidencia y sus localizadores, pero no el texto
original ni el depurado. La exportación reconstruye esa misma proyección y el
round-trip comprueba que no se pierdan artefactos, vínculos o recorrido. La
interfaz administrativa ya no ofrece captura o lectura de transcripciones. La
migración de minimización (`20260822034153_minimize_transcript_storage.sql`)
ya está aplicada en el proyecto remoto junto con el resto; la importación de
C01–C57 se completó con esa protección activa.

Orden de producción restante:

| Orden | Clase | Fuente principal |
| ---: | --- | --- |
| 1 | C58 Administración, partición y adjudicación | Bloqueada hasta recibir una nueva transcripción suficiente |

Además siguen pendientes tres bancos transversales y 16 exámenes acumulativos.

## 6. Plan vigente

El plan detallado para poder cobrar, con sus bloqueos y evidencias de cierre,
está en [`PLAN_ACCION_VENTA.md`](PLAN_ACCION_VENTA.md); lo que sigue aquí es el
plan de trabajo técnico y de contenido, que es complementario.

### Prioridad 0 — Proteger y comprobar

1. Crear una segunda copia independiente de las 70 transcripciones y verificarla
   contra el manifiesto privado; la primera copia ya fue comprobada el 21 de
   agosto de 2026 sin diferencias.
2. Seguir `docs/SUPABASE_BACKUP.md`: generar una exportación autorizada,
   verificarla, copiarla fuera del equipo y restaurarla en un proyecto de ensayo.
3. Ampliar y ejecutar `npm run security:rls` en el proyecto CENEVAL y
   registrar el resultado. Esta suite crea y elimina datos remotos; no
   pertenece a CI.
4. Crear un proyecto de ensayo Supabase aparte de producción, aplicar las 19
   migraciones desde cero y repetir allí la suite RLS con datos sintéticos
   (tarea `M-1` de `PLAN_ACCION_VENTA.md`). La persistencia 1.2 y C01–C57 ya
   están aplicados y publicados directamente en el proyecto de producción; este
   ensayo separado con datos que no sean reales sigue pendiente.

### Prioridad 1 — Cerrar el pipeline con C01–C57

1. Mantener los localizadores reales y paquetes C01–C57 en contrato 1.2.
2. Verificar por round-trip dinámico que el registro de evidencias persiste sin
   pérdidas.
3. Revisar vigencia jurídica y conteos editoriales.
4. Publicar solo después de la revisión autorizada.
5. Comprobar localmente el recorrido borrador, revisión, aprobación y publicación.

### Prioridad 2 — Desbloquear C58

Obtener una nueva transcripción académica íntegra sobre administración y
cuentas, partición, oposición y adjudicación hereditaria. No crear un paquete
solo con legislación; repetir después el pipeline 1.2 completo descrito en
`C58_SOURCE_AUDIT.md`.

### Prioridad 3 — Calidad de producto

1. Automatizar inicio de sesión, biblioteca, clase, repaso, examen y progreso
   en un navegador real.
2. Probar URLs inválidas, estados vacíos, errores y recuperación.
3. Auditar teclado, lector de pantalla, contraste y uso móvil.
4. Medir la aplicación con 58 clases.

### Prioridad 4 — Despliegue y operación

1. Persistir y verificar las variables de Vercel sin exponer secretos.
2. Configurar las redirecciones de Supabase Auth y probar contra el artefacto
   publicado la cuenta administradora ya creada, su inicio de sesión y acceso
   privado.
3. Probar login y rutas privadas desde teléfono y computadora, y revisar logs.
4. Ejecutar y aprobar el runbook en la siguiente publicación. Vercel ya está
   conectado a Git, así que el despliegue ya no depende de una publicación
   manual; falta ejecutar el runbook completo sobre ese flujo.
5. Añadir monitoreo continuo; el runbook actual solo cubre observación manual
   en Hobby, respaldo y restauración.
6. Proveedor, planes/precio, prueba, cancelación y reembolsos ya están
   decididos en `PLAN_VENTA_DECISIONES.md`; sigue pendiente cerrar el régimen
   fiscal por escrito y el soporte antes de implementar registro o pagos.
7. Seguir los gates incrementales de `SUBSCRIPTION_ARCHITECTURE.md`: dominio y
   autorización sin cobro, sandbox cerrado, piloto privado y solo después
   apertura comercial explícita.
8. Capturar la línea base de datos definida en `DATA_ARCHITECTURE.md` antes de
   añadir caché, réplicas, búsqueda semántica u otro motor.

## 7. Próximas tareas ejecutables

| # | Tarea | Evidencia para cerrarla |
| ---: | --- | --- |
| 1 | Completar el respaldo de transcripciones | Segunda copia independiente y restauración de ensayo |
| 2 | Ejecutar y probar el respaldo documentado | Exportación fechada, copia externa verificada y restauración de ensayo |
| 3 | Ampliar y ejecutar la suite RLS | Comprobaciones actuales y casos de temas no aprobados aprobados en CENEVAL |
| 4 | Crear un proyecto de ensayo Supabase aparte de producción para repetir la suite RLS con datos que no sean reales | Proyecto de ensayo con las 20 migraciones aplicadas y RLS aprobada (tarea `M-1` de `PLAN_ACCION_VENTA.md`) |
| 5 | Aprobar C01–C57 — completado | 57 clases publicadas y 57 temas aprobados, verificado el 22 de agosto de 2026 en el proyecto remoto |
| 6 | Crear pruebas de navegador | Flujos centrales reproducibles en CI o entorno aislado |
| 7 | Completar y validar el despliegue privado | Variables persistentes, administradora operativa y URL estable aprobada desde teléfono y computadora |
| 8 | Cerrar los bloqueos de venta (marco legal, infraestructura apta para cobrar, respaldo real) | Fases 1 a 3 de `PLAN_ACCION_VENTA.md` con evidencia de cierre |

## 8. Decisiones de producto abiertas

1. Definir responsables y periodicidad de la revisión jurídica trazable.
2. Confirmar si el estándar definitivo es de tres o cuatro opciones por reactivo.
3. Decidir el alcance de los 16 exámenes acumulativos (tarea `P-6` de
   `PLAN_ACCION_VENTA.md`).
4. Definir responsables del repositorio, Supabase, respaldo y despliegue
   (resuelto para titularidad de cuentas en `PLAN_VENTA_DECISIONES.md` D-8;
   falta el resto).
5. Proveedor, planes, precio, nombre comercial, prueba, cancelación y
   reembolsos de la futura suscripción **ya están decididos** en
   [`PLAN_VENTA_DECISIONES.md`](PLAN_VENTA_DECISIONES.md): Stripe, $399
   MXN/mes, sin periodo de prueba, *Sube Legal*. Sigue pendiente la
   confirmación fiscal por escrito del contador (D-7) y la búsqueda formal de
   marca en el IMPI (D-9). Hasta cerrar esas dos piezas y el resto de las
   Fases 1 a 3 de `PLAN_ACCION_VENTA.md`, el registro se mantiene cerrado.

## 9. Definición de terminado

El proyecto estará terminado cuando existan 58 clases publicadas y navegables,
los bancos y exámenes acumulativos acordados, protección RLS verificada en
remoto, pruebas automáticas de los flujos centrales, experiencia accesible en
teléfono y computadora, despliegue estable, respaldo restaurable y manual de
operación aprobado por Fatima. Para ofrecerla comercialmente, además deberán
estar aprobados e implementados el modelo de suscripción, el control de acceso
correspondiente y sus recorridos de alta, cobro, cancelación y soporte.

## 10. Siguiente acción inmediata

Con C01–C57 ya publicadas, la siguiente acción es proteger lo que ya existe y
avanzar el plan de venta, no producir más contenido:

1. crear una segunda copia independiente del archivo editorial y ensayar su restauración;
2. ejecutar y completar el procedimiento de `docs/SUPABASE_BACKUP.md`;
3. crear un proyecto de ensayo aparte de producción para repetir el gate RLS
   dinámico con datos sintéticos (tarea `M-1` de `PLAN_ACCION_VENTA.md`); las
   migraciones y el contenido C01–C57 ya se aplicaron y publicaron
   directamente en CENEVAL, sin pasar primero por ese ensayo;
4. solicitar la nueva transcripción definida en `C58_SOURCE_AUDIT.md`; C58 no
   puede producirse honestamente con el corpus actual;
5. avanzar las Fases 1 a 3 de [`PLAN_ACCION_VENTA.md`](PLAN_ACCION_VENTA.md)
   (legal, infraestructura y respaldo real) — la Fase 0 (decisiones) ya cerró
   con [`D1_DERECHOS_AUDIOS.md`](D1_DERECHOS_AUDIOS.md) y
   [`PLAN_VENTA_DECISIONES.md`](PLAN_VENTA_DECISIONES.md).

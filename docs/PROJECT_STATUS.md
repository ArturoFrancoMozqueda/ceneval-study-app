# Estado actual y siguientes pasos — CENEVAL Study App

Última actualización: 21 de agosto de 2026

Base documental: `origin/main` en `d63d78d`, con trabajo 1.2 en la rama
`feature/persistencia-evidencia-12`

Responsables: Fatima (administración y validación) y Codex (desarrollo y contenido)

Este documento describe el estado del código integrado. Los datos de Supabase
se citan con la fecha de su última auditoría; no se vuelven a dar por
verificados sin consultar el proyecto remoto.

## 1. Resumen ejecutivo

La aplicación tiene un núcleo local funcional: autenticación privada,
biblioteca académica, sesiones en orden curricular, materiales, mapas,
flashcards, repaso espaciado, exámenes, progreso, búsqueda y panel editorial.
Desde la auditoría del 19 de agosto se integraron correcciones de seguridad,
navegación, accesibilidad, estados de interfaz, dependencias y CI.

Los bloqueos operativos reales siguen siendo:

1. los 70 TXT originales ya tienen una primera copia privada verificada con
   SHA-256, pero todavía falta una segunda copia independiente y ensayar su
   restauración;
2. existe un procedimiento seguro de respaldo, pero todavía no una exportación
   comprobable de la base, una copia externa ni una restauración probada;
3. el esquema y las once migraciones ya están aplicados en CENEVAL, pero la
   suite RLS dinámica de 31 comprobaciones todavía no se ha ejecutado;
4. existe un despliegue técnico privado en un proyecto separado de Vercel
   Hobby, pero faltan persistir los secretos, ejecutar el bootstrap explícito
   de la administradora y validar registro, verificación y acceso; no hay
   despliegue automático desde Git;
5. C41–C58 y los bancos acumulativos siguen pendientes.

El historial de Git ya es útil y existe CI. Esos dos hallazgos de la auditoría
original están resueltos, pero ninguno reemplaza un respaldo de la base.

### Estado actual y producto objetivo

Hoy la aplicación es privada, la usa únicamente la administradora, el registro
de estudiantes está pospuesto y no existen cobros. El objetivo de producto es
ofrecer acceso mediante suscripción cuando contenido, seguridad, operación y
despliegue estén listos.

Ese objetivo no autoriza todavía a abrir el registro ni define proveedor de
pagos, precios, planes, periodo de prueba, cancelaciones o fecha de lanzamiento.
Esas decisiones deben resolverse antes de concretar o implementar la venta.

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

La lectura del proyecto remoto **CENEVAL Study App** realizada el 21 de agosto
de 2026 confirmó **1 fila en `profiles`, 0 materias, 0 clases y 0 temas**. Esa
fila no demuestra por sí sola que el acceso administrativo esté operativo. Sus
once migraciones están aplicadas y todas las tablas públicas tienen RLS.

La auditoría del 12 de agosto registró el siguiente inventario en una base
anterior, pero esos datos no están presentes en el proyecto CENEVAL conectado:

| Elemento | Último dato conocido |
| --- | ---: |
| Clases académicas previstas | 58 |
| Clases publicadas | 40 |
| Clases restantes | 18 |
| Versiones retiradas conservadas | 2 |
| Materias con clases publicadas | 15 |
| Temas publicados | 40 |
| Materiales publicados | 360 |
| Mapas conceptuales | 40 |
| Flashcards | 480 |
| Preguntas de examen | 400 |

El repositorio conserva 40 paquetes C01–C40 legibles en contrato 1.1 y una
versión retirada en el archivo editorial. Todavía no son publicables bajo el
gate trazable 1.2. La siguiente clase planeada es **C41
— Juicio ejecutivo mercantil oral**, con Audio 54 y la primera parte del Audio
55. Antes de disponer de esa biblioteca en la aplicación habrá que
importar C01–C40 en el proyecto CENEVAL correcto.

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

### Despliegue técnico en Vercel

CENEVAL tiene un despliegue técnico privado en un proyecto separado de Vercel
sobre Hobby; la cuenta no se cambió a Pro. La publicación responde por HTTPS y
redirige a la pantalla de acceso, pero todavía no equivale a un servicio
operativo ni a un lanzamiento comercial: Supabase conserva las once migraciones
y continúa con 0 usuarios y 0 contenido.

El despliegue actual recibió las variables públicas y `PRIVATE_ACCESS_ONLY`
durante la compilación. Antes de operar deben persistirse mediante el almacén
seguro de Vercel `SUPABASE_SECRET_KEY`, `ADMIN_EMAIL` y el resto de variables,
ejecutar el procedimiento explícito de `docs/ADMIN_BOOTSTRAP.md`, configurar las
redirecciones de Supabase Auth y probar el recorrido convencional de registro,
verificación e inicio de sesión. El proyecto no está conectado a Git; cada
despliegue es manual y debe registrar el commit publicado.

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
`test:local`. **Todavía no se ha generado un respaldo real**, no existe copia
externa comprobada y no se ha ensayado una restauración. Los SQL pueden contener
datos privados y están excluidos de Git.

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
- la transcripción queda restringida a administración.

Los 40 paquetes C01–C40 tienen código, orden y fuentes portables en 1.1, pero
no pasan el nuevo gate. C01 permanece sin migrar porque faltan localizadores
verificables; no se inventó evidencia. El importador acepta exclusivamente 1.2
y delega la escritura a una única RPC transaccional que persiste el registro de
evidencias, journeys y vínculos editoriales; 1.0 y 1.1 fallan antes de llamar a
Supabase. La versión sustituida de C14 permanece en el archivo 1.0 no
importable.

La implementación pasó pruebas unitarias, TypeScript, lint y build. Las trece
migraciones locales se aplicaron desde cero en PostgreSQL 17.6 y el runner
dinámico comprobó round-trip semántico, 2 evidencias, 118 artefactos, 236
vínculos, estados `draft`/`pending`, rechazo de duplicados sin residuos y RPC
denegadas a `anon` y `authenticated`. La migración todavía no está aplicada en
el proyecto remoto; C01 y C41 no se han importado.

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
- Los contadores usan únicamente la revisión más reciente de cada tarjeta y la
  comprobación más reciente de cada tema; ya no crecen indefinidamente por el
  historial acumulado.
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
en el historial el 20 de agosto de 2026. Los asesores no mostraron errores de
seguridad; el aviso de `exam_answer_keys` sin políticas es el bloqueo
deliberado. Antes de abrir el acceso estudiantil, una persona autorizada debe
ampliar y ejecutar la suite RLS dinámica con temas pendientes y rechazados.

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
1.2 y `npm run test:e2e:local` prepara usuarios y contenido sintéticos, compila,
levanta la app y valida en Chromium el acceso privado, login administrativo,
skip-link, navegación hasta un tema, autosave y persistencia después de
recargar. Ambos runners rechazan URLs no locales y verifican su limpieza final.

Queda pendiente:

- ampliar y ejecutar la suite RLS dinámica contra el proyecto CENEVAL;
- ampliar E2E a examen, tarjetas, progreso, errores y rutas inválidas;
- auditoría final de accesibilidad en navegador y dispositivos reales;
- dejar de degradar silenciosamente ciertos errores de progreso a `null`.

## 5. Contenido terminado y pendiente

El inventario histórico registra contenido preparado para C01–C40: cada clase
tiene transcripción conservada, versión depurada, nueve materiales, mapa,
flashcards, diez reactivos y fuentes. Ese contenido no debe describirse como
publicable hasta migrarlo y aprobarlo con el gate trazable 1.2.

Orden de producción restante:

| Orden | Clase | Fuente principal |
| ---: | --- | --- |
| 1 | C41 Juicio ejecutivo mercantil oral | Audio 54 + primera parte de 55 |
| 2 | C42 Juicio oral mercantil | Segunda parte de 55 |
| 3 | C43 Juicio ordinario mercantil escrito | Primera parte de 56 |
| 4 | C44 Relación individual de trabajo y prestaciones | Audio 58 + primera parte de 59 |
| 5 | C45 Terminación laboral | Primera parte de 59 |
| 6 | C46 Competencia y conciliación prejudicial laboral | Segunda parte de 59 + inicio de 60 |
| 7 | C47 Juicio ordinario laboral | Segunda parte de 60 |
| 8 | C48 Sindicatos, contrato colectivo y huelga | Audio 61 |
| 9 | C49 Jurisdicción voluntaria | Audio 62 |
| 10 | C50 Arrendamiento inmobiliario especial oral | Primera parte de 69 |
| 11 | C51 Regímenes patrimoniales del matrimonio | Segunda parte de 46 |
| 12 | C52 Divorcio voluntario y convenio familiar | Primera parte de 63 |
| 13 | C53 Divorcio sin expresión de causa | Segunda parte de 67 |
| 14 | C54 Medidas familiares provisionales | Audio 68 |
| 15 | C55 Apertura de sucesión | Segunda parte de 63 |
| 16 | C56 Herederos y albacea | Cierre de 63 + inicio de 64 |
| 17 | C57 Inventario, avalúo y oposición | Audio 64 |
| 18 | C58 Administración, partición y adjudicación | Sin fuente suficiente |

Además siguen pendientes tres bancos transversales y 16 exámenes acumulativos.

## 6. Plan vigente

### Prioridad 0 — Proteger y comprobar

1. Crear una segunda copia independiente de las 70 transcripciones y verificarla
   contra el manifiesto privado; la primera copia ya fue comprobada el 21 de
   agosto de 2026 sin diferencias.
2. Seguir `docs/SUPABASE_BACKUP.md`: generar una exportación autorizada,
   verificarla, copiarla fuera del equipo y restaurarla en un proyecto de ensayo.
3. Ampliar y ejecutar `npm run security:rls` en el proyecto CENEVAL y
   registrar el resultado. Esta suite crea y elimina datos remotos; no
   pertenece a CI.
4. Aplicar la persistencia 1.2 ya aprobada localmente en un proyecto de ensayo;
   luego migrar C01 con evidencia real verificable.

### Prioridad 1 — Demostrar el pipeline con C01

1. Incorporar localizadores reales y migrar C01 al contrato 1.2.
2. Verificar por round-trip dinámico que el registro de evidencias persiste sin
   pérdidas.
3. Revisar vigencia jurídica y conteos editoriales.
4. Publicar solo después de la revisión autorizada.
5. Comprobar localmente el recorrido borrador, revisión, aprobación y publicación.

### Prioridad 2 — Migrar C02–C40 y después completar C41–C58

Repetir el pipeline 1.2 con fuentes oficiales, validación, revisión editorial,
publicación, navegación y un commit por unidad de trabajo.

### Prioridad 3 — Calidad de producto

1. Automatizar inicio de sesión, biblioteca, clase, repaso, examen y progreso
   en un navegador real.
2. Probar URLs inválidas, estados vacíos, errores y recuperación.
3. Auditar teclado, lector de pantalla, contraste y uso móvil.
4. Medir la aplicación con 58 clases.

### Prioridad 4 — Despliegue y operación

1. Persistir y verificar las variables de Vercel sin exponer secretos.
2. Configurar las redirecciones de Supabase Auth, ejecutar el bootstrap interno
   de `ADMIN_BOOTSTRAP.md` y probar registro, verificación e inicio de sesión.
3. Probar login y rutas privadas desde teléfono y computadora, y revisar logs.
4. Registrar cada publicación manual y decidir si se habilita integración Git.
5. Añadir monitoreo, manual de operación, respaldo y restauración.
6. Resolver proveedor, planes/precios, prueba, cancelación, reembolsos,
   impuestos y soporte antes de implementar registro o pagos.
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
| 4 | Aplicar la persistencia 1.2 en un proyecto de ensayo | Migración remota de ensayo, round-trip y RLS aprobados antes de producción |
| 5 | Migrar y aprobar C01 | Recorrido local trazable completo sin evidencia inventada |
| 6 | Crear pruebas de navegador | Flujos centrales reproducibles en CI o entorno aislado |
| 7 | Completar y validar el despliegue privado | Variables persistentes, administradora operativa y URL estable aprobada desde teléfono y computadora |

## 8. Decisiones de producto abiertas

1. Definir responsables y periodicidad de la revisión jurídica trazable.
2. Confirmar si el estándar definitivo es de tres o cuatro opciones por reactivo.
3. Decidir el alcance de los 16 exámenes acumulativos.
4. Definir responsables del repositorio, Supabase, respaldo y despliegue.
5. Definir proveedor, planes, precio, reglas de acceso y soporte de la futura
   suscripción, además de prueba, cancelación, reembolsos e impuestos; hasta
   entonces, mantener cerrado el registro.

## 9. Definición de terminado

El proyecto estará terminado cuando existan 58 clases publicadas y navegables,
los bancos y exámenes acumulativos acordados, protección RLS verificada en
remoto, pruebas automáticas de los flujos centrales, experiencia accesible en
teléfono y computadora, despliegue estable, respaldo restaurable y manual de
operación aprobado por Fatima. Para ofrecerla comercialmente, además deberán
estar aprobados e implementados el modelo de suscripción, el control de acceso
correspondiente y sus recorridos de alta, cobro, cancelación y soporte.

## 10. Siguiente acción inmediata

La siguiente acción es cerrar el gate editorial trazable antes de producir más
contenido o escribir en la base remota:

1. crear una segunda copia independiente del archivo editorial y ensayar su restauración;
2. ejecutar y completar el procedimiento de `docs/SUPABASE_BACKUP.md`;
3. aplicar las migraciones en un proyecto de ensayo y repetir el gate dinámico
   antes de promoverlas a CENEVAL;
4. obtener localizadores verificables y migrar C01 antes de C41.

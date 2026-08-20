# Estado actual y siguientes pasos — CENEVAL Study App

Última actualización: 20 de agosto de 2026

Base documental: `origin/main` en `3a1fe92`

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

1. las transcripciones originales dependen del disco `F:`;
2. existe un procedimiento seguro de respaldo, pero todavía no una exportación
   comprobable de la base, una copia externa ni una restauración probada;
3. la migración RLS del 20 de agosto está en Git, pero no hay evidencia de que
   ya se aplicó a Supabase remoto;
4. la aplicación no está desplegada y solo se usa en `localhost`;
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

## 2. Inventario académico conocido

La última lectura documentada de la base remota, realizada el 12 de agosto de
2026, registró:

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

La siguiente clase académica es **C41 — Juicio ejecutivo mercantil oral**,
con Audio 54 y la primera parte del Audio 55. Antes de afirmar que los conteos
siguen iguales, deben verificarse de nuevo en Supabase.

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

Esto resuelve los hallazgos generales de ausencia de estados y numeración. No
equivale todavía a una prueba automática de cada URL inválida o de todos los
recorridos en navegador.

### Importación y orden curricular

El bloqueo por clases nuevas sin código quedó corregido en el código:

- el contrato actual es `packageVersion: "1.1"`;
- el importador exige `curriculum.code`, `curriculum.order` y fuentes de audio;
- escribe `curriculum_code`, `curriculum_order` y `class_audio_sources`;
- detecta colisiones de código u orden antes de crear la clase;
- si falla después de crearla, intenta borrar la clase parcial.

Los 41 paquetes existentes continúan en contrato 1.0 y se conservan como
históricos. El importador los rechaza de forma explícita: cualquier paquete
nuevo, incluida C41, debe prepararse en 1.1. Los paquetes 1.0 deben migrarse si
alguna vez se pretende reimportarlos.

La corrección está probada de forma local a nivel de esquema y código, pero C41
aún no se ha importado para demostrar el recorrido completo en la base remota.

### Controles editoriales concurrentes

La revisión de temas evita solicitudes duplicadas desde la interfaz: desactiva
aprobar y rechazar mientras hay un cambio pendiente, muestra el estado de la
operación y anuncia el resultado o error a tecnologías de asistencia. Las
Server Actions vuelven a validar rol, identificadores y estado, y no devuelven
detalles internos de Supabase.

La migración
`20260820234325_create_topic_with_next_position.sql` reemplaza el cálculo
separado de `count + 1` por una función transaccional. Un bloqueo asesor por
clase serializa únicamente las altas que compiten por la siguiente posición;
la función usa `security invoker` y solo concede ejecución a `service_role`.

**Gate operativo:** la migración está versionada y tiene comprobación estática
local, pero no se aplicó ni se verificó contra Supabase remoto en este trabajo.
Antes de crear temas con este código, una persona autorizada debe revisar y
aplicar la migración, confirmar su historial y ejecutar los asesores de base.
No debe habilitarse la nueva Server Action en un entorno cuya migración siga
pendiente.

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
`20260820225524_restrict_learning_activity_to_published_content.sql` añade la
misma condición a la Data API para `flashcard_reviews`, `study_progress` y
`quick_check_responses`. La migración es transaccional y su estructura se
comprueba localmente en CI.

**Estado de despliegue de esa migración:** no confirmado. El archivo está
integrado en Git, pero no hay evidencia local de que Supabase remoto lo haya
aplicado ni de una ejecución posterior de las 31 comprobaciones actuales. La
última ejecución remota documentada sigue siendo la suite anterior de 20
comprobaciones, aprobada el 29 de julio de 2026.

## 4. Seguridad y calidad: qué está probado

`npm run test:local` reúne pruebas sin Supabase ni disco `F:` para:

- entrega y calificación segura del examen;
- derivación, paginación y enlaces seguros del historial de intentos;
- cálculo de repaso espaciado;
- derivación de progreso por materia y ausencia explícita de desempeño cuando
  no existen intentos válidos;
- esquema del paquete académico;
- redirecciones permitidas en confirmación de autenticación;
- validación y mensajes del inicio de sesión;
- cabeceras de seguridad;
- entrada de acciones de estudio;
- estructura esperada de las políticas RLS nuevas;
- integridad del procedimiento de respaldo con datos sintéticos.

También existen cabeceras de seguridad, redirección de autenticación limitada
a destinos internos y un aviso educativo/de vigencia en la interfaz.

Queda pendiente:

- aplicar y probar la migración RLS contra el proyecto remoto;
- pruebas automatizadas de interfaz y recorridos completos;
- repetir asesores de Supabase después de aplicar migraciones;
- auditoría final de accesibilidad en navegador y dispositivos reales;
- dejar de degradar silenciosamente ciertos errores de progreso a `null`.

## 5. Contenido terminado y pendiente

El último inventario registra C01–C40 publicadas. Cada clase se preparó con
transcripción conservada, versión depurada, nueve materiales, mapa conceptual,
guía, flashcards, diez reactivos y fuentes.

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

1. Copiar las transcripciones fuera del disco `F:` y verificar la copia.
2. Seguir `docs/SUPABASE_BACKUP.md`: generar una exportación autorizada,
   verificarla, copiarla fuera del equipo y restaurarla en un proyecto de ensayo.
3. Confirmar en el historial remoto si la migración RLS del 20 de agosto está
   aplicada; si no, aplicarla en una ventana autorizada.
4. Ejecutar `npm run security:rls` después de la migración y registrar el
   resultado. Esta suite crea y elimina datos remotos; no pertenece a CI.
5. Preparar C41 con contrato 1.1 y ejecutar `content:check`.

### Prioridad 1 — Demostrar el pipeline con C41

1. Importar C41 como borrador.
2. Confirmar código C41, orden 41 y audios de origen en Supabase.
3. Revisar vigencia jurídica y conteos editoriales.
4. Publicar solo después de la revisión autorizada.
5. Comprobar que aparece en `/sesiones` y como siguiente de C40.

### Prioridad 2 — Completar C42–C58

Repetir el pipeline 1.1 con fuentes oficiales, validación, revisión editorial,
publicación, navegación y un commit por unidad de trabajo.

### Prioridad 3 — Calidad de producto

1. Automatizar inicio de sesión, biblioteca, clase, repaso, examen y progreso
   en un navegador real.
2. Probar URLs inválidas, estados vacíos, errores y recuperación.
3. Auditar teclado, lector de pantalla, contraste y uso móvil.
4. Medir la aplicación con 58 clases.

### Prioridad 4 — Despliegue y operación

1. Vincular Vercel y configurar variables sin exponer secretos.
2. Configurar redirecciones de Supabase Auth para producción.
3. Probar una vista previa y promoverla solo tras aprobación.
4. Añadir monitoreo, manual de operación, respaldo y restauración.
5. Resolver proveedor, planes/precios, prueba, cancelación, reembolsos,
   impuestos y soporte antes de implementar registro o pagos.
6. Seguir los gates incrementales de `SUBSCRIPTION_ARCHITECTURE.md`: dominio y
   autorización sin cobro, sandbox cerrado, piloto privado y solo después
   apertura comercial explícita.

## 7. Próximas tareas ejecutables

| # | Tarea | Evidencia para cerrarla |
| ---: | --- | --- |
| 1 | Respaldar las transcripciones | Copia verificada fuera de `F:` |
| 2 | Ejecutar y probar el respaldo documentado | Exportación fechada, copia externa verificada y restauración de ensayo |
| 3 | Aplicar/verificar la migración RLS | Historial remoto y suite de 31 comprobaciones aprobada |
| 4 | Preparar C41 en contrato 1.1 | `content:check` aprobado |
| 5 | Importar y publicar C41 | Visible en `/sesiones` y después de C40 |
| 6 | Crear pruebas de navegador | Flujos centrales reproducibles en CI o entorno aislado |
| 7 | Desplegar en modo privado | URL estable aprobada desde teléfono y computadora |

## 8. Decisiones de producto abiertas

1. Resolver la contradicción sobre aprobación expresa antes de publicar.
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

No hace falta reconstruir CI, estados, numeración, repaso, examen ni el soporte
1.1 del importador: ya están integrados. La siguiente acción es proteger los
datos y cerrar la diferencia entre código y base remota:

1. respaldar `F:`;
2. ejecutar y completar el procedimiento de `docs/SUPABASE_BACKUP.md`;
3. verificar/aplicar la migración RLS y ejecutar la suite remota;
4. preparar e importar C41 con contrato 1.1.

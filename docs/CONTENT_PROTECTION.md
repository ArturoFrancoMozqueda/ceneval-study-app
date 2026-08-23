# Protección de contenido — disuasión, no DRM

**Fecha:** 22 de agosto de 2026
**Referencia:** `docs/PROJECT_STATUS.md` §4 D-2 ("Protección de contenido").
**Decisión aceptada por la titular, ya negociada y explicada:** ninguna medida
de esta página bloquea una captura de pantalla real. Lo que sigue es
disuasión razonable contra el copiado y la redistribución casual, no una
protección garantizada.

## 1. Qué se implementó

### 1.1 Deshabilitar selección y copiado de texto en las vistas de estudio

Componente: `components/protected-text.tsx`, que exporta `ProtectedText`
(y las piezas sueltas `protectedTextClassName` / `blockCopyContextMenu` para
los pocos casos en los que hace falta aplicar la protección directamente
sobre un elemento existente, como un `<summary>`).

`ProtectedText` es un envoltorio mínimo: renderiza el elemento que se le pida
(`div`, `p`, `span`, `h3`, `summary`, …) con `user-select: none` y
`-webkit-touch-callout: none`, y bloquea el menú contextual
(`onContextMenu` → `preventDefault()`) para que la opción "Copiar" no
aparezca sobre ese bloque al hacer clic derecho o mantener presionado en
móvil.

Se aplicó de forma quirúrgica — nunca a la página completa — al **texto de
lectura real**:

- `components/lesson-view.tsx`: el cuerpo de cada `Material` (clase,
  ejemplos, cierre), el texto de apertura del paso "Descubre", la guía de
  preguntas y respuestas del paso "Comprende" (pregunta y respuesta dentro de
  cada `<details>`/`<summary>`), y los párrafos de introducción del paso
  "Aplica".
- `components/topic-detail.tsx`: la descripción del tema en el encabezado.
- `components/concept-map.tsx`: la descripción del mapa y la etiqueta y
  descripción de cada nodo (idea central, rama, hoja).
- `components/flashcards-deck.tsx`: el texto visible de la tarjeta
  (pregunta o respuesta, según el estado).
- `components/exam-player.tsx`: **solo la revisión posterior a la entrega**
  (el enunciado de cada pregunta, la respuesta elegida y las explicaciones).
  El formulario de preguntas mientras se está respondiendo **no se tocó**.

### Por qué el examen se protegió solo a medias

El formulario de un examen en curso (`<fieldset>`, `<legend>`, las opciones
de respuesta con `<input type="radio">` y su `<label>`) es un control
interactivo, no un bloque de lectura pasiva. La instrucción del punto 1 es
explícita: la protección nunca debe tocar inputs, botones ni campos de
formulario. Deshabilitar el menú contextual o la selección ahí no rompería
la funcionalidad (un `<input type="radio">` no depende de selección de texto
para funcionar), pero sí generaría una razón adicional para que alguien
sienta que la interacción normal —tocar una opción, revisar el enunciado
antes de responder— está siendo restringida sin necesidad. Por eso se trazó
la línea así: mientras la estudiante está respondiendo, nada se protege;
en cuanto entrega el examen y pasa a la pantalla de revisión (contenido de
solo lectura, sin controles de formulario), el enunciado y las explicaciones
sí llevan `ProtectedText`.

### Por qué no rompe accesibilidad

`ProtectedText` no cambia el DOM accesible: no agrega ni quita roles, no
cambia nombres accesibles, no intercepta `Tab`, `Enter`, `Espacio` ni ningún
evento de teclado, y no usa `aria-hidden`, `tabindex` ni `pointer-events`.
Lo único que hace es una propiedad CSS (`user-select`) y un `preventDefault`
sobre el evento de clic derecho. Un lector de pantalla no usa "selección de
texto con el mouse" para leer contenido, así que NVDA, TalkBack o VoiceOver
no se ven afectados; la navegación por teclado tampoco, porque
`user-select: none` no quita el foco ni el orden de tabulación. Se verificó
el resultado corriendo `npx tsx --test tests/study-accessibility-contract.test.ts`
(que fija por contrato estático que las tarjetas siguen anunciando su
contenido con `aria-labelledby`, que el examen sigue usando la pregunta como
`<legend>`, y que el enfoque programático tras cada paso sigue intacto) y
`npx tsx --test tests/study-experience-honesty.test.ts`; ambos pasan sin
cambios en sus aserciones. Ver `docs/ACCESSIBILITY_TESTING.md` para el
alcance real de esa evidencia (automatizada local; sigue pendiente una
sesión manual con lector de pantalla, que este cambio no sustituye).

### 1.2 Disuasión de captura/grabación de pantalla

Componente: `components/content-shield.tsx`, que exporta `ContentShield`.
Envuelve el mismo contenido de estudio del punto 1 (los bloques de `Material`
en `lesson-view.tsx`, el mapa conceptual completo, la tarjeta activa del
repaso espaciado, y la revisión posterior del examen) y oscurece ese bloque
con un overlay (`backdrop-blur` + fondo semitransparente, `aria-hidden` y
`pointer-events-none` para no afectar teclado ni lector de pantalla) cuando
detecta una de dos señales:

1. **La pestaña o la ventana pierde el foco** — `visibilitychange` cuando el
   documento deja de estar visible, y `blur`/`focus` de `window` cuando la
   ventana pierde el foco del sistema operativo (por ejemplo, al cambiar de
   aplicación con Alt+Tab). Con un pequeño retraso (120 ms) antes de mostrar
   el overlay, para no parpadear con cambios de foco muy breves.
2. **Heurística de herramientas de desarrollador acopladas**: compara
   `window.outerWidth`/`outerHeight` contra `innerWidth`/`innerHeight`. Un
   panel de DevTools acoplado reduce el viewport interno sin cambiar el
   tamaño externo de la ventana, así que la diferencia crece por encima de
   un umbral (160 px). Se revisa cada 700 ms mientras el componente está
   montado.

El overlay se retira en cuanto la pestaña recupera el foco y la heurística
de DevTools deja de disparar.

**Verificación de que no dispara en falso en uso normal** (razonada, no solo
supuesta):

- *Enlace que abre pestaña nueva*: en los navegadores modernos (Chrome,
  Firefox, Edge), abrir un `<a target="_blank">` desde un gesto del usuario
  no mueve el foco del navegador a la pestaña nueva salvo que el sitio lo
  fuerce explícitamente (por ejemplo, con `window.open` seguido de
  `.focus()`). Esta app no hace eso en ningún lado — los enlaces de
  referencias jurídicas en `lesson-view.tsx` son anclas `<a>` normales con
  `target="_blank"`. Por eso abrir una fuente en pestaña nueva no debería
  disparar el overlay en la pestaña de origen.
- *Overlay de desarrollo de Next.js* (el indicador flotante de `next dev`):
  se renderiza dentro del mismo documento, no en una ventana ni pestaña
  aparte, así que interactuar con él no dispara `visibilitychange` ni
  `window.blur`, y tampoco cambia `outerWidth`/`outerHeight` ni
  `innerWidth`/`innerHeight`, así que tampoco activa la heurística de
  DevTools. No se necesitó ningún caso especial para excluirlo.
- Se corrió `npm run build` y `npm run lint` sobre el árbol con
  `ContentShield` ya integrado en los cinco componentes; ambos terminan sin
  errores relacionados con este cambio.

**Limitación reconocida y aceptada explícitamente por la titular** (ver
`docs/PROJECT_STATUS.md` §4 D-2): esto no bloquea PrtScn, la herramienta
de recorte del sistema operativo, una grabación de pantalla con software
externo, ni una foto tomada con otro dispositivo. El comentario en la
cabecera de `components/content-shield.tsx` repite esta misma limitación
para que quede visible a cualquiera que edite el archivo después.

## 2. Por qué el DRM o el bloqueo real de capturas es imposible en la web

Esto no es una limitación de esfuerzo de implementación: es una limitación
estructural de cómo funciona un navegador y un sistema operativo.

- **El navegador no controla el framebuffer.** Cuando el sistema operativo
  compone la imagen final que se envía a la pantalla (o a un archivo, en el
  caso de una grabación), lee directamente la memoria de video. Una página
  web solo controla lo que dibuja *dentro* de su propia ventana a través del
  DOM y el motor de renderizado; no tiene ninguna API para preguntarle al
  sistema operativo "¿me estás capturando?" ni para impedir que lo haga.
  PrtScn, la herramienta de recorte de Windows, `screencapture` en macOS o
  cualquier grabador de pantalla operan un nivel por debajo del navegador.
- **Un segundo dispositivo derrota cualquier protección de software.** Aunque
  existiera una API para bloquear la captura del sistema operativo (no
  existe, y los navegadores no la exponen a contenido web por razones de
  seguridad y privacidad — sería una superficie de ataque enorme), nada
  impide fotografiar la pantalla con un teléfono. Ninguna aplicación web
  puede hacer nada contra eso.
- **CSS y JavaScript son disuasión, no cifrado.** `user-select: none` es una
  sugerencia de presentación: el texto sigue estando en el HTML que el
  navegador descargó y renderizó. Cualquier persona con conocimientos
  técnicos moderados puede leer el DOM, deshabilitar CSS, usar las
  herramientas de desarrollador para copiar el `outerHTML`, interceptar la
  respuesta de red que trae el contenido, o simplemente transcribir lo que
  ve en pantalla. Ese es un límite conocido y documentado de cualquier
  medida de este tipo, en cualquier producto web, no solo en esta app.
- **Los sistemas de DRM de video (Widevine, FairPlay, PlayReady) no aplican
  aquí.** Están diseñados para flujos de video cifrado con claves efímeras y
  hardware de confianza (Trusted Execution Environment), no para texto e
  imágenes de una página HTML normal. Adaptar esa infraestructura al
  contenido de esta app (texto, mapas conceptuales, tarjetas) no es viable:
  cambiaría por completo la arquitectura del producto, tendría un costo de
  licenciamiento e integración desproporcionado frente al riesgo, y de todos
  modos no impediría fotografiar la pantalla.

La consecuencia honesta: **lo máximo que se puede lograr en la web es subir
el costo y la fricción del copiado casual** (arrastrar el mouse para
seleccionar texto, clic derecho → Copiar, captura sin darse cuenta al
cambiar de ventana), no impedir la redistribución deliberada de alguien
decidido a hacerlo. Por eso el plan también contempla una medida no técnica:
la cláusula explícita en términos de uso que prohíbe la redistribución, con
cancelación sin reembolso como consecuencia (`docs/PROJECT_STATUS.md` §4
D-2, tarea `L-2` del plan de acción). Esa cláusula, no el CSS, es la que
tiene dientes reales frente a alguien que decide redistribuir el contenido.

## 3. Pendientes que requieren una decisión de infraestructura (no implementados aquí)

Las siguientes dos medidas están descritas en `docs/PROJECT_STATUS.md` §4
D-2 como parte de la protección de contenido, pero **no se implementan en
este cambio** porque requieren elegir un proveedor/arquitectura de
infraestructura que la titular todavía no ha decidido, y porque el alcance
de esta tarea las excluye explícitamente. Se documentan aquí para que la
decisión se pueda tomar rápido cuando corresponda.

### 3.1 Límite de tasa (rate limiting) en las rutas de lectura

Objetivo: dificultar el scraping automatizado del catálogo (por ejemplo,
un script que recorre `/temas/[topicId]` en secuencia para descargar las 57
clases completas en minutos).

**Opción A — Almacén externo tipo Vercel KV / Upstash Redis.**
- *Cómo funcionaría:* cada petición a una ruta de lectura de estudio
  incrementa un contador con expiración (`INCR` + `EXPIRE`) en Redis, con la
  identidad de la sesión o el usuario como llave. Si el contador supera el
  umbral en la ventana de tiempo, la ruta responde con un error de límite
  excedido antes de tocar Supabase.
- *Pros:* latencia baja (Redis está pensado para esto), no compite con las
  conexiones de Postgres de Supabase, patrón bien documentado y usado en
  producción por muchos proyectos Next.js/Vercel, fácil de aplicar también a
  Server Actions y no solo a rutas HTTP.
- *Contras:* añade un proveedor y un costo recurrente nuevo (aunque Upstash
  tiene una capa gratuita razonable para el volumen esperado); otra pieza de
  infraestructura que mantener, monitorear y respaldar en el inventario de
  titularidad (`docs/PROJECT_STATUS.md` §4 D-8); requiere una variable de
  entorno y credenciales nuevas.

**Opción B — Contador en Postgres/Supabase.**
- *Cómo funcionaría:* una tabla (`read_rate_limits` o similar) con
  `user_id`, una ventana de tiempo truncada y un contador, actualizada con
  un `UPSERT ... ON CONFLICT DO UPDATE SET count = count + 1` desde la
  Server Action o el handler de la ruta, protegida con RLS igual que el
  resto del esquema.
- *Pros:* no agrega un proveedor nuevo — reutiliza la base de datos que ya
  existe, el mismo respaldo (`docs/SUPABASE_BACKUP.md`) la cubre sin trabajo
  adicional, y el equipo ya conoce las políticas RLS de este proyecto.
- *Contras:* cada lectura de estudio ahora implica una escritura adicional en
  Postgres (más carga de conexión, más contención si dos pestañas de la
  misma cuenta leen en paralelo), y Postgres no está optimizado para
  contadores de muy alta frecuencia con expiración automática como sí lo
  está Redis — habría que limpiar filas viejas con un cronjob o una consulta
  programada.

Ninguna opción se implementa en este cambio; la ruta de lectura no tiene
ningún límite de tasa nuevo hoy.

### 3.2 Límite de sesiones concurrentes por cuenta

Objetivo: dificultar que una sola suscripción se comparta activamente entre
varias personas al mismo tiempo.

**Opción A — Invalidar tokens antiguos en Supabase Auth.**
- *Cómo funcionaría:* al iniciar una sesión nueva, revocar las sesiones
  anteriores de esa cuenta usando la API de administración de Supabase Auth
  (`supabase.auth.admin.signOut` sobre el usuario, o gestionando
  `refresh_token` con `admin.deleteUser`/`admin.updateUserById` según la
  versión de la API), de modo que solo la sesión más reciente siga siendo
  válida.
- *Pros:* usa la infraestructura de autenticación que ya existe, sin tablas
  ni lógica propia de sesiones; el modelo es simple de explicar
  ("la sesión más nueva gana").
- *Contras:* es una política agresiva de "una sesión a la vez" — cierra la
  sesión de un dispositivo legítimo (por ejemplo, la estudiante cambia del
  teléfono a la laptop) sin aviso previo, lo cual puede sentirse como un
  error del producto si no se comunica bien en la interfaz; la API de
  administración de Supabase Auth para este caso específico ha cambiado
  entre versiones y conviene revisar la documentación vigente antes de
  comprometerse con una llamada concreta.

**Opción B — Tabla propia de sesiones activas.**
- *Cómo funcionaría:* una tabla (`active_sessions`) que registra
  `user_id`, un identificador de sesión y la última actividad; cada petición
  autenticada actualiza esa fila, y una Server Action o middleware rechaza
  una sesión nueva si ya existen N sesiones activas recientes para esa
  cuenta (con un umbral configurable, por ejemplo 2, para tolerar teléfono +
  laptop sin ser tan estricto como la Opción A).
- *Pros:* control fino sobre el umbral y el mensaje que ve la usuaria
  ("ya tienes 2 sesiones activas, cierra una para continuar" en vez de un
  cierre silencioso); permite reglas más suaves y una futura pantalla de
  "administrar mis sesiones".
- *Contras:* es lógica y una tabla más para diseñar, proteger con RLS y
  mantener; hay que decidir con cuidado qué cuenta como "actividad" para no
  expulsar a alguien que solo tiene una pestaña en segundo plano.

Ninguna opción se implementa en este cambio; hoy no hay ningún límite de
sesiones concurrentes por cuenta.

## 4. Alcance de este cambio

Se tocaron únicamente componentes de la vista de estudio:
`components/lesson-view.tsx`, `components/topic-detail.tsx`,
`components/concept-map.tsx`, `components/flashcards-deck.tsx` y
`components/exam-player.tsx` (esta última solo en la pantalla de revisión
posterior a la entrega), más los dos componentes nuevos
`components/protected-text.tsx` y `components/content-shield.tsx`. No se
tocó `proxy.ts`, `app/page.tsx`, `app/registro/`, `app/actions/auth.ts` ni
`supabase/migrations/`. No se implementó rate limiting ni límite de
sesiones concurrentes — solo se documentan las opciones arriba para que la
decisión de infraestructura se tome cuando corresponda.

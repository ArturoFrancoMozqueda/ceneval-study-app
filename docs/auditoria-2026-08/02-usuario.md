# Evaluación de experiencia de usuario y accesibilidad
## CENEVAL Study App — perfiles Estudiante y Administradora

Fecha: 2026-08-19
Método: lectura completa del código de interfaz (`app/`, `components/`, `lib/`), comparación contra `docs/04-navigation-and-screens.md` y `docs/08-visual-design.md`, y cálculo de ratios de contraste sobre las variables de `app/globals.css`.
No se modificó ningún archivo ni se ejecutó el servidor.

Convención: **VERIFICADO** = leído directamente en el código con archivo:línea. **SUPUESTO** = inferencia razonada que no se pudo confirmar sin ejecutar la app o consultar la base de datos.

---

## 0. Resumen ejecutivo

La aplicación está mucho mejor construida de lo que sugiere el enunciado del problema conocido. **El problema de "no existe pantalla con las 58 clases en orden" ya está resuelto**: `app/sesiones/page.tsx` lista todas las clases publicadas ordenadas por `curriculum_order` (C01→C40), con código de currículo, materia, audios de origen y barra de progreso por clase; y `components/class-detail.tsx:81-92` sí tiene botones "← Anterior · Cxx" y "Cxx · Siguiente →". Ese hallazgo debe corregirse en la documentación del proyecto.

Lo que sí está roto es otra cosa, y es más grave:

1. **No existe ningún límite de error ni de carga en toda la app.** Cero `error.tsx`, cero `loading.tsx`, cero `not-found.tsx`, cero `<Suspense>`. Cualquier fallo de Supabase o cualquier URL con id no numérico produce la pantalla de error genérica de Next en inglés, sin salida.
2. **El examen no enseña.** La retroalimentación por opción se calcula, se envía al cliente y nunca se pinta.
3. **La repetición espaciada de flashcards es decorativa.** `next_review_at` se escribe y jamás se lee.
4. **La ruta `/estudiar` es inalcanzable** una vez que la estudiante tiene cualquier avance guardado.
5. **En el teléfono no hay forma de cerrar sesión.**

Conteo de hallazgos: **9 P0**, **17 P1**, **19 P2**.

---

## 1. Recorridos reales, paso a paso

### (a) Iniciar sesión → llegar a la primera clase que debo estudiar

**Ruta A — la que la app propone (3 toques, pero llega al lugar equivocado)**

| # | Acción | Archivo que lo produce |
|---|---|---|
| 0 | Abre `/` → `HomeDashboard` llama `requireUser()` → redirige a `/iniciar-sesion` | `components/home-dashboard.tsx:8`, `lib/auth.ts:56-60` |
| 1 | Escribe correo + contraseña, toca **Iniciar sesión** → `/` | `app/iniciar-sesion/page.tsx:17-60`, `app/actions/auth.ts:54` |
| 2 | Sin avance previo, el bloque "Siguiente paso" dice *"Comienza una sesión breve de estudio"* y el botón dice **Elegir un tema** → `/estudiar` | `components/home-dashboard.tsx:72-86` |
| 3 | `/estudiar` muestra "Temas disponibles": **todos** los temas aprobados de clases publicadas, ordenados por `created_at` descendente, sin materia, sin clase, sin código C. Toca uno. | `app/estudiar/page.tsx:17-22`, `:72-96` |

**VERIFICADO.** La consulta de `/estudiar` (línea 22) ordena por fecha de creación descendente y **no tiene `.limit()`**: muestra la lista completa sin paginar. Con 40 clases publicadas y varios temas por clase, la estudiante recibe un muro de decenas de tarjetas sin ninguna referencia a qué clase pertenecen. Ordenadas por fecha de creación, el "primero" es el **último tema cargado**, es decir, muy probablemente C40, no C01.

**Fricción concreta:** la única ruta que la pantalla de Inicio le ofrece a una estudiante nueva la deposita en el tema más recientemente capturado, sin contexto de materia ni de clase, y sin decirle que existe un orden. Ella no tiene forma de saber que debía empezar por C01.

**Ruta B — la correcta (4 toques + búsqueda visual)**

| # | Acción |
|---|---|
| 1 | Iniciar sesión |
| 2 | Barra inferior → **Sesiones** (`app-shell.tsx:17`) |
| 3 | Desplazarse hasta la tarjeta C01 entre 40 tarjetas sin paginación ni filtro (`app/sesiones/page.tsx:58-83`) |
| 4 | Tocar la tarjeta → `/clases/[id]` → tocar el tema 01 (`components/class-detail.tsx:103-122`) |

**Callejón:** *nada en la pantalla de Inicio enlaza a `/sesiones`.* **VERIFICADO** con `grep`: las únicas referencias a `/sesiones` en todo el código son la propia página y la entrada del menú (`components/app-shell.tsx:17`). El "Ver todo" del Inicio (`home-dashboard.tsx:119`) apunta a `/materias`, que es la jerarquía competidora. La estudiante tiene que descubrir "Sesiones" por su cuenta en la barra inferior, y la palabra "Sesiones" no significa nada evidente para ella (ver §4).

### (b) Terminar una clase → pasar a la siguiente

| # | Acción |
|---|---|
| 0 | Está en `/temas/[topicId]`, paso "Comprueba", acaba de entregar el examen. La pantalla de resultado **no tiene ningún botón ni enlace** (`components/exam-player.tsx:40-79`). |
| 1 | Debe desplazarse hasta arriba de una página larga y tocar el título de la clase en las migas (`components/topic-detail.tsx:36-42`). |
| 2 | En `/clases/[id]`, desplazarse hasta la fila de navegación y tocar **Cxx · Siguiente →** (`components/class-detail.tsx:87-91`). |
| 3 | En la clase siguiente, tocar el tema 01 (`class-detail.tsx:103-122`). |

**3 toques más un desplazamiento largo hacia arriba.** El enlace "Siguiente" existe (bien), pero está en la clase, no en el tema, y el tema es donde ella realmente termina. **VERIFICADO:** no hay ningún enlace "siguiente tema" ni "siguiente clase" dentro de `topic-detail.tsx` ni de `lesson-view.tsx`; lo último de la página es el botón de texto "Consultar transcripción y fuentes jurídicas" (`lesson-view.tsx:505-511`).

**Además:** si una clase publicada tiene `curriculum_order` nulo, `getPublishedSessionNeighbors` devuelve `{previous:null, next:null}` (`lib/data/academic.ts:386-395`) y la fila de navegación queda **completamente vacía sin explicar por qué**. La misma clase tampoco aparece en `/sesiones` (`lib/data/academic.ts:339`). **VERIFICADO** en código; **SUPUESTO** que hoy no ocurre, porque la migración `supabase/migrations/20260821021153_add_curriculum_session_metadata.sql:45-48` asigna orden 1..40 a los ids 10..49. Cualquier clase nueva que Fatima cree con "Nueva clase" **no recibe `curriculum_code` ni `curriculum_order`** (`app/actions/academic.ts:85-96` no los inserta y no hay campo en `components/class-form.tsx`): quedará invisible en `/sesiones` y romperá la cadena anterior/siguiente para siempre.

### (c) Resolver un examen y ver el resultado

| # | Acción |
|---|---|
| 1 | Tocar el paso **Comprueba** en el recorrido de 5 pasos (`lesson-view.tsx:251-272`) |
| 2-11 | Seleccionar una opción por pregunta (10 toques) |
| 12-20 | **Siguiente pregunta** ×9 (`exam-player.tsx:152-160`) |
| 21 | **Entregar examen** (`exam-player.tsx:162-172`) — **sin confirmación previa** |

≈ **21 toques mínimo**, más los toques de "Anterior" si quiere revisar.

Problemas concretos:

- **No hay confirmación antes de entregar.** `docs/04-navigation-and-screens.md:227` la exige explícitamente ("confirmación antes de entregar"). Un toque accidental cierra un intento de 10 reactivos y lo guarda en `exam_attempts` (`app/actions/academic.ts:424-435`), contaminando el porcentaje de "Comprensión en exámenes" del Inicio.
- **El resultado no dice qué contestó ni cuál era la correcta.** `submitExamAction` devuelve `optionExplanations` (`app/actions/academic.ts:464`) y `exam-player.tsx` **nunca lo usa** — VERIFICADO con `grep`: cero ocurrencias de `optionExplanations` en `components/`. Lo que ella ve por pregunta es: la etiqueta "Necesita repaso" y un párrafo de explicación general (`exam-player.tsx:62-72`). No aparece marcada su opción, ni la opción correcta, ni el texto de las opciones. Falló, y no sabe por qué.
- `docs/04-navigation-and-screens.md:229` exige "porcentaje, aciertos, errores y explicación de cada opción". Se muestra `7/10` (`exam-player.tsx:46-48`); no hay porcentaje, no hay conteo de errores, no hay explicación por opción.
- **Callejón sin salida total:** la pantalla de resultado no tiene "Repetir examen", ni "Volver al tema", ni "Siguiente clase", ni siquiera un enlace de regreso. Solo la barra inferior de navegación.
- El resultado sustituye al formulario sin `aria-live` ni movimiento de foco (`exam-player.tsx:40-79`). Con lector de pantalla, entregar el examen no anuncia nada.

### (d) Usar flashcards y volver luego

| # | Acción |
|---|---|
| 1 | Paso **Recuerda** (`lesson-view.tsx:473-478`) |
| 2 | Tocar la tarjeta para revelar (`flashcards-deck.tsx:104-119`) |
| 3 | Calificar: Repetir / Difícil / Bien / Fácil (`flashcards-deck.tsx:120-133`) |
| … | Repetir 2-3 por cada tarjeta (≥10 tarjetas por tema → ≥20 toques) |
| n | Pantalla "Repaso completado" con **Repasar otra vez** y **Comprobar lo aprendido** |

Al volver después: `LessonView` sí restaura el paso guardado (`lesson-view.tsx:53-55`, `lib/data/academic.ts:461-488`) — **esto funciona bien**. Pero `FlashcardsDeck` siempre arranca en `index = 0` (`flashcards-deck.tsx:21`) sin memoria de qué tarjetas ya dominó. Vuelve a pasar por las 10 completas, incluidas las que marcó "Fácil".

**El fallo mayor:** la repetición espaciada no existe. `reviewFlashcardAction` calcula e inserta `next_review_at` con intervalos de 10 min / 1 día / 3 días / 7 días (`app/actions/academic.ts:303-313`), y **ninguna consulta en toda la app lee `next_review_at`** — VERIFICADO con `grep -rn "next_review_at"`: solo aparece en la escritura. No hay ninguna pantalla que reúna "las tarjetas que toca repasar hoy". Marcar "Difícil" no produce ninguna consecuencia visible.

Peor: `/estudiar` cuenta *filas históricas* de `flashcard_reviews` con `rating in ('again','hard')` (`app/estudiar/page.tsx:27-31`). Como cada calificación **inserta** una fila nueva, ese número **solo puede crecer**. Si ella marca una tarjeta "Difícil" hoy y "Fácil" mañana, la fila "difícil" sigue contada para siempre. El contador "Repaso recomendado: 47 respuestas difíciles para volver a practicar" (`app/estudiar/page.tsx:55-61`) es un reproche permanente que nunca baja y que además no enlaza a ningún lado.

Idéntico problema con "Conceptos para repasar" del Inicio (`components/home-dashboard.tsx:22-26, 92-95`): cuenta filas de `quick_check_responses` con `needs_review = true`, que se insertan y nunca se actualizan (`app/actions/academic.ts:372-378`). Número monótonamente creciente, sin enlace, sin pantalla que lo resuelva.

### (e) Buscar un tema concreto

| # | Acción |
|---|---|
| 1 | Barra inferior → **Buscar** |
| 2 | Escribir y tocar **Buscar** (`app/buscar/page.tsx:32-50`) |
| 3 | Tocar un resultado |

3 toques. Pero:

- **Solo busca en `topics.title`** con `ilike '%q%'` (`app/buscar/page.tsx:21`). No busca en descripción, ni en materiales, ni en transcripciones, ni en títulos de clase o materia. Si el tema se llama "Juicio de garantías" y ella escribe "amparo": cero resultados.
- **Los resultados no dicen a qué materia ni a qué clase pertenecen** (`app/buscar/page.tsx:57-68`: solo título + descripción). `docs/04-navigation-and-screens.md:236-238` exige "resultados agrupados por materia, clase, tema o contenido" y "fragmento que explique por qué coincide". No implementado.
- Los caracteres `%` y `_` que ella escriba se convierten en comodines del patrón `ilike` (`app/buscar/page.tsx:21`). Comportamiento inesperado, no peligroso.
- Sin resultados, el mensaje es correcto y en español ("No encontramos temas publicados para 'x'", línea 52-56) pero **no ofrece ninguna salida** — ni "ver todas las clases", ni sugerencias, ni "buscar en transcripciones".

### (f) Administradora: publicar / retirar una clase

**Desde el teléfono:**

| # | Acción |
|---|---|
| 1 | Cabecera móvil → **Administrar** (`app-shell.tsx:127-131`) |
| 2 | Desplazarse por **todas** las clases de **todas** las materias, sin filtro, sin buscador, sin código C, sin agrupación (`app/administrar/page.tsx:58-76`) |
| 3 | Tocar la clase |
| 4 | Desplazarse hasta "Publicación" y tocar **Publicar clase** (`components/publication-controls.tsx:52-68`) |
| 5 | Confirmar en el diálogo (`publication-controls.tsx:70-120`) |

**5 toques + un desplazamiento muy largo.** Lo bueno: **la confirmación destructiva sí existe** para publicar y retirar, con texto claro y en español, y el botón dice "Sí, retirar clase", no "Aceptar" (`publication-controls.tsx:109-116`). Eso cumple `docs/08-visual-design.md:131`.

Lo malo:

- **"Volver a borrador" no pide confirmación y también despublica.** `requestStatusChange` solo intercepta `published` y `withdrawn` (`publication-controls.tsx:41-47`); `draft` y `review` se ejecutan de inmediato. Y `updatePublicationStatusAction` pone `published_at = null` para cualquier estado distinto de `published` y `withdrawn` (`app/actions/academic.ts:280-284`). Fatima puede, con **un solo toque sin aviso**, retirar de la biblioteca una clase publicada y borrar su fecha de publicación. Los cuatro botones están juntos, en fila, del mismo tamaño (`publication-controls.tsx:51-69`).
- **Los estados se muestran en inglés crudo.** `{studyClass.publicationStatus}` se pinta tal cual en `app/administrar/page.tsx:72`, `app/administrar/clases/[classId]/page.tsx:39`, `components/subject-detail.tsx:67` y `components/class-detail.tsx:62`: Fatima lee `draft`, `review`, `published`, `withdrawn`. En la misma página, los contadores de arriba **sí** están traducidos (`app/administrar/page.tsx:41-46`: "Borradores", "En revisión", "Publicadas", "Retiradas"). Inconsistencia dentro de una sola pantalla.
- Lo mismo con los temas: `app/administrar/clases/[classId]/page.tsx:78` pinta `{topic.approvalStatus}` → `approved` / `pending` / `rejected`, mientras `components/topics-review.tsx:23-27` sí los traduce.
- **El error de validación al publicar no dice qué falta:** *"La clase aún no tiene un paquete completo por cada tema aprobado."* (`app/actions/academic.ts:268-273`). La regla real es: 9 tipos de material + mapa conceptual + ≥10 flashcards + 1 examen, **por cada tema aprobado** (`app/actions/academic.ts:254-267`). El mensaje no nombra el tema incompleto ni el requisito que falta. Fatima no tiene forma de averiguarlo desde la interfaz. El texto de ayuda de la sección (`app/administrar/clases/[classId]/page.tsx:55-58`) enuncia la regla pero no el diagnóstico.
- El panel se llama **"Panel editorial"** en la barra lateral (`app-shell.tsx:104`) y **"Administrar"** en la cabecera móvil (`app-shell.tsx:129`). Dos nombres para el mismo destino.

---

## 2. Navegación y orientación

### Lo que funciona (VERIFICADO)

- Migas de navegación correctas y navegables en `class-detail.tsx:35-54`, `topic-detail.tsx:27-46`, `transcript-workspace.tsx:60-88`, `topics-review.tsx:97-125`, y en las páginas "nueva materia" / "nueva clase". Usan `<nav aria-label>` + `<ol>` + `aria-current="page"`. Cumplen `docs/08-visual-design.md:162-170`.
- `aria-current="page"` en la navegación principal, escritorio y móvil (`app-shell.tsx:84, 146`).
- Barra inferior fija con icono **y** etiqueta, con `env(safe-area-inset-bottom)` (`app-shell.tsx:138-158`) y `pb-28` en el `<main>` para que el contenido no quede tapado (`app-shell.tsx:133`). Bien resuelto.
- Progreso por clase visible en `/sesiones` (`app/sesiones/page.tsx:76-79`) y progreso por bloque/tarjeta/pregunta dentro de la lección.
- El paso de estudio se guarda y se restaura (`lesson-view.tsx:53-64`, `lib/data/academic.ts:461-488`), con aviso "Avance guardado automáticamente" en `aria-live="polite"` (`lesson-view.tsx:273-275`).

### Lo que falla

**P0 — `/estudiar` es inalcanzable.** El único enlace en todo el código es el botón condicional del Inicio, y solo se muestra **cuando `nextTopic` es nulo** (`home-dashboard.tsx:81-86`). En cuanto la estudiante guarda cualquier avance, `nextTopic` deja de ser nulo, el botón pasa a decir "Continuar sesión" apuntando a `/temas/[id]`, y `/estudiar` queda huérfana para siempre. `docs/04-navigation-and-screens.md:56` y `docs/08-visual-design.md:99` establecen **"Estudiar"** como uno de los cuatro destinos principales de la barra; en el código el tercer destino es **"Sesiones"** (`app-shell.tsx:17`) y el segundo es **"Biblioteca"** (`app-shell.tsx:18`), no "Materias". La barra construida no es la barra aprobada.

**P0 — Dos jerarquías paralelas y contradictorias.** "Biblioteca" (`/materias` → materia → clase) y "Sesiones" (`/sesiones` → clase) llevan a las mismas clases por caminos distintos y con **numeraciones distintas**:
- `/sesiones` muestra el código real: `C01`, `C17` (`app/sesiones/page.tsx:66`).
- El detalle de materia muestra un número inventado `String(index + 1).padStart(2,"0")` → `01`, `02` (`components/subject-detail.tsx:59-61`), sobre una lista ordenada por `published_at` **descendente** (`lib/data/academic.ts:267-268`).

Consecuencia concreta: la clase **C17** aparece dentro de su materia etiquetada como **"03"**, y la clase C40 aparece como "01" porque es la más reciente. La estudiante ve dos números distintos para la misma clase y ninguno le dice dónde va en el plan de 58. Idéntico problema en `class-detail.tsx:109-111` para los temas.

**P1 — No hay progreso global.** No existe en ninguna pantalla el dato "llevas 12 de 40 clases" ni "40 de 58 publicadas". Lo más cercano es *"40 clases publicadas"* junto a *"Meta: 58"* en `app/sesiones/page.tsx:55-56`, que es una métrica de producción editorial, no de avance de estudio, y que a la estudiante le dice literalmente "faltan 18 que no existen".

**P1 — El Inicio se contradice.** Con `completed_steps.length >= 5`, `mastery` vale "Dominado" (`home-dashboard.tsx:47-52`) y el bloque principal muestra: *"Continúa: Amparo indirecto"* / *"Dominado: retoma exactamente donde pausaste."* (`home-dashboard.tsx:72-80`). Le dice que lo domina y a la vez que lo continúe. Si ya terminó ese tema, la app no le propone el siguiente: la mantiene apuntando al mismo.

**P1 — No hay cabecera móvil útil.** `docs/08-visual-design.md:109-120` especifica en móvil "Título | Acción" y `docs/04-navigation-and-screens.md:278` "Encabezado compacto con botón para volver". Lo construido (`app-shell.tsx:125-132`) es una barra fija de 64 px que contiene **solo el logotipo** y, para Fatima, un enlace "Administrar". Ni título de página, ni acción principal, ni botón de retroceso. Sumada a la barra inferior, ~128 px de la pantalla del teléfono están ocupados por cromo que no informa nada.

**P1 — En el teléfono no se puede cerrar sesión.** El formulario de `signOutAction` vive únicamente dentro del `<aside>` que es `hidden … lg:flex` (`app-shell.tsx:75, 114-120`). En la barra inferior hay 4 destinos y ninguno es perfil/cuenta. La cabecera móvil no lo incluye. **Fatima, que estudia y administra desde el teléfono, no tiene manera de salir de su cuenta.** Tampoco hay acceso a `/actualizar-contrasena` desde ninguna pantalla (`grep`: cero enlaces a esa ruta).

**P1 — El nombre de usuaria no se ve en móvil.** El bloque "Tu espacio de estudio" con `user.fullName` está en el mismo `<aside>` oculto (`app-shell.tsx:107-121`).

**P2 — Títulos de pestaña genéricos.** `/clases/[classId]` → "Detalle de clase" (`app/clases/[classId]/page.tsx:4-6`), `/temas/[topicId]` → "Detalle de tema", `/materias/[subjectId]` → "Detalle de materia". Son `metadata` estáticos; no usan `generateMetadata`. Con varias pestañas abiertas o en el historial, todas se llaman igual. Las cuatro páginas de autenticación y `/administrar/clases/[classId]` no declaran `metadata` en absoluto: caen al título por defecto.

**P2 — `components/placeholder-page.tsx` es código muerto** (`grep`: cero importaciones).

---

## 3. Estados: vacío, cargando, error, sin resultados, sin permiso, formulario inválido

`docs/04-navigation-and-screens.md:47` ("Incluir estados vacíos, de carga y error desde la primera entrega") y `docs/08-visual-design.md:242-262` son explícitos. Resultado de la auditoría:

### Carga — **AUSENTE POR COMPLETO (P0)**

**VERIFICADO:** `find app -name "loading.tsx"` → **cero resultados**. `grep -rn "Suspense\|Skeleton"` en `app/` y `components/` → **cero resultados**.

Todas las páginas son componentes de servidor asíncronos que además llaman `await connection()` (`lib/data/academic.ts:214, 258, 298, 331, 380, …`), lo que fuerza renderizado dinámico en cada visita. Sin `loading.tsx`, la navegación en el App Router **bloquea**: la estudiante toca la tarjeta C17 y durante toda la latencia (Supabase + varias consultas encadenadas) **la pantalla anterior sigue ahí, sin spinner, sin skeleton, sin nada**. En un teléfono con red lenta parece que la app se congeló, y el patrón humano es volver a tocar.

Peor en `/temas/[topicId]`: `getLessonBundle` encadena hasta **once** consultas, varias en serie (`lib/data/academic.ts:490-577`: `getTopic` → `getClass` → 5 consultas en paralelo → `getSubject` → `getTranscript` → `exam_questions` → `exam_options`). Es la pantalla más usada de la app y la que más tarda, sin ningún indicador.

Archivos a crear: `app/loading.tsx`, `app/temas/[topicId]/loading.tsx`, `app/clases/[classId]/loading.tsx`, `app/sesiones/loading.tsx`.

### Error — **AUSENTE POR COMPLETO (P0)**

**VERIFICADO:** cero `error.tsx`, cero `global-error.tsx`, cero `not-found.tsx` en todo `app/`.

`lib/data/academic.ts:179-182` **lanza** en cada fallo de consulta:

```ts
function fail(operation: string, message: string): never {
  console.error(`[Supabase] ${operation}: ${message}`);
  throw new Error("No pudimos consultar los datos. Intenta nuevamente.");
}
```

Se invoca en 20+ puntos. Como no hay ningún límite de error, en producción Next muestra su pantalla por defecto — texto en inglés del tipo *"Application error: a server-side exception has occurred"* más un digest hexadecimal — sin barra de navegación, sin botón de reintentar y sin una sola palabra en español. Ese mensaje en español tan cuidado nunca llega a verse.

Rutas de disparo concretas y fáciles de provocar:
- `/temas/abc` → `Number("abc")` = `NaN` (`app/temas/[topicId]/page.tsx:17`) → `getTopic(NaN)` → `.eq("id", NaN)` → PostgREST 400 → `fail("getTopic", …)` → pantalla de error en inglés. Igual en `/clases/abc` (`app/clases/[classId]/page.tsx:15`) y `/materias/abc` (`app/materias/[subjectId]/page.tsx:14`).
- Cualquier corte de red o caída de Supabase durante una sesión de estudio.

`docs/08-visual-design.md:258` exige "panel con título, explicación sencilla y **Intentar nuevamente**. No mostrará trazas técnicas." Lo construido hace exactamente lo contrario.

### Vacío — parcial (P1)

| Pantalla | Estado vacío | Archivo |
|---|---|---|
| `/materias` | ✅ Completo: icono, título, explicación | `components/subjects-list.tsx:64-75` |
| Revisión de temas | ✅ Completo con acción | `components/topics-review.tsx:278-294` |
| Inicio (sin materias) | ⚠️ Solo una línea: "Aún no hay clases publicadas." Sin acción. | `components/home-dashboard.tsx:145-149` |
| `/materias/[id]` sin clases | ❌ **Ninguno.** `<section>` vacía. | `components/subject-detail.tsx:52-74` |
| `/clases/[id]` sin temas | ❌ **Ninguno.** El encabezado dice "0 temas" y debajo, nada. | `components/class-detail.tsx:102-123` |
| `/sesiones` sin clases | ❌ **Ninguno.** Muestra "0 clases publicadas" y una rejilla vacía. | `app/sesiones/page.tsx:53-84` |
| `/estudiar` sin temas | ❌ **Ninguno.** "Temas disponibles" seguido de vacío. | `app/estudiar/page.tsx:70-97` |
| `/administrar` sin clases | ❌ **Ninguno.** | `app/administrar/page.tsx:58-76` |
| Materiales conceptuales vacíos | ⚠️ "La explicación está pendiente." — sin salida | `components/lesson-view.tsx:362` |
| Examen ausente | ⚠️ "El examen está pendiente." — sin salida | `components/lesson-view.tsx:499` |
| Flashcards ausentes | ⚠️ "Esta lección aún no tiene tarjetas." — sin salida | `components/flashcards-deck.tsx:31` |
| Referencias jurídicas vacías | ❌ Encabezado "Referencias jurídicas" sobre lista vacía | `components/lesson-view.tsx:163-184` |

`docs/08-visual-design.md:248-254` exige que todo vacío diga "qué falta, para qué sirve crearlo, y una acción concreta".

### Sin resultados — ✅ correcto

`app/buscar/page.tsx:52-56`. Buen mensaje, en español, con el término entrecomillado. Le falta ofrecer una salida (P2).

### Sin permiso — silencioso (P1)

`requireAdmin` hace `redirect("/")` sin explicación (`lib/auth.ts:62-65`). `requireUser` hace `redirect("/iniciar-sesion")` sin `?message=` (`lib/auth.ts:56-60`). Una estudiante autenticada pero no administradora (posible: `getCurrentUser` devuelve `null` si `PRIVATE_ACCESS_ONLY` y el rol no es admin, `lib/auth.ts:44-46`) es expulsada al formulario de acceso **sin que se le diga por qué**; solo al reintentar el envío recibe la explicación (`app/actions/auth.ts:47-50`). Además la sesión expirada durante el estudio la devuelve al formulario perdiendo el contexto, sin `?next=` para volver donde estaba.

### Formulario inválido — desigual

**Bien:** `components/subject-form.tsx` es ejemplar (`aria-describedby`, `aria-invalid`, `role="alert"`, contador de caracteres, borde de error, error debajo del campo, se limpia al teclear, conserva el texto). `transcript-workspace.tsx:193-232` igual de bueno.

**Mal:**
- `components/class-form.tsx:70-78`: **todos** los errores del servidor se pintan bajo el campo *Título*, aunque el problema sea la descripción o el profesor. El mensaje del servidor para eso es *"Revisa la longitud de los campos."* (`app/actions/academic.ts:81-83`) — no dice cuál campo ni cuál límite. Además `class-form.tsx:83-93` no pone `maxLength` ni contador a la fecha ni al profesor.
- `components/auth-card.tsx:80-87`: los campos no tienen `aria-describedby`, ni `aria-invalid`, ni error por campo. El único error es un panel general arriba del formulario. Al fallar, **el correo escrito se pierde**: el error viaja por `redirect(?error=…)` (`app/actions/auth.ts:13-15`) y la página se vuelve a renderizar con los `<input>` vacíos. `docs/08-visual-design.md:141` exige "texto escrito preservado después de errores recuperables".
- `components/topics-review.tsx:174-178`: el error del servidor (que puede venir de *aprobar* o *rechazar* un tema, líneas 83-85) se pinta bajo el campo **Nombre** del formulario de alta, que además solo es visible si `showForm` está activo. **Si Fatima toca "Aprobar" y falla, el mensaje de error es invisible.**
- `components/class-details-form.tsx:59`: `aria-invalid={Boolean(error && !title.trim())}` — el atributo no se activa para errores del servidor que sí existen.

---

## 4. Claridad del lenguaje

La usuaria no es técnica. Hallazgos concretos:

### Inglés visible en la interfaz (P1)

| Texto | Archivo:línea | Quién lo ve |
|---|---|---|
| `draft` / `review` / `published` / `withdrawn` | `app/administrar/page.tsx:72`; `app/administrar/clases/[classId]/page.tsx:39`; `components/subject-detail.tsx:67`; `components/class-detail.tsx:62` | Fatima, en cada revisión |
| `approved` / `pending` / `rejected` | `app/administrar/clases/[classId]/page.tsx:78` | Fatima |
| "CENEVAL Study App" | `app/layout.tsx:20-22`; `components/app-shell.tsx:49`; `components/auth-card.tsx:28` | Todas, siempre |
| "Application error: a server-side exception has occurred" | pantalla por defecto de Next (ver §3) | Todas, al fallar |

Los tres primeros son valores de base de datos escapando a la interfaz. La app **ya tiene** los diccionarios de traducción (`app/administrar/page.tsx:41-46`, `components/publication-controls.tsx:8-13`, `components/topics-review.tsx:23-27`); simplemente no se aplican en esos cuatro lugares.

### "Sesión" significa tres cosas distintas (P1)

1. **Sesiones** = las 40 clases del plan (`app-shell.tsx:17`, `app/sesiones/page.tsx:31`).
2. **Tu sesión** / "Elige cómo avanzar hoy" / "Tiempo disponible 5-10-15 min" = un bloque de estudio (`lesson-view.tsx:198-228`), y "Continuar sesión" en el Inicio (`home-dashboard.tsx:85`).
3. **Cerrar sesión** = salir de la cuenta (`app-shell.tsx:117`).

Una egresada sin experiencia técnica que toca "Sesiones" esperando retomar su estudio encuentra un catálogo de clases; y "Continuar sesión" en el Inicio **no** la lleva a "Sesiones".

### Etiquetas ambiguas o inconsistentes (P1/P2)

- **"Biblioteca"** en el menú (`app-shell.tsx:18`) → título de la página **"Biblioteca CENEVAL"** (`subjects-list.tsx:16-18`) → título de pestaña **"Mis materias"** (`app/materias/page.tsx:5`) → migas que dicen **"Materias"** (`transcript-workspace.tsx:64`, `topics-review.tsx:101`) o **"Biblioteca"** (`class-detail.tsx:39`, `topic-detail.tsx:31`). Cinco nombres para un destino.
- **"Panel editorial"** vs **"Administrar"** para `/administrar` (`app-shell.tsx:104` y `:129`).
- **"Meta: 58"** (`app/sesiones/page.tsx:56`): métrica interna de producción expuesta a la estudiante sin explicación.
- **"Bloque 1 de 3"** (`lesson-view.tsx:341`): jerga editorial. Ella espera "Parte 1 de 3" o el nombre del apartado.
- **"Repetir / Difícil / Bien / Fácil"** (`flashcards-deck.tsx:7-12`) sin ninguna explicación de qué provocan. Y en efecto **no provocan nada** (§1d), lo cual es peor que no explicarlo.
- **"Explicado en clase" / "Explicación complementaria" / "Clase + fuentes complementarias"** (`lesson-view.tsx:28-32`): bien resuelto, sí traduce `sourceOrigin`.
- **"Comprensión en exámenes"** (`home-dashboard.tsx:97`) es en realidad el promedio acumulado de todos los intentos históricos (`home-dashboard.tsx:11-35`), incluidos los primeros intentos malos y los reintentos. Nunca se recupera rápido; le dirá "62%" durante semanas.
- **"Descubre / Comprende / Aplica / Recuerda / Comprueba"** con "1/5" (`lesson-view.tsx:17-23, 267`): claro y bien resuelto.
- **"Estado del último tema: Por comenzar"** (`home-dashboard.tsx:91`): una tarjeta de estadística cuyo valor es una frase, no un dato.

### Mensajes de error crípticos o genéricos (P1)

- `"No pudimos guardar los cambios. Intenta nuevamente."` — respuesta única para **todos** los fallos de escritura (`app/actions/academic.ts:35-38`), usada en 12 lugares distintos. No distingue red, permisos ni validación, y no ofrece alternativa.
- `"No pudimos consultar los datos. Intenta nuevamente."` (`lib/data/academic.ts:181`): nunca se muestra, porque se lanza y no hay `error.tsx` (§3).
- `"Revisa la longitud de los campos."` (`app/actions/academic.ts:82, 185`): no dice qué campo ni cuál es el límite.
- `"La clase aún no tiene un paquete completo por cada tema aprobado."` (`app/actions/academic.ts:271`): "paquete" es jerga interna; no nombra el tema ni el requisito faltante.
- `"El enlace es inválido o ya venció."` (`app/auth/confirm/route.ts:30`): correcto, pero no ofrece "solicitar otro enlace".

### Confirmaciones tras acciones destructivas

- ✅ **Publicar** y **Retirar** clase: diálogo con explicación de consecuencias y botón descriptivo (`publication-controls.tsx:70-120`). Muy bien hecho.
- ❌ **"Volver a borrador"** desde publicada: sin confirmación, despublica y borra `published_at` (§1f). **P1.**
- ❌ **"Rechazar"** un tema: sin confirmación (`topics-review.tsx:262-272`); el tema deja de ser visible para la estudiante (`app/estudiar/page.tsx:20`, RLS). **P2.**

### Confirmaciones de éxito que nunca aparecen (P1)

`docs/04-navigation-and-screens.md:271-273` y `docs/08-visual-design.md:260-262` exigen confirmar qué se guardó.

- `components/subject-form.tsx:38` navega a `/materias?creada=1`, pero **`SubjectsList` no lee `searchParams`** (`components/subjects-list.tsx:6-8`). El parámetro se ignora: guardar una materia no produce ninguna confirmación visible.
- `app/actions/auth.ts:153` redirige a `/?message=Contraseña actualizada.`, pero **`app/page.tsx` no recibe ni lee `searchParams`** (líneas 8-10). Cambiar la contraseña no confirma nada.
- Guardar la transcripción navega directo a `/clases/[id]/temas` sin confirmar (`transcript-workspace.tsx:54`).
- ✅ Excepción bien hecha: `class-details-form.tsx:110-118` con `aria-live="polite"` y "Cambios guardados correctamente."

---

## 5. Móvil

Base sólida: `min-width: 320px` en el `body` (`globals.css:42`), rejillas que colapsan a una columna, formularios en columna, `env(safe-area-inset-bottom)`, `pb-28`. No hay ninguna `<table>` ni `overflow-x` en todo el proyecto (VERIFICADO con `grep`), y las transcripciones y materiales usan `whitespace-pre-line` / `whitespace-pre-wrap`, que **sí** envuelven (`lesson-view.tsx:39, 158`; `transcript-workspace.tsx:154`). **No hay desbordamiento horizontal de texto largo.**

### Áreas táctiles menores a 44 px (P1)

`docs/08-visual-design.md:85` fija el mínimo en 44 × 44 px. Enlaces y botones sin `min-h` ni relleno vertical, cuya altura efectiva es la de la línea de texto (≈16-20 px):

| Elemento | Archivo:línea | Frecuencia de uso |
|---|---|---|
| **Administrar** (cabecera móvil, `text-xs`) | `components/app-shell.tsx:128` | Fatima, cada sesión |
| **Cerrar sesión** (`text-xs`) | `components/app-shell.tsx:116` | (solo escritorio) |
| **Consultar transcripción y fuentes jurídicas** | `components/lesson-view.tsx:505-511` | cada lección |
| **← Volver a la sesión** (desde fuentes) | `components/lesson-view.tsx:145-151` | cada consulta de fuentes |
| **Ver todo** (Inicio → Biblioteca) | `components/home-dashboard.tsx:119` | frecuente |
| **← Panel editorial** | `app/administrar/clases/[classId]/page.tsx:31` | Fatima, cada clase |
| **Crear materia** | `app/administrar/page.tsx:54` | ocasional |
| **Olvidé mi contraseña** | `app/iniciar-sesion/page.tsx:36-41` | crítico si la olvida |
| **Volver a la biblioteca** (estados de error) | `class-detail.tsx:26`, `topic-detail.tsx:18`, `subject-detail.tsx:17`, `app/clases/[classId]/temas/page.tsx:45` | cuando ya está perdida |
| Enlaces de las migas (`text-sm`, sin relleno) | `class-detail.tsx:38-52`, `topic-detail.tsx:30-44` | **cada lección** |

Los dos más costosos son las **migas** (única vía de regreso desde la lección, §1b) y **"Consultar transcripción"**, ambos en la pantalla más usada de la app.

### Texto demasiado pequeño (P2)

31 usos de `text-xs` (12 px) y uno de `text-[11px]`. Los peores por ser contenido, no decoración:
- `app-shell.tsx:147` — etiquetas de la barra inferior a **11 px**.
- `app/sesiones/page.tsx:79` — "45% completado", el dato de avance de cada clase, a 12 px.
- `components/class-detail.tsx:100` — "5 temas", a 12 px.
- `components/subjects-list.tsx:49-51` y `home-dashboard.tsx:139-141` — "4 clases · 12 temas", a 12 px **y en `font-mono`**, que en este proyecto está mapeado a Montserrat (`globals.css:30`): la clase `font-mono` no cambia nada, solo confunde a quien lea el código.

`docs/08-visual-design.md:73-74` fija el mínimo auxiliar en 14 px.

### Reproductor de examen en pantalla angosta

- Botones "Anterior" / "Siguiente pregunta" con `min-h-12` ✅ y `justify-between` — en 320 px, con la etiqueta "Siguiente pregunta" (16 caracteres) más `px-6`, **es probable el desbordamiento o el corte** en pantallas de 320 px (`exam-player.tsx:143-172`). **SUPUESTO**, requiere verificación visual.
- Los `<input type="radio">` usan solo `className="mt-1"` (`exam-player.tsx:117-130`), tamaño nativo ≈13-16 px. El `<label>` envolvente con `p-3` + `leading-6` sí da ≈48 px de alto de área táctil ✅, pero el control visual es diminuto y no tiene contraste suficiente (§6).
- **La pregunta larga y las 4 opciones no caben sin desplazar** en un teléfono; el botón de avance queda debajo del pliegue. La barra de progreso (`w-36`, 144 px) está fija arriba y sale de vista al desplazar. **SUPUESTO.**

### Flashcards en pantalla angosta

- Tarjeta `min-h-72` (288 px) ✅ y calificaciones `grid-cols-2` en móvil con `min-h-11` ✅ (`flashcards-deck.tsx:106, 121-131`). Bien resuelto.
- El texto de la respuesta usa `text-xl leading-8` dentro de `p-8` (`flashcards-deck.tsx:113`): con respuestas jurídicas largas, `min-h-72` se desborda hacia abajo y **los cuatro botones de calificación quedan fuera de la pantalla**, sin ninguna señal de que existen. **SUPUESTO**, muy probable con respuestas de más de ~200 caracteres.

### Otros

- `/sesiones` en móvil: **40 tarjetas en una sola columna**, sin filtro por materia, sin buscador, sin índice, sin anclaje a "donde me quedé" (`app/sesiones/page.tsx:58-83`). Para llegar a C31 hay que desplazarse por 30 tarjetas de ~200 px = ~6 000 px. **P1.**
- `/administrar` igual: todas las clases de todas las materias en una lista plana (`app/administrar/page.tsx:58-76`). **P1.**
- El recorrido de 5 pasos usa `grid-cols-2` en móvil (`lesson-view.tsx:252`): 5 elementos en 2 columnas dejan el quinto ("Comprueba", el examen) solo en la última fila, desalineado.
- La rejilla de "Tiempo disponible" (5/10/15 min) está dentro de un `<fieldset>` con `flex gap-2` (`lesson-view.tsx:206-228`): tres botones con `px-4` + texto "15 min" caben, pero justos en 320 px.

---

## 6. Accesibilidad (WCAG 2.2 AA)

### Lo que está bien (VERIFICADO)

- `lang="es"` en `<html>` (`app/layout.tsx:36`).
- `@media (prefers-reduced-motion: reduce)` implementado (`globals.css:75-83`) → SC 2.3.3.
- Todos los iconos son `aria-hidden="true"` por defecto (`components/icons.tsx:8`) y siempre van acompañados de texto → cumple `docs/08-visual-design.md:40`.
- `<nav aria-label>`, `<ol>` en migas, `aria-current="page"`/`"step"`, `<fieldset>`+`<legend>` en el examen y en el selector de minutos.
- `role="progressbar"` con `aria-valuenow/min/max` y `aria-label` en los tres indicadores (`lesson-view.tsx:343-350`, `exam-player.tsx:89-96`, `flashcards-deck.tsx:90-97`).
- **Las flashcards y el examen SÍ son operables por teclado.** La tarjeta es un `<button>` real (`flashcards-deck.tsx:104-119`), las calificaciones son `<button>`, las opciones del examen son `<input type="radio">` dentro de `<label>`, y la guía de preguntas usa `<details>/<summary>` nativos (`lesson-view.tsx:319-334`). **No hay ninguna interacción que dependa solo del clic.** Este punto de la evaluación sale limpio.
- Etiquetas asociadas por `htmlFor`/`id` en todos los formularios revisados, incluida la etiqueta oculta del buscador (`app/buscar/page.tsx:33-35`).
- `<label>` en `auth-card.tsx:77-79` con `htmlFor={name}` e `id={name}` — correcto.

### Fallos de contraste (calculados sobre `globals.css:3-15`)

| Par | Ratio | Umbral | Resultado |
|---|---:|---:|---|
| `--muted` #5b6474 sobre `--background` | 5.48:1 | 4.5 | ✅ |
| `--brand` #243b64 sobre blanco | 11.14:1 | 4.5 | ✅ |
| `--success` #2f6b57 sobre `--success-soft` | 5.00:1 | 4.5 | ✅ |
| `--warning` #a36316 sobre `bg-amber-50` | 4.65:1 | 4.5 | ✅ (justo) |
| `--danger` #a23b3b sobre `bg-red-50` | 5.95:1 | 4.5 | ✅ |
| blanco/70 sobre `--brand` | 6.36:1 | 4.5 | ✅ |
| **`--border` #ded9cf sobre blanco** | **1.41:1** | **3.0** | ❌ **SC 1.4.11** |
| **anillo de foco `rgb(36 59 100 / 35%)` sobre `--background`** | **1.92:1** | **3.0** | ❌ **SC 1.4.11 y 2.4.11** |
| **`placeholder:text-muted/65` sobre blanco** | **2.83:1** | **4.5** | ❌ **SC 1.4.3** |
| **`placeholder:text-muted/60` sobre blanco** | **2.56:1** | **4.5** | ❌ **SC 1.4.3** |

La paleta de texto es sólida. Los fallos están en los **bordes y el foco**:

**P0 — El indicador de foco es prácticamente invisible.** `globals.css:65-68` define `outline: 3px solid rgb(36 59 100 / 35%)`. Compuesto sobre el fondo papel da `#adb4bf`, **1.92:1** contra el fondo adyacente. WCAG 2.2 añadió **SC 2.4.11 Focus Appearance como nivel AA**, que exige mínimo 3:1 del indicador contra el color adyacente. Y sobre un botón azul de marca, con `outline-offset: 3px`, el anillo cae sobre el fondo de la página con el mismo 1.92:1. `docs/08-visual-design.md:267` exige "Foco visible en enlaces, botones y campos". Corrección: opacidad completa (`--brand` da 10.23:1) o doble anillo blanco+azul.

**P1 — Los bordes de los campos no se distinguen del fondo.** `border-border` sobre blanco da **1.41:1**, por debajo del 3:1 de SC 1.4.11 (Non-text Contrast). Afecta a todos los `<input>` y `<textarea>` (`auth-card.tsx:82`, `subject-form.tsx:64`, `class-form.tsx:43`, `transcript-workspace.tsx:201`) y a las tarjetas de opción del examen (`exam-player.tsx:114`). En un teléfono a la luz del día, los campos del formulario de acceso son rectángulos invisibles.

**P1 — Placeholders ilegibles.** `placeholder:text-muted/65` (`subject-form.tsx:64`, `class-form.tsx:43`) = 2.83:1 y `placeholder:text-muted/60` (`transcript-workspace.tsx:201`) = 2.56:1.

**P2 — La pista de la barra de progreso** usa `bg-border` con relleno `bg-success`: 4.44:1 entre relleno y pista ✅, pero la pista contra el fondo blanco es 1.41:1, así que el 0 % es invisible (`lesson-view.tsx:348`, `exam-player.tsx:94`, `flashcards-deck.tsx:95`).

### Resultados dinámicos sin anuncio (P1)

- **El resultado del examen no se anuncia.** `exam-player.tsx:40-79` sustituye el formulario completo por la calificación sin `aria-live`, sin `role="status"` y **sin mover el foco**. Con lector de pantalla, entregar el examen produce silencio; el foco queda en un botón que ya no existe en el árbol.
- **La revelación de la flashcard no se anuncia de forma fiable.** `flashcards-deck.tsx:104-119`: el `aria-label` del botón cambia de "Revelar respuesta" a "Respuesta revelada" y su contenido cambia de la pregunta a la respuesta, todo en el mismo nodo enfocado. No hay `aria-live` ni región de resultado. La usuaria de lector oye, en el mejor de los casos, un cambio de nombre accesible, no la respuesta.
- **La pantalla "Repaso completado" no se anuncia** (`flashcards-deck.tsx:33-67`).
- ✅ Bien: `lesson-view.tsx:273` ("Guardando avance…"), `class-details-form.tsx:110`, `role="alert"` en 6 formularios.

### Gestión de foco (P1)

- **El diálogo de publicación no atrapa el foco.** `publication-controls.tsx:70-120` tiene `role="dialog"` y `aria-modal="true"` correctos, pero: no mueve el foco al abrirse, no lo devuelve al cerrarse, **no cierra con Escape**, no vuelve inerte el contenido de fondo y no cierra al tocar el velo. Con teclado, tabular desde "Cancelar" sale del diálogo hacia la página que hay detrás. Con lector de pantalla, `aria-modal` promete un aislamiento que el DOM no cumple. Falla SC 2.1.2 (No Keyboard Trap invertido) y 2.4.3 (Focus Order).
- **`showSources` sustituye la lección entera sin mover el foco** (`lesson-view.tsx:142-188`). La estudiante toca "Consultar transcripción" al final de la página; el contenido cambia por completo y el foco se queda en un botón desmontado. Al volver, igual.
- **Cambiar de paso en el recorrido** (`goToStep`, `lesson-view.tsx:112-117`) sustituye toda la sección de contenido sin anunciarlo ni mover el foco.

### ARIA incorrecto (P1/P2)

- **Pestañas rotas en la transcripción.** `transcript-workspace.tsx:121-152`: hay `role="tablist"` y dos `role="tab"` con `aria-selected`, pero **no existe ningún `role="tabpanel"`**, no hay `aria-controls`, no hay `id`, no hay `tabindex` móvil ni manejo de flechas. Es el patrón de pestañas ARIA a medias, que para un lector de pantalla es peor que no usar ARIA. (Solo administradora → P2 por frecuencia, P1 por gravedad.)
- **`aria-label` sobre un `<div>` genérico** en el mapa conceptual (`concept-map.tsx:34`): sin `role`, la mayoría de los lectores lo ignoran.
- **`aria-pressed` sin nombre estable** en el selector de minutos (`lesson-view.tsx:210-226`): correcto en realidad; los botones dicen "5 min", "10 min", "15 min". ✅
- `aria-label={`Progreso ${percent}%`}` sobre un `<div>` sin `role` en `/sesiones` (`app/sesiones/page.tsx:76`): ignorado. Las otras tres barras sí usan `role="progressbar"` correctamente. Inconsistencia.

### Jerarquía de encabezados (P2)

- Los títulos de las tarjetas de clase, tema y materia **no son encabezados** sino `<span className="block font-semibold">` dentro de un `<Link>`: `class-detail.tsx:113`, `subject-detail.tsx:63`, `app/estudiar/page.tsx:90`, `app/buscar/page.tsx:63`. Una usuaria de lector de pantalla **no puede navegar la lista de temas por encabezados**. `/sesiones` sí usa `<h3>` correctamente (`app/sesiones/page.tsx:69`) — inconsistente.
- **Nombres de enlace larguísimos.** Como toda la tarjeta es un `<Link>` que contiene estado + título + descripción de dos líneas + contadores, el nombre accesible del enlace es esa concatenación completa. Ejemplo real (`app/estudiar/page.tsx:82-94`): *"Por comenzar Amparo indirecto La procedencia del amparo indirecto contra actos de autoridad…"*. Navegando por lista de enlaces es inutilizable.
- La página `/administrar/clases/[classId]` cuando la clase no existe devuelve **solo** `<h1>Clase no encontrada</h1>` (línea 26) sin explicación ni enlace de regreso.

### Imágenes (sin hallazgos)

**VERIFICADO:** `grep -rn "<img\|next/image\|/images/"` en `app/`, `components/`, `lib/`, `content/` → **cero resultados**. `public/images/concept-maps/poder-ejecutivo-apf.png` **no se usa en ninguna parte**. Los mapas conceptuales se renderizan como HTML estructurado (`components/concept-map.tsx`), lo cual es *mejor* para accesibilidad que una imagen con `alt`. No hay problema de texto alternativo. (Recomendación: eliminar el PNG huérfano, o documentar que la decisión de renderizar en HTML fue deliberada.)

---

## 7. Experiencia de estudio: ¿ayuda de verdad a aprender?

### Lo que está bien pensado

- **El recorrido de 5 pasos** (Descubre → Comprende → Aplica → Recuerda → Comprueba) es pedagogía real: parte de una pregunta antes de leer (`lesson-view.tsx:279-296`), luego mapa conceptual + guía Q&A + bloques, luego casos con "Hechos → norma → razonamiento → conclusión" (`lesson-view.tsx:405-411`), luego tarjetas, luego examen. Es un buen diseño instruccional.
- **"No hay rachas ni puntos"** declarado explícitamente en la interfaz (`lesson-view.tsx:202-204`), coherente con `docs/08-visual-design.md:25-27`.
- **"Comprobación rápida · no afecta tu calificación"** (`lesson-view.tsx:418-420`): reduce la ansiedad, buen detalle.
- **El aviso legal** "Material educativo para preparación académica; no constituye asesoría jurídica" (`topic-detail.tsx:57-60`): correcto y necesario.
- **Retomar donde se quedó funciona a nivel de paso y de bloque**: `study_progress` guarda `current_step` y `material_index` y `LessonView` los restaura (`lesson-view.tsx:53-58`).

### Lo que no ayuda a aprender

**P1 — Retroalimentación tras responder mal: insuficiente.** Ver §1c. La estudiante nunca sabe cuál era la opción correcta. Los datos existen (`optionExplanations`), viajan al navegador y se descartan.

**P1 — La repetición espaciada no funciona.** Ver §1d. `next_review_at` se escribe y nunca se lee. Los contadores de "difícil" solo crecen. No hay ninguna pantalla que sirva las tarjetas debidas hoy. La estudiante califica 10 tarjetas por tema, 40 clases → cientos de calificaciones que no producen ningún repaso.

**P1 — El orden de los bloques conceptuales es indeterminado.** `getLessonBundle` consulta `study_materials` **sin `.order()`** (`lib/data/academic.ts:499-503`), y `lesson-view.tsx:70-79` los filtra preservando ese orden arbitrario. "Bloque 1 de 3" puede ser el resumen antes que la explicación completa. PostgREST no garantiza el orden sin `ORDER BY`. La secuencia pedagógica —lo único que justifica el diseño de 5 pasos— no está garantizada.

**P1 — No hay visibilidad del avance real.** Ver §2. Existe el % por clase en `/sesiones` (bien), pero no existe "12 de 40 clases completas", ni por materia, ni un mapa de qué queda. Y el % por clase se calcula como `completedSteps / (temas × 5)` (`lib/data/academic.ts:370-374`), donde `completedSteps` es la suma de longitudes de `completed_steps`: contabiliza *pasos visitados y marcados*, no comprensión. Marcar los 5 pasos sin aprender nada da 100 %.

**P2 — El examen no se puede repetir ni consultar después.** No hay historial de intentos, no hay "repetir examen", y `docs/04-navigation-and-screens.md:99-100` preveía rutas `/examenes/[examenId]/intento` y `/examenes/intentos/[intentoId]` que no se construyeron. Los datos sí se guardan en `exam_attempts` y `exam_answers` (`app/actions/academic.ts:424-451`), pero **ninguna pantalla los lee** salvo el promedio agregado del Inicio.

**P2 — El examen no permite configurar dificultad ni cantidad**, que `docs/04-navigation-and-screens.md:219` sí preveía. Siempre son los mismos 10 reactivos en el mismo orden.

**P2 — La "guía de preguntas y respuestas" del paso Comprende expone todas las respuestas de las flashcards** (`lesson-view.tsx:318-335`) *antes* del paso Recuerda, que usa exactamente las mismas tarjetas (`lesson-view.tsx:474`). El repaso activo del paso 4 queda anulado porque ya vio todas las respuestas en el paso 2.

**P2 — La "Comprobación rápida" usa siempre `lesson.flashcards[0]`** (`lesson-view.tsx:89`), la misma tarjeta que ella ya leyó en la guía del paso anterior.

**P2 — Los minutos disponibles (5/10/15) no hacen nada.** Se guardan en `study_progress.session_minutes` (`app/actions/academic.ts:345`) y no alteran ni la cantidad de bloques, ni de tarjetas, ni de preguntas. La promesa "Elige el tiempo disponible dentro de cualquier tema" (`app/estudiar/page.tsx:65-67`) no se cumple.

---

## 8. Comparación diseñado vs construido

| Requisito documentado | Estado | Evidencia |
|---|---|---|
| Barra: Inicio / Materias / **Estudiar** / Buscar (`04:56`, `08:99`) | ❌ Construido: Inicio / **Sesiones** / **Biblioteca** / Buscar | `app-shell.tsx:15-20` |
| "menú adicional" móvil para acciones menos frecuentes (`04:59`) | ❌ No existe → sin salir de sesión en móvil | `app-shell.tsx:125-158` |
| Encabezado móvil con título y botón de volver (`04:278`, `08:110-119`) | ❌ Solo logotipo | `app-shell.tsx:125-132` |
| Estados vacío/carga/error desde la 1.ª entrega (`04:47`) | ❌ Carga y error inexistentes; vacíos parciales | §3 |
| Error: panel con "Intentar nuevamente", sin trazas (`08:258`) | ❌ Pantalla por defecto de Next en inglés | §3 |
| Carga: estructura temporal, sin bloquear toda la app (`08:246`) | ❌ Nada | §3 |
| Éxito: "confirmará qué se guardó" (`04:271`, `08:260`) | ⚠️ Solo en `class-details-form` | §4 |
| Confirmación antes de entregar el examen (`04:227`) | ❌ Ausente | `exam-player.tsx:162-172` |
| Resultado con porcentaje, aciertos, errores, explicación **de cada opción** (`04:229`) | ❌ Solo `n/total` + explicación general | `exam-player.tsx:40-79` |
| Búsqueda agrupada con fragmento de coincidencia (`04:236-238`) | ❌ Solo título, sin contexto | `app/buscar/page.tsx` |
| Detalle de clase con "estado de la transcripción" (`04:163`) | ❌ No se muestra (`hasTranscript` se calcula y se descarta) | `class-detail.tsx`, `lib/data/academic.ts:29` |
| Acción principal cambiante según avance (`04:165-168`) | ❌ Siempre la misma lista de temas | `class-detail.tsx:94-123` |
| "Editar" tema en revisión (`04:190`) | ❌ Solo Aprobar / Rechazar | `topics-review.tsx:242-273` |
| Editar contenido del tema (`04:204`) | ❌ No implementado | — |
| Área táctil mínima 44 × 44 (`08:85`) | ⚠️ Incumplida en ~10 controles | §5 |
| Foco visible (`08:267`) | ❌ 1.92:1 | §6 |
| No métricas con cero (`08:204`) | ❌ "Conceptos para repasar: 0" siempre visible | `home-dashboard.tsx:92-95` |
| Ancho de lectura ~72 caracteres (`08:76`) | ⚠️ Materiales sin `max-w`: `whitespace-pre-line` a todo el ancho de 1200 px en escritorio | `lesson-view.tsx:39` |
| Migas navegables en pantallas profundas (`08:162-170`) | ✅ Cumplido | §2 |
| Estado nunca solo por color (`08:59`) | ✅ Cumplido | §6 |
| Movimiento reducido (`08:272`) | ✅ Cumplido | `globals.css:75-83` |
| Todas las clases en orden C01→C58 | ✅ **Resuelto** en `/sesiones` | `app/sesiones/page.tsx` |
| Botones clase anterior/siguiente | ✅ **Resuelto** | `class-detail.tsx:81-92` |

---

## 9. Índice de hallazgos por prioridad

### P0 — impide estudiar o bloquea

| # | Hallazgo | Archivo:línea |
|---|---|---|
| 1 | Sin ningún `error.tsx` / `global-error.tsx` / `not-found.tsx`: cualquier fallo de consulta o URL con id no numérico muestra la pantalla de error de Next en inglés, sin salida | `lib/data/academic.ts:179-182`; ausencia en todo `app/` |
| 2 | Sin ningún `loading.tsx` ni `<Suspense>`: cada navegación se congela sin indicador, con hasta 11 consultas encadenadas en la pantalla más usada | ausencia en `app/`; `lib/data/academic.ts:490-577` |
| 3 | `/estudiar` queda huérfana en cuanto hay avance guardado; la barra construida no coincide con la aprobada | `home-dashboard.tsx:81-86`; `app-shell.tsx:15-20` |
| 4 | Anillo de foco a 1.92:1 — incumple SC 2.4.11 (AA en WCAG 2.2) y 1.4.11 en toda la app | `globals.css:65-68` |
| 5 | Dos jerarquías con numeraciones contradictorias: C17 aparece como "03" dentro de su materia | `subject-detail.tsx:59-61` vs `app/sesiones/page.tsx:66`; `lib/data/academic.ts:267-268` |
| 6 | Nada en el Inicio enlaza a `/sesiones`; la ruta correcta hacia C01 es indescubrible | `home-dashboard.tsx` (sin referencias); `grep` |
| 7 | El diálogo de publicación no atrapa el foco, no cierra con Escape, no restaura el foco | `publication-controls.tsx:70-120` |
| 8 | Clases nuevas creadas por Fatima nacen sin `curriculum_code`/`curriculum_order`: invisibles en `/sesiones` y rompen anterior/siguiente | `app/actions/academic.ts:85-96`; `class-form.tsx` |
| 9 | El orden de los bloques conceptuales es indeterminado (consulta sin `ORDER BY`) | `lib/data/academic.ts:499-503` |

### P1 — fricción grave y frecuente

| # | Hallazgo | Archivo:línea |
|---|---|---|
| 10 | El resultado del examen no muestra qué contestó ni cuál era la correcta; `optionExplanations` se descarta | `exam-player.tsx:52-76` vs `app/actions/academic.ts:464` |
| 11 | Repetición espaciada inoperante: `next_review_at` se escribe y nunca se lee; ninguna pantalla sirve las tarjetas debidas | `app/actions/academic.ts:303-313`; `grep` |
| 12 | Contadores de repaso monótonamente crecientes y sin enlace ("47 respuestas difíciles") | `app/estudiar/page.tsx:27-36`; `home-dashboard.tsx:22-26` |
| 13 | Sin cerrar sesión ni cambiar contraseña desde el teléfono | `app-shell.tsx:75, 114-120` |
| 14 | La pantalla de resultado del examen es un callejón sin salida (ni repetir, ni volver, ni siguiente) | `exam-player.tsx:40-79` |
| 15 | Al terminar un tema no hay enlace a la siguiente clase ni al siguiente tema | `topic-detail.tsx`, `lesson-view.tsx:505-511` |
| 16 | Sin confirmación antes de entregar el examen | `exam-player.tsx:162-172` |
| 17 | "Volver a borrador" despublica en un toque sin confirmación y borra `published_at` | `publication-controls.tsx:41-47`; `app/actions/academic.ts:280-284` |
| 18 | Estados en inglés crudo visibles a Fatima (`draft`, `published`, `approved`…) | `administrar/page.tsx:72`; `administrar/clases/[classId]/page.tsx:39,78`; `subject-detail.tsx:67`; `class-detail.tsx:62` |
| 19 | Bordes de campo a 1.41:1 — incumple SC 1.4.11; los campos de acceso son invisibles a plena luz | `globals.css:14`; `auth-card.tsx:82` y todos los formularios |
| 20 | El resultado del examen no se anuncia ni mueve el foco (lector de pantalla) | `exam-player.tsx:40-79` |
| 21 | El formulario de acceso pierde el correo escrito al fallar | `app/actions/auth.ts:13-15`; `auth-card.tsx:80-87` |
| 22 | Áreas táctiles < 44 px en migas, "Consultar transcripción", "Administrar", "Olvidé mi contraseña" | §5, tabla |
| 23 | Estados vacíos ausentes en 6 pantallas (materia sin clases, clase sin temas, `/sesiones`, `/estudiar`, `/administrar`) | §3, tabla |
| 24 | `/sesiones` y `/administrar`: 40 tarjetas en columna única, sin filtro, buscador ni índice | `app/sesiones/page.tsx:58-83`; `administrar/page.tsx:58-76` |
| 25 | El error de "no se puede publicar" no dice qué tema ni qué requisito falta | `app/actions/academic.ts:268-273` |
| 26 | Confirmaciones de éxito que nunca aparecen (`?creada=1`, `?message=`) | `subject-form.tsx:38`; `app/actions/auth.ts:153`; `app/page.tsx:8-10` |

### P2 — mejora

27. Búsqueda solo por título de tema, sin materia/clase ni fragmento (`app/buscar/page.tsx:17-24, 57-68`).
28. `showSources` y el cambio de paso sustituyen el contenido sin mover el foco (`lesson-view.tsx:112-117, 142-188`).
29. Pestañas ARIA incompletas en la transcripción, sin `tabpanel` ni flechas (`transcript-workspace.tsx:121-152`).
30. `aria-label` sobre `<div>` sin `role` (`concept-map.tsx:34`; `app/sesiones/page.tsx:76`).
31. Títulos de tarjeta como `<span>` y no encabezados; nombres de enlace larguísimos (`class-detail.tsx:113`; `subject-detail.tsx:63`; `app/estudiar/page.tsx:90`).
32. Placeholders a 2.56–2.83:1 (`subject-form.tsx:64`; `class-form.tsx:43`; `transcript-workspace.tsx:201`).
33. Cinco nombres distintos para la Biblioteca; dos para el panel de administración.
34. Tres significados de "sesión" en la misma interfaz.
35. "Meta: 58" y "Bloque 1 de 3": jerga interna expuesta (`app/sesiones/page.tsx:56`; `lesson-view.tsx:341`).
36. Textos de 11–12 px en datos, no en decoración (`app-shell.tsx:147`; `app/sesiones/page.tsx:79`).
37. `font-mono` mapeado a Montserrat: la clase no hace nada (`globals.css:30`).
38. La guía Q&A del paso Comprende revela todas las respuestas de las flashcards del paso Recuerda (`lesson-view.tsx:318-335, 474`).
39. La comprobación rápida siempre usa la misma tarjeta (`lesson-view.tsx:89`).
40. Los minutos 5/10/15 no alteran nada (`lesson-view.tsx:59-61`; `app/actions/academic.ts:345`).
41. Los intentos de examen se guardan pero ninguna pantalla los muestra (`app/actions/academic.ts:424-451`).
42. Sin configuración de dificultad ni cantidad de reactivos (`docs/04:219`).
43. "Rechazar" tema sin confirmación (`topics-review.tsx:262-272`).
44. Errores de aprobar/rechazar invisibles si el formulario está oculto (`topics-review.tsx:83-85, 174-178`).
45. `class-form.tsx` pinta todos los errores bajo el campo Título (`class-form.tsx:70-78`).
46. Títulos de pestaña genéricos; sin `metadata` en autenticación (`app/clases/[classId]/page.tsx:4-6`, etc.).
47. `components/placeholder-page.tsx` es código muerto.
48. `public/images/concept-maps/poder-ejecutivo-apf.png` huérfano.
49. Contradicción "Dominado: retoma exactamente donde pausaste" (`home-dashboard.tsx:72-80`).
50. `%` y `_` del usuario actúan como comodines en la búsqueda (`app/buscar/page.tsx:21`).
51. Materiales sin `max-w` de lectura: líneas de hasta 1200 px en escritorio (`lesson-view.tsx:39`), contra `docs/08:76`.
52. Métrica en cero visible pese a `docs/08:204` (`home-dashboard.tsx:92-95`).
53. Estado de la transcripción calculado (`hasTranscript`) y nunca mostrado (`lib/data/academic.ts:29`).
54. Redirecciones sin explicación en `requireAdmin`/`requireUser`, y sin `?next=` para volver donde estaba (`lib/auth.ts:56-65`).
55. `/estudiar` sin paginación ni contexto de clase por tema (`app/estudiar/page.tsx:17-22, 72-96`).

---

## 10. Recomendación de secuencia

**Semana 1 (desbloquear):** `app/error.tsx` + `app/global-error.tsx` + `app/not-found.tsx` con el panel de `docs/08:258`; `loading.tsx` en `/`, `/sesiones`, `/clases/[classId]`, `/temas/[topicId]`; validar ids no numéricos con `notFound()`; subir el anillo de foco a opacidad completa; subir `--border` a ≥3:1 contra blanco.

**Semana 2 (el estudio diario):** pintar `optionExplanations` con la opción elegida y la correcta marcadas; añadir "Repetir examen" y "Siguiente clase Cxx →" al resultado; añadir "Siguiente tema / Siguiente clase" al pie de la lección; `.order("position")` en `study_materials`; confirmación antes de entregar.

**Semana 3 (orientación):** decidir **una** jerarquía —recomiendo Sesiones C01→C58 como principal y Biblioteca como filtro secundario—; renombrar la barra a Inicio / Estudiar / Biblioteca / Buscar y colgar `/estudiar` de ella o retirarla; mostrar el código C en el detalle de materia y en el panel de administración; añadir "Continuar por C17" al Inicio; añadir "12 de 40 clases" al Inicio y a `/sesiones`.

**Semana 4 (Fatima y el teléfono):** traducir los cuatro estados en inglés; confirmación para "Volver a borrador"; diagnóstico específico al fallar la publicación; campo de código/orden de currículo en "Nueva clase"; menú de cuenta en móvil con cerrar sesión y cambiar contraseña; foco atrapado + Escape en el diálogo; buscador y filtro por materia en `/administrar`.

**Después:** hacer real la repetición espaciada leyendo `next_review_at` y creando una pantalla "Repasar hoy"; estados vacíos completos; áreas táctiles; que los minutos 5/10/15 recorten la sesión.

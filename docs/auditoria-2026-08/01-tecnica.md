# Evaluación técnica — CENEVAL Study App

**Repositorio auditado:** `C:\Users\fkr2d\Documents\repos\ceneval-study-app\.claude\worktrees\app-evaluation-technical-user-owner-23d017`
**Rama:** `claude/app-evaluation-technical-user-owner-23d017` (commit `3af446d`, árbol limpio)
**Stack verificado en `package.json`:** Next 16.2.11, React 19.2.4, `@supabase/ssr` 0.12.3, `@supabase/supabase-js` 2.110.8, Zod 4.4.3, Tailwind 4, TypeScript 5.
**Fecha:** 2026-08-19
**Alcance:** lectura completa de `app/`, `components/`, `lib/`, `supabase/migrations/`, `scripts/`, `proxy.ts`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `package.json`, y de los 41 paquetes de `content/packages/`. Ejecución real de `npm run lint` y `npx tsc --noEmit`. **No se modificó ningún archivo del proyecto** y **no se ejecutó `content:import` ni `security:rls`** (tocan Supabase remoto).

---

## 0. Nota metodológica sobre Next.js 16

`AGENTS.md` advierte que esta versión tiene cambios de ruptura. Antes de emitir juicios leí, dentro de `node_modules/next/dist/docs/`:

- `01-app/02-guides/upgrading/version-16.md`
- `01-app/03-api-reference/03-file-conventions/proxy.md`
- `01-app/03-api-reference/04-functions/connection.md`

**Convenciones que el repo aplica correctamente y que NO son bugs** (lo aclaro para que nadie las "corrija" por error):

| Patrón en el repo | Veredicto |
|---|---|
| `proxy.ts` en la raíz con `export async function proxy(request)` | **Correcto.** `version-16.md` documenta el rename `middleware` → `proxy`; el runtime es Node.js y no es configurable. |
| `params: Promise<{...}>` y `searchParams: Promise<{...}>` con `await` en todas las páginas | **Correcto.** En v16 el acceso síncrono fue eliminado por completo. |
| `const cookieStore = await cookies()` en `lib/supabase/server.ts:21` | **Correcto.** API asíncrona obligatoria. |
| `await connection()` en la capa de datos | **Correcto** como API (v15 estable), aunque su uso aquí es redundante — ver R4. |
| `next dev` / `next build` sin `--turbopack` | **Correcto.** Turbopack es el default en v16. |
| `eslint` a secas en el script `lint` (sin `next lint`) | **Correcto.** `next lint` fue migrado al CLI de ESLint. |
| No usar `revalidateTag` | **Correcto.** En v16 exigiría un segundo argumento de `cacheLife`; el repo no lo usa. |
| Proxy que **no** protege rutas, con `requireUser()`/`requireAdmin()` en cada página y Server Action | **Correcto y recomendado.** `proxy.md:219` dice literalmente que los Server Functions no son rutas separadas y que hay que verificar auth dentro de cada uno en vez de confiar en el proxy. Este repo lo hace bien. |

---

## 1. Lo que está bien (contexto para calibrar los hallazgos)

Antes de la lista de problemas, hay que decir que **el modelo de seguridad de datos es sólido** y bastante mejor que el promedio:

1. **No hay fuga de la clave secreta al cliente. VERIFICADO.**
   - `lib/supabase/admin.ts:11` lee `SUPABASE_SECRET_KEY` (sin prefijo `NEXT_PUBLIC_`) y el módulo abre con `import "server-only"` (`admin.ts:1`).
   - `import "server-only"` también en `lib/auth.ts:1`, `lib/access.ts:1`, `lib/data/academic.ts:1`, `lib/supabase/server.ts:1`.
   - `grep -rEn "eyJ[A-Za-z0-9_-]{10,}|sb_secret|service_role"` sobre todo el repo (excluyendo `node_modules`) no arroja ningún secreto; `.gitignore` incluye `.env*` y `git log --all -- '*.env*'` está vacío.

2. **Las respuestas correctas NO se filtran al cliente antes de entregar el examen. VERIFICADO.**
   - `lib/data/academic.ts:552-554` selecciona de `exam_options` únicamente `id, question_id, option_text, position`. Nunca toca `exam_answer_keys`.
    - `supabase/migrations/20260821020733_editorial_learning_platform.sql:346` habilita RLS en `exam_answer_keys` y **no crea ninguna política**; los `grant` de las líneas 348-355 no incluyen esa tabla para `authenticated` (solo `service_role`, línea 357-362). Resultado: deny-all para cualquier JWT de estudiante.
   - `scripts/test-rls.ts:416-424` incluso lo verifica ("Las claves de respuestas no son consultables por estudiantes").

3. **Todos los Server Actions y todas las páginas admin verifican rol. VERIFICADO** (revisión exhaustiva):
   `createSubjectAction:41`, `createClassAction:70`, `updateClassDetailsAction:108`, `saveTranscriptAction:148`, `createTopicAction:180`, `updateTopicStatusAction:219`, `updatePublicationStatusAction:235` → `requireAdmin()`.
   `reviewFlashcardAction:302`, `saveStudyProgressAction:326`, `saveQuickCheckAction:364`, `submitExamAction:388` → `requireUser()`.
   Páginas: `/administrar`, `/administrar/clases/[classId]`, `/materias/nueva`, `/materias/[subjectId]/clases/nueva`, `/clases/[classId]/temas`, `/clases/[classId]/transcripcion` → todas con `requireAdmin()`.

4. **El contenido `draft`/`withdrawn` no es legible fuera del panel admin. VERIFICADO por lectura de las políticas.**
    Todas las tablas de contenido tienen política `..._select_published_or_admin` que exige `classes.publication_status = 'published'` o `private.is_admin()`, incluyendo el encadenamiento transitivo `exam_options → exam_questions → exams → topics → classes` (migración `20260821020733`, líneas 374-533) y `class_audio_sources` (migración `20260821021153`, líneas 32-43). `is_admin()` es `security definer` con `search_path = ''` y `revoke ... from public, anon` (líneas 298-316). Añadir `withdrawn` al CHECK (migración `20260821020936`) oculta la clase automáticamente porque las políticas comparan contra `'published'` literal.

5. **Un estudiante no puede auto-promoverse a admin. VERIFICADO.** `profiles_update_own` (migración `20260821020733:369-372`) tiene `with check ((select auth.uid()) = id and role = 'student')`.

6. **`revoke all ... from anon, authenticated` antes de los `grant` explícitos** (migración inicial, líneas 122-129) — patrón correcto de menor privilegio.

7. **Cero `any` en todo el código de aplicación.** `grep -rn ": any|as any|<any>" app components lib scripts` → 0 resultados.

8. **`lint` y `tsc` limpios.** Ver sección 6.

---

## 2. SEGURIDAD

### S1 — Open redirect + fijación de sesión en `/auth/confirm` · **P1** · VERIFICADO (ejecutado)

`app/auth/confirm/route.ts:5-7`:

```ts
function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
```

`app/auth/confirm/route.ts:36` hace `NextResponse.redirect(new URL(next, request.url))`.

El filtro bloquea `//host` pero **no** `/\host`. El parser WHATWG trata `\` como `/` en esquemas especiales. Lo comprobé ejecutando Node en este entorno:

```
"/\\evil.com"  -> https://evil.com/          <-- pasa safeNext y sale del dominio
"//evil.com"   -> https://evil.com/          <-- bloqueado por safeNext
"/evil.com"    -> https://app.example.com/evil.com
```

**Escenario de fallo concreto:** el atacante solicita un enlace de recuperación para *su propia* cuenta y obtiene un `token_hash` válido. Envía a la víctima `https://<app>/auth/confirm?token_hash=<token-del-atacante>&type=recovery&next=/\evil.com`. La víctima hace clic: (a) `verifyOtp` tiene éxito, la víctima queda con la **sesión del atacante** en su navegador (fijación de sesión: cualquier progreso o intento que registre a partir de ahí se guarda en la cuenta del atacante), y (b) es redirigida a `https://evil.com` con apariencia de venir del dominio legítimo. La rama `code`/`exchangeCodeForSession` está protegida por PKCE, pero la rama `token_hash` **no**.

**Arreglo (1 línea):**
```ts
function safeNext(value: string | null) {
  if (!value) return "/";
  const decoded = decodeURIComponent(value);
  return /^\/(?![\/\\])/.test(decoded) ? decoded : "/";
}
```

---

### S2 — `submitExamAction` escribe entrada del cliente sin validar, con el cliente service-role · **P1** · VERIFICADO

`app/actions/academic.ts:384-451`. La firma es `submitExamAction(examId: number, answers: Record<string, number>)`. Ese tipo es **solo de compilación**: un Server Action recibe lo que el cliente serialice.

Puntos concretos:

- `academic.ts:405` — `if (questions.some(({ id }) => !answers[String(id)]))` es la única "validación". Comprueba presencia, no dominio.
- `academic.ts:443-450` — inserta en `exam_answers` con `getSupabaseAdminClient()` (service role, **bypass total de RLS**) el valor `selected_option_id: answers[String(questionId)]` **sin comprobar que esa opción pertenece a esa pregunta**.
- No se usa Zod en ningún Server Action, pese a que Zod ya es dependencia de producción y se usa exhaustivamente en `lib/content/package-schema.ts`.

**Escenario de fallo concreto:** el estudiante abre DevTools y modifica la carga del Server Action para enviar `{"401": 9999}` donde 9999 es el id de una opción de *otra* pregunta de *otro* examen. La FK `exam_options(id)` se cumple, el CHECK no existe, RLS está desactivada para service_role → se persiste una fila `exam_answers` con `question_id=401` y `selected_option_id` de otra pregunta. La tabla de analítica queda corrompida de forma indetectable y `is_correct` queda en `false` para una respuesta que ni siquiera era de esa pregunta.

Variante menor: enviar `"3"` (string) en vez de `3`. `answers[String(question_id)] === correct_option_id` es `===`, así que da `false` (respuesta marcada incorrecta), pero PostgREST coacciona el string al insertar → **la calificación y lo guardado se contradicen**.

**Arreglo:** validar con Zod (`z.record(z.coerce.number().int().positive(), ...)`) y, sobre todo, cargar `exam_options(id, question_id)` del examen y rechazar cualquier `selected_option_id` que no pertenezca a su `question_id`.

---

### S3 — El bloqueo de registro es solo de la aplicación; el endpoint de signup de Supabase sigue abierto · **P1** · VERIFICADO en el código / **SOSPECHADO** en la configuración remota

`lib/access.ts:3-5` (`PRIVATE_ACCESS_ONLY !== "false"`, es decir, privado por defecto — bien) se aplica en tres sitios de la app: `app/registro/page.tsx:13`, `app/actions/auth.ts:58` y `lib/auth.ts:44`.

Pero eso solo cierra la puerta de la **UI de Next**. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` está, por definición, en el bundle del navegador (`lib/supabase/client.ts:8`). Si el proyecto Supabase tiene habilitado el signup por email (default de Supabase), cualquiera puede hacer:

```
POST https://<proyecto>.supabase.co/auth/v1/signup
apikey: <publishable key tomada del bundle>
```

obtener un JWT con rol `authenticated` (el trigger `handle_new_user` le crea el perfil con `role='student'`) y **leer directamente por la REST API todo el contenido publicado**: `classes`, `topics`, `study_materials`, `concept_maps`, `flashcards`, `exams`, `exam_questions`, `exam_options`, `transcripts` — porque las políticas `..._select_published_or_admin` conceden lectura a *cualquier* `authenticated`, no solo a los estudiantes autorizados. Nunca necesita pasar por la app.

No puedo comprobar el ajuste del proyecto remoto sin tocarlo (fuera del alcance permitido), por eso lo marco como sospechado en esa mitad. Lo **verificado** es que el repositorio no contiene nada que lo impida: ninguna migración desactiva el signup, y el bloqueo vive únicamente en el código de Next.

**Escenario de fallo concreto:** hoy hay 40 clases publicadas con transcripciones completas, 492 flashcards y 410 reactivos con sus opciones. Cualquier persona con la URL de la app puede extraer todo ese corpus en unos minutos con dos peticiones HTTP.

**Arreglo:** desactivar `Enable email signups` en el dashboard de Supabase mientras `PRIVATE_ACCESS_ONLY` esté activo, y/o cambiar las políticas de lectura a `exists (select 1 from profiles where id = auth.uid() and role in ('admin','student'))` con un flag de autorización explícito en `profiles`.

---

### S4 — Un intento cualquiera devuelve la clave de respuestas completa · **P2** · VERIFICADO

`app/actions/academic.ts:455-466` devuelve al cliente, tras **cualquier** entrega:

```ts
review: keys.map((key) => ({
  questionId, correct, explanation: key.explanation,
  optionExplanations: key.option_explanations as Record<string, string>,
}))
```

`optionExplanations` es el objeto completo `{ "<option_id>": "<explicación>" }` para **todas** las opciones de **todas** las preguntas. `components/exam-player.tsx:71` solo pinta `review.explanation`, pero el objeto entero viaja en la respuesta del Server Action y es visible en la pestaña Red.

Además **no hay límite de intentos**: `academic.ts:424-434` inserta un `exam_attempts` nuevo cada vez, sin comprobar intentos previos.

**Escenario de fallo concreto:** el estudiante responde las 10 preguntas al azar, entrega, lee `review[].correct` y `optionExplanations` en DevTools, recarga y vuelve a entregar con 10/10. El histórico de `exam_attempts` queda inservible como señal de aprendizaje.

Riesgo real bajo hoy (solo la administradora usa la app), pero es exactamente el tipo de cosa que hay que arreglar **antes** de abrir el registro de estudiantes. Mínimo: devolver `explanation` solo de las preguntas falladas y omitir `optionExplanations` de la carga; opcionalmente, cooldown por `exam_id` + `user_id`.

---

### S5 — Las acciones de estudiante aceptan cualquier id existente, incluido contenido en borrador · **P2** · VERIFICADO

- `reviewFlashcardAction` (`academic.ts:298-317`): solo valida el rating por tipo; nunca comprueba que `flashcardId` corresponda a una clase publicada. El `insert` en `flashcard_reviews` pasa RLS porque la política `flashcard_reviews_insert_own` solo exige `user_id = auth.uid()`; la FK solo exige que la flashcard exista.
- `saveStudyProgressAction` (`academic.ts:319-356`) y `saveQuickCheckAction` (`academic.ts:358-382`): validan forma (`Number.isInteger(topicId)`, enums de paso) pero no visibilidad del `topicId`.

**Escenario de fallo concreto (oráculo de enumeración):** un estudiante itera `reviewFlashcardAction(n, "good")` para n = 1..2000. Los ids que devuelven éxito existen; los que devuelven error de FK no. Así deduce cuántas flashcards hay en clases todavía en borrador y el rango de ids del contenido no publicado, aunque no pueda leer su texto. Además ensucia `study_progress` con filas de temas draft, que después inflan el `completedSteps` mostrado en `/sesiones` (`lib/data/academic.ts:370-373`).

**Arreglo:** en las tres acciones, resolver el recurso con el **cliente de estudiante** (`createServerSupabaseClient()`, sujeto a RLS) antes de escribir; si no es visible, rechazar.

---

### S6 — Sin cabeceras de seguridad · **P1** · VERIFICADO

`next.config.ts` está literalmente vacío:

```ts
const nextConfig: NextConfig = {
  /* config options here */
};
```

No hay `headers()`, es decir: sin `Content-Security-Policy`, sin `Strict-Transport-Security`, sin `X-Frame-Options`/`frame-ancestors`, sin `Referrer-Policy`, sin `X-Content-Type-Options`, sin `Permissions-Policy`.

**Escenario de fallo concreto:** la app es embebible en un `<iframe>` de terceros → clickjacking sobre `/administrar/clases/[id]`, donde un clic mal dirigido dispara `updatePublicationStatusAction(classId, "withdrawn")`. `components/publication-controls.tsx:70-120` sí pide confirmación en un modal, lo que mitiga parcialmente, pero `draft` y `review` (líneas 41-47) se ejecutan **sin confirmación**.

---

### S7 — `profiles_update_own` impide a la administradora editar su propio perfil · **P2** · VERIFICADO

`supabase/migrations/20260821020733_editorial_learning_platform.sql:369-372`:

```sql
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and role = 'student');
```

El `with check` evalúa la fila **nueva**. Para un usuario con `role='admin'`, cualquier `UPDATE` (aunque solo cambie `full_name`) produce una fila nueva con `role='admin'` → falla el check. Y no existe ninguna política de update para administradores.

**Escenario de fallo concreto:** cuando se agregue "editar mi nombre" (hoy `full_name` viene de `raw_user_meta_data` y se muestra en `components/app-shell.tsx:265` y `home-dashboard.tsx:59`), el guardado fallará **solo para la administradora**, con un error genérico. Corrección: `with check ((select auth.uid()) = id and role = (select role from public.profiles where id = auth.uid()))` o una política separada.

---

### S8 — Auto-promoción a admin por variable de entorno, ejecutada en cada render · **P2** · VERIFICADO

`lib/auth.ts:30-42`: si `ADMIN_EMAIL` coincide con el email del usuario y su rol no es admin, se ejecuta un `UPDATE` con el **cliente service-role** desde `getCurrentUser()`, que se invoca en `app/layout.tsx:32` — o sea, en **todo** render de página.

No es explotable por sí solo (el email viene de `auth.getUser()`, verificado contra Supabase), pero: (a) es un efecto de escritura dentro de un render de GET; (b) si el `UPDATE` falla se reintenta indefinidamente en cada request sin log visible más allá del silencio (`if (!promotionError) role = "admin"`, sin `else`); (c) un error tipográfico en `ADMIN_EMAIL` en producción convierte a cualquier cuenta con ese correo en administradora. Debería ser un script de bootstrap, no lógica de request.

---

### IDOR — evaluación

**No encontré IDOR explotable de lectura.** Un punto merece nota defensiva: `lib/data/academic.ts:461-472`, `getStudyProgress(topicId)`, consulta `study_progress` **sin filtrar por `user_id`** y remata con `.maybeSingle()`. Hoy es seguro porque `study_progress_select_own` (migración `20260821020758:52-54`) restringe a `auth.uid() = user_id`, y `scripts/test-rls.ts:252-260` lo verifica. Pero es frágil por dos motivos: (1) si esa política se relajara alguna vez, la función devolvería el progreso de otro usuario sin ningún cambio de código; (2) `.maybeSingle()` **lanza error** si RLS devolviera >1 fila, degradando la lección en vez de fallar seguro. Añadir `.eq("user_id", user.id)` es defensa en profundidad de una línea. **P2.**

---

## 3. CORRECCIÓN

### C1 — Las clases nuevas nunca aparecerán en `/sesiones` · **P0** · VERIFICADO

`scripts/import-content.ts:47-60` inserta en `classes` **sin** `curriculum_code` ni `curriculum_order`. Esas dos columnas solo se poblaron con un `UPDATE` puntual dentro de la migración `20260821021153_add_curriculum_session_metadata.sql:45-48`:

```sql
update public.classes as c
set curriculum_order = (c.id - 9)::integer, curriculum_code = 'C' || lpad((c.id - 9)::text, 2, '0')
where c.id between 10 and 49;
```

Exactamente 40 clases (ids 10..49), que coinciden con las 40 publicadas hoy.

Y las dos consultas que alimentan la ruta de estudio filtran por esa columna:
- `lib/data/academic.ts:339` — `getPublishedSessions`: `.not("curriculum_order", "is", null)`
- `lib/data/academic.ts:386` — `getPublishedSessionNeighbors`: idem.

**Escenario de fallo concreto:** se produce e importa la clase 41 (`content:import`), se aprueba y se publica desde `/administrar/clases/50`. La clase aparece en `/materias/[subjectId]` y en `/buscar`, pero **`/sesiones` sigue mostrando "40 clases publicadas" contra la meta 58** (`app/sesiones/page.tsx:55-56`), y `getPublishedSessionNeighbors` nunca la enlaza como anterior/siguiente. La administradora no tiene ninguna UI para asignar `curriculum_code`/`curriculum_order` (`components/class-details-form.tsx` solo edita título y descripción; `components/publication-controls.tsx` solo el estado). Hace falta entrar al SQL editor de Supabase por cada clase.

Además, `class_audio_sources` se pobló con un `INSERT` literal en la misma migración (líneas 50-67) y el importador tampoco escribe esa tabla → las clases nuevas mostrarán "Sin audio asignado" (`app/sesiones/page.tsx:74`).

**Este es el hallazgo que más directamente bloquea las 18 clases pendientes.**

**Arreglo:** añadir `curriculumCode` / `curriculumOrder` / `audioSources` al esquema del paquete (`lib/content/package-schema.ts`) y escribirlos en `scripts/import-content.ts`; alternativamente, un campo editable en `class-details-form.tsx` + acción `requireAdmin`.

---

### C2 — Los 41 paquetes de contenido dependen de rutas absolutas de un disco externo · **P0** · VERIFICADO

Analicé los 41 JSON de `content/packages/`. **Los 41** referencian transcripciones por ruta absoluta de Windows en la unidad `F:`. Ejemplo real (`content/packages/audio-20-organismos-descentralizados.json`):

```json
"transcript": {
  "originalFiles": ["F:\\TRANSCRIPCIONES CENEVAL\\AUDIO 20.txt",
                    "F:\\TRANSCRIPCIONES CENEVAL\\AUDIO 22.txt"],
  ...
}
```

`lib/content/load-package.ts:34` y `:45-48` hacen `readFile(resolve(sourcePath))` sobre esas rutas. Cero paquetes traen el transcript en línea.

**Escenario de fallo concreto:** `npm run content:check -- content/packages/audio-20-...json` y `npm run content:import` fallan con `ENOENT` en cualquier máquina que no sea la de la propietaria con la unidad `F:` montada. Consecuencias directas: (a) es imposible montar CI que valide los paquetes; (b) si `F:` se pierde o se renombra, las transcripciones ya importadas no se pueden reimportar ni auditar; (c) nadie más puede colaborar en la producción de las 18 clases restantes.

Nota secundaria (P2): `load-package.ts:26/34/46` hace `resolve()` de rutas que vienen de un JSON, sin restringirlas a una raíz. Es un script local, no una superficie de ataque real, pero convendría anclar todo bajo `content/`.

**Arreglo:** copiar los `.txt` a `content/transcripts/` (versionados o vía Git LFS) y usar rutas relativas al repo, validando en el esquema que empiecen por `content/`.

---

### C3 — Tope de transcripción de 50 000 en la app vs 200 000 en la base · **P1** · VERIFICADO

Tres sitios en desacuerdo:

| Sitio | Límite |
|---|---|
| `supabase/migrations/20260821020940_expand_transcript_length.sql:6` | `char_length(original_text) <= 200000` |
| `lib/content/package-schema.ts:154` | `.max(200000)` |
| `app/actions/academic.ts:153` | `if (originalText.length > 50000) return { error: ... }` |
| `components/transcript-workspace.tsx:14` + `:205` | `MAX_TRANSCRIPT_LENGTH = 50000`, `maxLength={50000}` en el `<textarea>` |

La migración de agosto amplió el límite en la base pero nadie actualizó la acción ni la UI.

**Escenario de fallo concreto (silencioso, que es lo peor):** la administradora pega una transcripción de 62 000 caracteres de una de las 18 clases pendientes en `/clases/[id]/transcripcion`. El atributo HTML `maxLength` **trunca en 50 000 sin mostrar ningún error** — el contador de `transcript-workspace.tsx:229` marcará "50,000 / 50,000" y el botón guardará tan campante. Se pierden 12 000 caracteres de la clase, y como `transcripts.class_id` es `unique` (migración inicial, línea 43) y `saveTranscriptAction` solo hace `insert` (nunca `update`), **no hay forma de corregirlo desde la app**: reintentar da "Esta clase ya tiene una transcripción original" (`academic.ts:167-169`).

**Arreglo:** centralizar el límite en una constante compartida a 200 000 y añadir una acción de actualización de transcripción para admin.

---

### C4 — `transcript.cleaned` de los paquetes no es una transcripción limpia, es una nota editorial · **P1** · VERIFICADO

Los 41 paquetes traen un campo `transcript.cleaned` de **1 095 caracteres de promedio** (máximo 1 518), mientras que el original ronda decenas de miles. Su contenido no es transcripción; es metodología. Muestra literal del inicio de `audio-20-organismos-descentralizados.json`:

> "El Audio 20 aporta la explicación principal de descentralización... Se eliminaron anuncios, examen dictado, datos personales, propaganda, lenguaje ofensivo y opiniones políticas. Se corrigió que no toda entidad paraestatal es organismo descentralizado..."

`lib/content/load-package.ts:55` prefiere ese valor sobre `cleanTranscript(original)` (`packageFile.transcript.cleaned ?? cleanTranscript(original)`), y `scripts/import-content.ts:67` lo escribe en `transcripts.cleaned_text`. El esquema lo acepta porque solo exige `min(30).max(200000)` (`package-schema.ts:155`).

**Escenario de fallo concreto:** en `/clases/[id]/transcripcion`, la administradora pulsa la pestaña "Versión limpia" (`components/transcript-workspace.tsx:139-157`), que promete el texto de la clase depurado, y en su lugar recibe un párrafo describiendo qué se eliminó. Aplica a las 40 clases publicadas. La función `cleanTranscript()` (`load-package.ts:14-23`), que sí quita los banners de TurboScribe y normaliza saltos, **nunca se ejecuta en la práctica**.

**Arreglo:** renombrar el campo a `editorialNote` (nueva columna `transcripts.editorial_note`) y dejar que `cleaned_text` lo genere `cleanTranscript()`.

---

### C5 — `ExamPlayer` revienta si el examen no tiene preguntas · **P1** · VERIFICADO por lectura

`lib/data/academic.ts:559-576` construye `exam` como objeto no nulo en cuanto existe una fila en `exams` con `is_current`, aunque `questions` quede `[]`.
`components/lesson-view.tsx:487` renderiza `<ExamPlayer exam={lesson.exam} />` con la sola condición `lesson.exam` truthy.
`components/exam-player.tsx:81` → `const currentQuestion = exam.questions[questionIndex];` → `undefined`.
`components/exam-player.tsx:108` → `difficultyLabel[currentQuestion.difficulty]` → **`TypeError: Cannot read properties of undefined`**.

No lo detecta TypeScript porque `tsconfig.json` no tiene `noUncheckedIndexedAccess`.

**Escenario de fallo concreto:** durante la producción de una de las 18 clases pendientes, `scripts/import-content.ts` falla a mitad del bucle de preguntas (`import-content.ts:161-205`, por ejemplo por el `throw new Error("No se encontró la opción correcta.")` de la línea 188 o un timeout de red). El `catch` de la línea 211 borra la clase... **salvo que el fallo ocurra después de crear la clase pero el `delete` de la línea 213 también falle** (su error nunca se comprueba). Queda un `exams` sin `exam_questions`. La administradora entra a `/temas/<id>` para previsualizar, llega al paso "Comprueba" y la página entera se cae con un error de cliente sin recuperación (ver C6: no hay `error.tsx`).

**Arreglo:** `if (!exam.questions.length) return <p>El examen está pendiente.</p>` al inicio de `ExamPlayer`, y `exam: questions.length ? {...} : null` en la capa de datos.

---

### C6 — Ni un solo `error.tsx`, `not-found.tsx`, `loading.tsx` ni `Suspense` en toda la app · **P1** · VERIFICADO

```
find app -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx" -o -name "global-error.tsx"
→ (vacío)
grep -rn "Suspense|notFound()" app components → (vacío)
```

Tres consecuencias medibles:

1. **Cualquier fallo de Supabase tumba la página sin recuperación.** `lib/data/academic.ts:179-182` (`fail()`) hace `throw new Error("No pudimos consultar los datos...")`. Sin `error.tsx`, en producción el usuario ve la pantalla genérica de Next ("Application error: a server-side exception has occurred") sin botón de reintento y sin navegación. Ocurre con un simple timeout del pooler de Supabase.
2. **Los 404 devuelven HTTP 200.** `components/class-detail.tsx:19-31`, `components/topic-detail.tsx:11-23`, `components/subject-detail.tsx:13-22`, `app/clases/[classId]/temas/page.tsx:28` y `app/administrar/clases/[classId]/page.tsx:25-27` devuelven JSX de "no encontrado" con estado 200 en vez de llamar a `notFound()`. Recursos inexistentes quedan indexables y cacheables como si existieran.
3. **Cero estados de carga.** Toda navegación bloquea hasta que termina el render completo del servidor. En `/administrar` eso son 48 viajes a Supabase (ver R1) sin ningún esqueleto: la app parece congelada.

---

### C7 — `Number(param)` sin validar produce 500 en vez de 404 · **P1** · VERIFICADO

`app/materias/[subjectId]/page.tsx:14`, `app/clases/[classId]/page.tsx:15`, `app/temas/[topicId]/page.tsx:17`, `app/clases/[classId]/temas/page.tsx:22`, `app/clases/[classId]/transcripcion/page.tsx:24`, `app/administrar/clases/[classId]/page.tsx:18` — todos hacen `Number(x)` sin comprobar.

**Escenario de fallo concreto:** un bot o un enlace roto pide `/clases/abc`. `Number("abc")` = `NaN` → `supabase.from("classes").select(...).eq("id", NaN)` (`lib/data/academic.ts:306`) → PostgREST responde `22P02 invalid input syntax for type bigint: "NaN"` → `fail("getClass", ...)` lanza → sin `error.tsx` (C6) el resultado es un **500** en logs y en la respuesta, en lugar del 404 correcto. Se repite en las 6 rutas dinámicas.

**Arreglo:** helper compartido `parseId(x)` que devuelva `null` y llame a `notFound()`.

---

### C8 — El importador no es idempotente y su rollback deja huérfanos · **P1** · VERIFICADO

`scripts/import-content.ts`:

- Ninguna restricción impide crear dos clases con el mismo título (la migración inicial solo tiene `subjects_normalized_name_idx` único sobre el nombre de la materia). **Reejecutar el mismo paquete crea una clase duplicada completa** con sus 9 materiales, mapa, 12 flashcards y 10 reactivos.
- El `catch` de la línea 211 solo borra `classes` (línea 213) y **no comprueba el error del delete**. Si el fallo ocurrió después de crear una materia nueva (líneas 34-45), esa materia queda huérfana. Los `legal_references` upserteados (líneas 113-128) también permanecen.
- No hay transacción; el "rollback" es un mejor-esfuerzo desde el cliente.

**Escenario de fallo concreto:** la administradora ejecuta `content:import` para la clase 41, la red se corta durante el `insert` de flashcards (línea 139). El delete de rollback también falla por la misma red. Ahora hay una clase 50 a medias en `draft`. Ella reintenta el mismo comando: se crea la clase 51, y la 50 queda como basura invisible que además suma al contador de `/administrar` (`app/administrar/page.tsx:38`).

**Arreglo:** clave natural única (`curriculum_code` ya lo es: `classes_curriculum_code_idx`) + upsert idempotente, o una función RPC transaccional en Postgres.

---

### C9 — `Promise.all([requireUser(), getDatos()])`: la redirección compite con el error de datos · **P2** · VERIFICADO

`components/subjects-list.tsx:7`, `components/subject-detail.tsx:7-11`, `components/home-dashboard.tsx:8`, `app/sesiones/page.tsx:15`.

`requireUser()` lanza `NEXT_REDIRECT` para mandar a `/iniciar-sesion`, pero las consultas de datos **ya se dispararon** en paralelo. Para una petición sin sesión, el cliente RLS actúa como `anon`, que no tiene `grant` sobre `subjects` (migración inicial, líneas 122-125) → PostgREST devuelve "permission denied" → `fail()` lanza. `Promise.all` rechaza con **la primera** de las dos.

**Escenario de fallo concreto:** una sesión expira mientras la usuaria tiene la pestaña abierta; pulsa "Biblioteca". Si `getSubjects()` rechaza antes que `requireUser()`, en lugar de ir a la pantalla de login ve la pantalla de error genérica (C6) y queda atrapada. Es un fallo intermitente y por eso difícil de reportar.

**Arreglo:** `const user = await requireUser();` **antes** del `Promise.all` de datos. La autorización debe ser una compuerta, no una carrera.

---

### C10 — Errores tragados sin ninguna señal al usuario · **P2** · VERIFICADO

- `components/flashcards-deck.tsx:70` — `await reviewFlashcardAction(card.id, value);` **descarta el retorno**. Si la acción devuelve `{ error }` (`academic.ts:314`), la UI avanza a la siguiente tarjeta y al final muestra "Repaso completado" como si todo se hubiera guardado. La usuaria pierde el repaso sin enterarse.
- `components/home-dashboard.tsx:10-27` — `attempts`, `progressResult` y `checksResult` nunca comprueban `.error`. Si `exam_attempts` falla, `totalAnswers` queda en 0 y el panel muestra **"Comprensión en exámenes: Por comenzar"** a alguien que lleva 20 exámenes hechos. Un fallo de base de datos se presenta como un dato real.
- `app/estudiar/page.tsx:11-37` — mismo patrón: se desestructura `{ data }` sin `error` en las cuatro consultas. Un fallo se ve como "no hay temas disponibles".
- `lib/data/academic.ts:474-478` — `getStudyProgress` degrada silenciosamente a `null` con un `console.warn`. El comentario dice que es para tolerar una migración sin aplicar, pero eso hace que un fallo real de RLS se manifieste como "pierdo mi progreso cada vez".

---

### C11 — Condición de carrera al crear temas · **P2** · VERIFICADO

`app/actions/academic.ts:188-206`: `count` de temas de la clase y después `position: (count ?? 0) + 1`. No es atómico y `topics_class_position_unique` (migración inicial, línea 82) sí lo es.

**Escenario de fallo concreto:** dos pestañas de `/clases/12/temas` abiertas; se pulsa "Guardar tema" casi a la vez. Ambas leen `count = 3`, ambas intentan `position = 4`, la segunda choca con `23505` y `databaseError` muestra "No pudimos guardar los cambios. Intenta nuevamente." sin explicar nada. Además `components/topics-review.tsx:73-89` (`changeTopicStatus`) no tiene estado de "pendiente" ni deshabilita el botón, así que un doble clic dispara dos acciones.

**Arreglo:** calcular la posición en SQL (`coalesce(max(position),0)+1`) dentro de un RPC, o reintentar ante `23505`.

---

### C12 — `ilike` con comodines sin escapar en el importador · **P2** · VERIFICADO

`scripts/import-content.ts:26-30`: `.ilike("name", bundle.subject.name).maybeSingle()`. `ilike` interpreta `%` y `_` del argumento como comodines.

**Escenario de fallo concreto:** un paquete futuro con materia `"Derecho Fiscal_Avanzado"`; el `_` casa con cualquier carácter. Si existiera además `"Derecho Fiscal Avanzado"`, la consulta devolvería 2 filas y `.maybeSingle()` **falla con error**, abortando la importación con un mensaje incomprensible. Hoy hay 15 materias distintas y ninguna contiene comodines, pero es una trampa latente. Debe ser `.eq()` sobre el nombre normalizado (ya existe `subjects_normalized_name_idx` sobre `lower(btrim(name))`).

---

### C13 — Revalidación de caché tras mutaciones · **P2** · CORRECCIÓN DEL DIAGNÓSTICO HABITUAL

Superficialmente parece que faltan `revalidatePath`: `updatePublicationStatusAction` (`academic.ts:291-294`) revalida `/`, `/materias`, `/administrar` y `/clases/[id]`, pero **no** `/sesiones` ni `/materias/[subjectId]` (en Next, `revalidatePath("/materias")` no cubre las rutas hijas dinámicas).

Sin embargo, **en la práctica esas llamadas son casi irrelevantes**: toda la capa de datos abre con `await connection()` (`lib/data/academic.ts:214, 258, 299, 331, 381, 399, 420, 441, 465`) y además usa `cookies()` a través de `createServerSupabaseClient`. Según `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/connection.md`, eso excluye por completo del prerender: **cada petición se renderiza dinámicamente y no hay nada cacheado que invalidar**. `cacheComponents` no está activado en `next.config.ts`.

Conclusión honesta: no hay bug de "caché obsoleta", hay un problema de **rendimiento por ausencia total de caché** (ver R4). Los `revalidatePath` son ruido que da falsa sensación de estrategia de caché.

---

## 4. ARQUITECTURA Y MANTENIBILIDAD

### A1 — Sin tipos generados de Supabase: 54 casts manuales · **P1** · VERIFICADO

`grep -rn "as number\|as string" app lib components` → **54 ocurrencias**, 52 de ellas concentradas en `lib/data/academic.ts`. Los clientes se crean como `createServerClient(url, key, ...)` y `createClient(url, secret, ...)` sin el genérico `<Database>`, así que todo vuelve como `any` implícito y el código lo "arregla" a mano:

```ts
// lib/data/academic.ts:409-415
id: data.id as number,
classId: data.class_id as number,
originalText: data.original_text as string,
status: data.processing_status as Transcript["status"],
```

**Riesgo concreto:** un `alter table ... rename column` en una migración futura **no rompe la compilación**; se manifiesta en runtime como `undefined` renderizado en pantalla. Con 18 clases más por producir y un esquema todavía en evolución (ya van 7 migraciones, 3 de ellas alterando `classes`), esto es el mayor multiplicador de riesgo de la base de código.

**Arreglo:** `supabase gen types typescript` → `lib/supabase/database.types.ts`, y tipar los tres clientes. Elimina de golpe los 54 casts y las ~30 aserciones de enum (`as Topic["sourceType"]`, `as ExamQuestion["difficulty"]`, etc.).

---

### A2 — `getLessonBundle` crea seis clientes Supabase para una lección · **P2** · VERIFICADO

`lib/data/academic.ts:496-527`: dentro del `Promise.all` hay seis `(await createServerSupabaseClient())` distintos, y en la línea 542 se crea un séptimo. Cada uno vuelve a leer el cookie store y a instanciar el cliente. Debería crearse una vez y reutilizarse.

### A3 — `lesson-view.tsx`: 514 líneas y cinco responsabilidades en un `"use client"` · **P1** · VERIFICADO

`components/lesson-view.tsx` es a la vez: máquina de estados de 5 pasos, renderizador de materiales, visor de transcripción y referencias, host de la comprobación rápida, y orquestador de persistencia. Contiene cinco bloques `activeStep === "..." ? ... : null` de hasta 100 líneas. Ningún paso está separado en componente. Es el archivo donde cualquier cambio tiene más probabilidad de romper algo no relacionado — y no hay pruebas.

### A4 — Zod existe pero no se usa en el límite de confianza · **P1** · VERIFICADO

`lib/content/package-schema.ts` (183 líneas) es un uso ejemplar de Zod... sobre archivos JSON locales que escribe la propia administradora. En cambio, **los Server Actions —que sí reciben entrada de red no confiable— no usan Zod en absoluto**: validan a mano con `typeof value === "string"` (`academic.ts:30-33`), comparaciones de `length` y `Number.isInteger`. Y `submitExamAction` (S2) directamente no valida el payload estructurado. La inversión de esfuerzo está al revés.

### A5 — Reglas de longitud duplicadas en tres capas sin fuente única · **P2** · VERIFICADO

Ejemplo del título de clase: `maxLength={120}` (`class-details-form.tsx:62`), `if (title.length > 120)` (`academic.ts:116`), `classes_title_length check (char_length(title) <= 120)` (migración inicial, línea 30), `z.string().max(120)` (`package-schema.ts:145`). Cuatro sitios. C3 demuestra que ya se desincronizaron: la transcripción cambió en la base y en el esquema Zod, pero no en la acción ni en la UI.

### A6 — `AppShell` marca `"use client"` en toda la envoltura de la app solo por `usePathname()` · **P2** · VERIFICADO

`components/app-shell.tsx:154` es `"use client"` y `app/layout.tsx:40` lo usa como envoltura de todo. Los `children` siguen siendo Server Components (se pasan como props), así que no es un error de corrección; pero `app-shell.tsx` + `icons.tsx` + `next/navigation` van al bundle de cada página solo para resaltar el enlace activo. Se resuelve extrayendo un `<NavLink>` cliente de ~15 líneas y dejando el resto en servidor.

### A7 — `tsconfig.json` sin las opciones que habrían atrapado C5 · **P2** · VERIFICADO

`strict: true` está activo (bien), pero falta `noUncheckedIndexedAccess` (habría marcado `exam.questions[questionIndex]` como posiblemente `undefined` → C5) y `exactOptionalPropertyTypes`. `target: "ES2017"` es innecesariamente bajo para el soporte de navegadores que declara Next 16 (Chrome/Edge/Firefox 111+, Safari 16.4+).

### A8 — Acoplamiento de la capa de datos · **P2**

`lib/data/academic.ts` mezcla tres cosas: mapeo fila→dominio (`toClass`), política de render (`connection()`) y manejo de errores con mensajes en español para el usuario final (`fail()`, línea 181). El resultado: no se puede probar el mapeo sin arrastrar el runtime de Next (`next/server`) ni un cookie store. Ese acoplamiento es la razón principal de que hoy no haya pruebas unitarias posibles (ver sección 5).

---

## 5. PRUEBAS Y CI

### Corrección del punto de partida

El enunciado dice que "no existe ninguna suite de pruebas". **Eso es inexacto y conviene aclararlo:** `scripts/test-rls.ts` son 484 líneas con **20 aserciones de integración reales** sobre RLS (anónimo bloqueado, draft/review/withdrawn ocultos para estudiantes, aislamiento de `study_progress`, `flashcard_reviews`, `exam_attempts`, `exam_answers`, claves de respuesta inaccesibles, estudiante sin poder cambiar estado editorial, perfiles aislados). Es trabajo serio y cubre precisamente la parte de mayor riesgo.

**Pero tiene un problema grave que lo hace inutilizable como red de seguridad · P1 · VERIFICADO:**

- Corre contra el **proyecto Supabase remoto de producción** (`scripts/test-rls.ts:15-32` lee `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY`; el script npm es `tsx --env-file=.env.local`).
- **Crea tres usuarios reales** vía `auth.admin.createUser` (líneas 55-82) y **inserta una clase real** en la materia de una clase publicada (líneas 110-122).
- **Publica y retira esa clase temporal** (líneas 176-198): durante unos segundos existe una clase basura visible para cualquier estudiante.
- `check()` **lanza en el primer fallo** (línea 40), así que las aserciones posteriores nunca corren: un fallo temprano oculta todo lo demás.
- Si el proceso muere entre la creación y `cleanup()` (líneas 306-329) quedan usuarios y una clase huérfanos en producción.
- Depende de que exista al menos una clase publicada con temas, flashcards y examen (`.single()` en las líneas 102-108, 223-229, 249-253, 300-306): si eso cambia, la suite falla por motivos que nada tienen que ver con RLS.

### Riesgo real dadas las 18 clases pendientes

Alto y creciente. Los hallazgos C1 (metadatos de currículo), C3 (truncado de transcripción), C4 (versión limpia falsa), C5 (examen vacío) y C8 (importador no idempotente) **son todos fallos del pipeline de contenido**, que es exactamente el trabajo que queda por hacer 18 veces más. Ninguno de ellos tiene hoy una prueba que lo detecte, y `lint` + `tsc` pasan limpios con todos ellos presentes — o sea, las herramientas actuales dan una señal verde falsa.

### Conjunto mínimo viable de pruebas (propuesta concreta)

**Framework:** **Vitest** + `@vitest/coverage-v8`. Motivo: cero configuración con TypeScript/ESM (el repo ya usa `tsx`), arranque en milisegundos, y no arrastra el runtime de Next. No propongo Jest (config pesada con ESM) ni Playwright todavía (el coste de mantenimiento no se justifica para una app de una usuaria).

```
npm i -D vitest @vitest/coverage-v8
```

**Nivel 1 — Unitarias puras, sin red ni base de datos (~2 h de trabajo, cubren C1/C3/C4/C12 y el pipeline entero):**

| Archivo nuevo | Qué prueba | Hallazgo que atrapa |
|---|---|---|
| `lib/content/package-schema.test.ts` | Que los **41 JSON reales** de `content/packages/` pasen `classPackageFileSchema`; que un paquete al que le falte un tipo de material, tenga 9 flashcards o 11 reactivos sea rechazado; que `originalFile`+`originalFiles` simultáneos fallen. | Regresión al producir las 18 restantes |
| `lib/content/load-package.test.ts` | `cleanTranscript()` con banners de TurboScribe, `\r\n`, tabs y 4+ saltos; y que rutas absolutas fuera de `content/` sean rechazadas. | C2, C4 |
| `lib/content/limits.test.ts` (tras extraer las constantes) | Que el tope de transcripción de la acción, de la UI y del esquema Zod sea **el mismo número**. | **C3** |
| `app/auth/confirm/safe-next.test.ts` (tras exportar `safeNext`) | `/\evil.com`, `//evil.com`, `/\\evil.com`, `%2f%2fevil.com`, `/ok` → solo el último debe pasar. | **S1** |
| `app/actions/exam-grading.test.ts` (tras extraer la calificación pura de `submitExamAction`) | Opción que no pertenece a la pregunta → rechazo; respuestas incompletas → rechazo; strings numéricos → rechazo o coerción consistente. | **S2** |

**Nivel 2 — Contrato del importador contra Postgres local (~4 h, cubre C1/C5/C8):**

Levantar `supabase start` (stack local en Docker) y correr `scripts/import-content.ts` contra él, no contra remoto:

| Prueba | Hallazgo |
|---|---|
| Importar un paquete de fixture y verificar que la clase resultante tiene `curriculum_code` y `curriculum_order` no nulos y aparece en `getPublishedSessions` | **C1 (P0)** |
| Importar el mismo paquete dos veces → debe fallar o ser idempotente, nunca duplicar | **C8** |
| Cortar el importador a mitad (inyectar error tras crear el examen) → no debe quedar `exams` sin `exam_questions` | **C5** |

**Nivel 3 — Portar `test-rls.ts` al stack local (~1 h, elimina el riesgo P1):**

Cambiar únicamente las variables de entorno para que apunte a `supabase start` en vez de remoto, y añadir un *seed* determinista (`supabase/seed.sql`) con una clase publicada, un tema, flashcards y un examen. Esto convierte una suite peligrosa en una suite ejecutable en CI. Cambiar además `check()` para **acumular** fallos en vez de lanzar al primero.

**CI (GitHub Actions, ~30 líneas):**

```yaml
on: [push, pull_request]
jobs:
  verify:
    steps:
      - npm ci
      - npm run lint
      - npx tsc --noEmit
      - npx vitest run                    # Niveles 1
      - supabase db start && npm run test:integration   # Niveles 2 y 3
      - npm run build                     # detecta errores de tipos de rutas
```

**Nota importante:** `tsconfig.json` incluye `.next/types/**/*.ts` y `.next/dev/types/**/*.ts`. Como nunca corrí `next build`, `tsc --noEmit` **no validó los tipos generados de rutas**. Añadir `npm run build` a CI cubre ese hueco. No lo ejecuté aquí por la restricción de tiempo del encargo.

---

## 6. RENDIMIENTO

Proyección para 58 clases, ~700 flashcards y ~580 reactivos. Datos medidos hoy sobre `content/packages/`: 41 paquetes, 15 materias distintas, 41 temas, **492 flashcards**, **410 reactivos**.

### R1 — `/administrar`: 48 viajes a Supabase, 30 de ellos escaneos de tabla completa · **P1** · VERIFICADO

`app/administrar/page.tsx:9-15`:

```ts
const subjects = await getSubjects();                              // 3 consultas
const groups = await Promise.all(
  subjects.map(async (subject) => ({ subject,
    classes: await getClassesForSubject(subject.id) })));          // 3 × 15 = 45
```

Y `getClassesForSubject` (`lib/data/academic.ts:260-271`) lee, **por cada materia**:

```ts
supabase.from("transcripts").select("class_id"),   // ← TODA la tabla, sin .eq
supabase.from("topics").select("class_id"),        // ← TODA la tabla, sin .eq
```

Con 15 materias: **48 round-trips**, de los cuales **15 leen la tabla `transcripts` completa y 15 la tabla `topics` completa**, para después filtrar en JavaScript (`academic.ts:291`, filtro lineal dentro de un `map` → O(clases × temas)). Combinado con C6 (sin `loading.tsx`), la usuaria mira una pantalla en blanco todo ese tiempo.

**Arreglo:** una sola consulta con joins anidados de PostgREST, o `count` agregado (`select("id", { count: "exact", head: true })`).

### R2 — `getSubjects()` lee todas las clases y todos los temas para mostrar dos números · **P1** · VERIFICADO

`lib/data/academic.ts:216-249`: `select("id,subject_id")` sobre `classes` completa + `select("class_id")` sobre `topics` completa, y luego `filter()` anidado por materia (líneas 237-248) → O(materias × clases + materias × temas). Se invoca en `/` (`home-dashboard.tsx:8`), `/materias` (`subjects-list.tsx:7`), `/materias/[id]` (vía `getSubject`, línea 253), `/administrar` y **dentro de `getLessonBundle`** (`academic.ts:536`). Es decir: **abrir una lección dispara un escaneo completo de `classes` y `topics`**.

### R3 — `LessonView` es un componente de cliente que recibe la transcripción completa · **P1** · VERIFICADO

`components/topic-detail.tsx:62` pasa el `LessonBundle` entero a `<LessonView>`, que es `"use client"` (`lesson-view.tsx:1`). Ese bundle incluye `transcript.originalText` (`lib/data/academic.ts:411`), que la base permite hasta **200 000 caracteres**. Todo eso se serializa en la carga RSC de **cada visita** a `/temas/[id]`, aunque el texto solo se muestre si la usuaria pulsa "Consultar transcripción y fuentes jurídicas" (`lesson-view.tsx:507`). Se suman 9 materiales (~8 200 caracteres medidos en un paquete real), 12 flashcards con respuesta y 10 reactivos con sus opciones.

**Estimación:** entre 60 KB y 250 KB de payload por lección, sin comprimir, en cada navegación. Es la ruta que más van a usar las estudiantes.

**Arreglo:** dejar `transcript` fuera del bundle y cargarlo bajo demanda (Server Component en un `<Suspense>` o ruta hija `/temas/[id]/fuentes`).

### R4 — Cero caché en toda la aplicación · **P1** · VERIFICADO

Las nueve funciones de `lib/data/academic.ts` abren con `await connection()`, que según `connection.md` "excluye del prerender". Además todas usan `cookies()`. `cacheComponents` no está en `next.config.ts`. Resultado: **ningún dato se cachea jamás**, ni siquiera el catálogo de materias y clases, que cambia como mucho una vez por semana. Cada visita de cada usuaria paga la latencia completa a Supabase.

Es especialmente ineficiente porque el 95 % del contenido (materias, clases publicadas, temas, materiales, flashcards, reactivos) es **idéntico para todos los usuarios y prácticamente inmutable**. Lo único por usuario es progreso, revisiones e intentos.

**Arreglo:** separar la capa de datos en "contenido público cacheable" (con `cacheLife`/`cacheTag` — estables en v16 — invalidado por `updateTag` en `updatePublicationStatusAction`) y "datos del usuario" (dinámicos). Es el cambio de rendimiento con mejor relación esfuerzo/beneficio de toda esta lista.

### R5 — Riesgo de límite de filas de PostgREST en la validación de publicación · **P1** · **SOSPECHADO**

`app/actions/academic.ts:239-252`, dentro de `updatePublicationStatusAction`, para validar **una** clase consulta **sin filtro alguno por clase**:

```ts
admin.from("study_materials").select("topic_id,material_type").eq("is_current", true),
admin.from("concept_maps").select("topic_id").eq("is_current", true),
admin.from("flashcards").select("topic_id"),          // ← toda la tabla
admin.from("exams").select("topic_id").eq("is_current", true),
```

Dos problemas, uno seguro y uno sospechado:

- **Verificado:** son cuatro escaneos completos por cada pulsación de "Publicar clase", y el chequeo de completitud (líneas 254-267) hace un `filter` lineal dentro de un `every` → O(temas × filas).
- **Sospechado (no lo pude confirmar sin consultar el proyecto remoto, lo cual está fuera de alcance):** los proyectos Supabase alojados aplican por defecto un tope de **1 000 filas** por respuesta (`db-max-rows`). Si ese tope está activo, en cuanto `flashcards` supere las 1 000 filas —hoy son 492, y a 58 clases serán ~700, pero un solo tema extra por clase lo dispara— la consulta devolverá **solo las primeras 1 000 filas sin error ni aviso**, la comprobación `cards.filter(...).length >= 10` fallará para los temas de mayor id, y `updatePublicationStatusAction` devolverá **"La clase aún no tiene un paquete completo por cada tema aprobado."** para clases perfectamente completas. Un bug imposible de diagnosticar desde la UI.

**Arreglo (vale la pena aunque el tope no exista):** filtrar por los `topicIds` de la clase con `.in("topic_id", topicIds)` en las cuatro consultas. Reduce el coste en varios órdenes de magnitud y elimina el riesgo de truncado de raíz.

### R6 — Búsqueda con `ilike '%q%'`: seq scan garantizado · **P2** · VERIFICADO

`app/buscar/page.tsx:21`: `.ilike("title", `%${query}%`)`. Ningún índice de Postgres puede servir un patrón con comodín inicial sin `pg_trgm` + índice GIN, y ninguna de las 7 migraciones crea la extensión ni el índice. Con ~58 temas hoy da igual; el problema real es distinto: la búsqueda **solo mira `topics.title`** e ignora `study_materials.content`, `flashcards.question` y las transcripciones, que es donde vive el 99 % del contenido. Como funcionalidad, está incompleta más que lenta.

### R7 — Imagen de 1.2 MB sin usar y assets del starter · **P2** · VERIFICADO

```
public/images/concept-maps/poder-ejecutivo-apf.png   1 255 874 bytes
```

`grep -rn "poder-ejecutivo-apf|concept-maps|/images"` sobre `app`, `components`, `lib`, `content`, `docs`, `scripts` → **cero referencias**. Tampoco hay ningún `next/image` ni `<img>` en toda la app (los mapas conceptuales se renderizan como divs de Tailwind en `components/concept-map.tsx`). Ese PNG es 1.2 MB que se despliega en cada deploy sin ninguna función. Se acompaña de `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`, todos del template inicial y todos sin usar.

Consecuencia positiva del hallazgo: **no hay ningún problema de imágenes sin optimizar**, porque no hay imágenes en uso. Si más adelante se añaden mapas conceptuales como imagen, habrá que configurar `images` en `next.config.ts` teniendo en cuenta los cambios de v16 (`qualities` ahora por defecto `[75]`, `minimumCacheTTL` 4 h, `imageSizes` sin el 16).

### R8 — Detalle bien resuelto

`app/sesiones/page.tsx:64` ya aplica `[content-visibility:auto]` a las tarjetas de sesión, lo que evita el coste de layout de 58 tarjetas fuera de pantalla. Buena decisión, digna de replicarse en `/materias`.

---

## 7. VERIFICACIÓN — salida real de las herramientas

**Nota previa importante:** el worktree **no tenía `node_modules`** (ni él ni el repositorio principal). Ejecuté `npm ci --no-audit --no-fund` (exit 0) para poder correr las herramientas y leer la documentación de Next indicada en `AGENTS.md`. Es la única acción que alteró el árbol de trabajo, y `node_modules/` está en `.gitignore`; **ningún archivo del proyecto fue modificado**.

### `npm run lint`

```
> ceneval-study-app@0.1.0 lint
> eslint

LINT_EXIT=0
```

Sin advertencias ni errores. Salida vacía.

### `npx tsc --noEmit`

```
TSC_EXIT=0
```

Sin errores. Salida vacía.

### Interpretación honesta de esos dos ceros

Ambos pasan **con todos los hallazgos de este informe presentes**, incluido el `TypeError` seguro de C5. Eso no es mérito del código; es la medida exacta de lo poco que estas dos herramientas cubren aquí:

- `tsc` no ve C5 porque falta `noUncheckedIndexedAccess`.
- `tsc` no ve nada del esquema de base de datos porque no hay tipos generados (A1): cada fila de Supabase entra al programa como `any` y sale "tipada" mediante 54 aserciones manuales que el compilador acepta sin verificar.
- `tsc` **no validó los tipos de rutas de Next**: `tsconfig.json` incluye `.next/types/**/*.ts` y `.next/dev/types/**/*.ts`, directorios que no existen porque no corrí `next build` (excluido explícitamente del encargo).
- `eslint` con `core-web-vitals` + `typescript` no lleva reglas de seguridad (no hay `eslint-plugin-security`, `no-floating-promises` ni `@typescript-eslint/no-misused-promises`); esta última habría marcado C10 (`await` cuyo resultado se descarta).

### Comandos deliberadamente NO ejecutados

`npm run build` (excluido por tiempo), `npm run content:import` y `npm run security:rls` (tocan el Supabase remoto: el primero escribe contenido real, el segundo crea y borra usuarios y una clase en producción).

---

## 8. Tabla resumen priorizada

### P0 — bloquea avanzar

| # | Hallazgo | Ubicación | Estado |
|---|---|---|---|
| C1 | Las clases importadas no reciben `curriculum_code`/`curriculum_order` → las 18 pendientes nunca aparecerán en `/sesiones` ni en la navegación anterior/siguiente | `scripts/import-content.ts:47-60` vs `lib/data/academic.ts:339,386` y migración `20260821021153:45-48` | VERIFICADO |
| C2 | Los 41 paquetes referencian `F:\TRANSCRIPCIONES CENEVAL\...` → `content:check` y `content:import` solo funcionan en una máquina; CI imposible | `content/packages/*.json` + `lib/content/load-package.ts:34,45` | VERIFICADO |

### P1 — corregir antes de más contenido

| # | Hallazgo | Ubicación | Estado |
|---|---|---|---|
| S1 | Open redirect + fijación de sesión: `safeNext` no bloquea `/\host` | `app/auth/confirm/route.ts:5-7,36` | VERIFICADO (ejecutado) |
| S2 | `submitExamAction` persiste `selected_option_id` sin validar pertenencia, con el cliente service-role; sin Zod | `app/actions/academic.ts:405,443-450` | VERIFICADO |
| S3 | El bloqueo de registro es solo de la app; `/auth/v1/signup` de Supabase sigue abierto con la publishable key → cualquiera lee todo el contenido publicado por REST | `lib/access.ts` + migración `20260821020733:348-352` | VERIFICADO (código) / SOSPECHADO (config remota) |
| S6 | `next.config.ts` vacío: sin CSP, HSTS, X-Frame-Options, Referrer-Policy | `next.config.ts` | VERIFICADO |
| C3 | Tope de transcripción 50 000 en acción y UI vs 200 000 en la base → truncado silencioso e irreversible | `academic.ts:153`, `transcript-workspace.tsx:14,205` vs migración `20260821020940:6` | VERIFICADO |
| C4 | `transcript.cleaned` de los 41 paquetes es una nota editorial, no una transcripción; se muestra como "Versión limpia" | `content/packages/*.json` + `load-package.ts:55` + `transcript-workspace.tsx:139-157` | VERIFICADO |
| C5 | `ExamPlayer` lanza `TypeError` si el examen no tiene preguntas | `exam-player.tsx:81,108` + `academic.ts:559` | VERIFICADO (lectura) |
| C6 | Sin `error.tsx`, `not-found.tsx`, `loading.tsx`, `global-error.tsx` ni `Suspense` en toda la app | `app/**` | VERIFICADO |
| C7 | `Number(param)` sin validar → 500 en vez de 404 en las 6 rutas dinámicas | 6 `page.tsx` | VERIFICADO |
| C8 | Importador no idempotente; rollback sin comprobar y deja materias huérfanas | `scripts/import-content.ts:211-215` | VERIFICADO |
| A1 | Sin tipos generados de Supabase: 54 casts manuales; un `rename column` no rompe la compilación | `lib/data/academic.ts` (52 de 54) | VERIFICADO |
| A3 | `lesson-view.tsx`: 514 líneas, 5 responsabilidades, sin pruebas | `components/lesson-view.tsx` | VERIFICADO |
| A4 | Zod exhaustivo en el contenido local, cero Zod en los Server Actions | `app/actions/*.ts` | VERIFICADO |
| T1 | `test-rls.ts` corre contra Supabase de producción: crea/borra usuarios reales y publica una clase temporal visible | `scripts/test-rls.ts:15-32,110-198` | VERIFICADO |
| R1 | `/administrar`: 48 round-trips; 15 escaneos completos de `topics` + 15 de `transcripts` | `app/administrar/page.tsx:9-15` + `academic.ts:269-270` | VERIFICADO |
| R2 | `getSubjects()` escanea `classes` y `topics` completas; se invoca incluso al abrir una lección | `academic.ts:216-249,536` | VERIFICADO |
| R3 | `LessonView` (client) recibe la transcripción completa (hasta 200 000 chars) en cada visita | `topic-detail.tsx:62` + `lesson-view.tsx:1` | VERIFICADO |
| R4 | Cero caché: `connection()` + `cookies()` en las 9 funciones de datos | `lib/data/academic.ts` (9 sitios) | VERIFICADO |
| R5 | `updatePublicationStatusAction` escanea 4 tablas completas; riesgo de truncado a 1 000 filas que bloquearía publicaciones válidas | `academic.ts:239-252` | VERIFICADO (escaneos) / SOSPECHADO (tope) |

### P2 — deuda técnica

| # | Hallazgo | Ubicación |
|---|---|---|
| S4 | Un intento cualquiera devuelve la clave de respuestas completa; sin límite de intentos | `academic.ts:455-466` |
| S5 | Acciones de estudiante aceptan cualquier id existente (oráculo de enumeración, escritura sobre draft) | `academic.ts:298,319,358` |
| S7 | `profiles_update_own` impide a la administradora editar su propio perfil | migración `20260821020733:369-372` |
| S8 | Auto-promoción por `ADMIN_EMAIL` con service-role dentro de cada render | `lib/auth.ts:30-42` |
| — | `getStudyProgress` sin `.eq("user_id")`: seguro hoy por RLS, frágil por diseño | `academic.ts:461-472` |
| C9 | `Promise.all([requireUser(), datos()])`: la redirección compite con el error de datos | 4 componentes/páginas |
| C10 | Errores tragados (flashcards, home-dashboard, estudiar, getStudyProgress) | 4 sitios |
| C11 | Carrera al crear temas (`position = count+1` vs índice único) | `academic.ts:188-206` |
| C12 | `.ilike()` sin escapar comodines en el importador | `import-content.ts:26-30` |
| C13 | `revalidatePath` incompleto — pero inocuo porque no hay caché (ver R4) | `academic.ts:291-294` |
| A2 | 7 clientes Supabase creados para una sola lección | `academic.ts:496-542` |
| A5 | Reglas de longitud duplicadas en 4 capas sin fuente única | varios |
| A6 | `AppShell` en `"use client"` solo por `usePathname()` | `app-shell.tsx:154` |
| A7 | Falta `noUncheckedIndexedAccess`; `target: ES2017` | `tsconfig.json` |
| A8 | Capa de datos acoplada al runtime de Next → imposible de probar en unidad | `lib/data/academic.ts` |
| R6 | Búsqueda `ilike '%q%'` sin `pg_trgm` y limitada a `topics.title` | `app/buscar/page.tsx:21` |
| R7 | PNG de 1.2 MB sin referenciar + 5 SVG del starter | `public/` |
| — | Path traversal teórico en el cargador de paquetes (script local) | `load-package.ts:26,34,46` |

---

## 9. Orden de trabajo sugerido

1. **Antes de producir la clase 41:** C1 y C2. Sin eso, cada clase nueva nace inservible en `/sesiones` y no reproducible.
2. **En el mismo lote:** C3 y C4 (el pipeline de transcripciones está entregando datos truncados y mal etiquetados) + C8 (idempotencia del importador).
3. **Antes de tocar nada más:** S1 (3 líneas), S6 (15 líneas de `headers()` en `next.config.ts`), C7 (un helper `parseId`) y C6 (`error.tsx` + `not-found.tsx` + `loading.tsx`: cuatro archivos, ~60 líneas en total). Es el mejor retorno por línea escrita de todo el informe.
4. **Antes de abrir el registro de estudiantes:** S2, S3, S4, S5.
5. **En paralelo, como red de seguridad:** el Nivel 1 de pruebas Vitest (2 h) y mover `test-rls.ts` al stack local (T1).
6. **Cuando haya margen:** A1 (tipos generados de Supabase) desbloquea la mayor parte de la deuda restante; R4 (estrategia de caché) es la mejora de rendimiento con mejor relación esfuerzo/beneficio.

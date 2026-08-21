# Evaluación de producto y operación — CENEVAL Study App

**Para:** Fátima (dueña, administradora y validadora académica)
**Fecha de la revisión:** 19 de agosto de 2026
**Qué hice:** leí toda la documentación de planeación y después revisé el repositorio real, archivo por archivo, para comprobar si lo que dicen los documentos coincide con lo que existe.

**Cómo leer este informe:**
- **VERIFICADO** = lo comprobé abriendo el archivo o ejecutando un comando de lectura.
- **INFERIDO** = es una conclusión razonable, pero no pude comprobarla directamente (por ejemplo, no tengo acceso a la base de datos de Supabase ni a la cuenta de Vercel).
- **P0** = atender antes de seguir produciendo contenido. **P1** = atender pronto. **P2** = después.

---

## 0. Resumen en una página

El proyecto está **mucho mejor de lo que sus propios documentos dicen**. Esa es la conclusión principal y es una buena noticia con una trampa.

Lo que va bien (verificado):
- La aplicación es real y está construida. No es una maqueta con datos falsos.
- El "Prioridad 0" que `docs/PROJECT_STATUS.md` declara pendiente **ya está hecho**: la migración con `curriculum_code`/`curriculum_order` existe, la página `/sesiones` existe y funciona, y los botones Anterior/Siguiente existen.
- Los 41 paquetes de contenido son consistentes entre sí: todos tienen exactamente 9 materiales, 12 flashcards, 10 reactivos y al menos 3 fuentes. Nadie improvisó.
- Las fuentes jurídicas son casi todas oficiales (`diputados.gob.mx`, `scjn.gob.mx`, `sat.gob.mx`) **y llevan fecha de consulta**. Eso es más disciplina de la que tiene la mayoría de los proyectos educativos.
- La seguridad de la base de datos (RLS) fue auditada con una suite de 20 pruebas y con los asesores de Supabase, y se corrigió al menos un hallazgo real.

Lo que está mal (verificado):
- **Todo el contenido de las 40 clases depende de un disco externo `F:` que solo existe en tu computadora.** Si ese disco falla, el proyecto no se puede reconstruir ni revalidar.
- **Hay un solo commit de git.** No hay historia, no hay forma de deshacer un error, no hay forma de saber quién cambió qué ni cuándo.
- **No hay respaldos de la base de datos, ni procedimiento escrito para hacerlos.**
- **No existe `.env.example`, ni configuración de Vercel, ni CI.** El README te dice que copies un archivo que no existe.
- **Se eliminó tu paso de aprobación.** El 12 de agosto se registró una "autorización permanente" para publicar cada clase automáticamente. Eso contradice tres documentos que dicen que nada se publica sin tu revisión expresa.
- **No hay aviso de privacidad, ni términos de uso, ni aviso de "esto es material educativo, no asesoría jurídica".**
- **No hay registro de quién es dueño de los audios ni de si hay permiso para usarlos.**
- La documentación (~228 KB en 21 archivos) se contradice a sí misma en puntos importantes y hay copias viejas dentro de `app/docs/`.

El camino más corto a algo que te sirva todos los días **no es producir 18 clases más**. Es cerrar cinco huecos operativos que hoy ponen en riesgo todo el trabajo ya hecho. Lo detallo en la sección 4.

---

## 1. Brecha entre lo declarado y lo real

### 1.1 Estado del producto

| # | Afirmación documental (archivo) | Evidencia encontrada en el repositorio | Veredicto |
|---|---|---|---|
| 1 | `docs/PROJECT_STATUS.md` §8, Prioridad 0.1: "Crear una migración para agregar `curriculum_code`, `curriculum_order` y la relación con sus audios" | `supabase/migrations/20260821021153_add_curriculum_session_metadata.sql` **ya crea** ambas columnas, sus restricciones, sus índices únicos y la tabla `class_audio_sources`, y **ya rellena** las 40 clases y 54 relaciones audio→clase | **Ya está hecho.** El documento está desactualizado. VERIFICADO |
| 2 | `docs/PROJECT_STATUS.md` §5 "Parcial o pendiente": "Vista cronológica de todas las sesiones" y §9 tarea 2 "Crear la página `/sesiones`" | `app/sesiones/page.tsx` existe, con las dos vistas ("Orden recomendado" y "Orden de audios"), tarjeta con código Cxx, materia, audio fuente y barra de progreso | **Ya está hecho.** VERIFICADO |
| 3 | `docs/PROJECT_STATUS.md` §9 tarea 4: "Incorporar navegación anterior/siguiente" | `components/class-detail.tsx` líneas 82–90 dibujan "← Anterior · Cxx" y "Cxx · Siguiente →"; `lib/data/academic.ts` tiene `getPublishedSessionNeighbors()` | **Ya está hecho.** VERIFICADO |
| 4 | `docs/PROJECT_STATUS.md` §3: "`/estudiar` enseña solamente los 12 temas creados más recientemente" y §9 tarea 5 "Corregir `/estudiar`" | `app/estudiar/page.tsx` consulta todos los temas aprobados de clases publicadas. **No hay ningún `.limit(12)` ni `.slice(0,12)` en el archivo** | **La afirmación es falsa hoy.** El problema no existe. VERIFICADO |
| 5 | `docs/PROJECT_STATUS.md` §1: "40 clases publicadas", "40 temas", "360 materiales", "480 flashcards", "400 preguntas" | El repositorio tiene 41 paquetes JSON con 41 temas, 369 materiales, 492 flashcards y 410 preguntas. La diferencia es **exactamente un paquete**: `audio-19-poder-ejecutivo-apf.json`, el piloto retirado | **Coincide.** 40 vigentes + 1 retirado. VERIFICADO en el repositorio; el conteo en Supabase no lo pude comprobar (INFERIDO que coincide) |
| 6 | `docs/PROJECT_STATUS.md` §1: "Versiones retiradas conservadas: **2**" | Solo existe **un** paquete de versión retirada en el repositorio (el piloto del Audio 19). El paquete de la clase 8 retirada (primera versión de Organismos descentralizados, Audio 20) **no existe como archivo** | **Discrepancia real.** El repositorio no conserva todo lo que hay en la base. VERIFICADO |
| 7 | `README.md`: "Copia `.env.example` como `.env.local`" | **`.env.example` no existe.** Además `.gitignore` línea 34 ignora `.env*`, es decir que aunque alguien lo cree, git lo bloqueará (`git check-ignore` lo confirma) | **Falso, y con una trampa.** Nadie puede levantar el proyecto siguiendo el README. VERIFICADO |
| 8 | `docs/PROJECT_STATUS.md` §5: "Despliegue formal en Vercel: no existe una vinculación local `.vercel` comprobable" | Correcto, y además **no existe `vercel.json`, no existe `.github/` (sin CI), no existe ningún archivo de despliegue** | **Cierto, y peor de lo que dice.** VERIFICADO |
| 9 | `README.md` (raíz): "La interfaz todavía usa datos temporales mientras se completa la conexión privada del servidor" | Todas las páginas consultan Supabase de verdad (`lib/data/academic.ts`, `createServerSupabaseClient`). No hay datos falsos | **Falso.** El README quedó congelado en julio. VERIFICADO |
| 10 | `README.md`: "Las entregas 1A, 1B y 1C de la interfaz están implementadas" (como si fuera el estado actual) | El producto va muchísimo más allá: exámenes, flashcards, mapas, progreso, panel administrativo, importador | **Subestima gravemente el avance.** VERIFICADO |

### 1.2 Contenido académico

| # | Afirmación documental | Evidencia | Veredicto |
|---|---|---|---|
| 11 | `content/README.md`, "Regla de cobertura total": "conservar **íntegra** la transcripción original" y `docs/DECISIONS.md` ADR-003 "la versión original será inmutable" | **Ningún paquete contiene la transcripción original.** Los 41 archivos apuntan a rutas del tipo `F:\TRANSCRIPCIONES CENEVAL\AUDIO 01.txt`. `lib/content/load-package.ts` las lee del disco al importar | **El original NO está en el repositorio.** Vive solo en un disco externo tuyo. VERIFICADO. **P0** |
| 12 | `content/README.md`, Contrato 1.0: "**cuatro** opciones y una respuesta correcta por pregunta" | De las 410 preguntas, **400 tienen 3 opciones** y solo 10 tienen 4. El validador (`lib/content/package-schema.ts`) acepta entre 3 y 4 | **El documento describe algo que no se cumple.** El contenido real es de 3 opciones. VERIFICADO |
| 13 | `content/curriculum-plan.md`: 70 transcripciones, 58 clases, 3 bancos | Las 40 clases publicadas consumen **42 audios**. Quedan 28 audios sin clase: 15 para bancos, 1 complemento (24), 1 archivado (66) y **11 audios** que deben producir las 18 clases restantes | **Coherente**, pero revela que 18 clases saldrán de solo 11 grabaciones más C58 sin fuente. VERIFICADO |
| 14 | `content/curriculum-plan.md` M15: "**C51** Regímenes patrimoniales del matrimonio, segunda parte del Audio 46" | `ROADMAP_TRACKING.md` §5 dice para el Audio 46: "régimen matrimonial reservado para **C53**", y para el Audio 67: "divorcio incausado reservado para **C53**". Dos contenidos distintos apuntan al mismo código | **Contradicción entre documentos.** El plan maestro dice C51; el tracking dice C53. VERIFICADO |
| 15 | `ROADMAP_TRACKING.md` §2, tabla de estado: "Contenido académico 🚧 **2 %** — Próximo resultado: Revisar y publicar la clase piloto" | El §6 del **mismo archivo** registra 40 entregas publicadas hasta la clase 49 | **El archivo se contradice a sí mismo.** VERIFICADO |
| 16 | `ROADMAP_TRACKING.md` §8, "Próximas cinco acciones": "4. Preparar Audio 20 **cuando esté disponible** su transcripción" | El §6 del mismo archivo registra el Audio 20 publicado como clase 24 el 11 de agosto | **Contradicción interna.** VERIFICADO |
| 17 | `ROADMAP_TRACKING.md` Fase F, "Proceso obligatorio por clase": 25 casillas, **todas sin marcar** (lectura completa, matriz de cobertura, conservación del original, validación automática, revisión administrativa, aprobación antes de publicar) | Se produjeron 40 clases siguiendo, según el registro de entregas, ese proceso | **Las casillas del tracking ya no significan nada.** VERIFICADO |
| 18 | `ROADMAP_TRACKING.md` Fase A: quedan sin marcar "Probar las 12 flashcards", "Resolver el examen completo", "Revisar la transcripción original", "Probar la clase en teléfono" — pero sí está marcado "Publicar" | La clase piloto se publicó sin cerrar su propia lista de revisión, y después se retiró | **La publicación se adelantó a la validación.** VERIFICADO |

### 1.3 Proceso y gobierno

| # | Afirmación documental | Evidencia | Veredicto |
|---|---|---|---|
| 19 | `docs/DECISIONS.md` ADR-011 "Revisión humana antes de publicar: todo paquete queda como borrador y necesita aprobación de la administradora"; `content/README.md` paso 6; `content/curriculum-plan.md` "esperar aprobación expresa antes de publicar" | `ROADMAP_TRACKING.md` §9, último párrafo: *"Por autorización permanente de la administradora del 2026-08-12, cada clase nueva del plan se publicará en la app inmediatamente después de superar esas comprobaciones, antes de comenzar la siguiente"* | **Contradicción grave.** El control humano sobre contenido jurídico se sustituyó por comprobaciones automáticas (formato, lint, build) que **no validan si el derecho es correcto**. VERIFICADO. **P0** |
| 20 | `docs/07-roadmap.md`, "Próxima acción": "definir la personalidad visual… comenzar la Entrega 1A" | Eso se completó el 23 de julio según el propio documento y según el README | **Documento fósil.** Describe un proyecto de hace un mes. VERIFICADO |
| 21 | `docs/07-roadmap.md` "Fase 5: Inteligencia artificial" como fase del plan | `docs/DECISIONS.md` ADR-013 pospone OpenAI; `ROADMAP_TRACKING.md` §7 lo marca "Pospuesta" | **Contradicción.** El roadmap oficial sigue anunciando una fase cancelada. VERIFICADO |
| 22 | `CODEX_START_HERE.md` (raíz): "No avanzar a navegación y pantallas hasta que el usuario apruebe las historias" | Navegación, pantallas, base de datos, exámenes y 40 clases ya existen | **Punto de entrada obsoleto.** Un agente nuevo que lo lea trabajará al revés. VERIFICADO |
| 23 | `CODEX_START_HERE.md` y `docs/DEVELOPMENT_WORKFLOW.md`: "Leer primero `AGENTS.md`" | `AGENTS.md` contiene **únicamente** una advertencia técnica sobre Next.js. No dice nada del proyecto, ni de Fátima, ni del contenido jurídico | **La puerta de entrada está vacía.** VERIFICADO |
| 24 | `docs/README.md` índice: lista 13 documentos | La carpeta `docs/` tiene 15 archivos; faltan del índice `SECURITY_TESTING.md` y el propio `README.md`, y `ROADMAP_TRACKING.md` (45 KB, en la raíz) tampoco aparece | **Índice incompleto.** VERIFICADO |
| 25 | `app/docs/01-product-vision.md`, `02-functional-requirements.md`, `03-user-stories.md` | Son **versiones viejas** de los documentos de `docs/`, anteriores al giro a "biblioteca editorial". Difieren en 303, 893 y 1 515 líneas respectivamente. La versión vieja describe una herramienta donde *el estudiante* sube y organiza sus transcripciones — el modelo **contrario** al aprobado | **Contradicción directa con el producto actual.** VERIFICADO. **P1** |
| 26 | Riesgo planteado: ¿los documentos dentro de `app/` se sirven como páginas web? | En Next.js App Router solo `page.tsx` y `route.ts` generan rutas. Revisé todo `app/`: no hay `[...slug]`, ni ruta que lea archivos `.md`. **Los archivos de `app/docs/` no son accesibles desde el navegador** | **No hay exposición pública.** El problema es de confusión, no de fuga. VERIFICADO |
| 27 | `docs/PROJECT_STATUS.md` §5: "Suite RLS de 20 comprobaciones aprobada en la última auditoría registrada" | `docs/SECURITY_TESTING.md` fecha esa auditoría el **29 de julio de 2026**, cuando existían 2 clases. Las 38 clases restantes, la tabla `class_audio_sources` y las columnas de currículo se agregaron **después** y no aparecen en la suite. `ROADMAP_TRACKING.md` Fase B deja sin marcar "Probar que publicar requiera rol `admin`" | **La afirmación es cierta pero engañosa.** La seguridad está validada sobre un sistema mucho más pequeño que el actual. VERIFICADO. **P1** |
| 28 | `ROADMAP_TRACKING.md` §2: "Seguridad RLS 🚧 85 %" | `docs/PROJECT_STATUS.md` §5 la presenta como "Funciona y está verificado" | **Contradicción entre los dos documentos de estado.** VERIFICADO |

### 1.4 Trazabilidad (historia de git)

| # | Hallazgo | Evidencia |
|---|---|---|
| 29 | **Existe un solo commit en todo el repositorio.** `3af446d "Initial commit"`, del 19 de agosto de 2026, con 160 archivos | `git log --oneline -50` devuelve una línea; `git rev-list --count HEAD` devuelve `1`. No hay etiquetas (`git tag` vacío). VERIFICADO |
| 30 | El autor del commit es **`ArturoFrancoMozqueda <arturo.f.mozqueda@gmail.com>`** y el repositorio remoto es **`git@github.com:ArturoFrancoMozqueda/ceneval-study-app.git`** | `git log -1`, `git remote -v`. VERIFICADO |

**Qué significa esto en lenguaje llano:** git es el "control de versiones" — el equivalente a tener todas las versiones anteriores de un documento de Word. Con un solo commit **no hay versiones anteriores**. Si mañana un agente de IA borra por error las 40 clases o rompe la aplicación, no hay un "regresar a como estaba ayer". El único punto de retorno es el estado de hoy, 19 de agosto.

Además, **el repositorio vive en la cuenta de GitHub de otra persona**, no en la tuya. No pude verificar si es público o privado (no tengo acceso a la red). Si fuera público, todo el contenido derivado de las transcripciones estaría a la vista de cualquiera.

---

## 2. Riesgos del negocio y de la operación

### 2.1 El disco `F:` es el único punto de verdad — **P0**

**VERIFICADO.** Los 41 paquetes declaran su transcripción así:

```
"originalFiles": ["F:\\TRANSCRIPCIONES CENEVAL\\AUDIO 01.txt", ...]
```

`lib/content/load-package.ts` lee esas rutas del disco al momento de importar. Consecuencias concretas:

- El comando `npm run content:check` (validar un paquete) **falla** si el disco `F:` no está conectado o cambia de letra.
- El comando `npm run content:import` (subir una clase) **falla** en las mismas condiciones.
- Nadie más que tú, en esa computadora, con ese disco puesto, puede validar o reimportar una clase.
- Si el disco muere, no puedes reconstruir el material desde cero ni demostrar de dónde salió una afirmación jurídica.

Esto choca de frente con ADR-003 ("la versión original será inmutable") y con la "Regla de cobertura total" de `content/README.md`. La transcripción original está *fuera* del sistema que promete conservarla.

### 2.2 No hay respaldos de la base de datos — **P0**

**VERIFICADO por ausencia.** Busqué "respaldo", "backup" y "restauración" en toda la documentación: aparecen únicamente como **tareas pendientes** (`ROADMAP_TRACKING.md` Fase I: "Procedimiento de respaldo [ ]", "Procedimiento de restauración [ ]"; `docs/PROJECT_STATUS.md` §5 y §8.4). No hay script, no hay tarea programada, no hay exportación.

Hoy, la única copia armada de las 40 clases (con sus 480 flashcards, 400 reactivos, mapas y referencias ya montados) está en Supabase. Los JSON del repositorio son la *materia prima*, no el producto terminado, y ni siquiera están completos (falta la versión retirada de la clase 8, punto 6 de la tabla).

El plan gratuito de Supabase **pausa los proyectos inactivos** y sus respaldos automáticos son limitados. Un descuido de una semana puede costarte semanas de trabajo. INFERIDO en cuanto al plan concreto (no verifiqué la cuenta), VERIFICADO en cuanto a que no existe procedimiento propio.

### 2.3 Un solo commit: no hay forma de deshacer errores — **P0**

Ya descrito en 1.4. Con desarrollo hecho por agentes de IA, esto es especialmente peligroso: un agente puede reescribir un archivo completo en segundos y no habría manera de recuperar la versión buena.

### 2.4 Dependencia de una sola persona — **P0**

**VERIFICADO.** Tú eres, simultáneamente: dueña, administradora, única cuenta con acceso, validadora académica, y la única con el disco de las transcripciones. Además `docs/DECISIONS.md` ADR-014 restringe el acceso al rol `admin` y desactiva el registro.

Si te enfermas, pierdes el teléfono con el segundo factor, o simplemente te ausentas un mes, el proyecto queda congelado y nadie más puede publicar, corregir ni retirar una clase equivocada. No hay una segunda cuenta administradora documentada ni un procedimiento de recuperación.

Y una capa más: la cuenta de GitHub que aloja el código no es la tuya (punto 30). Si esa relación cambia, pierdes el código.

### 2.5 El contenido jurídico caduca — **P1** (con un punto muy a favor)

**Lo que va bien, VERIFICADO:** cada referencia del paquete lleva `retrievedOn`, una fecha de consulta obligatoria en el validador. Las 138 referencias que revisé se consultaron entre el 10 y el 12 de agosto de 2026. El 96 % apunta a dominios oficiales `.gob.mx`. El registro de entregas de `ROADMAP_TRACKING.md` incluso anota reformas concretas ("reforma LFPCA del 09-06-2026", "reforma LFPPI del 03-04-2026"). Esto es trabajo serio.

**Lo que falta:** no existe ningún proceso de *revisión posterior*. `ROADMAP_TRACKING.md` Fase I deja sin marcar "Lista de comprobación legal por clase", "Calendario de revisión de fuentes" y "Alertas o revisión periódica de reformas". Hoy la fecha de consulta se guarda pero **nadie la vuelve a mirar**. Dentro de un año tendrás 58 clases con fecha de agosto de 2026 y ninguna forma sistemática de saber cuáles se rompieron.

Riesgo agravado: buena parte del contenido es de **derecho local** (Michoacán, Ciudad de México). Hay referencias a la Ley del Notariado de Michoacán con reforma de 2016, y a `paot.org.mx` (un organismo de la CDMX, no el congreso). Eso cambia por estado y envejece rápido.

**Fuentes que conviene revisar** (VERIFICADO):
- `https://online.flippingbook.com/view/900977387/` en `audio-01-02-orientacion-egel-derecho.json` — **no es un dominio oficial**; es un visor de PDF de terceros. Se usa para respaldar la estructura del examen CENEVAL, justo la afirmación más sensible del curso.
- `https://marcia.impi.gob.mx/marcas/search/quick` en `audio-50-marcas.json` — es un **buscador**, no una norma. No sirve como fundamento.
- `https://congresomich.gob.mx/leyes/` en dos paquetes — es un **índice general**, no un artículo concreto.

### 2.6 Costo de Supabase y Vercel al crecer — **P2 hoy, P1 si abres a estudiantes**

Con una sola usuaria el costo es cero. Pero conviene tener claro qué dispara el gasto:

- **Supabase gratuito**: pausa el proyecto tras inactividad, límite de almacenamiento y de transferencia. Las transcripciones completas guardadas como texto en la tabla `transcripts` (el esquema permite hasta 200 000 caracteres por clase, ampliado en la migración `20260821020940_expand_transcript_length.sql`) son el elemento que más crece.
- La protección contra contraseñas filtradas **solo existe en el plan Pro** (`docs/SECURITY_TESTING.md` lo documenta y se decidió posponerla). Si abres el registro a estudiantes sin ese plan, aceptas contraseñas conocidas por atacantes.
- **Vercel gratuito** (Hobby) **no permite uso comercial**. Como el proyecto es una biblioteca gratuita, en principio cabe, pero conviene confirmarlo antes de desplegar.
- Cada estudiante nuevo añade filas en `study_progress`, `flashcard_reviews`, `exam_attempts`, `exam_answers` y `quick_check_responses`. Cinco tablas por persona. Con cien estudiantes activos sigue siendo barato; el salto de costo llega por el plan Pro que necesitarás por seguridad, no por volumen.

INFERIDO: no verifiqué las cuentas ni los planes contratados.

### 2.7 Pérdida de acceso a las cuentas — **P0**

No encontré ningún documento que registre: quién es titular de la cuenta de Supabase, quién de la de Vercel, quién de la de GitHub, dónde están guardadas las claves, ni quién es el contacto de recuperación. El único identificador de proyecto que aparece escrito es `lcfdlhgpwmqeggsfbnbo` en `docs/SECURITY_TESTING.md`. VERIFICADO por ausencia.

---

## 3. Riesgo legal y de contenido

### 3.1 ¿De quién son los audios? — **P0**

**VERIFICADO, y es el riesgo más serio del proyecto.**

Las evidencias muestran que las 70 transcripciones son la grabación de **un curso ajeno**, dictado por un tercero:

- `lib/content/load-package.ts` limpia automáticamente la marca *"(Transcrito por TurboScribe…)"*: los audios se transcribieron con un servicio de pago a partir de grabaciones existentes.
- `content/batches/audio-01-05-classification.md`: *"La charla logística, bromas, **promociones** y comentarios personales se conserva en el original"*.
- `content/packages/audio-01-02-…json`: *"Se eliminaron del material didáctico promociones, bromas, comentarios personales… y datos logísticos propios de **una aplicación anterior**"*.
- `content/transcript-catalog.md` clasifica los audios 17, 21, 25, 32, 33, 39, 42, 44, 48, 49 y 52 como *"Revisión del séptimo examen parcial"*, *"del octavo examen parcial"*, etc.
- Los archivos de lote hablan sistemáticamente de **"el docente"**: *"las referencias a casos de la Suprema Corte están mezcladas con opiniones personales del docente"* (`audio-16-20-classification.md`).

Es decir: exámenes parciales numerados, promociones, un docente identificable, una plataforma previa. **Esto es un curso comercial de preparación CENEVAL grabado.**

Busqué en todo el repositorio las palabras "licencia", "autorización", "consentimiento", "titular", "derechos sobre". **No existe ni un solo documento que registre quién es el titular de esas grabaciones ni si hay permiso para usarlas.**

Por qué importa, en términos simples:
- En México, una clase impartida es una obra protegida por la Ley Federal del Derecho de Autor. Transcribirla, reorganizarla y publicarla —**aunque sea gratis**— puede constituir uso no autorizado de obra ajena y, según el caso, afectar los derechos morales del autor.
- El daño no es simétrico: mientras la app es privada y solo tú la usas, el riesgo práctico es bajo (uso personal de estudio). **En el momento en que abras el registro a estudiantes, el riesgo se multiplica**, porque pasa a ser distribución pública de contenido derivado de una obra ajena, y compite directamente con el curso original.
- Que el material esté reescrito y verificado con fuentes oficiales **ayuda mucho** (reduce la copia literal) pero no elimina el problema si la selección, secuencia y estructura pedagógica siguen siendo las del curso.

**Esto debe resolverse antes de abrir a estudiantes, no después.** Hay tres salidas posibles: (a) permiso escrito del titular; (b) reescribir el temario de modo que la secuencia y el contenido provengan de fuentes oficiales y no de la estructura del curso; (c) mantener la app estrictamente privada para uso personal. La opción (c) es gratis y es la que rige hoy.

### 3.2 ¿Se citan fuentes oficiales? — **Sí, y bien** ✅

**VERIFICADO.** Es el punto más fuerte del proyecto. El validador (`lib/content/package-schema.ts`) **obliga** a que cada tema tenga al menos una referencia con URL `https://`, institución, jurisdicción y fecha de consulta. Ninguna clase puede importarse sin eso. De 138 referencias:

- 96 a `diputados.gob.mx` (leyes federales vigentes),
- 7 a `gob.mx`, 6 a la SCJN, 4 al SAT, 2 al CENEVAL, y el resto a congresos locales, TFJA, PROFECO, IMPI, INDAUTOR y el DOF.

Con las tres excepciones señaladas en 2.5, es un aparato de fuentes sólido.

### 3.3 ¿Podría interpretarse como asesoría jurídica? — **P1**

**VERIFICADO.** El contenido es material de estudio para un examen, no consejo para un caso concreto: los ejemplos son casos hipotéticos ("una sustentante lee un caso…"). Eso está bien.

**Pero el aviso que lo aclara no existe.** `ROADMAP_TRACKING.md` Fase D incluye la tarea *"Añadir aviso de contenido educativo, no asesoría jurídica"* **sin marcar**, y busqué en todo el código (`app/`, `components/`, `lib/`) las expresiones "asesoría jurídica", "aviso de privacidad" y "términos de uso": **cero coincidencias**.

Es una frase de una línea al pie de cada clase. Cuesta minutos y quita un riesgo real, sobre todo si alguna vez alguien usa una explicación de derecho local desactualizada para un asunto propio.

### 3.4 Aviso de privacidad y términos de uso (LFPDPPP) — **P0 antes de abrir a estudiantes**

**VERIFICADO por ausencia.** `ROADMAP_TRACKING.md` Fase I: "Política de privacidad [ ]", "Términos de uso [ ]", "Canal para reportar errores [ ]", "Plan de respuesta a incidentes [ ]".

Qué datos personales guardaría la app en cuanto entre la primera estudiante (verificado en las migraciones):
- correo electrónico y contraseña (tabla `auth.users` de Supabase),
- nombre completo (`public.profiles.full_name`),
- progreso de estudio por tema (`study_progress`),
- calificaciones de flashcards (`flashcard_reviews`),
- intentos de examen y **cada respuesta individual** (`exam_attempts`, `exam_answers`),
- respuestas a comprobaciones rápidas (`quick_check_responses`).

Eso es un perfil de desempeño académico nominativo. Bajo la Ley Federal de Protección de Datos Personales en Posesión de los Particulares necesitas, como mínimo:
1. **Aviso de privacidad** accesible antes del registro, que diga quién es el responsable, qué datos recabas, para qué, con quién los compartes (Supabase y Vercel están **fuera de México** — esto se debe declarar) y cómo ejercer derechos ARCO.
2. Un **medio de contacto** para solicitudes ARCO (acceso, rectificación, cancelación, oposición).
3. **Términos de uso** que fijen que el material es educativo, que no garantiza aprobar el examen, y que la vigencia jurídica se verifica a una fecha determinada.
4. Un **procedimiento de borrado de cuenta**: hoy no encontré ninguna función para que una estudiante elimine su cuenta y sus datos.

Nada de esto hace falta mientras seas la única usuaria. Todo hace falta el día que abras el registro.

---

## 4. Alcance y priorización — mi recomendación franca

### El diagnóstico

**El proyecto está creciendo sin cerrar lo básico.** La evidencia es concreta:

- 40 clases publicadas y **cero respaldos**.
- 40 clases publicadas y **un solo commit** de git.
- 40 clases cuyo original vive en **un disco externo**.
- 40 clases publicadas y **cero pruebas automáticas** de la aplicación (`ROADMAP_TRACKING.md` Fase G: 20 casillas, todas sin marcar).
- 40 clases publicadas y **ningún despliegue**: la app solo existe en `localhost:3000` de tu computadora.
- Y la seguridad se auditó por última vez cuando había **2 clases**, no 40.

Mientras tanto, `docs/PROJECT_STATUS.md` §8 propone seguir con 18 clases más (Prioridad 1), 3 bancos y **16 exámenes acumulativos** (Prioridad 2). Los 16 exámenes acumulativos no existen ni en boceto: son 16 productos nuevos, con reactivos originales, sobre un sistema que aún no está desplegado.

Dicho sin rodeos: **cada clase nueva aumenta lo que puedes perder, sin aumentar la probabilidad de conservarlo.**

### ¿Es realista la ruta actual?

Las 18 clases: **sí, es realista en producción**. El ritmo demostrado es alto (24 clases publicadas el 11 de agosto según el registro de entregas). Pero hay una advertencia que el propio plan admite: quedan solo **11 audios** para 18 clases, y **C58 no tiene fuente** ("Sin transcripción suficiente"). Las últimas clases se escribirán casi enteramente desde legislación, no desde el curso. Eso es más lento y necesita más revisión tuya, no menos.

Los 3 bancos: **realistas**, y son de alto valor porque son transversales (diagnóstico, interdisciplinario, comprensión lectora). B01 y B03 además se construyen con textos propios, lo que **reduce el riesgo de derechos de autor**.

Los 16 exámenes acumulativos: **no son realistas ahora, y aportan poco**. Ya existen 400 reactivos etiquetables por materia. Un examen acumulativo puede armarse *seleccionando* reactivos existentes en lugar de escribir 160 nuevos. Recomiendo **posponerlos** y sustituirlos por un modo "examen mixto" que tome preguntas al azar del banco ya publicado. Es una fracción del trabajo con casi todo el beneficio.

### Qué recortaría o pospondría

| Recortar / posponer | Por qué |
|---|---|
| **16 exámenes acumulativos por módulo** (P2 del PROJECT_STATUS) | Sustituir por un modo "examen mixto" sobre los 400 reactivos que ya existen. Ahorra semanas. |
| **Historial y análisis profundo de temas débiles** (Fase E completa) | Función grande y sofisticada. Con una sola usuaria, un "% de aciertos por materia" resuelve el 80 % de la necesidad. |
| **Versionado editorial completo** (Fase C: comparar versiones, restaurar) | Ya tienes `draft/review/published/withdrawn`. El versionado fino es un lujo mientras no haya varios editores. |
| **Dominio propio** | Un subdominio gratuito de Vercel sirve perfectamente para uso privado. |
| **Tutor con IA y calendario** (Fase 9) | Ya pospuestos. Mantenerlos pospuestos. |
| **`docs/07-roadmap.md`, `CODEX_START_HERE.md`, `app/docs/*`** | Archivar. Ver sección 7. |

### El camino más corto a algo que uses todos los días

La aplicación **ya hace lo que necesitas**. Le falta una sola cosa para ser usable a diario: **que exista fuera de tu computadora**. Hoy tienes que abrir una terminal y escribir `npm run dev` para estudiar. Eso no se sostiene como hábito diario, y no funciona desde el teléfono.

Propongo dos semanas con este orden. Nada de contenido nuevo hasta terminarlas.

**Semana 1 — Dejar de poder perder el trabajo (P0)**

1. **Copiar `F:\TRANSCRIPCIONES CENEVAL\` a dos lugares más**: una carpeta de nube (Drive/OneDrive) y un segundo disco. Hoy mismo. Es media hora y elimina el riesgo más grande.
2. **Empezar a hacer commits de verdad.** Un commit al terminar cada sesión de trabajo, con un mensaje que diga qué cambió. `docs/DEVELOPMENT_WORKFLOW.md` ya explica cómo; simplemente no se está aplicando.
3. **Exportar un respaldo de Supabase** y guardarlo junto a las transcripciones. Repetir cada semana, o después de publicar cada clase. Que quede escrito en una hoja de media página cómo hacerlo y cómo restaurarlo.
4. **Crear `.env.example`** con los nombres de las variables (sin valores) y **quitarlo del `.gitignore`** con una excepción `!.env.example`. Sin esto, el README miente y nadie puede levantar el proyecto.
5. **Documentar quién es dueño de qué cuenta** (Supabase, Vercel, GitHub, correo de recuperación) y dónde están guardadas las claves. Media página. Aclarar en particular la situación del repositorio de GitHub, que hoy está en una cuenta que no es la tuya.

**Semana 2 — Que la app viva fuera de tu computadora (P0/P1)**

6. **Desplegar en Vercel** en modo privado (`PRIVATE_ACCESS_ONLY` activo, que ya está implementado en `lib/access.ts`). Configurar las variables de producción y las URLs de redirección de Supabase Auth.
7. **Recorrer las 40 clases desde el teléfono** en la URL real. Esto es tu prueba de aceptación: si puedes estudiar desde el celular en la fila del banco, la app te sirve.
8. **Volver a correr `npm run security:rls`** contra el sistema actual de 40 clases, y añadir la comprobación que falta ("publicar requiere rol admin").
9. **Agregar el aviso de contenido educativo** al pie de cada clase. Una línea.
10. **Recuperar tu paso de aprobación** (ver 6, abajo) y actualizar `docs/PROJECT_STATUS.md` para que refleje la realidad.

Después de eso: C41 a C58, y luego los bancos. Sin exámenes acumulativos por ahora.

---

## 5. Definición de terminado y medición

### Cómo sabrás que la app te sirve

`docs/PROJECT_STATUS.md` §11 define "terminado" con nueve criterios, y ocho son **conteos de producción**: 58 clases, 3 bancos, 16 exámenes, pruebas automáticas, URL de producción, manual. Solo el noveno menciona tu experiencia: *"Fátima aprueba el recorrido completo desde C01 hasta el cierre del plan"*.

Eso es medir la fábrica, no el producto. Propongo una definición mucho más corta y honesta:

> **La app está terminada para su primera etapa cuando puedas estudiar 30 minutos desde tu teléfono, cualquier día, sin abrir una terminal, y al terminar sepas qué estudiar mañana.**

Ese criterio se cumple con lo que **ya existe** más el despliegue. No requiere 18 clases más.

### ¿Hay alguna métrica de aprendizaje real?

**Sí, una — y es mejor de lo que los documentos reconocen.** VERIFICADO:

- `exam_attempts` guarda `score` y `total_questions` por intento (`app/actions/academic.ts` línea 420 calcula los aciertos contra `exam_answer_keys`).
- `components/home-dashboard.tsx` líneas 28–35 suma esos valores y muestra un **porcentaje global de aciertos**. Eso sí mide aprendizaje.
- `flashcard_reviews` guarda la calificación de cada tarjeta (`again`, `hard`…) y `quick_check_responses` marca lo que necesita repaso. `app/estudiar/page.tsx` los suma en un "repaso recomendado".

**Todo lo demás son conteos de consumo, no de aprendizaje.** La barra de "% completado" de `/sesiones` es `pasos_completados / (temas × 5)`: mide **cuántas pantallas abriste**, no cuánto sabes. Una persona puede llegar al 100 % sin acertar una sola pregunta.

Lo que falta y sí importaría (todo sin marcar en Fase E):
- **Aciertos por materia**, no global. Es la métrica que de verdad te dirá dónde estás débil de cara al CENEVAL. Los datos ya están en la base; falta una consulta y una tabla en pantalla.
- **Evolución en el tiempo**: si repites un examen, hoy no ves si mejoraste.
- **Reactivos fallados recurrentemente**: qué conceptos específicos se te resisten.

**Mi recomendación de medición mínima —una sola pantalla:**

| Métrica | De dónde sale | Por qué importa |
|---|---|---|
| % de aciertos por materia (15 materias) | `exam_attempts` + `exam_questions` → tema → clase → materia | Es tu mapa de calor. Te dice qué estudiar mañana. |
| Última fecha de estudio por materia | `study_progress.last_activity_at` | Detecta materias abandonadas. |
| Reactivos fallados más de una vez | `exam_answers` | Los conceptos que de verdad no dominas. |
| Clases con fuentes consultadas hace más de 6 meses | `legal_references.retrieved_on` | Tu alerta de contenido caducado. |

Las tres primeras usan datos que **ya se están guardando**. La cuarta requiere una consulta simple y resolvería de golpe el riesgo de caducidad legal (2.5).

---

## 6. La decisión pendiente clave: abrir o no a estudiantes

### Qué está pasando hoy

**VERIFICADO.** `docs/DECISIONS.md` ADR-014 (29 de julio) restringe el acceso al rol `admin` y desactiva el registro público. ADR-012 (cuentas de estudiante) quedó "Pospuesta temporalmente". `lib/access.ts` implementa el interruptor: `PRIVATE_ACCESS_ONLY !== "false"`. Es decir, **el modo privado es el predeterminado y basta cambiar una variable para abrirlo**.

### El costo de mantener la indefinición

**El costo técnico es casi cero, y eso es una buena noticia.** El sistema ya está construido para dos audiencias: hay roles, RLS, aislamiento de progreso, y una suite de seguridad que prueba explícitamente que dos estudiantes no ven los datos de la otra. No estás pagando complejidad por no decidir.

**El costo real está en otras tres partes:**

1. **Costo de propósito.** El objetivo declarado en `ROADMAP_TRACKING.md` §1 es *"publicar una biblioteca gratuita para estudiantes de Derecho"*. Todo el trabajo de 40 clases se justifica por ese objetivo. Si nunca se abre, es un organizador personal muy caro. La indefinición hace imposible saber si vas ganando o no.

2. **Costo de deuda diferida.** El aviso de privacidad, los términos, el aviso educativo, el permiso sobre los audios y el plan Pro de Supabase son requisitos del día que abras. Cada mes que pasa se acumulan sobre un catálogo más grande. Redactar el aviso de privacidad hoy (40 clases) y hacerlo con 58 cuesta lo mismo; pero **conseguir el permiso sobre los audios cuando ya publicaste 58 clases es una conversación mucho más difícil** que tenerla ahora.

3. **Costo de validación.** Con una sola usuaria no puedes saber si el material funciona para alguien que no lo produjo. `ROADMAP_TRACKING.md` Fase A lo pide explícitamente: *"Observar si una estudiante inicia una actividad significativa en menos de un minuto"*, *"Registrar claridad, interés, duración, abandono"* — sin marcar, porque no hay estudiantes.

### Qué hay que resolver antes de abrir

**Bloqueantes absolutos (P0):**

1. **Derechos sobre los audios** (sección 3.1). Es el único que puede detener el proyecto por completo, y es el único que no se resuelve con código.
2. **Aviso de privacidad y términos de uso** (sección 3.4), incluyendo la transferencia de datos fuera de México y el canal ARCO.
3. **Función de borrado de cuenta y datos** para las estudiantes.
4. **Respaldos funcionando** (2.2). Perder los datos de una sola usuaria es un mal día; perder el progreso de doscientas es un incidente que debes notificar.
5. **Plan Pro de Supabase** o equivalente, para activar la protección contra contraseñas filtradas (`docs/SECURITY_TESTING.md` documenta que hoy está desactivada por el plan).

**Muy recomendables antes de abrir (P1):**

6. Repetir la suite RLS sobre el sistema completo de 40 clases, y cerrar la comprobación pendiente de que publicar requiere rol `admin` (Fase B).
7. Probar el flujo de cuenta no verificada — está explícitamente listado como cobertura pendiente en `docs/SECURITY_TESTING.md`.
8. Probar el correo de confirmación y recuperación con un buzón real en producción.
9. Confirmar que el contenido `withdrawn` no se filtra en ninguna pantalla de estudio. **Está bien resuelto en las rutas que revisé** (`getPublishedSessions` y `/estudiar` filtran `publication_status = 'published'`), pero conviene verificar todas.
10. Aviso de contenido educativo, no asesoría jurídica (3.3).

**Mi recomendación:** no abras todavía, pero **pon fecha y condición**. Algo como: *"abro el registro cuando estén C41–C58 publicadas, el aviso de privacidad publicado y el asunto de los audios resuelto por escrito"*. Una decisión pospuesta con fecha es un plan; una pospuesta sin fecha es un limbo que se paga en trabajo que nunca llega a nadie.

### Y una decisión que no puede esperar: recuperar tu aprobación

Aparte de lo anterior, hay algo que hay que revertir ya. `ROADMAP_TRACKING.md` §9 registra una **"autorización permanente"** para publicar automáticamente cada clase que pase el validador, lint y build. Eso contradice ADR-011, `content/README.md` y `content/curriculum-plan.md`.

El problema es concreto: esas tres comprobaciones verifican **forma**, no **fondo**. Comprueban que haya 9 materiales y 12 flashcards; **no comprueban que el artículo citado exista, ni que la reforma esté vigente, ni que el reactivo tenga una sola respuesta correcta**. Tú eres la validadora académica del proyecto; la autorización permanente te sacó del circuito precisamente en lo único que solo tú puedes hacer.

Es más grave por la naturaleza del contenido: material jurídico, en un producto pensado para gente que se juega su titulación. Sugiero volver al modelo original — importar como borrador, tú revisas, tú publicas — y aceptar que el ritmo baje. Publicar rápido contenido jurídico sin revisar no es velocidad, es riesgo acumulado.

---

## 7. La documentación como producto: ¿ayuda o estorba?

### El tamaño

**VERIFICADO.** 228 KB en 21 archivos markdown:
- `ROADMAP_TRACKING.md` — 45 KB (658 líneas)
- 15 archivos en `docs/` — 124 KB
- 3 archivos en `content/` — 30 KB
- 3 copias viejas en `app/docs/` — 31 KB
- `README.md`, `AGENTS.md`, `CODEX_START_HERE.md`, `CLAUDE.md` — 3 KB

Para comparar: el código de la aplicación completa cabe en menos espacio que su documentación.

### El veredicto: **hoy estorba más de lo que ayuda** — P1

No porque sea mala. Al contrario: `content/curriculum-plan.md` es excelente y `docs/SECURITY_TESTING.md` es un modelo de rigor. El problema es que **no hay una sola fuente de verdad**, y varios documentos contradicen la realidad. Un agente de IA (o una persona nueva) que lea `docs/README.md` en el orden indicado va a construir el producto equivocado.

### Contradicciones concretas, con archivo y afirmación

| # | Archivo A dice | Archivo B (o la realidad) dice |
|---|---|---|
| C1 | `ROADMAP_TRACKING.md` §2: *"Contenido académico 🚧 **2 %**"* | `ROADMAP_TRACKING.md` §6, **el mismo archivo**: 40 entregas publicadas. Y `docs/PROJECT_STATUS.md` §1: *"Avance de clases: 69 %"* |
| C2 | `ROADMAP_TRACKING.md` §8: *"Preparar Audio 20 **cuando esté disponible** su transcripción"* | `ROADMAP_TRACKING.md` §6: *"Audio 20 … consolidados en la clase 24"* (11 de agosto) |
| C3 | `ROADMAP_TRACKING.md` §2: *"Despliegue [ ] **0 %**"* y *"Seguridad RLS 🚧 85 %"* | `docs/PROJECT_STATUS.md` §5 clasifica RLS como *"Funciona y está verificado"* |
| C4 | `docs/DECISIONS.md` ADR-011: *"Todo paquete queda como borrador y necesita **aprobación de la administradora**"* | `ROADMAP_TRACKING.md` §9: *"Por autorización permanente… cada clase nueva se publicará **inmediatamente**"* |
| C5 | `content/README.md`: *"**cuatro** opciones y una respuesta correcta por pregunta"* | 400 de las 410 preguntas reales tienen **tres** opciones |
| C6 | `content/README.md`: *"conservar **íntegra** la transcripción original"* / ADR-003: *"la versión original será inmutable"* | Ningún paquete la contiene; todos apuntan a `F:\TRANSCRIPCIONES CENEVAL\` |
| C7 | `content/curriculum-plan.md` M15: *"**C51** Regímenes patrimoniales del matrimonio, segunda parte del Audio 46"* | `ROADMAP_TRACKING.md` §5, Audio 46: *"régimen matrimonial reservado para **C53**"* — y C53 ya está asignado a "Divorcio sin expresión de causa" |
| C8 | `docs/07-roadmap.md`, "Próxima acción": *"definir la personalidad visual… comenzar la Entrega 1A"* | Eso terminó el 23 de julio. El documento describe un proyecto de hace un mes |
| C9 | `docs/07-roadmap.md` anuncia *"Fase 5: Inteligencia artificial"* como parte del plan | `docs/DECISIONS.md` ADR-013 y `ROADMAP_TRACKING.md` §7 la dan por **pospuesta** |
| C10 | `README.md`: *"La interfaz todavía usa **datos temporales**"* y *"Copia `.env.example`"* | Todo consulta Supabase; `.env.example` **no existe** y `.gitignore` lo bloquearía |
| C11 | `CODEX_START_HERE.md`: *"No avanzar a navegación y pantallas hasta que el usuario apruebe las historias"* | Navegación, pantallas, base de datos, exámenes y 40 clases ya existen |
| C12 | `app/docs/01-product-vision.md`: *"La aplicación **permitirá transformar transcripciones de clases** en material de estudio"* (el estudiante organiza su propio material) | `docs/01-product-vision.md`: *"Los estudiantes **no necesitan organizar ni generar** el contenido"* (biblioteca editorial). **Modelos de producto opuestos** |
| C13 | `docs/README.md` índice: 13 documentos | La carpeta tiene 15; faltan `SECURITY_TESTING.md` y el propio README, y `ROADMAP_TRACKING.md` (45 KB) no aparece en ningún índice |
| C14 | `CODEX_START_HERE.md` y `docs/DEVELOPMENT_WORKFLOW.md`: *"Leer primero `AGENTS.md`"* | `AGENTS.md` contiene únicamente una advertencia técnica sobre Next.js. Cero contexto del proyecto |

Catorce contradicciones verificables. Ese es el costo real: cada una es una oportunidad de que un agente de IA tome la decisión equivocada, con la confianza de estar siguiendo la documentación oficial.

### Qué haría con la documentación — **P1**

**Reducir a cuatro documentos vivos:**

1. **`PROJECT_STATUS.md`** — la única fuente de verdad sobre el estado. Actualizado hoy mismo para reflejar que P0 ya está hecho.
2. **`content/curriculum-plan.md`** — el plan académico. Es bueno, dejarlo casi como está (corrigiendo C51/C53).
3. **`docs/DECISIONS.md`** — el registro de decisiones. Es el documento más valioso a largo plazo: explica *por qué* las cosas son como son. Agregar ahí la decisión sobre la autorización permanente, con su reversión.
4. **`AGENTS.md`** — llenarlo de verdad: quién es Fátima, qué es el producto, qué está prohibido (publicar sin aprobación, tocar la transcripción original), y a qué documentos ir. Es la primera puerta y hoy está vacía.

**Archivar en una carpeta `docs/archivo/`** (no borrar — son historia del proyecto): `07-roadmap.md`, `CODEX_START_HERE.md`, y los tres archivos de `app/docs/`.

**Reescribir `ROADMAP_TRACKING.md`.** Sus 45 KB tienen dos partes de valor muy distinto:
- El **§6 Registro de entregas** es excelente y debe conservarse: es la única bitácora real de qué se hizo, cuándo y con qué evidencia. Con un solo commit de git, **es literalmente lo único que documenta la historia del proyecto**.
- El **§5 Tracking de 70 transcripciones** también es valioso y está actualizado.
- Las **Fases A–I con cientos de casillas** ya no reflejan nada (Fase F tiene 25 casillas sin marcar para trabajo que sí se hizo). Convertirlas en una lista corta de lo que falta de verdad.

**Regla nueva, una sola frase:** *un documento que no se actualizó en la última semana de trabajo activo se archiva o se corrige; no se deja como está.* La regla de sincronización de `docs/README.md` ya lo dice, pero no se aplica — y ese incumplimiento es la causa de las catorce contradicciones.

---

## 8. Lo que va bien (para que no se pierda de vista)

No quiero que este informe deje la impresión de que el proyecto está mal. Está bien hecho en las cosas difíciles y mal en las cosas fáciles.

1. **El validador de contenido es un acierto de diseño.** `lib/content/package-schema.ts` **impide** importar una clase sin 9 materiales, sin mapa de al menos 3 nodos, sin al menos una fuente HTTPS oficial con fecha de consulta, sin 10–15 flashcards y sin exactamente 10 reactivos con explicación de cada opción. La consistencia perfecta de los 41 paquetes (9/12/10 en todos, sin una sola excepción) no es suerte: es esa regla funcionando.
2. **Las respuestas de examen están protegidas por diseño.** Las claves viven en una tabla separada (`exam_answer_keys`) con RLS activo y **sin políticas**, o sea inaccesible desde el navegador. La calificación se hace en el servidor (`app/actions/academic.ts`). Es la forma correcta de hacerlo.
3. **La auditoría de seguridad fue real y encontró algo real.** `docs/SECURITY_TESTING.md` documenta que `rls_auto_enable()` tenía permisos `EXECUTE` indebidos para `anon` y `authenticated`, que se revocaron y se verificó el resultado, con migración incluida (`20260821020934`). Eso es trabajo de calidad profesional.
4. **El aparato de fuentes es sólido.** Fecha de consulta obligatoria, jurisdicción explícita, 96 % de dominios oficiales, y un registro de entregas que anota las reformas concretas aplicadas.
5. **El criterio editorial es honesto.** Los archivos de `content/batches/` marcan explícitamente los errores del curso original: *"las referencias a casos de la Suprema Corte están mezcladas con opiniones personales del docente"*, *"los ejemplos del docente sobre deducibilidad son orientativos y no deben presentarse como reglas universales"*, *"no debe memorizarse una cifra de Michoacán como regla nacional"*. Alguien está pensando en la estudiante, no solo produciendo.
6. **La arquitectura es la correcta para el tamaño del problema.** ADR-005 y ADR-008 rechazan explícitamente microservicios, Kubernetes y Docker. Next.js + Supabase es exactamente lo que este proyecto necesita, ni más ni menos.
7. **Y lo más importante: el trabajo P0 que el documento declara pendiente, ya está hecho.** `/sesiones`, el orden curricular, la navegación anterior/siguiente y el filtrado de contenido retirado funcionan. Estás más cerca de lo que crees.

---

## 9. Los diez riesgos principales, por prioridad

| # | Riesgo | Prio | Evidencia | Qué hacer |
|---:|---|:---:|---|---|
| 1 | **Todo el contenido original depende del disco externo `F:`.** Los 41 paquetes apuntan a `F:\TRANSCRIPCIONES CENEVAL\`. Sin ese disco no se puede validar, reimportar ni reconstruir nada | **P0** | `content/packages/*.json` campo `originalFiles`; `lib/content/load-package.ts` | Copiar hoy a nube + segundo disco. Después, guardar las transcripciones dentro del proyecto o en un almacenamiento compartido |
| 2 | **No hay respaldos de la base de datos.** La única copia armada de las 40 clases está en Supabase | **P0** | `ROADMAP_TRACKING.md` Fase I: "Procedimiento de respaldo [ ]"; `docs/PROJECT_STATUS.md` §5 | Exportación semanal + después de cada publicación. Media página de instrucciones de restauración |
| 3 | **Un solo commit de git: no hay forma de deshacer un error.** Con desarrollo por agentes de IA, un archivo mal reescrito es irrecuperable | **P0** | `git log --oneline -50` → una línea; `git rev-list --count HEAD` → 1; sin etiquetas | Commit al cerrar cada sesión. Etiqueta al publicar cada clase |
| 4 | **Derechos sobre los audios sin resolver.** El material proviene de un curso comercial de terceros (exámenes parciales, promociones, "el docente"). No existe registro de permiso | **P0** antes de abrir | `content/transcript-catalog.md`; `content/batches/audio-01-05-classification.md`; banner TurboScribe en `load-package.ts` | Permiso escrito del titular, o reescribir desde fuentes oficiales, o mantener la app privada. Decidir antes de C41 |
| 5 | **Sin aviso de privacidad, términos de uso ni borrado de cuenta.** Se guardarían correo, nombre, progreso, intentos y cada respuesta individual, con proveedores fuera de México | **P0** antes de abrir | `ROADMAP_TRACKING.md` Fase I sin marcar; migraciones `profiles`, `study_progress`, `exam_answers`; grep en el código: 0 coincidencias | Aviso de privacidad LFPDPPP con ARCO y transferencia internacional, términos de uso, función de borrado |
| 6 | **Se eliminó tu aprobación antes de publicar.** Una "autorización permanente" del 12-08 permite publicar automáticamente. El validador comprueba formato, no vigencia jurídica | **P0** | `ROADMAP_TRACKING.md` §9 vs. ADR-011, `content/README.md`, `content/curriculum-plan.md` | Revertir. Volver a borrador → tu revisión → publicación |
| 7 | **Dependencia total de una sola persona y de cuentas no documentadas.** Eres única admin, única validadora, única con el disco. Y el repositorio está en la cuenta de GitHub de otra persona | **P0** | ADR-014; `git remote -v` → `ArturoFrancoMozqueda/ceneval-study-app`; autor único del commit | Segunda cuenta admin de emergencia. Hoja con titularidad de Supabase/Vercel/GitHub y dónde están las claves |
| 8 | **La app solo existe en `localhost`.** Sin despliegue, sin `.env.example`, sin CI. No puedes estudiar desde el teléfono, que es cuando de verdad se estudia | **P1** | Sin `vercel.json`, `.vercel` ni `.github/`; `.env.example` inexistente y bloqueado por `.gitignore:34` | Desplegar en Vercel en modo privado. Crear `.env.example` con excepción en `.gitignore` |
| 9 | **La seguridad se auditó con 2 clases, no con 40.** Y quedan comprobaciones pendientes ("publicar requiere rol admin", cuenta no verificada, contraseñas filtradas solo en plan Pro) | **P1** | `docs/SECURITY_TESTING.md` fechado 29-07-2026; `ROADMAP_TRACKING.md` Fase B con casillas abiertas | Repetir `npm run security:rls` sobre el sistema actual y cerrar las tres pendientes antes de abrir |
| 10 | **La documentación se contradice a sí misma en 14 puntos verificados,** incluidas copias viejas en `app/docs/` que describen el modelo de producto **contrario** al aprobado | **P1** | Tabla completa en la sección 7 | Reducir a 4 documentos vivos; archivar `07-roadmap.md`, `CODEX_START_HERE.md` y `app/docs/*`; llenar `AGENTS.md` |

**Riesgos secundarios (P2), para no perderlos de vista:**

- **Sin proceso de revisión de vigencia legal.** La fecha de consulta se guarda pero nadie la vuelve a mirar (`ROADMAP_TRACKING.md` Fase I: "Calendario de revisión de fuentes [ ]"). Resoluble con una consulta que liste clases con fuentes de más de 6 meses.
- **Tres fuentes no oficiales o inservibles como fundamento:** `online.flippingbook.com` (estructura del examen CENEVAL), `marcia.impi.gob.mx/marcas/search/quick` (un buscador), `congresomich.gob.mx/leyes/` (un índice).
- **Sin aviso de "contenido educativo, no asesoría jurídica"** en ninguna pantalla. Cuesta una línea.
- **Cero pruebas automáticas de la aplicación** (Fase G: 20 casillas sin marcar). Cada cambio se verifica a mano.
- **Alcance creciendo sin cerrar lo básico:** 16 exámenes acumulativos planificados sobre un sistema sin desplegar ni respaldar.
- **El repositorio no refleja la base de datos:** falta el paquete de la segunda versión retirada, y la asignación `curriculum_order = id - 9` de la migración `20260821021153` es frágil — funciona hoy por coincidencia de IDs, no por diseño. Si en el futuro se corrigen o reordenan clases, ese cálculo se rompe en silencio.
- **`/estudiar` carga todos los temas sin límite.** Con 40 clases no se nota; con 58 más los bancos, la pantalla empezará a ir lenta.

---

## 10. Cierre

Lo diré de la forma más directa que puedo:

**Tienes un producto bueno que corres el riesgo de perder por descuidos baratos de arreglar.**

Las 40 clases son trabajo serio, con fuentes oficiales, criterio editorial honesto y una arquitectura correcta. Pero ese trabajo hoy depende de un disco externo, de una base de datos sin respaldo, de un repositorio con un solo commit en la cuenta de otra persona, y de una aplicación que solo existe en tu computadora.

Las cinco tareas de la Semana 1 (sección 4) toman menos tiempo que producir una sola clase, y protegen las 40 que ya existen.

Y hay una decisión que solo puedes tomar tú: **recuperar tu paso de aprobación antes de publicar**. Eres la validadora académica del proyecto. Un validador automático puede contar que haya 12 flashcards; no puede saber si el artículo citado sigue vigente. En contenido jurídico para gente que se juega su titulación, esa diferencia lo es todo.

Antes de la clase C41, resuelve el disco, el respaldo y los commits. El contenido puede esperar dos semanas. Lo que ya construiste, no debería tener que esperar a que algo falle para protegerse.

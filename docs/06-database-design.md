# Diseño inicial de base de datos

## Ampliación editorial y multiusuario

La migración `editorial_learning_platform` amplía el diseño aprobado con:

- `profiles`, con roles `admin` y `student`;
- estado de publicación y fecha de publicación en `classes`;
- `study_materials` versionados;
- `legal_references` y `topic_references`;
- `concept_maps`;
- `flashcards` y `flashcard_reviews`;
- `exams`, `exam_questions` y `exam_options`;
- `exam_answer_keys`, aislada de las opciones públicas;
- `exam_attempts` y `exam_answers`, asociados al usuario.

Todas las tablas públicas tienen RLS. El contenido académico se comparte solo
cuando la clase está publicada; los eventos de progreso son privados por
usuario.

## Estado

**Aprobado por la usuaria el 2026-07-23.**

Las historias, pantallas y arquitectura fueron aprobadas el 2026-07-23. Este documento define el modelo que se usará cuando comience la fase de persistencia; todavía no autoriza crear tablas.

## Convenciones

- Nombres de tablas y columnas en inglés, minúsculas y `snake_case`.
- Claves primarias `bigint` autogeneradas.
- Fechas y horas con zona horaria cuando representen un instante.
- Texto sin límites artificiales; las reglas de longitud se validarán explícitamente.
- Cada clave foránea tendrá un índice.
- Los estados usarán texto con restricciones de valores permitidos.
- `created_at` y `updated_at` se guardarán en UTC.
- Las reglas importantes existirán también en PostgreSQL, no solo en la interfaz.

## Entidades propuestas

### subjects

Representa una materia.

Campos conceptuales:

- id
- name
- description
- created_at
- updated_at

Reglas:

- `name` es obligatorio y no puede contener solo espacios;
- no habrá dos materias activas con el mismo nombre normalizado.

### classes

Representa una clase dentro de una materia.

- id
- subject_id
- title
- class_date
- teacher
- description
- created_at
- updated_at

Relación: muchas clases pertenecen a una materia.

### transcripts

Conserva original y versión limpia.

- id
- class_id
- original_text
- cleaned_text
- processing_status
- created_at
- updated_at

Relación: en la primera versión cada clase tendrá como máximo una transcripción.

Reglas:

- `class_id` será único;
- `original_text` será obligatorio e inmutable para procesos automáticos;
- `cleaned_text` podrá estar vacío mientras no se procese;
- `processing_status` permitirá `pending`, `processing`, `ready` o `failed`.

### topics

Representa un tema detectado o creado manualmente.

- id
- class_id
- title
- description
- position
- source_type
- approval_status
- created_at
- updated_at

Relación: cada tema pertenece a una sola clase en la primera versión.

Reglas:

- `position` será un entero positivo;
- `source_type` permitirá `manual` o `generated`;
- `approval_status` permitirá `pending`, `approved` o `rejected`;
- dos temas de la misma clase no compartirán posición.

### study_materials

Contiene una sección de material por tema.

- id
- topic_id
- material_type
- content
- source_transcript_id
- generated_by_ai
- generation_version
- version
- is_current
- created_at
- updated_at

Valores posibles de `material_type`:

- short_answer
- full_explanation
- simple_example
- ceneval_example
- summary
- comparison_table
- mnemonic
- common_errors
- keywords

Relación: un tema puede tener varios tipos de material y conservar versiones anteriores.

Reglas:

- solo existirá una versión actual por combinación de tema y tipo;
- regenerar una sección archivará la versión anterior sin afectar las demás;
- `source_transcript_id` conservará la relación con la fuente;
- `generation_version` identificará la versión del proceso o prompt;
- una edición manual actualizará la versión actual, pero no la fuente original.

### flashcards

- id
- topic_id
- question
- answer
- source_type
- created_at
- updated_at

Relación: un tema puede tener muchas flashcards.

### flashcard_reviews

- id
- flashcard_id
- rating
- reviewed_at
- next_review_at

Cada revisión será un registro nuevo. Nunca sobrescribirá revisiones anteriores.

### exams

- id
- topic_id
- title
- difficulty
- created_at

`difficulty` permitirá `basic`, `intermediate` o `advanced`.

### exam_questions

- id
- exam_id
- question_text
- explanation
- position

Dos preguntas del mismo examen no compartirán posición.

### exam_options

- id
- question_id
- option_text
- is_correct
- explanation
- position

Cada pregunta tendrá por lo menos dos opciones y exactamente una correcta en la primera versión.

### exam_attempts

- id
- exam_id
- started_at
- completed_at
- score
- total_questions

Cada intento será independiente y no se sobrescribirá al repetir un examen.

### exam_answers

- id
- attempt_id
- question_id
- selected_option_id
- is_correct

Una pregunta solo podrá tener una respuesta por intento.

### study_sessions

- id
- scheduled_at
- duration_minutes
- status
- completed_at

Esta tabla pertenece a una fase posterior y no se incluirá en la primera migración.

### study_session_topics

Tabla de relación entre sesiones y temas.

- study_session_id
- topic_id

Esta tabla pertenece a una fase posterior.

### topic_progress

Resumen derivado o almacenado del progreso.

- id
- topic_id
- mastery_status
- weakness_score
- last_studied_at
- updated_at

En la primera versión el progreso se calculará desde respuestas de examen y revisiones de flashcards. Esta tabla se añadirá únicamente si medir el progreso en tiempo real se vuelve costoso o si se necesitan ajustes manuales.

## Relaciones principales

```text
subject
  └── classes
      ├── transcripts
      └── topics
          ├── study_materials
          ├── flashcards
          │   └── flashcard_reviews
          ├── exams
          │   ├── exam_questions
          │   │   └── exam_options
          │   └── exam_attempts
          │       └── exam_answers
          └── topic_progress
```

## Reglas importantes

- Una transcripción original nunca debe sobrescribirse.
- El contenido generado debe conservar referencia a su fuente.
- Un intento de examen no debe sobrescribir intentos anteriores.
- Las opciones correctas no deben exponerse antes de finalizar el examen.
- La eliminación debe considerar datos relacionados.
- Antes de múltiples usuarios, el modelo puede funcionar con una sola identidad lógica.
- Cuando se agreguen usuarios, todas las entidades privadas deberán asociarse a `user_id`.

## Reglas de eliminación

- Eliminar una materia o clase requerirá confirmación explícita en la interfaz.
- En la primera entrega no se ofrecerá eliminación; se incorporará en la segunda.
- La base de datos podrá eliminar en cascada los registros que no tienen sentido sin su padre, pero la aplicación deberá mostrar el impacto antes de ejecutar la operación.
- El historial de intentos y revisiones se conservará mientras exista su examen o flashcard.
- No se implementará borrado lógico hasta que exista una necesidad real de recuperación o auditoría.

## Restricciones e índices

Además de las claves primarias se prevén:

- índice en `classes.subject_id`;
- índice único en `transcripts.class_id`;
- índice en `topics.class_id`;
- restricción única en `topics (class_id, position)`;
- índice en `study_materials.topic_id`;
- índice en `study_materials.source_transcript_id`;
- una sola versión actual de material por tema y tipo;
- índice en `flashcards.topic_id`;
- índice en `flashcard_reviews.flashcard_id`;
- índice en `exams.topic_id`;
- índices en todas las relaciones de preguntas, opciones, intentos y respuestas;
- restricción única en `exam_answers (attempt_id, question_id)`;
- índices de búsqueda de texto únicamente cuando se implemente FR-056.

Los índices específicos de búsqueda se decidirán con consultas reales para evitar optimización prematura.

## Seguridad en Supabase

- Todas las tablas expuestas por la API de datos tendrán Row Level Security.
- No se concederá acceso público amplio para compensar políticas faltantes.
- La primera versión accederá a los datos desde el servidor de Next.js.
- Ninguna clave privilegiada se incluirá en variables públicas del navegador.
- Al incorporar autenticación, se añadirá `user_id` y las políticas combinarán el rol autenticado con una comprobación de propiedad.
- No se utilizarán metadatos editables por el usuario para autorizar acceso.

## Progreso inicial

Los eventos originales serán la fuente:

- `exam_answers` conserva aciertos y errores;
- `exam_attempts` agrupa cada evaluación;
- `flashcard_reviews` conserva cada repaso.

Clasificación inicial por tema:

- **sin actividad:** todavía no hay respuestas calificadas;
- **en proceso:** existe actividad, pero no se cumplen los umbrales siguientes;
- **débil:** al menos 5 respuestas calificadas y menos de 60% correctas;
- **dominado:** al menos 5 respuestas calificadas y 80% o más correctas.

Entre 60% y 79% seguirá como **en proceso**. Estos umbrales podrán ajustarse después de probar la aplicación con datos reales.

## Decisiones resueltas

### Una transcripción por clase

Una clase tendrá como máximo una transcripción en la primera versión. Si después se necesitan varias partes, se documentará una migración compatible.

### Un tema pertenece a una clase

Evita una relación compleja de muchos a muchos. Temas parecidos en clases distintas serán registros diferentes y podrán relacionarse en una fase posterior.

### Versiones de material

Se conservarán las versiones regeneradas de cada sección. Solo una será la versión actual.

### Progreso calculado

Los intentos y revisiones serán datos permanentes. El resumen se calculará inicialmente y solo se persistirá si existe una necesidad comprobada.

### Umbrales de dominio

Se usarán cinco respuestas como muestra mínima, menos de 60% para debilidad y 80% o más para dominio.

## Primera migración prevista

Cuando llegue la fase de persistencia, la primera migración incluirá únicamente:

- `subjects`;
- `classes`;
- `transcripts`;
- `topics`;
- restricciones, relaciones e índices necesarios.

Materiales, flashcards, exámenes, progreso y calendario se añadirán en migraciones posteriores según el roadmap. Cada migración deberá probarse antes de continuar.

## Criterios de validación

La usuaria confirmó:

- una transcripción por clase para la primera versión;
- un tema asociado a una sola clase;
- conservación de versiones regeneradas del material;
- conservación de todos los intentos y revisiones;
- cálculo inicial del progreso desde la actividad;
- umbrales iniciales de tema débil y dominado.

La siguiente etapa es validar `07-roadmap.md`.

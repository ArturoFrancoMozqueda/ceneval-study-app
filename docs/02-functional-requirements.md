# Requisitos funcionales

## Cambio de modelo aprobado — biblioteca editorial

Los requisitos de captura y edición académica pertenecen exclusivamente a la
administradora. El estudiante consume contenido publicado y conserva su propio
progreso.

### FR-069 Registro e inicio de sesión — P0

El estudiante podrá registrarse con correo y contraseña, confirmar su correo,
iniciar sesión, cerrar sesión y recuperar la contraseña.

### FR-070 Roles seguros — P0

La aplicación distinguirá administradora y estudiante mediante un rol
controlado en base de datos.

### FR-071 Estados de publicación — P0

Cada clase tendrá estado borrador, en revisión o publicada. Los estudiantes
solo podrán consultar clases publicadas.

### FR-072 Importar paquete editorial — P0

Codex podrá validar e importar un paquete versionado con transcripción, temas,
materiales, referencias, mapa, flashcards y examen.

### FR-073 Vista previa administrativa — P0

La administradora verá el mismo contenido que recibirá el estudiante antes de
publicarlo.

### FR-074 Referencias jurídicas — P0

Cada tema conservará fuentes oficiales con título, URL, institución,
jurisdicción, cita y fecha de consulta.

### FR-075 Mapa conceptual — P0

Cada tema publicado mostrará un diagrama navegable y legible en móvil.

### FR-076 Progreso individual — P0

Las revisiones de flashcards e intentos de examen pertenecerán únicamente al
estudiante autenticado.

### FR-077 Proteger respuestas — P0

Las claves correctas y explicaciones no llegarán al navegador antes de que el
estudiante entregue el examen.

## Objetivo

Este documento define las capacidades que deberá ofrecer CENEVAL Study App.

## Convenciones

- `FR`: Functional Requirement o requisito funcional.
- Prioridad `P0`: indispensable para la primera versión.
- Prioridad `P1`: importante después del flujo principal.
- Prioridad `P2`: función avanzada o futura.

---

## Materias

### FR-001 Crear una materia — P0

El usuario podrá crear una materia con nombre y descripción opcional.

### FR-002 Consultar materias — P0

El usuario podrá ver todas las materias creadas.

### FR-003 Editar una materia — P1

El usuario podrá modificar nombre y descripción.

### FR-004 Eliminar una materia — P1

La aplicación solicitará confirmación y explicará el impacto sobre clases relacionadas.

### FR-005 Ver progreso por materia — P1

La aplicación mostrará avance, temas estudiados y resultados asociados.

---

## Clases

### FR-006 Crear una clase — P0

El usuario podrá crear una clase dentro de una materia.

### FR-007 Consultar clases — P0

El usuario podrá ver y abrir las clases de una materia.

### FR-008 Editar una clase — P1

El usuario podrá modificar título, fecha, profesor y descripción.

### FR-009 Eliminar una clase — P1

La aplicación solicitará confirmación antes de eliminarla.

### FR-010 Mover una clase — P1

El usuario podrá cambiar una clase de materia.

---

## Transcripciones

### FR-011 Pegar una transcripción — P0

El usuario podrá pegar texto largo y asociarlo a una clase.

### FR-012 Conservar el original — P0

La aplicación no modificará ni reemplazará el texto original.

### FR-013 Crear versión limpia — P0

La aplicación podrá mejorar puntuación, párrafos y repeticiones sin cambiar el significado.

### FR-014 Editar versión limpia — P1

El usuario podrá corregir manualmente la versión procesada.

### FR-015 Comparar versiones — P1

El usuario podrá alternar entre original y limpia.

---

## Temas

### FR-016 Detectar temas — P0

La aplicación propondrá temas a partir de la transcripción.

### FR-017 Aprobar temas — P0

El usuario podrá aprobar, editar o rechazar cada tema propuesto.

### FR-018 Crear tema manualmente — P1

El usuario podrá agregar temas no detectados.

### FR-019 Editar tema — P1

El usuario podrá modificar nombre, descripción y orden.

### FR-020 Eliminar tema — P1

La aplicación solicitará confirmación cuando existan materiales relacionados.

### FR-021 Reordenar temas — P1

El usuario podrá establecer la secuencia de estudio.

---

## Material de estudio

### FR-022 Generar respuesta breve — P0

La aplicación generará una respuesta de dos o tres líneas.

### FR-023 Generar explicación completa — P0

La explicación podrá incluir definición, utilidad, importancia, funcionamiento, uso, errores comunes y posible aparición en CENEVAL.

### FR-024 Generar ejemplo sencillo — P0

La aplicación generará un ejemplo cotidiano.

### FR-025 Generar ejemplo tipo CENEVAL — P0

La aplicación generará una situación y pregunta similar al examen.

### FR-026 Generar resumen — P0

La aplicación generará un resumen con ideas esenciales.

### FR-027 Generar tabla comparativa — P1

Se compararán conceptos similares o confundibles.

### FR-028 Generar mnemotecnia — P1

La aplicación propondrá una ayuda de memoria editable.

### FR-029 Identificar palabras clave — P1

La aplicación destacará términos relevantes.

### FR-030 Identificar errores comunes — P1

La aplicación explicará confusiones frecuentes.

### FR-031 Indicar importancia y dificultad — P1

El material podrá etiquetarse como importancia alta, media o baja y dificultad básica, intermedia o avanzada.

### FR-032 Regenerar una sección — P1

El usuario podrá regenerar una sección sin perder las demás.

### FR-033 Editar material — P0

Todo material generado podrá modificarse manualmente.

### FR-034 Mostrar fuente — P0

El usuario podrá consultar la transcripción utilizada.

---

## Flashcards

### FR-035 Generar flashcards — P0

La aplicación generará tarjetas por tema.

### FR-036 Crear flashcards manuales — P1

El usuario podrá crear pregunta y respuesta.

### FR-037 Editar o eliminar flashcards — P1

El usuario podrá administrar las tarjetas.

### FR-038 Estudiar flashcards — P0

La pregunta aparecerá antes que la respuesta.

### FR-039 Clasificar dificultad — P1

El usuario podrá marcar fácil, regular o difícil.

### FR-040 Programar repaso — P1

La aplicación podrá calcular una próxima fecha de revisión.

---

## Exámenes

### FR-041 Generar mini examen — P0

El usuario podrá generar un examen por tema.

### FR-042 Configurar examen — P0

El usuario podrá elegir dificultad y cantidad de preguntas.

### FR-043 Responder preguntas — P0

La aplicación guardará las respuestas seleccionadas.

### FR-044 Calificar examen — P0

Se mostrará número de aciertos, errores y porcentaje.

### FR-045 Explicar respuestas — P0

La aplicación explicará la opción correcta y las incorrectas.

### FR-046 Guardar intentos — P0

Los resultados permanecerán asociados al usuario y al tema.

### FR-047 Repetir examen — P1

El usuario podrá iniciar un nuevo intento sin perder el anterior.

### FR-048 Generar preguntas nuevas — P1

La aplicación podrá crear una variante del examen.

---

## Progreso

### FR-049 Guardar resultados — P0

La aplicación almacenará desempeño en flashcards y exámenes.

### FR-050 Detectar temas débiles — P0

Se identificarán temas con errores frecuentes.

### FR-051 Identificar temas dominados — P1

El dominio podrá calcularse a partir del desempeño y ajustes manuales.

### FR-052 Mostrar progreso general — P1

El dashboard resumirá avance y actividad.

### FR-053 Mostrar progreso por materia — P1

Cada materia mostrará métricas propias.

### FR-054 Mostrar errores recurrentes — P1

La aplicación agrupará conceptos con fallos repetidos.

### FR-055 Recomendar siguiente estudio — P1

La aplicación propondrá el siguiente tema o repaso.

---

## Búsqueda

### FR-056 Buscar contenido — P0

El usuario podrá buscar por materia, clase, tema, concepto o palabra clave.

### FR-057 Filtrar resultados — P1

Se podrá filtrar por materia, tipo, dificultad y dominio.

### FR-058 Abrir resultado — P0

Cada resultado llevará al contenido correspondiente.

---

## Calendario

### FR-059 Crear sesión — P1

El usuario podrá programar una sesión de estudio.

### FR-060 Asociar temas — P1

La sesión podrá incluir uno o varios temas.

### FR-061 Completar sesión — P1

El usuario podrá marcarla como terminada.

### FR-062 Reprogramar sesión — P1

El usuario podrá cambiar fecha y hora.

### FR-063 Mostrar repasos pendientes — P1

La aplicación mostrará actividades recomendadas para el día.

---

## Tutor de IA

### FR-064 Preguntar al tutor — P1

El usuario podrá preguntar dentro del contexto de un tema.

### FR-065 Responder con fuentes internas — P1

El tutor usará transcripciones y materiales disponibles.

### FR-066 Cambiar formato de explicación — P1

El usuario podrá pedir una versión sencilla, técnica, con analogía, ejemplo, tabla o diagrama.

### FR-067 Evaluar comprensión — P1

El tutor podrá formular preguntas y corregir respuestas.

### FR-068 Mantener contexto — P1

El tutor conservará materia, clase y tema actuales.

### FR-069 Reconocer incertidumbre — P0

El sistema deberá indicar cuando el contexto no sea suficiente.

---

## Funciones futuras

### FR-070 Múltiples usuarios — P2
### FR-071 Carga de audios — P2
### FR-072 Transcripción automática — P2
### FR-073 Profesores y administradores — P2
### FR-074 Contenido compartido — P2
### FR-075 Aplicación móvil — P2
### FR-076 Otras carreras — P2
### FR-077 Pagos o suscripciones — P2

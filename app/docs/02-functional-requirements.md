# Requisitos funcionales

## Objetivo

Este documento define las funciones que deberá ofrecer CENEVAL Study App.

Cada requisito describe una acción que el usuario podrá realizar dentro de la aplicación.

---

## 1. Gestión de materias

### FR-001 Crear una materia

El usuario podrá crear una materia de estudio.

Ejemplos:

- Derecho Civil
- Derecho Constitucional
- Derecho Penal
- Derecho Administrativo
- Derecho Laboral

### FR-002 Editar una materia

El usuario podrá modificar el nombre o la descripción de una materia.

### FR-003 Eliminar una materia

El usuario podrá eliminar una materia.

Antes de eliminarla, la aplicación deberá solicitar confirmación.

### FR-004 Consultar materias

El usuario podrá ver una lista de todas sus materias.

### FR-005 Ver progreso por materia

La aplicación mostrará el progreso del estudiante en cada materia.

---

## 2. Gestión de clases

### FR-006 Crear una clase

El usuario podrá crear una clase dentro de una materia.

La clase podrá incluir:

- nombre;
- fecha;
- profesor;
- descripción;
- transcripción;
- estado de procesamiento.

### FR-007 Editar una clase

El usuario podrá modificar la información de una clase.

### FR-008 Eliminar una clase

El usuario podrá eliminar una clase después de confirmar la acción.

### FR-009 Consultar clases

El usuario podrá ver todas las clases de una materia.

### FR-010 Cambiar una clase de materia

El usuario podrá mover una clase de una materia a otra.

---

## 3. Gestión de transcripciones

### FR-011 Pegar una transcripción

El usuario podrá pegar manualmente una transcripción completa.

### FR-012 Guardar la transcripción original

La aplicación conservará una copia sin modificar del texto original.

### FR-013 Generar una versión limpia

La inteligencia artificial podrá:

- eliminar repeticiones;
- corregir errores evidentes;
- organizar párrafos;
- agregar puntuación;
- conservar el significado original.

### FR-014 Editar la transcripción limpia

El usuario podrá modificar manualmente la versión limpia.

### FR-015 Comparar versiones

El usuario podrá consultar:

- la transcripción original;
- la transcripción limpia.

---

## 4. Detección y organización de temas

### FR-016 Detectar la materia

La aplicación propondrá la materia correspondiente a la transcripción.

### FR-017 Detectar temas

La aplicación identificará los temas principales de la clase.

### FR-018 Crear temas manualmente

El usuario podrá crear temas sin usar inteligencia artificial.

### FR-019 Editar un tema

El usuario podrá modificar el nombre y la descripción de un tema.

### FR-020 Eliminar un tema

El usuario podrá eliminar un tema después de confirmar la acción.

### FR-021 Reordenar temas

El usuario podrá cambiar el orden de los temas de una clase.

### FR-022 Aprobar temas propuestos

Los temas generados por inteligencia artificial deberán poder revisarse antes de guardarse definitivamente.

---

## 5. Generación de material de estudio

### FR-023 Crear respuesta corta

La aplicación generará una explicación breve de dos o tres líneas.

### FR-024 Crear explicación completa

La aplicación generará una explicación que incluya:

- qué es;
- para qué sirve;
- por qué es importante;
- cómo funciona;
- cuándo se utiliza;
- errores comunes;
- cómo podría aparecer en el CENEVAL.

### FR-025 Crear ejemplo sencillo

La aplicación generará un ejemplo cotidiano.

### FR-026 Crear ejemplo tipo CENEVAL

La aplicación generará una pregunta similar a las del examen.

### FR-027 Crear resumen

La aplicación generará un resumen con máximo cinco puntos clave.

### FR-028 Crear tabla comparativa

Cuando un concepto se confunda con otro, la aplicación generará una comparación.

### FR-029 Crear reglas mnemotécnicas

La aplicación podrá generar técnicas para memorizar conceptos.

### FR-030 Identificar palabras clave

La aplicación mostrará los términos más importantes de cada tema.

### FR-031 Identificar errores comunes

La aplicación explicará los errores que suelen cometer los estudiantes.

### FR-032 Indicar importancia del tema

La aplicación clasificará la frecuencia estimada del tema:

- alta;
- media;
- baja.

### FR-033 Indicar dificultad del tema

La aplicación clasificará la dificultad:

- básica;
- intermedia;
- avanzada.

### FR-034 Recomendar tiempo de estudio

La aplicación propondrá un tiempo estimado para estudiar el tema.

### FR-035 Mostrar temas relacionados

La aplicación recomendará temas que deben estudiarse antes o después.

### FR-036 Editar el material generado

El usuario podrá modificar cualquier contenido generado por inteligencia artificial.

### FR-037 Regenerar una sección

El usuario podrá volver a generar solamente una sección específica.

Ejemplos:

- regenerar el resumen;
- regenerar los ejemplos;
- regenerar la tabla comparativa.

---

## 6. Flashcards

### FR-038 Generar flashcards

La aplicación podrá crear flashcards a partir de cada tema.

### FR-039 Crear flashcards manualmente

El usuario podrá agregar preguntas y respuestas manualmente.

### FR-040 Editar flashcards

El usuario podrá modificar una flashcard.

### FR-041 Eliminar flashcards

El usuario podrá eliminar una flashcard.

### FR-042 Responder flashcards

La aplicación mostrará una pregunta y permitirá revelar la respuesta.

### FR-043 Evaluar dificultad

Después de responder, el usuario podrá marcar la flashcard como:

- fácil;
- regular;
- difícil.

### FR-044 Programar repaso

La aplicación podrá asignar una fecha de próximo repaso.

---

## 7. Exámenes

### FR-045 Generar mini exámenes

La aplicación podrá crear exámenes por:

- tema;
- clase;
- materia;
- dificultad.

### FR-046 Configurar número de preguntas

El usuario podrá seleccionar cuántas preguntas desea responder.

### FR-047 Mostrar opciones múltiples

Las preguntas podrán contener diferentes opciones de respuesta.

### FR-048 Guardar la respuesta seleccionada

La aplicación registrará la opción elegida por el usuario.

### FR-049 Calificar el examen

La aplicación calculará:

- número de respuestas correctas;
- número de respuestas incorrectas;
- porcentaje obtenido.

### FR-050 Explicar la respuesta correcta

La aplicación explicará por qué una respuesta es correcta.

### FR-051 Explicar las respuestas incorrectas

La aplicación explicará por qué las demás opciones no son correctas.

### FR-052 Guardar intentos

La aplicación conservará el historial de cada examen.

### FR-053 Repetir un examen

El usuario podrá volver a contestar un examen anterior.

### FR-054 Generar preguntas nuevas

El usuario podrá solicitar una nueva versión del examen.

---

## 8. Seguimiento de progreso

### FR-055 Guardar resultados

La aplicación guardará los resultados de flashcards y exámenes.

### FR-056 Identificar temas dominados

Un tema podrá marcarse como dominado cuando el estudiante obtenga buenos resultados de forma constante.

### FR-057 Identificar temas débiles

La aplicación detectará temas con errores frecuentes.

### FR-058 Mostrar avance general

El dashboard mostrará el progreso total del estudiante.

### FR-059 Mostrar avance por materia

Cada materia tendrá su propio porcentaje de avance.

### FR-060 Mostrar historial

El usuario podrá consultar sus resultados anteriores.

### FR-061 Mostrar errores recurrentes

La aplicación identificará conceptos en los que el estudiante se equivoca repetidamente.

### FR-062 Recomendar el siguiente tema

La aplicación propondrá qué estudiar después.

---

## 9. Búsqueda

### FR-063 Buscar contenido

El usuario podrá buscar por:

- materia;
- clase;
- tema;
- concepto;
- palabra clave.

### FR-064 Filtrar resultados

El usuario podrá filtrar por:

- materia;
- tipo de contenido;
- dificultad;
- estado de dominio.

### FR-065 Abrir el resultado

Al seleccionar un resultado, la aplicación llevará al contenido correspondiente.

---

## 10. Calendario de estudio

### FR-066 Crear sesiones de estudio

El usuario podrá programar una sesión.

### FR-067 Seleccionar temas para una sesión

Cada sesión podrá incluir uno o varios temas.

### FR-068 Marcar una sesión como completada

El usuario podrá registrar que terminó una sesión.

### FR-069 Reprogramar una sesión

El usuario podrá cambiar la fecha de una sesión.

### FR-070 Mostrar repasos pendientes

La aplicación mostrará qué contenidos deben repasarse ese día.

---

## 11. Tutor con inteligencia artificial

### FR-071 Hacer preguntas al tutor

El usuario podrá escribir preguntas sobre un tema.

### FR-072 Responder con base en el material

El tutor utilizará las transcripciones y los apuntes guardados.

### FR-073 Cambiar el nivel de explicación

El usuario podrá solicitar una explicación:

- más sencilla;
- más detallada;
- con analogías;
- con ejemplos;
- con tabla;
- con diagrama.

### FR-074 Evaluar comprensión

El tutor podrá realizar preguntas rápidas después de una explicación.

### FR-075 Corregir razonamientos

El tutor podrá señalar errores y explicar por qué son incorrectos.

### FR-076 Mantener contexto por tema

El tutor deberá conservar el contexto de la materia, clase y tema actuales.

---

## 12. Control del contenido generado

### FR-077 Revisar antes de guardar

El contenido generado por inteligencia artificial podrá revisarse antes de aprobarse.

### FR-078 Aprobar contenido

El usuario podrá aceptar el contenido propuesto.

### FR-079 Rechazar contenido

El usuario podrá descartar una generación incorrecta.

### FR-080 Guardar versiones

La aplicación podrá mantener versiones anteriores del material.

### FR-081 Mostrar la fuente

El usuario podrá consultar la transcripción utilizada para generar el contenido.

---

## 13. Cuenta de usuario

### FR-082 Acceder a la aplicación

La primera versión podrá funcionar con una sola cuenta.

### FR-083 Cerrar sesión

Cuando se agregue autenticación, el usuario podrá cerrar sesión.

### FR-084 Recuperar contraseña

En una versión multiusuario, el usuario podrá recuperar su contraseña.

### FR-085 Eliminar cuenta

En una versión futura, el usuario podrá solicitar la eliminación de su cuenta.

---

## 14. Funciones futuras

Las siguientes funciones no forman parte de la primera entrega:

- carga directa de audios;
- transcripción automática;
- múltiples usuarios;
- profesores;
- grupos de estudio;
- contenido compartido;
- aplicación móvil;
- soporte para otras carreras;
- notificaciones avanzadas;
- pagos o suscripciones.

---

## Prioridad de implementación

### Prioridad 1: organización básica

- materias;
- clases;
- temas;
- transcripciones;
- búsqueda.

### Prioridad 2: material de estudio

- explicaciones;
- resúmenes;
- conceptos;
- ejemplos;
- tablas;
- mnemotecnias.

### Prioridad 3: evaluación

- flashcards;
- mini exámenes;
- resultados;
- retroalimentación.

### Prioridad 4: seguimiento

- temas débiles;
- temas dominados;
- progreso;
- recomendaciones.

### Prioridad 5: funciones avanzadas

- calendario;
- tutor con inteligencia artificial;
- audios;
- múltiples usuarios.
# Historias de usuario

## Objetivo

Este documento describe cómo utilizará la aplicación una persona que se prepara para el CENEVAL de Derecho.

Cada historia se escribe desde la perspectiva del estudiante.

---

## Épica 1: Organización de materias

### US-001 Crear una materia

Como estudiante,
quiero crear una materia,
para organizar mis clases según el área de Derecho correspondiente.

#### Criterios de aceptación

- El usuario puede escribir el nombre de la materia.
- El usuario puede agregar una descripción.
- La materia aparece en la lista principal.
- La información permanece guardada al recargar la página.

---

### US-002 Ver mis materias

Como estudiante,
quiero ver todas mis materias,
para saber qué áreas estoy estudiando.

#### Criterios de aceptación

- La aplicación muestra todas las materias creadas.
- Cada materia muestra su nombre.
- Cada materia permite abrir sus clases.
- La lista muestra un mensaje cuando no existen materias.

---

### US-003 Editar una materia

Como estudiante,
quiero cambiar el nombre o la descripción de una materia,
para corregir errores o mantenerla actualizada.

#### Criterios de aceptación

- El usuario puede abrir la opción de edición.
- La aplicación muestra la información actual.
- El usuario puede guardar los cambios.
- Los cambios aparecen inmediatamente.

---

### US-004 Eliminar una materia

Como estudiante,
quiero eliminar una materia,
para retirar contenido que ya no necesito.

#### Criterios de aceptación

- La aplicación solicita confirmación.
- La materia no se elimina sin confirmar.
- Después de eliminarla, deja de aparecer en la lista.
- La aplicación informa qué ocurrirá con sus clases.

---

## Épica 2: Organización de clases

### US-005 Crear una clase

Como estudiante,
quiero crear una clase dentro de una materia,
para guardar el contenido estudiado en una sesión.

#### Criterios de aceptación

- El usuario puede escribir un título.
- El usuario puede seleccionar una materia.
- El usuario puede registrar la fecha.
- La clase aparece dentro de la materia seleccionada.

---

### US-006 Ver las clases de una materia

Como estudiante,
quiero consultar las clases de una materia,
para regresar fácilmente a un tema anterior.

#### Criterios de aceptación

- La aplicación muestra las clases de la materia.
- Las clases aparecen ordenadas.
- Cada clase muestra nombre y fecha.
- El usuario puede abrir cualquier clase.

---

### US-007 Editar una clase

Como estudiante,
quiero modificar la información de una clase,
para corregir su título, fecha o descripción.

#### Criterios de aceptación

- La aplicación muestra los datos actuales.
- El usuario puede guardar los cambios.
- Los cambios permanecen después de recargar.

---

### US-008 Eliminar una clase

Como estudiante,
quiero eliminar una clase,
para retirar contenido incorrecto o duplicado.

#### Criterios de aceptación

- La aplicación solicita confirmación.
- La clase no se elimina accidentalmente.
- Después de eliminarla, deja de aparecer.

---

## Épica 3: Transcripciones

### US-009 Pegar una transcripción

Como estudiante,
quiero pegar la transcripción de una clase,
para convertirla en material de estudio.

#### Criterios de aceptación

- El usuario puede pegar un texto largo.
- La aplicación permite revisar el contenido.
- El usuario puede guardar la transcripción.
- La transcripción queda vinculada a una clase.

---

### US-010 Conservar la transcripción original

Como estudiante,
quiero que la aplicación conserve el texto original,
para poder verificar qué dijo realmente el profesor.

#### Criterios de aceptación

- El texto original no se modifica.
- La aplicación distingue entre original y limpio.
- El usuario puede consultar ambas versiones.

---

### US-011 Limpiar una transcripción

Como estudiante,
quiero que la inteligencia artificial organice la transcripción,
para leerla con mayor claridad.

#### Criterios de aceptación

- La aplicación elimina repeticiones innecesarias.
- La aplicación mejora puntuación y estructura.
- No cambia el significado del contenido.
- El usuario puede revisar el resultado antes de aprobarlo.

---

## Épica 4: Temas

### US-012 Detectar temas automáticamente

Como estudiante,
quiero que la aplicación identifique los temas de una clase,
para no tener que organizarlos manualmente.

#### Criterios de aceptación

- La aplicación propone una lista de temas.
- Cada tema tiene un nombre claro.
- El usuario puede aprobar, editar o eliminar cada propuesta.
- Los temas quedan vinculados a la clase.

---

### US-013 Crear un tema manualmente

Como estudiante,
quiero crear un tema manualmente,
para agregar contenido que la inteligencia artificial no detectó.

#### Criterios de aceptación

- El usuario puede escribir el nombre del tema.
- Puede agregar una descripción.
- El tema aparece dentro de la clase.

---

### US-014 Reordenar temas

Como estudiante,
quiero cambiar el orden de los temas,
para seguir la secuencia correcta de la clase.

#### Criterios de aceptación

- El usuario puede mover los temas.
- El nuevo orden se guarda.
- El orden permanece al recargar.

---

## Épica 5: Material de estudio

### US-015 Generar una explicación completa

Como estudiante,
quiero obtener una explicación clara de cada tema,
para comprenderlo desde cero.

#### Criterios de aceptación

La explicación incluye:

- respuesta corta;
- definición;
- utilidad;
- importancia;
- funcionamiento;
- errores comunes;
- aparición probable en el CENEVAL.

---

### US-016 Generar ejemplos

Como estudiante,
quiero ver ejemplos sencillos y preguntas tipo CENEVAL,
para entender la teoría y aplicarla.

#### Criterios de aceptación

- La aplicación genera un ejemplo cotidiano.
- Genera al menos un ejemplo tipo examen.
- Explica la respuesta correcta.
- Evita ejemplos contradictorios con la transcripción.

---

### US-017 Generar un resumen

Como estudiante,
quiero obtener un resumen corto,
para repasar rápidamente antes del examen.

#### Criterios de aceptación

- El resumen tiene máximo cinco puntos principales.
- Incluye las ideas esenciales.
- Evita información secundaria.
- Puede editarse manualmente.

---

### US-018 Generar tablas comparativas

Como estudiante,
quiero comparar conceptos similares,
para evitar confundirlos en el examen.

#### Criterios de aceptación

- La aplicación identifica conceptos confundibles.
- Muestra diferencias claras.
- Incluye palabras clave.
- La tabla es fácil de leer.

---

### US-019 Generar técnicas de memorización

Como estudiante,
quiero recibir reglas mnemotécnicas,
para recordar conceptos importantes.

#### Criterios de aceptación

- La técnica se relaciona con el concepto.
- Es sencilla de recordar.
- No sustituye la explicación completa.
- El usuario puede editarla.

---

### US-020 Regenerar una sección

Como estudiante,
quiero regenerar solo una parte del material,
para mejorarla sin perder el resto.

#### Criterios de aceptación

- El usuario puede seleccionar una sección.
- Solo la sección seleccionada cambia.
- La versión anterior puede conservarse.
- El usuario puede aceptar o rechazar el cambio.

---

## Épica 6: Flashcards

### US-021 Generar flashcards

Como estudiante,
quiero generar tarjetas de pregunta y respuesta,
para memorizar conceptos importantes.

#### Criterios de aceptación

- Cada tarjeta contiene pregunta y respuesta.
- Las tarjetas están relacionadas con el tema.
- El usuario puede editarlas.
- El usuario puede eliminarlas.

---

### US-022 Estudiar con flashcards

Como estudiante,
quiero responder flashcards,
para comprobar qué conceptos recuerdo.

#### Criterios de aceptación

- Primero aparece la pregunta.
- El usuario puede revelar la respuesta.
- Puede clasificarla como fácil, regular o difícil.
- La aplicación registra la respuesta.

---

### US-023 Programar repasos

Como estudiante,
quiero recibir flashcards según mi dificultad,
para repasar con mayor frecuencia lo que menos domino.

#### Criterios de aceptación

- Las tarjetas difíciles aparecen antes.
- Las fáciles tardan más en repetirse.
- La aplicación guarda la próxima fecha de repaso.
- El usuario puede ver las tarjetas pendientes.

---

## Épica 7: Exámenes

### US-024 Crear un mini examen

Como estudiante,
quiero generar un examen de un tema,
para medir mi comprensión.

#### Criterios de aceptación

- El usuario selecciona tema y dificultad.
- Puede elegir la cantidad de preguntas.
- Las preguntas tienen opciones.
- Solo existe una respuesta correcta, salvo que se indique lo contrario.

---

### US-025 Responder un examen

Como estudiante,
quiero seleccionar respuestas,
para evaluar lo que aprendí.

#### Criterios de aceptación

- La aplicación guarda cada respuesta.
- El usuario puede avanzar y retroceder.
- Puede terminar el examen.
- No pierde respuestas al cambiar de pregunta.

---

### US-026 Revisar resultados

Como estudiante,
quiero ver mi calificación y mis errores,
para saber qué necesito repasar.

#### Criterios de aceptación

- Muestra respuestas correctas e incorrectas.
- Muestra el porcentaje obtenido.
- Explica por qué la respuesta correcta lo es.
- Explica por qué las otras opciones son incorrectas.

---

### US-027 Repetir un examen

Como estudiante,
quiero volver a realizar un examen,
para comprobar si mejoré.

#### Criterios de aceptación

- El usuario puede iniciar un nuevo intento.
- El intento anterior no se pierde.
- La aplicación compara resultados.
- Puede generar preguntas nuevas.

---

## Épica 8: Progreso

### US-028 Ver mi progreso general

Como estudiante,
quiero ver mi avance,
para saber cuánto he estudiado.

#### Criterios de aceptación

- El dashboard muestra el avance general.
- Muestra materias estudiadas.
- Muestra temas dominados y pendientes.
- Muestra resultados recientes.

---

### US-029 Detectar temas débiles

Como estudiante,
quiero conocer los temas donde cometo más errores,
para concentrar mi estudio.

#### Criterios de aceptación

- La aplicación analiza resultados.
- Identifica errores recurrentes.
- Muestra los temas débiles.
- Recomienda acciones de repaso.

---

### US-030 Marcar temas dominados

Como estudiante,
quiero saber qué temas ya domino,
para no dedicarles tiempo innecesario.

#### Criterios de aceptación

- El dominio se basa en resultados.
- El usuario también puede marcarlo manualmente.
- La aplicación puede retirar el dominio si empeora el desempeño.
- El estado se muestra claramente.

---

## Épica 9: Búsqueda

### US-031 Buscar un tema

Como estudiante,
quiero buscar palabras o conceptos,
para encontrar rápidamente material anterior.

#### Criterios de aceptación

- El buscador acepta texto.
- Busca en materias, clases, temas y apuntes.
- Muestra resultados relevantes.
- Cada resultado abre el contenido correspondiente.

---

### US-032 Filtrar resultados

Como estudiante,
quiero filtrar la búsqueda,
para reducir los resultados.

#### Criterios de aceptación

- Se puede filtrar por materia.
- Se puede filtrar por dificultad.
- Se puede filtrar por estado de dominio.
- Los filtros pueden limpiarse.

---

## Épica 10: Calendario

### US-033 Programar una sesión

Como estudiante,
quiero programar una sesión de estudio,
para organizar mi preparación.

#### Criterios de aceptación

- El usuario selecciona fecha y hora.
- Puede elegir uno o varios temas.
- Puede añadir una duración estimada.
- La sesión aparece en el calendario.

---

### US-034 Ver repasos pendientes

Como estudiante,
quiero ver qué debo repasar hoy,
para cumplir mi plan de estudio.

#### Criterios de aceptación

- La aplicación muestra los repasos del día.
- Ordena primero los temas más débiles.
- Permite marcar un repaso como completado.
- Permite reprogramarlo.

---

## Épica 11: Tutor de inteligencia artificial

### US-035 Preguntar al tutor

Como estudiante,
quiero hacer preguntas sobre un tema,
para resolver dudas inmediatamente.

#### Criterios de aceptación

- El tutor conoce la materia y el tema actuales.
- Usa la transcripción y los apuntes disponibles.
- Distingue entre información de la clase y explicación complementaria.
- Evita inventar información cuando no tiene suficiente contexto.

---

### US-036 Solicitar otra explicación

Como estudiante,
quiero pedir una explicación diferente,
para entender un tema que todavía me confunde.

#### Criterios de aceptación

El usuario puede solicitar:

- explicación más sencilla;
- explicación más técnica;
- analogía;
- ejemplo nuevo;
- tabla comparativa;
- diagrama;
- explicación paso a paso.

---

### US-037 Comprobar mi comprensión

Como estudiante,
quiero que el tutor me haga preguntas rápidas,
para comprobar que realmente entendí.

#### Criterios de aceptación

- El tutor realiza una o dos preguntas.
- Espera la respuesta del estudiante.
- Corrige respetuosamente.
- Explica los errores.
- Adapta la siguiente pregunta según el desempeño.

---

## Priorización

### Primera entrega

- US-001 Crear materia.
- US-002 Ver materias.
- US-005 Crear clase.
- US-006 Ver clases.
- US-009 Pegar transcripción.
- US-010 Conservar texto original.
- US-012 Detectar temas.
- US-015 Generar explicación.
- US-017 Generar resumen.
- US-021 Generar flashcards.
- US-024 Crear mini examen.
- US-026 Revisar resultados.
- US-031 Buscar contenido.

### Segunda entrega

- edición y eliminación;
- tablas comparativas;
- mnemotecnias;
- programación de repasos;
- progreso;
- temas débiles;
- tutor de inteligencia artificial.

### Entregas futuras

- carga de audios;
- transcripción automática;
- múltiples usuarios;
- profesores;
- contenido compartido;
- aplicación móvil.
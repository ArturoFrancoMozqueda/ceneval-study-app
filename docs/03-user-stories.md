# Historias de usuario

## Historias del modelo editorial

### US-064 Acceder como estudiante

Como estudiante quiero crear una cuenta e iniciar sesión para conservar mi
avance.

**Aceptación:** el correo se confirma, la sesión se conserva de forma segura y
puedo recuperar mi contraseña.

### US-065 Encontrar clases terminadas

Como estudiante quiero abrir una biblioteca con clases ya estructuradas para
estudiar sin tener que cargar u organizar transcripciones.

**Aceptación:** solo aparecen clases publicadas y cada tema contiene todas las
secciones acordadas.

### US-066 Revisar antes de publicar

Como administradora quiero ver un borrador idéntico a la lección final para
aprobar su publicación.

**Aceptación:** puedo cambiar entre borrador, revisión y publicación; una clase
incompleta no se publica.

### US-067 Consultar origen y referencias

Como estudiante quiero distinguir lo dicho en clase de la explicación
complementaria y consultar fuentes oficiales.

**Aceptación:** cada sección indica su origen y la transcripción original
permanece disponible.

### US-068 Estudiar con varios recursos

Como estudiante quiero alternar entre explicación, mapa, guía, flashcards,
examen y fuente.

**Aceptación:** las seis secciones funcionan en móvil y escritorio.

### US-069 Conservar progreso privado

Como estudiante quiero que mis repasos e intentos se guarden sin que otras
personas puedan verlos.

**Aceptación:** RLS limita cada registro a su propietario.

## Objetivo

Este documento describe cómo una persona que se prepara para el CENEVAL de Derecho utilizará la aplicación.

## Formato

Cada historia contiene:

- identificador;
- necesidad del estudiante;
- beneficio;
- criterios de aceptación;
- prioridad.

---

# Épica 1: Materias

## US-001 Crear una materia

Como estudiante, quiero crear una materia para organizar mis clases según el área de Derecho correspondiente.

**Prioridad:** P0

### Criterios de aceptación

- El usuario puede escribir un nombre.
- Puede agregar una descripción opcional.
- No se permite guardar un nombre vacío.
- La materia aparece en la lista.
- La materia permanece después de recargar la página.

## US-002 Consultar materias

Como estudiante, quiero ver todas mis materias para saber qué áreas estoy estudiando.

**Prioridad:** P0

### Criterios de aceptación

- Se muestran todas las materias guardadas.
- Cada materia muestra nombre y número de clases.
- El usuario puede abrir una materia.
- Si no existen materias, se muestra un estado vacío comprensible.

## US-003 Editar una materia

Como estudiante, quiero editar una materia para corregir o actualizar su información.

**Prioridad:** P1

### Criterios de aceptación

- El formulario muestra los datos actuales.
- El usuario puede guardar o cancelar.
- Los cambios aparecen inmediatamente.
- Los cambios permanecen después de recargar.

## US-004 Eliminar una materia

Como estudiante, quiero eliminar una materia para retirar contenido que ya no necesito.

**Prioridad:** P1

### Criterios de aceptación

- La aplicación solicita confirmación.
- Informa si existen clases relacionadas.
- No elimina sin confirmación.
- Después de eliminar, la materia deja de aparecer.

## US-005 Ver progreso por materia

Como estudiante, quiero ver mi progreso por materia para identificar dónde necesito concentrarme.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran temas estudiados y pendientes.
- Se muestran resultados recientes.
- Se muestran temas débiles.
- No se inventa un porcentaje cuando no hay actividad suficiente.

---

# Épica 2: Clases

## US-006 Crear una clase

Como estudiante, quiero crear una clase dentro de una materia para guardar una sesión de estudio.

**Prioridad:** P0

### Criterios de aceptación

- El usuario escribe un título.
- Selecciona una materia.
- Puede registrar fecha, profesor y descripción.
- La clase aparece dentro de la materia.
- La clase permanece después de recargar.

## US-007 Consultar clases

Como estudiante, quiero consultar las clases de una materia para regresar a contenido anterior.

**Prioridad:** P0

### Criterios de aceptación

- Se muestran las clases de la materia.
- Cada clase muestra título y fecha.
- El usuario puede abrir cualquier clase.
- Existe un estado vacío cuando no hay clases.

## US-008 Editar una clase

Como estudiante, quiero editar una clase para corregir su información.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran los datos actuales.
- El usuario puede guardar o cancelar.
- Los cambios persisten.

## US-009 Eliminar una clase

Como estudiante, quiero eliminar una clase incorrecta o duplicada.

**Prioridad:** P1

### Criterios de aceptación

- Se solicita confirmación.
- Se informa el impacto sobre temas y materiales.
- La clase no se elimina accidentalmente.
- Al confirmar, deja de aparecer.

## US-010 Mover una clase

Como estudiante, quiero mover una clase a otra materia para corregir su organización.

**Prioridad:** P1

### Criterios de aceptación

- El usuario puede seleccionar otra materia.
- Se muestra confirmación del cambio.
- La clase deja de aparecer en la materia anterior.
- La clase aparece en la nueva materia sin perder contenido.

---

# Épica 3: Transcripciones

## US-011 Pegar una transcripción

Como estudiante, quiero pegar la transcripción de una clase para convertirla en material de estudio.

**Prioridad:** P0

### Criterios de aceptación

- El campo acepta texto largo.
- El usuario puede revisar antes de guardar.
- La transcripción se asocia a una clase.
- Se informa cuando el campo está vacío.
- El texto permanece guardado.

## US-012 Conservar la transcripción original

Como estudiante, quiero conservar el texto original para verificar lo que realmente se dijo.

**Prioridad:** P0

### Criterios de aceptación

- La versión original no se modifica al limpiar el texto.
- Se registra de forma independiente.
- El usuario puede consultarla.
- Las regeneraciones no la reemplazan.

## US-013 Generar una versión limpia

Como estudiante, quiero limpiar la transcripción para leerla con mayor claridad.

**Prioridad:** P0

### Criterios de aceptación

- Se mejora puntuación y separación de párrafos.
- Se reducen repeticiones evidentes.
- No se cambia intencionalmente el significado.
- La versión se presenta para revisión.
- Se indica cuando el procesamiento falla.

## US-014 Comparar versiones

Como estudiante, quiero comparar el texto original y el limpio para detectar cambios incorrectos.

**Prioridad:** P1

### Criterios de aceptación

- El usuario puede alternar entre ambas versiones.
- Cada versión está claramente identificada.
- La original permanece en modo de solo lectura.
- La versión limpia puede editarse.

## US-015 Editar la versión limpia

Como estudiante, quiero corregir la versión limpia para asegurar que representa correctamente la clase.

**Prioridad:** P1

### Criterios de aceptación

- El usuario puede modificar el texto.
- Puede guardar o cancelar.
- El original no cambia.
- Se conserva la versión más reciente.

---

# Épica 4: Temas

## US-016 Detectar temas

Como estudiante, quiero que la aplicación detecte los temas de una clase para no organizarlos desde cero.

**Prioridad:** P0

### Criterios de aceptación

- Se propone una lista de temas.
- Cada propuesta tiene un nombre claro.
- Los temas se basan en la transcripción.
- El usuario puede revisar antes de guardar.
- Se informa si no existen datos suficientes.

## US-017 Aprobar temas propuestos

Como estudiante, quiero aprobar, editar o rechazar temas para controlar la organización final.

**Prioridad:** P0

### Criterios de aceptación

- Cada tema puede aprobarse o rechazarse.
- El nombre puede editarse.
- Solo los temas aprobados se guardan.
- Cancelar no modifica la estructura existente.

## US-018 Crear un tema manualmente

Como estudiante, quiero crear un tema que la aplicación no detectó.

**Prioridad:** P1

### Criterios de aceptación

- Se puede escribir nombre y descripción.
- No se permite un nombre vacío.
- El tema se asocia a la clase.
- Aparece en la lista de temas.

## US-019 Editar un tema

Como estudiante, quiero editar un tema para corregir su nombre o descripción.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran los datos actuales.
- El usuario puede guardar o cancelar.
- El cambio no elimina materiales relacionados.

## US-020 Eliminar un tema

Como estudiante, quiero eliminar un tema incorrecto.

**Prioridad:** P1

### Criterios de aceptación

- Se solicita confirmación.
- Se informa si existen materiales o resultados asociados.
- La eliminación no ocurre sin confirmar.

## US-021 Reordenar temas

Como estudiante, quiero reordenar los temas para seguir una secuencia lógica.

**Prioridad:** P1

### Criterios de aceptación

- El usuario puede cambiar la posición.
- El nuevo orden se guarda.
- El orden permanece después de recargar.

---

# Épica 5: Material de estudio

## US-022 Generar una respuesta breve

Como estudiante, quiero una respuesta corta para repasar rápidamente la idea principal.

**Prioridad:** P0

### Criterios de aceptación

- La respuesta contiene dos o tres líneas.
- Responde directamente qué es el concepto.
- No contradice la transcripción.
- Puede editarse.

## US-023 Generar una explicación completa

Como estudiante, quiero una explicación completa desde cero para comprender el tema.

**Prioridad:** P0

### Criterios de aceptación

La explicación puede incluir:

- definición;
- utilidad;
- importancia;
- funcionamiento;
- cuándo se utiliza;
- errores comunes;
- posible aparición en CENEVAL.

Además:

- utiliza lenguaje claro;
- diferencia información de la clase y explicación complementaria;
- puede editarse;
- muestra error cuando no puede generarse.

## US-024 Generar un ejemplo cotidiano

Como estudiante, quiero un ejemplo sencillo para conectar la teoría con una situación fácil de entender.

**Prioridad:** P0

### Criterios de aceptación

- El ejemplo corresponde al concepto.
- Usa lenguaje sencillo.
- No sustituye la definición jurídica.
- Puede regenerarse.

## US-025 Generar un ejemplo tipo CENEVAL

Como estudiante, quiero un ejemplo tipo examen para practicar la aplicación del concepto.

**Prioridad:** P0

### Criterios de aceptación

- Presenta una situación o caso.
- Incluye una pregunta clara.
- Incluye opciones cuando corresponde.
- Identifica la respuesta correcta.
- Explica el razonamiento.

## US-026 Generar un resumen

Como estudiante, quiero un resumen para repasar las ideas esenciales.

**Prioridad:** P0

### Criterios de aceptación

- Contiene las ideas principales.
- Evita detalles secundarios.
- Es más corto que la explicación.
- Puede editarse o regenerarse.

## US-027 Generar una tabla comparativa

Como estudiante, quiero comparar conceptos similares para no confundirlos.

**Prioridad:** P1

### Criterios de aceptación

- La tabla identifica conceptos comparados.
- Incluye diferencias relevantes.
- Incluye palabras clave.
- Puede leerse correctamente en pantalla pequeña.

## US-028 Generar una regla mnemotécnica

Como estudiante, quiero una técnica de memoria para recordar elementos importantes.

**Prioridad:** P1

### Criterios de aceptación

- La técnica se relaciona con el tema.
- Es fácil de recordar.
- No contiene información jurídica incorrecta.
- Puede editarse o descartarse.

## US-029 Identificar errores comunes

Como estudiante, quiero conocer errores frecuentes para evitarlos en el examen.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran confusiones concretas.
- Cada error incluye una corrección.
- No se presentan afirmaciones sin fundamento como reglas absolutas.

## US-030 Mostrar dificultad e importancia

Como estudiante, quiero conocer la dificultad e importancia estimadas para organizar mi tiempo.

**Prioridad:** P1

### Criterios de aceptación

- La dificultad usa niveles definidos.
- La importancia usa niveles definidos.
- Se indica que la frecuencia del examen es una estimación cuando no existe fuente oficial.
- El usuario puede modificar las etiquetas.

## US-031 Regenerar una sección

Como estudiante, quiero regenerar una parte específica sin perder el resto del material.

**Prioridad:** P1

### Criterios de aceptación

- El usuario selecciona la sección.
- Solo esa sección cambia.
- Puede comparar antes de aceptar.
- Puede conservar la versión anterior.

## US-032 Editar contenido generado

Como estudiante, quiero editar el contenido para corregir o personalizar mis apuntes.

**Prioridad:** P0

### Criterios de aceptación

- Todas las secciones editables muestran una acción clara.
- El usuario puede guardar o cancelar.
- Se identifica el contenido modificado manualmente.
- La fuente original permanece disponible.

---

# Épica 6: Flashcards

## US-033 Generar flashcards

Como estudiante, quiero generar flashcards para memorizar conceptos.

**Prioridad:** P0

### Criterios de aceptación

- Cada tarjeta tiene pregunta y respuesta.
- Las tarjetas se relacionan con un tema.
- Se pueden revisar antes de guardar.
- No se generan tarjetas duplicadas evidentes.

## US-034 Crear una flashcard manual

Como estudiante, quiero crear una flashcard para agregar algo que considero importante.

**Prioridad:** P1

### Criterios de aceptación

- Se puede escribir pregunta y respuesta.
- Ninguno de los campos puede quedar vacío.
- La tarjeta se asocia a un tema.

## US-035 Estudiar con flashcards

Como estudiante, quiero estudiar tarjetas para comprobar qué recuerdo.

**Prioridad:** P0

### Criterios de aceptación

- Primero se muestra la pregunta.
- La respuesta se revela mediante una acción.
- El avance de la sesión es visible.
- Se registra que la tarjeta fue revisada.

## US-036 Clasificar una flashcard

Como estudiante, quiero marcar una tarjeta como fácil, regular o difícil para ajustar mis repasos.

**Prioridad:** P1

### Criterios de aceptación

- Las tres opciones están disponibles.
- La selección se guarda.
- La clasificación influye en el siguiente repaso cuando la repetición espaciada esté activa.

## US-037 Programar repasos

Como estudiante, quiero recibir primero las tarjetas más difíciles.

**Prioridad:** P1

### Criterios de aceptación

- Cada tarjeta puede tener una fecha de próximo repaso.
- Las difíciles reaparecen antes.
- Las fáciles se espacian más.
- El usuario puede ver las tarjetas pendientes.

---

# Épica 7: Exámenes

## US-038 Generar un mini examen

Como estudiante, quiero generar un mini examen para medir mi comprensión.

**Prioridad:** P0

### Criterios de aceptación

- El usuario selecciona un tema.
- La aplicación genera preguntas relacionadas.
- Cada pregunta tiene instrucciones claras.
- Se identifica cuando la generación falla.

## US-039 Configurar dificultad y cantidad

Como estudiante, quiero elegir dificultad y número de preguntas para adaptar la práctica.

**Prioridad:** P0

### Criterios de aceptación

- Existen opciones de dificultad.
- La cantidad se limita a valores válidos.
- La configuración se muestra antes de iniciar.

## US-040 Responder preguntas

Como estudiante, quiero seleccionar respuestas para completar el examen.

**Prioridad:** P0

### Criterios de aceptación

- La selección queda guardada al cambiar de pregunta.
- El usuario puede avanzar y retroceder.
- Se distingue la pregunta actual.
- No puede finalizar accidentalmente sin confirmación cuando hay preguntas vacías.

## US-041 Calificar el examen

Como estudiante, quiero ver mi resultado para conocer mi desempeño.

**Prioridad:** P0

### Criterios de aceptación

- Se muestran aciertos y errores.
- Se muestra el porcentaje.
- El cálculo es consistente con las respuestas guardadas.
- El resultado queda asociado al intento.

## US-042 Explicar respuestas

Como estudiante, quiero comprender por qué una opción es correcta y las demás no.

**Prioridad:** P0

### Criterios de aceptación

- Cada pregunta muestra la respuesta correcta.
- Explica el razonamiento.
- Explica los distractores relevantes.
- Distingue la respuesta del usuario.

## US-043 Consultar historial de intentos

Como estudiante, quiero consultar mis exámenes anteriores para medir mi evolución.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran fecha, tema y calificación.
- Se puede abrir un intento.
- Los intentos anteriores no se sobrescriben.

## US-044 Repetir un examen

Como estudiante, quiero repetir un examen para comprobar si mejoré.

**Prioridad:** P1

### Criterios de aceptación

- Se crea un nuevo intento.
- El anterior permanece.
- Se puede comparar el resultado.
- Existe opción de generar preguntas nuevas.

---

# Épica 8: Progreso

## US-045 Ver progreso general

Como estudiante, quiero ver mi avance para comprender cómo va mi preparación.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran materias activas.
- Se muestran temas estudiados.
- Se muestran resultados recientes.
- Los datos provienen de actividad real.

## US-046 Ver progreso por materia

Como estudiante, quiero ver el progreso de una materia para priorizar mis esfuerzos.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran temas estudiados y pendientes.
- Se muestran resultados de esa materia.
- Se identifican temas débiles.

## US-047 Detectar temas débiles

Como estudiante, quiero detectar temas donde cometo errores para repasarlos.

**Prioridad:** P0

### Criterios de aceptación

- Se analizan resultados disponibles.
- Se explica por qué un tema se considera débil.
- No se clasifica con datos insuficientes sin indicarlo.
- Se ofrece una acción de repaso.

## US-048 Identificar temas dominados

Como estudiante, quiero identificar temas dominados para distribuir mejor mi tiempo.

**Prioridad:** P1

### Criterios de aceptación

- El dominio se basa en reglas documentadas.
- El usuario puede ver la evidencia.
- El estado puede cambiar con resultados posteriores.
- Existe ajuste manual cuando sea necesario.

## US-049 Consultar errores recurrentes

Como estudiante, quiero saber en qué conceptos me equivoco repetidamente.

**Prioridad:** P1

### Criterios de aceptación

- Se agrupan errores por tema o concepto.
- Se muestra cuántas veces ocurrió.
- Se enlaza con material de repaso.

## US-050 Recibir una recomendación

Como estudiante, quiero saber qué estudiar después para no decidirlo sin orientación.

**Prioridad:** P1

### Criterios de aceptación

- La recomendación se basa en progreso y errores.
- Explica brevemente el motivo.
- Permite abrir el tema recomendado.
- No bloquea la elección manual.

---

# Épica 9: Búsqueda

## US-051 Buscar contenido

Como estudiante, quiero buscar materias, clases, temas o conceptos para encontrar información rápidamente.

**Prioridad:** P0

### Criterios de aceptación

- El buscador acepta texto.
- Busca en campos relevantes.
- Los resultados muestran tipo y ubicación.
- Un término sin resultados muestra un mensaje útil.

## US-052 Filtrar resultados

Como estudiante, quiero filtrar resultados para encontrar contenido específico.

**Prioridad:** P1

### Criterios de aceptación

- Se puede filtrar por materia.
- Se puede filtrar por tipo de contenido.
- Se puede filtrar por dificultad o dominio cuando existan esos datos.
- Los filtros pueden limpiarse.

## US-053 Abrir un resultado

Como estudiante, quiero abrir el resultado correcto para consultar su contenido.

**Prioridad:** P0

### Criterios de aceptación

- Cada resultado es seleccionable.
- Abre la pantalla y sección correspondiente.
- Mantiene suficiente contexto para regresar a la búsqueda.

---

# Épica 10: Calendario

## US-054 Programar una sesión

Como estudiante, quiero programar una sesión para organizar mi tiempo.

**Prioridad:** P1

### Criterios de aceptación

- El usuario selecciona fecha y hora.
- Puede agregar duración.
- La sesión aparece en el calendario.
- Se validan fechas y horarios.

## US-055 Seleccionar temas de una sesión

Como estudiante, quiero asociar temas a una sesión para saber qué estudiar.

**Prioridad:** P1

### Criterios de aceptación

- Se puede seleccionar uno o varios temas.
- Los temas aparecen en el detalle de la sesión.
- Se pueden retirar antes de completar.

## US-056 Completar una sesión

Como estudiante, quiero marcar una sesión como completada para registrar mi avance.

**Prioridad:** P1

### Criterios de aceptación

- La sesión cambia de estado.
- Se registra la fecha de finalización.
- El usuario puede corregir el estado.

## US-057 Reprogramar una sesión

Como estudiante, quiero cambiar una sesión para adaptar mi plan.

**Prioridad:** P1

### Criterios de aceptación

- Se puede modificar fecha y hora.
- El contenido asociado no se pierde.
- El calendario muestra el nuevo horario.

## US-058 Ver repasos pendientes

Como estudiante, quiero ver qué debo repasar hoy para seguir un plan claro.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran actividades del día.
- Se priorizan temas débiles y tarjetas vencidas.
- Se puede abrir cada actividad.
- Se puede completar o reprogramar.

---

# Épica 11: Tutor de IA

## US-059 Hacer una pregunta

Como estudiante, quiero preguntar sobre un tema para resolver dudas.

**Prioridad:** P1

### Criterios de aceptación

- El tutor conoce el tema abierto.
- Usa el material disponible.
- Distingue entre fuente interna y explicación complementaria.
- Indica cuando no tiene suficiente información.

## US-060 Solicitar otra explicación

Como estudiante, quiero pedir una explicación diferente cuando no entiendo.

**Prioridad:** P1

### Criterios de aceptación

El usuario puede solicitar:

- explicación más sencilla;
- explicación más técnica;
- analogía;
- ejemplo;
- tabla;
- diagrama;
- pasos.

## US-061 Evaluar comprensión

Como estudiante, quiero que el tutor me haga preguntas para comprobar que entendí.

**Prioridad:** P1

### Criterios de aceptación

- El tutor formula una pregunta clara.
- Espera la respuesta.
- Corrige respetuosamente.
- Explica el error.
- Ajusta la siguiente pregunta.

## US-062 Corregir razonamiento

Como estudiante, quiero recibir retroalimentación sobre mi razonamiento para aprender de mis errores.

**Prioridad:** P1

### Criterios de aceptación

- Se identifica la parte correcta.
- Se señala la parte incorrecta.
- Se explica cómo mejorar.
- No se limita a mostrar la respuesta final.

## US-063 Mantener contexto

Como estudiante, quiero que el tutor recuerde la materia, clase y tema actuales.

**Prioridad:** P1

### Criterios de aceptación

- Las respuestas se relacionan con el contexto visible.
- El usuario puede cambiar de contexto.
- El sistema muestra qué contexto está usando.
- No mezcla temas sin advertencia.

---

# Priorización por entregas

## Primera entrega

- US-001, US-002
- US-006, US-007
- US-011, US-012, US-013
- US-016, US-017
- US-022, US-023, US-024, US-025, US-026, US-032
- US-033, US-035
- US-038, US-039, US-040, US-041, US-042
- US-047
- US-051, US-053

## Segunda entrega

- edición y eliminación;
- tablas comparativas;
- mnemotecnias;
- clasificación de dificultad;
- repetición espaciada;
- historial;
- progreso;
- calendario;
- tutor de IA.

## Futuro

- carga de audios;
- transcripción automática;
- múltiples usuarios;
- profesores;
- contenido compartido;
- aplicación móvil;
- otras carreras.

## Estado de validación

**Estado:** Aprobado por la usuaria el 2026-07-23.

La usuaria confirmó:

- que las épicas representan su idea;
- que no falta una función esencial;
- que la primera entrega contiene el flujo mínimo correcto;
- que las funciones futuras están correctamente pospuestas.

La siguiente etapa es revisar y aprobar `04-navigation-and-screens.md`.

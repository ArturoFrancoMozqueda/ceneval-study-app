# Historias de usuario

## Historias del modelo editorial

### US-064 Acceder como estudiante invitada

Como estudiante invitada quiero acceder con una cuenta autorizada para
conservar mi avance.

**Aceptación:** la cuenta se crea mediante invitación administrativa; en la
primera entrada acepto explícitamente términos y privacidad antes de que la RLS
habilite el catálogo. La sesión se conserva de forma segura y puedo recuperar
mi contraseña. Esta historia no autoriza registro público ni cobros.

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

**Aceptación:** cada sección indica su origen, enlaza evidencia verificable y
la transcripción original se conserva en el archivo editorial privado.

### US-068 Estudiar con varios recursos

Como estudiante quiero alternar entre la lección guiada, la práctica activa y
el simulacro, y consultar dentro de la lección el mapa, la guía y las fuentes.

**Aceptación:** los tres recorridos principales y sus recursos funcionan en
móvil y escritorio, sin presentar reformulaciones como contenido nuevo.

### US-069 Conservar progreso privado

Como estudiante quiero que mis repasos e intentos se guarden sin que otras
personas puedan verlos.

**Aceptación:** RLS limita cada registro a su propietario.

## Modelo vigente y objetivo

La aplicación sigue un modelo editorial, no autoservicio:

`transcripción privada → paquete 1.2 → borrador → revisión → publicación`

- La **administradora editorial** prepara o importa la estructura académica,
  revisa la evidencia, aprueba los temas y publica.
- La **estudiante consumidora** abre clases ya publicadas, practica y conserva
  su progreso privado. No carga transcripciones ni genera materiales propios.
- En la versión actual acceden la administradora y estudiantes invitadas. El
  registro público y los pagos permanecen fuera de alcance.

Este documento conserva requisitos útiles de preparación editorial y consumo,
pero no convierte el procesamiento editorial en una función pública de la app.

## Formato

Cada historia contiene:

- identificador;
- necesidad de la administradora editorial o de la estudiante consumidora;
- beneficio;
- criterios de aceptación;
- prioridad.

---

# Épica 1: Materias

## US-001 Crear una materia

Como administradora editorial, quiero crear una materia para organizar las clases publicables según el área de Derecho correspondiente.

**Prioridad:** P0

### Criterios de aceptación

- El usuario puede escribir un nombre.
- Puede agregar una descripción opcional.
- No se permite guardar un nombre vacío.
- La materia aparece en la lista.
- La materia permanece después de recargar la página.

## US-002 Consultar materias

Como estudiante, quiero ver la biblioteca de materias publicadas para elegir qué área estudiar.

**Prioridad:** P0

### Criterios de aceptación

- Solo se muestran materias que contienen contenido publicado y aprobado.
- Cada materia muestra nombre y número de clases.
- El usuario puede abrir una materia.
- Si no existen materias, se muestra un estado vacío comprensible.

## US-003 Editar una materia

Como administradora editorial, quiero editar una materia para corregir o actualizar su información.

**Prioridad:** P1

### Criterios de aceptación

- El formulario muestra los datos actuales.
- El usuario puede guardar o cancelar.
- Los cambios aparecen inmediatamente.
- Los cambios permanecen después de recargar.

## US-004 Eliminar una materia

Como administradora editorial, quiero retirar una materia incorrecta sin eliminarla accidentalmente.

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

Como administradora editorial, quiero crear una clase dentro de una materia para preparar un borrador publicable.

**Prioridad:** P0

### Criterios de aceptación

- El usuario escribe un título.
- Selecciona una materia.
- Puede registrar fecha, profesor y descripción.
- La clase aparece dentro de la materia.
- La clase permanece después de recargar.

## US-007 Consultar clases

Como estudiante, quiero consultar las clases publicadas de una materia para continuar mi estudio.

**Prioridad:** P0

### Criterios de aceptación

- A estudiantes solo se muestran las clases publicadas con temas aprobados.
- Cada clase muestra título y fecha.
- El usuario puede abrir cualquier clase.
- Existe un estado vacío cuando no hay clases.

## US-008 Editar una clase

Como administradora editorial, quiero editar una clase en borrador para corregir su información.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran los datos actuales.
- El usuario puede guardar o cancelar.
- Los cambios persisten.

## US-009 Eliminar una clase

Como administradora editorial, quiero retirar una clase incorrecta o duplicada.

**Prioridad:** P1

### Criterios de aceptación

- Se solicita confirmación.
- Se informa el impacto sobre temas y materiales.
- La clase no se elimina accidentalmente.
- Al confirmar, deja de aparecer.

## US-010 Mover una clase

Como administradora editorial, quiero mover una clase no publicada a otra materia para corregir su organización.

**Prioridad:** P1

### Criterios de aceptación

- El usuario puede seleccionar otra materia.
- Se muestra confirmación del cambio.
- La clase deja de aparecer en la materia anterior.
- La clase aparece en la nueva materia sin perder contenido.

---

# Épica 3: Transcripciones

## US-011 Importar una transcripción en el proceso editorial

Como administradora editorial, quiero asociar una transcripción privada a una
clase durante la preparación del paquete para conservar su fuente primaria.

**Prioridad:** P0

### Criterios de aceptación

- La importación acepta el texto completo sin resumirlo ni truncarlo.
- El equipo editorial puede revisarlo antes de importar el paquete.
- La transcripción se asocia a una clase.
- Se informa cuando el campo está vacío.
- El texto permanece conservado en almacenamiento privado; no se incluye en
  Git ni se solicita a la estudiante.

## US-012 Conservar la transcripción original

Como administradora editorial, quiero conservar el texto original para verificar lo que realmente se dijo.

**Prioridad:** P0

### Criterios de aceptación

- La versión original no se modifica al limpiar el texto.
- Se registra de forma independiente.
- El usuario puede consultarla.
- Las regeneraciones no la reemplazan.

## US-013 Preparar una versión limpia

Como editora, quiero preparar una versión limpia fuera del flujo de consumo para revisarla con mayor claridad.

**Prioridad:** P0

### Criterios de aceptación

- Se mejora puntuación y separación de párrafos.
- Se reducen repeticiones evidentes.
- No se cambia intencionalmente el significado.
- La versión se presenta para revisión.
- Se indica cuando el procesamiento falla.

## US-014 Comparar versiones

Como revisora editorial, quiero comparar el texto original y el limpio para detectar cambios incorrectos.

**Prioridad:** P1

### Criterios de aceptación

- El usuario puede alternar entre ambas versiones.
- Cada versión está claramente identificada.
- La original permanece en modo de solo lectura.
- La versión limpia puede editarse.

## US-015 Editar la versión limpia

Como revisora editorial, quiero corregir la versión limpia para asegurar que representa correctamente la clase.

**Prioridad:** P1

### Criterios de aceptación

- El usuario puede modificar el texto.
- Puede guardar o cancelar.
- El original no cambia.
- Se conserva la versión más reciente.

---

# Épica 4: Temas

## US-016 Detectar temas

Como editora, quiero proponer temas durante la preparación del paquete para no organizarlos desde cero.

**Prioridad:** P0

### Criterios de aceptación

- Se propone una lista de temas.
- Cada propuesta tiene un nombre claro.
- Los temas se basan en la transcripción.
- El usuario puede revisar antes de guardar.
- Se informa si no existen datos suficientes.

## US-017 Aprobar temas propuestos

Como administradora editorial, quiero aprobar, editar o rechazar temas para controlar la organización final.

**Prioridad:** P0

### Criterios de aceptación

- Cada tema puede aprobarse o rechazarse.
- El nombre puede editarse.
- Solo los temas aprobados se guardan.
- Cancelar no modifica la estructura existente.

## US-018 Crear un tema manualmente

Como administradora editorial, quiero agregar al borrador un tema que faltó en la preparación.

**Prioridad:** P1

### Criterios de aceptación

- Se puede escribir nombre y descripción.
- No se permite un nombre vacío.
- El tema se asocia a la clase.
- Aparece en la lista de temas.

## US-019 Editar un tema

Como administradora editorial, quiero editar un tema pendiente para corregir su nombre o descripción.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran los datos actuales.
- El usuario puede guardar o cancelar.
- El cambio no elimina materiales relacionados.

## US-020 Eliminar un tema

Como administradora editorial, quiero retirar un tema incorrecto.

**Prioridad:** P1

### Criterios de aceptación

- Se solicita confirmación.
- Se informa si existen materiales o resultados asociados.
- La eliminación no ocurre sin confirmar.

## US-021 Reordenar temas

Como administradora editorial, quiero reordenar los temas antes de publicar para seguir una secuencia lógica.

**Prioridad:** P1

### Criterios de aceptación

- El usuario puede cambiar la posición.
- El nuevo orden se guarda.
- El orden permanece después de recargar.

---

# Épica 5: Material de estudio

## US-022 Preparar una respuesta breve

Como editora, quiero preparar una respuesta corta para que la estudiante repase rápidamente la idea principal.

**Prioridad:** P0

### Criterios de aceptación

- La respuesta contiene dos o tres líneas.
- Responde directamente qué es el concepto.
- No contradice la transcripción.
- Puede editarse.

## US-023 Preparar una explicación completa

Como editora, quiero preparar una explicación completa y verificable para que la estudiante comprenda el tema.

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
- puede editarse antes de publicar;
- no se publica si falta evidencia o si la preparación falla.

## US-024 Preparar un ejemplo cotidiano

Como editora, quiero preparar un ejemplo sencillo para conectar la teoría con una situación fácil de entender.

**Prioridad:** P0

### Criterios de aceptación

- El ejemplo corresponde al concepto.
- Usa lenguaje sencillo.
- No sustituye la definición jurídica.
- Puede revisarse o descartarse antes de publicar.

## US-025 Preparar un ejemplo tipo CENEVAL

Como editora, quiero preparar un ejemplo tipo examen para que la estudiante practique la aplicación del concepto.

**Prioridad:** P0

### Criterios de aceptación

- Presenta una situación o caso.
- Incluye una pregunta clara.
- Incluye opciones cuando corresponde.
- Identifica la respuesta correcta.
- Explica el razonamiento.

## US-026 Preparar un resumen

Como editora, quiero preparar un resumen para que la estudiante repase las ideas esenciales.

**Prioridad:** P0

### Criterios de aceptación

- Contiene las ideas principales.
- Evita detalles secundarios.
- Es más corto que la explicación.
- Puede editarse antes de publicar.

## US-027 Preparar una tabla comparativa

Como editora, quiero preparar una comparación de conceptos similares para evitar confusiones.

**Prioridad:** P1

### Criterios de aceptación

- La tabla identifica conceptos comparados.
- Incluye diferencias relevantes.
- Incluye palabras clave.
- Puede leerse correctamente en pantalla pequeña.

## US-028 Preparar una regla mnemotécnica

Como editora, quiero preparar una técnica de memoria para ayudar a recordar elementos importantes.

**Prioridad:** P1

### Criterios de aceptación

- La técnica se relaciona con el tema.
- Es fácil de recordar.
- No contiene información jurídica incorrecta.
- Puede editarse o descartarse antes de publicar.

## US-029 Identificar errores comunes

Como editora, quiero documentar errores frecuentes para que la estudiante los evite en el examen.

**Prioridad:** P1

### Criterios de aceptación

- Se muestran confusiones concretas.
- Cada error incluye una corrección.
- No se presentan afirmaciones sin fundamento como reglas absolutas.

## US-030 Mostrar dificultad e importancia

Como editora, quiero etiquetar dificultad e importancia para orientar el tiempo de estudio sin presentarlas como datos oficiales.

**Prioridad:** P1

### Criterios de aceptación

- La dificultad usa niveles definidos.
- La importancia usa niveles definidos.
- Se indica que la frecuencia del examen es una estimación cuando no existe fuente oficial.
- El usuario puede modificar las etiquetas.

## US-031 Rehacer una sección en preparación editorial

Como editora, quiero rehacer una sección específica antes de publicar sin perder el resto del material.

**Prioridad:** P1

### Criterios de aceptación

- El usuario selecciona la sección.
- Solo esa sección cambia.
- Puede comparar antes de aceptar.
- Puede conservar la versión anterior.

## US-032 Editar contenido preparado

Como editora, quiero corregir el contenido preparado antes de someterlo a revisión.

**Prioridad:** P0

### Criterios de aceptación

- Todas las secciones editables muestran una acción clara.
- El usuario puede guardar o cancelar.
- Se identifica el contenido modificado manualmente.
- La fuente original permanece disponible.

---

# Épica 6: Flashcards

## US-033 Preparar flashcards

Como editora, quiero preparar flashcards verificables para que la estudiante memorice conceptos.

**Prioridad:** P0

### Criterios de aceptación

- Cada tarjeta tiene pregunta y respuesta.
- Las tarjetas se relacionan con un tema.
- Se pueden revisar antes de guardar.
- No se generan tarjetas duplicadas evidentes.

## US-034 Agregar una flashcard editorial

Como editora, quiero agregar una flashcard al borrador cuando detecto un concepto importante.

**Prioridad:** P1

### Criterios de aceptación

- Se puede escribir pregunta y respuesta.
- Ninguno de los campos puede quedar vacío.
- La tarjeta se asocia a un tema.

## US-035 Practicar recuperación activa

Como estudiante, quiero intentar recuperar una respuesta antes de ver la clave
para comprobar qué recuerdo.

**Prioridad:** P0

### Criterios de aceptación

- Primero se muestra la pregunta y se pide declarar confianza.
- La clave se revela mediante una acción explícita.
- El avance de la sesión es visible.
- Se registra el resultado que la estudiante asigna a su respuesta.

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

## US-038 Preparar un mini examen

Como editora, quiero preparar un banco de preguntas verificables para que la estudiante mida su comprensión.

**Prioridad:** P0

### Criterios de aceptación

- Las preguntas se asocian a un tema aprobado.
- Cada respuesta correcta se guarda solo en el área protegida del servidor.
- Cada pregunta tiene instrucciones claras.
- El paquete no se publica si faltan preguntas, opciones, explicación o evidencia.

## US-039 Iniciar el simulacro editorial

Como estudiante, quiero conocer la extensión del simulacro publicado antes de
iniciarlo.

**Prioridad:** P0

### Criterios de aceptación

- Cada tema publicable contiene exactamente diez reactivos editoriales.
- La pantalla informa que el simulacro tiene diez reactivos antes de iniciar.
- La práctica adaptativa, separada del simulacro, ajusta la selección de
  reactivos de recuperación según el historial.

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

Como estudiante, quiero comprender el resultado después de entregar el
simulacro sin recibir claves antes de tiempo.

**Prioridad:** P0

### Criterios de aceptación

- Cada pregunta distingue si la respuesta elegida fue correcta o incorrecta.
- Se muestra el razonamiento general y la explicación de la opción elegida.
- Las claves y explicaciones permanecen protegidas en el servidor hasta la
  entrega.
- No se envían al cliente explicaciones de distractores que la estudiante no
  eligió.

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
- Puede iniciar otro intento con preguntas disponibles del banco publicado.

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

## US-048 Consultar evidencia de avance y desempeño

Como estudiante, quiero consultar mi actividad y desempeño por tema para
distribuir mejor mi tiempo sin confundir recorrido completado con dominio.

**Prioridad:** P1

### Criterios de aceptación

- El recorrido completado se informa solo como avance de lectura o práctica.
- El desempeño se basa en intentos de examen reales y muestra la evidencia.
- Con datos insuficientes no se atribuye dominio y se explica la limitación.
- Los indicadores cambian cuando existe actividad o resultados posteriores.

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

# Épica 10: Calendario (futuro condicionado)

Estas historias de calendario siguen pospuestas por alcance de producto. El
acceso por invitación no las habilita automáticamente.

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

# Épica 11: Tutor de IA (futuro condicionado)

Conforme a ADR-013, OpenAI no forma parte del runtime actual. Estas historias
describen una ayuda dinámica futura y requieren una decisión explícita para
habilitarse. No autorizan generación jurídica sin evidencia, acceso a las
transcripciones privadas ni respuestas fuera del contenido editorial aprobado.

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

- US-066: revisar el borrador antes de publicar.
- US-001, US-003: crear y corregir la estructura editorial.
- US-006, US-008: crear y corregir clases como borradores.
- US-011, US-012: importar sin pérdida y conservar la transcripción privada.
- US-016, US-017: preparar, revisar y aprobar temas.
- US-022, US-023, US-024, US-025, US-026, US-032
- US-033, US-038: preparar flashcards y preguntas con evidencia.
- US-065, US-067, US-068: consumir una clase terminada y rastreable.
- US-002, US-007, US-035, US-039, US-040, US-041, US-042
- US-047, US-051, US-053

El acceso de US-064 forma parte de esta entrega únicamente por invitación. La
comprobación del flujo de estudiante usa cuentas sintéticas locales; abrir el
registro público requiere una decisión posterior.

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

- herramientas internas para preparar audios y transcripciones, siempre fuera
  del flujo de estudiante y conservando el original;
- registro público y altas autoservicio, condicionados a una decisión comercial
  y de seguridad explícita;
- tutor dinámico limitado al corpus editorial publicado y con citas;
- profesores;
- contenido compartido;
- aplicación móvil;
- otras carreras.

## Estado de validación

**Estado:** reconciliado con el modelo editorial privado el 2026-08-21.

La validación del 2026-07-23 confirmó las necesidades educativas originales.
La reconciliación posterior conserva esas necesidades, pero reemplaza el flujo
autoservicio por preparación editorial y consumo de contenido publicado:

- que las épicas representan su idea;
- que no falta una función esencial;
- que la primera entrega debe probar el flujo editorial completo;
- que registro, pagos, generación por estudiantes y tutor dinámico están
  correctamente pospuestos.

La siguiente etapa es revisar y aprobar `04-navigation-and-screens.md`.

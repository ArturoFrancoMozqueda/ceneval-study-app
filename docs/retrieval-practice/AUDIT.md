# Auditoría de los borradores de práctica de recuperación

**Fecha:** 25 de agosto de 2026

**Estado actual:** reauditoría técnica y jurídica cerrada; pendiente aprobación
editorial humana; no importar ni publicar todavía

**Alcance:** C01–C57, 456 preguntas

## Resolución del 25 de agosto de 2026

Los borradores originales se sustituyeron íntegramente por 456 reactivos
derivados de artefactos trazados de los 57 paquetes académicos 1.2. Tres
revisiones paralelas comprobaron C01–C19, C20–C38 y C39–C57 contra las claves y
los registros de evidencia de cada paquete.

- 456 de 456 reactivos tienen identificador estable y clave no vacía.
- 456 de 456 enlazan evidencia existente y al menos una fuente oficial.
- C48–C57 tienen 80 de 80 soluciones sustantivas.
- La consigna promedio bajó de 33.3 a 19.6 palabras aun después de añadir el
  contexto de tema necesario para intercalar tarjetas sin ambigüedad.
- Las consignas multiparte bajaron de 256 a 0.
- Toda la voz editorial y las etiquetas están en español y se dirigen a la
  estudiante autodirigida.
- Las reglas locales declaran su ámbito; la evidencia privada conserva solo el
  número de audio y el localizador, sin exponer la transcripción.

Los bloqueos críticos quedaron resueltos así:

- **C01:** dos secciones, tres áreas disciplinares, tres opciones y una correcta
  conforme a la guía vigente de Ceneval.
- **C06 y C07:** seis votos en los supuestos vigentes, no ocho.
- **C13:** se retiró el reactivo ajeno y erróneo sobre declaratoria general; la
  práctica actual cubre el plazo máximo de noventa días del fallo y la revisión.
- **C20:** diferencia veinte días para desvirtuar, ampliación de quince, máximo
  ordinario de doce meses y seis meses para la resolución, con sus reservas.
- **C33:** separa autenticidad de ejecutividad, limita la fe a hechos y
  declaraciones y aplica el artículo 2080 federal sin mezclar ámbitos.
- **C51:** presenta el régimen de Michoacán sin universalizar la sociedad
  conyugal ni las formalidades de capitulaciones.
- **C57:** distingue inventario, oposición y valoración; no presenta peritaje o
  tercero en discordia como regla universal.

El contrato está en [CONTRACT.md](CONTRACT.md). `npm run retrieval:check`
valida el esquema 1.2, el conjunto exacto C01–C57, 456 reactivos, selecciones
únicas, claves no vacías, referencias, HTTPS, localizadores y fechas. También
compara byte a byte cada documento con su origen generado. El gate no pretende
calificar semántica jurídica; esa limitación está cubierta por la reauditoría y
debe seguir cubierta por aprobación editorial humana y revisión de vigencia.

## Resultado de la auditoría inicial

La colección tiene cobertura completa de C01–C57 y una mezcla global útil:
213 preguntas de recuerdo libre (46.7%), 186 de recuerdo guiado (40.8%) y 57
de reconocimiento (12.5%). Sin embargo, no cumple el estándar jurídico,
editorial ni de estudio autodirigido del proyecto.

## Bloqueos críticos comprobados

- **C01** contradice el paquete vigente sobre la estructura del EGEL y la
  cantidad de opciones.
- **C06 y C07** conservan el umbral derogado de ocho votos; los paquetes
  vigentes documentan seis votos con la integración actual de la SCJN.
- **C13** invierte la exclusión tributaria de la declaratoria general de
  inconstitucionalidad y omite el plazo vigente documentado en el paquete.
- **C20** contiene respuestas internamente contradictorias sobre nulidad y
  plazos de visita.
- **C33** presenta reglas notariales locales como universales y exagera los
  efectos de una interpelación y el valor probatorio del acta.
- **C51** mezcla regímenes patrimoniales y generaliza que lo adquirido durante
  el matrimonio integra el patrimonio social.
- **C57** vuelve a presentar un tercer perito en discordia como regla general,
  aunque el paquete vigente corrige expresamente esa universalización.
- En **C48–C57**, 75 de 80 notas de respuesta solo describen un error común y
  no contienen los puntos de una respuesta correcta.

Estos casos demuestran que no basta con corregir siete archivos: los 456
reactivos necesitan revisión contra su evidencia de origen.

## Gaps transversales

- Ningún reactivo incluye `evidenceRef`, localizador, fuente oficial ni fecha de
  verificación jurídica.
- 256 de 456 consignas son multiparte y el promedio es de 33.3 palabras; ocho
  respuestas abiertas en 10–15 minutos crean carga extrínseca innecesaria.
- 30 de 57 guiones hablan a una persona docente o a un grupo, aunque Sube Legal
  es una experiencia autodirigida.
- La estructura fija un reactivo de reconocimiento como pregunta 8 en todas las
  clases, en vez de ajustar el apoyo al historial y conocimiento de la
  estudiante.
- Las recomendaciones de espaciado asumen 1–3 semanas sin datos reales y
  preseleccionan preguntas, en lugar de repetir errores o baja confianza.
- Los encabezados y etiquetas están en inglés dentro de una interfaz que debe
  estar completamente en español.

## Contrato mínimo propuesto antes de implementar

Cada reactivo debe tener, como mínimo:

- identificador estable y `classCode`;
- consigna, tipo de recuperación, dificultad y tiempo estimado;
- `answerKey.requiredPoints`, alternativas aceptables y errores comunes;
- `evidenceRefs` existentes en el paquete 1.2;
- fuente y fecha de vigencia jurídica;
- regla de retiro cuando la evidencia quede desactualizada.

El gate debe comprobar que cada punto obligatorio de la respuesta esté
respaldado por evidencia vigente y que ninguna regla local se presente como
nacional.

## Experiencia recomendada

La estudiante debe ver una pregunta, intentar responder o marcar “No lo
recuerdo”, declarar confianza y solo después revelar puntos clave y fuente.
Debe autoevaluarse como correcta, parcial o incorrecta; no se usará
calificación automática de texto libre. Las sesiones deben contener 3–5
reactivos, repetir errores y baja confianza, intercalar temas relacionados y
ofrecer un modo urgente honesto cuando el examen sea inminente.

## Condición editorial restante

La reauditoría, corrección, trazabilidad, vigencia, carga cognitiva, voz y gate
automático ya están cerrados. Permanece un único requisito deliberado: una
persona responsable del contenido debe aprobar editorialmente el corpus y
autorizar por separado cualquier diseño de importación. Hasta entonces no se
publica ni se escribe en Supabase.

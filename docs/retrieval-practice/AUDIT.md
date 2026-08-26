# Auditoría de los borradores de práctica de recuperación

**Fecha:** 25 de agosto de 2026

**Estado:** bloqueados; no publicar ni importar

**Alcance:** C01–C57, 456 preguntas

## Resultado

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

## Condición para desbloquear

1. Regenerar o auditar los 456 reactivos contra `content/packages/`.
2. Corregir primero todos los bloqueos críticos anteriores.
3. Añadir trazabilidad y vigencia por reactivo.
4. Validar carga cognitiva y voz autodirigida.
5. Incorporar el nuevo contrato a un gate automatizado.
6. Ejecutar revisión editorial humana antes de cualquier importación.

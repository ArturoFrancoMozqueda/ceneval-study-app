# Contrato editorial de práctica de recuperación

**Versión:** 1.0  
**Fecha:** 25 de agosto de 2026

Este contrato convierte los borradores de práctica en materiales trazables para
estudio autodirigido. No los convierte por sí solo en contenido publicado ni
autoriza su importación a Supabase.

## Regla de origen

Cada reactivo se deriva de un artefacto ya trazado del paquete académico 1.2:
tarjeta, caso práctico o reactivo diagnóstico. La clave conserva la solución
sustantiva del paquete; no se infiere desde la transcripción ni desde memoria.

## Campos obligatorios

Cada reactivo contiene:

- identificador estable `Cxx-Ryy`;
- consigna, tipo, dificultad, tiempo estimado y objetivo;
- ámbito territorial o institucional;
- referencias de evidencia existentes en el paquete 1.2;
- fecha de verificación y regla de retiro o revalidación;
- clave con puntos obligatorios, alternativas aceptables y errores comunes.

Cada fuente oficial usada debe identificar institución, ámbito, localizador,
fecha de verificación y URL. La evidencia privada de clase conserva su número
de audio y rango de líneas, sin exponer la transcripción. Todo reactivo debe
incluir al menos una fuente oficial.

## Diseño pedagógico

- Las sesiones recomendadas son de 3 a 5 reactivos.
- La estudiante intenta responder antes de revelar la clave.
- La autoevaluación es `correcta`, `parcial` o `incorrecta`; no se infiere una
  calificación automática desde texto libre.
- Se priorizan errores y baja confianza; no se presume una fecha fija del
  último estudio.
- La dificultad deseable proviene de recordar y aplicar el Derecho, no de
  consignas innecesariamente largas o de una voz dirigida a docentes.

## Gate automático

`npm run retrieval:check` valida los paquetes con el esquema 1.2 compartido,
exige exactamente C01.md–C57.md y 456 reactivos, y compara cada archivo con su
origen. Rechaza códigos o selecciones duplicadas, claves vacías, referencias
inexistentes, fuentes oficiales sin HTTPS, localizador o fecha, fechas futuras
y reactivos sin una fuente oficial.

El gate detecta deriva estructural y de trazabilidad; no sustituye la revisión
jurídica y editorial humana ni la verificación de vigencia antes de publicar.

# Auditoría integral de calidad — 25 de agosto de 2026

Auditoría coordinada con tres frentes: UX/accesibilidad, ingeniería/seguridad y
calidad pedagógica. No se consultó ni modificó Supabase remoto.

## Resumen

La línea base es sólida: pruebas locales, lint, build y auditoría de
dependencias pasan. Los riesgos principales no son una falla general de la
aplicación, sino inconsistencias entre el producto privado y su interfaz,
operaciones destructivas, contenido pedagógico nuevo sin gate y deuda de
integridad/confiabilidad antes de abrir a estudiantes.

## Corregido en esta auditoría

- El registro privado ya no captura ni descarta silenciosamente datos; la UI
  explica que el registro público sigue cerrado.
- Se retiraron las falsas promesas de “registrarte para avisarte”; no existe
  todavía una lista de espera.
- Una cuenta `admin` ya no puede eliminarse por autoservicio y dejar el
  proyecto sin administración.
- `/cuenta` ya es descubrible desde escritorio y móvil.
- El inicio y la búsqueda ya no convierten errores de Supabase en “sin
  actividad” o “sin resultados”.
- El diálogo editorial gestiona foco inicial, Escape, ciclo de Tab,
  restauración de foco y bloqueo de scroll.
- La vista de fuentes jurídicas conserva el foco al abrir y volver.
- El shell público tiene skip link; los controles “Quitar” alcanzan 24 px.
- La marca autenticada se unificó como Sube Legal y se definió el token visual
  `brand-soft` que ya se usaba.
- `docs/retrieval-practice/` quedó explícitamente bloqueado y auditado.

## Pendientes de prioridad alta

### Integridad técnica

1. **Entrega de examen no atómica.** La acción inserta el intento y después sus
   respuestas; el cleanup es de mejor esfuerzo. Debe convertirse en una RPC
   transaccional antes de abrir a estudiantes.
2. **Learning journey no consumido.** Los quick checks y casos se persisten y
   editan, pero la vista de estudiante no los usa. El resumen puede contar
   respuestas difíciles que la cola de repaso no permite trabajar.
3. **Invariantes de actividad solo en la app.** La Data API permite que un
   cliente autenticado salte límites Zod de pasos y textos. Añadir constraints
   o escrituras por RPC antes del modo multiusuario.
4. **Pruebas E2E fuera de CI.** El recorrido local de navegador existe y pasa,
   pero `test:local`/CI solo incluyen contratos estáticos. Añadir un job aislado
   con Supabase local y Chromium, al menos nocturno si el costo es alto.

### Contenido y aprendizaje

1. Reauditar los 456 reactivos de `docs/retrieval-practice/` contra los paquetes
   1.2 y su evidencia. Ver `docs/retrieval-practice/AUDIT.md`.
2. Definir un contrato trazable por reactivo y un gate de vigencia jurídica.
3. Diseñar sesiones autodirigidas de 3–5 reactivos con intento antes de revelar,
   confianza, autoevaluación y repetición de errores.

## Pendientes de prioridad media

- Introducir CSP real de forma gradual (primero Report-Only); la política actual
  protege framing/base/formularios, pero no restringe scripts.
- Reducir las 11–13 consultas aproximadas del bundle de lección y evitar que
  `getSubject()` cargue el catálogo completo para un solo ID; medir antes y
  después.
- Ampliar búsqueda a materia, clase, descripción y materiales mediante una
  consulta segura y medible. La UI ahora describe honestamente el alcance
  actual: títulos de temas.
- Convertir las rutas editoriales inválidas en 404 consistentes.
- Añadir filtros/agrupación al panel editorial de 57 clases.
- Añadir confirmación fuerte y estado pending a la eliminación estudiantil.
- Reforzar integridad relacional de claves y respuestas de examen en la base.
- Validar fechas calendario reales antes de enviarlas a PostgreSQL.

## Pendientes operativos o de producto

Se mantienen los bloqueos de `PROJECT_STATUS.md`: respaldo remoto restaurable,
segunda copia de transcripciones, proyecto de ensayo, pruebas con varias
personas, planes aptos para uso comercial, dominio/correo real y marco fiscal.
Esta auditoría no autoriza cobros, registro público ni escrituras en producción.

# Auditoría integral de calidad — 25 de agosto de 2026

Auditoría coordinada con tres frentes: UX/accesibilidad, ingeniería/seguridad y
calidad pedagógica. No se consultó ni modificó Supabase remoto.

## Seguimiento técnico — 30 de agosto de 2026

Se cerró en código el backlog de alta prioridad de la aplicación, sin escribir
en Supabase remoto:

- La entrega de examen ya tiene una RPC transaccional `submit_exam_v1`; la
  migración también refuerza pertenencia pregunta/opción y límites de actividad.
  La aplicación conserva temporalmente el flujo anterior solo cuando PostgREST
  confirma con `PGRST202` que la función todavía no existe, para no romper el
  despliegue mientras se autoriza y verifica la migración remota.
- El learning journey ya se consume en la vista guiada de la lección.
- Inicio, Mi ruta y Repasar hoy comparten un solo resumen que prioriza la ronda
  adaptativa sin sumar métricas incompatibles con el repaso tradicional.
- Abrir la práctica ya no crea, abandona ni reanuda una ronda por efecto
  secundario; iniciar una ronda requiere una acción explícita.
- Existe un workflow manual y nocturno con Supabase local y Chromium, sin
  secretos remotos. Su primera ejecución real en GitHub queda pendiente del
  push de este cambio.
- `getSubject()` limita la consulta a un ID; las rutas editoriales inválidas
  usan el 404 de Next; y una CSP completa se añadió en modo Report-Only como
  etapa de observación previa al uso de nonces.

La migración y la suite dinámica local no se pudieron ejecutar en esta sesión
porque Docker Desktop no estaba activo. Tampoco se aplicó la migración al
proyecto remoto: las credenciales CLI disponibles solo mostraron un proyecto
distinto (`VALT`), por lo que se falló cerrado antes de enlazar o escribir.

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

## Pendientes de prioridad alta al corte original

### Integridad técnica

1. **Entrega de examen no atómica.** **Resuelto en código el 30 de agosto;**
   falta aplicar y probar la migración en un entorno Supabase autorizado.
2. **Learning journey no consumido.** **Resuelto:** la lección usa la secuencia
   editorial y el resumen de repaso ya no mezcla conteos incompatibles.
3. **Invariantes de actividad solo en la app.** **Resuelto en la misma
   migración pendiente de aplicación remota.**
4. **Pruebas E2E fuera de CI.** **Resuelto en configuración:** workflow manual
   y nocturno aislado; falta observar su primera ejecución en GitHub.

### Contenido y aprendizaje

1. Reauditar los 456 reactivos de `docs/retrieval-practice/` contra los paquetes
   1.2 y su evidencia. Ver `docs/retrieval-practice/AUDIT.md`.
2. Definir un contrato trazable por reactivo y un gate de vigencia jurídica.
3. Diseñar sesiones autodirigidas de 3–5 reactivos con intento antes de revelar,
   confianza, autoevaluación y repetición de errores.

## Pendientes de prioridad media

- Continuar el rollout de CSP: Report-Only ya está configurado; falta observar
  violaciones reales y migrar a nonces antes de aplicar la política estricta.
- Reducir las consultas restantes del bundle de lección. `getSubject()` ya no
  carga el catálogo completo para un solo ID; falta medir el bundle completo.
- Ampliar búsqueda a materia, clase, descripción y materiales mediante una
  consulta segura y medible. La UI ahora describe honestamente el alcance
  actual: títulos de temas.
- Convertir las rutas editoriales inválidas en 404 consistentes. **Resuelto.**
- Añadir filtros/agrupación al panel editorial de 57 clases.
- Añadir confirmación fuerte y estado pending a la eliminación estudiantil.
- Reforzar integridad relacional de claves y respuestas de examen en la base.
- Validar fechas calendario reales antes de enviarlas a PostgreSQL.

## Pendientes operativos o de producto

Se mantienen los bloqueos de `PROJECT_STATUS.md`: respaldo remoto restaurable,
segunda copia de transcripciones, proyecto de ensayo, pruebas con varias
personas, planes aptos para uso comercial, dominio/correo real y marco fiscal.
Esta auditoría no autoriza cobros, registro público ni escrituras en producción.

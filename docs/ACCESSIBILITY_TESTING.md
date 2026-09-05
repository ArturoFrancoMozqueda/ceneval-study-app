# Pruebas de accesibilidad

Este documento separa la evidencia automatizada local de las comprobaciones
manuales que todavía hacen falta. Un gate verde no equivale por sí solo a una
declaración de conformidad integral con WCAG 2.2 AA.

## Gate automatizado local

Con Supabase local activo, ejecuta:

```powershell
npm.cmd run test:e2e:local
```

El runner usa exclusivamente loopback y un puerto dedicado, compila la app,
crea un fixture sintético y comprueba en Chromium:

- acceso estudiantil por invitación, denegación administrativa y skip-link mediante teclado;
- nombres programáticos, anuncios y gestión de foco en tarjetas y examen;
- recorrido de diez tarjetas, examen de diez reactivos, resultado e historial;
- persistencia del progreso después de recargar;
- respuestas 404 para identificadores dinámicos inválidos;
- viewport de escritorio, móvil táctil de 320 CSS px y reflow equivalente a
  640 CSS px como aproximación automatizada a zoom de 200%;
- targets interactivos medidos de al menos 24 por 24 CSS px;
- preferencia de movimiento reducido y duración computada reducida;
- ausencia de errores de consola, página, HTTP 5xx y fallos de red. Solo se
  toleran cancelaciones explícitas de navegación del navegador.

El mismo recorrido se ejecuta en GitHub Actions mediante el workflow
`E2E local nocturno`, todos los días a las 03:17 (hora de Ciudad de México) y
también bajo ejecución manual. El job levanta Supabase y Chromium dentro del
runner efímero, no usa secretos del repositorio ni servicios remotos y elimina
la base local al terminar, incluso si la prueba falla.

La prueba falla cerrada si el entorno no es Supabase local, si el puerto
dedicado ya está ocupado o si no puede acreditar la propiedad del proceso.
Siempre verifica la limpieza de usuarios y contenido sintéticos.

## Comprobaciones manuales pendientes

Antes de afirmar conformidad WCAG 2.2 AA para un artefacto candidato se debe
registrar, como mínimo:

- navegación completa con NVDA en Windows y TalkBack en Android; VoiceOver se
  recomienda para cubrir el ecosistema Apple;
- zoom real del navegador al 200%, no solo el proxy de reflow automatizado;
- modo de contraste alto o `forced-colors` en Windows;
- uso en un dispositivo táctil físico y orientación vertical/horizontal;
- inspección visual de foco, orden de lectura, anuncios y mensajes de error.

No se ha ejecutado todavía una sesión manual con NVDA, TalkBack o VoiceOver;
por tanto el proyecto no declara compatibilidad verificada con esos lectores.

## Auditoría asistida del 24 de agosto de 2026

Se recorrió la aplicación local con un fixture sintético y exclusivamente en
loopback. Esta sesión combinó operación por teclado en un navegador real,
inspección del árbol accesible y mediciones DOM; no se presenta como sustituto
de una persona usuaria de tecnología de asistencia.

| Alcance | Técnica | Resultado y evidencia |
| --- | --- | --- |
| `/iniciar-sesion` | Tab, pegado de contraseña, Enter y errores reales | Orden lógico; campos con nombre; pegado permitido; error con `role="alert"` y `aria-invalid`; el acceso privado rechazó a la estudiante sintética y aceptó a la administradora local. |
| Shell autenticado | Tab y activación del skip-link | El primer Tab mostró “Saltar al contenido principal” (263×48 CSS px) y Enter movió el foco a `main`. |
| `/materias` | Landmarks, headings y viewport de 512 px | Sin scroll horizontal (`scrollWidth = clientWidth = 497`), con título, `main`, navegación nombrada y jerarquía H1/H2. Es reflow, no zoom real. |
| `/clases/6` | Árbol accesible | Migas, H1 y tema con nombre accesible; observación menor: se conserva un `nav` vacío llamado “Recorrido de sesiones” cuando no hay clase anterior o siguiente. |
| `/temas/5` | Radio con Space y avance con Tab | Grupo y opciones tienen nombres; tras elegir, Tab llega a “Siguiente pregunta” y el foco no queda oculto. Falta comprobar los anuncios auditivos al cambiar de reactivo. |
| `/estudiar/repaso` | Estado vacío | H1 “Terminaste por hoy”, región de estado y enlace de retorno de 232×44 CSS px. |
| Controles visibles | Medición DOM | **Falla WCAG 2.2 AA 2.5.8:** el botón lateral de escritorio “Cerrar sesión” mide aproximadamente 80×16 CSS px. Los radios pequeños quedan dentro de etiquetas clicables mayores de 24 px y los demás casos pequeños observados son enlaces de texto en línea. |
| Contraste principal | Cálculo sobre los tokens CSS | `muted/background` 5.48:1, `muted/surface` 5.87:1, `brand/background` 10.23:1, blanco/brand 11.14:1 y success/success-soft 5.00:1. No sustituye `forced-colors`. |

La limpieza local quedó verificada en **0 clases, 0 materias, 0 referencias y
0 usuarios sintéticos**. No se tocó Supabase remoto.

### Bloqueos de la matriz manual

- **NVDA:** no está instalado en el equipo; no se verificaron anuncios
  auditivos ni navegación con lector.
- **Zoom real al 200%:** Computer Use no pudo acreditar con suficiente
  confianza la ventana/URL del navegador; solo permanece el proxy automatizado
  de reflow, claramente etiquetado como tal.
- **Contraste alto de Windows:** no se modificaron ajustes del sistema de la
  usuaria y no se validó `forced-colors` de forma manual.
- **TalkBack, VoiceOver, táctil físico y orientación:** no había un dispositivo
  Android o Apple físico disponible.

Por tanto, el defecto de tamaño de objetivo queda abierto y el proyecto sigue
sin declarar conformidad integral WCAG 2.2 AA ni compatibilidad comprobada con
lectores de pantalla.

## Seguimiento del 4 de septiembre de 2026

La auditoría integral posterior corrigió el objetivo de “Cerrar sesión”, evitó
regiones de navegación vacías, agregó migas semánticas y soporte de foco para
`forced-colors`, y eliminó `autofocus` de formularios. También corrigió el
nombre accesible del enlace de marca para que contenga su rótulo visible, de
acuerdo con WCAG 2.5.3.

El E2E ampliado volvió a pasar a 320 CSS px, reflow equivalente a 200%, targets
de al menos 24×24 CSS px y movimiento reducido. La deuda de verificación manual
con lector de pantalla, zoom real, contraste alto y dispositivo físico sigue
abierta; por ello no se declara conformidad integral WCAG 2.2 AA. La evidencia
completa está en `docs/QUALITY_AUDIT_2026-09-04.md`.

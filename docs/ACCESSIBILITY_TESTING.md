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

- inicio de sesión privado y skip-link mediante teclado;
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

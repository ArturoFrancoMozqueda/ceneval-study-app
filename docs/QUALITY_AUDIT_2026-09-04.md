# Auditoría integral de calidad — 4 de septiembre de 2026

Esta auditoría comprobó el producto desde tres frentes paralelos: experiencia y
accesibilidad, recorridos funcionales en navegador, y calidad/seguridad del
código. No se escribió en Supabase remoto; los datos y usuarios utilizados
fueron sintéticos y vivieron exclusivamente en Supabase local.

## Criterios utilizados

La revisión se basó en fuentes primarias y vigentes:

- WCAG 2.2 y la guía de evaluación de W3C, que exige combinar automatización
  con revisión humana: <https://www.w3.org/WAI/test-evaluate/>.
- Prácticas de Playwright: probar conducta visible, aislar casos y localizar
  controles por su rol accesible: <https://playwright.dev/docs/best-practices>.
- Guía oficial de pruebas de Next.js, incluida su recomendación de E2E para
  Server Components asíncronos: <https://nextjs.org/docs/app/guides/testing>.
- Umbrales Core Web Vitals: LCP <= 2.5 s, INP <= 200 ms y CLS <= 0.1 en el
  percentil 75: <https://web.dev/articles/defining-core-web-vitals-thresholds>.
- OWASP ASVS 5.0 como referencia de controles verificables:
  <https://owasp.org/www-project-application-security-verification-standard/>.

## Evidencia obtenida

### Producción pública, solo lectura

Se comprobaron `/`, `/precios`, `/muestra`, `/iniciar-sesion`,
`/preguntas-frecuentes`, `/privacidad` y `/terminos` en escritorio y a 320 CSS
px. Todas respondieron 200, sin errores de consola, de página o de red, sin
desbordamiento horizontal, identificadores duplicados, regiones vacías ni el
texto literal `<>`. El health check público respondió 200 y el protegido no
reveló información sin credencial.

Lighthouse 13 sobre `/` y `/muestra` obtuvo 99 en rendimiento y 100 en
accesibilidad, mejores prácticas y SEO; LCP fue 2.1 s. Lighthouse sí detectó
una discrepancia entre el texto visible y el nombre accesible del enlace de
marca. La implementación local quedó corregida y protegida por una prueba.

Estas cifras son una línea base de laboratorio, no datos de campo ni una
declaración total de conformidad.

### Producto autenticado local

`npm run test:e2e:local` recorrió una compilación de producción con Chromium y
Supabase local: inicio de sesión, biblioteca, búsqueda con y sin resultados,
navegación materia-clase-tema, lección, práctica adaptativa, examen de diez
reactivos, resultado, repetición, historial, rutas inválidas y panel de
administración. También comprobó reflow móvil, tamaño táctil y movimiento
reducido. Terminó sin errores de consola, página o red y eliminó el fixture:
0 clases, materias, referencias y usuarios sintéticos residuales.

## Correcciones aplicadas

- Se quitaron promesas y rótulos obsoletos sobre IA, flashcards o funciones
  futuras; los estados pendientes ahora explican qué falta sin aparentar que
  solo llenan un hueco.
- Se eliminó el componente muerto de placeholder y se corrigieron plurales,
  textos en inglés y lenguaje dependiente de un dispositivo como “toca”.
- Formularios: sin autofocus; el primer campo inválido recibe foco, los datos
  introducidos se conservan y los errores generales ya no se atribuyen a un
  campo incorrecto.
- Navegación: migas semánticas, regiones solo cuando tienen contenido, pistas
  accesibles para enlaces externos, foco visible en contraste forzado y nombre
  de marca compatible con WCAG 2.5.3.
- Next.js 16: los límites de error usan la función `retry` vigente; antes el
  botón de recuperación podía no funcionar.
- Las fechas editoriales se validan como días reales de calendario, no solo
  por su forma ISO.
- Se añadió HSTS a la configuración de seguridad y una prueba de encabezados.
- La calificación adaptativa dispone de una RPC transaccional que actualiza el
  intento, agenda, cola y sesión como una sola unidad. La Server Action conserva
  temporalmente el flujo anterior **solo** cuando PostgREST informa que la RPC
  aún no existe (`PGRST202`), para que el despliegue de código no rompa
  producción antes de aplicar la migración.
- El E2E ahora activa controles visibles y verifica persistencia, resultado,
  repetición e historial, en vez de limitarse a abrir URLs.

## Límites y trabajo pendiente

- La migración `20260904225405_rate_adaptive_attempt_atomic.sql` se probó
  localmente, pero no se aplicó a producción. Hasta que se autorice y ejecute,
  producción seguirá usando el fallback no transaccional y registrará esa
  condición.
- El panel editorial se comprueba en modo lectura. Falta automatizar, mediante
  la UI, crear, aprobar y publicar un fixture completo.
- Permanecen contradicciones de alcance en las historias US-003, US-039,
  US-042, US-047, US-051 y en el nombre “flashcards” frente a la práctica
  adaptativa. No se inventó una decisión de producto para cerrarlas.
- Sigue pendiente una sesión manual con NVDA/TalkBack/VoiceOver, zoom real,
  contraste alto y dispositivos físicos. La automatización no sustituye esas
  comprobaciones.
- CSP continúa en modo report-only y el RPC `submit_exam_v1` mantiene su propio
  fallback hasta que todas las migraciones requeridas estén confirmadas en el
  entorno remoto.

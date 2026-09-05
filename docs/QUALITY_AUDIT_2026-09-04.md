# Auditoría integral de calidad — 4 de septiembre de 2026

Esta auditoría comprobó el producto desde tres frentes paralelos: experiencia y
accesibilidad, recorridos funcionales en navegador, y calidad/seguridad del
código. Los recorridos usaron datos sintéticos exclusivamente en Supabase
local. El cierre técnico del mismo día sí aplicó dos migraciones no destructivas
al proyecto remoto: calificación adaptativa atómica e índices de claves
foráneas.

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
Supabase local: inicio de sesión, creación visible y persistente de materia y
clase, validaciones, gate de publicación incompleta, revisión, aprobación y
publicación de un fixture completo, biblioteca, búsqueda, lección, práctica
adaptativa, examen de diez reactivos, resultado, repetición, historial, rutas
inválidas y panel de administración. También comprobó reflow móvil, tamaño
táctil y movimiento reducido. Terminó sin errores de consola, página o red y
eliminó el fixture: 0 clases, materias, referencias y usuarios sintéticos
residuales.

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
  intento, agenda, cola y sesión como una sola unidad. Tras comprobar la RPC en
  producción se eliminó el flujo anterior no transaccional: ahora cualquier
  fallo cierra la operación sin escritura parcial.
- La entrega del examen también exige su RPC atómica; se eliminó el fallback
  legado que aceptaba datos de calificación calculados por el cliente.
- La política CSP completa pasó de observación a aplicada. El contrato
  automatizado impide volver a modo Report-Only.
- La búsqueda abarca materias, clases y temas publicados, distingue el tipo y
  muestra su ubicación. El progreso identifica temas con errores usando solo
  la comprobación y el intento más recientes y explica cuándo no hay evidencia.
- La administradora puede corregir una materia desde su detalle, con formulario
  precargado, validación, cancelación y persistencia.
- El E2E ahora activa controles visibles y verifica persistencia, resultado,
  repetición e historial, en vez de limitarse a abrir URLs.

## Verificación remota y límites

- La RPC adaptativa y los cinco índices de claves foráneas se aplicaron antes
  del despliegue. La llamada de prueba con un identificador inexistente devolvió
  `unavailable` sin mutar datos. Sus permisos son `service_role` solamente.
- El corpus remoto contiene 456 reactivos publicados, 456 claves protegidas y
  1,377 vínculos de evidencia. La práctica adaptativa no depende de un estado
  vacío ni de un fallback simulado.
- Los avisos de índices de claves foráneas quedaron cerrados. Los índices
  marcados como no usados se conservan: el proyecto tiene poco tráfico y esa
  estadística no acredita que sean innecesarios.
- `submit_exam_v1` permanece deliberadamente como `SECURITY DEFINER`
  ejecutable por `authenticated`: debe leer claves que RLS oculta, comprueba
  `auth.uid()`, exige examen vigente, tema aprobado y clase publicada, y valida
  cada opción dentro de la misma transacción.
- Sigue pendiente una sesión manual con NVDA/TalkBack/VoiceOver, zoom real,
  contraste alto y dispositivos físicos. La automatización no sustituye esas
  comprobaciones.
- La protección contra contraseñas filtradas requiere el plan Pro de Supabase y
  sigue pendiente de una decisión de gasto. No se habilitaron registro público,
  cobros ni acceso estudiantil.
- El respaldo real de producción y su restauración en ensayo siguen pendientes
  de autorización explícita y de un proyecto de ensayo. Ninguna migración
  destructiva se incluyó en este cierre.

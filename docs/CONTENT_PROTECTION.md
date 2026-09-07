# Protección de contenido — privacidad y disuasión, no DRM

**Fecha:** 7 de septiembre de 2026
**Referencia:** `docs/PROJECT_STATUS.md` §4 D-2 ("Protección de contenido").

Ninguna medida de una aplicación web bloquea capturas del sistema, grabaciones
externas o fotografías. Por petición de la usuaria, el ocultamiento al perder
foco o cambiar de pestaña queda desactivado temporalmente. Se conservan la
disuasión de copiado de texto y la restricción de impresión/PDF.

## 1. Medidas implementadas

### 1.1 Texto de estudio

`components/protected-text.tsx` deshabilita selección, llamada contextual táctil
y menú contextual solo en bloques pasivos de lectura. No se aplica a inputs,
botones ni al formulario del examen en curso. La estructura accesible, el orden
de tabulación y los nombres de los controles permanecen intactos.

### 1.2 Cortina de privacidad global

`components/privacy-curtain.tsx` se monta una sola vez desde `app/layout.tsx`
cuando hay una sesión autenticada. Sustituye los overlays repetidos y la marca de
agua que antes se montaban dentro de cada material, mapa, tarjeta o revisión.

La cortina se activa únicamente con `beforeprint` y se retira con `afterprint`.
No registra eventos de foco, visibilidad o navegación: abrir la herramienta de
recortes o cambiar de ventana ya no cubre la aplicación con negro.

En impresión, `app/globals.css` oculta los hijos del `body` autenticado y muestra
solo el aviso de que la exportación está deshabilitada. Las páginas públicas no
llevan la clase `privacy-protected`, por lo que conservan su impresión normal.

`components/content-shield.tsx` queda temporalmente como envoltorio inerte para
no mezclar esta corrección con cambios en la experiencia de estudio. No registra
eventos, no crea intervalos y no renderiza UI adicional.

## 2. Medidas retiradas

- **Marca de agua repetida:** se retiró por invadir visualmente el contenido y
  porque el texto genérico no atribuía una copia a una cuenta concreta.
- **Detección de DevTools por dimensiones:** se retiró porque comparar
  `outerWidth`/`innerWidth` y `outerHeight`/`innerHeight` produce falsos positivos
  y negativos. No es una señal de captura.
- **Listeners e intervalos por bloque:** se sustituyeron por una sola cortina en
  el layout autenticado.

## 3. Límites reales

- PrtScn, la herramienta de recorte y los grabadores operan fuera del DOM y
  pueden capturar sin emitir `blur` ni `visibilitychange`.
- El sistema operativo puede congelar el cuadro antes de que JavaScript pinte
  una cortina posterior.
- Una cámara externa no es detectable por el navegador.
- `user-select: none`, la cortina y el aviso de impresión son fricción de uso,
  no cifrado ni DRM. El contenido ya fue enviado al navegador autorizado.

Una explicación persistente para tecnologías de asistencia declara la
restricción de impresión y que no se impiden capturas, grabaciones ni fotografías.

## 4. Medidas de infraestructura pendientes

El límite de tasa para rutas de lectura y el límite de sesiones concurrentes
siguen pendientes. Requieren una decisión de infraestructura, modelo de sesión,
umbrales, monitoreo y pruebas de RLS; esta corrección de interfaz no los
implementa. Tampoco cambia el registro privado, los cobros o las migraciones.

## 5. Verificación exigida

- `npm run test:content-protection`: montaje único, eventos simétricos,
  impresión autenticada y ausencia de marca/heurística.
- `npm run test:accessibility-contract`: controles y nombres accesibles de la
  experiencia de estudio.
- `npm run lint` y `npm run build`: contrato completo de TypeScript y Next.js.

Una captura manual o automatizada que todavía obtiene la imagen no constituye
un fallo. Los fallos verificables son que el contenido vuelva a ocultarse al
perder foco/visibilidad, que la cortina se monte más de una vez o que la
impresión autenticada revele contenido.

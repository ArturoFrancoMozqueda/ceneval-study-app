"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Disuasión de captura/grabación de pantalla para el contenido de estudio.
 *
 * Envuelve el contenido y lo oscurece (overlay) cuando detecta una de dos
 * señales heurísticas:
 *
 *   (a) la pestaña o la ventana pierde el foco — `visibilitychange` cuando
 *       el documento deja de estar visible, y `blur`/`focus` de `window`
 *       cuando la ventana del navegador pierde el foco del sistema
 *       operativo (por ejemplo, al cambiar a otra aplicación con Alt+Tab).
 *   (b) una heurística común para inferir que las herramientas de
 *       desarrollador están abiertas y acopladas a la ventana: compara
 *       `window.outerWidth`/`outerHeight` contra `innerWidth`/`innerHeight`.
 *       Un panel de devtools acoplado reduce el viewport interno sin
 *       cambiar el tamaño externo de la ventana, así que la diferencia
 *       crece por encima de un umbral razonable.
 *
 * La medida que sí permanece en una captura es una marca de agua repetida
 * sobre el contenido. También se oculta el contenido al imprimir. Ninguna de
 * las dos impide una captura, pero sí conserva la atribución del producto y
 * aumenta la fricción de una redistribución casual.
 *
 * LIMITACIÓN RECONOCIDA Y ACEPTADA (decisión D-2, ver
 * docs/PROJECT_STATUS.md §4 y docs/CONTENT_PROTECTION.md): esto NO
 * bloquea PrtScn, la herramienta de recorte del sistema operativo, una
 * grabación de pantalla con software externo, ni una foto tomada con otro
 * dispositivo. Ninguna aplicación web puede impedir eso — el sistema
 * operativo tiene acceso al framebuffer sin pasar por el navegador. Esto es
 * disuasión de grabación de pantalla casual mientras la persona cambia de
 * ventana o abre las herramientas de desarrollador, nada más.
 *
 * Ambas heurísticas pueden tener falsos positivos y falsos negativos y eso
 * se acepta a propósito:
 *   - Falso negativo conocido: devtools en ventana separada (undocked) no
 *     cambia las dimensiones de la ventana principal y no se detecta por
 *     (b); tampoco detecta un segundo dispositivo grabando la pantalla.
 *   - Falso positivo posible: un usuario que de verdad cambia de ventana
 *     para consultar otra cosa también activa el overlay; es el
 *     comportamiento esperado, no un error.
 *
 * Cuidados para no disparar en falso en el uso normal:
 *   - Abrir un enlace con `target="_blank"` desde un gesto del usuario no
 *     mueve el foco del navegador a la pestaña nueva en los navegadores
 *     modernos (Chrome, Firefox, Edge) salvo que el sitio lo fuerce
 *     explícitamente con `window.open` y foco manual, cosa que esta app no
 *     hace. Por eso abrir un enlace en pestaña nueva de forma normal no
 *     debería mostrar el overlay en la pestaña de origen.
 *   - La verificación de devtools solo compara dimensiones de la ventana
 *     del navegador; no inspecciona el DOM ni el overlay de desarrollo de
 *     Next.js (que se renderiza dentro de la misma página, no cambia
 *     `outerWidth`/`outerHeight` ni `innerWidth`/`innerHeight`), así que no
 *     se activa solo por tener `next dev` corriendo.
 * El overlay reactivo se muestra inmediatamente: esperar antes de pintarlo
 * permitía que una herramienta de recorte terminara la captura durante ese
 * intervalo. Aun así, el sistema operativo puede capturar sin emitir `blur`.
 */

const DEVTOOLS_SIZE_THRESHOLD = 160;
const DEVTOOLS_POLL_INTERVAL_MS = 700;

function isLikelyDevtoolsOpen() {
  if (typeof window === "undefined") return false;
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  return (
    widthDiff > DEVTOOLS_SIZE_THRESHOLD || heightDiff > DEVTOOLS_SIZE_THRESHOLD
  );
}

export function ContentShield({ children }: { children: ReactNode }) {
  const [shielded, setShielded] = useState(false);

  useEffect(() => {
    function unshieldFromFocus() {
      // Solo se quita por foco si la heurística de devtools tampoco está
      // disparando en este momento; si sigue abierta, el intervalo de abajo
      // se encarga de mantener o retirar el overlay.
      if (!isLikelyDevtoolsOpen()) setShielded(false);
    }

    function handleVisibilityChange() {
      if (document.hidden) setShielded(true);
      else unshieldFromFocus();
    }

    function handleWindowBlur() {
      setShielded(true);
    }

    function handleWindowFocus() {
      unshieldFromFocus();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    const devtoolsInterval = setInterval(() => {
      if (isLikelyDevtoolsOpen()) {
        setShielded(true);
      } else if (document.hasFocus() && !document.hidden) {
        setShielded(false);
      }
    }, DEVTOOLS_POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      clearInterval(devtoolsInterval);
    };
  }, []);

  return (
    <div className="content-shield relative">
      {children}
      <div
        aria-hidden="true"
        className="content-shield-watermark pointer-events-none absolute inset-0 z-30"
      />
      {shielded ? (
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center rounded-[inherit] bg-background/95 px-6 text-center backdrop-blur-md"
        >
          <p className="text-sm font-semibold text-foreground">
            Protección de contenido activa
          </p>
          <p className="mt-2 max-w-md text-xs leading-5 text-muted">
            El contenido se oculta al perder foco. Una página web no puede
            bloquear las capturas del sistema; la marca de uso personal
            permanece visible como medida disuasoria.
          </p>
        </div>
      ) : null}
      <p className="content-shield-print-notice hidden text-center text-sm font-semibold text-muted">
        La impresión y exportación a PDF del contenido de estudio están
        deshabilitadas.
      </p>
    </div>
  );
}

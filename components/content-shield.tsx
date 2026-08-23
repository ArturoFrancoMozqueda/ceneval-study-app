"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
 * El overlay se retira en cuanto la pestaña recupera el foco y la
 * heurística de devtools deja de disparar.
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
 *   - Se usa un pequeño retraso (debounce) antes de mostrar el overlay por
 *     pérdida de foco, para no parpadear con cambios de foco muy breves
 *     (por ejemplo, un clic que pasa brevemente por la barra de
 *     direcciones).
 */

const DEVTOOLS_SIZE_THRESHOLD = 160;
const BLUR_SHOW_DELAY_MS = 120;
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
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearBlurTimer() {
      if (blurTimer.current !== null) {
        clearTimeout(blurTimer.current);
        blurTimer.current = null;
      }
    }

    function scheduleShieldFromFocusLoss() {
      clearBlurTimer();
      blurTimer.current = setTimeout(() => {
        setShielded(true);
      }, BLUR_SHOW_DELAY_MS);
    }

    function unshieldFromFocus() {
      clearBlurTimer();
      // Solo se quita por foco si la heurística de devtools tampoco está
      // disparando en este momento; si sigue abierta, el intervalo de abajo
      // se encarga de mantener o retirar el overlay.
      if (!isLikelyDevtoolsOpen()) setShielded(false);
    }

    function handleVisibilityChange() {
      if (document.hidden) scheduleShieldFromFocusLoss();
      else unshieldFromFocus();
    }

    function handleWindowBlur() {
      scheduleShieldFromFocusLoss();
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
      clearBlurTimer();
    };
  }, []);

  return (
    <div className="relative">
      {children}
      {shielded ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-[inherit] bg-background/95 backdrop-blur-md"
        >
          <p className="px-6 text-center text-sm font-semibold text-muted">
            Contenido oculto mientras la ventana no está activa
          </p>
        </div>
      ) : null}
    </div>
  );
}

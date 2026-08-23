"use client";

import { createElement, type ElementType, type MouseEvent, type ReactNode } from "react";

/**
 * Disuasión de copiado para el contenido de estudio (texto de clases,
 * materiales, mapas conceptuales, tarjetas y reactivos ya resueltos).
 *
 * Qué hace: deshabilita la selección de texto con mouse/touch
 * (`user-select: none`) y bloquea el menú contextual (clic derecho o
 * mantener presionado) para que "Copiar" no aparezca sobre ese bloque.
 *
 * LIMITACIÓN RECONOCIDA Y ACEPTADA (decisión D-2, ver
 * docs/PROJECT_STATUS.md §4 y docs/CONTENT_PROTECTION.md): esto NO
 * impide una captura de pantalla real (PrtScn, la herramienta de recorte
 * del sistema operativo, ni una foto tomada con otro dispositivo), ni el
 * copiado desde las herramientas de desarrollador del navegador. Ninguna
 * aplicación web puede evitar eso. Es disuasión contra el copiado casual de
 * texto, no una protección garantizada.
 *
 * Regla de uso: envuelve únicamente bloques de texto de lectura. Nunca
 * envuelvas aquí un control interactivo (input, button, label de un campo
 * de formulario): esos deben permanecer completamente seleccionables y
 * operables con teclado y lector de pantalla. Este componente no cambia el
 * DOM accesible (no toca roles, nombres ni el orden de foco), así que no
 * afecta la navegación por teclado ni el uso con lector de pantalla.
 */
export const protectedTextClassName = "select-none [-webkit-touch-callout:none]";

export function blockCopyContextMenu(event: MouseEvent) {
  event.preventDefault();
}

export function ProtectedText({
  as,
  className = "",
  id,
  children,
}: {
  as?: ElementType;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return createElement(
    as ?? "div",
    {
      className: [protectedTextClassName, className].filter(Boolean).join(" "),
      onContextMenu: blockCopyContextMenu,
      id,
    },
    children,
  );
}

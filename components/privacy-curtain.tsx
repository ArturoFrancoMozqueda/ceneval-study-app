"use client";

import { useSyncExternalStore } from "react";

type CurtainReason = "print";

const activeReasons = new Set<CurtainReason>();
const listeners = new Set<() => void>();
let removeBrowserListeners: (() => void) | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setReason(reason: CurtainReason, active: boolean) {
  const changed = active
    ? !activeReasons.has(reason)
    : activeReasons.has(reason);
  if (!changed) return;

  if (active) activeReasons.add(reason);
  else activeReasons.delete(reason);
  emitChange();
}

function attachBrowserListeners() {
  const handleBeforePrint = () => setReason("print", true);
  const handleAfterPrint = () => setReason("print", false);

  window.addEventListener("beforeprint", handleBeforePrint);
  window.addEventListener("afterprint", handleAfterPrint);

  return () => {
    window.removeEventListener("beforeprint", handleBeforePrint);
    window.removeEventListener("afterprint", handleAfterPrint);
    activeReasons.clear();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!removeBrowserListeners) removeBrowserListeners = attachBrowserListeners();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && removeBrowserListeners) {
      removeBrowserListeners();
      removeBrowserListeners = null;
    }
  };
}

function getSnapshot() {
  return activeReasons.size > 0;
}

function getServerSnapshot() {
  return false;
}

/**
 * Conserva únicamente la protección de impresión de la aplicación autenticada.
 * El ocultamiento al cambiar de ventana está desactivado por petición de la usuaria.
 * No detecta ni bloquea capturas, grabaciones o fotografías del sistema.
 */
export function PrivacyCurtain() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <>
      <p className="sr-only">
        La impresión y exportación a PDF del contenido autenticado están deshabilitadas.
        Una página web no puede impedir capturas del sistema, grabaciones ni
        fotografías.
      </p>
      <div
        aria-hidden="true"
        className={`privacy-curtain fixed inset-0 z-[100] items-center justify-center bg-black px-6 text-center ${
          visible ? "flex" : "hidden"
        }`}
        data-state={visible ? "visible" : "hidden"}
      >
        <p className="privacy-curtain-print-copy hidden max-w-lg text-base font-semibold leading-7 text-foreground">
          La impresión y exportación a PDF del contenido autenticado están
          deshabilitadas.
        </p>
      </div>
    </>
  );
}

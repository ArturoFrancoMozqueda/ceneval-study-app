"use client";

import { useSyncExternalStore } from "react";

type CurtainReason = "focus" | "pagehide" | "print" | "visibility";

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

function syncFocusAndVisibility() {
  setReason("visibility", document.hidden);
  setReason("focus", !document.hidden && !document.hasFocus());
}

function attachBrowserListeners() {
  const handleBlur = () => setReason("focus", true);
  const handleFocus = () => syncFocusAndVisibility();
  const handleVisibilityChange = () => syncFocusAndVisibility();
  const handlePageHide = () => setReason("pagehide", true);
  const handlePageShow = () => {
    setReason("pagehide", false);
    syncFocusAndVisibility();
  };
  const handleBeforePrint = () => setReason("print", true);
  const handleAfterPrint = () => {
    setReason("print", false);
    syncFocusAndVisibility();
  };

  window.addEventListener("blur", handleBlur);
  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);
  window.addEventListener("beforeprint", handleBeforePrint);
  window.addEventListener("afterprint", handleAfterPrint);
  syncFocusAndVisibility();

  return () => {
    window.removeEventListener("blur", handleBlur);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("pageshow", handlePageShow);
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
 * Cortina de privacidad global para reducir exposiciones accidentales cuando
 * la aplicación autenticada deja de estar activa o entra en modo impresión.
 * No detecta ni bloquea capturas, grabaciones o fotografías del sistema.
 */
export function PrivacyCurtain() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <>
      <p className="sr-only">
        La aplicación oculta visualmente el contenido autenticado cuando la
        ventana deja de estar activa para reducir exposiciones accidentales.
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

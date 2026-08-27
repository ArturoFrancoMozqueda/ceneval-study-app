import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shieldSource = readFileSync("components/content-shield.tsx", "utf8");
const globalStyles = readFileSync("app/globals.css", "utf8");

test("la protección reacciona sin una ventana de retraso al perder foco", () => {
  assert.match(shieldSource, /function handleWindowBlur\(\) \{\s*setShielded\(true\)/);
  assert.match(shieldSource, /document\.hidden\) setShielded\(true\)/);
  assert.doesNotMatch(shieldSource, /BLUR_SHOW_DELAY_MS|setTimeout/);
});

test("cada bloque protegido conserva una marca de agua no interactiva", () => {
  assert.match(shieldSource, /content-shield-watermark/);
  assert.match(shieldSource, /aria-hidden="true"/);
  assert.match(shieldSource, /pointer-events-none/);
  assert.match(globalStyles, /SUBE LEGAL %C2%B7 USO PERSONAL/);
  assert.match(globalStyles, /background-repeat: repeat/);
});

test("la impresión sustituye el contenido por un aviso", () => {
  assert.match(shieldSource, /content-shield-print-notice/);
  assert.match(globalStyles, /@media print/);
  assert.match(
    globalStyles,
    /\.content-shield > :not\(\.content-shield-print-notice\)[\s\S]*display: none !important/,
  );
  assert.match(
    globalStyles,
    /\.content-shield > \.content-shield-print-notice[\s\S]*display: block !important/,
  );
});

test("el mensaje no promete un bloqueo imposible para una aplicación web", () => {
  assert.match(shieldSource, /no puede\s+bloquear las capturas del sistema/);
  assert.match(shieldSource, /medida disuasoria/);
});

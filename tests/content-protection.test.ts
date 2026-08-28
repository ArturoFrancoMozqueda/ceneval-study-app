import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const curtainSource = readFileSync("components/privacy-curtain.tsx", "utf8");
const layoutSource = readFileSync("app/layout.tsx", "utf8");
const shieldSource = readFileSync("components/content-shield.tsx", "utf8");
const globalStyles = readFileSync("app/globals.css", "utf8");

test("el layout monta una sola cortina para sesiones autenticadas", () => {
  assert.match(layoutSource, /import \{ PrivacyCurtain \}/);
  assert.equal(layoutSource.match(/<PrivacyCurtain\s*\/>/g)?.length, 1);
  assert.match(layoutSource, /user \? <PrivacyCurtain \/> : null/);
  assert.match(layoutSource, /user \? " privacy-protected" : ""/);
});

test("la cortina cubre las señales de privacidad sin heurísticas ni sondeo", () => {
  for (const eventName of [
    "blur",
    "focus",
    "visibilitychange",
    "pagehide",
    "pageshow",
    "beforeprint",
    "afterprint",
  ]) {
    assert.match(curtainSource, new RegExp(`addEventListener\\("${eventName}"`));
    assert.match(curtainSource, new RegExp(`removeEventListener\\("${eventName}"`));
  }
  assert.doesNotMatch(curtainSource, /setInterval|outerWidth|outerHeight|DEVTOOLS/);
  assert.doesNotMatch(globalStyles, /watermark|SUBE LEGAL %C2%B7 USO PERSONAL/);
});

test("la impresión sustituye solo la aplicación autenticada por un aviso", () => {
  assert.match(curtainSource, /privacy-curtain-print-copy/);
  assert.match(globalStyles, /@media print/);
  assert.match(
    globalStyles,
    /body\.privacy-protected > :not\(\.privacy-curtain\)[\s\S]*display: none !important/,
  );
  assert.match(
    globalStyles,
    /\.privacy-curtain-print-copy[\s\S]*display: block !important/,
  );
});

test("el mensaje declara honestamente el límite de una aplicación web", () => {
  assert.match(curtainSource, /no puede impedir/);
  assert.match(curtainSource, /capturas del sistema, grabaciones ni/);
  assert.match(curtainSource, /fotografías/);
  assert.match(curtainSource, /className="sr-only"/);
});

test("la cortina de foco es negra, opaca y silenciosa", () => {
  assert.match(curtainSource, /bg-black/);
  assert.match(curtainSource, /aria-hidden="true"/);
  assert.doesNotMatch(curtainSource, /aria-live|backdrop-blur|bg-background\//);
  assert.doesNotMatch(curtainSource, /role=\{/);
});

test("los envoltorios anteriores quedan inertes y sin UI duplicada", () => {
  assert.match(shieldSource, /return <>\{children\}<\/>/);
  assert.doesNotMatch(shieldSource, /useEffect|addEventListener|setInterval|watermark/);
});

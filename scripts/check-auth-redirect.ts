import assert from "node:assert/strict";
import { safeInternalPath } from "../lib/auth/safe-next";

const allowed = [
  "/",
  "/actualizar-contrasena",
  "/sesiones?vista=audios",
  "/clases/49#examen",
];

for (const path of allowed) {
  assert.equal(safeInternalPath(path), path);
}

const blocked = [
  null,
  "",
  "https://evil.example",
  "//evil.example",
  "/\\evil.example",
  "/%5cevil.example",
  "%2f%2fevil.example",
  "sesiones",
];

for (const path of blocked) {
  assert.equal(safeInternalPath(path), "/");
}

console.log("Redirecciones internas: casos permitidos y bloqueados aprobados.");

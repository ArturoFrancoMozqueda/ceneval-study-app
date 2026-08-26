import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actionSource = readFileSync("app/actions/account.ts", "utf8");
const pageSource = readFileSync("app/cuenta/page.tsx", "utf8");

test("una cuenta administradora no puede borrarse por autoservicio", () => {
  const roleCheck = actionSource.indexOf('user.role === "admin"');
  const deletion = actionSource.indexOf("auth.admin.deleteUser");

  assert.ok(roleCheck >= 0, "Falta bloquear la eliminación administrativa.");
  assert.ok(deletion >= 0, "No se encontró la operación de eliminación.");
  assert.ok(
    roleCheck < deletion,
    "El rol debe comprobarse antes de intentar eliminar la cuenta.",
  );
  assert.match(
    actionSource,
    /La cuenta administradora no se puede eliminar desde la aplicación/,
  );
  assert.match(pageSource, /user\.role === "student"/);
  assert.match(pageSource, /Cuenta administradora protegida/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  authCallbackUrl,
  isAuthorizedPrivateRegistration,
  PRIVATE_REGISTRATION_MESSAGE,
  validatePasswordInput,
  validateRegistrationInput,
} from "../lib/auth/registration";

test("normaliza una solicitud de activación válida", () => {
  const result = validateRegistrationInput({
    fullName: "  Fátima Franco  ",
    email: "  ADMIN@EXAMPLE.COM ",
    password: "frase-segura-2026",
  });

  assert.deepEqual(result, {
    success: true,
    data: {
      fullName: "Fátima Franco",
      email: "admin@example.com",
      password: "frase-segura-2026",
    },
  });
});

test("rechaza datos inválidos antes de llamar al proveedor", () => {
  assert.deepEqual(
    validateRegistrationInput({
      fullName: "F",
      email: "correo-invalido",
      password: "corta",
    }),
    { success: false, field: "fullName", message: "Escribe tu nombre." },
  );
  assert.deepEqual(validatePasswordInput("solo-letras-seguras"), {
    success: false,
    message: "Incluye al menos un número.",
  });
});

test("la activación privada falla cerrada y solo acepta ADMIN_EMAIL", () => {
  assert.equal(
    isAuthorizedPrivateRegistration("admin@example.com", undefined),
    false,
  );
  assert.equal(
    isAuthorizedPrivateRegistration(
      "persona@example.com",
      "admin@example.com",
    ),
    false,
  );
  assert.equal(
    isAuthorizedPrivateRegistration(
      " ADMIN@example.com ",
      "admin@EXAMPLE.com",
    ),
    true,
  );
});

test("el mensaje privado no revela si el correo existe o está autorizado", () => {
  assert.doesNotMatch(PRIVATE_REGISTRATION_MESSAGE, /existe|registrad|admin/i);
  assert.match(PRIVATE_REGISTRATION_MESSAGE, /si el correo está autorizado/i);
});

test("los callbacks usan el origen configurado, no cabeceras de la solicitud", () => {
  assert.equal(
    authCallbackUrl(
      "/auth/confirm",
      "https://ceneval-study-app.vercel.app/ruta-ignorada",
    ),
    "https://ceneval-study-app.vercel.app/auth/confirm",
  );
  assert.equal(
    authCallbackUrl(
      "/auth/confirm?next=/actualizar-contrasena",
      undefined,
    ),
    "http://localhost:3000/auth/confirm?next=/actualizar-contrasena",
  );
  assert.throws(
    () => authCallbackUrl("/auth/confirm", "javascript:alert(1)"),
    /HTTP o HTTPS/,
  );
});

test("el callback privado exige correo autorizado y rol admin sin promoverlo", () => {
  const source = readFileSync(
    new URL("../app/auth/confirm/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /isAuthorizedPrivateRegistration/);
  assert.match(source, /profile\?\.role !== "admin"/);
  assert.match(source, /await supabase\.auth\.signOut\(\)/);
  assert.doesNotMatch(source, /update\(\{ role: "admin" \}\)/);
});

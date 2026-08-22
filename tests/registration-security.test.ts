import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  authCallbackUrl,
  isAuthorizedPrivateRegistration,
  REGISTRATION_CONFIRMATION_MESSAGE,
  validatePasswordInput,
  validateRegistrationInput,
} from "../lib/auth/registration";

test("normaliza una solicitud de registro válida", () => {
  const result = validateRegistrationInput({
    fullName: "  Fátima Franco  ",
    email: "  ADMIN@EXAMPLE.COM ",
    password: "frase-segura-2026",
    termsAccepted: true,
  });

  assert.deepEqual(result, {
    success: true,
    data: {
      fullName: "Fátima Franco",
      email: "admin@example.com",
      password: "frase-segura-2026",
      termsAccepted: true,
    },
  });
});

test("rechaza datos inválidos antes de llamar al proveedor", () => {
  assert.deepEqual(
    validateRegistrationInput({
      fullName: "F",
      email: "correo-invalido",
      password: "corta",
      termsAccepted: true,
    }),
    { success: false, field: "fullName", message: "Escribe tu nombre." },
  );
  assert.deepEqual(
    validateRegistrationInput({
      fullName: "Fátima Franco",
      email: "admin@example.com",
      password: "frase-segura-2026",
      termsAccepted: false,
    }),
    {
      success: false,
      field: "termsAccepted",
      message: "Debes aceptar los términos de uso y el aviso de privacidad.",
    },
  );
  assert.deepEqual(validatePasswordInput("solo-letras-seguras"), {
    success: false,
    message: "Incluye al menos un número.",
  });
});

test("el registro privado falla cerrado y solo acepta ADMIN_EMAIL", () => {
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

test("el mensaje de confirmación no revela si el correo está autorizado", () => {
  assert.doesNotMatch(
    REGISTRATION_CONFIRMATION_MESSAGE,
    /existe|registrad|admin|autorizado/i,
  );
  assert.match(REGISTRATION_CONFIRMATION_MESSAGE, /confirmar tu cuenta/i);
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

test("login y registro muestran un flujo convencional sin lenguaje operativo", () => {
  const registrationPage = readFileSync(
    new URL("../app/registro/page.tsx", import.meta.url),
    "utf8",
  );
  const signInForm = readFileSync(
    new URL("../components/sign-in-form.tsx", import.meta.url),
    "utf8",
  );
  const visibleSource = `${registrationPage}\n${signInForm}`;

  assert.match(visibleSource, /Crea tu cuenta/);
  assert.match(visibleSource, /Regístrate/);
  assert.doesNotMatch(
    visibleSource,
    /administradora|invitaci[oó]n|bootstrap|activaci[oó]n|correo autorizado/i,
  );
});

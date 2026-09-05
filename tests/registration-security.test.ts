import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  authCallbackUrl,
  validatePasswordInput,
} from "../lib/auth/registration";

function tomlSection(source: string, name: string) {
  const marker = `[${name}]`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `Falta la sección TOML ${marker}.`);
  const body = source.slice(start + marker.length);
  const nextSection = body.search(/\r?\n\[/);
  return nextSection === -1 ? body : body.slice(0, nextSection);
}

test("la contraseña mantiene el contrato de seguridad", () => {
  assert.deepEqual(validatePasswordInput("solo-letras-seguras"), {
    success: false,
    message: "Incluye al menos un número.",
  });
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

test("el callback admite perfiles invitados sin promover roles", () => {
  const source = readFileSync(
    new URL("../app/auth/confirm/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /profile\.role !== "admin"/);
  assert.match(source, /profile\.role !== "student"/);
  assert.match(source, /await supabase\.auth\.signOut\(\)/);
  assert.doesNotMatch(source, /ADMIN_EMAIL|isAuthorizedPrivateRegistration/);
  assert.doesNotMatch(source, /update\(\{ role: "admin" \}\)/);
});

test("el acceso es por invitación y el registro no puede crear cuentas", () => {
  const registrationPage = readFileSync(
    new URL("../app/registro/page.tsx", import.meta.url),
    "utf8",
  );
  const signInForm = readFileSync(
    new URL("../components/sign-in-form.tsx", import.meta.url),
    "utf8",
  );
  const authActions = readFileSync(
    new URL("../app/actions/auth.ts", import.meta.url),
    "utf8",
  );
  const authConfig = readFileSync(
    new URL("../supabase/config.toml", import.meta.url),
    "utf8",
  );

  assert.match(registrationPage, /El registro aún no está abierto/);
  assert.match(registrationPage, /no\s+recopila datos ni crea solicitudes/);
  assert.doesNotMatch(registrationPage, /<form|signUpAction|AuthField/);
  assert.match(signInForm, /solo para cuentas invitadas/);
  assert.doesNotMatch(signInForm, /Regístrate/);
  assert.doesNotMatch(authActions, /auth\.signUp|signUpAction/);
  assert.match(tomlSection(authConfig, "auth"), /^enable_signup = false$/m);
  assert.match(tomlSection(authConfig, "auth"), /^enable_anonymous_sign_ins = false$/m);
  assert.match(tomlSection(authConfig, "auth.email"), /^enable_signup = false$/m);
});

test("la primera entrada registra aceptación propia antes de estudiar", () => {
  const authActions = readFileSync(
    new URL("../app/actions/auth.ts", import.meta.url),
    "utf8",
  );
  const authSource = readFileSync(
    new URL("../lib/auth.ts", import.meta.url),
    "utf8",
  );
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260905164824_secure_invited_terms_acceptance.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const appShell = readFileSync(
    new URL("../components/app-shell.tsx", import.meta.url),
    "utf8",
  );
  const examGateMigration = readFileSync(
    new URL(
      "../supabase/migrations/20260905165955_gate_exam_submission_on_terms.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const authConfig = readFileSync(
    new URL("../supabase/config.toml", import.meta.url),
    "utf8",
  );

  assert.match(authActions, /export async function acceptTermsAction/);
  assert.match(authActions, /formData\.get\("termsAccepted"\) !== "on"/);
  assert.match(authActions, /supabase\.auth\.getUser\(\)/);
  assert.match(authActions, /supabase\.rpc\("accept_terms_v1"\)/);
  assert.doesNotMatch(authActions, /formData\.get\("(?:id|userId)"\)/);
  assert.match(authSource, /if \(!user\.termsAcceptedAt\) redirect\("\/aceptar-terminos"\)/);
  assert.match(migration, /revoke update \(terms_accepted_at\)/);
  assert.match(migration, /set terms_accepted_at = coalesce\(terms_accepted_at, now\(\)\)/);
  assert.match(migration, /create policy accepted_terms_access_gate/);
  assert.match(examGateMigration, /security invoker/);
  assert.match(examGateMigration, /private\.has_study_access\(\)/);
  assert.doesNotMatch(
    tomlSection(authConfig, "api"),
    /schemas\s*=\s*\[[^\]]*"private"/,
  );
  assert.match(appShell, /"\/aceptar-terminos"/);
});

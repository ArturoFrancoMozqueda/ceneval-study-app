import assert from "node:assert/strict";
import test from "node:test";
import {
  invalidCredentialsState,
  validateSignInInput,
} from "../lib/auth-state";

test("identifica cada campo obligatorio sin devolver credenciales", () => {
  const result = validateSignInInput("", "");

  assert.deepEqual(result, {
    fieldErrors: {
      email: "Escribe tu correo electrónico.",
      password: "Escribe tu contraseña.",
    },
    invalidFields: ["email", "password"],
  });
});

test("acepta credenciales con formato suficiente para intentar el acceso", () => {
  assert.equal(validateSignInInput("fatima@example.com", "segura123"), null);
});

test("el fallo de credenciales es genérico y no contiene los valores enviados", () => {
  const email = "fatima@example.com";
  const password = "secreto-no-repetir";
  const state = invalidCredentialsState();
  const serializedState = JSON.stringify(state);

  assert.deepEqual(state.invalidFields, ["email", "password"]);
  assert.doesNotMatch(serializedState, new RegExp(email));
  assert.doesNotMatch(serializedState, new RegExp(password));
  assert.doesNotMatch(serializedState, /existe|registrad|encontrad/i);
});

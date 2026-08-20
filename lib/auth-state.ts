export type SignInField = "email" | "password";

export type SignInState = {
  message?: string;
  fieldErrors?: Partial<Record<SignInField, string>>;
  invalidFields?: SignInField[];
};

export function validateSignInInput(
  email: string,
  password: string,
): SignInState | null {
  const fieldErrors: SignInState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "Escribe tu correo electrónico.";
  } else if (!email.includes("@")) {
    fieldErrors.email = "Escribe un correo válido.";
  }

  if (!password) {
    fieldErrors.password = "Escribe tu contraseña.";
  }

  const invalidFields = Object.keys(fieldErrors) as SignInField[];

  return invalidFields.length ? { fieldErrors, invalidFields } : null;
}

export function invalidCredentialsState(): SignInState {
  return {
    message:
      "No pudimos iniciar sesión. Revisa tus datos o confirma tu correo.",
    invalidFields: ["email", "password"],
  };
}

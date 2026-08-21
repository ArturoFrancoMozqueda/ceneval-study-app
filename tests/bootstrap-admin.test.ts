import assert from "node:assert/strict";
import test from "node:test";
import {
  bootstrapAdmin,
  buildInviteRedirect,
  parseBootstrapAdminArgs,
  requireAllowedAdminEmail,
  type BootstrapAdminGateway,
} from "../scripts/lib/bootstrap-admin";

test("exige correo y confirmación explícita", () => {
  assert.throws(() => parseBootstrapAdminArgs([]), /Falta --email/);
  assert.throws(
    () => parseBootstrapAdminArgs(["--email=admin@example.com"]),
    /Falta --confirm-production/,
  );
  assert.deepEqual(
    parseBootstrapAdminArgs([
      "--email=ADMIN@EXAMPLE.COM",
      "--confirm-production",
    ]),
    { email: "admin@example.com" },
  );
});

test("construye un retorno fijo al cambio de contraseña", () => {
  assert.equal(
    buildInviteRedirect("https://ceneval.example/base?unsafe=yes"),
    "https://ceneval.example/auth/confirm?next=%2Factualizar-contrasena",
  );
  assert.throws(() => buildInviteRedirect("javascript:alert(1)"), /http o https/);
});

test("exige que el correo coincida con la allowlist administrativa", () => {
  assert.equal(
    requireAllowedAdminEmail("ADMIN@example.com", " admin@EXAMPLE.com "),
    "admin@example.com",
  );
  assert.throws(
    () => requireAllowedAdminEmail("other@example.com", "admin@example.com"),
    /coincidir exactamente/,
  );
  assert.throws(
    () => requireAllowedAdminEmail("admin@example.com", undefined),
    /Falta ADMIN_EMAIL/,
  );
});

test("invita una cuenta nueva y verifica la promoción", async () => {
  const calls: string[] = [];
  const gateway: BootstrapAdminGateway = {
    async findUserByEmail(email) {
      calls.push(`find:${email}`);
      return null;
    },
    async inviteUser(email, redirectTo) {
      calls.push(`invite:${email}:${redirectTo}`);
      return { id: "user-1" };
    },
    async promoteProfile(userId) {
      calls.push(`promote:${userId}`);
      return { id: userId, role: "admin" };
    },
  };

  const result = await bootstrapAdmin(
    gateway,
    "ADMIN@example.com",
    "https://app.example/auth/confirm",
  );

  assert.deepEqual(result, {
    email: "admin@example.com",
    invited: true,
    userId: "user-1",
  });
  assert.deepEqual(calls, [
    "find:admin@example.com",
    "invite:admin@example.com:https://app.example/auth/confirm",
    "promote:user-1",
  ]);
});

test("promueve una cuenta existente sin enviar otra invitación", async () => {
  let invited = false;
  const gateway: BootstrapAdminGateway = {
    async findUserByEmail() {
      return { id: "existing", emailConfirmed: true };
    },
    async inviteUser() {
      invited = true;
      return { id: "unexpected" };
    },
    async promoteProfile(userId) {
      return { id: userId, role: "admin" };
    },
  };

  const result = await bootstrapAdmin(
    gateway,
    "admin@example.com",
    "https://app.example/auth/confirm",
  );
  assert.equal(result.invited, false);
  assert.equal(invited, false);
});

test("falla cerrado si no puede verificar el rol", async () => {
  const gateway: BootstrapAdminGateway = {
    async findUserByEmail() {
      return { id: "user-1", emailConfirmed: true };
    },
    async inviteUser() {
      return { id: "unused" };
    },
    async promoteProfile(userId) {
      return { id: userId, role: "student" };
    },
  };

  await assert.rejects(
    bootstrapAdmin(
      gateway,
      "admin@example.com",
      "https://app.example/auth/confirm",
    ),
    /verificar el rol administrativo/,
  );
});

test("reenvía la invitación si la cuenta aún no está confirmada", async () => {
  let invitations = 0;
  const gateway: BootstrapAdminGateway = {
    async findUserByEmail() {
      return { id: "pending", emailConfirmed: false };
    },
    async inviteUser() {
      invitations += 1;
      return { id: "pending" };
    },
    async promoteProfile(userId) {
      return { id: userId, role: "admin" };
    },
  };

  const result = await bootstrapAdmin(
    gateway,
    "admin@example.com",
    "https://app.example/auth/confirm",
  );
  assert.equal(invitations, 1);
  assert.equal(result.invited, true);
});

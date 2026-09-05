import { createClient } from "@supabase/supabase-js";
import {
  bootstrapAdmin,
  buildInviteRedirect,
  parseBootstrapAdminArgs,
  requireAllowedAdminEmail,
  type BootstrapAdminGateway,
} from "./lib/bootstrap-admin";

const USERS_PER_PAGE = 200;
const MAX_USER_PAGES = 100;

async function main() {
  const { email } = parseBootstrapAdminArgs(process.argv.slice(2));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) throw new Error("Falta NEXT_PUBLIC_SITE_URL.");
  requireAllowedAdminEmail(email, process.env.ADMIN_EMAIL);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!supabaseUrl || !secretKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY.");
  }
  const admin = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const gateway: BootstrapAdminGateway = {
    async findUserByEmail(expectedEmail) {
      for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({
          page,
          perPage: USERS_PER_PAGE,
        });
        if (error) {
          throw new Error("No se pudo consultar Auth.", { cause: error });
        }

        const match = data.users.find(
          (user) => user.email?.trim().toLowerCase() === expectedEmail,
        );
        if (match) {
          return {
            id: match.id,
            emailConfirmed: Boolean(match.email_confirmed_at),
          };
        }
        if (data.users.length < USERS_PER_PAGE) return null;
      }
      throw new Error("La búsqueda de Auth excedió el límite operativo seguro.");
    },
    async inviteUser(invitedEmail, redirectTo) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(
        invitedEmail,
        { redirectTo },
      );
      if (error) {
        throw new Error("No se pudo enviar la invitación.", { cause: error });
      }
      return { id: data.user.id };
    },
    async promoteProfile(userId) {
      const { data, error } = await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId)
        .select("id,role")
        .single();
      if (error) {
        throw new Error("No se pudo asignar el rol.", { cause: error });
      }
      return data;
    },
  };

  const result = await bootstrapAdmin(
    gateway,
    email,
    buildInviteRedirect(siteUrl),
  );

  console.log(
    result.invited
      ? "Invitación administrativa enviada; rol verificado."
      : "Cuenta existente; rol administrativo verificado.",
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Falló el bootstrap administrativo.",
  );
  process.exitCode = 1;
});

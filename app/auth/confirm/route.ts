import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isPrivateAccessOnly } from "@/lib/access";
import { isAuthorizedPrivateRegistration } from "@/lib/auth/registration";
import { safeInternalPath } from "@/lib/auth/safe-next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next = safeInternalPath(
    requestedNext ?? (type === "invite" ? "/actualizar-contrasena" : null),
  );
  const supabase = await createServerSupabaseClient();

  let error: Error | null = null;
  if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error("Enlace incompleto");
  }

  if (error) {
    return NextResponse.redirect(
      new URL(
        "/iniciar-sesion?error=El enlace es inválido o ya venció.",
        request.url,
      ),
    );
  }

  if (isPrivateAccessOnly()) {
    const { data, error: userError } = await supabase.auth.getUser();
    const authorized =
      !userError &&
      data.user?.email &&
      isAuthorizedPrivateRegistration(
        data.user.email,
        process.env.ADMIN_EMAIL,
      );

    if (!authorized || !data.user) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(
          "/iniciar-sesion?error=El enlace es inválido o ya venció.",
          request.url,
        ),
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(
          "/iniciar-sesion?message=Correo confirmado. La activación administrativa está pendiente.",
          request.url,
        ),
      );
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

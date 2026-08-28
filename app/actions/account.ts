"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import {
  EXAM_TARGET_HEURISTIC_VERSION,
  validateFutureExamTargetDate,
} from "@/lib/study/exam-target";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateExamTargetDateAction(formData: FormData) {
  const user = await requireUser();
  const clear = formData.get("intent") === "clear";
  const rawDate = String(formData.get("examTargetDate") ?? "").trim();
  const examTargetDate = clear ? null : validateFutureExamTargetDate(rawDate);

  if (!clear && !examTargetDate) {
    redirect(
      `/cuenta?error=${encodeURIComponent("Elige una fecha posterior a hoy.")}`,
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      exam_target_date: examTargetDate,
      exam_target_heuristic_version: examTargetDate
        ? EXAM_TARGET_HEURISTIC_VERSION
        : null,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    writeDependencyFailure({ error, operation: "updateExamTargetDateAction" });
    redirect(
      `/cuenta?error=${encodeURIComponent(
        "No pudimos guardar la fecha. Intenta nuevamente.",
      )}`,
    );
  }

  redirect(
    `/cuenta?saved=${encodeURIComponent(
      examTargetDate ? "Fecha objetivo guardada." : "Fecha objetivo eliminada.",
    )}`,
  );
}

// L-4 (docs/PROJECT_STATUS.md §5): lets a student request permanent
// deletion of their own account and personal data. Deleting the
// auth.users row cascades (ON DELETE CASCADE) to profiles, study_progress,
// quick_check_responses, flashcard_reviews, exam_attempts and exam_answers.
export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();

  // La eliminación autoservicio está pensada para estudiantes. Una cuenta
  // administrativa se recupera mediante el procedimiento operativo de
  // bootstrap y no debe poder dejar la instalación sin administración desde
  // una petición web.
  if (user.role === "admin") {
    redirect(
      `/cuenta?error=${encodeURIComponent(
        "La cuenta administradora no se puede eliminar desde la aplicación.",
      )}`,
    );
  }

  const confirmed = formData.get("confirmDeletion") === "on";

  if (!confirmed) {
    redirect(
      `/cuenta?error=${encodeURIComponent(
        "Marca la casilla de confirmación para eliminar tu cuenta.",
      )}`,
    );
  }

  const { error } = await getSupabaseAdminClient().auth.admin.deleteUser(
    user.id,
  );

  if (error) {
    writeDependencyFailure({ error, operation: "deleteAccountAction" });
    redirect(
      `/cuenta?error=${encodeURIComponent(
        "No pudimos eliminar tu cuenta. Intenta nuevamente o escribe a soporte.",
      )}`,
    );
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  redirect(
    `/iniciar-sesion?message=${encodeURIComponent(
      "Tu cuenta y tus datos personales fueron eliminados.",
    )}`,
  );
}

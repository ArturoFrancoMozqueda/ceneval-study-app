import Link from "next/link";
import { FirstStudyExperience } from "@/components/first-study-experience";
import { ArrowRightIcon, BookIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import {
  getPublishedSessions,
  getReviewOverview,
  getSubjects,
} from "@/lib/data/academic";
import { deriveStudyOnboarding } from "@/lib/study/onboarding";
import { getTopicJourneyStatus } from "@/lib/study/progress-presentation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function HomeDashboard() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const [attempts, progressResult] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("score,total_questions")
      .eq("user_id", user.id),
    supabase
      .from("study_progress")
      .select("topic_id,current_step,completed_steps,last_activity_at")
      .eq("user_id", user.id)
      .order("last_activity_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const progress = progressResult.data;
  const hasActivity = Boolean(progress || attempts.data?.length);

  if (!hasActivity) {
    const sessions = await getPublishedSessions(user.id);
    const onboarding = deriveStudyOnboarding({ hasActivity, sessions });

    if (onboarding.kind !== "returning") {
      return (
        <FirstStudyExperience
          fullName={user.fullName}
          role={user.role}
          state={onboarding}
        />
      );
    }
  }

  const [subjects, reviewOverview] = await Promise.all([
    getSubjects(),
    getReviewOverview(user.id),
  ]);
  const totalAnswers = (attempts.data ?? []).reduce(
    (sum, attempt) => sum + (attempt.total_questions ?? 0),
    0,
  );
  const correctAnswers = (attempts.data ?? []).reduce(
    (sum, attempt) => sum + (attempt.score ?? 0),
    0,
  );
  const { data: nextTopic } = progress?.topic_id
    ? await supabase
        .from("topics")
        .select("id,title")
        .eq("id", progress.topic_id)
        .maybeSingle()
    : { data: null };
  const completedCount = Array.isArray(progress?.completed_steps)
    ? progress.completed_steps.length
    : 0;
  const journeyStatus = getTopicJourneyStatus(completedCount);

  return (
    <div>
      <section className="max-w-3xl">
        <p className="text-sm font-semibold text-success">Tu preparación</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {user.fullName
            ? `Hola, ${user.fullName}.`
            : "Bienvenida a tu biblioteca."}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-muted">
          Comprende la norma, decide sobre casos y practica lo que necesitas
          reforzar.
        </p>
      </section>

      <section className="mt-8 rounded-3xl bg-brand p-6 text-white sm:p-8">
        <p className="text-sm font-semibold text-white/70">Siguiente paso</p>
        <h2 className="mt-2 text-2xl font-semibold">
          {nextTopic
            ? `Continúa: ${nextTopic.title}`
            : "Comienza una sesión breve de estudio"}
        </h2>
        <p className="mt-2 max-w-2xl leading-7 text-white/80">
          {nextTopic
            ? `${journeyStatus}: retoma exactamente donde pausaste.`
            : "Elige un tema y avanza con preguntas, casos y repaso activo."}
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-5 font-semibold text-brand"
          href={nextTopic ? `/temas/${nextTopic.id}` : "/estudiar"}
        >
          {nextTopic ? "Continuar sesión" : "Elegir un tema"}
        </Link>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Recorrido del último tema", value: journeyStatus },
          {
            label: "Conceptos para repasar",
            value: reviewOverview.currentDifficultCount,
          },
          {
            label: "Comprensión en exámenes",
            value: totalAnswers
              ? `${Math.round((correctAnswers / totalAnswers) * 100)}%`
              : "Por comenzar",
          },
        ].map(({ label, value }) => (
          <article
            className="rounded-2xl border border-border bg-white p-5"
            key={label}
          >
            <p className="text-xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </article>
        ))}
      </section>

      <section
        aria-labelledby="progreso-por-materia"
        className="mt-8 flex flex-col gap-5 rounded-2xl border border-success/20 bg-success-soft/55 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-success">Tu registro</p>
          <h2 className="mt-1 text-xl font-semibold" id="progreso-por-materia">
            Mira tu avance materia por materia
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/75">
            Compara temas iniciados y finalizados con resultados reales de
            exámenes.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 self-start sm:self-auto">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
            href="/progreso"
          >
            Ver progreso
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand/20 bg-surface px-5 text-sm font-semibold text-brand hover:bg-background"
            href="/progreso/examenes"
          >
            Historial de exámenes
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-success">Biblioteca</p>
            <h2 className="mt-1 text-2xl font-semibold">Elige qué aprender</h2>
          </div>
          <Link className="text-sm font-semibold text-brand" href="/materias">
            Ver todo
          </Link>
        </div>
        {subjects.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {subjects.slice(0, 4).map((subject) => (
              <Link
                className="group rounded-2xl border border-border bg-white p-5 hover:border-brand/30"
                href={`/materias/${subject.id}`}
                key={subject.id}
              >
                <div className="flex items-start justify-between">
                  <BookIcon className="size-7 text-success" />
                  <ArrowRightIcon className="size-5 text-brand transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{subject.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                  {subject.description}
                </p>
                <p className="mt-4 font-mono text-xs text-muted">
                  {subject.classCount} clases · {subject.topicCount} temas
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
            Aún no hay clases publicadas.
          </div>
        )}
      </section>
    </div>
  );
}

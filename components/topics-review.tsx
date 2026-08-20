"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createTopicAction,
  updateTopicStatusAction,
} from "@/app/actions/academic";
import { ArrowRightIcon, PlusIcon } from "@/components/icons";
import type {
  StudyClass,
  Subject,
  Topic,
} from "@/lib/data/academic";
import { topicApprovalStatusLabels } from "@/lib/status-labels";

const statusStyles: Record<Topic["approvalStatus"], string> = {
  pending: "bg-amber-50 text-warning",
  approved: "bg-success-soft text-success",
  rejected: "bg-red-50 text-danger",
};

export function TopicsReview({
  studyClass,
  subject,
  topics,
}: {
  studyClass: StudyClass;
  subject: Subject;
  topics: Topic[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAddTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError("Escribe el nombre del tema.");
      return;
    }

    setIsSubmitting(true);
    const result = await createTopicAction(
      studyClass.id,
      new FormData(event.currentTarget),
    );

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setTitle("");
    setDescription("");
    setShowForm(false);
    setIsSubmitting(false);
    router.refresh();
  }

  async function changeTopicStatus(
    topicId: number,
    status: "approved" | "rejected",
  ) {
    const result = await updateTopicStatusAction(
      topicId,
      studyClass.id,
      status,
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  const approvedTopics = topics.filter(
    (topic) => topic.approvalStatus === "approved",
  );

  return (
    <div>
      <nav aria-label="Migas de navegación">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <li>
            <Link className="hover:text-brand" href="/materias">
              Materias
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              className="hover:text-brand"
              href={`/materias/${subject.id}`}
            >
              {subject.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              className="hover:text-brand"
              href={`/clases/${studyClass.id}`}
            >
              {studyClass.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Temas</li>
        </ol>
      </nav>

      <header className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-success">
            Organiza la clase
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Revisión de temas
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            Aprueba las propuestas útiles o agrega un tema manualmente. Las
            propuestas mostradas son demostrativas hasta integrar IA.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-brand hover:bg-background sm:self-auto"
          onClick={() => setShowForm((current) => !current)}
          type="button"
        >
          <PlusIcon className="size-4" />
          Agregar tema
        </button>
      </header>

      {showForm ? (
        <form
          className="mt-7 rounded-2xl border border-brand/15 bg-surface p-5 shadow-sm sm:p-6"
          onSubmit={handleAddTopic}
        >
          <h2 className="text-lg font-semibold">Nuevo tema manual</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold" htmlFor="topic-title">
                Nombre
              </label>
              <input
                aria-invalid={Boolean(error)}
                className={`mt-2 min-h-12 w-full rounded-xl border bg-white px-4 ${
                  error ? "border-danger" : "border-border"
                }`}
                id="topic-title"
                name="title"
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (error) setError("");
                }}
                value={title}
              />
              {error ? (
                <p className="mt-2 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <div>
              <label
                className="text-sm font-semibold"
                htmlFor="topic-description"
              >
                Descripción <span className="font-normal text-muted">(opcional)</span>
              </label>
              <input
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4"
                id="topic-description"
                name="description"
                onChange={(event) => setDescription(event.target.value)}
                value={description}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Guardando…" : "Guardar tema"}
            </button>
            <button
              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-muted"
              onClick={() => setShowForm(false)}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <section className="mt-8">
        {topics.length > 0 ? (
          <div className="space-y-4">
            {topics.map((topic) => (
              <article
                className="rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_25px_rgb(23_32_51_/_0.04)] sm:p-6"
                key={topic.id}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{topic.title}</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[topic.approvalStatus]}`}
                      >
                        {topicApprovalStatusLabels[topic.approvalStatus]}
                      </span>
                      <span className="rounded-full bg-background px-2.5 py-1 text-xs text-muted">
                        {topic.sourceType === "manual"
                          ? "Manual"
                          : "Propuesta"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {topic.description || "Sin descripción."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {topic.approvalStatus !== "approved" ? (
                      <button
                        className="min-h-10 rounded-xl bg-success-soft px-4 text-sm font-semibold text-success"
                        onClick={() =>
                          changeTopicStatus(topic.id, "approved")
                        }
                        type="button"
                      >
                        Aprobar
                      </button>
                    ) : (
                      <Link
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-brand hover:bg-background"
                        href={`/temas/${topic.id}`}
                      >
                        Abrir tema
                        <ArrowRightIcon className="size-4" />
                      </Link>
                    )}
                    {topic.approvalStatus !== "rejected" ? (
                      <button
                        className="min-h-10 rounded-xl px-4 text-sm font-semibold text-muted hover:bg-background"
                        onClick={() =>
                          changeTopicStatus(topic.id, "rejected")
                        }
                        type="button"
                      >
                        Rechazar
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-9 text-center">
            <h2 className="text-xl font-semibold">Agrega el primer tema</h2>
            <p className="mx-auto mt-2 max-w-md leading-7 text-muted">
              La detección automática llegará con IA. Por ahora puedes organizar
              la clase manualmente.
            </p>
            <button
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white"
              onClick={() => setShowForm(true)}
              type="button"
            >
              <PlusIcon className="size-4" />
              Crear tema
            </button>
          </div>
        )}
      </section>

      {approvedTopics.length > 0 ? (
        <div className="mt-7 flex justify-end">
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
            href={`/temas/${approvedTopics[0].id}`}
          >
            Continuar con temas aprobados
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

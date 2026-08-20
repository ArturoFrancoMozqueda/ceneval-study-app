"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePublicationStatusAction } from "@/app/actions/academic";
import type { PublicationStatus } from "@/lib/data/academic";
import {
  minimumFlashcards,
  requiredExamQuestions,
  requiredMaterialLabels,
  type PublicationReadinessFailure,
  type PublicationTopicDiagnostic,
} from "@/lib/publication-readiness";
import { publicationStatusActionLabels } from "@/lib/status-labels";

function TopicRequirements({ topic }: { topic: PublicationTopicDiagnostic }) {
  return (
    <li>
      <p className="font-semibold text-foreground">{topic.topicTitle}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {topic.missingMaterialTypes.length > 0 ? (
          <li>
            Materiales faltantes: {topic.missingMaterialTypes
              .map((type) => requiredMaterialLabels[type])
              .join(", ")}.
          </li>
        ) : null}
        {!topic.hasConceptMap ? (
          <li>Falta el mapa conceptual vigente.</li>
        ) : null}
        {topic.flashcardCount < minimumFlashcards ? (
          <li>
            Faltan {minimumFlashcards - topic.flashcardCount} flashcards
            ({topic.flashcardCount} de {minimumFlashcards}).
          </li>
        ) : null}
        {!topic.hasCurrentExam ? <li>Falta el examen vigente.</li> : null}
        {topic.hasCurrentExam &&
        topic.examQuestionCount < requiredExamQuestions ? (
          <li>
            Faltan {requiredExamQuestions - topic.examQuestionCount} preguntas
            del examen ({topic.examQuestionCount} de {requiredExamQuestions}).
          </li>
        ) : null}
        {topic.hasCurrentExam &&
        topic.examQuestionCount > requiredExamQuestions ? (
          <li>
            Sobran {topic.examQuestionCount - requiredExamQuestions} preguntas
            del examen ({topic.examQuestionCount} en total; deben ser exactamente{" "}
            {requiredExamQuestions}).
          </li>
        ) : null}
      </ul>
    </li>
  );
}

function PublicationFailure({
  message,
  readiness,
}: {
  message: string;
  readiness?: PublicationReadinessFailure;
}) {
  return (
    <div
      aria-atomic="true"
      aria-live="assertive"
      className="mt-4 rounded-xl border border-danger/30 bg-red-50 p-4 text-sm text-danger"
      role="alert"
    >
      <p className="font-semibold">{message}</p>
      {readiness?.reason === "no-approved-topics" ? (
        <p className="mt-2">Aprueba al menos un tema antes de publicar.</p>
      ) : null}
      {readiness?.reason === "incomplete-topics" ? (
        <ul className="mt-3 space-y-3">
          {readiness.topics.map((topic) => (
            <TopicRequirements key={topic.topicId} topic={topic} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PublicationControls({
  classId,
  currentStatus,
}: {
  classId: number;
  currentStatus: PublicationStatus;
}) {
  const router = useRouter();
  const [failure, setFailure] = useState<{
    message: string;
    readiness?: PublicationReadinessFailure;
  } | null>(null);
  const [pending, setPending] = useState<PublicationStatus | null>(null);
  const [confirmationStatus, setConfirmationStatus] = useState<
    "published" | "withdrawn" | null
  >(null);

  async function changeStatus(status: PublicationStatus) {
    setPending(status);
    setFailure(null);
    const result = await updatePublicationStatusAction(classId, status);
    setPending(null);
    if (result.error) {
      setFailure({
        message: result.error,
        readiness: result.publicationReadiness,
      });
      return;
    }
    router.refresh();
  }

  function requestStatusChange(status: PublicationStatus) {
    if (status === "published" || status === "withdrawn") {
      setConfirmationStatus(status);
      return;
    }
    void changeStatus(status);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {(["draft", "review", "published", "withdrawn"] as const).map((status) => (
          <button
            className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
              status === "published"
                ? "bg-brand text-white"
                : status === "withdrawn"
                  ? "border border-danger/30 bg-red-50 text-danger"
                : "border border-border bg-white text-brand"
            } disabled:opacity-50`}
            disabled={pending !== null || currentStatus === status}
            key={status}
            onClick={() => requestStatusChange(status)}
            type="button"
          >
            {pending === status
              ? "Guardando…"
              : publicationStatusActionLabels[status]}
          </button>
        ))}
      </div>
      {confirmationStatus ? (
        <div
          aria-describedby="status-confirmation-description"
          aria-labelledby="status-confirmation-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/45 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3
              className="text-xl font-semibold"
              id="status-confirmation-title"
            >
              {confirmationStatus === "published"
                ? "¿Publicar esta clase?"
                : "¿Retirar esta clase?"}
            </h3>
            <p
              className="mt-3 text-sm leading-6 text-muted"
              id="status-confirmation-description"
            >
              {confirmationStatus === "published"
                ? "Al confirmar, la clase quedará visible para las estudiantes. Verifica que la revisión académica y la aprobación editorial ya estén completas."
                : "Al confirmar, la clase dejará de estar visible para las estudiantes. Su contenido y fecha de publicación se conservarán para poder corregirla o volver a publicarla."}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-brand"
                disabled={pending !== null}
                onClick={() => setConfirmationStatus(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
                disabled={pending !== null}
                onClick={async () => {
                  await changeStatus(confirmationStatus);
                  setConfirmationStatus(null);
                }}
                type="button"
              >
                {pending
                  ? confirmationStatus === "published"
                    ? "Publicando…"
                    : "Retirando…"
                  : confirmationStatus === "published"
                    ? "Sí, publicar clase"
                    : "Sí, retirar clase"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {failure ? <PublicationFailure {...failure} /> : null}
    </div>
  );
}

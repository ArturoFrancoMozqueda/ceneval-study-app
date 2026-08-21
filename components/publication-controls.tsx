"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  recordEditorialReviewAction,
  updatePublicationStatusAction,
} from "@/app/actions/academic";
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
      {readiness?.reason === "no-topics" ? (
        <p className="mt-2">Agrega y revisa los temas antes de publicar.</p>
      ) : null}
      {readiness?.reason === "unapproved-topics" ? (
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {readiness.topics.map((topic) => (
            <li key={topic.topicId}>
              {topic.topicTitle}: estado {topic.status}.
            </li>
          ))}
        </ul>
      ) : null}
      {readiness?.reason === "missing-current-review" ? (
        <p className="mt-2">
          Registra la aprobación editorial y la fecha real de verificación
          jurídica para la versión actual.
        </p>
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
  const [legalVerifiedOn, setLegalVerifiedOn] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewPending, setReviewPending] = useState<
    "approved" | "rejected" | null
  >(null);
  const [reviewFeedback, setReviewFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

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

  async function submitReview(verdict: "approved" | "rejected") {
    setReviewPending(verdict);
    setReviewFeedback(null);
    const result = await recordEditorialReviewAction(
      classId,
      verdict,
      legalVerifiedOn,
      reviewNotes,
    );
    setReviewPending(null);
    if (result.error) {
      setReviewFeedback({ kind: "error", message: result.error });
      return;
    }
    setReviewFeedback({
      kind: "success",
      message:
        verdict === "approved"
          ? "Aprobación editorial registrada para esta versión."
          : "Rechazo registrado. La clase debe corregirse antes de publicar.",
    });
    router.refresh();
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
      {currentStatus === "review" ? (
        <section
          aria-labelledby="editorial-review-title"
          className="mt-6 rounded-2xl border border-border bg-white p-5"
        >
          <h3 className="text-lg font-semibold" id="editorial-review-title">
            Dictamen editorial
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Registra la revisión de la versión actual. No asumas vigencia:
            indica la fecha en que verificaste las fuentes jurídicas.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold"
                htmlFor="legal-verified-on"
              >
                Fecha de verificación jurídica
              </label>
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-border px-3"
                id="legal-verified-on"
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setLegalVerifiedOn(event.target.value)}
                type="date"
                value={legalVerifiedOn}
              />
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="review-notes">
                Notas del dictamen
              </label>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-border p-3"
                id="review-notes"
                maxLength={2000}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Anota qué se verificó o qué debe corregirse."
                value={reviewNotes}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-xl bg-success px-4 font-semibold text-white disabled:opacity-50"
              disabled={reviewPending !== null || !legalVerifiedOn}
              onClick={() => void submitReview("approved")}
              type="button"
            >
              {reviewPending === "approved"
                ? "Registrando aprobación…"
                : "Aprobar versión"}
            </button>
            <button
              className="min-h-11 rounded-xl border border-danger/30 bg-red-50 px-4 font-semibold text-danger disabled:opacity-50"
              disabled={reviewPending !== null || !reviewNotes.trim()}
              onClick={() => void submitReview("rejected")}
              type="button"
            >
              {reviewPending === "rejected"
                ? "Registrando rechazo…"
                : "Rechazar versión"}
            </button>
          </div>
          {reviewFeedback ? (
            <p
              aria-live={reviewFeedback.kind === "error" ? "assertive" : "polite"}
              className={`mt-4 text-sm font-semibold ${
                reviewFeedback.kind === "error" ? "text-danger" : "text-success"
              }`}
              role={reviewFeedback.kind === "error" ? "alert" : "status"}
            >
              {reviewFeedback.message}
            </p>
          ) : null}
        </section>
      ) : null}
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

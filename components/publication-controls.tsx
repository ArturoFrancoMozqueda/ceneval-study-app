"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePublicationStatusAction } from "@/app/actions/academic";
import type { PublicationStatus } from "@/lib/data/academic";
import { publicationStatusActionLabels } from "@/lib/status-labels";

export function PublicationControls({
  classId,
  currentStatus,
}: {
  classId: number;
  currentStatus: PublicationStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PublicationStatus | null>(null);
  const [confirmationStatus, setConfirmationStatus] = useState<
    "published" | "withdrawn" | null
  >(null);

  async function changeStatus(status: PublicationStatus) {
    setPending(status);
    setError("");
    const result = await updatePublicationStatusAction(classId, status);
    setPending(null);
    if (result.error) {
      setError(result.error);
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
            <p className="mt-3 text-sm leading-6 text-muted">
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
      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

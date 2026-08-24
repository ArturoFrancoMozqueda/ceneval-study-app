"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  updateStudyMaterialAction,
  type StudyMaterialForEdit,
} from "@/app/actions/academic";
import { materialTypeLabels } from "@/lib/status-labels";

export function StudyMaterialEditForm({
  classId,
  topicId,
  material,
}: {
  classId: number;
  topicId: number;
  material: StudyMaterialForEdit;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSubmitting(true);

    const result = await updateStudyMaterialAction(
      classId,
      topicId,
      material.id,
      new FormData(event.currentTarget),
    );
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const inputClassName =
    "mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-base leading-6 text-foreground focus:border-brand";

  return (
    <form
      className="rounded-2xl border border-border bg-white p-5"
      noValidate
      onSubmit={handleSubmit}
    >
      <p className="font-mono text-xs text-muted">
        {materialTypeLabels[material.materialType]} · versión{" "}
        {material.version}
      </p>

      <label
        className="mt-3 block text-sm font-semibold"
        htmlFor={`material-title-${material.id}`}
      >
        Título
      </label>
      <input
        className={inputClassName}
        defaultValue={material.title}
        id={`material-title-${material.id}`}
        name="title"
        onChange={() => {
          setError("");
          setSaved(false);
        }}
        required
        type="text"
      />

      <label
        className="mt-4 block text-sm font-semibold"
        htmlFor={`material-content-${material.id}`}
      >
        Contenido
      </label>
      <textarea
        className={`${inputClassName} min-h-40 resize-y`}
        defaultValue={material.content}
        id={`material-content-${material.id}`}
        name="content"
        onChange={() => {
          setError("");
          setSaved(false);
        }}
        required
      />

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Guardando…" : "Guardar material"}
        </button>
        <p aria-live="polite" className="text-sm">
          {error ? (
            <span className="font-medium text-danger">{error}</span>
          ) : saved ? (
            <span className="font-medium text-success">
              Cambios guardados como una versión nueva. La revisión editorial
              de esta clase quedó pendiente de repetirse y la evidencia de la
              versión anterior ya no cuenta para la validación de
              completitud.
            </span>
          ) : null}
        </p>
      </div>
    </form>
  );
}

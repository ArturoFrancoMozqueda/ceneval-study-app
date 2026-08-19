"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateClassDetailsAction } from "@/app/actions/academic";

export function ClassDetailsForm({
  classId,
  initialDescription,
  initialTitle,
}: {
  classId: number;
  initialDescription: string;
  initialTitle: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);

    if (!title.trim()) {
      setError("Escribe el título de la clase.");
      return;
    }

    setIsSubmitting(true);
    const result = await updateClassDetailsAction(
      classId,
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
    "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-foreground focus:border-brand";

  return (
    <form className="mt-5" noValidate onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-semibold" htmlFor="editorial-class-title">
          Título <span aria-hidden="true">*</span>
        </label>
        <input
          aria-invalid={Boolean(error && !title.trim())}
          className={inputClassName}
          id="editorial-class-title"
          maxLength={120}
          name="title"
          onChange={(event) => {
            setTitle(event.target.value);
            setError("");
            setSaved(false);
          }}
          required
          value={title}
        />
        <p className="mt-2 text-right font-mono text-xs text-muted">
          {title.length}/120
        </p>
      </div>

      <div className="mt-5">
        <label
          className="text-sm font-semibold"
          htmlFor="editorial-class-description"
        >
          Descripción{" "}
          <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-base leading-7 text-foreground focus:border-brand"
          id="editorial-class-description"
          maxLength={400}
          name="description"
          onChange={(event) => {
            setDescription(event.target.value);
            setError("");
            setSaved(false);
          }}
          value={description}
        />
        <p className="mt-2 text-right font-mono text-xs text-muted">
          {description.length}/400
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Guardando…" : "Guardar cambios"}
        </button>
        <p aria-live="polite" className="text-sm">
          {error ? (
            <span className="font-medium text-danger">{error}</span>
          ) : saved ? (
            <span className="font-medium text-success">
              Cambios guardados correctamente.
            </span>
          ) : null}
        </p>
      </div>
    </form>
  );
}

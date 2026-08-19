"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSubjectAction } from "@/app/actions/academic";

const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 300;

export function SubjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setNameError("Escribe el nombre de la materia.");
      return;
    }

    setIsSubmitting(true);
    setNameError("");
    const formData = new FormData(event.currentTarget);
    const result = await createSubjectAction(formData);

    if (result.error) {
      setNameError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.push("/materias?creada=1");
    router.refresh();
  }

  return (
    <form
      className="mt-8 max-w-2xl rounded-2xl border border-border bg-surface p-5 shadow-[0_12px_35px_rgb(23_32_51_/_0.05)] sm:p-8"
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <label className="text-sm font-semibold" htmlFor="subject-name">
          Nombre <span aria-hidden="true">*</span>
        </label>
        <p className="mt-1 text-sm text-muted" id="subject-name-help">
          Usa el nombre del área de Derecho que estás estudiando.
        </p>
        <input
          aria-describedby={
            nameError
              ? "subject-name-help subject-name-error"
              : "subject-name-help"
          }
          aria-invalid={Boolean(nameError)}
          autoComplete="off"
          autoFocus
          className={`mt-3 min-h-12 w-full rounded-xl border bg-white px-4 text-base text-foreground transition placeholder:text-muted/65 ${
            nameError
              ? "border-danger focus:border-danger"
              : "border-border focus:border-brand"
          }`}
          id="subject-name"
          maxLength={MAX_NAME_LENGTH}
          name="name"
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) {
              setNameError("");
            }
          }}
          placeholder="Ej. Derecho constitucional"
          type="text"
          value={name}
        />
        <div className="mt-2 flex min-h-5 justify-between gap-4">
          {nameError ? (
            <p
              className="text-sm font-medium text-danger"
              id="subject-name-error"
              role="alert"
            >
              {nameError}
            </p>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-muted">
            {name.length}/{MAX_NAME_LENGTH}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-semibold" htmlFor="subject-description">
          Descripción{" "}
          <span className="font-normal text-muted">(opcional)</span>
        </label>
        <p className="mt-1 text-sm text-muted" id="subject-description-help">
          Anota qué contenidos quieres reunir en esta materia.
        </p>
        <textarea
          aria-describedby="subject-description-help subject-description-count"
          className="mt-3 min-h-32 w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-base leading-7 text-foreground transition placeholder:text-muted/65 focus:border-brand"
          id="subject-description"
          maxLength={MAX_DESCRIPTION_LENGTH}
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ej. Principios constitucionales, derechos humanos y amparo."
          value={description}
        />
        <p
          className="mt-2 text-right font-mono text-xs text-muted"
          id="subject-description-count"
        >
          {description.length}/{MAX_DESCRIPTION_LENGTH}
        </p>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-background"
          href="/materias"
        >
          Cancelar
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Guardando…" : "Guardar materia"}
        </button>
      </div>
    </form>
  );
}

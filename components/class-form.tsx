"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createClassAction } from "@/app/actions/academic";

export function ClassForm({ subjectId }: { subjectId: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [classDate, setClassDate] = useState("");
  const [teacher, setTeacher] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setTitleError("Escribe el título de la clase.");
      titleInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      const result = await createClassAction(
        subjectId,
        new FormData(event.currentTarget),
      );

      if (result.error || !result.id) {
        setFormError(result.error ?? "No pudimos guardar la clase.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/clases/${result.id}`);
      router.refresh();
    } catch {
      setFormError(
        "No pudimos guardar la clase. Revisa tu conexión e intenta nuevamente.",
      );
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-foreground transition placeholder:text-muted/65 focus:border-brand";

  return (
    <form
      className="mt-8 max-w-3xl rounded-2xl border border-border bg-surface p-5 shadow-[0_12px_35px_rgb(23_32_51_/_0.05)] sm:p-8"
      aria-busy={isSubmitting}
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <label className="text-sm font-semibold" htmlFor="class-title">
          Título <span aria-hidden="true">*</span>
        </label>
        <input
          aria-describedby={titleError ? "class-title-error" : undefined}
          aria-invalid={Boolean(titleError)}
          className={`${inputClassName} ${titleError ? "border-danger" : ""}`}
          id="class-title"
          maxLength={120}
          name="title"
          onChange={(event) => {
            setTitle(event.target.value);
            if (titleError) setTitleError("");
            if (formError) setFormError("");
          }}
          placeholder="Ej. Principios constitucionales"
          ref={titleInputRef}
          value={title}
        />
        {titleError ? (
          <p
            className="mt-2 text-sm font-medium text-danger"
            id="class-title-error"
            role="alert"
          >
            {titleError}
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold" htmlFor="class-date">
            Fecha <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            className={inputClassName}
            id="class-date"
            name="classDate"
            onChange={(event) => {
              setClassDate(event.target.value);
              if (formError) setFormError("");
            }}
            type="date"
            value={classDate}
          />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="class-teacher">
            Profesor o profesora{" "}
            <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            autoComplete="off"
            className={inputClassName}
            id="class-teacher"
            maxLength={100}
            name="teacher"
            onChange={(event) => {
              setTeacher(event.target.value);
              if (formError) setFormError("");
            }}
            placeholder="Ej. Dra. Martínez"
            value={teacher}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-semibold" htmlFor="class-description">
          Descripción <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-base leading-7 text-foreground placeholder:text-muted/65 focus:border-brand"
          id="class-description"
          maxLength={400}
          name="description"
          onChange={(event) => {
            setDescription(event.target.value);
            if (formError) setFormError("");
          }}
          placeholder="Anota brevemente qué se revisó en esta clase."
          value={description}
        />
        <p className="mt-2 text-right font-mono text-xs text-muted">
          {description.length}/400
        </p>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-background"
          href={`/materias/${subjectId}`}
        >
          Cancelar
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Guardando…" : "Guardar clase"}
        </button>
      </div>
      {formError ? (
        <p className="mt-4 text-sm font-medium text-danger" role="alert">
          {formError}
        </p>
      ) : null}
    </form>
  );
}

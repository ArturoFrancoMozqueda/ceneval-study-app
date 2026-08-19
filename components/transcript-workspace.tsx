"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveTranscriptAction } from "@/app/actions/academic";
import { BookIcon } from "@/components/icons";
import type {
  StudyClass,
  Subject,
  Transcript,
} from "@/lib/data/academic";

const MAX_TRANSCRIPT_LENGTH = 50000;

export function TranscriptWorkspace({
  studyClass,
  subject,
  transcript,
}: {
  studyClass: StudyClass;
  subject: Subject;
  transcript: Transcript | null;
}) {
  const router = useRouter();
  const [originalText, setOriginalText] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeVersion, setActiveVersion] = useState<"original" | "cleaned">(
    "original",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedText = originalText.trim();

    if (normalizedText.length < 30) {
      setError("Pega una transcripción de al menos 30 caracteres.");
      return;
    }

    setIsSubmitting(true);
    const result = await saveTranscriptAction(
      studyClass.id,
      new FormData(event.currentTarget),
    );

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.push(`/clases/${studyClass.id}/temas`);
    router.refresh();
  }

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
          <li aria-current="page">Transcripción</li>
        </ol>
      </nav>

      <header className="mt-7">
        <p className="text-sm font-semibold text-success">Fuente de la clase</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          Transcripción
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          {studyClass.title} · {subject.name}
        </p>
      </header>

      {transcript ? (
        <section className="mt-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-success/20 bg-success-soft/55 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-success">
                Transcripción conservada
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground/70">
                El texto original está bloqueado para evitar cambios
                accidentales.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
              href={`/clases/${studyClass.id}/temas`}
            >
              Revisar temas
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgb(23_32_51_/_0.04)] sm:p-7">
            <div
              aria-label="Versiones de la transcripción"
              className="inline-flex rounded-xl bg-background p-1"
              role="tablist"
            >
              <button
                aria-selected={activeVersion === "original"}
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
                  activeVersion === "original"
                    ? "bg-surface text-brand shadow-sm"
                    : "text-muted"
                }`}
                onClick={() => setActiveVersion("original")}
                role="tab"
                type="button"
              >
                Original
              </button>
              <button
                aria-selected={activeVersion === "cleaned"}
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
                  activeVersion === "cleaned"
                    ? "bg-surface text-brand shadow-sm"
                    : "text-muted"
                }`}
                onClick={() => setActiveVersion("cleaned")}
                role="tab"
                type="button"
              >
                Versión limpia
              </button>
            </div>

            <div className="mt-6 max-w-3xl whitespace-pre-wrap text-base leading-8 text-foreground/85">
              {activeVersion === "original"
                ? transcript.originalText
                : transcript.cleanedText || (
                    <div className="rounded-xl border border-dashed border-border bg-background p-5">
                      <p className="font-semibold text-foreground">
                        Versión limpia pendiente
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        La limpieza automática se incorporará en la fase de
                        inteligencia artificial. El original permanece
                        disponible.
                      </p>
                    </div>
                  )}
            </div>
          </div>
        </section>
      ) : (
        <form
          className="mt-8 max-w-4xl rounded-2xl border border-border bg-surface p-5 shadow-[0_12px_35px_rgb(23_32_51_/_0.05)] sm:p-8"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="rounded-xl border border-success/15 bg-success-soft/55 p-4">
            <p className="font-semibold text-success">
              Conservaremos el texto original
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground/70">
              Después de guardarlo no será reemplazado por ningún proceso
              automático.
            </p>
          </div>
          <label
            className="mt-6 block text-sm font-semibold"
            htmlFor="original-transcript"
          >
            Texto de la clase <span aria-hidden="true">*</span>
          </label>
          <textarea
            aria-describedby={
              error
                ? "transcript-help transcript-error"
                : "transcript-help transcript-count"
            }
            aria-invalid={Boolean(error)}
            autoFocus
            className={`mt-2 min-h-80 w-full resize-y rounded-xl border bg-white px-4 py-4 text-base leading-7 text-foreground placeholder:text-muted/60 focus:border-brand ${
              error ? "border-danger" : "border-border"
            }`}
            id="original-transcript"
            maxLength={MAX_TRANSCRIPT_LENGTH}
            name="originalText"
            onChange={(event) => {
              setOriginalText(event.target.value);
              if (error) setError("");
            }}
            placeholder="Pega aquí la transcripción completa de tu clase…"
            value={originalText}
          />
          <div className="mt-2 flex min-h-6 justify-between gap-4">
            {error ? (
              <p
                className="text-sm font-medium text-danger"
                id="transcript-error"
                role="alert"
              >
                {error}
              </p>
            ) : (
              <p className="text-sm text-muted" id="transcript-help">
                Mínimo 30 caracteres.
              </p>
            )}
            <p className="shrink-0 font-mono text-xs text-muted" id="transcript-count">
              {originalText.length.toLocaleString("es-MX")} /{" "}
              {MAX_TRANSCRIPT_LENGTH.toLocaleString("es-MX")}
            </p>
          </div>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-background"
              href={`/clases/${studyClass.id}`}
            >
              Cancelar
            </Link>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? "Guardando…"
                : "Guardar transcripción original"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function MissingClass() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8">
      <BookIcon className="text-muted" />
      <h1 className="mt-4 text-2xl font-semibold">Clase no encontrada</h1>
      <Link
        className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white"
        href="/materias"
      >
        Volver a materias
      </Link>
    </section>
  );
}

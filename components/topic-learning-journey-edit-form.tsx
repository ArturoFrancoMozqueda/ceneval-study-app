"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  updateTopicLearningJourneyAction,
  type TopicLearningJourneyForEdit,
} from "@/app/actions/academic";

type QuickCheckItem = {
  id: number;
  prompt: string;
  answer: string;
  feedback: string;
};

export function TopicLearningJourneyEditForm({
  classId,
  topicId,
  journey,
}: {
  classId: number;
  topicId: number;
  journey: TopicLearningJourneyForEdit;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextId = useRef(journey.quickChecks.length);
  const [quickChecks, setQuickChecks] = useState<QuickCheckItem[]>(() =>
    journey.quickChecks.map((quickCheck, index) => ({
      id: index,
      ...quickCheck,
    })),
  );

  function addQuickCheck() {
    setSaved(false);
    setQuickChecks((current) => [
      ...current,
      { id: nextId.current++, prompt: "", answer: "", feedback: "" },
    ]);
  }

  function removeQuickCheck(id: number) {
    setSaved(false);
    setQuickChecks((current) =>
      current.length <= 2 ? current : current.filter((item) => item.id !== id),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("quickCheckCount", String(quickChecks.length));

    const result = await updateTopicLearningJourneyAction(
      classId,
      topicId,
      formData,
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
      <label className="block text-sm font-semibold" htmlFor="openingPrompt">
        Prompt de apertura
      </label>
      <textarea
        className={`${inputClassName} min-h-20 resize-y`}
        defaultValue={journey.openingPrompt}
        id="openingPrompt"
        name="openingPrompt"
        onChange={() => {
          setError("");
          setSaved(false);
        }}
        required
      />

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Quick checks</legend>
        <p className="mt-1 text-xs text-muted">
          Se necesitan al menos dos.
        </p>
        <div className="mt-3 space-y-4">
          {quickChecks.map((quickCheck, index) => (
            <div
              className="rounded-xl border border-border p-4"
              key={quickCheck.id}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Quick check {index + 1}</p>
                <button
                  className="inline-flex min-h-6 items-center rounded-lg px-2 text-xs font-semibold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={quickChecks.length <= 2}
                  onClick={() => removeQuickCheck(quickCheck.id)}
                  type="button"
                >
                  Quitar
                </button>
              </div>

              <label
                className="mt-2 block text-xs font-semibold text-muted"
                htmlFor={`quickCheckPrompt${index}`}
              >
                Prompt
              </label>
              <textarea
                className={`${inputClassName} min-h-14 resize-y`}
                defaultValue={quickCheck.prompt}
                id={`quickCheckPrompt${index}`}
                name={`quickCheckPrompt${index}`}
                onChange={() => {
                  setError("");
                  setSaved(false);
                }}
                required
              />

              <label
                className="mt-2 block text-xs font-semibold text-muted"
                htmlFor={`quickCheckAnswer${index}`}
              >
                Respuesta esperada
              </label>
              <textarea
                className={`${inputClassName} min-h-14 resize-y`}
                defaultValue={quickCheck.answer}
                id={`quickCheckAnswer${index}`}
                name={`quickCheckAnswer${index}`}
                onChange={() => {
                  setError("");
                  setSaved(false);
                }}
                required
              />

              <label
                className="mt-2 block text-xs font-semibold text-muted"
                htmlFor={`quickCheckFeedback${index}`}
              >
                Retroalimentación
              </label>
              <textarea
                className={`${inputClassName} min-h-14 resize-y`}
                defaultValue={quickCheck.feedback}
                id={`quickCheckFeedback${index}`}
                name={`quickCheckFeedback${index}`}
                onChange={() => {
                  setError("");
                  setSaved(false);
                }}
                required
              />
            </div>
          ))}
        </div>
        <button
          className="mt-3 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-brand"
          onClick={addQuickCheck}
          type="button"
        >
          + Agregar quick check
        </button>
      </fieldset>

      <fieldset className="mt-6 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Caso práctico</legend>

        <label
          className="mt-2 block text-xs font-semibold text-muted"
          htmlFor="facts"
        >
          Hechos
        </label>
        <textarea
          className={`${inputClassName} min-h-20 resize-y`}
          defaultValue={journey.practicalCase.facts}
          id="facts"
          name="facts"
          onChange={() => {
            setError("");
            setSaved(false);
          }}
          required
        />

        <label
          className="mt-3 block text-xs font-semibold text-muted"
          htmlFor="caseQuestion"
        >
          Pregunta del caso
        </label>
        <textarea
          className={`${inputClassName} min-h-14 resize-y`}
          defaultValue={journey.practicalCase.question}
          id="caseQuestion"
          name="caseQuestion"
          onChange={() => {
            setError("");
            setSaved(false);
          }}
          required
        />

        <label
          className="mt-3 block text-xs font-semibold text-muted"
          htmlFor="legalRule"
        >
          Regla jurídica aplicable
        </label>
        <textarea
          className={`${inputClassName} min-h-16 resize-y`}
          defaultValue={journey.practicalCase.legalRule}
          id="legalRule"
          name="legalRule"
          onChange={() => {
            setError("");
            setSaved(false);
          }}
          required
        />

        <label
          className="mt-3 block text-xs font-semibold text-muted"
          htmlFor="reasoning"
        >
          Razonamiento
        </label>
        <textarea
          className={`${inputClassName} min-h-20 resize-y`}
          defaultValue={journey.practicalCase.reasoning}
          id="reasoning"
          name="reasoning"
          onChange={() => {
            setError("");
            setSaved(false);
          }}
          required
        />

        <label
          className="mt-3 block text-xs font-semibold text-muted"
          htmlFor="conclusion"
        >
          Conclusión
        </label>
        <textarea
          className={`${inputClassName} min-h-16 resize-y`}
          defaultValue={journey.practicalCase.conclusion}
          id="conclusion"
          name="conclusion"
          onChange={() => {
            setError("");
            setSaved(false);
          }}
          required
        />
      </fieldset>

      <label
        className="mt-6 block text-sm font-semibold"
        htmlFor="closingPrompt"
      >
        Prompt de cierre
      </label>
      <textarea
        className={`${inputClassName} min-h-20 resize-y`}
        defaultValue={journey.closingPrompt}
        id="closingPrompt"
        name="closingPrompt"
        onChange={() => {
          setError("");
          setSaved(false);
        }}
        required
      />

      <label
        className="mt-4 block text-sm font-semibold"
        htmlFor="nextActivity"
      >
        Siguiente actividad
      </label>
      <textarea
        className={`${inputClassName} min-h-16 resize-y`}
        defaultValue={journey.nextActivity}
        id="nextActivity"
        name="nextActivity"
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
          {isSubmitting ? "Guardando…" : "Guardar learning journey"}
        </button>
        <p aria-live="polite" className="text-sm">
          {error ? (
            <span className="font-medium text-danger">{error}</span>
          ) : saved ? (
            <span className="font-medium text-success">
              Cambios guardados. La revisión editorial de esta clase quedó
              pendiente de repetirse.
            </span>
          ) : null}
        </p>
      </div>
    </form>
  );
}

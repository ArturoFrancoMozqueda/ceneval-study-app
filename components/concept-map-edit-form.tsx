"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  updateConceptMapAction,
  type ConceptMapForEdit,
} from "@/app/actions/academic";

type NodeItem = {
  key: number;
  id: string;
  label: string;
  description: string;
  parentId: string;
};

export function ConceptMapEditForm({
  classId,
  topicId,
  conceptMap,
}: {
  classId: number;
  topicId: number;
  conceptMap: ConceptMapForEdit;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextKey = useRef(conceptMap.nodes.length);
  const [nodes, setNodes] = useState<NodeItem[]>(() =>
    conceptMap.nodes.map((node, index) => ({ key: index, ...node })),
  );

  function addNode() {
    setSaved(false);
    setNodes((current) => [
      ...current,
      {
        key: nextKey.current++,
        id: "",
        label: "",
        description: "",
        parentId: "",
      },
    ]);
  }

  function removeNode(key: number) {
    setSaved(false);
    setNodes((current) =>
      current.length <= 1 ? current : current.filter((item) => item.key !== key),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("nodeCount", String(nodes.length));

    const result = await updateConceptMapAction(
      classId,
      topicId,
      conceptMap.id,
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
      <p className="font-mono text-xs text-muted">
        Mapa conceptual · versión {conceptMap.version}
      </p>

      <label className="mt-3 block text-sm font-semibold" htmlFor="title">
        Título
      </label>
      <input
        className={inputClassName}
        defaultValue={conceptMap.title}
        id="title"
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
        htmlFor="description"
      >
        Descripción
      </label>
      <textarea
        className={`${inputClassName} min-h-16 resize-y`}
        defaultValue={conceptMap.description}
        id="description"
        name="description"
        onChange={() => {
          setError("");
          setSaved(false);
        }}
      />

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Nodos</legend>
        <p className="mt-1 text-xs text-muted">
          Se necesita al menos uno. El id de nodo padre (si lo hay) debe
          coincidir con el id de otro nodo de esta lista.
        </p>
        <div className="mt-3 space-y-4">
          {nodes.map((node, index) => (
            <div
              className="rounded-xl border border-border p-4"
              key={node.key}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Nodo {index + 1}</p>
                <button
                  className="inline-flex min-h-6 items-center rounded-lg px-2 text-xs font-semibold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={nodes.length <= 1}
                  onClick={() => removeNode(node.key)}
                  type="button"
                >
                  Quitar
                </button>
              </div>

              <label
                className="mt-2 block text-xs font-semibold text-muted"
                htmlFor={`nodeId${index}`}
              >
                Id
              </label>
              <input
                className={inputClassName}
                defaultValue={node.id}
                id={`nodeId${index}`}
                name={`nodeId${index}`}
                onChange={() => {
                  setError("");
                  setSaved(false);
                }}
                required
                type="text"
              />

              <label
                className="mt-2 block text-xs font-semibold text-muted"
                htmlFor={`nodeLabel${index}`}
              >
                Etiqueta
              </label>
              <input
                className={inputClassName}
                defaultValue={node.label}
                id={`nodeLabel${index}`}
                name={`nodeLabel${index}`}
                onChange={() => {
                  setError("");
                  setSaved(false);
                }}
                required
                type="text"
              />

              <label
                className="mt-2 block text-xs font-semibold text-muted"
                htmlFor={`nodeDescription${index}`}
              >
                Descripción (opcional)
              </label>
              <textarea
                className={`${inputClassName} min-h-14 resize-y`}
                defaultValue={node.description}
                id={`nodeDescription${index}`}
                name={`nodeDescription${index}`}
                onChange={() => {
                  setError("");
                  setSaved(false);
                }}
              />

              <label
                className="mt-2 block text-xs font-semibold text-muted"
                htmlFor={`nodeParentId${index}`}
              >
                Id de nodo padre (opcional)
              </label>
              <input
                className={inputClassName}
                defaultValue={node.parentId}
                id={`nodeParentId${index}`}
                name={`nodeParentId${index}`}
                onChange={() => {
                  setError("");
                  setSaved(false);
                }}
                type="text"
              />
            </div>
          ))}
        </div>
        <button
          className="mt-3 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-brand"
          onClick={addNode}
          type="button"
        >
          + Agregar nodo
        </button>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Guardando…" : "Guardar mapa conceptual"}
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

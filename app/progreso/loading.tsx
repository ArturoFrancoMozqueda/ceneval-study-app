export default function ProgressLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="text-sm font-semibold text-success">Registro de avance</p>
      <h1 className="mt-2 text-3xl tracking-[-0.035em] sm:text-4xl">
        Progreso por materia
      </h1>
      <p className="mt-4 text-muted">Estamos reuniendo tu actividad guardada…</p>
      <div className="mt-8 h-40 animate-pulse rounded-3xl bg-brand/10" />
      <span className="sr-only">Cargando progreso</span>
    </div>
  );
}

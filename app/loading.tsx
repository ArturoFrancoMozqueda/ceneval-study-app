export default function Loading() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="loading-title"
      className="animate-pulse"
      role="status"
    >
      <h1 className="sr-only" id="loading-title">
        Cargando tu material de estudio
      </h1>
      <div aria-hidden="true">
        <div className="h-4 w-28 rounded-full bg-success-soft" />
        <div className="mt-4 h-10 max-w-xl rounded-xl bg-brand/10" />
        <div className="mt-3 h-5 max-w-2xl rounded-lg bg-border/70" />

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              className="rounded-2xl border border-border bg-surface p-5"
              key={item}
            >
              <div className="size-11 rounded-xl bg-success-soft" />
              <div className="mt-5 h-5 w-3/4 rounded-lg bg-brand/10" />
              <div className="mt-3 h-4 w-full rounded-lg bg-border/70" />
              <div className="mt-2 h-4 w-2/3 rounded-lg bg-border/70" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

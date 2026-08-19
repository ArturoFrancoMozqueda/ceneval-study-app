import Link from "next/link";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-success">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        {description}
      </p>
      <section className="mt-9 rounded-2xl border border-dashed border-border bg-surface p-8 sm:p-10">
        <p className="text-lg font-semibold">Esta sección llega pronto</p>
        <p className="mt-2 max-w-xl leading-7 text-muted">
          Primero estamos completando materias y clases. Así cada función nueva
          tendrá información real para ayudarte a estudiar.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
          href="/materias"
        >
          Ir a mis materias
        </Link>
      </section>
    </div>
  );
}

import Link from "next/link";

export function EmptyState({
  actionHref,
  actionLabel,
  description,
  headingLevel = "h2",
  title,
}: {
  actionHref: string;
  actionLabel: string;
  description: string;
  headingLevel?: "h2" | "h3";
  title: string;
}) {
  const Heading = headingLevel;

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-7 text-center sm:p-9">
      <Heading className="text-xl font-semibold">{title}</Heading>
      <p className="mx-auto mt-2 max-w-lg leading-7 text-muted">
        {description}
      </p>
      <Link
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
        href={actionHref}
      >
        {actionLabel}
      </Link>
    </div>
  );
}

import Link from "next/link";
import type { ChangeEventHandler, ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  fields: ReactNode;
  submitLabel: string;
  error?: string;
  errorId?: string;
  message?: string;
  footer: ReactNode;
  pending?: boolean;
  pendingLabel?: string;
};

export function AuthCard({
  action,
  description,
  error,
  errorId = "auth-error",
  fields,
  footer,
  message,
  pending = false,
  pendingLabel = "Procesando…",
  submitLabel,
  title,
}: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_60px_rgb(23_32_51_/_0.1)] sm:p-8">
      <Link
        className="inline-flex min-h-11 items-center text-sm font-semibold text-brand"
        href="/"
      >
        CENEVAL Study App
      </Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 leading-7 text-muted">{description}</p>

      {error ? (
        <p
          className="mt-5 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm font-medium text-danger"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="mt-5 rounded-xl border border-success/20 bg-success-soft p-3 text-sm text-success"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <form action={action} className="mt-6 space-y-4">
        {fields}
        <button
          className="min-h-12 w-full rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-deep disabled:cursor-wait disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-muted">{footer}</div>
    </section>
  );
}

export function AuthField({
  autoComplete,
  describedBy,
  description,
  error,
  invalid = false,
  label,
  name,
  onChange,
  type = "text",
  value,
}: {
  autoComplete: string;
  describedBy?: string;
  description?: string;
  error?: string;
  invalid?: boolean;
  label: string;
  name: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: "email" | "password" | "text";
  value?: string;
}) {
  const descriptionId = description ? `${name}-help` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const ariaDescribedBy = [descriptionId, errorId, describedBy]
    .filter(Boolean)
    .join(" ");
  const isInvalid = invalid || Boolean(error);

  return (
    <div>
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={ariaDescribedBy || undefined}
        aria-invalid={isInvalid || undefined}
        autoComplete={autoComplete}
        className={`mt-2 min-h-12 w-full rounded-xl border bg-white px-4 ${
          isInvalid
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger"
            : "border-muted focus-visible:border-brand focus-visible:ring-brand"
        } focus-visible:ring-2`}
        id={name}
        name={name}
        onChange={onChange}
        required
        type={type}
        value={value}
      />
      {description ? (
        <p className="mt-2 text-xs leading-5 text-muted" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-2 text-sm font-medium text-danger"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

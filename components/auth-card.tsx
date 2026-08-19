import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  fields: ReactNode;
  submitLabel: string;
  error?: string;
  message?: string;
  footer: ReactNode;
};

export function AuthCard({
  action,
  description,
  error,
  fields,
  footer,
  message,
  submitLabel,
  title,
}: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_60px_rgb(23_32_51_/_0.1)] sm:p-8">
      <Link className="text-sm font-semibold text-brand" href="/">
        CENEVAL Study App
      </Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 leading-7 text-muted">{description}</p>

      {error ? (
        <p
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-danger"
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
          className="min-h-12 w-full rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-deep"
          type="submit"
        >
          {submitLabel}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-muted">{footer}</div>
    </section>
  );
}

export function AuthField({
  autoComplete,
  label,
  name,
  type = "text",
}: {
  autoComplete: string;
  label: string;
  name: string;
  type?: "email" | "password" | "text";
}) {
  return (
    <div>
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
        id={name}
        name={name}
        required
        type={type}
      />
    </div>
  );
}

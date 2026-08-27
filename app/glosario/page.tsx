import type { Metadata } from "next";
import { GlossaryBrowser } from "@/components/glossary-browser";
import { requireUser } from "@/lib/auth";
import { glossaryEntries } from "@/lib/glossary";

export const metadata: Metadata = { title: "Glosario de abreviaturas" };

export default async function GlossaryPage() {
  await requireUser();

  return (
    <div>
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-success">Apoyo de lectura</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Glosario de abreviaturas
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Consulta el nombre completo de las siglas jurídicas, institucionales
          y fiscales que aparecen en tus clases. El glosario ayuda a leer el
          material, pero no sustituye la explicación del tema ni confirma la
          vigencia de una norma.
        </p>
      </header>

      <GlossaryBrowser entries={glossaryEntries} />
    </div>
  );
}

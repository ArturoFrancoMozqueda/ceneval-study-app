import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { MarketingShell } from "@/components/marketing-shell";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Qué incluye Sube Legal, qué no incluye todavía, y cómo funciona la suscripción a la biblioteca para el examen CENEVAL EGEL de Derecho.",
};

const faqs: { question: string; answer: ReactNode }[] = [
  {
    question: "¿Qué es Sube Legal?",
    answer: (
      <p>
        Es una biblioteca de estudio para el examen CENEVAL EGEL de Derecho,
        que se presenta para la titulación en México. Incluye 57 clases con
        materiales, mapas conceptuales, flashcards y exámenes de práctica ya
        preparados y revisados por un equipo editorial, para que no tengas
        que armar tu propio temario.
      </p>
    ),
  },
  {
    question: "¿Sube Legal está afiliado a CENEVAL?",
    answer: (
      <p>
        No. Sube Legal no está afiliado, patrocinado ni avalado por el
        Centro Nacional de Evaluación para la Educación Superior, A.C.
        (CENEVAL). Mencionamos &ldquo;CENEVAL EGEL de Derecho&rdquo; solo de
        forma descriptiva: es el examen para el que este contenido prepara.
      </p>
    ),
  },
  {
    question: "¿Cuánto cuesta y qué incluye el precio?",
    answer: (
      <p>
        $399 MXN al mes, cobro recurrente. Incluye la biblioteca completa:
        las 57 clases, sus 513 materiales de estudio, 57 mapas conceptuales,
        685 flashcards y 57 exámenes de práctica con 570 reactivos. No hay
        planes distintos por nivel: todo está incluido en la única
        suscripción. Ver{" "}
        <Link className="font-semibold text-brand" href="/precios">
          detalle de precio
        </Link>
        .
      </p>
    ),
  },
  {
    question: "¿Hay periodo de prueba gratuito?",
    answer: (
      <p>
        No. En vez de un periodo de prueba con tarjeta, ofrecemos una{" "}
        <Link className="font-semibold text-brand" href="/muestra">
          clase de muestra permanente
        </Link>{" "}
        que puedes leer sin crear una cuenta, para evaluar el contenido
        antes de decidir si te suscribes.
      </p>
    ),
  },
  {
    question: "¿Cómo funciona la progresión por niveles?",
    answer: (
      <p>
        El catálogo se agrupa en niveles siguiendo el orden curricular con
        el que ya está organizado el temario. Avanzas al siguiente nivel al
        completar el examen del nivel en curso. Es una forma de guiar tu
        estudio, no una segmentación de precio: no pagas más por avanzar de
        nivel, todo está incluido desde el primer mes.
      </p>
    ),
  },
  {
    question: "¿Cómo cancelo y qué pasa con mi progreso?",
    answer: (
      <p>
        Puedes cancelar cuando quieras. Conservas el acceso hasta el final
        del periodo ya pagado; no se corta de inmediato, y no se reembolsa
        la parte no usada del periodo en curso. Tu progreso, tus intentos y
        tus resultados nunca se borran al cancelar, aunque vuelvas a
        suscribirte después.
      </p>
    ),
  },
  {
    question: "¿La biblioteca tiene 57 o 58 clases?",
    answer: (
      <p>
        57 clases completas y publicadas. Existe un plan de temario hasta
        C58 (administración, cuentas, partición y adjudicación hereditaria),
        pero esa clase está bloqueada: no hay todavía una transcripción de
        clase que la desarrolle, y no vamos a publicar una clase construida
        solo con legislación, sin esa base. Si en algún momento se agrega,
        lo anunciaremos aquí con la fecha.
      </p>
    ),
  },
  {
    question:
      "¿Incluye el banco de reactivos transversal y los exámenes acumulativos?",
    answer: (
      <p>
        Todavía no. El producto de hoy incluye un examen de práctica por
        cada una de las 57 clases (570 reactivos en total). Un banco de
        reactivos transversal entre materias y 16 exámenes acumulativos por
        nivel están en evaluación, sin fecha de lanzamiento. Si se agregan,
        lo anunciaremos aquí y en{" "}
        <Link className="font-semibold text-brand" href="/precios">
          precios
        </Link>{" "}
        antes de que formen parte de la suscripción.
      </p>
    ),
  },
  {
    question: "¿Puedo registrarme hoy?",
    answer: (
      <p>
        Todavía no: la aplicación está en preparación comercial y el
        registro público no está abierto. Puedes dejar tu interés registrado
        en{" "}
        <Link className="font-semibold text-brand" href="/registro">
          la página de registro
        </Link>{" "}
        para que te avisemos en cuanto abra, o leer la{" "}
        <Link className="font-semibold text-brand" href="/muestra">
          muestra gratuita
        </Link>{" "}
        mientras tanto.
      </p>
    ),
  },
  {
    question: "¿Puedo descargar o copiar el contenido?",
    answer: (
      <p>
        El contenido es para leerlo dentro de la aplicación, no para
        redistribuirlo. Los términos de uso prohíben la redistribución del
        material, con la cancelación de la cuenta sin reembolso como
        consecuencia.
      </p>
    ),
  },
  {
    question: "¿Esto sustituye una asesoría legal?",
    answer: (
      <p>
        No. El contenido es material educativo para preparar el examen; no
        constituye asesoría jurídica. La legislación cambia, así que
        siempre debes consultar la fuente oficial y su fecha de vigencia
        antes de aplicarla a un caso real.
      </p>
    ),
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <MarketingShell>
      <section className="pt-8 sm:pt-14">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Preguntas frecuentes
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          Respuestas directas, incluyendo lo que el producto todavía no
          incluye.
        </p>
      </section>

      <section className="mt-10 divide-y divide-border rounded-3xl border border-border bg-white">
        {faqs.map(({ question, answer }) => (
          <div className="p-6 sm:p-8" key={question}>
            <h2 className="text-lg font-semibold">{question}</h2>
            <div className="mt-3 leading-7 text-foreground/80">{answer}</div>
          </div>
        ))}
      </section>

      <section className="mt-12 flex flex-wrap gap-3">
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-deep"
          href="/muestra"
        >
          Ver la clase de muestra
          <ArrowRightIcon className="size-4" />
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-foreground hover:border-brand/30"
          href="/precios"
        >
          Ver precio
        </Link>
      </section>
    </MarketingShell>
  );
}

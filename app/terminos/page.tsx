import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Términos de uso de Sube Legal: qué incluye la suscripción, cancelación, uso permitido y soporte.",
};

const SUPPORT_EMAIL = "soporte@sube-legal.mx";

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-muted">
        {children}
      </div>
    </section>
  );
}

export default function TermsOfUsePage() {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-success">Cumplimiento</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Términos de uso
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        Estos términos rigen el uso de{" "}
        <strong className="text-foreground">Sube Legal</strong>, la biblioteca
        de estudio para el examen CENEVAL EGEL de Derecho. Al crear una
        cuenta aceptas estos términos junto con el{" "}
        <Link className="font-semibold text-brand underline" href="/privacidad">
          aviso de privacidad
        </Link>
        .
      </p>

      <Section title="1. Qué es Sube Legal">
        <p>
          Sube Legal es una suscripción mensual a una biblioteca completa de
          estudio (clases, materiales, mapas conceptuales, flashcards y
          exámenes) para prepararte para el examen CENEVAL EGEL de Derecho de
          titulación en México.
        </p>
        <p>
          Sube Legal no está afiliada, patrocinada ni avalada por el Centro
          Nacional de Evaluación para la Educación Superior, A.C. (CENEVAL).
          El nombre del examen se usa solo de forma descriptiva.
        </p>
        <p>
          El contenido es educativo y no constituye asesoría jurídica; las
          normas pueden cambiar, por lo que debes consultar la fuente oficial
          y su fecha de vigencia antes de aplicarlas a un caso real.
        </p>
      </Section>

      <Section title="2. Cuenta y muestra gratuita">
        <p>
          No ofrecemos un periodo de prueba gratuito de la suscripción
          completa. En su lugar, ponemos a disposición una clase o examen de
          muestra, accesible sin pagar, para que puedas evaluar el contenido
          antes de suscribirte.
        </p>
        <p>
          Eres responsable de mantener tu contraseña en privado y de toda
          actividad realizada desde tu cuenta.
        </p>
      </Section>

      <Section title="3. Uso permitido">
        <p>
          El acceso a la biblioteca es individual, personal e intransferible.
          Puedes usar el contenido para tu propio estudio, en cualquier
          dispositivo que uses para acceder a tu cuenta.
        </p>
      </Section>

      <Section title="4. Prohibición de redistribuir el contenido">
        <p>
          Queda expresamente prohibido copiar, redistribuir, publicar,
          revender, compartir credenciales de acceso o poner a disposición de
          terceros, por cualquier medio, el contenido de la biblioteca
          (clases, materiales, mapas, flashcards, exámenes o cualquier
          transcripción o extracto de ellos).
        </p>
        <p>
          Incumplir esta cláusula da lugar a la{" "}
          <strong className="text-foreground">
            cancelación inmediata de la cuenta, sin reembolso
          </strong>{" "}
          de la parte del periodo ya pagado, sin perjuicio de las acciones
          legales que correspondan.
        </p>
      </Section>

      <Section title="5. Precio, cobro y cancelación">
        <p>
          La suscripción tiene un costo de $399 MXN al mes, con cobro
          recurrente mensual mientras esté activa. El cobro real y el flujo de
          pago se activarán en una etapa posterior del proyecto; estos
          términos describen la política que regirá cuando estén activos.
        </p>
        <p>
          Puedes cancelar tu suscripción cuando quieras. Al cancelar,
          conservas el acceso hasta el final del periodo ya pagado; no se
          corta de inmediato.{" "}
          <strong className="text-foreground">
            No hay reembolso de la parte no usada del periodo en curso.
          </strong>
        </p>
        <p>
          Tu progreso académico (avances, intentos de examen y resultados)
          nunca se borra por cancelar o dejar de pagar la suscripción.
        </p>
      </Section>

      <Section title="6. Limitación de responsabilidad">
        <p>
          Sube Legal es una herramienta de apoyo para el estudio y no
          garantiza un resultado específico en el examen CENEVAL EGEL de
          Derecho ni en ningún otro proceso de titulación. El servicio se
          ofrece &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;,
          sin garantías de que estará libre de interrupciones o errores.
        </p>
        <p>
          En la medida permitida por la ley, la responsabilidad total de Sube
          Legal frente a ti por cualquier reclamación relacionada con el
          servicio se limita al monto que hayas pagado por tu suscripción en
          el periodo mensual en el que ocurrió el hecho que da lugar a la
          reclamación.
        </p>
      </Section>

      <Section title="7. Cambios a estos términos">
        <p>
          Si modificamos estos términos de forma sustancial, te lo
          notificaremos dentro de la aplicación antes de que el cambio entre
          en vigor.
        </p>
      </Section>

      <Section title="8. Soporte">
        <p>
          ¿Dudas, problemas técnicos o de tu suscripción? Escríbenos a{" "}
          <a
            className="font-semibold text-brand underline"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_EMAIL}
          </a>
          . Respondemos en un máximo de 2 días hábiles.
        </p>
      </Section>

      <p className="mt-8 text-sm text-muted">Última actualización: 22 de agosto de 2026.</p>
    </div>
  );
}

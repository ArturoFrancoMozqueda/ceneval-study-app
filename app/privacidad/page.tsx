import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Aviso de privacidad de Sube Legal conforme a la LFPDPPP: datos que recabamos, para qué los usamos y cómo ejercer tus derechos ARCO.",
};

const CONTACT_EMAIL = "privacidad@sube-legal.mx";

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

export default function PrivacyNoticePage() {
  return (
    <MarketingShell>
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-success">Cumplimiento</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Aviso de privacidad
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        Este aviso explica, conforme a la Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares (LFPDPPP), qué datos
        personales recaba <strong className="text-foreground">Sube Legal</strong>{" "}
        a través de esta aplicación, para qué los usamos, con quién se
        comparten y cómo puedes ejercer tus derechos sobre ellos.
      </p>
      <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm leading-6 text-foreground">
        Sube Legal aún no cuenta con dominio propio. El correo de contacto de
        este aviso ({CONTACT_EMAIL}) es un correo provisional y se actualizará
        cuando el dominio propio esté contratado (tarea I-3 del plan de
        acción). Mientras tanto, sigue siendo el canal válido para ejercer tus
        derechos.
      </p>

      <Section title="1. Responsable del tratamiento">
        <p>
          Sube Legal es el nombre comercial bajo el que se opera esta
          aplicación de estudio para el examen CENEVAL EGEL de Derecho. La
          titular del proyecto es responsable del tratamiento de tus datos
          personales conforme a este aviso.
        </p>
        <p>
          Sube Legal no está afiliada, patrocinada ni avalada por el Centro
          Nacional de Evaluación para la Educación Superior, A.C. (CENEVAL).
          El nombre del examen se usa solo de forma descriptiva, para indicar
          para qué examen prepara el contenido.
        </p>
      </Section>

      <Section title="2. Datos personales que recabamos">
        <p>Recabamos directamente de ti, cuando creas tu cuenta y usas el servicio:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Correo electrónico, para identificarte y comunicarnos contigo.</li>
          <li>Nombre, tal como lo escribes al registrarte.</li>
          <li>
            Contraseña, almacenada de forma cifrada por nuestro proveedor de
            autenticación; nadie en Sube Legal puede leerla en texto plano.
          </li>
          <li>
            Progreso académico por tema: qué has estudiado, en qué paso vas y
            cuándo fue tu última actividad.
          </li>
          <li>
            Intentos de examen y tus respuestas individuales a cada pregunta,
            para poder mostrarte tu resultado e historial.
          </li>
          <li>
            La fecha en la que aceptaste estos términos y este aviso de
            privacidad, como evidencia de tu consentimiento.
          </li>
        </ul>
        <p>
          No recabamos datos sensibles (salud, origen étnico, creencias
          religiosas, afiliación sindical o política, entre otros) y te
          pedimos no incluirlos en ningún campo libre de la aplicación.
        </p>
      </Section>

      <Section title="3. Finalidades del tratamiento">
        <p>Usamos tus datos personales para las siguientes finalidades, necesarias para darte el servicio:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Crear, identificar y administrar tu cuenta.</li>
          <li>Darte acceso a la biblioteca de estudio de tu suscripción.</li>
          <li>Guardar tu progreso, tus intentos de examen y tus respuestas.</li>
          <li>Atender tus solicitudes de soporte.</li>
          <li>
            Administrar tu suscripción y, cuando el cobro esté activo,
            procesar el pago y emitir comprobantes fiscales si los solicitas.
          </li>
          <li>Cumplir obligaciones legales y fiscales aplicables.</li>
        </ul>
        <p>
          No usamos tus datos personales con fines de publicidad de terceros
          ni los vendemos. Si en el futuro quisiéramos usarlos para una
          finalidad distinta a las anteriores, te lo comunicaremos y, cuando
          la ley lo requiera, pediremos tu consentimiento antes de hacerlo.
        </p>
      </Section>

      <Section title="4. Transferencia internacional de datos">
        <p>
          Para operar el servicio usamos dos proveedores de infraestructura
          que procesan y almacenan datos <strong className="text-foreground">fuera de México</strong>:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Supabase</strong>, que aloja
            la base de datos y el sistema de autenticación de la cuenta.
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong>, que aloja la
            aplicación web.
          </li>
        </ul>
        <p>
          Ambos actúan como encargados del tratamiento: procesan tus datos
          únicamente para prestarnos el servicio de infraestructura, bajo sus
          propios compromisos contractuales y técnicos de seguridad, y no los
          usan para fines propios. Al crear tu cuenta, consientes esta
          transferencia internacional, indispensable para que la aplicación
          funcione.
        </p>
      </Section>

      <Section title="5. Plazo de conservación">
        <p>
          Conservamos tus datos personales mientras tu cuenta esté activa. Si
          solicitas la cancelación o el borrado de tu cuenta, eliminamos tus
          datos personales identificables, salvo la información que estemos
          obligados a conservar por un periodo adicional por ley (por
          ejemplo, obligaciones fiscales), la cual conservamos únicamente
          para ese fin y por el tiempo que la ley exija.
        </p>
      </Section>

      <Section title="6. Derechos ARCO y cómo ejercerlos">
        <p>
          Tienes derecho a Acceder a tus datos personales, Rectificarlos si
          son inexactos, Cancelarlos cuando consideres que no se requieren
          para las finalidades señaladas, y Oponerte a un tratamiento
          específico. También puedes revocar tu consentimiento en cualquier
          momento.
        </p>
        <p>
          Para ejercer cualquiera de estos derechos, escribe a{" "}
          <a className="font-semibold text-brand underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          desde el correo con el que te registraste, describiendo la solicitud
          y el derecho que quieres ejercer. Te responderemos en un plazo
          razonable, y en cualquier caso dentro de los plazos que marca la
          LFPDPPP para dar respuesta a este tipo de solicitudes.
        </p>
        <p>
          También puedes solicitar la exportación de tus datos y el borrado
          de tu cuenta directamente desde la aplicación, en{" "}
          <Link className="font-semibold text-brand underline" href="/cuenta">
            la pantalla de tu cuenta
          </Link>
          .
        </p>
      </Section>

      <Section title="7. Cambios a este aviso">
        <p>
          Si modificamos este aviso de forma sustancial, te lo notificaremos
          dentro de la aplicación antes de que el cambio entre en vigor.
        </p>
      </Section>

      <p className="mt-8 text-sm text-muted">Última actualización: 22 de agosto de 2026.</p>
    </div>
    </MarketingShell>
  );
}

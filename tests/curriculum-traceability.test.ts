import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  classPackageFileSchema,
  importableClassPackageSchema,
} from "../lib/content/package-schema";
import {
  assertClassPackageRoundTrip,
  countClassPackage,
} from "../lib/content/package-roundtrip";

const traceablePackages = [
  {
    code: "C01",
    fileName: "audio-01-02-orientacion-egel-derecho.json",
    artifacts: 139,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [],
  },
  {
    code: "C02",
    fileName: "audio-04-05-derecho-sustantivo-adjetivo.json",
    artifacts: 130,
    evidence: 17,
    forbiddenClaims: [
      /código federal de procedimientos civiles/i,
      /\bCFPC\b/i,
      /(?:método|proceso|procedimiento)(?:\s+\w+){0,3}\s+(?:de\s+)?siete pasos/i,
      /\b(?:sucesi(?:ón|ones)|sucesorio|testamentario|intestado|herederos?)\b/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C03",
    fileName: "audio-05-14-15-jurisdiccion-competencia.json",
    artifacts: 133,
    evidence: 12,
    forbiddenClaims: [
      /no pueden interpretar la constitución/i,
      /ejecutoria\s+34098/i,
      /\b(?:todos?|cualquier)\s+(?:los\s+)?incidentes?\s+suspenden?/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C04",
    fileName: "audio-18-poder-judicial-local.json",
    artifacts: 133,
    evidence: 12,
    forbiddenClaims: [
      /michoacán/i,
      /ley orgánica del poder judicial del estado de michoacán/i,
      /\b100\s+UMA\b/i,
      /\b(?:toda|cualquier)\s+sentencia\s+(?:es|será)\s+apelable\b/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C05",
    fileName: "audio-56-57-resoluciones-judiciales.json",
    artifacts: 137,
    evidence: 14,
    forbiddenClaims: [/ejecutoria\s+22318/i, /\b1000710\b/],
    requiredClaims: [
      /procesos civiles y familiares/i,
      /aplicación gradual/i,
      /esta clasificación es propia del código nacional: en otras materias debe consultarse la legislación correspondiente/i,
      /no es una fórmula obligatoria universal/i,
    ],
  },
  {
    code: "C06",
    fileName: "audio-05-06-controversia-constitucional.json",
    artifacts: 137,
    evidence: 18,
    forbiddenClaims: [/última reforma DOF 03-04-2025/i],
    requiredClaims: [
      /nueve (?:integrantes|ministras y ministros)/i,
      /(?:al menos|cuando menos|mayoría de) seis votos/i,
      /última reforma DOF 14-11-2025/i,
    ],
  },
  {
    code: "C07",
    fileName: "audio-07-accion-inconstitucionalidad.json",
    artifacts: 138,
    evidence: 10,
    forbiddenClaims: [/última reforma DOF 03-04-2025/i],
    requiredClaims: [
      /treinta días naturales/i,
      /(?:al menos|cuando menos|mayoría de) seis votos/i,
      /nueve integrantes/i,
      /treinta y tres por ciento de la Cámara de Diputados puede impugnar leyes federales/i,
      /mismo porcentaje del Senado, leyes federales o tratados/i,
      /no suspende la norma/i,
    ],
  },
  {
    code: "C08",
    fileName: "audio-10-juicio-politico.json",
    artifacts: 138,
    evidence: 15,
    forbiddenClaims: [
      /cualquier persona (?:puede|podrá) (?:presentar|formular) (?:una )?denuncia/i,
      /artículos 5 a 45/i,
      /presidente.*sujeto.*juicio político ordinario/i,
      /Consejo de la Judicatura Federal/i,
    ],
    requiredClaims: [
      /cualquier ciudadano/i,
      /destitución.*inhabilitación/i,
      /Ley General de Responsabilidades Administrativas: régimen distinto para faltas administrativas/i,
      /declaración de procedencia es autónoma/i,
      /Tribunal de Disciplina Judicial/i,
      /órgano de administración judicial/i,
      /última reforma DOF 01-04-2024/i,
    ],
  },
  {
    code: "C09",
    fileName: "audio-22-procedimiento-legislativo-federal.json",
    artifacts: 140,
    evidence: 13,
    forbiddenClaims: [
      /energía (?:e hidrocarburos )?(?:debe|deberá|tiene que) iniciar en (?:la Cámara de )?Diputados/i,
      /(?:toda|cualquier) iniciativa (?:debe|deberá) (?:dictaminarse|votarse|aprobarse) en treinta días/i,
    ],
    requiredClaims: [
      /máximo de treinta días naturales en cada Cámara; (?:es una regla especial, )?no (?:es )?un plazo general/i,
      /no aplica a reformas constitucionales/i,
      /empréstitos, contribuciones o impuestos y reclutamiento de tropas/i,
      /fecha prevista en transitorios o conforme a la regla supletoria aplicable/i,
      /veto significa dejar el asunto para otro periodo.*Corrección: es devolución con observaciones/i,
    ],
  },
  {
    code: "C10",
    fileName: "audio-11-12-derechos-electorales.json",
    artifacts: 141,
    evidence: 18,
    forbiddenClaims: [
      /Ley General de los Medios de Impugnación en Materia Electoral/i,
      /per saltum (?:siempre|automáticamente) (?:procede|está disponible)/i,
    ],
    requiredClaims: [
      /plazo general de cuatro días/i,
      /per saltum es excepcional/i,
      /dentro del plazo (?:que regía para|del) medio previo/i,
      /recurso de reconsideración.*supuestos extraordinarios/i,
      /organismos públicos locales electorales.*autonomía/i,
      /No\. La competencia entre Sala Superior y salas regionales depende/i,
      /última reforma DOF 14-11-2025/i,
    ],
  },
  {
    code: "C11",
    fileName: "audio-12-amparo-directo.json",
    artifacts: 139,
    evidence: 21,
    forbiddenClaims: [
      /Tribunal Unitario/i,
      /(?:siempre|únicamente) (?:se )?presenta (?:directamente )?ante (?:el )?Tribunal Colegiado/i,
    ],
    requiredClaims: [
      /plazo general es de quince días, pero no es universal/i,
      /treinta días para norma autoaplicativa o extradición/i,
      /hasta ocho años contra sentencia penal definitiva con prisión/i,
      /amparo adhesivo.*quince días.*notificación del acuerdo de admisión/i,
      /revisión ante la Suprema Corte solo procede.*interés excepcional/i,
      /contar solo tres excepciones.*artículo 17 vigente contiene cuatro fracciones/i,
    ],
  },
  {
    code: "C12",
    fileName: "audio-13-amparo-indirecto-procedencia.json",
    artifacts: 142,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /nueve grupos: normas generales autoaplicativas/i,
      /beneficio cierto y no meramente hipotético o eventual/i,
      /imposible reparación.*derecho sustantivo/i,
      /tribunal colegiado de apelación, no tribunal unitario/i,
      /Esto no convierte WhatsApp en vía general/i,
      /El amparo puede promoverse antes o después de una detención/i,
      /plazos diferenciados/i,
    ],
  },
  {
    code: "C13",
    fileName: "audio-16-amparo-indirecto-audiencia-sentencia-revision.json",
    artifacts: 144,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /fallo debe dictarse en un plazo máximo de noventa días naturales/i,
      /sobreseer no declara constitucional el acto/i,
      /revisión.*dentro de diez días.*por conducto del órgano que dictó la resolución/i,
      /nueve integrantes y funcionamiento en Pleno, con posibilidad de dos secciones/i,
      /antiguas cifras de cinco integrantes en Primera Sala y once en Pleno/i,
    ],
  },
  {
    code: "C14",
    fileName: "audio-19-22-poder-ejecutivo-apf-centralizada.json",
    artifacts: 138,
    evidence: 12,
    forbiddenClaims: [/última reforma DOF 16-07-2025/i],
    requiredClaims: [
      /última reforma DOF 07-05-2026/i,
      /Secretarías de Estado y la Consejería Jurídica son dependencias centralizadas/i,
      /órganos administrativos desconcentrados jerárquicamente subordinados/i,
      /No existe una vía única por el solo hecho de que el acto sea federal/i,
    ],
  },
  {
    code: "C15",
    fileName: "audio-20-organismos-descentralizados.json",
    artifacts: 137,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /creada por ley o decreto, con personalidad jurídica y patrimonio propios/i,
      /coordinación sectorial no equivale a subordinación jerárquica/i,
      /autonomía interna equivale a autonomía constitucional/i,
      /No generalices el régimen laboral, fiscal ni la vía de defensa/i,
      /última reforma DOF 07-05-2026/i,
      /última reforma DOF 16-07-2025/i,
    ],
  },
  {
    code: "C16",
    fileName: "audio-22-23-cndh.json",
    artifacts: 142,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /regla general es un año.*excepciones razonadas para infracciones graves/i,
      /recomendación.*pública y no imperativa: por sí misma no repara, no anula actos ni sanciona directamente/i,
      /negativa debe fundarse, motivarse y hacerse pública/i,
      /no conoce actos y resoluciones electorales, resoluciones jurisdiccionales/i,
      /queja no suspende los plazos de otros medios de defensa/i,
      /artículo 105, fracción II, inciso g\)/i,
    ],
  },
  {
    code: "C17",
    fileName: "audio-26-isr-ingresos-retenciones-deducciones.json",
    artifacts: 142,
    evidence: 15,
    forbiddenClaims: [
      /(?:umbral|límite) (?:general|universal) de (?:400|500)[,.]?000 pesos/i,
      /tasa fija (?:general )?de 30%/i,
    ],
    requiredClaims: [
      /persona moral paga servicios profesionales a una persona física de este régimen, debe retener 10%/i,
      /CFDI es necesario en muchos casos, pero no suficiente/i,
      /500,000 pesos.*función informativa distinta.*no crea la regla general/i,
      /última reforma DOF 09-04-2026/i,
    ],
  },
  {
    code: "C18",
    fileName: "audio-27-iva-ieps.json",
    artifacts: 142,
    evidence: 10,
    forbiddenClaims: [
      /tasa general (?:del )?IVA (?:es|de) 14%/i,
      /IEPS significa impuesto especial sobre productos y servicios/i,
    ],
    requiredClaims: [
      /tasa general es 16%; también existen actos a tasa 0%, exentos y no objeto/i,
      /acreditarlo contra IVA de meses siguientes.*solicitar devolución/i,
      /estímulos fronterizos no crean una tasa general de 14%/i,
      /tasas porcentuales y cuotas/i,
      /cuotas actualizadas DOF 22-12-2025/i,
    ],
  },
] as const;

function collectUsedEvidenceIds(value: unknown, key = ""): Set<string> {
  const result = new Set<string>();
  if (
    (key === "evidenceIds" || key.endsWith("EvidenceIds")) &&
    Array.isArray(value)
  ) {
    for (const evidenceId of value) {
      if (typeof evidenceId === "string") result.add(evidenceId);
    }
    return result;
  }
  if (!value || typeof value !== "object") return result;

  for (const [childKey, childValue] of Object.entries(value)) {
    for (const evidenceId of collectUsedEvidenceIds(childValue, childKey)) {
      result.add(evidenceId);
    }
  }
  return result;
}

function expectedSourceOrigin(
  evidenceIds: string[],
  evidenceKinds: Map<string, "official" | "transcript">,
) {
  const kinds = new Set(evidenceIds.map((id) => evidenceKinds.get(id)));
  assert.ok(!kinds.has(undefined));
  if (kinds.size === 2) return "mixed";
  return kinds.has("transcript") ? "class" : "complementary";
}

for (const expected of traceablePackages) {
  test(`${expected.code} conserva ${expected.artifacts} artefactos trazables y un round-trip 1.2 íntegro`, async () => {
    const packagePath = path.join(
      process.cwd(),
      "content",
      "packages",
      expected.fileName,
    );
    const packageFile = classPackageFileSchema.parse(
      JSON.parse(await readFile(packagePath, "utf8")),
    );
    assert.equal(packageFile.packageVersion, "1.2");
    if (packageFile.packageVersion !== "1.2") {
      throw new Error(`${expected.code} debe usar el contrato trazable 1.2.`);
    }
    assert.equal(packageFile.curriculum.code, expected.code);

    const serializedPackage = JSON.stringify(packageFile);
    for (const forbiddenClaim of expected.forbiddenClaims) {
      assert.doesNotMatch(
        serializedPackage,
        forbiddenClaim,
        `${expected.code} reintrodujo una afirmación retirada: ${forbiddenClaim}`,
      );
    }
    for (const requiredClaim of expected.requiredClaims) {
      assert.match(
        serializedPackage,
        requiredClaim,
        `${expected.code} perdió una precisión jurídica requerida: ${requiredClaim}`,
      );
    }

    const cleanedTranscript = packageFile.transcript.cleaned;
    assert.ok(cleanedTranscript);
    const bundle = importableClassPackageSchema.parse({
      ...packageFile,
      transcript: {
        original: cleanedTranscript,
        cleaned: cleanedTranscript,
      },
    });

    if (expected.code === "C06" || expected.code === "C07") {
      const questions = bundle.topics.flatMap((topic) => topic.exam.questions);
      for (const question of questions) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          /(?:once|11) (?:ministros|integrantes)|(?:ocho|8) votos/i,
          `${expected.code} no puede presentar la integración o votación histórica como respuesta vigente.`,
        );
      }

      const obsoleteCompositionQuestion = questions.find(
        (question) =>
          /(?:once|11) (?:ministros|integrantes)/i.test(question.text) ||
          question.options.some((option) =>
            /(?:once|11) (?:ministros|integrantes)/i.test(option),
          ),
      );
      assert.ok(obsoleteCompositionQuestion);
      assert.match(
        obsoleteCompositionQuestion.options[
          obsoleteCompositionQuestion.correctOption
        ] ?? "",
        expected.code === "C06"
          ? /nueve integrantes.*artículo 94 vigente/i
          : /nueve integrantes.*seis votos/i,
      );
      if (expected.code === "C06") {
        assert.match(
          obsoleteCompositionQuestion.explanation,
          /desactualizado.*nueve integrantes/i,
        );
      } else {
        assert.match(
          JSON.stringify(obsoleteCompositionQuestion.optionExplanations),
          /cifras anteriores a la reforma/i,
        );
      }
    }

    if (expected.code === "C09" || expected.code === "C10") {
      const obsoleteAsCurrent =
        expected.code === "C09"
          ? /energía.*iniciar en Diputados|veto.*(?:siguiente|otro) periodo|toda iniciativa.*treinta días/i
          : /todo asunto federal.*Sala Superior|OPLE.*(?:depende|subordinad).*INE|per saltum.*siempre/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C11" || expected.code === "C12") {
      const obsoleteAsCurrent =
        expected.code === "C11"
          ? /quince días sin excepciones|tres excepciones|revisión ordinaria.*(?:SCJN|Corte)/i
          : /Tribunal Unitario|WhatsApp|solo antes de (?:la )?detención|(?:madre|padre|familiar).*autoridad/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla histórica o absoluta como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C13" || expected.code === "C14") {
      const obsoleteAsCurrent =
        expected.code === "C13"
          ? /once integrantes|Primera Sala.*cinco|toda revisión.*Suprema Corte/i
          : /centralizada.*desconcentrada.*descentralizada|todo acto federal.*misma vía|órgano desconcentrado.*independiente/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una estructura histórica o regla absoluta como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C15" || expected.code === "C16") {
      const obsoleteAsCurrent =
        expected.code === "C15"
          ? /organismo descentralizado.*subordinado jerárquicamente|patrimonio propio.*recursos privados|autonomía de gestión.*autonomía constitucional/i
          : /CNDH.*(?:dicta sentencia|encarcela|destituye|anula)|recomendación.*(?:vinculante|repara automáticamente)|queja.*suspende.*plazo/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una generalización retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C17" || expected.code === "C18") {
      const obsoleteAsCurrent =
        expected.code === "C17"
          ? /(?:400|500)[,.]?000 pesos.*(?:umbral|límite) (?:general|universal)|tasa fija.*30%|CFDI.*(?:basta|garantiza).*deducci/i
          : /tasa (?:general )?(?:de )?14%|saldo a favor.*compens.*ISR|destruir inventario.*devolución|todo servicio extranjero.*IEPS/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una cifra obsoleta o generalización retirada como respuesta vigente.`,
        );
      }
    }

    assert.equal(countClassPackage(bundle).artifacts, expected.artifacts);
    assert.equal(bundle.evidenceRegistry.length, expected.evidence);
    assert.deepEqual(
      [...collectUsedEvidenceIds(bundle)].sort(),
      bundle.evidenceRegistry.map(({ id }) => id).sort(),
    );

    const evidenceKinds = new Map(
      bundle.evidenceRegistry.map(({ id, kind }) => [id, kind]),
    );
    for (const topic of bundle.topics) {
      for (const artifact of [...topic.materials, ...topic.flashcards]) {
        assert.equal(
          artifact.sourceOrigin,
          expectedSourceOrigin(artifact.evidenceIds, evidenceKinds),
        );
      }
    }

    const report = assertClassPackageRoundTrip(bundle, bundle, {
      publicationStatus: "draft",
      topicApprovalStatuses: bundle.topics.map(() => "pending"),
    });
    assert.equal(report.equivalent, true);
  });
}

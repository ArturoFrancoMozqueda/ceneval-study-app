import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { classPackageFileSchema } from "../lib/content/package-schema";

type Evidence = {
  id: string;
  kind: string;
  title?: string;
  url?: string;
  institution?: string;
  jurisdiction?: string;
  locator:
    | string
    | { type: "line_range"; startLine: number; endLine: number }
    | { type: "timestamp"; startSecond: number; endSecond: number };
  verifiedOn?: string;
  audioNumber?: number;
  audioFile?: string;
};

type Flashcard = {
  question: string;
  answer: string;
  evidenceIds: string[];
};

type Package = {
  packageVersion: string;
  curriculum: { code: string; order: number };
  subject: { name: string };
  class: { title: string };
  topics: Array<{
    title: string;
    description: string;
    flashcards: Flashcard[];
    learningJourney: {
      practicalCase: {
        facts: string;
        question: string;
        legalRule: string;
        reasoning: string;
        conclusion: string;
        evidenceIds: string[];
      };
    };
    exam: {
      questions: Array<{
        text: string;
        difficulty: "basic" | "intermediate" | "advanced";
        options: string[];
        correctOption: number;
        explanation: string;
        optionExplanations: string[];
        evidenceIds: string[];
      }>;
    };
  }>;
  evidenceRegistry: Evidence[];
};

type Item = {
  id: string;
  prompt: string;
  type: "recuerdo libre" | "recuerdo guiado" | "reconocimiento";
  difficulty: "básica" | "intermedia" | "avanzada";
  seconds: number;
  objective: string;
  requiredPoints: string[];
  acceptableAlternatives: string;
  commonErrors: string[];
  evidenceIds: string[];
};

const root = process.cwd();
const packageDirectory = join(root, "content", "packages");
const outputDirectory = join(root, "docs", "retrieval-practice");

function markdown(value: string) {
  return value
    .replaceAll("|", "\\|")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("\r", "")
    .trim();
}

function renderLocator(entry: Evidence) {
  if (typeof entry.locator === "string") return entry.locator;
  return entry.locator.type === "line_range"
    ? `líneas ${entry.locator.startLine}-${entry.locator.endLine}`
    : `segundos ${entry.locator.startSecond}-${entry.locator.endSecond}`;
}

function spanishJurisdiction(value: string) {
  return value.replaceAll("Mexico", "México");
}

function loadPackages() {
  return readdirSync(packageDirectory)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      const raw = readFileSync(join(packageDirectory, name), "utf8").trim();
      if (!raw) return [];
      const parsed = classPackageFileSchema.parse(JSON.parse(raw));
      const bundle = parsed as unknown as Package;
      if (bundle.packageVersion !== "1.2" || !bundle.curriculum?.code) return [];
      return [{ name, bundle }];
    })
    .sort((left, right) =>
      left.bundle.curriculum.code.localeCompare(right.bundle.curriculum.code),
    );
}

function flashcardCommonError(answer: string) {
  const normalized = answer.toLocaleLowerCase("es-MX");
  if (normalized.startsWith("no") || normalized.includes(" no ")) {
    return "Convertir una regla condicionada en una afirmación universal o responder afirmativamente sin atender la excepción indicada.";
  }
  if (normalized.startsWith("sí") || normalized.startsWith("si,")) {
    return "Negar la regla o afirmar el resultado sin conservar las condiciones y límites indicados en la clave.";
  }
  if (/\d|día|mes|por ciento|%/.test(normalized)) {
    return "Confundir la cifra, la unidad o el momento desde el cual se cuenta el plazo o porcentaje.";
  }
  if (/salvo|depende|except|sujeto|siempre que/.test(normalized)) {
    return "Presentar como absoluta una regla que la clave sujeta a condiciones, excepciones o un ámbito concreto.";
  }
  return `Dar una respuesta que no recupere todos los elementos de la clave: ${answer}`;
}

function buildItems(bundle: Package): Item[] {
  const code = bundle.curriculum.code;
  const topic = bundle.topics[0];
  const priorityFlashcardIndexes: Record<string, number[]> = {
    C06: [0, 1, 2, 4, 5, 8],
    C07: [0, 2, 3, 8, 9, 10],
    C13: [0, 1, 2, 5, 6, 9],
    C20: [0, 3, 5, 8, 9, 10],
    C33: [0, 2, 3, 5, 8, 10],
    C50: [0, 2, 4, 5, 6, 8],
    C51: [0, 5, 7, 8, 9, 11],
    C56: [0, 1, 2, 3, 5, 6],
    C57: [0, 2, 3, 5, 6, 8],
  };
  const selectedIndexes = priorityFlashcardIndexes[code] ?? [0, 1, 2, 3, 4, 5];
  if (
    selectedIndexes.length !== 6 ||
    new Set(selectedIndexes).size !== 6 ||
    selectedIndexes.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= topic.flashcards.length,
    )
  ) {
    throw new Error(`${code}: la selección de tarjetas debe contener seis índices únicos y válidos.`);
  }
  const promptOverrides: Record<string, string> = {
    "C09-5": "¿Qué ocurre si la cámara revisora modifica el proyecto?",
    "C12-0": "¿Cuáles son los supuestos de procedencia del amparo indirecto?",
  };
  const flashcards = selectedIndexes.map<Item>((cardIndex, index) => {
    const card = topic.flashcards[cardIndex];
    const question = promptOverrides[`${code}-${cardIndex}`] ?? card.question;
    return {
    id: `${code}-R${String(index + 1).padStart(2, "0")}`,
    prompt: `Tema «${topic.title}»: ${question}`,
    type: "recuerdo libre",
    difficulty: index < 2 ? "básica" : "intermedia",
    seconds: index < 2 ? 45 : 75,
    objective: `Recuperar con precisión un componente del tema «${topic.title}».`,
    requiredPoints: [card.answer],
    acceptableAlternatives:
      "Se acepta una formulación equivalente si conserva íntegramente el contenido del punto obligatorio.",
    commonErrors: [
      flashcardCommonError(card.answer),
    ],
    evidenceIds: card.evidenceIds,
    };
  });

  const practicalCase = topic.learningJourney.practicalCase;
  const practicalItem: Item = {
    id: `${code}-R07`,
    prompt: `Caso: ${practicalCase.facts}\n\nPregunta: ${practicalCase.question}`,
    type: "recuerdo guiado",
    difficulty: "avanzada",
    seconds: 180,
    objective: `Aplicar reglas del tema «${topic.title}» a hechos concretos.`,
    requiredPoints: [
      practicalCase.legalRule,
      practicalCase.reasoning,
      practicalCase.conclusion,
    ],
    acceptableAlternatives:
      "Se acepta una ruta argumentativa equivalente si identifica la regla, la aplica a los hechos y conserva la conclusión jurídica.",
    commonErrors: [
      "Dar solo la conclusión sin identificar la regla ni explicar su aplicación a los hechos.",
    ],
    evidenceIds: practicalCase.evidenceIds,
  };
  if (code === "C33") {
    const federalInterpellation = topic.exam.questions[7];
    practicalItem.prompt = federalInterpellation.text;
    practicalItem.objective =
      "Aplicar el plazo de exigibilidad de una obligación de dar sin fecha sujeta al Código Civil Federal.";
    practicalItem.requiredPoints = [
      federalInterpellation.options[federalInterpellation.correctOption],
      federalInterpellation.explanation,
    ];
    practicalItem.evidenceIds = ["ev-c33-ccf-art2080-interpelacion"];
  }

  const examQuestion = topic.exam.questions[0];
  const correctLetter = String.fromCharCode(65 + examQuestion.correctOption);
  const incorrectExplanations = examQuestion.optionExplanations.filter(
    (_, index) => index !== examQuestion.correctOption,
  );
  const recognitionItem: Item = {
    id: `${code}-R08`,
    prompt: `${examQuestion.text}\n\n${examQuestion.options
      .map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`)
      .join("\n")}`,
    type: "reconocimiento",
    difficulty:
      examQuestion.difficulty === "basic"
        ? "básica"
        : examQuestion.difficulty === "advanced"
          ? "avanzada"
          : "intermedia",
    seconds: 90,
    objective: `Distinguir la aplicación correcta del tema «${topic.title}» frente a distractores plausibles.`,
    requiredPoints: [
      `Opción ${correctLetter}: ${examQuestion.options[examQuestion.correctOption]}.`,
      examQuestion.explanation,
    ],
    acceptableAlternatives:
      "La selección debe coincidir con la opción indicada; la justificación puede redactarse de forma equivalente.",
    commonErrors:
      incorrectExplanations.length > 0
        ? [...new Set(incorrectExplanations)]
        : ["Elegir un distractor sin contrastarlo con la regla aplicable."],
    evidenceIds: examQuestion.evidenceIds,
  };

  return [...flashcards, practicalItem, recognitionItem];
}

function validate(bundle: Package, items: Item[]) {
  const code = bundle.curriculum.code;
  const evidence = new Map(bundle.evidenceRegistry.map((entry) => [entry.id, entry]));
  if (items.length !== 8) throw new Error(`${code}: se esperaban 8 reactivos.`);
  if (new Set(items.map((item) => item.id)).size !== 8) {
    throw new Error(`${code}: hay identificadores de reactivo repetidos.`);
  }
  for (const item of items) {
    if (!item.prompt.trim() || item.requiredPoints.some((point) => !point.trim())) {
      throw new Error(`${item.id}: consigna o clave sustantiva vacía.`);
    }
    if (item.evidenceIds.length === 0) {
      throw new Error(`${item.id}: no tiene evidencia.`);
    }
    const entries = item.evidenceIds.map((id) => {
      const entry = evidence.get(id);
      if (!entry) throw new Error(`${item.id}: evidencia inexistente ${id}.`);
      if (!entry.locator) {
        throw new Error(`${item.id}: evidencia incompleta ${id}.`);
      }
      if (
        entry.kind === "official" &&
        (!entry.verifiedOn || !entry.institution || !entry.jurisdiction || !entry.url)
      ) {
        throw new Error(`${item.id}: fuente oficial incompleta ${id}.`);
      }
      if (entry.verifiedOn && entry.verifiedOn > new Date().toISOString().slice(0, 10)) {
        throw new Error(`${item.id}: la evidencia ${id} tiene una fecha futura.`);
      }
      return entry;
    });
    if (!entries.some((entry) => entry.kind === "official")) {
      throw new Error(`${item.id}: requiere al menos una fuente oficial.`);
    }
  }
}

function renderItem(item: Item, evidence: Map<string, Evidence>) {
  const entries = item.evidenceIds.map((id) => evidence.get(id)!);
  const verifiedOn = [
    ...new Set(
      entries
        .filter((entry) => entry.kind === "official")
        .map((entry) => entry.verifiedOn!),
    ),
  ]
    .sort()
    .join(", ");
  const jurisdictions = [
    ...new Set(
      entries
        .filter((entry) => entry.kind === "official")
        .map((entry) => spanishJurisdiction(entry.jurisdiction!)),
    ),
  ].join(", ");
  return [
    `### ${item.id}`,
    "",
    markdown(item.prompt),
    "",
    `- **Tipo:** ${item.type}`,
    `- **Dificultad:** ${item.difficulty}`,
    `- **Tiempo estimado:** ${item.seconds} segundos`,
    `- **Objetivo:** ${markdown(item.objective)}`,
    `- **Ámbito:** ${markdown(jurisdictions)}`,
    `- **Evidencias:** ${item.evidenceIds.map((id) => `\`${id}\``).join(", ")}`,
    `- **Verificación de las fuentes:** ${verifiedOn}`,
    "- **Retirar o revalidar si:** una fuente oficial se reforma, sustituye o deja de estar vigente.",
    "",
    "#### Clave de autoevaluación",
    "",
    "**Puntos obligatorios**",
    "",
    ...item.requiredPoints.map((point) => `- ${markdown(point)}`),
    "",
    `**Alternativas aceptables:** ${markdown(item.acceptableAlternatives)}`,
    "",
    "**Errores comunes**",
    "",
    ...item.commonErrors.map((error) => `- ${markdown(error)}`),
    "",
  ].join("\n");
}

function renderDocument(name: string, bundle: Package, items: Item[]) {
  const evidence = new Map(bundle.evidenceRegistry.map((entry) => [entry.id, entry]));
  const usedIds = [...new Set(items.flatMap((item) => item.evidenceIds))].sort();
  const sources = usedIds.map((id) => evidence.get(id)!);
  return [
    `# ${bundle.curriculum.code} — ${bundle.class.title}`,
    "",
    `**Materia:** ${bundle.subject.name}`,
    `**Paquete fuente:** \`content/packages/${name}\` (contrato 1.2)`,
    "**Uso:** práctica de recuperación autodirigida, de bajo riesgo y sin calificación automática.",
    "",
    "Realiza una sesión de 3 a 5 reactivos. Intenta responder antes de abrir la clave; si no lo recuerdas, indícalo y revisa la respuesta. Autoevalúa cada intento como correcto, parcial o incorrecto. Repite primero los errores y las respuestas de baja confianza.",
    "",
    "## Reactivos",
    "",
    ...items.map((item) => renderItem(item, evidence)),
    "## Fuentes trazables",
    "",
    "| Evidencia | Fuente | Institución | Ámbito | Localizador | Verificada |",
    "| --- | --- | --- | --- | --- | --- |",
    ...sources.map((entry) => {
      const title =
        entry.title ??
        `Transcripción original privada — ${entry.audioFile ?? `AUDIO ${entry.audioNumber}`}`;
      const safeUrl = entry.url?.replaceAll("(", "%28").replaceAll(")", "%29");
      const source = safeUrl ? `[${markdown(title)}](${safeUrl})` : markdown(title);
      return `| \`${entry.id}\` | ${source} | ${markdown(entry.institution ?? "Archivo editorial privado")} | ${markdown(spanishJurisdiction(entry.jurisdiction ?? "No aplica"))} | ${markdown(renderLocator(entry))} | ${entry.verifiedOn ?? "Evidencia original de clase"} |`;
    }),
    "",
  ].join("\n");
}

const packages = loadPackages();
if (packages.length !== 57) {
  throw new Error(`Se esperaban 57 paquetes 1.2 y se encontraron ${packages.length}.`);
}
const expectedCodes = Array.from(
  { length: 57 },
  (_, index) => `C${String(index + 1).padStart(2, "0")}`,
);
const packageCodes = packages.map(({ bundle }) => bundle.curriculum.code);
if (
  new Set(packageCodes).size !== expectedCodes.length ||
  packageCodes.some((code, index) => code !== expectedCodes[index])
) {
  throw new Error("Los paquetes deben corresponder exactamente a C01-C57, sin duplicados.");
}
const documentCodes = readdirSync(outputDirectory)
  .filter((name) => /^C\d{2}\.md$/.test(name))
  .map((name) => name.slice(0, 3))
  .sort();
if (
  documentCodes.length !== expectedCodes.length ||
  documentCodes.some((code, index) => code !== expectedCodes[index])
) {
  throw new Error("docs/retrieval-practice debe contener exactamente C01.md-C57.md.");
}

let itemCount = 0;
let mismatches = 0;
const write = process.argv.includes("--write");
for (const { name, bundle } of packages) {
  const items = buildItems(bundle);
  validate(bundle, items);
  itemCount += items.length;
  const output = `${renderDocument(name, bundle, items).trim()}\n`;
  const path = join(outputDirectory, `${bundle.curriculum.code}.md`);
  if (write) {
    writeFileSync(path, output, "utf8");
  } else {
    const current = readFileSync(path, "utf8");
    if (current !== output) {
      console.error(`${bundle.curriculum.code}: el documento no coincide con su paquete 1.2.`);
      mismatches += 1;
    }
  }
}

if (itemCount !== 456) throw new Error(`Se esperaban 456 reactivos y se generaron ${itemCount}.`);
if (mismatches > 0) {
  throw new Error(`${mismatches} documento(s) requieren regeneración.`);
}
console.log(
  write
    ? `Regenerados ${itemCount} reactivos trazables en 57 clases.`
    : `Gate aprobado: ${itemCount} reactivos, 57 clases, claves no vacías y evidencia oficial localizada.`,
);

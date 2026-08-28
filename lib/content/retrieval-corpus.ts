import { z } from "zod";
import {
  retrievalTypeSchema,
  type PracticeAnswerKey,
} from "@/lib/study/adaptive-practice";

const difficultySchema = z.enum(["basic", "intermediate", "advanced"]);
const evidenceSchema = z.object({
  code: z.string().trim().min(1),
  label: z.string().trim().min(1),
  href: z.string().url().startsWith("https://").optional(),
  verifiedOn: z.iso.date().optional(),
});
const answerKeySchema = z.object({
  requiredPoints: z.array(z.string().trim().min(1)).min(1),
  acceptableAlternatives: z.array(z.string().trim().min(1)),
  commonErrors: z.array(z.string().trim().min(1)),
  evidence: z.array(evidenceSchema).min(1),
});
const projectedItemSchema = z.object({
  stableCode: z.string().regex(/^C\d{2}-(?:R|QC)\d{2}$/),
  classCode: z.string().regex(/^C\d{2}$/),
  topicPosition: z.number().int().positive(),
  prompt: z.string().trim().min(10),
  retrievalType: retrievalTypeSchema,
  difficulty: difficultySchema,
  estimatedSeconds: z.number().int().min(15).max(600),
  objective: z.string().trim().min(10),
  answerKey: answerKeySchema,
});

export const retrievalCorpusProjectionSchema = z
  .object({
    schemaVersion: z.literal("retrieval-corpus-v1"),
    approvalStatus: z.enum(["pending_editorial_approval", "approved"]),
    items: z.array(projectedItemSchema).min(1),
  })
  .superRefine((corpus, context) => {
    const seen = new Set<string>();
    for (const [index, item] of corpus.items.entries()) {
      if (seen.has(item.stableCode)) {
        context.addIssue({
          code: "custom",
          message: `Identificador duplicado: ${item.stableCode}.`,
          path: ["items", index, "stableCode"],
        });
      }
      seen.add(item.stableCode);
    }
  });

export type RetrievalCorpusProjection = z.infer<
  typeof retrievalCorpusProjectionSchema
>;
export type ProjectedRetrievalItem = RetrievalCorpusProjection["items"][number];

const typeMap = {
  "recuerdo libre": "free_recall",
  "recuerdo guiado": "cued_recall",
  reconocimiento: "recognition",
} as const;
const difficultyMap = {
  "básica": "basic",
  intermedia: "intermediate",
  avanzada: "advanced",
} as const;

function unescapeMarkdown(value: string) {
  return value.replaceAll("\\|", "|").replaceAll("\\[", "[").replaceAll("\\]", "]").trim();
}

function listBetween(value: string, start: string, end?: string) {
  const startIndex = value.indexOf(start);
  if (startIndex < 0) return [];
  const contentStart = startIndex + start.length;
  const endIndex = end ? value.indexOf(end, contentStart) : -1;
  const content = value.slice(contentStart, endIndex >= 0 ? endIndex : undefined);
  return content
    .split("\n")
    .map((line) => line.match(/^- (.+)$/)?.[1])
    .filter((line): line is string => Boolean(line))
    .map(unescapeMarkdown);
}

function parseEvidence(markdown: string) {
  const sources = new Map<string, PracticeAnswerKey["evidence"][number]>();
  for (const line of markdown.split("\n")) {
    const match = line.match(/^\| `([^`]+)` \| (.+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| ([^|]*) \|$/);
    if (!match) continue;
    const [, code, sourceCell, , , , verifiedCell] = match;
    const link = sourceCell.match(/^\[(.+)]\((https:\/\/[^)]+)\)$/);
    const verifiedOn = verifiedCell.trim().match(/^\d{4}-\d{2}-\d{2}$/)?.[0];
    sources.set(code, {
      code,
      label: unescapeMarkdown(link?.[1] ?? sourceCell),
      ...(link?.[2] ? { href: link[2] } : {}),
      ...(verifiedOn ? { verifiedOn } : {}),
    });
  }
  return sources;
}

export function parseRetrievalPracticeDocument(markdown: string) {
  const classCode = markdown.match(/^# (C\d{2}) — /m)?.[1];
  if (!classCode) throw new Error("El documento no declara un código curricular Cxx.");
  const sources = parseEvidence(markdown);
  const itemMatches = [...markdown.matchAll(/^### (C\d{2}-(?:R|QC)\d{2})\n\n([\s\S]*?)(?=^### C\d{2}-(?:R|QC)\d{2}|^## Fuentes trazables)/gm)];
  if (!itemMatches.length) throw new Error(`${classCode}: no contiene reactivos.`);

  return itemMatches.map((match) => {
    const stableCode = match[1];
    const body = match[2];
    const prompt = body.slice(0, body.indexOf("\n\n- **Tipo:**")).trim();
    const typeLabel = body.match(/^- \*\*Tipo:\*\* (.+)$/m)?.[1] as keyof typeof typeMap;
    const difficultyLabel = body.match(/^- \*\*Dificultad:\*\* (.+)$/m)?.[1] as keyof typeof difficultyMap;
    const estimatedSeconds = Number(body.match(/^- \*\*Tiempo estimado:\*\* (\d+) segundos$/m)?.[1]);
    const objective = body.match(/^- \*\*Objetivo:\*\* (.+)$/m)?.[1] ?? "";
    const evidenceCodes = [...body.matchAll(/`([^`]+)`/g)].map((entry) => entry[1]);
    const requiredPoints = listBetween(
      body,
      "**Puntos obligatorios**\n\n",
      "\n\n**Alternativas aceptables:**",
    );
    const acceptable = body.match(/^\*\*Alternativas aceptables:\*\* (.+)$/m)?.[1];
    const commonErrors = listBetween(body, "**Errores comunes**\n\n");
    const evidence = evidenceCodes.map((code) => {
      const entry = sources.get(code);
      if (!entry) throw new Error(`${stableCode}: falta la fuente trazable ${code}.`);
      return entry;
    });

    return projectedItemSchema.parse({
      stableCode,
      classCode,
      topicPosition: 1,
      prompt: unescapeMarkdown(prompt),
      retrievalType: typeMap[typeLabel],
      difficulty: difficultyMap[difficultyLabel],
      estimatedSeconds,
      objective: unescapeMarkdown(objective),
      answerKey: {
        requiredPoints,
        acceptableAlternatives: acceptable ? [unescapeMarkdown(acceptable)] : [],
        commonErrors,
        evidence,
      },
    });
  });
}

export function prepareRetrievalCorpusProjection(documents: string[]) {
  return retrievalCorpusProjectionSchema.parse({
    schemaVersion: "retrieval-corpus-v1",
    approvalStatus: "pending_editorial_approval",
    items: documents.flatMap(parseRetrievalPracticeDocument),
  });
}

export type InvokeRetrievalCorpusRpc = (
  functionName: "import_retrieval_corpus_v1",
  args: { p_corpus: RetrievalCorpusProjection },
) => PromiseLike<{ data: unknown; error: unknown }>;

export async function importApprovedRetrievalCorpus(
  invokeRpc: InvokeRetrievalCorpusRpc,
  input: unknown,
) {
  const corpus = retrievalCorpusProjectionSchema.parse(input);
  if (corpus.approvalStatus !== "approved") {
    throw new Error(
      "La proyección no incluye aprobación explícita para importar; no puede escribirse en Supabase.",
    );
  }
  const { data, error } = await invokeRpc("import_retrieval_corpus_v1", {
    p_corpus: corpus,
  });
  if (error || !Number.isInteger(data) || Number(data) !== corpus.items.length) {
    throw new Error("Supabase no confirmó la importación íntegra del corpus adaptativo.");
  }
  return Number(data);
}

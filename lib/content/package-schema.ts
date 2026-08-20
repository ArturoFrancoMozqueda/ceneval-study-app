import { z } from "zod";

const sourceOrigin = z.enum(["class", "complementary", "mixed"]);
const materialType = z.enum([
  "short_answer",
  "full_explanation",
  "legal_basis",
  "simple_example",
  "ceneval_example",
  "summary",
  "study_guide",
  "key_concepts",
  "common_errors",
]);

const materialSchema = z.object({
  type: materialType,
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(40),
  sourceOrigin,
});

const referenceSchema = z.object({
  title: z.string().trim().min(1),
  url: z.url().refine((url) => url.startsWith("https://"), {
    message: "La referencia debe usar HTTPS.",
  }),
  institution: z.string().trim().min(1),
  jurisdiction: z.string().trim().min(1),
  citation: z.string().trim().optional().default(""),
  retrievedOn: z.iso.date(),
  note: z.string().trim().optional().default(""),
});

const mapNodeSchema = z.object({
  id: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(280).optional(),
  parentId: z.string().trim().max(60).optional(),
});

const questionSchema = z.object({
  text: z.string().trim().min(20),
  difficulty: z.enum(["basic", "intermediate", "advanced"]),
  options: z.array(z.string().trim().min(1)).min(3).max(4),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(30),
  optionExplanations: z.array(z.string().trim().min(10)).min(3).max(4),
}).superRefine((question, context) => {
  if (question.options.length !== question.optionExplanations.length) {
    context.addIssue({
      code: "custom",
      message: "Cada opción debe tener su explicación correspondiente.",
      path: ["optionExplanations"],
    });
  }
  if (question.correctOption >= question.options.length) {
    context.addIssue({
      code: "custom",
      message: "La respuesta correcta debe señalar una opción existente.",
      path: ["correctOption"],
    });
  }
});

const learningJourneySchema = z.object({
  openingPrompt: z.string().trim().min(20),
  quickChecks: z
    .array(
      z.object({
        prompt: z.string().trim().min(10),
        answer: z.string().trim().min(10),
        feedback: z.string().trim().min(20),
      }),
    )
    .min(2),
  practicalCase: z.object({
    facts: z.string().trim().min(30),
    question: z.string().trim().min(10),
    legalRule: z.string().trim().min(20),
    reasoning: z.string().trim().min(30),
    conclusion: z.string().trim().min(20),
  }),
  closingPrompt: z.string().trim().min(20),
  nextActivity: z.string().trim().min(10),
});

const topicSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(20).max(400),
    learningJourney: learningJourneySchema,
    materials: z.array(materialSchema).length(9),
    conceptMap: z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      nodes: z.array(mapNodeSchema).min(3),
    }),
    references: z.array(referenceSchema).min(1),
    flashcards: z
      .array(
        z.object({
          question: z.string().trim().min(10),
          answer: z.string().trim().min(10),
          sourceOrigin,
        }),
      )
      .min(10)
      .max(15),
    exam: z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      questions: z.array(questionSchema).length(10),
    }),
  })
  .superRefine((topic, context) => {
    const materialTypes = new Set(topic.materials.map(({ type }) => type));
    if (materialTypes.size !== materialType.options.length) {
      context.addIssue({
        code: "custom",
        message: "Cada tema debe incluir exactamente los 9 tipos de material.",
        path: ["materials"],
      });
    }
    const nodeIds = new Set(topic.conceptMap.nodes.map(({ id }) => id));
    for (const [index, node] of topic.conceptMap.nodes.entries()) {
      if (node.parentId && !nodeIds.has(node.parentId)) {
        context.addIssue({
          code: "custom",
          message: `El nodo padre ${node.parentId} no existe.`,
          path: ["conceptMap", "nodes", index, "parentId"],
        });
      }
    }
  });

export const curriculumMetadataSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^C(?:0[1-9]|[1-4][0-9]|5[0-8])$/, {
        message: "El código curricular debe estar entre C01 y C58.",
      }),
    order: z.number().int().min(1).max(58),
    audioSources: z
      .array(
        z.object({
          audioNumber: z.number().int().min(1).max(70),
          fragment: z.string().trim().min(1).max(120),
        }),
      )
      .min(1)
      .max(10),
  })
  .superRefine((curriculum, context) => {
    const codeOrder = Number(curriculum.code.slice(1));
    if (codeOrder !== curriculum.order) {
      context.addIssue({
        code: "custom",
        message: `El código ${curriculum.code} debe usar el orden ${codeOrder}.`,
        path: ["order"],
      });
    }

    const seenAudioNumbers = new Set<number>();
    for (const [index, source] of curriculum.audioSources.entries()) {
      if (seenAudioNumbers.has(source.audioNumber)) {
        context.addIssue({
          code: "custom",
          message: `El Audio ${source.audioNumber} está repetido en la clase.`,
          path: ["audioSources", index, "audioNumber"],
        });
      }
      seenAudioNumbers.add(source.audioNumber);
    }
  });

const packageContent = z.object({
  subject: z.object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(300),
  }),
  class: z.object({
    title: z.string().trim().min(1).max(120),
    date: z.iso.date().optional(),
    teacher: z.string().trim().max(100).optional(),
    description: z.string().trim().min(1).max(400),
  }),
  topics: z.array(topicSchema).min(1),
});

const transcriptSchema = z.object({
  original: z.string().trim().min(30).max(200000),
  cleaned: z.string().trim().min(30).max(200000),
});

const transcriptFileSchema = z
  .object({
    original: z.string().trim().min(30).max(200000).optional(),
    originalFile: z.string().trim().min(1).optional(),
    originalFiles: z.array(z.string().trim().min(1)).min(2).max(10).optional(),
    cleaned: z.string().trim().min(30).max(200000).optional(),
  })
  .superRefine((transcript, context) => {
    const sourceCount = [
      transcript.original,
      transcript.originalFile,
      transcript.originalFiles,
    ].filter(Boolean).length;
    if (sourceCount !== 1) {
      context.addIssue({
        code: "custom",
        message:
          "Incluye exactamente una fuente: original, originalFile u originalFiles.",
      });
    }
  });

const legacyPackageSchema = packageContent.extend({
  packageVersion: z.literal("1.0"),
});

const currentPackageSchema = packageContent.extend({
  packageVersion: z.literal("1.1"),
  curriculum: curriculumMetadataSchema,
});

export const classPackageSchema = z.discriminatedUnion("packageVersion", [
  legacyPackageSchema.extend({ transcript: transcriptSchema }),
  currentPackageSchema.extend({ transcript: transcriptSchema }),
]);

export const classPackageFileSchema = z.discriminatedUnion("packageVersion", [
  legacyPackageSchema.extend({ transcript: transcriptFileSchema }),
  currentPackageSchema.extend({ transcript: transcriptFileSchema }),
]);

export const importableClassPackageSchema = currentPackageSchema.extend({
  transcript: z.object({
    original: z.string().trim().min(30).max(200000),
    cleaned: z.string().trim().min(30).max(200000),
  }),
});

export type ClassPackage = z.infer<typeof classPackageSchema>;
export type ImportableClassPackage = z.infer<
  typeof importableClassPackageSchema
>;

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

const packageBase = z.object({
  packageVersion: z.literal("1.0"),
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

export const classPackageSchema = packageBase.extend({
  transcript: z.object({
    original: z.string().trim().min(30).max(200000),
    cleaned: z.string().trim().min(30).max(200000),
  }),
});

export const classPackageFileSchema = packageBase.extend({
  transcript: z
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
    }),
});

export type ClassPackage = z.infer<typeof classPackageSchema>;

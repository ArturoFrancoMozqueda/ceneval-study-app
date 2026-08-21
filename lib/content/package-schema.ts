import { z } from "zod";
import {
  MAX_TRANSCRIPT_LENGTH,
  MIN_TRANSCRIPT_LENGTH,
} from "../transcript-validation";

const sourceOrigin = z.enum(["class", "complementary", "mixed"]);
const evidenceIdSchema = z
  .string()
  .trim()
  .regex(/^ev-[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "El ID de evidencia debe ser estable y usar el formato ev-palabras-en-minusculas.",
  });
const evidenceIdsSchema = z.array(evidenceIdSchema).min(1).superRefine(
  (evidenceIds, context) => {
    const seen = new Set<string>();
    for (const [index, evidenceId] of evidenceIds.entries()) {
      if (seen.has(evidenceId)) {
        context.addIssue({
          code: "custom",
          message: `La evidencia ${evidenceId} está repetida en este artefacto.`,
          path: [index],
        });
      }
      seen.add(evidenceId);
    }
  },
);

const transcriptLocatorSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("line_range"),
      startLine: z.number().int().min(1),
      endLine: z.number().int().min(1),
    })
    .superRefine((locator, context) => {
      if (locator.endLine < locator.startLine) {
        context.addIssue({
          code: "custom",
          message: "La línea final no puede ser anterior a la línea inicial.",
          path: ["endLine"],
        });
      }
    }),
  z
    .object({
      type: z.literal("timestamp"),
      startSecond: z.number().min(0),
      endSecond: z.number().positive(),
    })
    .superRefine((locator, context) => {
      if (locator.endSecond <= locator.startSecond) {
        context.addIssue({
          code: "custom",
          message: "El segundo final debe ser posterior al segundo inicial.",
          path: ["endSecond"],
        });
      }
    }),
]);

const transcriptEvidenceSchema = z.object({
  id: evidenceIdSchema,
  kind: z.literal("transcript"),
  audioNumber: z.number().int().min(1).max(70),
  locator: transcriptLocatorSchema,
});

const officialEvidenceSchema = z
  .object({
    id: evidenceIdSchema,
    kind: z.literal("official"),
    title: z.string().trim().min(1),
    url: z.url().refine((url) => url.startsWith("https://"), {
      message: "La evidencia oficial debe usar HTTPS.",
    }),
    institution: z.string().trim().min(1),
    jurisdiction: z.string().trim().min(1),
    locator: z.string().trim().min(3),
    retrievedOn: z.iso.date(),
    verifiedOn: z.iso.date(),
  })
  .superRefine((evidence, context) => {
    if (evidence.verifiedOn < evidence.retrievedOn) {
      context.addIssue({
        code: "custom",
        message:
          "La fecha de verificación no puede ser anterior a la fecha de consulta.",
        path: ["verifiedOn"],
      });
    }
  });

export const evidenceSchema = z.discriminatedUnion("kind", [
  transcriptEvidenceSchema,
  officialEvidenceSchema,
]);
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

const traceableLearningJourneySchema = learningJourneySchema.safeExtend({
  openingPromptEvidenceIds: evidenceIdsSchema,
  quickChecks: z
    .array(
      z.object({
        prompt: z.string().trim().min(10),
        answer: z.string().trim().min(10),
        feedback: z.string().trim().min(20),
        evidenceIds: evidenceIdsSchema,
      }),
    )
    .min(2),
  practicalCase: z.object({
    facts: z.string().trim().min(30),
    question: z.string().trim().min(10),
    legalRule: z.string().trim().min(20),
    reasoning: z.string().trim().min(30),
    conclusion: z.string().trim().min(20),
    evidenceIds: evidenceIdsSchema,
  }),
  closingPromptEvidenceIds: evidenceIdsSchema,
  nextActivityEvidenceIds: evidenceIdsSchema,
});

const traceableQuestionSchema = questionSchema.safeExtend({
  evidenceIds: evidenceIdsSchema,
  optionEvidenceIds: z.array(evidenceIdsSchema).min(3).max(4),
  correctOptionEvidenceIds: evidenceIdsSchema,
  explanationEvidenceIds: evidenceIdsSchema,
  optionExplanationEvidenceIds: z.array(evidenceIdsSchema).min(3).max(4),
}).superRefine((question, context) => {
  for (const field of [
    "optionEvidenceIds",
    "optionExplanationEvidenceIds",
  ] as const) {
    if (question[field].length !== question.options.length) {
      context.addIssue({
        code: "custom",
        message: "Cada opción debe tener sus referencias de evidencia.",
        path: [field],
      });
    }
  }
});

const traceableTopicSchema = topicSchema.safeExtend({
  learningJourney: traceableLearningJourneySchema,
  materials: z.array(materialSchema.safeExtend({ evidenceIds: evidenceIdsSchema })).length(9),
  conceptMap: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    nodes: z
      .array(mapNodeSchema.safeExtend({ evidenceIds: evidenceIdsSchema }))
      .min(3),
  }),
  flashcards: z
    .array(
      z.object({
        question: z.string().trim().min(10),
        answer: z.string().trim().min(10),
        sourceOrigin,
        evidenceIds: evidenceIdsSchema,
      }),
    )
    .min(10)
    .max(15),
  exam: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    questions: z.array(traceableQuestionSchema).length(10),
  }),
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

const traceablePackageContent = packageContent.safeExtend({
  topics: z.array(traceableTopicSchema).min(1),
});

const transcriptSchema = z.object({
  original: z
    .string()
    .trim()
    .min(MIN_TRANSCRIPT_LENGTH)
    .max(MAX_TRANSCRIPT_LENGTH),
  cleaned: z
    .string()
    .trim()
    .min(MIN_TRANSCRIPT_LENGTH)
    .max(MAX_TRANSCRIPT_LENGTH),
});

const transcriptFileSchema = z
  .object({
    original: z
      .string()
      .trim()
      .min(MIN_TRANSCRIPT_LENGTH)
      .max(MAX_TRANSCRIPT_LENGTH)
      .optional(),
    originalFile: z.string().trim().min(1).optional(),
    originalFiles: z.array(z.string().trim().min(1)).min(2).max(10).optional(),
    cleaned: z
      .string()
      .trim()
      .min(MIN_TRANSCRIPT_LENGTH)
      .max(MAX_TRANSCRIPT_LENGTH)
      .optional(),
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

const traceablePackageSchema = traceablePackageContent
  .extend({
    packageVersion: z.literal("1.2"),
    curriculum: curriculumMetadataSchema,
    evidenceRegistry: z.array(evidenceSchema).min(1),
  })
  .superRefine((bundle, context) => {
    const evidenceById = new Map<string, number>();
    const usedEvidenceIds = new Set<string>();
    const curriculumAudioNumbers = new Set(
      bundle.curriculum.audioSources.map(({ audioNumber }) => audioNumber),
    );

    for (const [index, evidence] of bundle.evidenceRegistry.entries()) {
      const previousIndex = evidenceById.get(evidence.id);
      if (previousIndex !== undefined) {
        context.addIssue({
          code: "custom",
          message: `El ID de evidencia ${evidence.id} ya existe en evidenceRegistry[${previousIndex}].`,
          path: ["evidenceRegistry", index, "id"],
        });
      } else {
        evidenceById.set(evidence.id, index);
      }

      if (
        evidence.kind === "transcript" &&
        !curriculumAudioNumbers.has(evidence.audioNumber)
      ) {
        context.addIssue({
          code: "custom",
          message: `El Audio ${evidence.audioNumber} no está declarado en curriculum.audioSources.`,
          path: ["evidenceRegistry", index, "audioNumber"],
        });
      }
    }

    const checkEvidenceIds = (
      evidenceIds: string[],
      path: (string | number)[],
    ) => {
      for (const [index, evidenceId] of evidenceIds.entries()) {
        if (!evidenceById.has(evidenceId)) {
          context.addIssue({
            code: "custom",
            message: `La evidencia ${evidenceId} no existe en evidenceRegistry.`,
            path: [...path, index],
          });
        } else {
          usedEvidenceIds.add(evidenceId);
        }
      }
    };

    for (const [topicIndex, topic] of bundle.topics.entries()) {
      const topicPath = ["topics", topicIndex] as (string | number)[];
      checkEvidenceIds(topic.learningJourney.openingPromptEvidenceIds, [
        ...topicPath,
        "learningJourney",
        "openingPromptEvidenceIds",
      ]);
      topic.learningJourney.quickChecks.forEach((quickCheck, index) =>
        checkEvidenceIds(quickCheck.evidenceIds, [
          ...topicPath,
          "learningJourney",
          "quickChecks",
          index,
          "evidenceIds",
        ]),
      );
      checkEvidenceIds(topic.learningJourney.practicalCase.evidenceIds, [
        ...topicPath,
        "learningJourney",
        "practicalCase",
        "evidenceIds",
      ]);
      checkEvidenceIds(topic.learningJourney.closingPromptEvidenceIds, [
        ...topicPath,
        "learningJourney",
        "closingPromptEvidenceIds",
      ]);
      checkEvidenceIds(topic.learningJourney.nextActivityEvidenceIds, [
        ...topicPath,
        "learningJourney",
        "nextActivityEvidenceIds",
      ]);

      topic.materials.forEach((material, index) =>
        checkEvidenceIds(material.evidenceIds, [
          ...topicPath,
          "materials",
          index,
          "evidenceIds",
        ]),
      );
      topic.conceptMap.nodes.forEach((node, index) =>
        checkEvidenceIds(node.evidenceIds, [
          ...topicPath,
          "conceptMap",
          "nodes",
          index,
          "evidenceIds",
        ]),
      );
      topic.flashcards.forEach((flashcard, index) =>
        checkEvidenceIds(flashcard.evidenceIds, [
          ...topicPath,
          "flashcards",
          index,
          "evidenceIds",
        ]),
      );
      topic.exam.questions.forEach((question, questionIndex) => {
        const questionPath = [
          ...topicPath,
          "exam",
          "questions",
          questionIndex,
        ];
        checkEvidenceIds(question.evidenceIds, [
          ...questionPath,
          "evidenceIds",
        ]);
        question.optionEvidenceIds.forEach((ids, optionIndex) =>
          checkEvidenceIds(ids, [
            ...questionPath,
            "optionEvidenceIds",
            optionIndex,
          ]),
        );
        checkEvidenceIds(question.correctOptionEvidenceIds, [
          ...questionPath,
          "correctOptionEvidenceIds",
        ]);
        checkEvidenceIds(question.explanationEvidenceIds, [
          ...questionPath,
          "explanationEvidenceIds",
        ]);
        question.optionExplanationEvidenceIds.forEach((ids, optionIndex) =>
          checkEvidenceIds(ids, [
            ...questionPath,
            "optionExplanationEvidenceIds",
            optionIndex,
          ]),
        );
      });
    }

    bundle.evidenceRegistry.forEach((evidence, index) => {
      if (!usedEvidenceIds.has(evidence.id)) {
        context.addIssue({
          code: "custom",
          message: `La evidencia ${evidence.id} no está vinculada con ningún artefacto publicable.`,
          path: ["evidenceRegistry", index, "id"],
        });
      }
    });
  });

export const classPackageSchema = z.discriminatedUnion("packageVersion", [
  legacyPackageSchema.extend({ transcript: transcriptSchema }),
  currentPackageSchema.extend({ transcript: transcriptSchema }),
  traceablePackageSchema.safeExtend({ transcript: transcriptSchema }),
]);

export const classPackageFileSchema = z.discriminatedUnion("packageVersion", [
  legacyPackageSchema.extend({ transcript: transcriptFileSchema }),
  currentPackageSchema.extend({ transcript: transcriptFileSchema }),
  traceablePackageSchema.safeExtend({ transcript: transcriptFileSchema }),
]);

export const importableClassPackageSchema = traceablePackageSchema.safeExtend({
  transcript: z.object({
    original: z
      .string()
      .trim()
      .min(MIN_TRANSCRIPT_LENGTH)
      .max(MAX_TRANSCRIPT_LENGTH),
    cleaned: z
      .string()
      .trim()
      .min(MIN_TRANSCRIPT_LENGTH)
      .max(MAX_TRANSCRIPT_LENGTH),
  }),
});

export type ClassPackage = z.infer<typeof classPackageSchema>;
export type ImportableClassPackage = z.infer<
  typeof importableClassPackageSchema
>;

export type EditorialGateAssessment = {
  traceable: boolean;
  publishable: boolean;
  issues: Array<{ path: string; message: string }>;
};

export function assessEditorialGate(
  bundle: { packageVersion: "1.0" | "1.1" | "1.2" },
): EditorialGateAssessment {
  if (bundle.packageVersion === "1.2") {
    return { traceable: true, publishable: true, issues: [] };
  }

  return {
    traceable: false,
    publishable: false,
    issues: [
      {
        path: "packageVersion",
        message: `El contrato ${bundle.packageVersion} se conserva para lectura, pero no identifica la evidencia de cada artefacto publicable. Migra el paquete a 1.2 después de una revisión editorial verificable.`,
      },
    ],
  };
}

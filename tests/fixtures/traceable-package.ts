import type { ImportableClassPackage } from "../../lib/content/package-schema";

const evidenceIds = ["ev-transcript-synthetic", "ev-official-synthetic"];
const materialTypes = [
  "short_answer",
  "full_explanation",
  "legal_basis",
  "simple_example",
  "ceneval_example",
  "summary",
  "study_guide",
  "key_concepts",
  "common_errors",
] as const;

export function createSyntheticTraceablePackage(): ImportableClassPackage {
  return {
    packageVersion: "1.2",
    curriculum: {
      code: "C41",
      order: 41,
      audioSources: [{ audioNumber: 54, fragment: "fragmento sintético" }],
    },
    subject: {
      name: "Materia sintética",
      description: "Contenido exclusivo de pruebas automatizadas.",
    },
    class: {
      title: "Clase sintética de persistencia",
      date: "2026-08-21",
      teacher: "Docente sintético",
      description:
        "Fixture artificial para probar persistencia sin afirmar contenido jurídico.",
    },
    transcript: {
      original:
        "Transcripción completamente sintética para verificar el contrato técnico.",
      cleaned:
        "Versión limpia completamente sintética para verificar el contrato técnico.",
    },
    evidenceRegistry: [
      {
        id: "ev-transcript-synthetic",
        kind: "transcript",
        audioNumber: 54,
        locator: { type: "line_range", startLine: 1, endLine: 2 },
      },
      {
        id: "ev-official-synthetic",
        kind: "official",
        title: "Documento oficial sintético",
        url: "https://example.gob.mx/documento-sintetico",
        institution: "Institución sintética",
        jurisdiction: "México",
        locator: "Artículo sintético 1",
        retrievedOn: "2026-08-20",
        verifiedOn: "2026-08-21",
      },
    ],
    topics: [
      {
        title: "Tema sintético",
        description:
          "Tema artificial que existe únicamente para las pruebas de persistencia.",
        learningJourney: {
          openingPrompt:
            "¿Cómo analizarías este supuesto enteramente sintético de prueba?",
          openingPromptEvidenceIds: evidenceIds,
          quickChecks: [1, 2].map((index) => ({
            prompt: `Pregunta sintética de comprobación número ${index}`,
            answer: `Respuesta sintética de comprobación número ${index}`,
            feedback:
              "Retroalimentación artificial suficientemente extensa para validar.",
            evidenceIds,
          })),
          practicalCase: {
            facts:
              "Hechos artificiales suficientemente extensos para una prueba técnica aislada.",
            question: "¿Cuál sería la respuesta sintética?",
            legalRule:
              "Regla artificial que no representa ninguna afirmación jurídica real.",
            reasoning:
              "Razonamiento artificial suficientemente extenso para validar el contrato.",
            conclusion:
              "Conclusión artificial sin valor jurídico ni académico.",
            evidenceIds,
          },
          closingPrompt:
            "Explica nuevamente el resultado usando solo el supuesto sintético.",
          closingPromptEvidenceIds: evidenceIds,
          nextActivity: "Continuar con otra prueba sintética.",
          nextActivityEvidenceIds: evidenceIds,
        },
        materials: materialTypes.map((type, index) => ({
          type,
          title: `Material sintético ${index + 1}`,
          content:
            "Contenido artificial suficientemente largo para validar persistencia sin afirmaciones jurídicas.",
          sourceOrigin: "mixed" as const,
          evidenceIds,
        })),
        conceptMap: {
          title: "Mapa sintético",
          description: "Mapa artificial para una prueba técnica.",
          nodes: [
            {
              id: "root",
              label: "Raíz sintética",
              description: "Nodo raíz artificial",
              evidenceIds,
            },
            {
              id: "branch-a",
              label: "Rama sintética A",
              parentId: "root",
              evidenceIds,
            },
            {
              id: "branch-b",
              label: "Rama sintética B",
              parentId: "root",
              evidenceIds,
            },
          ],
        },
        references: [
          {
            title: "Referencia sintética",
            url: "https://example.gob.mx/referencia-sintetica",
            institution: "Institución sintética",
            jurisdiction: "México",
            citation: "Referencia artificial",
            retrievedOn: "2026-08-20",
            note: "No contiene información jurídica real.",
          },
        ],
        flashcards: Array.from({ length: 10 }, (_, index) => ({
          question: `Pregunta sintética de tarjeta número ${index + 1}`,
          answer: `Respuesta sintética de tarjeta número ${index + 1}`,
          sourceOrigin: "mixed" as const,
          evidenceIds,
        })),
        exam: {
          title: "Examen sintético",
          description: "Examen artificial para validar persistencia.",
          questions: Array.from({ length: 10 }, (_, index) => ({
            text: `Pregunta sintética de examen número ${index + 1} con longitud válida`,
            difficulty: "intermediate" as const,
            options: ["Opción sintética A", "Opción sintética B", "Opción sintética C"],
            correctOption: 1,
            explanation:
              "Explicación general artificial suficientemente extensa para la prueba.",
            optionExplanations: [
              "Explicación sintética de la opción A",
              "Explicación sintética de la opción B",
              "Explicación sintética de la opción C",
            ],
            evidenceIds,
            optionEvidenceIds: [evidenceIds, evidenceIds, evidenceIds],
            correctOptionEvidenceIds: evidenceIds,
            explanationEvidenceIds: evidenceIds,
            optionExplanationEvidenceIds: [evidenceIds, evidenceIds, evidenceIds],
          })),
        },
      },
    ],
  };
}

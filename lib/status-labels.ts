import type {
  PublicationStatus,
  StudyMaterial,
  Topic,
} from "@/lib/data/academic";

export const publicationStatusLabels: Record<PublicationStatus, string> = {
  draft: "Borrador",
  review: "En revisión",
  published: "Publicada",
  withdrawn: "Retirada",
};

export const publicationStatusPluralLabels: Record<
  PublicationStatus,
  string
> = {
  draft: "Borradores",
  review: "En revisión",
  published: "Publicadas",
  withdrawn: "Retiradas",
};

export const publicationStatusActionLabels: Record<
  PublicationStatus,
  string
> = {
  draft: "Volver a borrador",
  review: "Enviar a revisión",
  published: "Publicar clase",
  withdrawn: "Retirar clase",
};

export const topicApprovalStatusLabels: Record<
  Topic["approvalStatus"],
  string
> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export const materialTypeLabels: Record<StudyMaterial["materialType"], string> = {
  short_answer: "Respuesta corta",
  full_explanation: "Explicación completa",
  legal_basis: "Fundamento legal",
  simple_example: "Ejemplo simple",
  ceneval_example: "Ejemplo tipo CENEVAL",
  summary: "Resumen",
  study_guide: "Guía de estudio",
  key_concepts: "Conceptos clave",
  common_errors: "Errores comunes",
};

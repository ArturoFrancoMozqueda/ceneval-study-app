import type { PublicationStatus, Topic } from "@/lib/data/academic";

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

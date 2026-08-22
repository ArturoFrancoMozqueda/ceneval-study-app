import { relationRows } from "@/lib/data/relation-rows";

export type AdminCatalogPublicationStatus =
  "draft" | "review" | "published" | "withdrawn";

export type AdminCatalogClassRow = {
  id: number;
  title: string;
  publication_status: AdminCatalogPublicationStatus;
  published_at: string | null;
  created_at: string;
  topics?: Array<{ id: number }> | { id: number } | null;
};

export type AdminCatalogRow = {
  id: number;
  name: string;
  classes?: Array<AdminCatalogClassRow> | AdminCatalogClassRow | null;
};

export type AdminCatalogClass = {
  id: number;
  title: string;
  topicCount: number;
  publicationStatus: AdminCatalogPublicationStatus;
};

export type AdminCatalogGroup = {
  subject: {
    id: number;
    name: string;
    classCount: number;
    topicCount: number;
  };
  classes: AdminCatalogClass[];
};

export function deriveAdminCatalog(
  rows: ReadonlyArray<AdminCatalogRow>,
): AdminCatalogGroup[] {
  return rows.map((row) => {
    const classRows = relationRows(row.classes);
    let topicCount = 0;
    const classes = classRows.map((classRow) => {
      const classTopicCount = relationRows(classRow.topics).length;
      topicCount += classTopicCount;
      return {
        id: classRow.id,
        title: classRow.title,
        topicCount: classTopicCount,
        publicationStatus: classRow.publication_status,
      };
    });
    return {
      subject: {
        id: row.id,
        name: row.name,
        classCount: classes.length,
        topicCount,
      },
      classes,
    };
  });
}

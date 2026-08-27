export const glossaryCategories = [
  "Examen",
  "Institución",
  "Ordenamiento",
  "Procedimiento",
  "Fiscal",
] as const;

export type GlossaryCategory = (typeof glossaryCategories)[number];

export type GlossaryEntry = {
  abbreviation: string;
  meaning: string;
  category: GlossaryCategory;
};

/**
 * Catálogo editorial de siglas que aparecen en los paquetes de estudio.
 * Los significados desarrollan el nombre; no sustituyen la explicación
 * jurídica del tema ni afirman que una norma esté vigente.
 */
export const glossaryEntries: readonly GlossaryEntry[] = [
  { abbreviation: "APF", meaning: "Administración Pública Federal", category: "Institución" },
  { abbreviation: "CCT", meaning: "Contrato colectivo de trabajo", category: "Procedimiento" },
  { abbreviation: "CENEVAL", meaning: "Centro Nacional de Evaluación para la Educación Superior, A.C.", category: "Examen" },
  { abbreviation: "CFDI", meaning: "Comprobante Fiscal Digital por Internet", category: "Fiscal" },
  { abbreviation: "CFF", meaning: "Código Fiscal de la Federación", category: "Ordenamiento" },
  { abbreviation: "CNDH", meaning: "Comisión Nacional de los Derechos Humanos", category: "Institución" },
  { abbreviation: "CNPCF", meaning: "Código Nacional de Procedimientos Civiles y Familiares", category: "Ordenamiento" },
  { abbreviation: "CNPP", meaning: "Código Nacional de Procedimientos Penales", category: "Ordenamiento" },
  { abbreviation: "CONDUSEF", meaning: "Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios Financieros", category: "Institución" },
  { abbreviation: "CPEUM", meaning: "Constitución Política de los Estados Unidos Mexicanos", category: "Ordenamiento" },
  { abbreviation: "DOF", meaning: "Diario Oficial de la Federación", category: "Institución" },
  { abbreviation: "EGEL", meaning: "Examen General para el Egreso de la Licenciatura", category: "Examen" },
  { abbreviation: "FGR", meaning: "Fiscalía General de la República", category: "Institución" },
  { abbreviation: "IEPS", meaning: "Impuesto Especial sobre Producción y Servicios", category: "Fiscal" },
  { abbreviation: "IMPI", meaning: "Instituto Mexicano de la Propiedad Industrial", category: "Institución" },
  { abbreviation: "INDAUTOR", meaning: "Instituto Nacional del Derecho de Autor", category: "Institución" },
  { abbreviation: "INE", meaning: "Instituto Nacional Electoral", category: "Institución" },
  { abbreviation: "ISR", meaning: "Impuesto sobre la Renta", category: "Fiscal" },
  { abbreviation: "IVA", meaning: "Impuesto al Valor Agregado", category: "Fiscal" },
  { abbreviation: "JDC", meaning: "Juicio para la protección de los derechos político-electorales del ciudadano", category: "Procedimiento" },
  { abbreviation: "JRC", meaning: "Juicio de revisión constitucional electoral", category: "Procedimiento" },
  { abbreviation: "LFDA", meaning: "Ley Federal del Derecho de Autor", category: "Ordenamiento" },
  { abbreviation: "LFEP", meaning: "Ley Federal de las Entidades Paraestatales", category: "Ordenamiento" },
  { abbreviation: "LFPCA", meaning: "Ley Federal de Procedimiento Contencioso Administrativo", category: "Ordenamiento" },
  { abbreviation: "LFPPI", meaning: "Ley Federal de Protección a la Propiedad Industrial", category: "Ordenamiento" },
  { abbreviation: "LFT", meaning: "Ley Federal del Trabajo", category: "Ordenamiento" },
  { abbreviation: "LGSM", meaning: "Ley General de Sociedades Mercantiles", category: "Ordenamiento" },
  { abbreviation: "LGSMIME", meaning: "Ley General del Sistema de Medios de Impugnación en Materia Electoral", category: "Ordenamiento" },
  { abbreviation: "LGTOC", meaning: "Ley General de Títulos y Operaciones de Crédito", category: "Ordenamiento" },
  { abbreviation: "LOAPF", meaning: "Ley Orgánica de la Administración Pública Federal", category: "Ordenamiento" },
  { abbreviation: "MASC", meaning: "Mecanismos alternativos de solución de controversias", category: "Procedimiento" },
  { abbreviation: "MP", meaning: "Ministerio Público", category: "Institución" },
  { abbreviation: "NOM", meaning: "Norma Oficial Mexicana", category: "Ordenamiento" },
  { abbreviation: "OIT", meaning: "Organización Internacional del Trabajo", category: "Institución" },
  { abbreviation: "OPLE", meaning: "Organismo Público Local Electoral", category: "Institución" },
  { abbreviation: "PROFECO", meaning: "Procuraduría Federal del Consumidor", category: "Institución" },
  { abbreviation: "PTU", meaning: "Participación de los trabajadores en las utilidades", category: "Fiscal" },
  { abbreviation: "RESICO", meaning: "Régimen Simplificado de Confianza", category: "Fiscal" },
  { abbreviation: "RFC", meaning: "Registro Federal de Contribuyentes", category: "Fiscal" },
  { abbreviation: "RMF", meaning: "Resolución Miscelánea Fiscal", category: "Fiscal" },
  { abbreviation: "SAS", meaning: "Sociedad por Acciones Simplificada", category: "Procedimiento" },
  { abbreviation: "SAT", meaning: "Servicio de Administración Tributaria", category: "Institución" },
  { abbreviation: "SCJN", meaning: "Suprema Corte de Justicia de la Nación", category: "Institución" },
  { abbreviation: "TEPJF", meaning: "Tribunal Electoral del Poder Judicial de la Federación", category: "Institución" },
  { abbreviation: "TFJA", meaning: "Tribunal Federal de Justicia Administrativa", category: "Institución" },
  { abbreviation: "UMA", meaning: "Unidad de Medida y Actualización", category: "Fiscal" },
] as const;

export function normalizeGlossaryQuery(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-MX");
}

export function filterGlossaryEntries(
  entries: readonly GlossaryEntry[],
  query: string,
) {
  const normalizedQuery = normalizeGlossaryQuery(query);
  if (!normalizedQuery) return entries;

  return entries.filter((entry) =>
    normalizeGlossaryQuery(
      `${entry.abbreviation} ${entry.meaning} ${entry.category}`,
    ).includes(normalizedQuery),
  );
}

export type EditorialOnboarding = {
  actionHref: string;
  actionLabel: string;
  description: string;
  emptyListDescription: string;
  title: string;
};

export function deriveEditorialOnboarding(
  subjects: ReadonlyArray<{ id: number; name: string }>,
): EditorialOnboarding {
  const firstSubject = subjects[0];

  if (firstSubject) {
    return {
      actionHref: `/materias/${firstSubject.id}/clases/nueva`,
      actionLabel: "Agregar la primera clase",
      description: `Agrega la primera clase preparada a ${firstSubject.name}. Permanecerá como borrador hasta que su contenido y evidencia estén completos y aprobados.`,
      emptyListDescription:
        "Aún no hay clases para revisar. Agrega la primera a una materia existente para iniciar el borrador editorial.",
      title: "Agrega la primera clase editorial",
    };
  }

  return {
    actionHref: "/materias/nueva",
    actionLabel: "Crear la primera materia",
    description:
      "Primero crea la materia. Después agrega la clase preparada por el equipo editorial; permanecerá como borrador hasta que su contenido y evidencia estén completos y aprobados.",
    emptyListDescription:
      "Aún no hay clases para revisar. Crea la primera materia para iniciar la estructura editorial.",
    title: "Crea la estructura de la primera clase",
  };
}

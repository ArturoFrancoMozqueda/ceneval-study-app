export const MIN_TRANSCRIPT_LENGTH = 30;
export const MAX_TRANSCRIPT_LENGTH = 200_000;

const numberFormatter = new Intl.NumberFormat("es-MX");

export function getTranscriptValidationError(text: string): string | null {
  const length = text.trim().length;

  if (length < MIN_TRANSCRIPT_LENGTH) {
    return `Pega una transcripción de al menos ${MIN_TRANSCRIPT_LENGTH} caracteres.`;
  }

  if (length > MAX_TRANSCRIPT_LENGTH) {
    const excess = length - MAX_TRANSCRIPT_LENGTH;
    return `La transcripción tiene ${numberFormatter.format(length)} caracteres. Reduce al menos ${numberFormatter.format(excess)} antes de guardar; revisa si pegaste contenido duplicado. El texto no se modificó.`;
  }

  return null;
}

export function getNextTabIndex(
  currentIndex: number,
  key: string,
  tabCount: number,
): number | null {
  if (tabCount < 1) return null;

  if (key === "ArrowRight") return (currentIndex + 1) % tabCount;
  if (key === "ArrowLeft") return (currentIndex - 1 + tabCount) % tabCount;
  if (key === "Home") return 0;
  if (key === "End") return tabCount - 1;

  return null;
}

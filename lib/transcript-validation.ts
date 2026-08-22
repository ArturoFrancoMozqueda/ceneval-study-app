export const MIN_TRANSCRIPT_LENGTH = 30;
export const MAX_TRANSCRIPT_LENGTH = 200_000;

const numberFormatter = new Intl.NumberFormat("es-MX");

export function getTranscriptValidationError(text: string): string | null {
  const length = text.trim().length;

  if (length < MIN_TRANSCRIPT_LENGTH) {
    return `La fuente editorial local debe contener al menos ${MIN_TRANSCRIPT_LENGTH} caracteres.`;
  }

  if (length > MAX_TRANSCRIPT_LENGTH) {
    const excess = length - MAX_TRANSCRIPT_LENGTH;
    return `La fuente editorial local tiene ${numberFormatter.format(length)} caracteres. Reduce al menos ${numberFormatter.format(excess)} en el archivo privado antes de validarlo; revisa si contiene texto duplicado. El archivo no se modificó.`;
  }

  return null;
}

import type { ReactNode } from "react";

/**
 * Compatibilidad temporal para los bloques de estudio existentes.
 *
 * La protección visual ya no se monta por bloque: `PrivacyCurtain` se monta
 * una sola vez en el layout autenticado. Mantener este envoltorio inerte evita
 * mezclar el cambio de privacidad con la experiencia de estudio.
 */
export function ContentShield({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

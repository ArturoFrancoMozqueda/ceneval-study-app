import type { Metadata } from "next";
import { HomeDashboard } from "@/components/home-dashboard";
import { MarketingLanding } from "@/components/marketing-landing";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Inicio",
};

export default async function HomePage() {
  const user = await getCurrentUser();

  // Sin sesión, la raíz es la página pública de marketing (P-1 del plan de
  // venta): explica qué es Sube Legal, para quién es y qué incluye. Con
  // sesión, sigue siendo el panel de estudio de siempre.
  if (!user) {
    return <MarketingLanding />;
  }

  return <HomeDashboard />;
}

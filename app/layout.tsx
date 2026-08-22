import type { Metadata } from "next";
import { Anton, Montserrat } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Sube Legal",
    template: "%s | Sube Legal",
  },
  description:
    "Prepárate para el examen CENEVAL EGEL de Derecho con clases editoriales revisadas, práctica guiada y fuentes verificables. Sube Legal no está afiliado a CENEVAL.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${anton.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}

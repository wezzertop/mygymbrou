import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "MiGymBrou — Plataforma SaaS para Coaches y Alumnos Fitness",
  description:
    "Gestiona alumnos, evaluaciones antropométricas, rutinas guiadas, planes nutricionales, citas y suscripciones desde una experiencia Mobile-First de alto rendimiento.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#0b1120] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

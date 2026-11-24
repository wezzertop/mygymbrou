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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MiGymBrou",
  },
};

export const viewport: Viewport = {
  themeColor: "#060607",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#060607] text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

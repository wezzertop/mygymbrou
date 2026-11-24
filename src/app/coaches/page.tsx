import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { CoachDirectoryView } from "@/components/CoachDirectoryView";
import { LandingHeaderAuth } from "@/components/LandingAuthControls";

export default function PublicCoachesDirectoryPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#060607] text-zinc-100">
      {/* Same Sleek Editorial Navbar as Landing Page */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060607]/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 transition hover:opacity-90"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
                <Dumbbell className="h-4 w-4 stroke-[2.25]" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
                MiGym<span className="text-emerald-400">Brou</span>
              </span>
            </Link>
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Inicio
            </Link>
          </div>

          <LandingHeaderAuth />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <CoachDirectoryView mode="public" />
      </main>

      <footer className="border-t border-white/[0.06] bg-[#060607] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <span>MiGymBrou · Directorio de Coaches Certificados</span>
          <div className="flex items-center gap-5">
            <Link href="/terminos" className="transition hover:text-zinc-200">
              Términos y Condiciones
            </Link>
            <Link href="/privacidad" className="transition hover:text-zinc-200">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

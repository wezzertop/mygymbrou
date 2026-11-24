import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { CoachDirectoryView } from "@/components/CoachDirectoryView";

export default function PublicCoachesDirectoryPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#060607] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#060607]/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-zinc-950 shadow-lg shadow-none">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                MiGym<span className="text-cyan-400">Brou</span>
              </span>
            </Link>
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/auth?role=student"
              className="rounded-xl border border-white/15 bg-[#0e0f12] px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:border-emerald-500/50 hover:bg-white/[0.06]"
            >
              Soy Alumno
            </Link>
            <Link
              href="/auth/register-coach"
              className="rounded-xl bg-white hover:bg-zinc-200 px-3.5 py-2 text-xs font-bold text-zinc-950 transition "
            >
              Soy Coach
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <CoachDirectoryView mode="public" />
      </main>
    </div>
  );
}

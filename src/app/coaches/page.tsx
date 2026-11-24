import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { CoachDirectoryView } from "@/components/CoachDirectoryView";

export default function PublicCoachesDirectoryPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#0b1120] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b1120]/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                MiGym<span className="text-cyan-400">Brou</span>
              </span>
            </Link>
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/auth?role=student"
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/50 hover:bg-slate-800"
            >
              Soy Alumno
            </Link>
            <Link
              href="/auth/register-coach"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:brightness-110"
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

import Link from "next/link";
import { ArrowLeft, Dumbbell, FileText, ShieldCheck } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#060607] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060607]/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Dumbbell className="h-4 w-4 stroke-[2.25]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              MiGym<span className="text-emerald-400">Brou</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Marco Legal · MiGymBrou
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Términos, Condiciones y Privacidad
          </h1>
          <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
            Última actualización: 2026 · Aplicable para Coaches, Estudios y Alumnos.
          </p>
        </div>

        {/* Términos y Condiciones */}
        <section
          id="terminos"
          className="space-y-5 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">
              1. Términos y Condiciones de Uso
            </h2>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-zinc-300 sm:text-sm">
            <div>
              <h3 className="font-semibold text-white">1.1 Naturaleza de la Plataforma</h3>
              <p className="mt-1 text-zinc-400">
                MiGymBrou es una plataforma tecnológica SaaS que conecta a entrenadores
                personales (Coaches) con sus alumnos para gestionar rutinas, planes de
                nutrición, evaluaciones antropométricas, citas y suscripciones. MiGymBrou
                no presta servicios médicos ni sustituye la asesoría de profesionales de
                la salud.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">1.2 Responsabilidad Profesional</h3>
              <p className="mt-1 text-zinc-400">
                Cada Coach es responsable de la veracidad de sus certificaciones, diplomas
                y prescripciones de entrenamiento o nutrición. Cada Alumno reconoce que
                realiza actividad física bajo su propia responsabilidad y debe consultar
                a un médico ante cualquier lesión o condición preexistente.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">1.3 Planes, Cupos y Publicidad</h3>
              <p className="mt-1 text-zinc-400">
                El plan Inicio / Free incluye hasta 5 alumnos activos con funciones
                básicas y puede mostrar espacios publicitarios discretos. Al contratar
                cualquier plan de pago en Pesos Mexicanos (Coach Base, Coach Pro o
                Estudio / Gym, con IVA incluido), la publicidad se elimina por completo
                tanto para el Coach como para todos sus Alumnos vinculados.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">1.4 Moderación y Sanciones</h3>
              <p className="mt-1 text-zinc-400">
                El equipo de administración podrá emitir advertencias, suspensiones
                temporales o cancelaciones definitivas de cuentas que incumplan las
                normas de respeto, suplanten identidad o presenten documentación falsa.
              </p>
            </div>
          </div>
        </section>

        {/* Política de Privacidad */}
        <section
          id="privacidad"
          className="space-y-5 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">
              2. Política de Privacidad y Protección de Datos
            </h2>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-zinc-300 sm:text-sm">
            <div>
              <h3 className="font-semibold text-white">2.1 Datos Recopilados</h3>
              <p className="mt-1 text-zinc-400">
                Recopilamos únicamente la información necesaria para operar tu cuenta:
                nombre, correo electrónico, género (para guías anatómicas y portadas),
                metas físicas, registros de entrenamiento, mediciones corporales y, de
                manera opcional, documentos de verificación de identidad y diplomas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">2.2 Seguridad y Aislamiento (RLS)</h3>
              <p className="mt-1 text-zinc-400">
                Todos los datos se protegen con políticas estrictas de seguridad a nivel
                de fila (Row Level Security) en Supabase. Tus mediciones, rutinas y fotos
                privadas solo son visibles para ti y tu Coach asignado.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">2.3 Derechos del Usuario</h3>
              <p className="mt-1 text-zinc-400">
                Puedes actualizar tus datos personales en cualquier momento desde tu
                perfil o solicitar la eliminación definitiva de tu cuenta y registros
                contactando al equipo de soporte de MiGymBrou.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

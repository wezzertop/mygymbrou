import Link from "next/link";
import {
  ArrowLeft,
  Dumbbell,
  FileText,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones | MiGymBrou",
  description:
    "Términos y Condiciones de uso de la plataforma SaaS MiGymBrou para Coaches, Estudios y Alumnos en México.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#060607] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060607]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Dumbbell className="h-4 w-4 stroke-[2.25]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              MiGym<span className="text-emerald-400">Brou</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/privacidad"
              className="inline-flex h-9 items-center rounded-full border border-white/10 px-3.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
            >
              Aviso de Privacidad
            </Link>
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Marco Legal · México (PROFECO)
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-xs text-zinc-400 sm:text-sm">
            Última actualización: 2026 · Aplicable a Coaches, Estudios/Gimnasios y
            Alumnos usuarios de MiGymBrou en los Estados Unidos Mexicanos.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-xs leading-relaxed text-zinc-300 sm:text-sm">
          Al crear una cuenta, activar una invitación o utilizar cualquier módulo de{" "}
          <strong className="text-white">MiGymBrou</strong>, aceptas íntegramente los
          presentes Términos y Condiciones y nuestro{" "}
          <Link href="/privacidad" className="font-semibold text-emerald-400 underline">
            Aviso de Privacidad Integral (LFPDPPP)
          </Link>
          .
        </div>

        {/* 1. Naturaleza SaaS */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              1. Naturaleza de la Plataforma (Intermediación Tecnológica SaaS)
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>
              <strong className="text-zinc-200">MiGymBrou</strong> es una herramienta
              digital de software como servicio (SaaS) diseñada para la administración
              de rutinas de entrenamiento, seguimiento nutricional, agenda de citas,
              registro antropométrico y control de avances físicos.
            </p>
            <p>
              La relación comercial y el pago de la suscripción de uso de la plataforma
              se celebran exclusivamente con el{" "}
              <strong className="text-zinc-200">Coach o Estudio</strong>. El{" "}
              <strong className="text-zinc-200">Alumno</strong> accede a la aplicación de
              forma completamente gratuita como herramienta de apoyo y visualización de su
              progreso mediante invitación o vinculación directa con su entrenador.
            </p>
            <p>
              Los planes de suscripción para Coaches se expresan en{" "}
              <strong className="text-zinc-200">
                Pesos Mexicanos (MXN) con IVA incluido
              </strong>
              . El plan <em>Inicio / Free</em> (hasta 5 alumnos activos) incluye espacios
              publicitarios discretos en la app; los planes de pago (<em>Coach Base</em>,{" "}
              <em>Coach Pro</em> y <em>Estudio / Gym</em>) ofrecen experiencia{" "}
              <strong className="text-emerald-400">0% publicidad</strong> para el Coach y
              sus alumnos vinculados.
            </p>
          </div>
        </section>

        {/* 2. Independencia del Convenio */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              2. Independencia del Convenio entre Coach y Alumno
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>
              El directorio público <em>&ldquo;Buscar Coach&rdquo;</em> opera únicamente
              como vitrina informativa y canal inicial de contacto entre entrenadores
              independientes y personas interesadas en asesoría física.
            </p>
            <p>
              Todo acuerdo comercial, tarifa de asesoría, forma de pago externa,
              reembolso, calendario de sesiones presenciales u online y compromiso de
              resultados se pacta{" "}
              <strong className="text-zinc-200">
                directamente entre el Alumno y el Coach
              </strong>
              . <strong className="text-zinc-200">MiGymBrou</strong> no es parte de dicho
              contrato, no presta servicios de entrenamiento ni es responsable por cobros,
              incumplimientos o acuerdos realizados fuera de la plataforma.
            </p>
          </div>
        </section>

        {/* 3. Titularidad vs Vinculación */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <UserCheck className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              3. Titularidad de Cuenta vs. Vinculación Activa
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>
              El <strong className="text-zinc-200">Alumno</strong> es titular de su
              cuenta personal y conserva el acceso a su historial registrado de evolución
              (medidas, evaluaciones y sesiones pasadas) incluso cuando concluye un
              asesoramiento.
            </p>
            <p>
              No obstante, la recepción continua de nuevas rutinas, actualizaciones
              nutricionales, citas y seguimiento activo depende de mantener una{" "}
              <strong className="text-zinc-200">vinculación vigente</strong> con un Coach
              cuya suscripción en MiGymBrou se encuentre activa. Cuando un Coach finaliza
              el asesoramiento de un alumno, se libera dicho cupo en su panel y el alumno
              conserva su historial como respaldo personal.
            </p>
          </div>
        </section>

        {/* 4. Deslinde Médico */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              4. Deslinde de Responsabilidad Física y Médica
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>
              Las rutinas de ejercicio, cargas de trabajo, planes alimenticios y
              recomendaciones registradas en MiGymBrou son diseñadas bajo el criterio
              profesional exclusivo de cada Coach.
            </p>
            <p>
              <strong className="text-zinc-200">
                MiGymBrou no brinda servicios médicos, clínicos ni nutricionales directos
              </strong>{" "}
              y no sustituye la valoración de un médico especialista. Cada usuario declara
              contar con aptitud física adecuada y asume la responsabilidad de consultar a
              un profesional de la salud antes de iniciar cualquier programa de
              entrenamiento o dieta, especialmente ante lesiones, embarazo o padecimientos
              previos.
            </p>
          </div>
        </section>

        {/* 5. Propiedad Intelectual y Sanciones */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              5. Propiedad Intelectual, Uso Aceptable y Sanciones
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>
              La marca <strong className="text-zinc-200">MiGymBrou</strong>, su diseño,
              código fuente, interfaz y contenidos propios son propiedad intelectual
              protegida. Queda prohibida su reproducción, ingeniería inversa o uso no
              autorizado.
            </p>
            <p>
              Los Coaches garantizan la autenticidad y vigencia de los diplomas,
              certificaciones y documentos de identidad que suban a su perfil. La
              administración de MiGymBrou se reserva la facultad de emitir advertencias,
              suspender temporalmente o cancelar de forma definitiva cualquier cuenta ante
              fraude, suplantación de identidad, documentación apócrifa, conducta abusiva
              o incumplimiento de estos términos.
            </p>
            <p>
              Para dudas, aclaraciones o reportes de cumplimiento conforme a la Ley
              Federal de Protección al Consumidor (PROFECO), contáctanos en{" "}
              <a
                href="mailto:soporte@migymbrou.com"
                className="font-medium text-emerald-400 hover:underline"
              >
                soporte@migymbrou.com
              </a>
              .
            </p>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-zinc-500">
          <Link href="/privacidad" className="text-emerald-400 hover:underline">
            Consultar Aviso de Privacidad (LFPDPPP) →
          </Link>
          <Link href="/auth" className="hover:text-zinc-300">
            Ir a Iniciar sesión
          </Link>
        </div>
      </main>
    </div>
  );
}

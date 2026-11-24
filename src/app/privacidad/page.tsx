import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Dumbbell,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Aviso de Privacidad Integral (LFPDPPP) | MiGymBrou",
  description:
    "Aviso de Privacidad Integral de MiGymBrou conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) en México.",
};

export default function PrivacidadPage() {
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
              href="/terminos"
              className="inline-flex h-9 items-center rounded-full border border-white/10 px-3.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
            >
              Términos y Condiciones
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
            LFPDPPP · México
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Aviso de Privacidad Integral
          </h1>
          <p className="text-xs text-zinc-400 sm:text-sm">
            Emitido en cumplimiento con la Ley Federal de Protección de Datos Personales
            en Posesión de los Particulares (LFPDPPP) y su Reglamento.
          </p>
        </div>

        {/* 1. Datos recabados */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              1. Datos Personales que Recabamos
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>
              Para operar correctamente la plataforma{" "}
              <strong className="text-zinc-200">MiGymBrou</strong>, recabamos únicamente
              los datos necesarios según tu tipo de cuenta:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-zinc-200">Identificación y contacto:</strong>{" "}
                nombre completo, correo electrónico, teléfono opcional, fotografía de
                perfil y género (para personalizar guías visuales anatómicas y portadas).
              </li>
              <li>
                <strong className="text-zinc-200">
                  Perfil profesional del Coach:
                </strong>{" "}
                nombre comercial/estudio, especialidad, ciudad, años de experiencia,
                paquetes de referencia, certificaciones/diplomas y documentos opcionales
                para verificación de identidad.
              </li>
              <li>
                <strong className="text-zinc-200">
                  Datos sensibles de seguimiento físico y antropométrico del Alumno:
                </strong>{" "}
                peso corporal, estatura, porcentaje de grasa, masa muscular, circunferencias
                corporales, fotografías de progreso físico, objetivos, lesiones o
                limitaciones declaradas, rutinas completadas y registros nutricionales
                (macros y comidas).
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Finalidades */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              2. Finalidades del Tratamiento
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>Tus datos personales se utilizan exclusivamente para:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Crear, autenticar y administrar tu cuenta de Coach o Alumno dentro de
                MiGymBrou.
              </li>
              <li>
                Establecer y gestionar la vinculación Coach–Alumno, incluyendo asignación
                de rutinas, planes nutricionales, agenda de citas y alertas de seguimiento.
              </li>
              <li>
                Generar gráficas, historial y comparativas privadas de evolución física
                del Alumno.
              </li>
              <li>
                Verificar la identidad y credenciales profesionales de Coaches en el
                directorio público.
              </li>
              <li>
                Brindar soporte técnico, prevención de fraudes, moderación y seguridad de
                la infraestructura.
              </li>
            </ul>
            <p className="text-zinc-300">
              <strong>MiGymBrou nunca vende ni comercializa tus datos personales</strong>{" "}
              a terceros.
            </p>
          </div>
        </section>

        {/* 3. Visibilidad y Privacidad Estricta */}
        <section className="space-y-3 rounded-xl border border-emerald-500/25 bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <EyeOff className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              3. Privacidad Estricta de Datos Antropométricos y Fotos de Progreso
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>
              Todos los datos sensibles de seguimiento físico del Alumno —incluyendo peso,
              medidas corporales, notas de evaluación y fotografías de progreso— son{" "}
              <strong className="text-emerald-400">
                estrictamente privados entre el Alumno y su Coach vinculado activo
              </strong>
              .
            </p>
            <p>
              Esta información jamás se muestra en el directorio público ni es accesible
              para otros usuarios. La plataforma implementa autenticación segura y
              políticas de seguridad a nivel de fila (Row Level Security — RLS) en base de
              datos para proteger el acceso a cada expediente.
            </p>
          </div>
        </section>

        {/* 4. Derechos ARCO */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 shrink-0 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              4. Ejercicio de Derechos ARCO y Revocación de Consentimiento
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p>
              Conforme a la LFPDPPP, tienes derecho en todo momento a ejercer tus derechos{" "}
              <strong className="text-zinc-200">ARCO</strong>:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-zinc-200">Acceso:</strong> conocer qué datos
                personales tenemos de ti y cómo los tratamos.
              </li>
              <li>
                <strong className="text-zinc-200">Rectificación:</strong> corregir datos
                inexactos o incompletos desde tu perfil o mediante solicitud.
              </li>
              <li>
                <strong className="text-zinc-200">Cancelación:</strong> solicitar la
                eliminación de tus datos personales y cierre definitivo de tu cuenta.
              </li>
              <li>
                <strong className="text-zinc-200">Oposición:</strong> oponerte al uso de
                tus datos para fines específicos.
              </li>
            </ul>
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-[#060607] p-4">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  ¿Cómo ejercer tus derechos ARCO?
                </p>
                <p className="text-zinc-400">
                  Envía un correo a{" "}
                  <a
                    href="mailto:privacidad@migymbrou.com"
                    className="font-semibold text-emerald-400 hover:underline"
                  >
                    privacidad@migymbrou.com
                  </a>{" "}
                  desde el correo registrado en tu cuenta indicando tu nombre completo y
                  el derecho ARCO que deseas ejercer. Responderemos en un plazo máximo de
                  20 días hábiles conforme a la legislación mexicana vigente.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-zinc-500">
          <Link href="/terminos" className="text-emerald-400 hover:underline">
            ← Consultar Términos y Condiciones
          </Link>
          <Link href="/auth" className="hover:text-zinc-300">
            Ir a Iniciar sesión
          </Link>
        </div>
      </main>
    </div>
  );
}

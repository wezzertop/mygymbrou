import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Dumbbell,
  X,
} from "lucide-react";
import {
  LandingHeaderAuth,
  LandingHeroAuthActions,
} from "@/components/LandingAuthControls";
import { PRICING_FOOTNOTE_MXN, SAAS_PLANS_MXN } from "@/lib/saas-plans";

const COACH_PILLARS = [
  {
    title: "Cartera e invitaciones en 1 clic",
    desc: "Invita alumnos por correo con enlace único. Quedan vinculados a tu perfil y plan sin pasos manuales.",
  },
  {
    title: "Antropometría y evolución real",
    desc: "Registra peso, composición corporal, perímetros y fotos con comparativas automáticas mes contra mes.",
  },
  {
    title: "Plantillas de rutinas y nutrición",
    desc: "Asigna entrenamientos visuales y planes de macros desde tu biblioteca en menos de diez segundos.",
  },
  {
    title: "Diplomas verificables y agenda",
    desc: "Respalda tu trayectoria con certificaciones visibles, agenda de citas y control de renovaciones.",
  },
];

const STUDENT_PILLARS = [
  {
    title: "Entrenamiento de hoy sin distracciones",
    desc: "Series, repeticiones, cargas y temporizador de descanso accesibles con una sola mano en el gimnasio.",
  },
  {
    title: "Nutrición práctica y clara",
    desc: "Comidas del día, macros en tiempo real, opciones de intercambio y contador diario de hidratación.",
  },
  {
    title: "Resultados medibles cada semana",
    desc: "Gráficas limpias de progreso, notas directas de tu coach y confirmación rápida de tus próximas citas.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#060607] text-zinc-100">
      {/* Minimalist Sleek Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060607]/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
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

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-8 text-[13px] font-medium text-zinc-400 md:flex"
          >
            <Link
              href="/coaches"
              className="transition hover:text-white"
            >
              Directorio de Coaches
            </Link>
            <a href="#coaches" className="transition hover:text-white">
              Para Coaches
            </a>
            <a href="#alumnos" className="transition hover:text-white">
              Para Alumnos
            </a>
            <a href="#planes" className="transition hover:text-white">
              Precios MXN
            </a>
          </nav>

          <LandingHeaderAuth />
        </div>
      </header>

      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle atmospheric top glow — restrained, not loud */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(16,185,129,0.12),transparent_70%)]"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Plataforma de entrenamiento y nutrición para Coaches y Atletas
            </p>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              Entrenamiento serio.{" "}
              <span className="text-zinc-400">
                Resultados que se ven y se miden.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Centraliza rutinas, nutrición por macros, antropometría y citas en
              una experiencia móvil diseñada para el gimnasio y la vida diaria.
            </p>

            <div className="mt-8 flex justify-center">
              <LandingHeroAuthActions />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-zinc-500">
              <Link
                href="/coaches"
                className="inline-flex items-center gap-1 text-zinc-300 transition hover:text-white"
              >
                Explorar Coaches certificados
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <span aria-hidden="true" className="hidden text-zinc-700 sm:inline">
                ·
              </span>
              <Link
                href="/student"
                className="transition hover:text-amber-300"
              >
                Ver Demo Alumno
              </Link>
              <span aria-hidden="true" className="hidden text-zinc-700 sm:inline">
                ·
              </span>
              <Link
                href="/coach"
                className="transition hover:text-amber-300"
              >
                Ver Demo Coach
              </Link>
            </div>
          </div>

          {/* Unobstructed Hero Editorial Photograph — ZERO text covering the photo */}
          <div className="mt-12 sm:mt-16">
            <div className="overflow-hidden rounded-xl bg-[#0e0f12] ring-1 ring-white/10 sm:rounded-xl">
              <img
                src="/images/landing/hero-athlete.jpg"
                alt="Atleta entrenando fuerza con barra en gimnasio boutique"
                className="aspect-[16/10] w-full object-cover object-center sm:aspect-[16/9]"
              />
            </div>

            {/* Clean Editorial Metrics Bar BELOW the photo (never overlapping it) */}
            <div className="mt-6 grid grid-cols-1 divide-y divide-white/[0.08] border-y border-white/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="py-4 sm:px-6 sm:py-5">
                <p className="text-sm font-semibold text-white">
                  App 100% gratuita para alumnos
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Tus atletas entran mediante tu invitación directa sin costo extra.
                </p>
              </div>
              <div className="py-4 sm:px-6 sm:py-5">
                <p className="text-sm font-semibold text-white">
                  Sincronización en tiempo real
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Cada ajuste de rutina, dieta o medición llega al instante al celular.
                </p>
              </div>
              <div className="py-4 sm:px-6 sm:py-5">
                <p className="text-sm font-semibold text-white">
                  Identidad y diplomas verificables
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Confianza real entre entrenadores certificados y su comunidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 01 — For Coaches (Clean Editorial Split) */}
      <section
        id="coaches"
        className="border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          {/* Unobstructed Coaching Photograph */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-xl bg-[#0e0f12] ring-1 ring-white/10 sm:rounded-xl">
              <img
                src="/images/landing/coach-session.jpg"
                alt="Entrenador personal guiando a su alumna durante una sesión de fuerza"
                className="aspect-[4/3] w-full object-cover object-center"
              />
            </div>
          </div>

          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              01 · Para Coaches y Estudios
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Tu método profesional, operado sin hojas de cálculo.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Diseñado para entrenadores independientes y estudios que valoran
              el tiempo y la presentación frente a cada cliente.
            </p>

            <div className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {COACH_PILLARS.map((item) => (
                <div key={item.title} className="py-4">
                  <h3 className="text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/auth/register-coach"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 sm:text-sm"
              >
                Crear cuenta de Coach
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coaches"
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 transition hover:text-white sm:text-sm"
              >
                Ver directorio público
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 02 — For Students / Athletes (Clean Editorial Split Reversed) */}
      <section
        id="alumnos"
        className="border-t border-white/[0.06] bg-[#0a0a0c] py-20 sm:py-28"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <div className="order-2 lg:order-1 lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              02 · Para Alumnos y Atletas
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Del gimnasio a la cocina, todo claro en un toque.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Sin PDFs perdidos en WhatsApp. Abre tu app, completa tu
              entrenamiento de hoy, marca tus comidas y observa tu evolución real.
            </p>

            <div className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {STUDENT_PILLARS.map((item) => (
                <div key={item.title} className="py-4">
                  <h3 className="text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/student/workouts"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 text-xs font-semibold text-white transition hover:border-emerald-500/40 hover:bg-white/[0.08] sm:text-sm"
              >
                Ver Demo de Rutina
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/student/diet"
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white sm:text-sm"
              >
                Ver Demo de Dieta
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Unobstructed Nutrition Photograph */}
          <div className="order-1 lg:order-2 lg:col-span-6">
            <div className="overflow-hidden rounded-xl bg-[#0e0f12] ring-1 ring-white/10 sm:rounded-xl">
              <img
                src="/images/landing/nutrition-editorial.jpg"
                alt="Plan nutricional saludable con salmón, espárragos, quinoa y aguacate"
                className="aspect-[4/3] w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 03 — Refined Mobile Interface Preview */}
      <section className="border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 sm:p-10 lg:grid-cols-12 lg:p-14">
            <div className="space-y-5 lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                03 · Experiencia Mobile-First
              </p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                Pensada para usarse con el pulgar entre series.
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Navegación inferior nativa en iOS y Android, temporizador de
                descanso instantáneo, registro de cargas y gráficas limpias sin
                ruido visual.
              </p>

              <ul className="space-y-3 pt-1 text-sm text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Checkboxes táctiles para ejercicios y comidas diarias
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Comparativa automática de peso, cintura y masa muscular
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Alertas inmediatas de rutinas, dietas y citas programadas
                </li>
              </ul>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/student"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 sm:text-sm"
                >
                  Ver Demo App Alumno
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/coach/students/student-1"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 px-5 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:text-white sm:text-sm"
                >
                  Ver Demo Expediente 360°
                </Link>
              </div>
            </div>

            {/* Clean Architectural iPhone Preview */}
            <div className="flex justify-center lg:col-span-6">
              <div className="w-full max-w-[300px] rounded-[2.5rem] border border-white/15 bg-[#060607] p-4 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]">
                <div className="mx-auto mb-5 h-1 w-14 rounded-full bg-zinc-800" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-zinc-500">Hoy · Mi Progreso</p>
                      <p className="text-sm font-semibold text-white">
                        Sofía Ramírez
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      Activo
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/[0.07] bg-[#0e0f12] p-3.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                      Nota de tu Coach
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                      -2.5 cm en abdomen y +0.7 kg de masa muscular este mes.
                      Lista para subir carga en tren inferior.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-white/[0.07] bg-[#0e0f12] p-3">
                      <p className="text-[10px] text-zinc-500">Peso actual</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                        62.4 kg
                      </p>
                      <p className="text-[10px] font-medium text-emerald-400">
                        -1.3 kg este mes
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-[#0e0f12] p-3">
                      <p className="text-[10px] text-zinc-500">Meta hoy</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                        1,850
                      </p>
                      <p className="text-[10px] font-medium text-zinc-400">
                        135g proteína
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.07] bg-[#0e0f12] p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white">
                        Día 1 · Tren Inferior
                      </p>
                      <span className="text-[10px] font-medium text-emerald-400">
                        4 ejercicios
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Hip Thrust 4×10 · Descanso 120s
                    </p>
                  </div>

                  <div className="grid grid-cols-5 gap-1 rounded-xl border border-white/[0.06] bg-[#0a0a0c] px-2 py-2.5 text-center text-[9px] font-medium text-zinc-500">
                    <span className="text-emerald-400">Inicio</span>
                    <span>Rutinas</span>
                    <span>Dieta</span>
                    <span>Avances</span>
                    <span>Perfil</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans & Pricing (MXN — IVA + Stripe incluidos) */}
      <section
        id="planes"
        className="border-t border-white/[0.06] bg-[#0a0a0c] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Planes en Pesos Mexicanos
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Precios claros. Sin sorpresas ni comisiones ocultas.
            </h2>
            <p className="mt-3 text-sm text-zinc-400 sm:text-base">
              IVA y comisión de procesamiento ya incluidos. Comienza gratis y
              crece al ritmo de tu cartera.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {SAAS_PLANS_MXN.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border p-6 transition ${
                  plan.featured
                    ? "border-emerald-500/50 bg-[#111315] shadow-[0_20px_60px_-25px_rgba(16,185,129,0.28)]"
                    : "border-white/[0.08] bg-[#0e0f12] hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-white">
                    {plan.name}
                  </h3>
                  {plan.badge && (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p className="mt-2 min-h-[36px] text-xs leading-relaxed text-zinc-400">
                  {plan.description}
                </p>

                <div className="mt-6 border-b border-white/[0.08] pb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight tabular-nums text-white">
                      {plan.priceLabel}
                    </span>
                    <span className="text-xs font-medium text-zinc-500">
                      {plan.period}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium text-zinc-400">
                    {plan.priceMxn === 0 ? "Sin tarjeta requerida" : "IVA incluido"} ·{" "}
                    <span className="text-emerald-400">{plan.studentLimitLabel}</span>
                  </p>
                </div>

                <div className="my-6 flex-1 space-y-4">
                  <ul className="space-y-2.5 text-xs text-zinc-200">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.excludedFeatures.length > 0 ? (
                    <div className="border-t border-white/[0.06] pt-3.5">
                      <ul className="space-y-2 text-[11px] text-zinc-500">
                        {plan.excludedFeatures.map((ex) => (
                          <li key={ex} className="flex items-start gap-2">
                            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="border-t border-white/[0.06] pt-3.5">
                      <p className="text-[11px] font-medium text-emerald-400">
                        {plan.coachLimitLabel || "Plan empresarial completo"}
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  href={`/auth/register-coach?plan=${plan.id}`}
                  className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-xs font-semibold transition ${
                    plan.featured
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "border border-white/15 bg-white/[0.03] text-white hover:border-white/30 hover:bg-white/[0.08]"
                  }`}
                >
                  {plan.ctaLabel}
                </Link>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-zinc-400">
            {PRICING_FOOTNOTE_MXN}
          </p>
        </div>
      </section>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-white/[0.06] bg-[#060607] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-zinc-950">
              <Dumbbell className="h-3.5 w-3.5" />
            </span>
            <span className="font-semibold text-white">MiGymBrou</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">Coaches & Atletas</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/coaches" className="transition hover:text-zinc-200">
              Directorio
            </Link>
            <Link href="/auth" className="transition hover:text-zinc-200">
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register-coach"
              className="transition hover:text-zinc-200"
            >
              Registro Coach
            </Link>
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

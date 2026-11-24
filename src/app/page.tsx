import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Flame,
  LineChart,
  Search,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";

const STUDENT_BENEFITS = [
  {
    icon: LineChart,
    title: "Tu Progreso en Gráficas",
    desc: "Visualiza tu transformación mes a mes en peso, medidas corporales y fotos, junto con los comentarios directos de tu coach.",
  },
  {
    icon: Dumbbell,
    title: "Entrena sin Distracciones",
    desc: "Sigue tu rutina día a día en el gimnasio con series, repeticiones, cargas sugeridas y temporizador de descanso integrado.",
  },
  {
    icon: Utensils,
    title: "Nutrición Clara y Práctica",
    desc: "Lleva el control diario de tus comidas, calorías, macros e hidratación con opciones de intercambio pensadas para tu estilo de vida.",
  },
  {
    icon: CalendarCheck,
    title: "Acompañamiento Continuo",
    desc: "Consulta tus próximas citas de valoración y recibe avisos al instante cada vez que se actualiza tu plan o tus métricas.",
  },
];

const COACH_BENEFITS = [
  {
    icon: Users,
    title: "Tu Comunidad en Un Solo Lugar",
    desc: "Integra a tus alumnos mediante invitación por correo y mantén visibilidad clara de su actividad, objetivos y membresía.",
  },
  {
    icon: Activity,
    title: "Evaluación Corporal Completa",
    desc: "Registra peso, composición corporal y perímetros con comparativas automáticas para respaldar cada fase del entrenamiento.",
  },
  {
    icon: Flame,
    title: "Biblioteca de Rutinas y Nutrición",
    desc: "Diseña tus propios planes y plantillas reutilizables de entrenamiento y macros para personalizar cada proceso en segundos.",
  },
  {
    icon: CreditCard,
    title: "Agenda y Suscripciones",
    desc: "Coordina valoraciones presenciales u online y lleva el control de renovaciones y planes mensuales con total claridad.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$29",
    period: "/mes",
    desc: "Para entrenadores que buscan ofrecer una experiencia digital moderna a su grupo inicial.",
    features: [
      "Hasta 15 alumnos activos",
      "Historial antropométrico ilimitado",
      "Constructor de rutinas y planes nutricionales",
      "App móvil para todos tus alumnos",
    ],
    featured: false,
  },
  {
    name: "Pro Performance",
    price: "$59",
    period: "/mes",
    desc: "Diseñado para coaches con comunidad en crecimiento y seguimiento integral.",
    features: [
      "Hasta 60 alumnos activos",
      "Plantillas reutilizables de rutinas y dietas",
      "Comparativas visuales y galería de progreso",
      "Agenda de citas y control de membresías",
      "Soporte prioritario",
    ],
    featured: true,
  },
  {
    name: "Studio / Gym",
    price: "$119",
    period: "/mes",
    desc: "Para estudios de entrenamiento, boxes y equipos multidisciplinarios.",
    features: [
      "Alumnos ilimitados",
      "Múltiples coaches bajo una misma marca",
      "Identidad personalizada para tu estudio",
      "Listo para conectar Stripe o Mercado Pago",
    ],
    featured: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#0b1120] text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b1120]/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              MiGym<span className="text-cyan-400">Brou</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <Link
              href="/coaches"
              className="inline-flex items-center gap-1.5 font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar Coach
            </Link>
            <a href="#alumnos" className="transition hover:text-emerald-400">
              Para Alumnos
            </a>
            <a href="#coaches" className="transition hover:text-cyan-400">
              Para Coaches
            </a>
            <a href="#planes" className="transition hover:text-white">
              Planes
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/auth?role=student"
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/50 hover:bg-slate-800 sm:text-sm"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/register-coach"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 sm:text-sm"
            >
              Soy Coach
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.16),_transparent_50%)]"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Entrenamiento, Progreso y Disciplina en un Solo Lugar
            </div>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Entrena con propósito.{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Mide cada avance.
              </span>
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              El espacio digital donde atletas y entrenadores transforman la
              constancia en resultados visibles: rutinas guiadas en el gimnasio,
              nutrición por macros, evolución corporal y conexión directa en
              tiempo real.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                href="/auth?role=student"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:brightness-110"
              >
                Soy Alumno (Iniciar Sesión)
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/register-coach"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-4 text-sm font-bold text-white transition hover:border-cyan-500/50 hover:bg-slate-800"
              >
                Soy Coach (Crear Cuenta)
              </Link>
            </div>

            {/* Instant Interactive Demo Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Explora la experiencia en vivo
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/coaches"
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/25"
                >
                  <Award className="h-3.5 w-3.5 text-sky-400" />
                  Buscar Coach y Ver Diplomas
                </Link>
                <Link
                  href="/student/progress"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Ver App del Alumno
                </Link>
                <Link
                  href="/coach"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  <Dumbbell className="h-3.5 w-3.5" />
                  Ver Panel del Coach
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-sky-400" />
                Verificación de personas reales
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-400" />
                Coaches con diplomas verificables
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-400" />
                Progreso real y medible
              </span>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="relative lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-cyan-950/50">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80"
                alt="Entrenamiento fitness de alto rendimiento"
                className="h-80 w-full object-cover opacity-80 sm:h-[420px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/45 to-transparent" />

              {/* Floating Live Metrics Overlay */}
              <div className="absolute inset-x-4 bottom-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-3 backdrop-blur">
                    <p className="text-[10px] font-medium uppercase text-slate-400">
                      Abdomen
                    </p>
                    <p className="text-lg font-extrabold text-emerald-400">
                      -2.5 cm
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-3 backdrop-blur">
                    <p className="text-[10px] font-medium uppercase text-slate-400">
                      Bíceps
                    </p>
                    <p className="text-lg font-extrabold text-cyan-400">
                      +1.2 cm
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-3 backdrop-blur">
                    <p className="text-[10px] font-medium uppercase text-slate-400">
                      Constancia
                    </p>
                    <p className="text-lg font-extrabold text-white">94%</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-3.5 backdrop-blur">
                  <p className="text-[11px] font-semibold text-emerald-400">
                    Resumen del Mes — Coach & Atleta
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    &ldquo;Reducción constante en cintura y mejora en fuerza
                    semana a semana. Lista para la siguiente fase.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Students / Athletes */}
      <section
        id="alumnos"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Para Alumnos y Atletas
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Tu evolución física, clara y siempre en tu mano
          </h2>
          <p className="mt-3 text-slate-400">
            Desde cada serie en el gimnasio hasta tus comidas y medidas del mes.
            Todo diseñado para mantenerte enfocado, motivado y viendo resultados
            reales.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STUDENT_BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 transition hover:border-emerald-500/40 hover:bg-slate-900"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits for Coaches */}
      <section
        id="coaches"
        className="border-y border-slate-800/80 bg-slate-950/60 py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Para Coaches y Entrenadores
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Potencia tu método y multiplica el impacto en tu comunidad
            </h2>
            <p className="mt-3 text-slate-400">
              Una plataforma a la altura de tu trabajo: centraliza rutinas,
              nutrición, mediciones y citas en un entorno ágil que tus alumnos
              disfrutan usar todos los días.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COACH_BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 transition hover:border-cyan-500/40 hover:bg-slate-900"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile Interface Visual Preview */}
      <section
        id="experiencia"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="grid items-center gap-10 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 p-6 sm:p-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <span className="inline-block rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
              Unidos por el Rendimiento
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Del gimnasio a tu celular, todo fluye en sincronía
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Cuando el coach ajusta una rutina, actualiza el plan de
              alimentación o registra nuevas medidas, el alumno lo recibe al
              instante en su celular con una interfaz rápida, intuitiva y lista
              para entrenar.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Temporizador de descanso y registro táctil de ejercicios
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Comparativa automática de medidas y evolución mes a mes
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Notificaciones instantáneas de rutinas, dietas y citas
              </li>
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/student/workouts"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Probar Rutina en Vivo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coach/students/student-1"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-500/50"
              >
                Ver Expediente 360°
              </Link>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex justify-center lg:col-span-6">
            <div className="w-full max-w-xs rounded-[2.2rem] border-4 border-slate-700 bg-[#0b1120] p-4 shadow-2xl shadow-black/70">
              <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-800" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400">Mi Progreso</p>
                    <p className="text-sm font-bold text-white">Sofía Ramírez</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                    Plan Activo
                  </span>
                </div>
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                  <p className="text-[10px] font-semibold uppercase text-cyan-300">
                    Nota de tu Coach
                  </p>
                  <p className="mt-1 text-xs text-slate-200">
                    -2.5 cm abdomen · +0.7 kg masa muscular este mes. ¡Gran
                    ritmo!
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <p className="text-[10px] text-slate-400">Peso Actual</p>
                    <p className="text-base font-extrabold text-white">62.4 kg</p>
                    <p className="text-[10px] text-emerald-400">↓ 1.3 kg</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <p className="text-[10px] text-slate-400">Meta Hoy</p>
                    <p className="text-base font-extrabold text-white">1,850</p>
                    <p className="text-[10px] text-cyan-400">135g Prot</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">
                      Día 1: Tren Inferior
                    </p>
                    <span className="text-[10px] text-emerald-400">
                      4 ejercicios
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Hip Thrust 4x8-10 · Descanso 120s
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-1 rounded-2xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[9px] text-slate-400">
                  <span className="font-bold text-emerald-400">Avances</span>
                  <span>Rutinas</span>
                  <span>Dieta</span>
                  <span>Citas</span>
                  <span>Plan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans for Coaches */}
      <section
        id="planes"
        className="border-t border-slate-800/80 bg-slate-950/60 py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Planes para Coaches y Estudios
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Crece a tu ritmo con la plataforma que tu equipo merece
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Tus alumnos acceden sin costo adicional desde su celular mediante
              tu invitación directa.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-7 ${
                  plan.featured
                    ? "border-cyan-500/60 bg-slate-900 shadow-2xl shadow-cyan-500/10"
                    : "border-slate-800 bg-slate-900/50"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-1 text-[11px] font-bold text-slate-950">
                    Más Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{plan.desc}</p>
                <div className="my-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-400">USD{plan.period}</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register-coach"
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
                    plan.featured
                      ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:brightness-110"
                      : "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  Comenzar Prueba Gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0b1120] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-slate-300">
            <Dumbbell className="h-4 w-4 text-cyan-400" />
            <span className="font-bold">MiGymBrou</span>
            <span>— Comunidad Fitness para Coaches y Alumnos</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/auth" className="hover:text-slate-300">
              Acceso
            </Link>
            <Link href="/auth/register-coach" className="hover:text-slate-300">
              Registro Coach
            </Link>
            <Link href="/auth/forgot-password" className="hover:text-slate-300">
              Recuperar Contraseña
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

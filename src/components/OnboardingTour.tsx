"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  Flame,
  LineChart,
  Sparkles,
  UserPlus,
  Utensils,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  href: string;
  ctaLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "cyan" | "emerald";
}

const COACH_STEPS: TourStep[] = [
  {
    title: "Configura tu Perfil y Diplomas",
    subtitle: "Paso 1 · Tu identidad profesional",
    description:
      "Completa el nombre de tu marca, especialidad, verificación de identidad y sube tus diplomas o certificaciones para destacar en el directorio de coaches.",
    tip: "Los alumnos confían 3x más en perfiles con diplomas verificables.",
    href: "/coach/profile",
    ctaLabel: "Ir a mi Perfil",
    icon: Award,
    accent: "cyan",
  },
  {
    title: "Crea Plantillas de Rutinas y Dietas",
    subtitle: "Paso 2 · Ahorra horas cada semana",
    description:
      "Diseña rutinas visuales con demostraciones de ejercicios y planes nutricionales por macros reutilizables para asignarlos a cualquier alumno en segundos.",
    tip: "Puedes asignar una plantilla directamente desde tu panel de inicio.",
    href: "/coach/workouts",
    ctaLabel: "Explorar Rutinas",
    icon: Dumbbell,
    accent: "emerald",
  },
  {
    title: "Invita a tu Primer Alumno por Correo",
    subtitle: "Paso 3 · Vinculación automática",
    description:
      "Envía una invitación personalizada con enlace único. Tu alumno crea su cuenta rápida (o acepta en 1 clic si ya tiene cuenta) y entra gratis a su app móvil.",
    tip: "Tu contador de alumnos activos y cupo disponible se actualiza al instante.",
    href: "/coach/students?invite=true",
    ctaLabel: "Invitar Alumno",
    icon: UserPlus,
    accent: "cyan",
  },
  {
    title: "Registra Evaluaciones Antropométricas",
    subtitle: "Paso 4 · Resultados medibles",
    description:
      "Guarda peso, porcentaje de grasa, masa muscular, perímetros y fotos de progreso. El alumno verá gráficas automáticas comparando mes contra mes.",
    tip: "Cada nueva evaluación envía una notificación directa a la app del alumno.",
    href: "/coach/students",
    ctaLabel: "Ver Expedientes",
    icon: Activity,
    accent: "emerald",
  },
  {
    title: "Agenda Citas y Controla Membresías",
    subtitle: "Paso 5 · Operación sin fricción",
    description:
      "Programa valoraciones presenciales u online y monitorea qué alumnos están al día, por vencer o vencidos para renovar sus planes en un solo toque.",
    tip: "Usa los filtros rápidos del dashboard para no perder ninguna renovación.",
    href: "/coach/agenda",
    ctaLabel: "Abrir Agenda",
    icon: CalendarCheck,
    accent: "cyan",
  },
];

const STUDENT_STEPS: TourStep[] = [
  {
    title: "¡Bienvenido a tu App MiGymBrou!",
    subtitle: "Paso 1 · Todo tu entrenamiento en el bolsillo",
    description:
      "Desde tu pantalla de Inicio tendrás acceso inmediato a tu entrenamiento de hoy, tus comidas del día y tus próximos objetivos sin navegar menús complicados.",
    tip: "Todo lo que marcas se sincroniza en tiempo real con tu Coach.",
    href: "/student",
    ctaLabel: "Ver mi Inicio",
    icon: Flame,
    accent: "emerald",
  },
  {
    title: "Tu Rutina del Día y Temporizador",
    subtitle: "Paso 2 · Diseñada para el gimnasio",
    description:
      "Consulta tus ejercicios, series, repeticiones y cargas sugeridas. Marca cada ejercicio completado, registra tu peso levantado y usa el temporizador de descanso integrado.",
    tip: "Toca cualquier ejercicio para ver su demostración visual paso a paso.",
    href: "/student/workouts",
    ctaLabel: "Ver mi Rutina",
    icon: Dumbbell,
    accent: "cyan",
  },
  {
    title: "Plan Nutricional y Macros",
    subtitle: "Paso 3 · Claro y práctico en la cocina",
    description:
      "Revisa tus comidas del día, calorías, proteína, carbohidratos, grasas y opciones de intercambio. Lleva también tu contador diario de vasos de agua.",
    tip: "Marca cada comida conforme la termines para ver tu progreso diario.",
    href: "/student/diet",
    ctaLabel: "Ver mi Dieta",
    icon: Utensils,
    accent: "emerald",
  },
  {
    title: "Gráficas de Avance y Check-ins",
    subtitle: "Paso 4 · Visualiza tu transformación",
    description:
      "Observa tu evolución de peso, cintura, masa muscular y medidas corporales con los comentarios personalizados de tu Coach y sube tu check-in semanal.",
    tip: "Compara tus avances contra el mes anterior o contra tu punto de inicio.",
    href: "/student/progress",
    ctaLabel: "Ver mis Avances",
    icon: LineChart,
    accent: "cyan",
  },
  {
    title: "Confirma tus Próximas Citas",
    subtitle: "Paso 5 · Acompañamiento continuo",
    description:
      "Revisa tus valoraciones presenciales o videollamadas programadas, recibe alertas cuando tu Coach actualiza tu plan y gestiona tus metas en tu perfil.",
    tip: "Puedes volver a ver este tutorial cuando quieras desde tu Perfil.",
    href: "/student/appointments",
    ctaLabel: "Ver mis Citas",
    icon: CalendarCheck,
    accent: "emerald",
  },
];

export function OnboardingTour({ role }: { role: "coach" | "student" }) {
  const {
    hydrated,
    authUserId,
    coachProfile,
    studentProfile,
    manualTourTrigger,
    completeOnboarding,
  } = useApp();
  const profile = role === "coach" ? coachProfile : studentProfile;
  const steps = role === "coach" ? COACH_STEPS : STUDENT_STEPS;

  const [stepIdx, setStepIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);

  const storageKey = `migymbrou_onboarding_v2_${role}_${
    authUserId || profile.id || "local"
  }`;

  // Evaluación automática estricta de UNA SOLA VEZ al hidratar
  useEffect(() => {
    if (!hydrated || autoChecked) return;
    setAutoChecked(true);

    let doneInLocal = false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { completed?: boolean; skipped?: boolean };
        doneInLocal = Boolean(parsed.completed || parsed.skipped);
      }
    } catch {
      // ignore storage errors
    }

    const doneInDb = Boolean(
      profile.onboarding_completed ||
        profile.has_completed_onboarding ||
        profile.onboarding_skipped
    );

    if (!doneInLocal && !doneInDb) {
      setStepIdx(0);
      setIsOpen(true);
    }
  }, [
    hydrated,
    autoChecked,
    storageKey,
    profile.onboarding_completed,
    profile.has_completed_onboarding,
    profile.onboarding_skipped,
  ]);

  // Apertura explícita manual (desde "Ver Tutorial Guiado" o botón "?")
  useEffect(() => {
    if (manualTourTrigger && manualTourTrigger.role === role) {
      setStepIdx(0);
      setIsOpen(true);
    }
  }, [manualTourTrigger, role]);

  const handleClose = (skipped: boolean) => {
    setIsOpen(false);
    completeOnboarding(role, skipped);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const current = steps[stepIdx] || steps[0];
  const Icon = current.icon;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === steps.length - 1;
  const progressPct = Math.round(((stepIdx + 1) / steps.length) * 100);

  const handleFinish = () => handleClose(false);
  const handleSkip = () => handleClose(true);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        role === "coach"
          ? "Tutorial de bienvenida para Coach"
          : "Tutorial de bienvenida para Alumno"
      }
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0e0f12] shadow-2xl shadow-black/90">
        {/* Progress bar */}
        <div className="h-1 w-full bg-white/[0.06]">
          <div
            className="h-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="p-5 sm:p-6">
          {/* Top header */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300">
Guía Rápida ({stepIdx + 1}/{steps.length})
            </span>
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Omitir tutorial"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-2.5 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              Omitir
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Visual Hero Icon + Content */}
          <div className="mt-5 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-400">
              <Icon className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {current.subtitle}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                {current.title}
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-zinc-400">
              {current.description}
            </p>

            <div className="rounded-xl border border-white/[0.08] bg-[#060607] p-3.5 text-xs text-zinc-300">
              <span className="font-semibold text-emerald-400">Tip: </span>
              {current.tip}
            </div>
          </div>

          {/* Step Dots */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {steps.map((s, idx) => (
              <button
                key={s.title}
                type="button"
                aria-label={`Ir al paso ${idx + 1}`}
                onClick={() => setStepIdx(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === stepIdx
                    ? "w-6 bg-white"
                    : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                }`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center gap-2.5">
            {!isFirst ? (
              <button
                type="button"
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-4 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08]"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-4 text-xs font-medium text-zinc-400 transition hover:text-white"
              >
                Omitir
              </button>
            )}

            {isLast ? (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                <CheckCircle2 className="h-4 w-4" />
                Empezar ahora
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setStepIdx((i) => Math.min(steps.length - 1, i + 1))
                }
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3.5 text-center">
            <Link
              href={current.href}
              onClick={handleFinish}
              className="text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              {current.ctaLabel} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

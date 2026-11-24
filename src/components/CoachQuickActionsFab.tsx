"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  CreditCard,
  Dumbbell,
  Plus,
  UserPlus,
  Utensils,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const FAB_ENABLED_PREFIXES = [
  "/coach",
  "/coach/students",
  "/coach/workouts",
  "/coach/agenda",
  "/coach/plans",
  "/coach/calendar",
];

export function CoachQuickActionsFab() {
  const pathname = usePathname();
  const { students } = useApp();
  const [open, setOpen] = useState(false);

  const isVisible = FAB_ENABLED_PREFIXES.some((prefix) =>
    prefix === "/coach"
      ? pathname === "/coach"
      : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isVisible) return null;

  const firstActiveStudentId = students.find(
    (s) => s.invite_status === "active" && s.student_id
  )?.student_id;

  const assessmentHref = firstActiveStudentId
    ? `/coach/students/${firstActiveStudentId}?tab=assessment`
    : "/coach/students?invite=true";

  const actions = [
    {
      label: "Invitar Alumno",
      href: "/coach/students?invite=true",
      icon: UserPlus,
    },
    {
      label: "Asignar Rutina",
      href: "/coach/workouts",
      icon: Dumbbell,
    },
    {
      label: "Actualizar Dieta",
      href: "/coach/plans?tab=diets",
      icon: Utensils,
    },
    {
      label: "Nueva Evaluación",
      href: assessmentHref,
      icon: Activity,
    },
    {
      label: "Agendar Cita",
      href: "/coach/agenda",
      icon: CalendarPlus,
    },
    {
      label: "Crear / Editar Plan",
      href: "/coach/plans",
      icon: CreditCard,
    },
    {
      label: "Ver Calendario",
      href: "/coach/calendar",
      icon: CalendarDays,
    },
  ];

  return (
    <>
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/65 backdrop-blur-[2px]"
        />
      )}

      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 lg:bottom-8 lg:right-8">
        {open && (
          <div className="flex flex-col items-end gap-2 pb-1">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className="flex h-10 items-center gap-2.5 rounded-full border border-white/15 bg-[#0e0f12] px-4 text-xs font-medium text-white shadow-xl transition hover:border-emerald-500/50 hover:bg-[#15171c]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="whitespace-nowrap">{action.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Cerrar acciones rápidas" : "Abrir acciones rápidas"}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition active:scale-95 ${
            open
              ? "bg-white text-zinc-950 hover:bg-zinc-200"
              : "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400"
          }`}
        >
          {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5 stroke-[2.5]" />}
        </button>
      </div>
    </>
  );
}

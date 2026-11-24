"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function LandingHeaderAuth() {
  const router = useRouter();
  const {
    hydrated,
    isDemoMode,
    authUserId,
    authUserRole,
    coachProfile,
    studentProfile,
    signOut,
  } = useApp();
  const [signingOut, setSigningOut] = useState(false);

  const isAuthenticated = hydrated && !isDemoMode && Boolean(authUserId);

  if (!isAuthenticated) {
    return (
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <Link
          href="/auth?role=student"
          className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          <span className="sm:hidden">Entrar</span>
          <span className="hidden sm:inline">Iniciar sesión</span>
        </Link>
        <Link
          href="/auth/register-coach"
          className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-white px-4 text-[13px] font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.98]"
        >
          Soy Coach
        </Link>
      </div>
    );
  }

  const isCoach = authUserRole !== "student";
  const activeProfile = isCoach ? coachProfile : studentProfile;
  const targetHref = isCoach ? "/coach" : "/student";
  const targetLabel = isCoach ? "Ir a mi Panel Coach" : "Ir a mi App Alumno";
  const roleLabel = isCoach ? "Coach" : "Alumno";
  const initials = (activeProfile.full_name || "MG")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    router.refresh();
  };

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-3 sm:flex">
        {activeProfile.avatar_url ? (
          <img
            src={activeProfile.avatar_url}
            alt={activeProfile.full_name}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
            {initials}
          </div>
        )}
        <span className="max-w-[110px] truncate text-xs font-medium text-zinc-200">
          {activeProfile.full_name.split(" ")[0]}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title={roleLabel} />
      </div>

      <Link
        href={targetHref}
        className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-emerald-500 px-3.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 active:scale-[0.98] sm:px-4 sm:text-[13px]"
      >
        <span className="sm:hidden">{isCoach ? "Mi Panel" : "Mi App"}</span>
        <span className="hidden sm:inline">{targetLabel}</span>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        disabled={signingOut}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/25 hover:text-white disabled:opacity-50"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function LandingHeroAuthActions() {
  const {
    hydrated,
    isDemoMode,
    authUserId,
    authUserRole,
    coachProfile,
    studentProfile,
  } = useApp();

  const isAuthenticated = hydrated && !isDemoMode && Boolean(authUserId);

  if (isAuthenticated) {
    const isCoach = authUserRole !== "student";
    const activeProfile = isCoach ? coachProfile : studentProfile;
    const firstName = activeProfile.full_name?.split(" ")[0] || "de nuevo";

    return (
      <div className="space-y-4 pt-2">
        <p className="text-xs font-medium text-emerald-400">
          Sesión activa · {activeProfile.full_name} ({isCoach ? "Coach" : "Alumno"})
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={isCoach ? "/coach" : "/student"}
            className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-7 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.99]"
          >
            {isCoach
              ? `Ir a mi Panel Coach, ${firstName}`
              : `Ir a mi App Alumno, ${firstName}`}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={isCoach ? "/coach/students?invite=true" : "/student/workouts"}
            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full border border-white/15 bg-white/[0.03] px-7 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
          >
            {isCoach ? "Invitar Alumno" : "Mi Entrenamiento de Hoy"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
      <Link
        href="/auth/register-coach"
        className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-7 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.99]"
      >
        Empezar gratis como Coach
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/auth?role=student"
        className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full border border-white/15 bg-white/[0.03] px-7 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
      >
        Soy Alumno · Iniciar sesión
      </Link>
    </div>
  );
}

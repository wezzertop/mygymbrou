"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Dumbbell,
  LogOut,
  Smartphone,
} from "lucide-react";
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
      <div className="flex items-center gap-2">
        <Link
          href="/auth?role=student"
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/50 hover:bg-slate-800 sm:text-sm"
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/auth/register-coach"
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 sm:text-sm"
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
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 sm:flex">
        {activeProfile.avatar_url ? (
          <img
            src={activeProfile.avatar_url}
            alt={activeProfile.full_name}
            className="h-7 w-7 rounded-full object-cover ring-2 ring-cyan-500/40"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/25 to-emerald-500/25 text-[11px] font-bold text-cyan-300 ring-1 ring-cyan-500/40">
            {initials}
          </div>
        )}
        <div className="min-w-0 leading-tight">
          <p className="max-w-[120px] truncate text-xs font-bold text-white">
            {activeProfile.full_name}
          </p>
          <span
            className={`inline-block text-[10px] font-semibold ${
              isCoach ? "text-cyan-400" : "text-emerald-400"
            }`}
          >
            {roleLabel} activo
          </span>
        </div>
      </div>

      <Link
        href={targetHref}
        className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg transition hover:brightness-110 sm:text-sm ${
          isCoach
            ? "bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-cyan-500/20"
            : "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-emerald-500/20"
        }`}
      >
        {isCoach ? (
          <Dumbbell className="h-4 w-4 shrink-0" />
        ) : (
          <Smartphone className="h-4 w-4 shrink-0" />
        )}
        <span className="hidden xs:inline sm:inline">{targetLabel}</span>
        <span className="xs:hidden sm:hidden">
          {isCoach ? "Mi Panel" : "Mi App"}
        </span>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        disabled={signingOut}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-2.5 text-xs font-semibold text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:inline">
          {signingOut ? "Saliendo..." : "Salir"}
        </span>
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
      <div className="space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300">
          Sesión iniciada como{" "}
          <span className="font-bold text-white">{activeProfile.full_name}</span>{" "}
          ({isCoach ? "Coach" : "Alumno"})
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={isCoach ? "/coach" : "/student"}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:brightness-110"
          >
            {isCoach
              ? `Continuar a mi Panel Coach, ${firstName}`
              : `Continuar a mi App Alumno, ${firstName}`}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={isCoach ? "/coach/students?invite=true" : "/student/workouts"}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-bold text-white transition hover:border-cyan-500/50 hover:bg-slate-800"
          >
            {isCoach ? "Invitar Alumno" : "Mi Entrenamiento de Hoy"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
      <Link
        href="/auth?role=student"
        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:brightness-110"
      >
        Soy Alumno (Iniciar Sesión)
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/auth/register-coach"
        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-bold text-white transition hover:border-cyan-500/50 hover:bg-slate-800"
      >
        Soy Coach (Crear Cuenta Gratis)
      </Link>
    </div>
  );
}

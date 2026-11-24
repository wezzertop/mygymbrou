"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Dumbbell,
  HelpCircle,
  LayoutDashboard,
  Smartphone,
  UserCircle2,
  Users,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { VerifiedPersonBadge } from "@/components/VerificationBadge";
import { OnboardingTour } from "@/components/OnboardingTour";

const COACH_NAV = [
  { href: "/coach", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/coach/students", label: "Alumnos", icon: Users },
  { href: "/coach/workouts", label: "Rutinas", fullLabel: "Rutinas Visuales", icon: Dumbbell },
  { href: "/coach/agenda", label: "Agenda", fullLabel: "Agenda de Citas", icon: CalendarCheck },
  { href: "/coach/plans", label: "Planes", fullLabel: "Planes y Dietas", icon: CreditCard },
];

export function CoachShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    coachProfile,
    students,
    appointments,
    coachInquiries,
    isDemoMode,
    resetOnboarding,
  } = useApp();

  const upcomingAppointmentsCount = appointments.filter(
    (a) => a.status === "scheduled"
  ).length;
  const pendingInquiriesCount = coachInquiries.filter(
    (i) =>
      i.status === "pending" &&
      (!coachProfile.id || i.coach_id === coachProfile.id)
  ).length;
  const attentionStudentsCount =
    students.filter(
      (s) =>
        s.invite_status === "pending" ||
        s.subscription_status === "pending_payment" ||
        s.subscription_status === "expired" ||
        s.verification_status === "pending"
    ).length + pendingInquiriesCount;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#0a0a0a] text-slate-100 lg:flex">
      <OnboardingTour role="coach" />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-800/80 lg:bg-[#121212]">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-white">
                MiGym<span className="text-cyan-400">Brou</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                Panel Coach
              </span>
            </div>
          </Link>
        </div>

        <nav aria-label="Menú principal Coach" className="flex-1 space-y-1.5 px-3 py-5">
          {COACH_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            const showStudentsBadge =
              item.href === "/coach/students" && attentionStudentsCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{item.fullLabel || item.label}</span>
                </span>
                {showStudentsBadge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-300">
                    {attentionStudentsCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="space-y-1.5 pt-3">
            <p className="px-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Gestión
            </p>
            <Link
              href="/coach/calendar"
              aria-current={isActive("/coach/calendar") ? "page" : undefined}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive("/coach/calendar")
                  ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5" />
                <span>Calendario Operativo</span>
              </span>
            </Link>
            <Link
              href="/coach/profile"
              aria-current={isActive("/coach/profile") ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive("/coach/profile")
                  ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <UserCircle2 className="h-5 w-5" />
              <span>Perfil y Diplomas</span>
            </Link>
            <button
              type="button"
              onClick={() => resetOnboarding("coach")}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Tutorial Guiado</span>
            </button>
          </div>
        </nav>

        <div className="space-y-3 border-t border-slate-800/80 p-4">
          {isDemoMode && (
            <Link
              href="/student/progress"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <Smartphone className="h-4 w-4" />
              Ver App Alumno (Demo)
            </Link>
          )}
          <Link
            href="/coach/profile"
            className="flex items-center gap-3 rounded-xl bg-slate-900/80 p-2.5 transition hover:bg-slate-900"
          >
            <img
              src={
                coachProfile.avatar_url ||
                "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=128&q=80"
              }
              alt={coachProfile.full_name}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-cyan-500/40"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="truncate text-xs font-semibold text-white">
                  {coachProfile.full_name}
                </p>
                <VerifiedPersonBadge
                  verified={coachProfile.is_verified_identity}
                  compact
                />
              </div>
              <p className="truncate text-[11px] text-slate-400">
                {coachProfile.brand_name || "Coach Certificado"}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:pl-64">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 flex min-h-[56px] w-full items-center justify-between border-b border-slate-800/80 bg-[#0a0a0a]/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
          <Link href="/coach" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">
                MiGym<span className="text-cyan-400">Brou</span>
              </span>
              <span className="ml-1.5 rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                COACH
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {isDemoMode && (
              <Link
                href="/student"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Alumno
              </Link>
            )}
            <button
              type="button"
              onClick={() => resetOnboarding("coach")}
              aria-label="Abrir tutorial guiado"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#121212] text-slate-400 transition hover:text-cyan-300"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <Link
              href="/coach/profile"
              aria-label="Perfil Coach"
              className="rounded-full ring-2 ring-cyan-500/40"
            >
              <img
                src={
                  coachProfile.avatar_url ||
                  "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=128&q=80"
                }
                alt={coachProfile.full_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-5 pb-safe-nav lg:px-8 lg:py-8 lg:pb-10">
          {children}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav
          aria-label="Navegación Coach"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/90 bg-[#121212]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 px-1 py-1.5">
            {COACH_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              const badgeCount =
                item.href === "/coach/students"
                  ? attentionStudentsCount
                  : item.href === "/coach/agenda"
                  ? upcomingAppointmentsCount
                  : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-semibold transition ${
                    active ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div
                    className={`relative rounded-lg p-1 transition ${
                      active ? "bg-cyan-500/15" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {badgeCount > 0 && (
                      <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-slate-950">
                        {badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

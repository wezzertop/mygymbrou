"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Dumbbell,
  Flame,
  HelpCircle,
  Home,
  LayoutDashboard,
  Search,
  TrendingUp,
  UserCircle2,
  Utensils,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { VerifiedPersonBadge } from "@/components/VerificationBadge";
import { OnboardingTour } from "@/components/OnboardingTour";

const STUDENT_NAV = [
  { href: "/student", label: "Inicio", icon: Home, exact: true },
  { href: "/student/workouts", label: "Rutinas", icon: Dumbbell },
  { href: "/student/diet", label: "Dieta", icon: Utensils },
  { href: "/student/progress", label: "Avances", icon: TrendingUp },
  { href: "/student/profile", label: "Perfil", icon: UserCircle2 },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    studentProfile,
    notifications,
    appointments,
    isDemoMode,
    resetOnboarding,
  } = useApp();

  const unreadCount = notifications.filter(
    (n) => n.user_id === studentProfile.id && !n.is_read
  ).length;

  const upcomingCount = appointments.filter(
    (a) => a.student_id === studentProfile.id && a.status === "scheduled"
  ).length;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#0a0a0a] text-slate-100 lg:flex">
      <OnboardingTour role="student" />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-800/80 lg:bg-[#121212]">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-white">
                MiGym<span className="text-emerald-400">Brou</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
                App Alumno
              </span>
            </div>
          </Link>
        </div>

        <nav aria-label="Menú principal Alumno" className="flex-1 space-y-1.5 px-3 py-5">
          {STUDENT_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="space-y-1.5 pt-4">
            <p className="px-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Agenda, Plan y Coaches
            </p>
            <Link
              href="/student/calendar"
              aria-current={isActive("/student/calendar") ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive("/student/calendar")
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <CalendarDays className="h-5 w-5" />
              <span>Calendario</span>
            </Link>
            <Link
              href="/student/subscription"
              aria-current={isActive("/student/subscription") ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive("/student/subscription")
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span>Mi Plan</span>
            </Link>
            <Link
              href="/student/coaches"
              aria-current={isActive("/student/coaches") ? "page" : undefined}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive("/student/coaches")
                  ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <Search className="h-5 w-5" />
                Buscar Coach
              </span>
            </Link>
            <Link
              href="/student/appointments"
              aria-current={isActive("/student/appointments") ? "page" : undefined}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive("/student/appointments")
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <CalendarCheck className="h-5 w-5" />
                Mis Citas
              </span>
              {upcomingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/20 px-1.5 text-[10px] font-bold text-emerald-300">
                  {upcomingCount}
                </span>
              )}
            </Link>
            <Link
              href="/student/notifications"
              aria-current={isActive("/student/notifications") ? "page" : undefined}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive("/student/notifications")
                  ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[11px] font-bold text-slate-950">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        <div className="space-y-3 border-t border-slate-800/80 p-4">
          {isDemoMode && (
            <Link
              href="/coach"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              <LayoutDashboard className="h-4 w-4" />
              Ir al Panel Coach (Demo)
            </Link>
          )}
          <Link
            href="/student/profile"
            className="flex items-center gap-3 rounded-xl bg-slate-900/80 p-2.5 transition hover:bg-slate-900"
          >
            <img
              src={
                studentProfile.avatar_url ||
                "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=128&q=80"
              }
              alt={studentProfile.full_name}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-500/40"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="truncate text-xs font-semibold text-white">
                  {studentProfile.full_name}
                </p>
                <VerifiedPersonBadge
                  verified={studentProfile.is_verified_identity}
                  compact
                />
              </div>
              <p className="truncate text-[11px] text-slate-400">
                Verificación y Metas
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-[56px] w-full items-center justify-between border-b border-slate-800/80 bg-[#0a0a0a]/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <Link
            href="/student"
            className="flex items-center gap-2 lg:hidden"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950">
              <Flame className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-white">
              MiGym<span className="text-emerald-400">Brou</span>
            </span>
          </Link>

          <div className="hidden lg:block">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Hola,</span>
              <span className="font-semibold text-white">
                {studentProfile.full_name}
              </span>
              <VerifiedPersonBadge
                verified={studentProfile.is_verified_identity}
                compact
              />
              <span>—</span>
              <span className="text-emerald-400">
                {studentProfile.fitness_goal}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDemoMode && (
              <Link
                href="/coach"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 lg:hidden"
              >
                Coach
              </Link>
            )}

            <button
              type="button"
              onClick={() => resetOnboarding("student")}
              aria-label="Abrir tutorial guiado"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#121212] text-slate-400 transition hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            <Link
              href="/student/notifications"
              aria-label="Notificaciones"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#121212] text-slate-300 transition hover:border-cyan-500/40 hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-slate-950">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              href="/student/profile"
              aria-label="Mi Perfil y Metas"
              className="rounded-full ring-2 ring-emerald-500/40 transition hover:ring-cyan-400"
            >
              <img
                src={
                  studentProfile.avatar_url ||
                  "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=128&q=80"
                }
                alt={studentProfile.full_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-4xl flex-1 px-4 py-5 pb-safe-nav lg:px-8 lg:py-8 lg:pb-10">
          {children}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav
          aria-label="Navegación Alumno"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/90 bg-[#121212]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 px-1 py-1.5">
            {STUDENT_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-semibold transition ${
                    active ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div
                    className={`rounded-lg p-1 transition ${
                      active ? "bg-emerald-500/15" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
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

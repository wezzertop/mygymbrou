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
import { SanctionNoticeBanner } from "@/components/SanctionNoticeBanner";
import { FreeTierAdSlot } from "@/components/FreeTierAdSlot";

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
    <div className="min-h-screen w-full overflow-x-clip bg-[#060607] text-zinc-100 lg:flex">
      <OnboardingTour role="student" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-white/[0.06] lg:bg-[#09090b]">
        <div className="flex h-16 items-center border-b border-white/[0.06] px-5">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Dumbbell className="h-4 w-4 stroke-[2.25]" />
            </span>
            <div className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-white">
                MiGym<span className="text-emerald-400">Brou</span>
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                App Alumno
              </span>
            </div>
          </Link>
        </div>

        <nav aria-label="Menú principal Alumno" className="flex-1 space-y-1 px-3 py-5">
          {STUDENT_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    active ? "text-emerald-400" : "text-zinc-500"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="space-y-1 pt-5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Agenda y Cuenta
            </p>
            <Link
              href="/student/calendar"
              aria-current={isActive("/student/calendar") ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                isActive("/student/calendar")
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <CalendarDays
                className={`h-[18px] w-[18px] ${
                  isActive("/student/calendar") ? "text-emerald-400" : "text-zinc-500"
                }`}
              />
              <span>Calendario</span>
            </Link>
            <Link
              href="/student/appointments"
              aria-current={isActive("/student/appointments") ? "page" : undefined}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                isActive("/student/appointments")
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <CalendarCheck
                  className={`h-[18px] w-[18px] ${
                    isActive("/student/appointments") ? "text-emerald-400" : "text-zinc-500"
                  }`}
                />
                Mis Citas
              </span>
              {upcomingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-semibold tabular-nums text-zinc-200">
                  {upcomingCount}
                </span>
              )}
            </Link>
            <Link
              href="/student/subscription"
              aria-current={isActive("/student/subscription") ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                isActive("/student/subscription")
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <CreditCard
                className={`h-[18px] w-[18px] ${
                  isActive("/student/subscription") ? "text-emerald-400" : "text-zinc-500"
                }`}
              />
              <span>Mi Plan</span>
            </Link>
            <Link
              href="/student/coaches"
              aria-current={isActive("/student/coaches") ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                isActive("/student/coaches")
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <Search
                className={`h-[18px] w-[18px] ${
                  isActive("/student/coaches") ? "text-emerald-400" : "text-zinc-500"
                }`}
              />
              <span>Buscar Coach</span>
            </Link>
            <Link
              href="/student/notifications"
              aria-current={isActive("/student/notifications") ? "page" : undefined}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                isActive("/student/notifications")
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell
                  className={`h-[18px] w-[18px] ${
                    isActive("/student/notifications") ? "text-emerald-400" : "text-zinc-500"
                  }`}
                />
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-zinc-950">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        <div className="space-y-3 border-t border-white/[0.06] p-4">
          {isDemoMode && (
            <Link
              href="/coach"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
              Ir al Panel Coach
            </Link>
          )}
          <Link
            href="/student/profile"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-white/15 hover:bg-white/[0.05]"
          >
            <img
              src={
                studentProfile.avatar_url ||
                "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=128&q=80"
              }
              alt={studentProfile.full_name}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15"
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
              <p className="truncate text-[11px] text-zinc-500">
                Metas y Perfil
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-[56px] w-full items-center justify-between border-b border-white/[0.06] bg-[#060607]/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
          <Link href="/student" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Dumbbell className="h-4 w-4 stroke-[2.25]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              MiGym<span className="text-emerald-400">Brou</span>
            </span>
          </Link>

          <div className="hidden lg:block">
            <p className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span>Hola,</span>
              <span className="font-semibold text-white">
                {studentProfile.full_name}
              </span>
              <VerifiedPersonBadge
                verified={studentProfile.is_verified_identity}
                compact
              />
              {studentProfile.fitness_goal && (
                <>
                  <span>·</span>
                  <span className="text-emerald-400">
                    {studentProfile.fitness_goal}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDemoMode && (
              <Link
                href="/coach"
                className="inline-flex h-8 items-center whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-medium text-zinc-300 lg:hidden"
              >
                Coach
              </Link>
            )}

            <button
              type="button"
              onClick={() => resetOnboarding("student")}
              aria-label="Abrir tutorial guiado"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:text-white"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            <Link
              href="/student/notifications"
              aria-label="Notificaciones"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:border-white/25 hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-zinc-950">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              href="/student/profile"
              aria-label="Mi Perfil y Metas"
              className="rounded-full ring-1 ring-white/20 transition hover:ring-white/40"
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

        <main className="mx-auto w-full min-w-0 max-w-4xl flex-1 px-4 py-6 pb-safe-nav lg:px-8 lg:py-8 lg:pb-12">
          <SanctionNoticeBanner profile={studentProfile} />
          {children}
          <FreeTierAdSlot variant="banner_320x50" viewerRole="student" />
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav
          aria-label="Navegación Alumno"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#09090b]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
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
                  className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition ${
                    active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <div className="p-1">
                    <Icon
                      className={`h-5 w-5 ${
                        active ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    />
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

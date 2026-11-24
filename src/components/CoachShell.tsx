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
import { SanctionNoticeBanner } from "@/components/SanctionNoticeBanner";
import { FreeTierAdSlot } from "@/components/FreeTierAdSlot";

const COACH_NAV = [
  { href: "/coach", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/coach/students", label: "Alumnos", icon: Users },
  { href: "/coach/workouts", label: "Rutinas", fullLabel: "Rutinas", icon: Dumbbell },
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
    <div className="min-h-screen w-full overflow-x-clip bg-[#060607] text-zinc-100 lg:flex">
      <OnboardingTour role="coach" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-white/[0.06] lg:bg-[#09090b]">
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Dumbbell className="h-4 w-4 stroke-[2.25]" />
            </span>
            <div className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-white">
                MiGym<span className="text-emerald-400">Brou</span>
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                Panel Coach
              </span>
            </div>
          </Link>
        </div>

        <nav aria-label="Menú principal Coach" className="flex-1 space-y-1 px-3 py-5">
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
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      active ? "text-emerald-400" : "text-zinc-500"
                    }`}
                  />
                  <span>{item.fullLabel || item.label}</span>
                </span>
                {badgeCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-semibold tabular-nums text-zinc-200">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="space-y-1 pt-5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Gestión
            </p>
            <Link
              href="/coach/calendar"
              aria-current={isActive("/coach/calendar") ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                isActive("/coach/calendar")
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <CalendarDays
                className={`h-[18px] w-[18px] ${
                  isActive("/coach/calendar") ? "text-emerald-400" : "text-zinc-500"
                }`}
              />
              <span>Calendario</span>
            </Link>
            <Link
              href="/coach/profile"
              aria-current={isActive("/coach/profile") ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                isActive("/coach/profile")
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <UserCircle2
                className={`h-[18px] w-[18px] ${
                  isActive("/coach/profile") ? "text-emerald-400" : "text-zinc-500"
                }`}
              />
              <span>Perfil y Diplomas</span>
            </Link>
            <button
              type="button"
              onClick={() => resetOnboarding("coach")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
            >
              <HelpCircle className="h-[18px] w-[18px] text-zinc-500" />
              <span>Tutorial Guiado</span>
            </button>
          </div>
        </nav>

        <div className="space-y-3 border-t border-white/[0.06] p-4">
          {isDemoMode && (
            <Link
              href="/student"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              Ver App Alumno
            </Link>
          )}
          <Link
            href="/coach/profile"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-white/15 hover:bg-white/[0.05]"
          >
            <img
              src={
                coachProfile.avatar_url ||
                "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=128&q=80"
              }
              alt={coachProfile.full_name}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15"
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
              <p className="truncate text-[11px] text-zinc-500">
                {coachProfile.brand_name || "Coach"}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:pl-64">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 flex min-h-[56px] w-full items-center justify-between border-b border-white/[0.06] bg-[#060607]/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
          <Link href="/coach" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Dumbbell className="h-4 w-4 stroke-[2.25]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              MiGym<span className="text-emerald-400">Brou</span>
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              Coach
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {isDemoMode && (
              <Link
                href="/student"
                className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-medium text-zinc-300"
              >
                Alumno
              </Link>
            )}
            <button
              type="button"
              onClick={() => resetOnboarding("coach")}
              aria-label="Abrir tutorial guiado"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:text-white"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <Link
              href="/coach/profile"
              aria-label="Perfil Coach"
              className="rounded-full ring-1 ring-white/20"
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

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 pb-safe-nav lg:px-8 lg:py-8 lg:pb-12">
          <SanctionNoticeBanner profile={coachProfile} />
          {children}
          {pathname !== "/coach" && (
            <FreeTierAdSlot viewerRole="coach" className="mt-8" />
          )}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav
          aria-label="Navegación Coach"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#09090b]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
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
                  className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition ${
                    active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <div className="relative p-1">
                    <Icon
                      className={`h-5 w-5 ${
                        active ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    />
                    {badgeCount > 0 && (
                      <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-zinc-950">
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

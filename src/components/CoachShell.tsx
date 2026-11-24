"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Dumbbell,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Smartphone,
  UserCircle2,
  Users,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { VerifiedPersonBadge } from "@/components/VerificationBadge";
import { OnboardingTour } from "@/components/OnboardingTour";
import { SanctionNoticeBanner } from "@/components/SanctionNoticeBanner";
import { FreeTierAdSlot } from "@/components/FreeTierAdSlot";
import { SmartNotificationsCenter } from "@/components/SmartNotificationsCenter";
import { PwaInstallButton } from "@/components/PwaInstallPrompt";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { CoachQuickActionsFab } from "@/components/CoachQuickActionsFab";
import { CoachVerificationGraceBanner } from "@/components/CoachVerificationGraceBanner";

const COACH_NAV = [
  { href: "/coach", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/coach/students", label: "Alumnos", icon: Users },
  { href: "/coach/workouts", label: "Rutinas", fullLabel: "Rutinas", icon: Dumbbell },
  { href: "/coach/agenda", label: "Agenda", fullLabel: "Agenda de Citas", icon: CalendarCheck },
  { href: "/coach/plans", label: "Planes", fullLabel: "Planes y Dietas", icon: CreditCard },
];

export function CoachShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const {
    coachProfile,
    students,
    appointments,
    coachInquiries,
    isDemoMode,
    authUserId,
    resetOnboarding,
    signOut,
  } = useApp();

  const isDemoView = isDemoMode || !authUserId;

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/auth");
    } finally {
      setSigningOut(false);
    }
  };

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
              <span
                className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  isDemoView ? "text-amber-400" : "text-zinc-500"
                }`}
              >
                {isDemoView ? "Demo Coach" : "Panel Coach"}
              </span>
            </div>
          </Link>
          <SmartNotificationsCenter role="coach" />
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
            <PwaInstallButton variant="sidebar" />
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
          <button
            type="button"
            disabled={signingOut}
            onClick={handleLogout}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-xs font-medium text-zinc-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {signingOut
              ? "Saliendo..."
              : isDemoView
              ? "Salir de la Demo"
              : "Cerrar sesión"}
          </button>
          <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-zinc-500">
            <Link href="/terminos" className="transition hover:text-zinc-300">
              Términos
            </Link>
            <span>·</span>
            <Link href="/privacidad" className="transition hover:text-zinc-300">
              Privacidad
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:pl-64">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 flex min-h-[56px] w-full items-center justify-between gap-3 border-b border-white/[0.06] bg-[#060607]/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
          <Link href="/coach" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Dumbbell className="h-4 w-4 stroke-[2.25]" />
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight text-white">
              MiGym<span className="text-emerald-400">Brou</span>
            </span>
            {isDemoView && (
              <span className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                DEMO
              </span>
            )}
          </Link>

          <div className="flex shrink-0 items-center gap-2.5">
            <SmartNotificationsCenter role="coach" />

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((o) => !o)}
                aria-label="Menú de cuenta Coach"
                aria-expanded={accountMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-white/20 transition hover:ring-emerald-400/60"
              >
                <img
                  src={
                    coachProfile.avatar_url ||
                    "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=128&q=80"
                  }
                  alt={coachProfile.full_name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              </button>

              {accountMenuOpen && (
                <>
                  <div
                    aria-hidden="true"
                    onClick={() => setAccountMenuOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#0e0f12] p-1.5 shadow-2xl">
                    <div className="border-b border-white/[0.06] px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-white">
                          {coachProfile.full_name}
                        </p>
                        <VerifiedPersonBadge
                          verified={coachProfile.is_verified_identity}
                          compact
                        />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                        {isDemoView ? "Demo Coach" : "Panel Coach"}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/coach/profile"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06]"
                      >
                        <UserCircle2 className="h-4 w-4 text-emerald-400" />
                        Perfil y Diplomas
                      </Link>
                      <Link
                        href="/coach/calendar"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06]"
                      >
                        <CalendarDays className="h-4 w-4 text-zinc-400" />
                        Calendario
                      </Link>
                      <PwaInstallButton variant="menu" />
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          resetOnboarding("coach");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06]"
                      >
                        <HelpCircle className="h-4 w-4 text-zinc-400" />
                        Tutorial guiado
                      </button>
                      {isDemoMode && (
                        <Link
                          href="/student"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06]"
                        >
                          <Smartphone className="h-4 w-4 text-emerald-400" />
                          Ver App Alumno
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-white/[0.06] pt-1">
                      <button
                        type="button"
                        disabled={signingOut}
                        onClick={() => {
                          setAccountMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {signingOut
                          ? "Saliendo..."
                          : isDemoView
                          ? "Salir de la Demo"
                          : "Cerrar sesión"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 pb-safe-nav lg:px-8 lg:py-8 lg:pb-12">
          {isDemoView && <DemoModeBanner role="coach" />}
          <SanctionNoticeBanner profile={coachProfile} />
          <CoachVerificationGraceBanner>{children}</CoachVerificationGraceBanner>
          {pathname !== "/coach" && (
            <FreeTierAdSlot viewerRole="coach" className="mt-8" />
          )}
        </main>

        {/* Global High-Impact Coach Floating Action Button */}
        <CoachQuickActionsFab />

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

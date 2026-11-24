"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  Flame,
  X,
} from "lucide-react";
import { getDaysRemaining, useApp } from "@/context/AppContext";

interface SmartAlert {
  id: string;
  title: string;
  message: string;
  href: string;
  kind: "payment" | "appointment" | "progress" | "daily";
  isSmart: true;
}

export function SmartNotificationsCenter({
  role,
}: {
  role: "coach" | "student";
}) {
  const {
    coachProfile,
    studentProfile,
    students,
    appointments,
    assessments,
    workoutLogs,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [seenAlertIds, setSeenAlertIds] = useState<string[]>([]);

  const userId = role === "coach" ? coachProfile.id : studentProfile.id;
  const seenStorageKey = `migymbrou_seen_alerts_${role}_${userId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(seenStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSeenAlertIds(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, [seenStorageKey]);
  const userDbNotifications = useMemo(
    () => notifications.filter((n) => n.user_id === userId),
    [notifications, userId]
  );

  // Alertas proactivas generadas en tiempo real según el estado de pagos, citas y progreso
  const smartAlerts = useMemo<SmartAlert[]>(() => {
    const alerts: SmartAlert[] = [];
    const todayIso = new Date().toISOString().split("T")[0];

    if (role === "student") {
      // 1. Aviso de pago / suscripción hacia el Coach
      const relation = students.find((s) => s.student_id === studentProfile.id);
      if (relation) {
        const daysLeft = getDaysRemaining(
          relation.expires_at || relation.next_billing_date
        );
        if (
          relation.subscription_status === "expired" ||
          relation.subscription_status === "pending_payment" ||
          (daysLeft <= 5 && daysLeft >= -30)
        ) {
          alerts.push({
            id: "smart-student-payment",
            kind: "payment",
            title:
              daysLeft <= 0
                ? "Tu plan con tu Coach requiere renovación"
                : `Tu plan vence en ${daysLeft} día(s)`,
            message: `Revisa tu membresía "${relation.subscription_plan_name}" para mantener acceso continuo.`,
            href: "/student/subscription",
            isSmart: true,
          });
        }
      }

      // 2. Próxima cita programada
      const nextApt = appointments
        .filter(
          (a) => a.student_id === studentProfile.id && a.status === "scheduled"
        )
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
      if (nextApt) {
        alerts.push({
          id: `smart-student-apt-${nextApt.id}`,
          kind: "appointment",
          title: `Próxima cita: ${nextApt.title}`,
          message: `${new Date(nextApt.scheduled_at).toLocaleString("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
          })} · ${nextApt.location_or_link}`,
          href: "/student/appointments",
          isSmart: true,
        });
      }

      // 3. Recordatorio de avance del día (entrenamiento)
      const trainedToday = workoutLogs.some(
        (l) =>
          l.student_id === studentProfile.id && l.completed_date === todayIso
      );
      if (!trainedToday) {
        alerts.push({
          id: "smart-student-daily",
          kind: "daily",
          title: "Registra tu avance de hoy",
          message:
            "Aún no marcas tu sesión o comidas de hoy. Mantén viva tu racha diaria.",
          href: "/student",
          isSmart: true,
        });
      }

      // 4. Recordatorio de progreso semanal (peso/medidas)
      const latestAssess = assessments
        .filter((a) => a.student_id === studentProfile.id)
        .sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))[0];
      const daysSinceAssess = latestAssess
        ? Math.floor(
            (Date.now() - new Date(latestAssess.assessment_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 99;
      if (daysSinceAssess >= 7) {
        alerts.push({
          id: "smart-student-progress",
          kind: "progress",
          title: "Actualiza tu check-in semanal",
          message:
            "Registra tu peso actual para actualizar tus gráficas de evolución.",
          href: "/student/progress",
          isSmart: true,
        });
      }
    } else {
      // COACH ALERTS
      // 1. Pagos de alumnos por vencer o vencidos
      const expiringStudents = students.filter((s) => {
        if (s.invite_status !== "active") return false;
        const days = getDaysRemaining(s.expires_at || s.next_billing_date);
        return (
          s.subscription_status === "expired" ||
          s.subscription_status === "pending_payment" ||
          days <= 5
        );
      });
      if (expiringStudents.length > 0) {
        alerts.push({
          id: "smart-coach-student-payments",
          kind: "payment",
          title: `${expiringStudents.length} alumno(s) con pago por vencer o vencido`,
          message: `Revisa y renueva la membresía de ${expiringStudents
            .slice(0, 2)
            .map((s) => s.invited_name)
            .join(", ")}.`,
          href: "/coach/students",
          isSmart: true,
        });
      }

      // 2. Próxima cita en agenda
      const nextApt = appointments
        .filter((a) => a.status === "scheduled")
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
      if (nextApt) {
        alerts.push({
          id: `smart-coach-apt-${nextApt.id}`,
          kind: "appointment",
          title: `Cita próxima con ${nextApt.student_name}`,
          message: `${nextApt.title} · ${new Date(
            nextApt.scheduled_at
          ).toLocaleString("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
          })}`,
          href: "/coach/agenda",
          isSmart: true,
        });
      }

      // 3. Invitaciones pendientes de confirmar por el alumno
      const pendingInvites = students.filter(
        (s) => s.invite_status === "pending"
      );
      if (pendingInvites.length > 0) {
        alerts.push({
          id: "smart-coach-pending-invites",
          kind: "daily",
          title: `${pendingInvites.length} invitación(es) esperando confirmación`,
          message:
            "Aparecerán en Alumnos Activos en cuanto completen su registro.",
          href: "/coach/students",
          isSmart: true,
        });
      }

      // 4. Plan de suscripción del Coach
      if ((coachProfile.saas_plan_tier || "free") === "free") {
        alerts.push({
          id: "smart-coach-saas",
          kind: "payment",
          title: "Plan Inicio / Free activo",
          message:
            "Actualiza a Coach Base ($449 MXN) para quitar anuncios y desbloquear citas y plantillas ilimitadas.",
          href: "/coach/plans?tab=saas",
          isSmart: true,
        });
      }
    }

    return alerts;
  }, [
    role,
    students,
    studentProfile.id,
    coachProfile.saas_plan_tier,
    appointments,
    workoutLogs,
    assessments,
  ]);

  const unreadDbCount = userDbNotifications.filter((n) => !n.is_read).length;
  const unreadSmartCount = smartAlerts.filter(
    (a) => !seenAlertIds.includes(a.id)
  ).length;
  const totalBadge = unreadDbCount + unreadSmartCount;

  const handleToggleOpen = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      if (unreadDbCount > 0) {
        markAllNotificationsRead(userId);
      }
      if (smartAlerts.length > 0) {
        const merged = Array.from(
          new Set([...seenAlertIds, ...smartAlerts.map((a) => a.id)])
        );
        setSeenAlertIds(merged);
        try {
          window.localStorage.setItem(seenStorageKey, JSON.stringify(merged));
        } catch {
          // ignore storage errors
        }
      }
    }
  };

  const renderIcon = (kind: SmartAlert["kind"]) => {
    if (kind === "payment")
      return <CreditCard className="h-4 w-4 text-amber-400" />;
    if (kind === "appointment")
      return <CalendarCheck className="h-4 w-4 text-emerald-400" />;
    if (kind === "progress")
      return <Activity className="h-4 w-4 text-emerald-400" />;
    return <Flame className="h-4 w-4 text-emerald-400" />;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label="Centro de notificaciones"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:border-white/25 hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {totalBadge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-zinc-950">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-label="Notificaciones"
            className="fixed inset-x-3 top-16 z-50 mx-auto max-h-[78vh] w-auto max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0e0f12] shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Notificaciones y Recordatorios
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Pagos, citas, progreso y actividad diaria
                </p>
              </div>
              <div className="flex items-center gap-1">
                {unreadDbCount > 0 && userId && (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead(userId)}
                    title="Marcar todas como leídas"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-emerald-400"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar notificaciones"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[62vh] divide-y divide-white/[0.06] overflow-y-auto">
              {/* Smart Proactive Alerts */}
              {smartAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-white/[0.03]"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#060607]">
                    {renderIcon(alert.kind)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">
                      {alert.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                      {alert.message}
                    </p>
                  </div>
                </Link>
              ))}

              {/* Database Notifications */}
              {userDbNotifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03] ${
                    !n.is_read ? "bg-emerald-500/[0.04]" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      !n.is_read ? "bg-emerald-400" : "bg-zinc-700"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white">{n.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                      {n.message}
                    </p>
                  </div>
                </button>
              ))}

              {smartAlerts.length === 0 && userDbNotifications.length === 0 && (
                <p className="py-10 text-center text-xs text-zinc-500">
                  Todo al día. No tienes notificaciones pendientes.
                </p>
              )}
            </div>

            {role === "student" && (
              <div className="border-t border-white/[0.08] px-4 py-2.5 text-center">
                <Link
                  href="/student/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs font-medium text-emerald-400 hover:underline"
                >
                  Ver historial completo →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

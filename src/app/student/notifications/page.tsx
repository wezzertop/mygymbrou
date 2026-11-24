"use client";

import React from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Calendar,
  CheckCheck,
  CreditCard,
  Dumbbell,
  Inbox,
  Target,
  Utensils,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NotificationType } from "@/types/database";

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  assessment: Activity,
  workout: Dumbbell,
  diet: Utensils,
  appointment: Calendar,
  subscription: CreditCard,
  goal: Target,
  verification: BadgeCheck,
  inquiry: Inbox,
};

export default function StudentNotificationsPage() {
  const {
    studentProfile,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const myNotifs = notifications.filter((n) => n.user_id === studentProfile.id);
  const unreadCount = myNotifs.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Notificaciones</h1>
          <p className="text-xs text-zinc-400">
            Avisos de tu coach sobre rutinas, dietas, evaluaciones y citas.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllNotificationsRead(studentProfile.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="space-y-3">
        {myNotifs.map((n) => {
          const Icon = TYPE_ICON[n.type] || Bell;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => markNotificationRead(n.id)}
              className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition ${
                n.is_read
                  ? "border-white/[0.08] bg-[#0e0f12] opacity-80"
                  : "border-cyan-500/40 bg-[#0e0f12] shadow-lg shadow-cyan-950/20"
              }`}
            >
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  n.is_read
                    ? "bg-white/[0.06] text-zinc-400"
                    : "bg-cyan-500/15 text-cyan-400"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">{n.title}</p>
                  {!n.is_read && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
                  )}
                </div>
                <p className="text-xs leading-relaxed text-zinc-300">
                  {n.message}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {new Date(n.created_at).toLocaleString("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </button>
          );
        })}

        {myNotifs.length === 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-8 text-center text-sm text-zinc-400">
            No tienes notificaciones por ahora.
          </div>
        )}
      </div>
    </div>
  );
}

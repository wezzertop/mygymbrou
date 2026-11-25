"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, UserPlus, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

export interface PendingCoachInviteItem {
  id: string;
  coach_id: string;
  coach_name: string;
  coach_brand: string;
  invite_token: string;
  plan_name: string;
  plan_price: number;
  goals: string[];
  created_at: string;
}

export function PendingCoachInvitesBanner({
  compact = false,
  onAccepted,
}: {
  compact?: boolean;
  onAccepted?: () => void;
}) {
  const {
    students,
    studentProfile,
    isDemoMode,
    acceptCoachInvite,
    declineCoachInvite,
  } = useApp();

  const [invites, setInvites] = useState<PendingCoachInviteItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInvites() {
      if (isDemoMode) {
        const demoPending = students
          .filter(
            (s) =>
              s.invite_status === "pending_acceptance" &&
              (s.student_id === studentProfile.id ||
                s.invited_email.toLowerCase() ===
                  studentProfile.email.toLowerCase())
          )
          .map((s) => ({
            id: s.id,
            coach_id: s.coach_id,
            coach_name: s.coach_name || "Coach MiGymBrou",
            coach_brand: s.coach_brand || "MiGymBrou",
            invite_token: s.invite_token,
            plan_name: s.subscription_plan_name,
            plan_price: s.subscription_price,
            goals: s.initial_goals || [],
            created_at: s.created_at,
          }));
        if (active) setInvites(demoPending);
        return;
      }

      try {
        const res = await fetch("/api/students/accept-invite?mine=true");
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.pendingInvites)) {
            setInvites(data.pendingInvites);
          }
        }
      } catch {
        // ignore network errors
      }
    }

    loadInvites();
    return () => {
      active = false;
    };
  }, [isDemoMode, students, studentProfile.id, studentProfile.email]);

  const handleAction = async (
    invite: PendingCoachInviteItem,
    action: "accept" | "decline"
  ) => {
    setBusyId(invite.id);
    const ok =
      action === "accept"
        ? await acceptCoachInvite(invite.id)
        : await declineCoachInvite(invite.id);
    setBusyId(null);

    if (ok) {
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      setFeedback(
        action === "accept"
          ? `¡Invitación aceptada! Ya tienes activo tu expediente independiente con ${invite.coach_name}.`
          : `Invitación de ${invite.coach_name} declinada.`
      );
      if (action === "accept" && onAccepted) {
        onAccepted();
      }
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  if (invites.length === 0 && !feedback) return null;

  return (
    <div className="space-y-2.5">
      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-[#00FF90]/40 bg-[#00FF90]/10 px-4 py-3 text-xs font-semibold text-[#00FF90]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {invites.map((inv) => (
        <div
          key={inv.id}
          className={`rounded-xl border border-[#00FF90]/35 bg-gradient-to-br from-[#00FF90]/[0.09] via-[#0e0f12] to-[#0e0f12] ${
            compact ? "p-3.5" : "p-4 sm:p-5"
          }`}
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#00FF90]/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#00FF90]">
                  <UserPlus className="h-3 w-3" />
                  Invitación de Coach
                </span>
                <span className="text-[11px] text-zinc-400">
                  {inv.coach_brand}
                </span>
              </div>

              <p className="text-sm font-bold text-white">
                {inv.coach_name} te invitó a entrenar en MiGymBrou
              </p>

              <p className="text-xs text-zinc-300">
                Paquete:{" "}
                <strong className="text-[#00FF90]">{inv.plan_name}</strong>
                {inv.plan_price > 0 ? ` ($${inv.plan_price} MXN)` : ""}
              </p>

              {inv.goals.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {inv.goals.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-white/10 bg-[#060607] px-2 py-0.5 text-[10px] font-medium text-zinc-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {!compact && (
                <p className="flex items-center gap-1 pt-1 text-[11px] text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#00FF90]" />
                  Tu expediente con este coach será 100% independiente y privado.
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={busyId === inv.id}
                onClick={() => handleAction(inv, "accept")}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#00FF90] px-4 text-xs font-extrabold text-zinc-950 transition hover:bg-[#48b73d] disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {busyId === inv.id ? "Aceptando..." : "Aceptar invitación"}
              </button>
              <button
                type="button"
                disabled={busyId === inv.id}
                onClick={() => handleAction(inv, "decline")}
                aria-label="Rechazar invitación"
                className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-zinc-300 transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" />
                {!compact && "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

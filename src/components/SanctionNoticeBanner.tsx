"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Ban, Clock, LogOut } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Profile } from "@/types/database";

export function SanctionNoticeBanner({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { signOut } = useApp();

  const status = profile.account_status || "active";
  if (status === "active") return null;

  // Si la suspensión temporal ya expiró, no bloquear
  if (
    status === "suspended" &&
    profile.suspended_until &&
    new Date(profile.suspended_until).getTime() <= Date.now()
  ) {
    return null;
  }

  if (status === "warned") {
    return (
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-xs text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">
            Advertencia formal en tu cuenta
          </p>
          <p className="leading-relaxed text-amber-200/90">
            {profile.suspension_reason ||
              "El equipo de moderación registró un aviso en tu perfil. Revisa las normas de la comunidad."}
          </p>
        </div>
      </div>
    );
  }

  // Pantalla bloqueante para Suspensión Temporal o Baneo Indefinido
  const isBanned = status === "banned";
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-rose-500/30 bg-[#0e0f12] p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
          {isBanned ? <Ban className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-white">
            {isBanned
              ? "Cuenta suspendida indefinidamente"
              : "Cuenta suspendida temporalmente"}
          </h2>
          <p className="text-xs text-zinc-400">
            El acceso a tu cuenta ha sido restringido por moderación.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#060607] p-4 text-left text-xs text-zinc-300">
          <p className="font-semibold text-rose-300">Motivo registrado:</p>
          <p className="mt-1 leading-relaxed">
            {profile.suspension_reason ||
              "Incumplimiento de los términos de uso de la plataforma."}
          </p>
          {!isBanned && profile.suspended_until && (
            <p className="mt-2.5 text-[11px] text-zinc-400">
              Reactivación estimada:{" "}
              <span className="font-semibold text-white">
                {new Date(profile.suspended_until).toLocaleString("es-MX", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/auth");
          }}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

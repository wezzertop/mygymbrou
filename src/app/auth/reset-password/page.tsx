"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Capturar sesión implícita (#access_token=...&refresh_token=...) si Supabase redirigió con fragmento hash
  useEffect(() => {
    if (typeof window === "undefined" || !isSupabaseConfigured()) return;
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token=")) return;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const supabase = createClient();
    supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(() => {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`
        );
      })
      .catch(() => {
        setError("El enlace de recuperación expiró. Solicita uno nuevo.");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: updateErr } = await supabase.auth.updateUser({
          password,
          data: { password_set: true },
        });
        if (updateErr) {
          setError(updateErr.message);
          setLoading(false);
          return;
        }
      }
      setDone(true);
    } catch {
      setError("Error al actualizar contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060607] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 shadow-2xl sm:p-8">
        {done ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">
              Contraseña actualizada
            </h1>
            <p className="text-sm text-zinc-300">
              Tu nueva contraseña se guardó correctamente. Ya puedes iniciar
              sesión.
            </p>
            <Link
              href="/auth"
              className="inline-block w-full rounded-xl bg-white hover:bg-zinc-200 py-3 text-sm font-bold text-zinc-950"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-white">
              Nueva Contraseña
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Elige una contraseña segura para tu cuenta en MiGymBrou.
            </p>
            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border border-white/15 bg-[#060607] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Actualizar Contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

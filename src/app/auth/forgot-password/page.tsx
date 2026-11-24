"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { createClient, getAppUrl, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const demoMode =
    !isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${getAppUrl()}/auth/callback?next=/auth/reset-password`,
          }
        );
        if (resetErr) {
          setError(resetErr.message);
          setLoading(false);
          return;
        }
      }
      setSent(true);
    } catch {
      setError("No pudimos enviar el correo de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060607] px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>

        <div className="rounded-3xl border border-white/[0.08] bg-[#0e0f12] p-6 shadow-2xl sm:p-8">
          {sent ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-white">
                Enlace de recuperación enviado
              </h1>
              <p className="text-sm text-zinc-300">
                Si existe una cuenta asociada a{" "}
                <span className="font-semibold text-cyan-400">{email}</span>,
                recibirás un correo para definir una nueva contraseña.
              </p>
              <Link
                href={demoMode ? "/auth/reset-password" : "/auth"}
                className="inline-block rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-cyan-400"
              >
                {demoMode ? "Simular apertura de enlace (Demo)" : "Volver a Iniciar Sesión"}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-white">
                Recuperar Contraseña
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Ingresa tu correo de Coach o Alumno y te enviaremos un enlace
                seguro vía Supabase Auth.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full rounded-xl border border-white/15 bg-[#060607] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-full bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

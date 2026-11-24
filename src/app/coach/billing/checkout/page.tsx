"use client";

import React, { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  Landmark,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getSaasPlanById,
  SAAS_PLANS_MXN,
  SaasPlanTier,
} from "@/lib/saas-plans";
import { createClient } from "@/lib/supabase/client";

const SPEI_BANK =
  process.env.NEXT_PUBLIC_SPEI_BANK || "BBVA / STP (Cuenta Oficial MiGymBrou)";
const SPEI_BENEFICIARY =
  process.env.NEXT_PUBLIC_SPEI_BENEFICIARY || "MiGymBrou México";
const SPEI_CLABE =
  process.env.NEXT_PUBLIC_SPEI_CLABE || "0121 8001 5544 3322 11";

const PAID_PLANS = SAAS_PLANS_MXN.filter((p) => p.id !== "free");

function SpeiCheckoutContent() {
  const searchParams = useSearchParams();
  const { coachProfile, authUserId, isDemoMode } = useApp();

  const initialPlanParam = searchParams.get("plan") as SaasPlanTier | null;
  const initialPlan: "base" | "pro" | "studio" =
    initialPlanParam === "base" ||
    initialPlanParam === "pro" ||
    initialPlanParam === "studio"
      ? initialPlanParam
      : "pro";

  const [selectedTier, setSelectedTier] = useState<"base" | "pro" | "studio">(
    initialPlan
  );
  const [coachName, setCoachName] = useState(
    searchParams.get("name") || coachProfile.full_name || ""
  );
  const [coachEmail, setCoachEmail] = useState(
    searchParams.get("email") || coachProfile.email || ""
  );
  const [transferRef, setTransferRef] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [acceptedBillingTerms, setAcceptedBillingTerms] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const plan = getSaasPlanById(selectedTier);

  const rawNetParam = Number(searchParams.get("net"));
  const rawCreditParam = Number(searchParams.get("credit"));
  const rawDaysParam = Number(searchParams.get("days"));
  const hasUpgradeCredit =
    selectedTier === initialPlan &&
    !Number.isNaN(rawCreditParam) &&
    rawCreditParam > 0 &&
    !Number.isNaN(rawNetParam) &&
    rawNetParam >= 0;
  const payableAmountMxn = hasUpgradeCredit ? rawNetParam : plan.priceMxn;

  const handleCopyClabe = () => {
    const cleanClabe = SPEI_CLABE.replace(/\s+/g, "");
    navigator.clipboard?.writeText(cleanClabe);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("El comprobante supera el límite de 8 MB.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!coachEmail.trim()) {
      setError("Ingresa el correo de tu cuenta de Coach.");
      return;
    }
    if (!previewUrl || !selectedFile) {
      setError("Sube tu comprobante de transferencia (imagen o PDF).");
      return;
    }

    setSubmitting(true);
    try {
      let receiptUrl = previewUrl;

      if (!isDemoMode) {
        const supabase = createClient();
        const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const folder = authUserId || coachEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
        const storagePath = `${folder}/spei-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("payment-receipts")
          .upload(storagePath, selectedFile, { upsert: true });

        if (!upErr) {
          const { data: pub } = supabase.storage
            .from("payment-receipts")
            .getPublicUrl(storagePath);
          if (pub?.publicUrl) {
            receiptUrl = pub.publicUrl;
          }
        }
      }

      const res = await fetch("/api/billing/payment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coach_name: coachName.trim() || coachEmail.split("@")[0],
          coach_email: coachEmail.trim().toLowerCase(),
          plan_tier: selectedTier,
          transfer_reference: transferRef.trim() || undefined,
          receipt_url: receiptUrl,
          receipt_name: selectedFile.name,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo registrar tu comprobante.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Error de conexión al enviar tu comprobante. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Activación de Plan · Transferencia SPEI
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            Completa tu pago por transferencia
          </h1>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Estamos en fase de pruebas sin pasarela automática. Realiza tu SPEI y sube tu comprobante para activar tu plan sin anuncios.
          </p>
        </div>

        <Link
          href="/coach/plans?tab=saas"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Planes
        </Link>
      </div>

      {submitted ? (
        <div className="space-y-5 rounded-xl border border-emerald-500/30 bg-[#0e0f12] p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-white">
              ¡Comprobante recibido correctamente!
            </h2>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Nuestro equipo de administración revisará tu transferencia de{" "}
              <strong className="text-white">
                {plan.priceLabel} {plan.period}
              </strong>{" "}
              para activar <strong className="text-emerald-400">{plan.name}</strong>{" "}
              en <span className="font-mono text-zinc-200">{coachEmail}</span>.
            </p>
          </div>
          <p className="text-[11px] text-zinc-500">
            Mientras se valida tu pago, puedes confirmar tu correo y empezar a usar tu panel en modo Inicio / Free.
          </p>
          <div className="flex flex-col justify-center gap-2.5 pt-2 sm:flex-row">
            <Link
              href="/coach"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Ir a mi Panel Coach
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-6 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:text-white"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT: Plan Picker + Bank SPEI Info */}
          <div className="space-y-5 lg:col-span-5">
            <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
              <p className="text-xs font-semibold text-zinc-300">
                1. Plan seleccionado
              </p>
              <div className="space-y-2">
                {PAID_PLANS.map((p) => {
                  const active = selectedTier === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setSelectedTier(p.id as "base" | "pro" | "studio")
                      }
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-emerald-500/60 bg-emerald-500/10"
                          : "border-white/[0.08] bg-[#060607] hover:border-white/20"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {p.studentLimitLabel} · 0% anuncios
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-white">
                        {p.priceLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SPEI Bank Details Card */}
            <div className="space-y-3.5 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-emerald-400" />
                <p className="text-xs font-semibold text-white">
                  2. Datos para Transferencia SPEI
                </p>
              </div>

              <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-[#060607] p-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">Banco</span>
                  <span className="font-medium text-white">{SPEI_BANK}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">Beneficiario</span>
                  <span className="font-medium text-white">
                    {SPEI_BENEFICIARY}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">
                    {hasUpgradeCredit ? "Monto neto hoy (con equivalencia)" : "Monto exacto"}
                  </span>
                  <span className="font-semibold tabular-nums text-emerald-400">
                    ${payableAmountMxn.toLocaleString("es-MX", { minimumFractionDigits: hasUpgradeCredit ? 2 : 0 })} MXN (IVA inc.)
                  </span>
                </div>
                {hasUpgradeCredit && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-2.5 text-[11px] text-emerald-200">
                    Precio {plan.name}: ${plan.priceMxn.toLocaleString("es-MX")} MXN · Crédito aplicado ({rawDaysParam} días restantes): -${rawCreditParam.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN.
                  </div>
                )}
                <div className="border-t border-white/[0.06] pt-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                    CLABE Interbancaria (18 dígitos)
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold tracking-wide text-white">
                      {SPEI_CLABE}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyClabe}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-3 text-[11px] font-medium text-white transition hover:bg-white/[0.1]"
                    >
                      {copiedClabe ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Copiada
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                En el concepto escribe tu nombre o correo de registro.
              </p>
            </div>
          </div>

          {/* RIGHT: Upload Receipt Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6 lg:col-span-7"
          >
            <div>
              <h2 className="text-base font-semibold text-white">
                3. Sube tu comprobante de pago
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                En cuanto nuestro equipo valide la transferencia, activaremos tu plan y quitaremos toda la publicidad.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Tu nombre
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Correo de tu cuenta Coach *
                </label>
                <input
                  type="email"
                  required
                  value={coachEmail}
                  onChange={(e) => setCoachEmail(e.target.value)}
                  placeholder="coach@tumarca.com"
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Clave de rastreo / Referencia SPEI (opcional)
              </label>
              <input
                type="text"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder="Ej. 20261124-BBVA-994821"
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Comprobante de transferencia (JPG, PNG, WEBP o PDF · máx. 8 MB) *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-[#060607] px-4 py-6 text-center transition hover:border-emerald-500/50 hover:bg-white/[0.02]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-400">
                  <Upload className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-white">
                  {selectedFile
                    ? selectedFile.name
                    : "Toca aquí para subir tu comprobante SPEI"}
                </p>
                <p className="text-[11px] text-zinc-500">
                  Captura de tu app bancaria o comprobante PDF
                </p>
              </button>

              {previewUrl && !previewUrl.startsWith("data:application/pdf") && (
                <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#060607] p-2">
                  <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-medium text-emerald-400">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Vista previa del comprobante
                  </p>
                  <img
                    src={previewUrl}
                    alt="Vista previa comprobante SPEI"
                    className="max-h-44 w-full rounded-lg object-contain"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Notas adicionales (opcional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Transferencia realizada desde cuenta a nombre de..."
                className="w-full rounded-xl border border-white/10 bg-[#060607] p-3 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/[0.08] bg-[#060607] p-3">
              <input
                type="checkbox"
                required
                checked={acceptedBillingTerms}
                onChange={(e) => setAcceptedBillingTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-emerald-500"
              />
              <span className="text-[11px] leading-relaxed text-zinc-300">
                Acepto los{" "}
                <Link
                  href="/terminos"
                  target="_blank"
                  className="font-semibold text-emerald-400 underline"
                >
                  Términos y Condiciones
                </Link>
                , incluyendo las reglas de equivalencia de días en upgrades y
                cambios al cierre de corte sin devolución en downgrades.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !acceptedBillingTerms}
              className="h-12 w-full rounded-full bg-emerald-500 text-sm font-bold text-[#0a0a0a] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting
                ? "Enviando comprobante..."
                : `Enviar comprobante ($${payableAmountMxn.toLocaleString("es-MX", { minimumFractionDigits: hasUpgradeCredit ? 2 : 0 })} MXN)`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CoachBillingCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-zinc-400">
          Cargando pantalla de pago SPEI...
        </div>
      }
    >
      <SpeiCheckoutContent />
    </Suspense>
  );
}

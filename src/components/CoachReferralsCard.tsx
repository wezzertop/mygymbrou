"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  calculateQueuedRewardForPlan,
  generateCoachReferralCode,
  REFERRAL_RULES,
  ReferralRewardItem,
} from "@/lib/referrals";
import { getAppUrl } from "@/lib/supabase/client";

export function CoachReferralsCard() {
  const { coachProfile } = useApp();
  const fallbackCode =
    coachProfile.referral_code ||
    generateCoachReferralCode(coachProfile.full_name, coachProfile.id);

  const [code, setCode] = useState(fallbackCode);
  const [maxCap, setMaxCap] = useState(REFERRAL_RULES.defaultRewardCap);
  const [queue, setQueue] = useState<ReferralRewardItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!coachProfile.id) return;
    fetch(`/api/referrals?coachId=${encodeURIComponent(coachProfile.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.code) setCode(data.code);
        if (data.maxRewardsCap) setMaxCap(data.maxRewardsCap);
        if (Array.isArray(data.queue)) setQueue(data.queue);
      })
      .catch(() => {});
  }, [coachProfile.id]);

  const shareLink = `${getAppUrl()}/auth/register-coach?ref=${encodeURIComponent(code)}`;
  const armedInStripe = queue.find((q) => q.status === "queued_in_stripe");
  const waitingInQueue = queue.filter(
    (q) => q.status === "pending" || q.status === "queued"
  );
  const queuedRewards = armedInStripe
    ? [armedInStripe, ...waitingInQueue]
    : waitingInQueue;
  const appliedRewards = queue.filter((q) => q.status === "applied");
  const totalEarned = queuedRewards.length + appliedRewards.length;
  const nextReward = armedInStripe || waitingInQueue[0];
  const nextCalc = nextReward
    ? calculateQueuedRewardForPlan(nextReward, coachProfile.saas_plan_tier)
    : null;

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async () => {
    const msg = `Únete a MiGymBrou con mi código de Coach ${code} y obtén 25% de descuento en tu primer mes comprado: ${shareLink}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Invitación MiGymBrou Coach", text: msg });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    handleCopy(msg);
  };

  return (
    <section className="space-y-4 rounded-xl border border-emerald-500/25 bg-[#0e0f12] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-400">
            <Gift className="h-3.5 w-3.5" />
            Programa de Referidos Coach
          </p>
          <h3 className="text-base font-bold text-white">
            Invita a otros Coaches y gana 25% mensual consecutivo
          </h3>
          <p className="text-xs text-zinc-400">
            Tu invitado recibe 25% en su primer mes comprado. Por cada referido que
            active un plan de pago, acumulas 1 mes con 25% de descuento en cola (máx.{" "}
            {maxCap} recompensas, 1 por mes sin apilar).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-emerald-500/35 bg-[#060607] px-3.5 py-2 font-mono text-sm font-bold tracking-wider text-emerald-400">
            {code}
          </span>
          <button
            type="button"
            onClick={() => handleCopy(code)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white transition hover:border-emerald-500/40"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartir
          </button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-white/[0.06] bg-[#060607] p-3">
          <p className="text-[11px] text-zinc-500">En cola mensual</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-400">
            {queuedRewards.length} mes(es)
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#060607] p-3">
          <p className="text-[11px] text-zinc-500">Aplicados</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-white">
            {appliedRewards.length}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#060607] p-3">
          <p className="text-[11px] text-zinc-500">Tope acumulado</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-zinc-200">
            {totalEarned} / {maxCap}
          </p>
        </div>
      </div>

      {nextReward && nextCalc && (
        <div className="space-y-1 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3.5 text-xs text-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-emerald-400">
              {armedInStripe
                ? "✓ Descuento armado en Stripe para tu próximo cobro"
                : "Próximo descuento en cola mensual"}
            </span>
            {armedInStripe?.stripe_coupon_id && (
              <span className="rounded-full border border-emerald-500/30 bg-[#060607] px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                Cupón Stripe activo
              </span>
            )}
          </div>
          <p>
            <strong>{nextReward.discount_percent}%</strong> (base plan{" "}
            {nextReward.plan_at_grant.toUpperCase()} · -${nextCalc.discountAmountMxn.toFixed(2)}{" "}
            MXN → cobro estimado{" "}
            <strong className="text-emerald-400">
              ${nextCalc.netMonthlyDueMxn.toFixed(2)} MXN
            </strong>
            ).
            {waitingInQueue.length > 0 && armedInStripe && (
              <span className="text-zinc-400">
                {" "}
                +{waitingInQueue.length} mes(es) adicionales en cola consecutiva.
              </span>
            )}
          </p>
        </div>
      )}

      {appliedRewards.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-[#060607] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Historial de descuentos aplicados por Stripe
          </p>
          <div className="divide-y divide-white/[0.06]">
            {appliedRewards.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1.5 text-xs"
              >
                <span className="text-zinc-300">
                  {item.applied_month || "Ciclo aplicado"} · {item.discount_percent}%
                </span>
                <span className="font-semibold tabular-nums text-emerald-400">
                  {item.applied_amount_mxn
                    ? `-$${Number(item.applied_amount_mxn).toFixed(2)} MXN`
                    : "Aplicado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-500">
        Reglas de cambio de plan: si subes de plan (upgrade), tus descuentos pendientes
        se calculan con base en el valor del plan donde fueron generados. Si bajas de
        plan (downgrade), no hay devolución en efectivo y el descuento se ajusta al plan
        actual vigente.
      </p>
    </section>
  );
}

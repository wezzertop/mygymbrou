"use client";

import React, { useState } from "react";
import { ExternalLink, Sparkles, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface NonIntrusiveAdBannerProps {
  slot?: "student_footer" | "post_workout" | "diet_card";
  className?: string;
}

export function NonIntrusiveAdBanner({
  slot = "student_footer",
  className = "",
}: NonIntrusiveAdBannerProps) {
  const { ads } = useApp();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const ad =
    ads.find((a) => a.is_active && a.placement_slot === slot) ||
    ads.find((a) => a.is_active);

  if (!ad) return null;

  return (
    <aside
      aria-label="Contenido patrocinado"
      className={`relative rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4 transition hover:border-white/15 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {ad.badge_text}
              </span>
              <span className="text-xs font-medium text-zinc-300">
                {ad.sponsor_name}
              </span>
            </div>
            <p className="text-sm font-medium text-white">{ad.title}</p>
            <p className="text-xs leading-relaxed text-zinc-400">
              {ad.description}
            </p>
            <div className="pt-1">
              <a
                href={ad.cta_url}
                onClick={(e) => {
                  if (ad.cta_url.startsWith("#")) e.preventDefault();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                {ad.cta_text}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Ocultar anuncio"
          className="rounded-full p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

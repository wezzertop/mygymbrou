"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { getPlanCapabilities } from "@/lib/saas-plans";

interface FreeTierAdSlotProps {
  viewerRole?: "coach" | "student";
  className?: string;
}

const AD_320X50_SRCDOC = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 320px;
        height: 50px;
      }
    </style>
  </head>
  <body>
    <script>
      atOptions = {
        'key' : '6924177a6988076ac6e719ab7e506c9e',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    </script>
    <script data-cfasync="false" src="https://czernik.org/22/6924177a6988076ac6e719ab7e506c9e"></script>
  </body>
</html>`;

/**
 * Banner compacto 320x50 visible únicamente en Plan Free.
 * Desaparece automáticamente para el Coach y sus Alumnos al contratar cualquier plan de pago.
 */
export function FreeTierAdSlot({
  viewerRole = "student",
  className = "",
}: FreeTierAdSlotProps) {
  const { hydrated, coachProfile } = useApp();

  const { hasAds } = getPlanCapabilities(coachProfile.saas_plan_tier);

  if (!hydrated || !hasAds) {
    return null;
  }

  return (
    <aside
      aria-label="Espacio publicitario Plan Free"
      className={`flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0e0f12] px-3 py-2.5 ${className}`}
    >
      <div className="mb-1.5 flex w-full max-w-[320px] items-center justify-between text-[10px] text-zinc-500">
        <span className="uppercase tracking-wider">Publicidad · Plan Free</span>
        {viewerRole === "coach" && (
          <Link
            href="/coach/plans?tab=saas"
            className="font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            Quitar anuncios →
          </Link>
        )}
      </div>
      <div className="flex h-[50px] w-full max-w-[320px] items-center justify-center overflow-hidden rounded-lg bg-[#060607]">
        <iframe
          title="Anuncio MiGymBrou"
          srcDoc={AD_320X50_SRCDOC}
          width={320}
          height={50}
          scrolling="no"
          frameBorder={0}
          className="h-[50px] w-[320px] border-0"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        />
      </div>
    </aside>
  );
}

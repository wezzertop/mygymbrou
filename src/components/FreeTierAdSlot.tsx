"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

interface FreeTierAdSlotProps {
  variant: "banner_320x50" | "native_banner";
  viewerRole?: "coach" | "student";
  className?: string;
}

const AD_1_SRCDOC = `<!DOCTYPE html>
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

export function FreeTierAdSlot({
  variant,
  viewerRole = "student",
  className = "",
}: FreeTierAdSlotProps) {
  const { hydrated, coachProfile } = useApp();
  const nativeWrapperRef = useRef<HTMLDivElement>(null);

  const isFreePlan = (coachProfile.saas_plan_tier || "free") === "free";

  useEffect(() => {
    if (!hydrated || !isFreePlan || variant !== "native_banner") return;
    const container = nativeWrapperRef.current;
    if (!container) return;

    // Evita inyectar el script duplicado si ya existe en el contenedor
    if (container.querySelector("script[data-ad-slot='czernik-native']")) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("fetchpriority", "high");
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-ad-slot", "czernik-native");
    script.src = "https://czernik.org/21/47b7a13a42e8b2c5dbfa63fd2427104c";
    container.appendChild(script);
  }, [hydrated, isFreePlan, variant]);

  // Si el coach tiene plan de pago (base, pro, studio), no se carga ni muestra publicidad
  if (!hydrated || !isFreePlan) {
    return null;
  }

  if (variant === "banner_320x50") {
    return (
      <aside
        aria-label="Espacio publicitario Plan Free"
        className={`mt-8 flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0e0f12] px-3 py-3 ${className}`}
      >
        <div className="mb-2 flex w-full max-w-[320px] items-center justify-between text-[10px] text-zinc-500">
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
            srcDoc={AD_1_SRCDOC}
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

  return (
    <aside
      aria-label="Recomendaciones patrocinadas Plan Free"
      className={`overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0e0f12] p-4 ${className}`}
    >
      <div className="mb-2.5 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="uppercase tracking-wider">Contenido patrocinado · Plan Free</span>
        {viewerRole === "coach" && (
          <Link
            href="/coach/plans?tab=saas"
            className="font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            Mejorar plan para ocultar →
          </Link>
        )}
      </div>
      <div ref={nativeWrapperRef} className="w-full overflow-x-clip">
        <div id="container-47b7a13a42e8b2c5dbfa63fd2427104c" />
      </div>
    </aside>
  );
}

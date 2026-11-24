"use client";

import React from "react";

interface SectionVisualHeaderProps {
  imageSrc: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  imagePosition?: string;
  actions?: React.ReactNode;
}

/**
 * Cabecera visual editorial mobile-first:
 * Muestra la fotografía limpia arriba (sin texto encima tapando al sujeto)
 * y el bloque tipográfico + acciones debajo, perfectamente adaptado a 360px+.
 */
export function SectionVisualHeader({
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  subtitle,
  imagePosition = "object-center",
  actions,
}: SectionVisualHeaderProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0f12]">
      <div className="h-32 w-full overflow-hidden bg-[#060607] sm:h-44">
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`h-full w-full object-cover ${imagePosition}`}
        />
      </div>
      <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-end sm:p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

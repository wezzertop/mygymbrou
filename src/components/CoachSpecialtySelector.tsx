"use client";

import React from "react";
import { Check } from "lucide-react";
import { COACH_SPECIALTIES } from "@/lib/coach-catalogs";

interface CoachSpecialtySelectorProps {
  value: string; // comma-separated specialties
  onChange: (nextCsv: string) => void;
  label?: string;
}

export function CoachSpecialtySelector({
  value,
  onChange,
  label = "Especialidades (selecciona una o varias)",
}: CoachSpecialtySelectorProps) {
  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const toggle = (item: string) => {
    const exists = selected.includes(item);
    const next = exists
      ? selected.filter((s) => s !== item)
      : [...selected, item];
    onChange(next.join(", "));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-zinc-300">
          {label}
        </label>
        {selected.length > 0 && (
          <span className="text-[11px] font-semibold text-emerald-400">
            {selected.length} seleccionada{selected.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-[#060607] p-2.5">
        {COACH_SPECIALTIES.map((spec) => {
          const active = selected.includes(spec);
          return (
            <button
              key={spec}
              type="button"
              onClick={() => toggle(spec)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition ${
                active
                  ? "bg-emerald-500 text-[#0a0a0a] font-semibold"
                  : "border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-emerald-500/40 hover:text-white"
              }`}
            >
              {active && <Check className="h-3 w-3 stroke-[2.5]" />}
              {spec}
            </button>
          );
        })}
      </div>
    </div>
  );
}

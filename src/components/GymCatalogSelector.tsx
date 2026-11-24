"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Building2, Check, ChevronDown, MapPin, PlusCircle, Search } from "lucide-react";
import { DEFAULT_APPROVED_GYMS, GymRecord } from "@/lib/coach-catalogs";

interface GymCatalogSelectorProps {
  value: string;
  onChange: (brandName: string, meta?: { isCustom: boolean; customCity?: string }) => void;
  label?: string;
  required?: boolean;
}

export function GymCatalogSelector({
  value,
  onChange,
  label = "Gimnasio o Estudio *",
  required = true,
}: GymCatalogSelectorProps) {
  const [gyms, setGyms] = useState<GymRecord[]>(DEFAULT_APPROVED_GYMS);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCity, setCustomCity] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/gyms")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.gyms) && data.gyms.length > 0) {
          setGyms(data.gyms);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return gyms;
    return gyms.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.city || "").toLowerCase().includes(q)
    );
  }, [gyms, query]);

  const handleSelectGym = (gym: GymRecord) => {
    setIsCustomMode(false);
    setOpen(false);
    setQuery("");
    onChange(gym.name, { isCustom: false });
  };

  const handleActivateCustom = () => {
    setIsCustomMode(true);
    setOpen(false);
    const seed = query.trim() || customName;
    setCustomName(seed);
    onChange(seed, { isCustom: true, customCity });
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-zinc-300">{label}</label>

      {!isCustomMode ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-left text-sm transition focus:border-emerald-500"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Building2 className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className={value ? "truncate text-white" : "truncate text-zinc-500"}>
                {value || "Selecciona tu gimnasio o estudio..."}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>

          {/* Hidden native input for required form validation */}
          {required && (
            <input
              type="text"
              required
              value={value}
              onChange={() => {}}
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-1/2 h-0 w-0 opacity-0"
            />
          )}

          {open && (
            <>
              <div
                aria-hidden="true"
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-30"
              />
              <div className="absolute left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-white/15 bg-[#0e0f12] shadow-2xl">
                <div className="border-b border-white/[0.08] p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar gimnasio o ciudad..."
                      className="h-9 w-full rounded-lg border border-white/10 bg-[#060607] pl-8 pr-3 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto p-1">
                  {filtered.map((gym) => {
                    const selected = value === gym.name;
                    return (
                      <button
                        key={gym.id}
                        type="button"
                        onClick={() => handleSelectGym(gym)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition hover:bg-white/[0.06]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{gym.name}</p>
                          {gym.city && (
                            <p className="truncate text-[10px] text-zinc-400">{gym.city}</p>
                          )}
                        </div>
                        {selected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <p className="px-3 py-3 text-center text-xs text-zinc-500">
                      No encontramos ese gimnasio en el catálogo.
                    </p>
                  )}
                </div>

                <div className="border-t border-white/[0.08] p-1.5">
                  <button
                    type="button"
                    onClick={handleActivateCustom}
                    className="flex w-full items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-left text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                  >
                    <PlusCircle className="h-4 w-4 shrink-0" />
                    Otro / Mi gimnasio no aparece
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-emerald-400">
              Sugerir nuevo gimnasio (pendiente de aprobación)
            </span>
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                onChange("", { isCustom: false });
              }}
              className="text-[11px] font-medium text-zinc-400 hover:text-white"
            >
              Volver al catálogo
            </button>
          </div>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              required={required}
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                onChange(e.target.value, { isCustom: true, customCity });
              }}
              placeholder="Nombre de tu gimnasio o estudio *"
              className="w-full rounded-xl border border-white/15 bg-[#060607] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={customCity}
              onChange={(e) => {
                setCustomCity(e.target.value);
                onChange(customName, { isCustom: true, customCity: e.target.value });
              }}
              placeholder="Ciudad o zona (opcional, ej. Guadalajara)"
              className="w-full rounded-xl border border-white/15 bg-[#060607] py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

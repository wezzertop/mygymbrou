"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  Image as ImageIcon,
  PencilLine,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  COVER_PRESETS,
  resolveDefaultCoverByGender,
  resolveUserCover,
} from "@/lib/cover-presets";
import {
  getDailyQuote,
  getQuoteById,
  getQuotesForAudience,
  QUOTE_CATEGORY_LABELS,
  QuoteCategory,
} from "@/lib/motivational-quotes";
import { createClient } from "@/lib/supabase/client";

interface DynamicBannerHeaderProps {
  role: "coach" | "student";
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function DynamicBannerHeader({
  role,
  eyebrow,
  title,
  actions,
}: DynamicBannerHeaderProps) {
  const {
    coachProfile,
    studentProfile,
    authUserId,
    isDemoMode,
    updateCoachProfile,
    updateStudentProfile,
  } = useApp();

  const profile = role === "coach" ? coachProfile : studentProfile;
  const updateProfile =
    role === "coach" ? updateCoachProfile : updateStudentProfile;

  // Cover modal state
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [coverFilter, setCoverFilter] = useState<
    "all" | "mujer" | "hombre" | "coaching" | "nutricion"
  >("all");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quote state & modal
  const [rotationOffset, setRotationOffset] = useState(0);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState(
    profile.custom_motivational_quote || ""
  );
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteCategory, setQuoteCategory] = useState<QuoteCategory | "all">(
    "all"
  );

  const resolvedCover = resolveUserCover(profile, role);
  const audienceQuotes = useMemo(() => getQuotesForAudience(role), [role]);

  const activeQuoteText = useMemo(() => {
    if (rotationOffset === 0) {
      if (profile.custom_motivational_quote?.trim()) {
        return profile.custom_motivational_quote.trim();
      }
      const savedQuote = getQuoteById(profile.selected_quote_id);
      if (savedQuote) return savedQuote.text;
    }
    return getDailyQuote(role, rotationOffset).text;
  }, [
    profile.custom_motivational_quote,
    profile.selected_quote_id,
    role,
    rotationOffset,
  ]);

  const filteredPresets = useMemo(
    () =>
      coverFilter === "all"
        ? COVER_PRESETS
        : COVER_PRESETS.filter((p) => p.category === coverFilter),
    [coverFilter]
  );

  const filteredQuotes = useMemo(() => {
    const q = quoteSearch.trim().toLowerCase();
    return audienceQuotes.filter((item) => {
      if (quoteCategory !== "all" && item.category !== quoteCategory) {
        return false;
      }
      if (q && !item.text.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [audienceQuotes, quoteCategory, quoteSearch]);

  const handleSelectPreset = (url: string) => {
    updateProfile({ cover_url: url, cover_type: "preset" });
    setCoverModalOpen(false);
  };

  const handleResetDefaultCover = () => {
    const def = resolveDefaultCoverByGender(profile.gender, role);
    updateProfile({ cover_url: def.url, cover_type: def.type });
    setCoverModalOpen(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setCoverError("Formato no soportado. Usa JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_COVER_SIZE_BYTES) {
      setCoverError("La imagen supera el límite de 5 MB.");
      return;
    }

    setUploadingCover(true);
    try {
      if (!isDemoMode && authUserId) {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `${authUserId}/cover-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("profile-covers")
          .upload(storagePath, file, { upsert: true });

        if (!uploadErr) {
          const { data: pub } = supabase.storage
            .from("profile-covers")
            .getPublicUrl(storagePath);
          if (pub?.publicUrl) {
            updateProfile({ cover_url: pub.publicUrl, cover_type: "custom" });
            setCoverModalOpen(false);
            return;
          }
        }
      }

      // Fallback local / demo (Data URL)
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateProfile({ cover_url: reader.result, cover_type: "custom" });
          setCoverModalOpen(false);
        }
        setUploadingCover(false);
      };
      reader.onerror = () => {
        setCoverError("No se pudo leer la imagen seleccionada.");
        setUploadingCover(false);
      };
      reader.readAsDataURL(file);
      return;
    } catch {
      setCoverError("Error al subir tu portada. Intenta de nuevo.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRotateQuote = () => {
    const nextOffset = rotationOffset + 1;
    setRotationOffset(nextOffset);
    const nextQuote = getDailyQuote(role, nextOffset);
    updateProfile({
      selected_quote_id: nextQuote.id,
      custom_motivational_quote: "",
    });
  };

  const handleSaveCustomQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    setRotationOffset(0);
    updateProfile({
      custom_motivational_quote: trimmed,
      selected_quote_id: undefined,
    });
    setQuoteModalOpen(false);
  };

  const handlePickCatalogQuote = (quoteId: string) => {
    setRotationOffset(0);
    setCustomDraft("");
    updateProfile({
      selected_quote_id: quoteId,
      custom_motivational_quote: "",
    });
    setQuoteModalOpen(false);
  };

  const handleUseAutoDaily = () => {
    setRotationOffset(0);
    setCustomDraft("");
    updateProfile({
      selected_quote_id: undefined,
      custom_motivational_quote: "",
    });
    setQuoteModalOpen(false);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0f12]">
        {/* 100% Unobstructed Mobile-First Cover Photo (Zero buttons over the image) */}
        <div className="h-32 w-full overflow-hidden bg-[#060607] sm:h-44">
          <img
            src={resolvedCover.url}
            alt="Portada motivacional de perfil"
            className={`h-full w-full object-cover ${resolvedCover.position}`}
          />
        </div>

        {/* Clean Typographic Block Below Photo */}
        <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-end sm:p-5">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
              {title}
            </h1>

            {/* Dynamic Motivational Quote + Quick Controls */}
            <div className="space-y-2 pt-0.5">
              <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                &ldquo;{activeQuoteText}&rdquo;
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotateQuote}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-[11px] font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
                >
                  <RefreshCw className="h-3 w-3 text-emerald-400" />
                  Nueva frase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomDraft(profile.custom_motivational_quote || "");
                    setQuoteModalOpen(true);
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-[11px] font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
                >
                  <PencilLine className="h-3 w-3" />
                  Personalizar frase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCoverError(null);
                    setCoverModalOpen(true);
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-[11px] font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
                >
                  <ImageIcon className="h-3 w-3" />
                  Portada
                </button>
              </div>
            </div>
          </div>

          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL 1: CAMBIAR PORTADA ================= */}
      {coverModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cambiar imagen de portada"
          onClick={() => setCoverModalOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0e0f12] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Cambiar portada
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Elige de la galería o sube tu propia imagen (JPG, PNG, WEBP · máx. 5 MB).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoverModalOpen(false)}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Custom Upload Box */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-white/15 bg-[#060607] px-4 py-3 text-xs font-medium text-white transition hover:border-emerald-500/50 hover:bg-white/[0.02] disabled:opacity-60"
                >
                  <Upload className="h-4 w-4 text-emerald-400" />
                  {uploadingCover
                    ? "Subiendo portada..."
                    : "Subir mi propia foto de portada"}
                </button>
                {coverError && (
                  <p className="mt-2 text-xs text-rose-400">{coverError}</p>
                )}
              </div>

              {/* Filter Pills */}
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                {(
                  [
                    { key: "all", label: "Todas" },
                    { key: "mujer", label: "Mujer" },
                    { key: "hombre", label: "Hombre" },
                    { key: "coaching", label: "Coaching" },
                    { key: "nutricion", label: "Nutrición" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setCoverFilter(f.key)}
                    className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-medium transition ${
                      coverFilter === f.key
                        ? "bg-white text-zinc-950"
                        : "border border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredPresets.map((preset) => {
                  const selected = resolvedCover.url === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`group overflow-hidden rounded-xl border text-left transition ${
                        selected
                          ? "border-emerald-400 ring-1 ring-emerald-400/50"
                          : "border-white/[0.08] hover:border-white/25"
                      }`}
                    >
                      <div className="relative h-24 w-full overflow-hidden bg-[#060607]">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
                            preset.objectPosition || "object-center"
                          }`}
                        />
                        {selected && (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-zinc-950">
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          </span>
                        )}
                      </div>
                      <p className="truncate bg-[#060607] px-2.5 py-2 text-[11px] font-medium text-zinc-300">
                        {preset.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3.5">
              <button
                type="button"
                onClick={handleResetDefaultCover}
                className="text-xs font-medium text-zinc-400 transition hover:text-white"
              >
                Usar portada por mi género
              </button>
              <button
                type="button"
                onClick={() => setCoverModalOpen(false)}
                className="h-9 rounded-full border border-white/15 px-4 text-xs font-medium text-white hover:bg-white/[0.06]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FRASES MOTIVACIONALES (210+) ================= */}
      {quoteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Personalizar frase motivacional"
          onClick={() => setQuoteModalOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0e0f12] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
Frase Motivacional
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Escribe tu propia frase o elige entre {audienceQuotes.length}+ frases curadas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Custom Quote Form */}
              <form onSubmit={handleSaveCustomQuote} className="space-y-2.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Escribe tu frase personal
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={160}
                    value={customDraft}
                    onChange={(e) => setCustomDraft(e.target.value)}
                    placeholder="Ej. Un paso más cerca de mi mejor versión..."
                    className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
                  />
                  <button
                    type="submit"
                    disabled={!customDraft.trim()}
                    className="h-[44px] shrink-0 rounded-full bg-white px-4 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-40"
                  >
                    Guardar
                  </button>
                </div>
              </form>

              <div className="border-t border-white/[0.08] pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-300">
                    Catálogo ({filteredQuotes.length} disponibles)
                  </p>
                  <button
                    type="button"
                    onClick={handleUseAutoDaily}
                    className="text-[11px] font-medium text-emerald-400 hover:underline"
                  >
                    Rotación diaria automática
                  </button>
                </div>

                {/* Search + Category Filter */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={quoteSearch}
                      onChange={(e) => setQuoteSearch(e.target.value)}
                      placeholder="Buscar frase..."
                      className="min-h-[40px] w-full rounded-xl border border-white/10 bg-[#060607] pl-9 pr-3 text-xs text-white outline-none focus:border-emerald-500/60"
                    />
                  </div>

                  <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setQuoteCategory("all")}
                      className={`h-8 shrink-0 rounded-full px-3 text-[11px] font-medium transition ${
                        quoteCategory === "all"
                          ? "bg-white text-zinc-950"
                          : "border border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Todas
                    </button>
                    {(Object.keys(QUOTE_CATEGORY_LABELS) as QuoteCategory[]).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setQuoteCategory(cat)}
                          className={`h-8 shrink-0 rounded-full px-3 text-[11px] font-medium transition ${
                            quoteCategory === cat
                              ? "bg-white text-zinc-950"
                              : "border border-white/10 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {QUOTE_CATEGORY_LABELS[cat]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Quotes List */}
                <div className="mt-3 max-h-64 divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#060607]">
                  {filteredQuotes.slice(0, 80).map((item) => {
                    const isSelected =
                      !profile.custom_motivational_quote &&
                      profile.selected_quote_id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handlePickCatalogQuote(item.id)}
                        className="flex w-full items-start justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-white/[0.04]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs leading-relaxed text-zinc-200">
                            &ldquo;{item.text}&rdquo;
                          </p>
                          <span className="mt-1 inline-block text-[10px] font-medium text-zinc-500">
                            {QUOTE_CATEGORY_LABELS[item.category]}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                  {filteredQuotes.length === 0 && (
                    <p className="py-6 text-center text-xs text-zinc-500">
                      No se encontraron frases con ese filtro.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

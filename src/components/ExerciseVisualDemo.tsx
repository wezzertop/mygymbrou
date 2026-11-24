"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import {
  ExerciseFrame,
  ExerciseFrameVariants,
  Gender,
  MediaType,
} from "@/types/database";

interface ExerciseVisualDemoProps {
  name: string;
  gender?: Gender;
  allowGenderSwitch?: boolean;
  frames?: ExerciseFrameVariants;
  frameIntervalMs?: number;
  mediaUrl?: string;
  mediaType?: MediaType;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string;
  compact?: boolean;
}

/**
 * Reproductor limpio de ilustraciones anatómicas en Dark UI (#0b1117):
 * - Cero textos técnicos ni barras/controles encimados sobre la imagen.
 * - Reproducción automática fluida en bucle de las fases del ejercicio.
 * - Adaptación automática según género del alumno (female / male) con fallback.
 * - Un solo botón discreto en esquina superior derecha para ampliar en modal.
 */
export function ExerciseVisualDemo({
  name,
  gender = "female",
  frames,
  frameIntervalMs = 700,
  mediaUrl,
  mediaType = "sequence",
  primaryMuscles = [],
  secondaryMuscles = [],
  instructions,
  compact = false,
}: ExerciseVisualDemoProps) {
  const [activeGender, setActiveGender] = useState<Gender>(gender);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setActiveGender(gender);
  }, [gender]);

  // Prefer frames matching student gender, fallback cleanly if empty
  const activeFrames: ExerciseFrame[] = useMemo(() => {
    if (!frames) return [];
    const preferred = frames[activeGender];
    if (preferred && preferred.length > 0) return preferred;
    const fallback = activeGender === "female" ? frames.male : frames.female;
    return fallback || [];
  }, [frames, activeGender]);

  // Build smooth ping-pong playback order: 0 -> 1 -> 2 -> 1 -> 0 (eliminates harsh snap-back)
  const playbackOrder = useMemo(() => {
    const n = activeFrames.length;
    if (n <= 1) return [0];
    if (n === 2) return [0, 1];
    const forward = Array.from({ length: n }, (_, i) => i);
    const backward = Array.from({ length: n - 2 }, (_, i) => n - 2 - i);
    return [...forward, ...backward];
  }, [activeFrames.length]);

  const [stepIdx, setStepIdx] = useState(0);
  const frameIdx = playbackOrder[stepIdx % playbackOrder.length] ?? 0;

  useEffect(() => {
    setStepIdx(0);
  }, [activeGender, activeFrames.length]);

  useEffect(() => {
    // Reproducir bucle fluido para secuencias de 2+ fotogramas (ping-pong en 3+)
    if (activeFrames.length < 2) return;
    const interval = Math.max(420, Math.min(1100, frameIntervalMs));
    const id = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % playbackOrder.length);
    }, interval);
    return () => clearInterval(id);
  }, [activeFrames.length, playbackOrder.length, frameIntervalMs]);

  const currentFrame = activeFrames[frameIdx] || activeFrames[0];

  // Video loop uploaded by Coach
  if (mediaType === "video" && mediaUrl && activeFrames.length === 0) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1117] ${
          compact ? "h-20 w-24 shrink-0 sm:h-24 sm:w-32" : "aspect-[16/10] w-full"
        }`}
      >
        <video
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // GIF animado (ExerciseDB o cargado por Coach) con integración automática Dark UI
  if (mediaType === "gif" && mediaUrl && activeFrames.length === 0) {
    const isLightGif = mediaUrl.includes("exercisedb.dev");
    const darkFilterClass = isLightGif
      ? "invert-[0.91] hue-rotate-180 contrast-110 brightness-95 mix-blend-lighten"
      : "";

    return (
      <>
        <div
          onClick={() => setModalOpen(true)}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1117] ${
            compact ? "h-20 w-24 shrink-0 sm:h-24 sm:w-32" : "aspect-[16/10] w-full"
          }`}
        >
          <img
            src={mediaUrl}
            alt={name}
            loading="lazy"
            className={`h-full w-full object-contain p-1 ${darkFilterClass}`}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            aria-label="Ampliar ejercicio"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-[#060607] text-zinc-300 opacity-70 backdrop-blur-sm transition hover:bg-[#0e0f12] hover:text-white hover:opacity-100"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>

        {modalOpen && (
          <CleanExerciseModal
            name={name}
            activeGender={activeGender}
            setActiveGender={setActiveGender}
            currentFrame={{ phase: 1, label: name, image_url: mediaUrl }}
            isLightGif={isLightGif}
            primaryMuscles={primaryMuscles}
            secondaryMuscles={secondaryMuscles}
            instructions={instructions}
            onClose={() => setModalOpen(false)}
          />
        )}
      </>
    );
  }

  const hasFrames = activeFrames.length > 0 && currentFrame;

  // Compact preview for Coach Catalog (clean, zero overlays)
  if (compact) {
    return (
      <>
        <div
          onClick={() => hasFrames && setModalOpen(true)}
          className="group relative h-20 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1117] sm:h-24 sm:w-32"
        >
          {hasFrames ? (
            <>
              {activeFrames.map((f, idx) => (
                <img
                  key={f.image_url}
                  src={f.image_url}
                  alt={name}
                  className={`absolute inset-0 h-full w-full object-contain p-1 transition-opacity duration-150 ${
                    idx === frameIdx ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(true);
                }}
                aria-label="Ampliar ejercicio"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-[#060607] text-zinc-300 opacity-75 backdrop-blur-sm transition hover:bg-[#0e0f12] hover:text-white hover:opacity-100"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">
              Sin imagen
            </div>
          )}
        </div>

        {modalOpen && hasFrames && (
          <CleanExerciseModal
            name={name}
            activeGender={activeGender}
            setActiveGender={setActiveGender}
            currentFrame={currentFrame}
            primaryMuscles={primaryMuscles}
            secondaryMuscles={secondaryMuscles}
            instructions={instructions}
            onClose={() => setModalOpen(false)}
          />
        )}
      </>
    );
  }

  // Clean Full Card Player for Student Workouts (NO text, NO bars, NO prev/pause/next overlays)
  return (
    <div className="space-y-2">
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1117]">
        <div
          onClick={() => hasFrames && setModalOpen(true)}
          className="relative flex aspect-[16/10] w-full cursor-pointer items-center justify-center bg-[#0b1117] p-2"
        >
          {hasFrames ? (
            <>
              {activeFrames.map((f, idx) => (
                <img
                  key={f.image_url}
                  src={f.image_url}
                  alt={name}
                  className={`absolute inset-0 h-full w-full object-contain p-2 transition-opacity duration-150 ${
                    idx === frameIdx ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </>
          ) : (
            <p className="text-xs text-zinc-500">Ilustración pendiente</p>
          )}

          {/* Single discreet expand icon in top-right corner */}
          {hasFrames && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              aria-label="Ampliar ilustración"
              className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[#060607] text-zinc-300 opacity-70 backdrop-blur-sm transition hover:bg-[#0e0f12] hover:text-white hover:opacity-100"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Subtle Muscle Badges below the image (never on top of it) */}
      {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {primaryMuscles.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-md border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {m}
            </span>
          ))}
          {secondaryMuscles.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-[#0e0f12] px-2 py-0.5 font-medium text-zinc-400"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {modalOpen && hasFrames && (
        <CleanExerciseModal
          name={name}
          activeGender={activeGender}
          setActiveGender={setActiveGender}
          currentFrame={currentFrame}
          primaryMuscles={primaryMuscles}
          secondaryMuscles={secondaryMuscles}
          instructions={instructions}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function CleanExerciseModal({
  name,
  activeGender,
  setActiveGender,
  currentFrame,
  isLightGif = false,
  primaryMuscles,
  secondaryMuscles,
  instructions,
  onClose,
}: {
  name: string;
  activeGender: Gender;
  setActiveGender: (g: Gender) => void;
  currentFrame: ExerciseFrame;
  isLightGif?: boolean;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-3.5">
          <h3 className="truncate text-base font-extrabold text-white">
            {name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/[0.08] bg-[#0e0f12] p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveGender("female")}
                className={`rounded-md px-2.5 py-1 transition ${
                  activeGender === "female"
                    ? "bg-rose-500/20 text-rose-300"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Mujer
              </button>
              <button
                type="button"
                onClick={() => setActiveGender("male")}
                className={`rounded-md px-2.5 py-1 transition ${
                  activeGender === "male"
                    ? "bg-emerald-500/20 text-cyan-300"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Hombre
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Pure Uncluttered Anatomical Illustration */}
        <div className="bg-[#0b1117] p-2">
          <img
            src={currentFrame.image_url}
            alt={name}
            className={`mx-auto max-h-[60vh] w-full object-contain ${
              isLightGif
                ? "invert-[0.91] hue-rotate-180 contrast-110 brightness-95 mix-blend-lighten"
                : ""
            }`}
          />
        </div>

        {(primaryMuscles.length > 0 || instructions) && (
          <div className="space-y-2.5 border-t border-white/[0.08] bg-[#060607] px-5 py-4">
            {primaryMuscles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {primaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 font-bold text-rose-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {m}
                  </span>
                ))}
                {secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-md bg-slate-800 px-2 py-0.5 font-medium text-zinc-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
            {instructions && (
              <p className="text-xs leading-relaxed text-zinc-300">
                {instructions}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

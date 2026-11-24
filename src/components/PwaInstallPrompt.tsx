"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Componente global mantenido por compatibilidad.
 * No muestra popups ni banners flotantes automáticos para evitar fricción.
 * La instalación se ofrece de forma discreta mediante <PwaInstallButton />.
 */
export function PwaInstallPrompt() {
  return null;
}

/**
 * Botón discreto y no invasivo para instalar la PWA desde el header o sidebar.
 * Solo aparece cuando la app no está instalada y el navegador soporta instalación.
 */
export function PwaInstallButton({
  variant = "icon",
}: {
  variant?: "icon" | "sidebar" | "menu";
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsStandalone(standalone);
    if (standalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);

    if (isIos && isSafari) {
      setIsIosSafari(true);
      setCanInstall(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setCanInstall(false);
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
      return;
    }
    setShowGuide(true);
  };

  if (isStandalone) return null;
  if (variant !== "menu" && variant !== "sidebar" && !canInstall) return null;

  return (
    <>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-emerald-400"
        >
          <Download className="h-[17px] w-[17px] text-emerald-400" />
          <span>Instalar App</span>
        </button>
      ) : variant === "menu" ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06]"
        >
          <Download className="h-4 w-4 text-emerald-400" />
          <span>Instalar App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Instalar MiGymBrou como App"
          aria-label="Instalar MiGymBrou como App"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
        >
          <Download className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Instalar</span>
        </button>
      )}

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowGuide(false)}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-[#0e0f12] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {isIosSafari ? "Instalar en iPhone / iPad" : "Instalar MiGymBrou App"}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Agrega MiGymBrou a tu pantalla de inicio para usarla a pantalla completa sin App Store:
            </p>
            <ol className="space-y-2 text-xs text-zinc-200">
              {isIosSafari ? (
                <>
                  <li className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#060607] p-3">
                    <Share className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      1. Toca el botón <strong>Compartir</strong> en la barra de Safari.
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#060607] p-3">
                    <Smartphone className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      2. Selecciona <strong>Agregar a pantalla de inicio</strong>.
                    </span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#060607] p-3">
                    <Smartphone className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      1. Toca el menú del navegador (<strong>⋮</strong> arriba a la derecha).
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#060607] p-3">
                    <Download className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      2. Elige <strong>Instalar aplicación</strong> o{" "}
                      <strong>Agregar a pantalla principal</strong>.
                    </span>
                  </li>
                </>
              )}
            </ol>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="h-10 w-full rounded-lg bg-emerald-500 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

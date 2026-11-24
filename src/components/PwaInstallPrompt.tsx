"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "migymbrou_pwa_prompt_dismissed_until";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Si ya está instalada en modo standalone, no mostrar nunca
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (isStandalone) return;

    // Respetar si el usuario la cerró recientemente (7 días)
    try {
      const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || "0");
      if (dismissedUntil > Date.now()) return;
    } catch {
      // ignore
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);

    if (isIos && isSafari) {
      setIsIosSafari(true);
      const timer = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    try {
      const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(sevenDays));
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (isIosSafari) {
      setShowIosGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Non-invasive sleek floating pill above mobile bottom nav */}
      <div
        role="region"
        aria-label="Instalar aplicación MiGymBrou"
        className="fixed bottom-24 left-3 right-3 z-30 mx-auto max-w-md lg:bottom-5 lg:left-auto lg:right-5"
      >
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#0e0f12]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-emerald-400">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                Instala MiGymBrou como App
              </p>
              <p className="truncate text-[11px] text-zinc-400">
                Directo desde tu navegador, sin tiendas
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              <Download className="h-3 w-3" />
              Instalar
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Cerrar aviso de instalación"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini iOS Safari Install Guide Modal */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-3xl border border-white/10 bg-[#0e0f12] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Instalar en iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Agrega MiGymBrou a tu pantalla de inicio en 2 pasos sin usar App Store:
            </p>
            <ol className="space-y-2.5 text-xs text-zinc-200">
              <li className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#060607] p-3">
                <Share className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  1. Toca el botón <strong>Compartir</strong> en la barra de Safari.
                </span>
              </li>
              <li className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#060607] p-3">
                <Smartphone className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  2. Selecciona <strong>Agregar a pantalla de inicio</strong>.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={handleDismiss}
              className="h-10 w-full rounded-full bg-white text-xs font-semibold text-zinc-950"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

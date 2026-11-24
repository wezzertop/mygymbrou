"use client";

interface NonIntrusiveAdBannerProps {
  slot?: "student_footer" | "post_workout" | "diet_card";
  className?: string;
}

/**
 * Native Banner desactivado a petición: se utiliza únicamente el banner
 * compacto 320x50 (FreeTierAdSlot) en zonas estratégicas visibles.
 */
export function NonIntrusiveAdBanner(_props: NonIntrusiveAdBannerProps) {
  return null;
}

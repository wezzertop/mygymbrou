"use client";

import React from "react";
import { FreeTierAdSlot } from "@/components/FreeTierAdSlot";

interface NonIntrusiveAdBannerProps {
  slot?: "student_footer" | "post_workout" | "diet_card";
  className?: string;
}

/**
 * Delega los espacios patrocinados estratégicos al sistema condicionado por plan:
 * Solo visible en plan Free; desaparece automáticamente en planes de pago.
 */
export function NonIntrusiveAdBanner({
  className = "",
}: NonIntrusiveAdBannerProps) {
  return (
    <FreeTierAdSlot
      variant="native_banner"
      viewerRole="student"
      className={className}
    />
  );
}

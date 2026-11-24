import React from "react";
import { CoachShell } from "@/components/CoachShell";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoachShell>{children}</CoachShell>;
}

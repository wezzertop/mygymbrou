"use client";

import React, { useRef, useState } from "react";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { IdentityDocumentType, Profile } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { getCoachVerificationGraceStatus } from "@/lib/referrals";
import {
  VerificationStatusPill,
  VerifiedPersonBadge,
} from "@/components/VerificationBadge";

const DOC_TYPE_LABELS: Record<IdentityDocumentType, string> = {
  selfie_id: "Selfie sosteniendo identificación oficial",
  ine_id: "Identificación oficial (INE / Cédula / DNI)",
  passport: "Pasaporte vigente",
};

export function IdentityVerificationCard({
  role,
  profile,
}: {
  role: "coach" | "student";
  profile: Profile;
}) {
  const {
    isDemoMode,
    authUserId,
    submitIdentityVerification,
    updateCoachProfile,
  } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState<IdentityDocumentType>(
    profile.identity_document_type || "ine_id"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile.identity_document_url || null
  );
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(
    profile.face_verification_url || null
  );
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = profile.verification_status || (profile.is_verified_identity ? "verified" : "unverified");
  const coachGrace = role === "coach" ? getCoachVerificationGraceStatus(profile) : null;

  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("La foto de rostro supera el límite de 8 MB.");
      return;
    }
    setFaceFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setFacePreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("El archivo supera el límite de 8 MB. Elige una imagen o PDF más ligero.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (autoApproveDemo = false) => {
    setError(null);
    if (!previewUrl) {
      setError("1. Sube una foto legible de tu identificación oficial.");
      return;
    }
    if (role === "coach" && !facePreviewUrl) {
      setError("2. Toma o sube una foto clara de tu rostro (selfie) para cotejo visual.");
      return;
    }

    setSubmitting(true);
    try {
      let finalUrl = previewUrl;
      let finalFaceUrl = facePreviewUrl;
      const fileName =
        selectedFile?.name ||
        profile.identity_document_name ||
        `verificacion-${role}-${Date.now()}.png`;
      const faceFileName =
        faceFile?.name ||
        profile.face_verification_name ||
        `rostro-${role}-${Date.now()}.jpg`;

      if (!isDemoMode && authUserId) {
        const supabase = createClient();
        if (selectedFile) {
          const ext = selectedFile.name.split(".").pop() || "jpg";
          const path = `${authUserId}/identity-${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("identity-docs")
            .upload(path, selectedFile, { upsert: true });
          if (!uploadError) {
            const { data: signed } = await supabase.storage
              .from("identity-docs")
              .createSignedUrl(path, 60 * 60 * 24 * 30);
            if (signed?.signedUrl) finalUrl = signed.signedUrl;
          }
        }
        if (faceFile) {
          const ext = faceFile.name.split(".").pop() || "jpg";
          const path = `${authUserId}/face-${Date.now()}.${ext}`;
          const { error: faceErr } = await supabase.storage
            .from("identity-docs")
            .upload(path, faceFile, { upsert: true });
          if (!faceErr) {
            const { data: signed } = await supabase.storage
              .from("identity-docs")
              .createSignedUrl(path, 60 * 60 * 24 * 30);
            if (signed?.signedUrl) finalFaceUrl = signed.signedUrl;
          }
        }
      }

      if (role === "coach" && finalFaceUrl) {
        updateCoachProfile({
          face_verification_url: finalFaceUrl,
          face_verification_name: faceFileName,
        });
      }

      submitIdentityVerification({
        role,
        documentType: docType,
        documentUrl: finalUrl,
        documentName: fileName,
        autoApproveDemo,
      });

      setFeedback(
        autoApproveDemo
          ? "¡Verificación completada! Ya cuentas con tu insignia de Persona Real Verificada."
          : "Documento enviado correctamente. Tu verificación está en revisión."
      );
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setError("No se pudo enviar el documento. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-semibold tracking-tight text-white">
              Verificación de Persona Real
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            {role === "coach"
              ? "Confirma tu identidad real para mostrar tu insignia verificada en el directorio de coaches."
              : "Verifica tu identidad para mostrar tu marca de verificación a tu Coach y en tus solicitudes."}
          </p>
        </div>

        <VerificationStatusPill status={status} />
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {feedback}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-300">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {status === "verified" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <VerifiedPersonBadge verified label="Persona Real Verificada" />
            <p className="text-xs text-zinc-300">
              Tu identidad fue validada
              {profile.verified_at
                ? ` el ${new Date(profile.verified_at).toLocaleDateString("es-MX", {
                    dateStyle: "long",
                  })}`
                : ""}
              . Tu marca de verificación es visible en tu perfil y solicitudes.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 ring-1 ring-sky-400/40">
            <BadgeCheck className="h-7 w-7" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {status === "pending" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="font-bold">Tu verificación está en revisión</p>
                <p className="mt-0.5 text-amber-200/80">
                  {role === "student"
                    ? "Tu Coach puede aprobar tu documento desde tu expediente 360°."
                    : "Nuestro equipo revisará tu documento para activar tu insignia verificada."}
                </p>
              </div>
            </div>
          )}

          {status === "rejected" && profile.verification_notes && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3.5 text-xs text-rose-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                <p className="font-bold">Motivo de revisión:</p>
                <p className="mt-0.5">{profile.verification_notes}</p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Tipo de documento para verificar identidad
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as IdentityDocumentType)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
            >
              {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-[#060607] px-4 py-6 text-center transition hover:border-white/30 hover:bg-white/[0.02]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-400">
                <Upload className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-white">
                {selectedFile
                  ? selectedFile.name
                  : "Subir foto de ID oficial o selfie con identificación"}
              </p>
              <p className="text-[11px] text-zinc-500">
                JPG, PNG, WEBP o PDF (máx. 8 MB) · Archivo privado
              </p>
            </button>
          </div>

          {previewUrl && !previewUrl.startsWith("data:application/pdf") && (
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#060607] p-2">
              <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-zinc-300">
                <FileCheck2 className="h-3.5 w-3.5 text-sky-400" />
                Vista previa del documento cargado
              </div>
              <img
                src={previewUrl}
                alt="Vista previa de verificación"
                className="max-h-44 w-full rounded-lg object-contain"
              />
            </div>
          )}

          {role === "coach" && coachGrace && coachGrace.state !== "verified" && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs text-amber-200">
              Plazo de verificación obligatoria:{" "}
              <strong>
                {coachGrace.state === "expired_locked"
                  ? "Plazo de 15 días vencido — envía tu ID oficial y rostro para reactivar"
                  : `${coachGrace.daysRemaining} día(s) restantes de 15`}
              </strong>
              . Archivos privados protegidos conforme a la LFPDPPP.
            </div>
          )}

          {role === "coach" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                2. Comprobación de rostro (selfie clara para cotejo visual) *
              </label>
              <input
                ref={faceInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFaceFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => faceInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-emerald-500/35 bg-[#060607] px-4 py-4 text-xs font-medium text-white transition hover:border-emerald-500/60 hover:bg-emerald-500/[0.04]"
              >
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>
                  {faceFile
                    ? faceFile.name
                    : "Tomar selfie con cámara o subir foto de rostro"}
                </span>
              </button>
              {facePreviewUrl && (
                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#060607] p-2">
                  <img
                    src={facePreviewUrl}
                    alt="Vista previa de rostro"
                    className="max-h-40 w-full rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-500 px-5 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting ? "Enviando..." : "Enviar Verificación"}
            </button>

            {isDemoMode && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
              >
                <BadgeCheck className="h-4 w-4" />
                Aprobar ahora (Demo)
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

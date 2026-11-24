"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { IdentityDocumentType, Profile } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { getCoachVerificationGraceStatus } from "@/lib/referrals";
import {
  computeFrameMotionDelta,
  evaluateSmartVerification,
  VerificationChecksBreakdown,
} from "@/lib/smart-verification";
import {
  VerificationStatusPill,
  VerifiedPersonBadge,
} from "@/components/VerificationBadge";

const DOC_TYPE_LABELS: Record<IdentityDocumentType, string> = {
  ine_id: "Credencial INE / Cédula / Licencia (Frente y Reverso)",
  passport: "Pasaporte vigente (Portada y Datos)",
  selfie_id: "Identificación Oficial con Fotografía",
};

type LivenessStep = "idle" | "front" | "left" | "right" | "done";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

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

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const fallbackFaceInputRef = useRef<HTMLInputElement>(null);

  // Live camera liveness refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFramePixelsRef = useRef<Uint8ClampedArray | null>(null);

  const [docType, setDocType] = useState<IdentityDocumentType>(
    profile.identity_document_type || "ine_id"
  );

  // ID Front & Back
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(
    profile.identity_document_url || null
  );
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(
    profile.identity_back_url || null
  );

  // Active Liveness (Camera) state
  const [livenessStep, setLivenessStep] = useState<LivenessStep>(
    profile.face_verification_url ? "done" : "idle"
  );
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [motionHint, setMotionHint] = useState<string | null>(null);
  const [faceCenterUrl, setFaceCenterUrl] = useState<string | null>(
    profile.face_verification_url || null
  );
  const [faceLeftUrl, setFaceLeftUrl] = useState<string | null>(
    profile.liveness_left_url || null
  );
  const [faceRightUrl, setFaceRightUrl] = useState<string | null>(
    profile.liveness_right_url || null
  );
  const [livenessMotionPassed, setLivenessMotionPassed] = useState(
    Boolean(profile.verification_checks?.livenessPassed)
  );

  const [lastScore, setLastScore] = useState<VerificationChecksBreakdown | null>(
    profile.verification_checks || null
  );
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status =
    profile.verification_status ||
    (profile.is_verified_identity ? "verified" : "unverified");
  const coachGrace =
    role === "coach" ? getCoachVerificationGraceStatus(profile) : null;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const readImageFile = (
    file: File,
    onLoaded: (dataUrl: string) => void
  ) => {
    if (file.size > 8 * 1024 * 1024) {
      setError("El archivo supera el límite de 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onLoaded(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleStartLivenessCamera = async () => {
    setError(null);
    setCameraError(null);
    setMotionHint(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setLivenessStep("front");
      setLivenessMotionPassed(false);
      lastFramePixelsRef.current = null;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 80);
    } catch {
      setCameraError(
        "No pudimos acceder a tu cámara. Puedes dar permisos o subir una selfie manual (se marcará para revisión manual)."
      );
    }
  };

  const captureVideoFrame = (): { dataUrl: string; pixels: Uint8ClampedArray } | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { dataUrl, pixels };
  };

  const handleCaptureLivenessStep = () => {
    setMotionHint(null);
    const frame = captureVideoFrame();
    if (!frame) {
      setMotionHint("Espera un segundo a que la cámara enfoque e intenta de nuevo.");
      return;
    }

    if (livenessStep === "front") {
      setFaceCenterUrl(frame.dataUrl);
      lastFramePixelsRef.current = frame.pixels;
      setLivenessStep("left");
      return;
    }

    if (livenessStep === "left") {
      const delta = lastFramePixelsRef.current
        ? computeFrameMotionDelta(lastFramePixelsRef.current, frame.pixels)
        : 1;
      if (delta < 0.03) {
        setMotionHint(
          "No detectamos giro de cabeza. Gira claramente tu rostro hacia la IZQUIERDA y vuelve a capturar."
        );
        return;
      }
      setFaceLeftUrl(frame.dataUrl);
      lastFramePixelsRef.current = frame.pixels;
      setLivenessStep("right");
      return;
    }

    if (livenessStep === "right") {
      const delta = lastFramePixelsRef.current
        ? computeFrameMotionDelta(lastFramePixelsRef.current, frame.pixels)
        : 1;
      if (delta < 0.03) {
        setMotionHint(
          "No detectamos giro hacia la DERECHA. Gira claramente tu rostro al lado contrario y captura."
        );
        return;
      }
      setFaceRightUrl(frame.dataUrl);
      setLivenessMotionPassed(true);
      setLivenessStep("done");
      stopCamera();
    }
  };

  const uploadPrivateImage = async (
    blobOrFile: Blob | File,
    label: string
  ): Promise<string | null> => {
    if (isDemoMode || !authUserId) return null;
    const supabase = createClient();
    const path = `${authUserId}/${label}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("identity-docs")
      .upload(path, blobOrFile, { upsert: true });
    if (upErr) return null;
    const { data: signed } = await supabase.storage
      .from("identity-docs")
      .createSignedUrl(path, 60 * 60 * 24 * 30);
    return signed?.signedUrl || null;
  };

  const handleSubmit = async (autoApproveDemo = false) => {
    setError(null);
    if (!frontPreview) {
      setError("1. Sube la foto del FRENTE (anverso) de tu credencial oficial.");
      return;
    }
    if (role === "coach" && !backPreview) {
      setError("2. Sube la foto del REVERSO (parte trasera) de tu credencial oficial.");
      return;
    }
    if (role === "coach" && !faceCenterUrl) {
      setError("3. Completa la comprobación de rostro con giro de cabeza antes de enviar.");
      return;
    }

    setSubmitting(true);
    try {
      // 1) Evaluación inteligente de calidad, no duplicidad, liveness y similitud rostro-ID
      let checks: VerificationChecksBreakdown | undefined;
      if (role === "coach" && frontPreview && backPreview && faceCenterUrl) {
        checks = await evaluateSmartVerification({
          idFrontUrl: frontPreview,
          idBackUrl: backPreview,
          faceCenterUrl,
          faceLeftUrl,
          faceRightUrl,
          livenessMotionPassed,
        });
        setLastScore(checks);
      }

      // 2) Subida privada a Supabase Storage (si aplica)
      let finalFrontUrl = frontPreview;
      let finalBackUrl = backPreview || undefined;
      let finalFaceUrl = faceCenterUrl || undefined;
      let finalLeftUrl = faceLeftUrl || undefined;
      let finalRightUrl = faceRightUrl || undefined;

      if (!isDemoMode && authUserId) {
        if (frontFile) {
          const uploaded = await uploadPrivateImage(frontFile, "id-front");
          if (uploaded) finalFrontUrl = uploaded;
        }
        if (backFile) {
          const uploaded = await uploadPrivateImage(backFile, "id-back");
          if (uploaded) finalBackUrl = uploaded;
        }
        if (faceCenterUrl?.startsWith("data:")) {
          const uploaded = await uploadPrivateImage(
            dataUrlToBlob(faceCenterUrl),
            "face-center"
          );
          if (uploaded) finalFaceUrl = uploaded;
        }
        if (faceLeftUrl?.startsWith("data:")) {
          const uploaded = await uploadPrivateImage(
            dataUrlToBlob(faceLeftUrl),
            "face-left"
          );
          if (uploaded) finalLeftUrl = uploaded;
        }
        if (faceRightUrl?.startsWith("data:")) {
          const uploaded = await uploadPrivateImage(
            dataUrlToBlob(faceRightUrl),
            "face-right"
          );
          if (uploaded) finalRightUrl = uploaded;
        }
      }

      if (role === "coach") {
        updateCoachProfile({
          identity_back_url: finalBackUrl,
          face_verification_url: finalFaceUrl,
          face_verification_name: `rostro-${Date.now()}.jpg`,
          liveness_left_url: finalLeftUrl,
          liveness_right_url: finalRightUrl,
          verification_confidence_score: checks?.totalScore,
          verification_checks: checks,
        });
      }

      submitIdentityVerification({
        role,
        documentType: docType,
        documentUrl: finalFrontUrl,
        documentName:
          frontFile?.name ||
          profile.identity_document_name ||
          `id-frente-${Date.now()}.jpg`,
        autoApproveDemo,
      });

      setFeedback(
        autoApproveDemo
          ? "¡Verificación completada! Ya cuentas con tu insignia de Persona Real Verificada."
          : checks
          ? `Verificación enviada (Confianza automática: ${checks.totalScore}%). En revisión por administración.`
          : "Documentos enviados correctamente. Tu verificación está en revisión."
      );
      setTimeout(() => setFeedback(null), 5000);
    } catch {
      setError("No se pudo enviar la verificación. Intenta nuevamente.");
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
              Verificación Inteligente de Identidad
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            {role === "coach"
              ? "Sube frente y reverso de tu credencial oficial y realiza la prueba de vida girando la cabeza."
              : "Verifica tu identidad para mostrar tu marca de persona real a tu Coach."}
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
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <VerifiedPersonBadge verified label="Persona Real Verificada" />
            <p className="text-xs text-zinc-300">
              Tu identidad fue validada
              {profile.verified_at
                ? ` el ${new Date(profile.verified_at).toLocaleDateString("es-MX", {
                    dateStyle: "long",
                  })}`
                : ""}
              . Tu insignia verificada ya es visible en tu perfil.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40">
            <BadgeCheck className="h-7 w-7" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {role === "coach" && coachGrace && coachGrace.state !== "verified" && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs text-amber-200">
              Plazo de verificación obligatoria:{" "}
              <strong>
                {coachGrace.state === "expired_locked"
                  ? "Plazo de 15 días vencido — envía tu credencial y prueba de vida para reactivar"
                  : `${coachGrace.daysRemaining} día(s) restantes de 15`}
              </strong>
              . Archivos privados protegidos conforme a la LFPDPPP.
            </div>
          )}

          {status === "pending" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="font-bold">
                  Verificación en revisión
                  {lastScore ? ` · Confianza estimada: ${lastScore.totalScore}%` : ""}
                </p>
                <p className="mt-0.5 text-amber-200/80">
                  Nuestro equipo revisará tu credencial (frente/reverso) y prueba de vida.
                </p>
              </div>
            </div>
          )}

          {status === "rejected" && profile.verification_notes && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3.5 text-xs text-rose-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                <p className="font-bold">Motivo de corrección:</p>
                <p className="mt-0.5">{profile.verification_notes}</p>
              </div>
            </div>
          )}

          {/* Tipo de documento */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Tipo de identificación oficial
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as IdentityDocumentType)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
            >
              {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* PASO 1 y 2: CREDENCIAL FRENTE Y REVERSO */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Frente */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-300">
                1. Credencial — Frente (Anverso) *
              </p>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setFrontFile(f);
                  readImageFile(f, setFrontPreview);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => frontInputRef.current?.click()}
                className="flex min-h-[116px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-[#060607] p-3 text-center transition hover:border-emerald-500/50"
              >
                {frontPreview ? (
                  <img
                    src={frontPreview}
                    alt="Frente de credencial"
                    className="max-h-28 w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs font-medium text-white">
                      Subir foto del FRENTE
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Foto y nombre legibles
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Reverso (obligatorio para Coach) */}
            {role === "coach" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-300">
                  2. Credencial — Reverso (Trasera) *
                </p>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setBackFile(f);
                    readImageFile(f, setBackPreview);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="flex min-h-[116px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-[#060607] p-3 text-center transition hover:border-emerald-500/50"
                >
                  {backPreview ? (
                    <img
                      src={backPreview}
                      alt="Reverso de credencial"
                      className="max-h-28 w-full rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-emerald-400" />
                      <span className="text-xs font-medium text-white">
                        Subir foto del REVERSO
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Parte trasera completa
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* PASO 3: PRUEBA DE VIDA ACTIVA CON GIRO DE CABEZA (COACH) */}
          {role === "coach" && (
            <div className="space-y-3 rounded-xl border border-emerald-500/25 bg-[#060607] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">
                    3. Prueba de Vida Activa (Cámara + Giro de Cabeza) *
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Comprueba que eres una persona real: mira al frente, gira a la
                    izquierda y luego a la derecha.
                  </p>
                </div>
                {livenessStep === "done" && (
                  <button
                    type="button"
                    onClick={handleStartLivenessCamera}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Repetir
                  </button>
                )}
              </div>

              {cameraActive ? (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-black">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="h-64 w-full -scale-x-100 object-cover"
                    />
                    {/* Guía ovalada facial */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-44 w-36 rounded-full border-2 border-dashed border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                    </div>
                    <div className="absolute inset-x-3 bottom-3 rounded-lg bg-black/80 px-3 py-2 text-center text-xs font-bold text-emerald-300 backdrop-blur">
                      {livenessStep === "front" &&
                        "Paso 1/3: Mira directo al frente dentro del óvalo"}
                      {livenessStep === "left" &&
                        "Paso 2/3: Gira lentamente tu cabeza a la IZQUIERDA ←"}
                      {livenessStep === "right" &&
                        "Paso 3/3: Ahora gira tu cabeza a la DERECHA →"}
                    </div>
                  </div>

                  {motionHint && (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                      {motionHint}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="h-10 rounded-xl border border-white/15 px-4 text-xs font-semibold text-zinc-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCaptureLivenessStep}
                      className="h-10 flex-1 rounded-xl bg-emerald-500 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
                    >
                      {livenessStep === "front"
                        ? "Capturar rostro al frente"
                        : livenessStep === "left"
                        ? "Capturar giro IZQUIERDA ←"
                        : "Capturar giro DERECHA →"}
                    </button>
                  </div>
                </div>
              ) : livenessStep === "done" && faceCenterUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <FileCheck2 className="h-4 w-4" />
                    {livenessMotionPassed
                      ? "Prueba de vida activa completada (Frente + Izquierda + Derecha)"
                      : "Selfie cargada manualmente (se marcará para revisión manual)"}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0e0f12] p-1 text-center">
                      <img
                        src={faceCenterUrl}
                        alt="Rostro frente"
                        className="h-20 w-full rounded object-cover"
                      />
                      <span className="mt-1 block text-[10px] text-zinc-400">Frente</span>
                    </div>
                    {faceLeftUrl && (
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0e0f12] p-1 text-center">
                        <img
                          src={faceLeftUrl}
                          alt="Giro izquierda"
                          className="h-20 w-full rounded object-cover"
                        />
                        <span className="mt-1 block text-[10px] text-zinc-400">
                          Izquierda
                        </span>
                      </div>
                    )}
                    {faceRightUrl && (
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0e0f12] p-1 text-center">
                        <img
                          src={faceRightUrl}
                          alt="Giro derecha"
                          className="h-20 w-full rounded object-cover"
                        />
                        <span className="mt-1 block text-[10px] text-zinc-400">
                          Derecha
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleStartLivenessCamera}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500 hover:text-[#0a0a0a]"
                  >
                    <Camera className="h-4 w-4" />
                    Iniciar prueba de vida en cámara (girar cabeza)
                  </button>

                  {cameraError && (
                    <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
                      <p>{cameraError}</p>
                      <input
                        ref={fallbackFaceInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          readImageFile(f, (url) => {
                            setFaceCenterUrl(url);
                            setLivenessMotionPassed(false);
                            setLivenessStep("done");
                          });
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fallbackFaceInputRef.current?.click()}
                        className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-950"
                      >
                        Subir selfie manual (revisión manual)
                      </button>
                    </div>
                  )}
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
              {submitting ? "Analizando y enviando..." : "Enviar Verificación"}
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

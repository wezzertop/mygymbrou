"use client";

import React, { useRef, useState } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  FileUp,
  Hash,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CertificationCategory, CoachCertification } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { DiplomaViewerModal } from "@/components/DiplomaViewerModal";
import { CertifiedCoachBadge } from "@/components/VerificationBadge";

const CATEGORY_OPTIONS: { value: CertificationCategory; label: string }[] = [
  { value: "entrenamiento", label: "Entrenamiento / Fuerza" },
  { value: "nutricion", label: "Nutrición Deportiva" },
  { value: "salud", label: "Salud / Antropometría" },
  { value: "especialidad", label: "Especialidad / Diplomado" },
];

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CoachCertificationsManager() {
  const {
    coachProfile,
    coachCertifications,
    isDemoMode,
    authUserId,
    addCoachCertification,
    deleteCoachCertification,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingCert, setViewingCert] = useState<CoachCertification | null>(
    null
  );

  // Upload form state
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [issueYear, setIssueYear] = useState(String(new Date().getFullYear()));
  const [credentialId, setCredentialId] = useState("");
  const [category, setCategory] =
    useState<CertificationCategory>("entrenamiento");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image">("pdf");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const myCertifications = coachCertifications.filter(
    (c) => c.coach_id === coachProfile.id || !coachProfile.id
  );

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo supera 10 MB. Sube un PDF o imagen de menor tamaño.");
      return;
    }
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    setFileObj(file);
    setFileType(isPdf ? "pdf" : "image");

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFileDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !institution.trim()) {
      setError("Completa el título del diploma y la institución emisora.");
      return;
    }
    if (!fileObj || !fileDataUrl) {
      setError("Adjunta el archivo de tu diploma o certificado (PDF o Imagen).");
      return;
    }

    setUploading(true);
    try {
      let finalUrl = fileDataUrl;

      if (!isDemoMode && authUserId) {
        const supabase = createClient();
        const ext = fileObj.name.split(".").pop() || "pdf";
        const storagePath = `${authUserId}/diploma-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("coach-certifications")
          .upload(storagePath, fileObj, { upsert: true });
        if (!uploadError) {
          const { data: pub } = supabase.storage
            .from("coach-certifications")
            .getPublicUrl(storagePath);
          if (pub?.publicUrl) {
            finalUrl = pub.publicUrl;
          }
        }
      }

      addCoachCertification({
        coach_id: coachProfile.id,
        title: title.trim(),
        institution: institution.trim(),
        issue_year: Number(issueYear) || new Date().getFullYear(),
        credential_id: credentialId.trim() || undefined,
        category,
        file_name: fileObj.name,
        file_url: finalUrl,
        file_type: fileType,
        file_size_bytes: fileObj.size,
      });

      setTitle("");
      setInstitution("");
      setCredentialId("");
      setFileObj(null);
      setFileDataUrl(null);
      setShowForm(false);
      setToast("¡Diploma publicado! Ya es visible para los alumnos que busquen coach.");
      setTimeout(() => setToast(null), 3500);
    } catch {
      setError("No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Award className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">
              Mis Diplomas y Certificaciones (Archivos Públicos)
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Sube tus títulos, diplomas o certificados en PDF o imagen. Los alumnos
            que busquen coach podrán verlos y verificar tu formación profesional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CertifiedCoachBadge diplomaCount={myCertifications.length} />
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 px-3.5 py-2 text-xs font-bold text-zinc-950 transition "
          >
            {showForm ? (
              <>
                <X className="h-3.5 w-3.5" />
                Cerrar
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Subir Diploma
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAddCert}
          className="space-y-4 rounded-2xl border border-white/15 bg-[#060607] p-5"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Nuevo Diploma o Certificado
          </p>

          {error && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300">
              {error}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Nombre del diploma / certificación *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Certificación Internacional NSCA-CPT"
                className="w-full rounded-xl border border-white/15 bg-[#0e0f12] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Institución / Federación emisora *
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ej. NSCA, ISAK, Universidad..."
                className="w-full rounded-xl border border-white/15 bg-[#0e0f12] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as CertificationCategory)
                }
                className="w-full rounded-xl border border-white/15 bg-[#0e0f12] px-3 py-2 text-xs text-white"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Año de emisión
              </label>
              <input
                type="number"
                min={1980}
                max={2035}
                value={issueYear}
                onChange={(e) => setIssueYear(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#0e0f12] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Folio / Cédula (opcional)
              </label>
              <input
                type="text"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="Ej. ISAK-L2-88412"
                className="w-full rounded-xl border border-white/15 bg-[#0e0f12] px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFilePick}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-[#0e0f12] px-4 py-5 text-center transition hover:border-emerald-500/60"
            >
              <FileUp className="h-6 w-6 text-emerald-400" />
              <p className="text-xs font-bold text-white">
                {fileObj
                  ? `${fileObj.name} (${formatFileSize(fileObj.size)})`
                  : "Seleccionar archivo del diploma (PDF, PNG, JPG)"}
              </p>
              <p className="text-[11px] text-zinc-400">
                Tamaño máximo 10 MB · Visible en tu perfil público de Coach
              </p>
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              <Award className="h-4 w-4" />
              {uploading ? "Subiendo..." : "Publicar Diploma"}
            </button>
          </div>
        </form>
      )}

      {/* Existing Diplomas List */}
      {myCertifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#060607] p-6 text-center">
          <Award className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm font-bold text-zinc-300">
            Aún no has subido diplomas o certificaciones
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Agrega tus archivos PDF o imágenes para obtener el sello de Coach
            Certificado y destacar frente a alumnos buscando entrenador.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {myCertifications.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#060607] p-4 transition hover:border-emerald-500/40"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <BadgeCheck className="h-3 w-3" />
                    {cert.file_type === "pdf" ? "PDF Certificado" : "Imagen Diploma"}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteCoachCertification(cert.id)}
                    aria-label="Eliminar diploma"
                    className="rounded-lg p-1 text-zinc-500 transition hover:bg-rose-500/15 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-bold leading-snug text-white">
                  {cert.title}
                </h3>

                <div className="space-y-1 text-[11px] text-zinc-400">
                  <p className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    <span className="truncate">{cert.institution}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-400" />
                      {cert.issue_year}
                    </span>
                    {cert.credential_id && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-300">
                        <Hash className="h-3 w-3 text-amber-400" />
                        {cert.credential_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
                <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-500">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span className="truncate">{cert.file_name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setViewingCert(cert)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/[0.08] bg-cyan-500/10 px-3 py-1.5 text-[11px] font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver Archivo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DiplomaViewerModal
        certification={viewingCert}
        coachName={coachProfile.full_name}
        onClose={() => setViewingCert(null)}
      />
    </section>
  );
}

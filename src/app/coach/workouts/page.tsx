"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Dumbbell,
  Layers,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ExerciseVisualDemo } from "@/components/ExerciseVisualDemo";
import { loadLiveExerciseCatalog } from "@/lib/live-exercise-catalog";
import {
  ExerciseFrame,
  ExerciseLibraryItem,
  Gender,
  MuscleGroup,
  WorkoutExercise,
} from "@/types/database";

const MUSCLE_GROUPS: ("Todos" | MuscleGroup)[] = [
  "Todos",
  "Pecho",
  "Espalda",
  "Pierna",
  "Hombro",
  "Bíceps",
  "Tríceps",
  "Abdomen",
  "Cardio",
];

const WEEKDAYS = [
  { num: 1, label: "Lun" },
  { num: 2, label: "Mar" },
  { num: 3, label: "Mié" },
  { num: 4, label: "Jue" },
  { num: 5, label: "Vie" },
  { num: 6, label: "Sáb" },
  { num: 0, label: "Dom" },
];

export default function CoachWorkoutsPage() {
  const {
    coachProfile,
    students,
    workouts,
    exerciseLibrary,
    addExerciseToLibrary,
    addWorkoutPlan,
    assignWorkoutToStudent,
  } = useApp();

  const activeStudents = students.filter((s) => s.student_id);
  const [viewTab, setViewTab] = useState<"catalog" | "templates">("catalog");
  const [builderModalOpen, setBuilderModalOpen] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [quickAssignTemplateId, setQuickAssignTemplateId] = useState<string | null>(
    null
  );
  const [quickAssignStudentId, setQuickAssignStudentId] = useState(
    activeStudents[0]?.student_id || ""
  );

  // Catalog filter + Gender preview + Live ExerciseDB GIF catalog
  const [groupFilter, setGroupFilter] = useState<"Todos" | MuscleGroup>("Todos");
  const [search, setSearch] = useState("");
  const [previewGender, setPreviewGender] = useState<Gender>("female");
  const [externalExercises, setExternalExercises] = useState<ExerciseLibraryItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingCatalog(true);
    loadLiveExerciseCatalog()
      .then((list) => {
        if (active) setExternalExercises(list);
      })
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Routine Builder state
  const [targetStudentId, setTargetStudentId] = useState(
    activeStudents[0]?.student_id || "student-1"
  );
  const [routineTitle, setRoutineTitle] = useState("Rutina Personalizada Visual");
  const [dayTitle, setDayTitle] = useState("Día 1: Fuerza y Tonificación");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3, 5]);
  const [draftExercises, setDraftExercises] = useState<WorkoutExercise[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Custom Exercise Modal (3-4 Frame Sequence + Muscle Highlights)
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState<MuscleGroup>("Pierna");
  const [customEquipment, setCustomEquipment] = useState("Mancuernas");
  const [customPrimaryMuscles, setCustomPrimaryMuscles] = useState(
    "Glúteo mayor, Cuádriceps"
  );
  const [customSecondaryMuscles, setCustomSecondaryMuscles] = useState("Core");
  const [customInstructions, setCustomInstructions] = useState("");
  const [customGenderVariant, setCustomGenderVariant] =
    useState<Gender>("female");
  const [frame1Url, setFrame1Url] = useState("");
  const [frame2Url, setFrame2Url] = useState("");
  const [frame3Url, setFrame3Url] = useState("");
  const [frame4Url, setFrame4Url] = useState("");
  const [customInterval, setCustomInterval] = useState("650");

  const localFiltered = exerciseLibrary.filter((ex) => {
    const matchGroup = groupFilter === "Todos" || ex.muscle_group === groupFilter;
    const matchSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase()) ||
      (ex.primary_muscles || []).some((m) =>
        m.toLowerCase().includes(search.toLowerCase())
      );
    return matchGroup && matchSearch;
  });

  const externalFiltered = externalExercises.filter((ex) => {
    const matchGroup = groupFilter === "Todos" || ex.muscle_group === groupFilter;
    const matchSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase()) ||
      (ex.primary_muscles || []).some((m) =>
        m.toLowerCase().includes(search.toLowerCase())
      );
    return matchGroup && matchSearch;
  });

  // Merge local anatomical exercises first + live external catalog (up to 36 visible for smooth perf)
  const filteredCatalog = [
    ...localFiltered,
    ...externalFiltered.filter(
      (ext) =>
        !localFiltered.some(
          (loc) => loc.name.toLowerCase() === ext.name.toLowerCase()
        )
    ),
  ].slice(0, 36);

  const handleSelectStudent = (studentId: string) => {
    setTargetStudentId(studentId);
    const st = activeStudents.find((s) => s.student_id === studentId);
    if (st?.gender) {
      setPreviewGender(st.gender);
    }
  };

  const toggleWeekday = (num: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(num) ? prev.filter((d) => d !== num) : [...prev, num]
    );
  };

  const handleAddFromCatalog = (item: ExerciseLibraryItem) => {
    const next: WorkoutExercise = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      workout_day_id: "draft-day",
      exercise_library_id: item.id,
      sort_order: draftExercises.length + 1,
      name: item.name,
      muscle_group: item.muscle_group,
      primary_muscles: item.primary_muscles,
      secondary_muscles: item.secondary_muscles,
      sets: 4,
      reps: "10-12",
      rest_seconds: 90,
      target_weight_or_rpe: "RPE 8",
      coach_notes: "",
      instructions: item.instructions,
      media_url: item.media_url,
      media_type: item.media_type,
      frames: item.frames,
      frame_interval_ms: item.frame_interval_ms || 650,
      animation_key: item.animation_key,
    };
    setDraftExercises((prev) => [...prev, next]);
  };

  const updateDraftExercise = (
    id: string,
    patch: Partial<WorkoutExercise>
  ) => {
    setDraftExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const handlePublishRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftExercises.length === 0) return;
    const dayId = `day-${Date.now()}`;
    addWorkoutPlan({
      coach_id: coachProfile.id,
      student_id: saveAsTemplate ? null : targetStudentId,
      is_template: saveAsTemplate,
      title: saveAsTemplate ? `Plantilla: ${routineTitle}` : routineTitle,
      description:
        "Rutina armada desde el Catálogo Anatómico Visual con días asignados.",
      goal: "Personalizado",
      level: "intermedio",
      is_active: true,
      days: [
        {
          id: dayId,
          workout_id: "pending",
          day_number: 1,
          title: dayTitle,
          focus_area: draftExercises[0]?.muscle_group || "General",
          assigned_weekdays:
            selectedWeekdays.length > 0 ? selectedWeekdays : [1, 3, 5],
          estimated_minutes: Math.max(35, draftExercises.length * 12),
          exercises: draftExercises.map((ex, idx) => ({
            ...ex,
            workout_day_id: dayId,
            sort_order: idx + 1,
          })),
        },
      ],
    });
    setDraftExercises([]);
    setBuilderModalOpen(false);
    setToast(
      saveAsTemplate
        ? "Plantilla guardada. Ya puedes asignarla en 1 clic desde Mis Plantillas."
        : "Rutina asignada y enviada al alumno al instante."
    );
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const rawUrls = [
      { label: "Inicio", url: frame1Url.trim() },
      { label: "Ejecución", url: frame2Url.trim() },
      { label: "Contracción máxima", url: frame3Url.trim() },
      { label: "Retorno controlado", url: frame4Url.trim() },
    ].filter((f) => f.url.length > 0);

    const customFrames: ExerciseFrame[] =
      rawUrls.length > 0
        ? rawUrls.map((f, idx) => ({
            phase: idx + 1,
            label: f.label,
            image_url: f.url,
          }))
        : [
            {
              phase: 1,
              label: "Posición inicial",
              image_url: `/exercises/anatomical/bulgarian-female-1.jpg`,
            },
            {
              phase: 2,
              label: "Ejecución controlada",
              image_url: `/exercises/anatomical/bulgarian-female-2.jpg`,
            },
            {
              phase: 3,
              label: "Contracción máxima",
              image_url: `/exercises/anatomical/bulgarian-female-3.jpg`,
            },
          ];

    const created = addExerciseToLibrary({
      coach_id: coachProfile.id,
      name: customName,
      muscle_group: customGroup,
      primary_muscles: customPrimaryMuscles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      secondary_muscles: customSecondaryMuscles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      equipment: customEquipment,
      instructions:
        customInstructions ||
        "Ejecuta el movimiento con control, buena postura y rango completo.",
      media_type: "sequence",
      frames: {
        female: customGenderVariant === "female" ? customFrames : customFrames,
        male: customGenderVariant === "male" ? customFrames : customFrames,
      },
      frame_interval_ms: Number(customInterval) || 650,
    });

    handleAddFromCatalog(created);
    setCustomModalOpen(false);
    setCustomName("");
    setCustomInstructions("");
    setFrame1Url("");
    setFrame2Url("");
    setFrame3Url("");
    setFrame4Url("");
    setToast("Ejercicio con secuencia de fotogramas guardado y agregado.");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Rutinas con Secuencia Anatómica
          </h1>
          <p className="text-sm text-zinc-400">
            Previsualiza secuencias de 3–4 fotogramas en Dark UI por género
            (Mujer/Hombre) y arma rutinas en segundos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Preview Switcher */}
          <div className="flex flex-1 rounded-xl border border-white/[0.08] bg-[#060607] p-1 text-xs font-bold sm:flex-none">
            <button
              type="button"
              onClick={() => setPreviewGender("female")}
              className={`flex-1 rounded-lg px-3 py-1.5 transition sm:flex-none ${
                previewGender === "female"
                  ? "bg-rose-500/20 text-rose-300"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Vista Mujer
            </button>
            <button
              type="button"
              onClick={() => setPreviewGender("male")}
              className={`flex-1 rounded-lg px-3 py-1.5 transition sm:flex-none ${
                previewGender === "male"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Vista Hombre
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCustomModalOpen(true)}
            className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 sm:flex-none"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">Subir Secuencia</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Clean Top Navigation Tabs + Instant Assign Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setViewTab("catalog")}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition ${
              viewTab === "catalog"
                ? "bg-white text-zinc-950"
                : "border border-white/10 bg-[#0e0f12] text-zinc-400 hover:text-white"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            Catálogo ({filteredCatalog.length})
          </button>
          <button
            type="button"
            onClick={() => setViewTab("templates")}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition ${
              viewTab === "templates"
                ? "bg-white text-zinc-950"
                : "border border-white/10 bg-[#0e0f12] text-zinc-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Mis Rutinas ({workouts.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setBuilderModalOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
        >
          <Send className="h-3.5 w-3.5" />
          Asignar rutina
          {draftExercises.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-zinc-950">
              {draftExercises.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB: MIS RUTINAS Y PLANTILLAS (Asignación en 1 clic) */}
      {viewTab === "templates" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {workouts.map((w) => (
            <div
              key={w.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    {w.is_template ? "Plantilla" : "Rutina activa"}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {w.days.length} día(s) ·{" "}
                    {w.days.reduce((sum, d) => sum + d.exercises.length, 0)} ejerc.
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-white">
                  {w.title}
                </h3>
                {w.description && (
                  <p className="mt-1 text-xs text-zinc-400">{w.description}</p>
                )}
              </div>

              {quickAssignTemplateId === w.id ? (
                <div className="space-y-2.5 rounded-xl border border-white/10 bg-[#060607] p-3">
                  <select
                    value={quickAssignStudentId}
                    onChange={(e) => setQuickAssignStudentId(e.target.value)}
                    className="min-h-[40px] w-full rounded-lg border border-white/10 bg-[#0e0f12] px-3 text-xs text-white"
                  >
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.student_id!}>
                        {s.invited_name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!quickAssignStudentId) return;
                        assignWorkoutToStudent(w.id, quickAssignStudentId);
                        setQuickAssignTemplateId(null);
                        setToast(`Rutina "${w.title}" asignada al alumno.`);
                        setTimeout(() => setToast(null), 3200);
                      }}
                      className="h-9 flex-1 rounded-full bg-white text-xs font-semibold text-zinc-950"
                    >
                      Confirmar envío
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAssignTemplateId(null)}
                      className="h-9 rounded-full border border-white/10 px-3 text-xs text-zinc-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={activeStudents.length === 0}
                  onClick={() => {
                    setQuickAssignStudentId(activeStudents[0]?.student_id || "");
                    setQuickAssignTemplateId(w.id);
                  }}
                  className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  Asignar a un alumno
                </button>
              )}
            </div>
          ))}
          {workouts.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/[0.08] bg-[#0e0f12] py-12 text-center text-sm text-zinc-500">
              Aún no tienes rutinas guardadas. Selecciona ejercicios en el Catálogo para crear tu primera rutina.
            </div>
          )}
        </div>
      )}

      {/* Floating Sticky Action Bar (Mobile & Desktop) when exercises are selected */}
      {viewTab === "catalog" && draftExercises.length > 0 && !builderModalOpen && (
        <div className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-emerald-500/40 bg-[#0e0f12]/95 py-2 pl-4 pr-2 shadow-2xl backdrop-blur-xl lg:bottom-6">
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[11px] font-bold text-zinc-950">
              {draftExercises.length}
            </span>
            <span className="truncate">ejercicio(s) listos</span>
          </div>
          <button
            type="button"
            onClick={() => setBuilderModalOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Asignar ahora
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Quick Routine Builder & Assignment Modal (Zero Scrolling Needed!) */}
      {builderModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Armar y asignar rutina"
          onClick={() => setBuilderModalOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <form
            onSubmit={handlePublishRoutine}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0e0f12] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Asignar Rutina ({draftExercises.length} ejerc.)
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Elige alumno o guarda como plantilla reutilizable.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBuilderModalOpen(false)}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Toggle: Assign to Student vs Save as Template */}
              <div className="grid grid-cols-2 gap-1.5 rounded-full border border-white/10 bg-[#060607] p-1">
                <button
                  type="button"
                  onClick={() => setSaveAsTemplate(false)}
                  className={`h-9 rounded-full text-xs font-medium transition ${
                    !saveAsTemplate
                      ? "bg-white text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Asignar a alumno
                </button>
                <button
                  type="button"
                  onClick={() => setSaveAsTemplate(true)}
                  className={`h-9 rounded-full text-xs font-medium transition ${
                    saveAsTemplate
                      ? "bg-white text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Guardar plantilla
                </button>
              </div>

              {!saveAsTemplate && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Alumno destino
                  </label>
                  <select
                    value={targetStudentId}
                    onChange={(e) => handleSelectStudent(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3 text-sm text-white outline-none focus:border-emerald-500/60"
                  >
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.student_id!}>
                        {s.invited_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Nombre de la rutina
                  </label>
                  <input
                    type="text"
                    required
                    value={routineTitle}
                    onChange={(e) => setRoutineTitle(e.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-white/10 bg-[#060607] px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Título del día
                  </label>
                  <input
                    type="text"
                    required
                    value={dayTitle}
                    onChange={(e) => setDayTitle(e.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-white/10 bg-[#060607] px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Días asignados
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((d) => {
                    const active = selectedWeekdays.includes(d.num);
                    return (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => toggleWeekday(d.num)}
                        className={`h-8 rounded-full px-3 text-xs font-medium transition ${
                          active
                            ? "bg-emerald-500 text-zinc-950"
                            : "border border-white/10 bg-[#060607] text-zinc-400"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">
                  Ejercicios seleccionados ({draftExercises.length})
                </p>
                {draftExercises.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-zinc-500">
                    Agrega ejercicios desde el catálogo y luego pulsa &ldquo;Asignar ahora&rdquo;.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {draftExercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="rounded-xl border border-white/[0.08] bg-[#060607] p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-white">
                            {ex.name}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setDraftExercises((prev) =>
                                prev.filter((item) => item.id !== ex.id)
                              )
                            }
                            aria-label="Quitar ejercicio"
                            className="text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={ex.sets}
                            onChange={(e) =>
                              updateDraftExercise(ex.id, {
                                sets: Number(e.target.value) || 3,
                              })
                            }
                            aria-label="Series"
                            className="h-9 rounded-lg border border-white/10 bg-[#0e0f12] px-2 text-xs text-white"
                            placeholder="Series"
                          />
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) =>
                              updateDraftExercise(ex.id, { reps: e.target.value })
                            }
                            aria-label="Repeticiones"
                            className="h-9 rounded-lg border border-white/10 bg-[#0e0f12] px-2 text-xs text-white"
                            placeholder="Reps"
                          />
                          <input
                            type="number"
                            min="15"
                            max="300"
                            value={ex.rest_seconds}
                            onChange={(e) =>
                              updateDraftExercise(ex.id, {
                                rest_seconds: Number(e.target.value) || 90,
                              })
                            }
                            aria-label="Descanso en segundos"
                            className="h-9 rounded-lg border border-white/10 bg-[#0e0f12] px-2 text-xs text-white"
                            placeholder="Descanso s"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/[0.08] p-4">
              <button
                type="submit"
                disabled={draftExercises.length === 0}
                className="h-11 w-full rounded-full bg-white text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-40"
              >
                {saveAsTemplate
                  ? "Guardar como Plantilla"
                  : "Publicar y asignar al alumno"}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewTab === "catalog" && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT: Visual Anatomical Exercise Catalog */}
        <section className="min-w-0 space-y-4 lg:col-span-7">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ejercicio, músculo o equipo..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#0e0f12] py-2.5 pl-9 pr-9 text-xs text-white outline-none transition focus:border-cyan-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Muscle Group Pills */}
          <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto pb-1">
            {MUSCLE_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupFilter(g)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  groupFilter === g
                    ? "bg-cyan-500 text-zinc-950"
                    : "border border-white/[0.08] bg-[#0e0f12] text-zinc-400 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Catalog Count & Live API Indicator */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Catálogo en vivo:{" "}
              <strong className="text-white">{filteredCatalog.length}</strong>{" "}
              ejercicios animados en {groupFilter}
            </span>
            {loadingCatalog && (
              <span className="inline-flex items-center gap-1 text-cyan-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cargando GIFs...
              </span>
            )}
          </div>

          {/* Exercise Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-3.5 transition hover:border-cyan-500/40"
              >
                <div className="flex min-w-0 gap-3">
                  <ExerciseVisualDemo
                    name={item.name}
                    gender={previewGender}
                    frames={item.frames}
                    frameIntervalMs={item.frame_interval_ms}
                    mediaUrl={item.media_url}
                    mediaType={item.media_type}
                    primaryMuscles={item.primary_muscles}
                    secondaryMuscles={item.secondary_muscles}
                    instructions={item.instructions}
                    compact
                  />
                  <div className="min-w-0 flex-1">
                    <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                      {item.muscle_group}
                    </span>
                    <h3 className="mt-1 text-xs font-bold text-white">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {item.equipment}
                    </p>
                    {item.primary_muscles && item.primary_muscles.length > 0 && (
                      <p className="mt-1 truncate text-[10px] font-semibold text-rose-400">
                        ● {item.primary_muscles.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddFromCatalog(item)}
                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-zinc-950 active:scale-[0.98]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar a la Rutina
                </button>
              </div>
            ))}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#0e0f12]/40 p-8 text-center">
              <p className="text-sm font-bold text-white">
                No encontramos ejercicios con esa búsqueda
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Prueba otro músculo o sube tu propia secuencia de fotogramas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setGroupFilter("Todos");
                }}
                className="mt-4 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12]"
              >
                Ver todo el catálogo
              </button>
            </div>
          )}
        </section>

        {/* RIGHT: Active Routine Builder (Desktop sidebar — Mobile uses floating bar + modal) */}
        <form
          id="routine-builder"
          onSubmit={handlePublishRoutine}
          className="hidden h-fit min-w-0 scroll-mt-20 space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:p-5 lg:sticky lg:top-6 lg:col-span-5 lg:block"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              Armar y Asignar Rutina
            </h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              {draftExercises.length} ejerc.
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Alumno destino (adapta figura Mujer/Hombre automáticamente)
            </label>
            <select
              value={targetStudentId}
              onChange={(e) => handleSelectStudent(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs font-semibold text-white"
            >
              {activeStudents.map((s) => (
                <option key={s.id} value={s.student_id || ""}>
                  {s.invited_name} ({s.gender === "male" ? "Hombre" : "Mujer"} ·{" "}
                  {s.subscription_plan_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">
                Nombre de rutina
              </label>
              <input
                type="text"
                required
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">
                Sesión / Día
              </label>
              <input
                type="text"
                required
                value={dayTitle}
                onChange={(e) => setDayTitle(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Weekday Picker */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-zinc-300">
              Días asignados en calendario
            </label>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((wd) => {
                const active = selectedWeekdays.includes(wd.num);
                return (
                  <button
                    key={wd.num}
                    type="button"
                    onClick={() => toggleWeekday(wd.num)}
                    className={`rounded-lg py-1.5 text-[11px] font-bold transition ${
                      active
                        ? "bg-cyan-500 text-zinc-950"
                        : "border border-white/[0.08] bg-[#060607] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {wd.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Draft Exercise List */}
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {draftExercises.map((ex, idx) => (
              <div
                key={ex.id}
                className="space-y-2 rounded-xl border border-white/[0.08] bg-[#060607] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white">
                    {idx + 1}. {ex.name}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftExercises((prev) =>
                        prev.filter((i) => i.id !== ex.id)
                      )
                    }
                    className="text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-1.5">
                  <div>
                    <label className="text-[9px] text-zinc-500">Series</label>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) =>
                        updateDraftExercise(ex.id, {
                          sets: Number(e.target.value) || 3,
                        })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0e0f12] px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500">Reps</label>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) =>
                        updateDraftExercise(ex.id, { reps: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0e0f12] px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500">Desc(s)</label>
                    <input
                      type="number"
                      value={ex.rest_seconds}
                      onChange={(e) =>
                        updateDraftExercise(ex.id, {
                          rest_seconds: Number(e.target.value) || 60,
                        })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0e0f12] px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500">Peso/RPE</label>
                    <input
                      type="text"
                      value={ex.target_weight_or_rpe || ""}
                      onChange={(e) =>
                        updateDraftExercise(ex.id, {
                          target_weight_or_rpe: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0e0f12] px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
            {draftExercises.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center text-xs text-zinc-500">
                Toca &ldquo;Agregar a la Rutina&rdquo; en cualquier ejercicio
                del catálogo anatómico.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={draftExercises.length === 0 || activeStudents.length === 0}
            className="min-h-[44px] w-full rounded-xl bg-white hover:bg-zinc-200 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-none transition  active:scale-[0.98] disabled:opacity-40"
          >
            {activeStudents.length === 0
              ? "Activa un alumno primero para publicar"
              : "Publicar Rutina Visual al Alumno"}
          </button>
        </form>
      </div>
      )}

      {/* Custom 3-4 Frame Sequence Modal */}
      {customModalOpen && (
        <div
          onClick={() => setCustomModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0e0f12] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Configurar Secuencia de 3–4 Fotogramas
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Sube URLs de Supabase Storage o imágenes Dark UI por fase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomModalOpen(false)}
                aria-label="Cerrar modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomExercise} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs text-zinc-300">
                  Nombre del ejercicio *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej. Sentadilla Hack Profunda"
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-300">
                    Grupo muscular
                  </label>
                  <select
                    value={customGroup}
                    onChange={(e) =>
                      setCustomGroup(e.target.value as MuscleGroup)
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-2.5 py-2 text-xs text-white"
                  >
                    {MUSCLE_GROUPS.filter((g) => g !== "Todos").map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-300">
                    Variante género
                  </label>
                  <select
                    value={customGenderVariant}
                    onChange={(e) =>
                      setCustomGenderVariant(e.target.value as Gender)
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-2.5 py-2 text-xs text-white"
                  >
                    <option value="female">Mujer</option>
                    <option value="male">Hombre</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-300">
                    Velocidad (ms)
                  </label>
                  <input
                    type="number"
                    min={450}
                    max={1100}
                    step={50}
                    value={customInterval}
                    onChange={(e) => setCustomInterval(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-2.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-300">
                    Músculos principales
                  </label>
                  <input
                    type="text"
                    value={customPrimaryMuscles}
                    onChange={(e) => setCustomPrimaryMuscles(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-300">
                    Músculos secundarios
                  </label>
                  <input
                    type="text"
                    value={customSecondaryMuscles}
                    onChange={(e) => setCustomSecondaryMuscles(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-[#060607] p-3">
                <p className="text-[11px] font-bold text-cyan-400">
                  Secuencia de Fotogramas (URLs de Supabase Storage o local)
                </p>
                <input
                  type="text"
                  value={frame1Url}
                  onChange={(e) => setFrame1Url(e.target.value)}
                  placeholder="Fase 1 (Inicio) — https://..."
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0e0f12] px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={frame2Url}
                  onChange={(e) => setFrame2Url(e.target.value)}
                  placeholder="Fase 2 (Ejecución) — https://..."
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0e0f12] px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={frame3Url}
                  onChange={(e) => setFrame3Url(e.target.value)}
                  placeholder="Fase 3 (Contracción máxima) — https://..."
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0e0f12] px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={frame4Url}
                  onChange={(e) => setFrame4Url(e.target.value)}
                  placeholder="Fase 4 (Retorno - opcional) — https://..."
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0e0f12] px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-300">
                  Equipo e instrucciones técnicas
                </label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Pasos breves de ejecución correcta..."
                  className="w-full rounded-xl border border-white/15 bg-[#060607] p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-white hover:bg-zinc-200 py-3 text-xs font-bold text-zinc-950"
              >
                Guardar Secuencia en Biblioteca
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import type { WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/types/database";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_DB_MEDIA_TYPES = new Set(["gif", "video", "lottie", "svg_anim"]);

function asUuidOrNull(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  return UUID_REGEX.test(val.trim()) ? val.trim() : null;
}

function sanitizeDbMediaType(
  val?: string | null
): "gif" | "video" | "lottie" | "svg_anim" {
  if (val && VALID_DB_MEDIA_TYPES.has(val)) {
    return val as "gif" | "video" | "lottie" | "svg_anim";
  }
  return "svg_anim";
}

export async function GET() {
  try {
    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ mode: "demo", workouts: [] });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { data: workoutRows, error: workoutsErr } = await adminClient
      .from("workouts")
      .select("*")
      .or(`coach_id.eq.${user.id},student_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (workoutsErr) {
      return NextResponse.json({ error: workoutsErr.message }, { status: 400 });
    }

    if (!workoutRows || workoutRows.length === 0) {
      return NextResponse.json({ mode: "supabase", workouts: [] });
    }

    const workoutIds = workoutRows.map((w) => w.id);

    const { data: dayRows, error: daysErr } = await adminClient
      .from("workout_days")
      .select("*")
      .in("workout_id", workoutIds)
      .order("day_number", { ascending: true });

    if (daysErr) {
      return NextResponse.json({ error: daysErr.message }, { status: 400 });
    }

    const dayIds = (dayRows || []).map((d) => d.id);
    let exerciseRows: Record<string, unknown>[] = [];

    if (dayIds.length > 0) {
      const { data: exData, error: exErr } = await adminClient
        .from("workout_exercises")
        .select("*")
        .in("workout_day_id", dayIds)
        .order("sort_order", { ascending: true });

      if (exErr) {
        return NextResponse.json({ error: exErr.message }, { status: 400 });
      }
      exerciseRows = (exData || []) as Record<string, unknown>[];
    }

    const exercisesByDay = new Map<string, WorkoutExercise[]>();
    for (const row of exerciseRows) {
      const dayId = String(row.workout_day_id);
      const list = exercisesByDay.get(dayId) || [];
      list.push({
        id: String(row.id),
        workout_day_id: dayId,
        exercise_library_id: row.exercise_library_id
          ? String(row.exercise_library_id)
          : undefined,
        sort_order: Number(row.sort_order ?? list.length + 1),
        name: String(row.name || ""),
        muscle_group: String(row.muscle_group || "General"),
        sets: Number(row.sets ?? 3),
        reps: String(row.reps || "10-12"),
        rest_seconds: Number(row.rest_seconds ?? 90),
        target_weight_or_rpe: row.target_weight_or_rpe
          ? String(row.target_weight_or_rpe)
          : undefined,
        coach_notes: row.coach_notes ? String(row.coach_notes) : undefined,
        demo_url: row.demo_url ? String(row.demo_url) : undefined,
        media_url: row.media_url ? String(row.media_url) : undefined,
        media_type: sanitizeDbMediaType(
          row.media_type ? String(row.media_type) : undefined
        ),
      });
      exercisesByDay.set(dayId, list);
    }

    const daysByWorkout = new Map<string, WorkoutDay[]>();
    for (const d of dayRows || []) {
      const wId = String(d.workout_id);
      const list = daysByWorkout.get(wId) || [];
      list.push({
        id: String(d.id),
        workout_id: wId,
        day_number: Number(d.day_number ?? list.length + 1),
        title: String(d.title || `Día ${list.length + 1}`),
        focus_area: d.focus_area ? String(d.focus_area) : undefined,
        assigned_weekdays: Array.isArray(d.assigned_weekdays)
          ? (d.assigned_weekdays as number[])
          : [1, 3, 5],
        estimated_minutes: d.estimated_minutes
          ? Number(d.estimated_minutes)
          : 60,
        exercises: exercisesByDay.get(String(d.id)) || [],
      });
      daysByWorkout.set(wId, list);
    }

    const workouts: WorkoutPlan[] = workoutRows.map((w) => ({
      id: String(w.id),
      coach_id: String(w.coach_id),
      student_id: w.student_id ? String(w.student_id) : null,
      is_template: Boolean(w.is_template),
      title: String(w.title || "Rutina"),
      description: w.description ? String(w.description) : undefined,
      goal: w.goal ? String(w.goal) : undefined,
      level:
        w.level === "principiante" || w.level === "avanzado"
          ? w.level
          : "intermedio",
      is_active: Boolean(w.is_active),
      days: daysByWorkout.get(String(w.id)) || [],
      created_at: String(w.created_at || new Date().toISOString()),
    }));

    return NextResponse.json({ mode: "supabase", workouts });
  } catch (err) {
    console.error("[api/workouts GET] error:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar las rutinas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ mode: "demo", saved: true });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as {
      title?: string;
      description?: string;
      goal?: string;
      level?: "principiante" | "intermedio" | "avanzado";
      student_id?: string | null;
      is_template?: boolean;
      is_active?: boolean;
      days?: Array<{
        day_number?: number;
        title?: string;
        focus_area?: string;
        assigned_weekdays?: number[];
        estimated_minutes?: number;
        exercises?: Array<{
          exercise_library_id?: string;
          sort_order?: number;
          name?: string;
          muscle_group?: string;
          sets?: number;
          reps?: string;
          rest_seconds?: number;
          target_weight_or_rpe?: string;
          coach_notes?: string;
          demo_url?: string;
          media_url?: string;
          media_type?: string;
        }>;
      }>;
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json(
        { error: "El título de la rutina es obligatorio." },
        { status: 400 }
      );
    }

    const targetStudentId = asUuidOrNull(body.student_id);
    const isTemplate = Boolean(body.is_template) || !targetStudentId;
    const isActive = body.is_active !== false;

    // Si se asigna a un alumno, desactivar rutinas activas previas de este coach para ese alumno
    if (targetStudentId && !isTemplate && isActive) {
      await adminClient
        .from("workouts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("coach_id", user.id)
        .eq("student_id", targetStudentId)
        .eq("is_active", true);
    }

    const { data: insertedWorkout, error: insertWorkoutErr } = await adminClient
      .from("workouts")
      .insert({
        coach_id: user.id,
        student_id: isTemplate ? null : targetStudentId,
        is_template: isTemplate,
        title,
        description: body.description?.trim() || null,
        goal: body.goal?.trim() || null,
        level:
          body.level === "principiante" || body.level === "avanzado"
            ? body.level
            : "intermedio",
        is_active: isActive,
      })
      .select("*")
      .single();

    if (insertWorkoutErr || !insertedWorkout) {
      return NextResponse.json(
        { error: insertWorkoutErr?.message || "No se pudo guardar la rutina." },
        { status: 400 }
      );
    }

    const createdDays: WorkoutDay[] = [];
    const inputDays = Array.isArray(body.days) ? body.days : [];

    for (let idx = 0; idx < inputDays.length; idx++) {
      const d = inputDays[idx];
      const { data: insertedDay, error: dayErr } = await adminClient
        .from("workout_days")
        .insert({
          workout_id: insertedWorkout.id,
          day_number: Number(d.day_number ?? idx + 1),
          title: d.title?.trim() || `Día ${idx + 1}`,
          focus_area: d.focus_area?.trim() || null,
          assigned_weekdays:
            Array.isArray(d.assigned_weekdays) && d.assigned_weekdays.length > 0
              ? d.assigned_weekdays
              : [1, 3, 5],
          estimated_minutes: Number(d.estimated_minutes ?? 60) || 60,
        })
        .select("*")
        .single();

      if (dayErr || !insertedDay) {
        console.error("[api/workouts POST] day insert error:", dayErr);
        continue;
      }

      const inputExercises = Array.isArray(d.exercises) ? d.exercises : [];
      let savedExercises: WorkoutExercise[] = [];

      if (inputExercises.length > 0) {
        const exPayloads = inputExercises.map((ex, exIdx) => ({
          workout_day_id: insertedDay.id,
          exercise_library_id: asUuidOrNull(ex.exercise_library_id),
          sort_order: Number(ex.sort_order ?? exIdx + 1),
          name: ex.name?.trim() || "Ejercicio",
          muscle_group: ex.muscle_group?.trim() || "General",
          sets: Number(ex.sets ?? 3) || 3,
          reps: String(ex.reps || "10-12"),
          rest_seconds: Number(ex.rest_seconds ?? 90) || 90,
          target_weight_or_rpe: ex.target_weight_or_rpe?.trim() || null,
          coach_notes: ex.coach_notes?.trim() || null,
          demo_url: ex.demo_url?.trim() || null,
          media_url: ex.media_url?.trim() || null,
          media_type: sanitizeDbMediaType(ex.media_type),
        }));

        const { data: insertedExs, error: exErr } = await adminClient
          .from("workout_exercises")
          .insert(exPayloads)
          .select("*");

        if (exErr) {
          console.error("[api/workouts POST] exercises insert error:", exErr);
        } else if (insertedExs) {
          savedExercises = insertedExs.map((row) => ({
            id: String(row.id),
            workout_day_id: String(row.workout_day_id),
            exercise_library_id: row.exercise_library_id
              ? String(row.exercise_library_id)
              : undefined,
            sort_order: Number(row.sort_order ?? 1),
            name: String(row.name),
            muscle_group: String(row.muscle_group),
            sets: Number(row.sets ?? 3),
            reps: String(row.reps || "10-12"),
            rest_seconds: Number(row.rest_seconds ?? 90),
            target_weight_or_rpe: row.target_weight_or_rpe
              ? String(row.target_weight_or_rpe)
              : undefined,
            coach_notes: row.coach_notes ? String(row.coach_notes) : undefined,
            demo_url: row.demo_url ? String(row.demo_url) : undefined,
            media_url: row.media_url ? String(row.media_url) : undefined,
            media_type: sanitizeDbMediaType(row.media_type),
          }));
        }
      }

      createdDays.push({
        id: String(insertedDay.id),
        workout_id: String(insertedWorkout.id),
        day_number: Number(insertedDay.day_number),
        title: String(insertedDay.title),
        focus_area: insertedDay.focus_area
          ? String(insertedDay.focus_area)
          : undefined,
        assigned_weekdays: Array.isArray(insertedDay.assigned_weekdays)
          ? (insertedDay.assigned_weekdays as number[])
          : [1, 3, 5],
        estimated_minutes: insertedDay.estimated_minutes
          ? Number(insertedDay.estimated_minutes)
          : 60,
        exercises: savedExercises,
      });
    }

    // Notificar al alumno en base de datos
    if (targetStudentId && !isTemplate) {
      await adminClient.from("notifications").insert({
        user_id: targetStudentId,
        title: "Nueva rutina asignada por tu Coach",
        message: `Ya tienes disponible "${title}" en tu app. ¡A entrenar!`,
        type: "workout",
      });
    }

    const workout: WorkoutPlan = {
      id: String(insertedWorkout.id),
      coach_id: String(insertedWorkout.coach_id),
      student_id: insertedWorkout.student_id
        ? String(insertedWorkout.student_id)
        : null,
      is_template: Boolean(insertedWorkout.is_template),
      title: String(insertedWorkout.title),
      description: insertedWorkout.description
        ? String(insertedWorkout.description)
        : undefined,
      goal: insertedWorkout.goal ? String(insertedWorkout.goal) : undefined,
      level:
        insertedWorkout.level === "principiante" ||
        insertedWorkout.level === "avanzado"
          ? insertedWorkout.level
          : "intermedio",
      is_active: Boolean(insertedWorkout.is_active),
      days: createdDays,
      created_at: String(
        insertedWorkout.created_at || new Date().toISOString()
      ),
    };

    return NextResponse.json({ mode: "supabase", workout });
  } catch (err) {
    console.error("[api/workouts POST] error:", err);
    return NextResponse.json(
      { error: "Error al guardar la rutina." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { needsPasswordSetup } from "@/lib/auth-helpers";
import { getPlanCapabilities } from "@/lib/saas-plans";
import type { InitialMeasurementsInput } from "@/types/database";

async function materializeInitialMeasurementIfNeeded(
  adminClient: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  relationId: string,
  coachId: string,
  studentId: string
) {
  const { data: record } = await adminClient
    .from("coach_student_records")
    .select("*")
    .eq("coach_student_id", relationId)
    .maybeSingle();

  if (!record) return;

  if (!record.student_id) {
    await adminClient
      .from("coach_student_records")
      .update({ student_id: studentId, updated_at: new Date().toISOString() })
      .eq("id", record.id);
  }

  if (record.initial_assessment_materialized || !record.initial_measurements) {
    return;
  }

  const m = record.initial_measurements as InitialMeasurementsInput;
  const weight = Number(m.weight_kg);
  if (!weight || Number.isNaN(weight) || weight <= 0) {
    return;
  }

  const assessmentDate =
    m.assessment_date || new Date().toISOString().split("T")[0];
  const monthPrefix = assessmentDate.slice(0, 7);

  const [{ data: coachProfile }, { data: existingMonthAssessments }] =
    await Promise.all([
      adminClient
        .from("profiles")
        .select("saas_plan_tier")
        .eq("id", coachId)
        .maybeSingle(),
      adminClient
        .from("body_assessments")
        .select("id, assessment_date")
        .eq("coach_id", coachId)
        .eq("student_id", studentId),
    ]);

  const caps = getPlanCapabilities(coachProfile?.saas_plan_tier);
  const thisMonthCount = (existingMonthAssessments || []).filter((a) =>
    String(a.assessment_date || "").startsWith(monthPrefix)
  ).length;

  if (
    caps.maxAssessmentsPerStudentPerMonth !== null &&
    thisMonthCount >= caps.maxAssessmentsPerStudentPerMonth
  ) {
    return;
  }

  const goals = Array.isArray(record.goals) ? record.goals : [];

  const { error: insertErr } = await adminClient
    .from("body_assessments")
    .insert({
      student_id: studentId,
      coach_id: coachId,
      assessment_date: assessmentDate,
      weight_kg: weight,
      height_cm: m.height_cm ?? null,
      body_fat_percentage: m.body_fat_percentage ?? null,
      muscle_mass_kg: m.muscle_mass_kg ?? null,
      chest_cm: m.chest_cm ?? null,
      back_width_cm: m.back_width_cm ?? null,
      waist_cm: m.waist_cm ?? null,
      abdomen_cm: m.abdomen_cm ?? null,
      hip_cm: m.hip_cm ?? null,
      bicep_left_cm: m.bicep_left_cm ?? null,
      bicep_right_cm: m.bicep_right_cm ?? null,
      thigh_left_cm: m.thigh_left_cm ?? null,
      thigh_right_cm: m.thigh_right_cm ?? null,
      calf_cm: m.calf_cm ?? null,
      coach_analysis_notes:
        m.coach_analysis_notes ||
        record.initial_coach_notes ||
        "Evaluación antropométrica inicial #1",
      goal_tag: goals[0] || "Evaluación Inicial",
      progress_photos: [],
    });

  if (!insertErr) {
    await adminClient
      .from("coach_student_records")
      .update({
        initial_assessment_materialized: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      fullName?: string;
      gender?: "female" | "male";
      fitnessGoal?: string;
      password?: string;
    };

    const token = body.token?.trim();
    const password = body.password || "";
    const fullName = body.fullName?.trim();
    const gender = body.gender === "male" ? "male" : "female";
    const fitnessGoal = body.fitnessGoal?.trim() || "Recomposición corporal";

    if (!token) {
      return NextResponse.json(
        { error: "Token de invitación faltante." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ mode: "demo", activated: true });
    }

    // 1. Validar que el token corresponde a una invitación válida
    const { data: relation } = await adminClient
      .from("coach_students")
      .select("*")
      .eq("invite_token", token)
      .maybeSingle();

    if (!relation) {
      return NextResponse.json(
        { error: "La invitación no existe o expiró." },
        { status: 404 }
      );
    }

    if (
      relation.invite_status === "inactive" ||
      relation.invite_status === "finalizado"
    ) {
      return NextResponse.json(
        { error: "Esta invitación ya no está activa." },
        { status: 410 }
      );
    }

    const invitedEmail = String(relation.invited_email || "")
      .trim()
      .toLowerCase();
    const resolvedName = fullName || relation.invited_name || "Alumno";
    const nowIso = new Date().toISOString();

    // 2. Buscar si el usuario ya existe en profiles / auth.users
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("email", invitedEmail)
      .maybeSingle();

    let targetUserId: string | null = existingProfile?.id || relation.student_id || null;
    let existingAuthUser = null;

    if (targetUserId) {
      const { data: userRes } =
        await adminClient.auth.admin.getUserById(targetUserId);
      existingAuthUser = userRes?.user || null;
    }

    if (!existingAuthUser) {
      // Fallback: buscar en auth.users por correo en caso de no existir en profiles
      const { data: listRes } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      existingAuthUser =
        listRes?.users?.find(
          (u) => u.email?.toLowerCase() === invitedEmail
        ) || null;
      if (existingAuthUser) {
        targetUserId = existingAuthUser.id;
      }
    }

    if (existingAuthUser) {
      // Seguridad: solo permitir definir contraseña si el usuario fue invitado y NO tiene contraseña aún
      if (!needsPasswordSetup(existingAuthUser)) {
        return NextResponse.json(
          {
            error:
              "Esta cuenta ya tiene una contraseña configurada. Inicia sesión para aceptar la invitación.",
            code: "PASSWORD_ALREADY_SET",
          },
          { status: 409 }
        );
      }

      const { error: updateAuthErr } =
        await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            ...(existingAuthUser.user_metadata || {}),
            role: "student",
            full_name: resolvedName,
            gender,
            fitness_goal: fitnessGoal,
            password_set: true,
            terms_accepted_at: nowIso,
          },
        });

      if (updateAuthErr) {
        return NextResponse.json(
          { error: updateAuthErr.message },
          { status: 400 }
        );
      }

      targetUserId = existingAuthUser.id;
    } else {
      // Usuario aún no existe en auth.users (ej. enlace directo compartido)
      const { data: created, error: createErr } =
        await adminClient.auth.admin.createUser({
          email: invitedEmail,
          password,
          email_confirm: true,
          user_metadata: {
            role: "student",
            full_name: resolvedName,
            gender,
            fitness_goal: fitnessGoal,
            invite_token: token,
            password_set: true,
            terms_accepted_at: nowIso,
          },
        });

      if (createErr || !created.user) {
        return NextResponse.json(
          { error: createErr?.message || "No se pudo crear la cuenta." },
          { status: 400 }
        );
      }

      targetUserId = created.user.id;
    }

    const initialGoals: string[] = Array.isArray(relation.initial_goals)
      ? (relation.initial_goals as string[]).filter(Boolean)
      : [];
    const resolvedGoalText =
      initialGoals.length > 0 ? initialGoals.join(" · ") : fitnessGoal;

    // 3. Actualizar perfil público y sincronizar objetivos
    await adminClient.from("profiles").upsert(
      {
        id: targetUserId,
        role: "student",
        email: invitedEmail,
        full_name: resolvedName,
        gender,
        fitness_goal: resolvedGoalText,
        terms_accepted_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "id" }
    );

    if (resolvedGoalText) {
      await adminClient.from("student_goals").upsert(
        {
          student_id: targetUserId,
          primary_goal: resolvedGoalText,
          updated_at: nowIso,
        },
        { onConflict: "student_id" }
      );
    }

    // 4. Activar relación coach_students
    await adminClient
      .from("coach_students")
      .update({
        student_id: targetUserId,
        invited_name: resolvedName,
        invite_status: "active",
        subscription_status:
          relation.subscription_status === "trial"
            ? "active"
            : relation.subscription_status,
        updated_at: nowIso,
      })
      .eq("id", relation.id);

    // 5. Vincular expediente clínico y materializar evaluación inicial #1 si aplica
    await materializeInitialMeasurementIfNeeded(
      adminClient,
      relation.id,
      relation.coach_id,
      targetUserId
    );

    // 6. Marcar notificaciones de invitación como leídas y notificar al Coach
    await adminClient
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", targetUserId)
      .eq("type", "coach_invite");

    await adminClient.from("notifications").insert({
      user_id: relation.coach_id,
      title: "¡Nuevo alumno activado!",
      message: `${resolvedName} creó su contraseña, activó su cuenta y ya forma parte de tu cartera.`,
      type: "subscription",
    });

    return NextResponse.json({
      mode: "supabase",
      activated: true,
      email: invitedEmail,
      coachId: relation.coach_id,
      relationId: relation.id,
    });
  } catch (err) {
    console.error("[api/students/complete-activation POST] error:", err);
    return NextResponse.json(
      { error: "No se pudo completar la activación de la cuenta." },
      { status: 500 }
    );
  }
}

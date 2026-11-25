import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { getPlanCapabilities } from "@/lib/saas-plans";
import { needsPasswordSetup } from "@/lib/auth-helpers";
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

  // Siempre asegurar que student_id quede vinculado en el expediente aislado
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

  // Respetar límite mensual de evaluaciones del plan del Coach
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();
    const mine = searchParams.get("mine") === "true";

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({
        mode: "demo",
        invite: null,
        pendingInvites: [],
      });
    }

    // Listar invitaciones pendientes de aceptación para el alumno autenticado
    if (mine) {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ pendingInvites: [] });
      }

      const email = (user.email || "").toLowerCase();
      const { data: relations } = await adminClient
        .from("coach_students")
        .select(
          "id, coach_id, student_id, invited_name, invited_email, invite_token, invite_status, subscription_plan_name, subscription_price, initial_goals, created_at"
        )
        .in("invite_status", ["pending_acceptance", "pending"])
        .or(`student_id.eq.${user.id},invited_email.ilike.${email}`)
        .order("created_at", { ascending: false });

      if (!relations || relations.length === 0) {
        return NextResponse.json({ mode: "supabase", pendingInvites: [] });
      }

      const coachIds = Array.from(new Set(relations.map((r) => r.coach_id)));
      const { data: coaches } = await adminClient
        .from("profiles")
        .select("id, full_name, brand_name, avatar_url, specialty")
        .in("id", coachIds);

      const coachMap = new Map((coaches || []).map((c) => [c.id, c]));

      return NextResponse.json({
        mode: "supabase",
        pendingInvites: relations.map((r) => {
          const c = coachMap.get(r.coach_id);
          return {
            id: r.id,
            coach_id: r.coach_id,
            coach_name: c?.full_name || "Tu Coach",
            coach_brand: c?.brand_name || "MiGymBrou",
            coach_avatar: c?.avatar_url || null,
            coach_specialty: c?.specialty || null,
            invite_token: r.invite_token,
            invite_status: r.invite_status,
            plan_name: r.subscription_plan_name,
            plan_price: Number(r.subscription_price || 0),
            goals: Array.isArray(r.initial_goals) ? r.initial_goals : [],
            created_at: r.created_at,
          };
        }),
      });
    }

    if (!token) {
      return NextResponse.json(
        { error: "Token de invitación faltante." },
        { status: 400 }
      );
    }

    const { data: relation } = await adminClient
      .from("coach_students")
      .select(
        "id, coach_id, student_id, invited_name, invited_email, invite_status, subscription_plan_name, initial_goals"
      )
      .eq("invite_token", token)
      .maybeSingle();

    if (!relation) {
      return NextResponse.json(
        { error: "Invitación no encontrada o expirada." },
        { status: 404 }
      );
    }

    const [{ data: coach }, { data: existingStudent }] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id, full_name, brand_name, avatar_url, specialty")
        .eq("id", relation.coach_id)
        .maybeSingle(),
      adminClient
        .from("profiles")
        .select("id, email")
        .ilike("email", relation.invited_email)
        .maybeSingle(),
    ]);

    let existingAccountReady = false;
    let requiresPasswordSetup = true;

    if (existingStudent?.id) {
      const { data: authUserRes } = await adminClient.auth.admin.getUserById(
        existingStudent.id
      );
      requiresPasswordSetup = needsPasswordSetup(authUserRes?.user);
      existingAccountReady = !requiresPasswordSetup;
    }

    return NextResponse.json({
      mode: "supabase",
      invite: {
        id: relation.id,
        coach_id: relation.coach_id,
        coach_name: coach?.full_name || "Tu Coach",
        coach_brand: coach?.brand_name || "MiGymBrou",
        coach_avatar: coach?.avatar_url || null,
        invited_name: relation.invited_name,
        invited_email: relation.invited_email,
        invite_status: relation.invite_status,
        plan_name: relation.subscription_plan_name,
        initial_goals: Array.isArray(relation.initial_goals)
          ? relation.initial_goals
          : [],
        has_existing_account: existingAccountReady,
        needs_password_setup: requiresPasswordSetup,
      },
    });
  } catch (err) {
    console.error("[api/students/accept-invite GET] error:", err);
    return NextResponse.json(
      { error: "No se pudo consultar la invitación." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      relationId?: string;
      fullName?: string;
      action?: "accept" | "decline";
      autoLinkByEmail?: boolean;
    };

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ mode: "demo", accepted: true });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para aceptar la invitación." },
        { status: 401 }
      );
    }

    // Modo auto-vinculación automática por correo para alumnos nuevos al iniciar sesión por primera vez
    if (body.autoLinkByEmail && user.email) {
      const cleanEmail = user.email.toLowerCase();
      const { data: pendingSignups } = await adminClient
        .from("coach_students")
        .select("*")
        .ilike("invited_email", cleanEmail)
        .in("invite_status", ["pending", "pending_signup"])
        .is("student_id", null);

      let linkedCount = 0;
      for (const rel of pendingSignups || []) {
        const { error: updErr } = await adminClient
          .from("coach_students")
          .update({
            student_id: user.id,
            invite_status: "active",
            subscription_status:
              rel.subscription_status === "trial"
                ? "active"
                : rel.subscription_status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rel.id);

        if (!updErr) {
          linkedCount += 1;
          await materializeInitialMeasurementIfNeeded(
            adminClient,
            rel.id,
            rel.coach_id,
            user.id
          );
          await adminClient.from("notifications").insert({
            user_id: rel.coach_id,
            title: "¡Nuevo alumno activado!",
            message: `${
              (user.user_metadata?.full_name as string) || rel.invited_name
            } activó su cuenta y quedó vinculado automáticamente a tu cartera.`,
            type: "subscription",
          });
        }
      }

      return NextResponse.json({
        mode: "supabase",
        autoLinked: linkedCount,
      });
    }

    if (!body.token && !body.relationId) {
      return NextResponse.json(
        { error: "Token o identificador de invitación obligatorio." },
        { status: 400 }
      );
    }

    let relationQuery = adminClient.from("coach_students").select("*");
    if (body.relationId) {
      relationQuery = relationQuery.eq("id", body.relationId);
    } else if (body.token) {
      relationQuery = relationQuery.eq("invite_token", body.token);
    }

    const { data: relation } = await relationQuery.maybeSingle();

    if (!relation) {
      return NextResponse.json(
        { error: "La invitación no existe o ya no es válida." },
        { status: 404 }
      );
    }

    // Verificar estrictamente que la invitación corresponda al usuario autenticado
    const userEmail = (user.email || "").toLowerCase();
    const invitedEmail = String(relation.invited_email || "").toLowerCase();
    const matchesById = Boolean(relation.student_id && relation.student_id === user.id);
    const matchesByEmail = Boolean(invitedEmail && userEmail && invitedEmail === userEmail);
    if (!matchesById && !matchesByEmail) {
      return NextResponse.json(
        { error: "Esta invitación pertenece a otra cuenta." },
        { status: 403 }
      );
    }

    const action = body.action || "accept";

    if (action === "decline") {
      await adminClient
        .from("coach_students")
        .update({
          invite_status: "declined",
          ended_at: new Date().toISOString(),
          end_reason: "Invitación rechazada por el alumno",
          updated_at: new Date().toISOString(),
        })
        .eq("id", relation.id);

      await adminClient.from("notifications").insert({
        user_id: relation.coach_id,
        title: "Invitación rechazada",
        message: `${
          body.fullName?.trim() || relation.invited_name
        } declinó la solicitud de vinculación.`,
        type: "subscription",
      });

      return NextResponse.json({
        mode: "supabase",
        declined: true,
        relationId: relation.id,
      });
    }

    // Aceptar vinculación y activar expediente aislado con este Coach
    const { error: updateErr } = await adminClient
      .from("coach_students")
      .update({
        student_id: user.id,
        invited_name: body.fullName?.trim() || relation.invited_name,
        invite_status: "active",
        subscription_status:
          relation.subscription_status === "trial"
            ? "active"
            : relation.subscription_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", relation.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Sincronizar objetivos iniciales al perfil/student_goals si aún no existen
    const initialGoals: string[] = Array.isArray(relation.initial_goals)
      ? (relation.initial_goals as string[]).filter(Boolean)
      : [];
    if (initialGoals.length > 0) {
      const primaryGoal = initialGoals.join(" · ");
      await adminClient
        .from("student_goals")
        .upsert(
          {
            student_id: user.id,
            primary_goal: primaryGoal,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id" }
        );
    }

    // Vincular coach_student_records y materializar Evaluación #1 si existe
    await materializeInitialMeasurementIfNeeded(
      adminClient,
      relation.id,
      relation.coach_id,
      user.id
    );

    // Marcar solo la notificación de invitación de este coach/relación como leída
    const { data: inviteNotifs } = await adminClient
      .from("notifications")
      .select("id, metadata")
      .eq("user_id", user.id)
      .eq("type", "coach_invite")
      .eq("is_read", false);

    const matchingNotifIds = (inviteNotifs || [])
      .filter((n) => {
        const meta = (n.metadata || {}) as Record<string, unknown>;
        return (
          meta.relation_id === relation.id ||
          meta.coach_id === relation.coach_id
        );
      })
      .map((n) => n.id);

    if (matchingNotifIds.length > 0) {
      await adminClient
        .from("notifications")
        .update({ is_read: true })
        .in("id", matchingNotifIds);
    }

    // Notificar al Coach en tiempo real
    await adminClient.from("notifications").insert({
      user_id: relation.coach_id,
      title: "¡Nuevo alumno vinculado!",
      message: `${
        body.fullName?.trim() || relation.invited_name
      } aceptó tu invitación y ya está activo en tu cartera con su expediente independiente.`,
      type: "subscription",
    });

    return NextResponse.json({
      mode: "supabase",
      accepted: true,
      coachId: relation.coach_id,
      relationId: relation.id,
    });
  } catch (err) {
    console.error("[api/students/accept-invite POST] error:", err);
    return NextResponse.json(
      { error: "Error al procesar la invitación." },
      { status: 500 }
    );
  }
}

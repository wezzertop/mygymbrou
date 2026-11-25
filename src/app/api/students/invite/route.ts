import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { canInviteMoreStudents, getSaasPlanById } from "@/lib/saas-plans";
import { needsPasswordSetup } from "@/lib/auth-helpers";
import type { InitialMeasurementsInput } from "@/types/database";

const PROD_FALLBACK_URL = "https://migymbrou.com";
const ACTIVE_OR_PENDING_STATUSES = [
  "active",
  "pending",
  "pending_signup",
  "pending_acceptance",
];

function isLocalUrl(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("0.0.0.0")
  );
}

function resolvePublicAppUrl(request: Request): string {
  const envUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  if (envUrl && envUrl.startsWith("http") && !isLocalUrl(envUrl)) {
    return envUrl;
  }

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost && !isLocalUrl(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  const host = request.headers.get("host")?.trim();
  if (host && !isLocalUrl(host)) {
    return `https://${host}`.replace(/\/+$/, "");
  }

  return PROD_FALLBACK_URL;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

interface InviteClinicalRecordBody {
  has_injuries?: boolean;
  injuries_detail?: string;
  has_chronic_conditions?: boolean;
  chronic_conditions_detail?: string;
  takes_medications?: boolean;
  medications_detail?: string;
  allergies?: string;
  current_supplements?: string;
  gym_experience?: string;
  available_days_per_week?: number;
  session_duration_hours?: string;
  initial_coach_notes?: string;
}

interface InviteRequestBody {
  name?: string;
  email?: string;
  phone?: string;
  coachId?: string;
  token?: string;
  planId?: string | null;
  planName?: string;
  price?: number;
  durationDays?: number;
  goals?: string[];
  goal?: string;
  record?: InviteClinicalRecordBody;
  initialMeasurements?: InitialMeasurementsInput | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InviteRequestBody;
    const cleanName = body.name?.trim();
    const cleanEmail = body.email?.trim().toLowerCase();
    const cleanPhone = body.phone?.trim() || null;

    if (!cleanName || !cleanEmail) {
      return NextResponse.json(
        { error: "Nombre completo y correo electrónico son obligatorios." },
        { status: 400 }
      );
    }

    const goals = Array.isArray(body.goals)
      ? body.goals.map((g) => g.trim()).filter(Boolean)
      : body.goal?.trim()
      ? [body.goal.trim()]
      : [];

    const appUrl = resolvePublicAppUrl(request);
    const inviteToken =
      body.token ||
      `tok-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const activatePath = `/auth/activate?token=${encodeURIComponent(
      inviteToken
    )}&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(
      cleanName
    )}`;
    const activationLink = `${appUrl}${activatePath}`;
    const callbackRedirect = `${appUrl}/auth/callback?next=${encodeURIComponent(
      activatePath
    )}`;

    const adminClient = createAdminSupabaseClient();

    if (!adminClient) {
      // Modo Demo: devolvemos enlace listo para probar
      return NextResponse.json({
        mode: "demo",
        sent: true,
        existingUser: false,
        status: "pending_signup",
        inviteToken,
        activationLink,
      });
    }

    // Determinar coachId autenticado estrictamente desde la sesión del servidor
    const serverClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión como Coach para invitar alumnos." },
        { status: 401 }
      );
    }
    const resolvedCoachId = user.id;

    // 1. Validar cupo del plan SaaS del Coach (Free 5, Base 15, Pro 50, Studio 150)
    const [{ data: coachProfile }, { count: rosterCount }, { data: existingRelation }] =
      await Promise.all([
        adminClient
          .from("profiles")
          .select("saas_plan_tier, saas_student_limit, full_name, brand_name")
          .eq("id", resolvedCoachId)
          .maybeSingle(),
        adminClient
          .from("coach_students")
          .select("id", { count: "exact", head: true })
          .eq("coach_id", resolvedCoachId)
          .in("invite_status", ACTIVE_OR_PENDING_STATUSES),
        adminClient
          .from("coach_students")
          .select("id, invite_status, student_id")
          .eq("coach_id", resolvedCoachId)
          .ilike("invited_email", cleanEmail)
          .maybeSingle(),
      ]);

    // 2. Evitar duplicados con el MISMO coach
    if (
      existingRelation &&
      ACTIVE_OR_PENDING_STATUSES.includes(existingRelation.invite_status)
    ) {
      return NextResponse.json(
        {
          error:
            "Este alumno ya forma parte de tu cartera o tiene una solicitud pendiente contigo.",
          code: "ALREADY_IN_ROSTER",
        },
        { status: 409 }
      );
    }

    const planTier = coachProfile?.saas_plan_tier || "free";
    const quota = canInviteMoreStudents(
      rosterCount || 0,
      planTier,
      coachProfile?.saas_student_limit
    );

    if (!quota.allowed && quota.limit !== null) {
      const planInfo = getSaasPlanById(planTier);
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${quota.limit} alumnos de tu plan ${planInfo.name}. Actualiza tu plan en MXN para invitar más alumnos.`,
          code: "QUOTA_EXCEEDED",
          limit: quota.limit,
          currentCount: rosterCount || 0,
        },
        { status: 403 }
      );
    }

    // 3. Resolver paquete del Coach si se envió planId
    let resolvedPlanId: string | null = body.planId || null;
    let resolvedPlanName = body.planName?.trim() || "Asesoría sin paquete";
    let resolvedPrice = Number(body.price ?? 0);
    let durationDays = Number(body.durationDays ?? 30) || 30;

    if (resolvedPlanId) {
      const { data: planRow } = await adminClient
        .from("coach_subscription_plans")
        .select("id, name, price, duration_days")
        .eq("id", resolvedPlanId)
        .eq("coach_id", resolvedCoachId)
        .maybeSingle();

      if (planRow) {
        resolvedPlanName = planRow.name;
        resolvedPrice = Number(planRow.price ?? 0);
        durationDays = Number(planRow.duration_days ?? 30) || 30;
      } else {
        resolvedPlanId = null;
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const expires = addDays(today, durationDays);

    // 4. Detectar si el correo YA pertenece a una cuenta registrada en MiGymBrou
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, email, full_name, role")
      .ilike("email", cleanEmail)
      .maybeSingle();

    let existingUserId: string | null = existingProfile?.id || null;
    let existingUserNeedsPassword = false;

    if (existingUserId) {
      const { data: authUserRes } =
        await adminClient.auth.admin.getUserById(existingUserId);
      existingUserNeedsPassword = needsPasswordSetup(authUserRes?.user);
    }

    // Función auxiliar para guardar coach_students + coach_student_records aislado
    const persistRelationAndRecord = async (
      status: "pending_signup" | "pending_acceptance",
      studentId: string | null
    ) => {
      const relationPayload = {
        coach_id: resolvedCoachId,
        student_id: studentId,
        plan_id: resolvedPlanId,
        invited_name: cleanName,
        invited_email: cleanEmail,
        invited_phone: cleanPhone,
        invite_token: inviteToken,
        invite_status: status,
        initial_goals: goals,
        subscription_status: "trial",
        subscription_plan_name: resolvedPlanName,
        subscription_price: resolvedPrice,
        subscription_started_at: today,
        expires_at: expires,
        next_billing_date: expires,
        ended_at: null,
        end_reason: null,
        updated_at: new Date().toISOString(),
      };

      let relationId: string | null = null;

      if (existingRelation) {
        const { data: updated, error: updErr } = await adminClient
          .from("coach_students")
          .update(relationPayload)
          .eq("id", existingRelation.id)
          .select("id")
          .single();
        if (updErr) {
          // Fallback si columnas nuevas aún no existen en BD
          const { data: fallbackUpd, error: fbErr } = await adminClient
            .from("coach_students")
            .update({
              student_id: studentId,
              plan_id: resolvedPlanId,
              invited_name: cleanName,
              invite_token: inviteToken,
              invite_status: "pending",
              subscription_status: "trial",
              subscription_plan_name: resolvedPlanName,
              subscription_price: resolvedPrice,
              subscription_started_at: today,
              expires_at: expires,
              next_billing_date: expires,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingRelation.id)
            .select("id")
            .single();
          if (fbErr) throw fbErr;
          relationId = fallbackUpd.id;
        } else {
          relationId = updated.id;
        }
      } else {
        const { data: inserted, error: insErr } = await adminClient
          .from("coach_students")
          .insert(relationPayload)
          .select("id")
          .single();

        if (insErr) {
          // Fallback si la migración aún no se ejecuta
          const { data: fallbackIns, error: fbErr } = await adminClient
            .from("coach_students")
            .insert({
              coach_id: resolvedCoachId,
              student_id: studentId,
              plan_id: resolvedPlanId,
              invited_name: cleanName,
              invited_email: cleanEmail,
              invite_token: inviteToken,
              invite_status: "pending",
              subscription_status: "trial",
              subscription_plan_name: resolvedPlanName,
              subscription_price: resolvedPrice,
              subscription_started_at: today,
              expires_at: expires,
              next_billing_date: expires,
            })
            .select("id")
            .single();
          if (fbErr) throw fbErr;
          relationId = fallbackIns.id;
        } else {
          relationId = inserted.id;
        }
      }

      // Guardar expediente clínico aislado en coach_student_records
      if (relationId) {
        const rec = body.record || {};
        const hasMeas = Boolean(
          body.initialMeasurements &&
            Number(body.initialMeasurements.weight_kg) > 0
        );

        await adminClient.from("coach_student_records").upsert(
          {
            coach_student_id: relationId,
            coach_id: resolvedCoachId,
            student_id: studentId,
            invited_email: cleanEmail,
            phone: cleanPhone,
            goals,
            has_injuries: Boolean(rec.has_injuries),
            injuries_detail: rec.injuries_detail?.trim() || null,
            has_chronic_conditions: Boolean(rec.has_chronic_conditions),
            chronic_conditions_detail:
              rec.chronic_conditions_detail?.trim() || null,
            takes_medications: Boolean(rec.takes_medications),
            medications_detail: rec.medications_detail?.trim() || null,
            allergies: rec.allergies?.trim() || null,
            current_supplements: rec.current_supplements?.trim() || null,
            gym_experience: rec.gym_experience?.trim() || null,
            available_days_per_week: rec.available_days_per_week || null,
            session_duration_hours: rec.session_duration_hours?.trim() || null,
            initial_coach_notes: rec.initial_coach_notes?.trim() || null,
            initial_measurements: hasMeas ? body.initialMeasurements : null,
            initial_assessment_materialized: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "coach_student_id" }
        );
      }

      return relationId;
    };

    const sendInAppInviteNotification = async (
      targetUserId: string,
      relationId: string | null
    ) => {
      const coachDisplay = coachProfile?.full_name || "Tu Coach";
      const brandDisplay = coachProfile?.brand_name
        ? ` (${coachProfile.brand_name})`
        : "";
      const { error: notifErr } = await adminClient
        .from("notifications")
        .insert({
          user_id: targetUserId,
          title: `Invitación de ${coachDisplay}${brandDisplay}`,
          message: `Te invitó a entrenar con el paquete "${resolvedPlanName}". Acepta para activar tu expediente independiente con este coach.`,
          type: "coach_invite",
          action_url: "/student/notifications",
          metadata: {
            invite_token: inviteToken,
            relation_id: relationId,
            coach_id: resolvedCoachId,
            coach_name: coachDisplay,
            coach_brand: coachProfile?.brand_name || "MiGymBrou",
            plan_name: resolvedPlanName,
            goals,
          },
        });

      // Fallback si la migración de coach_invite / metadata aún no se aplica
      if (notifErr) {
        await adminClient.from("notifications").insert({
          user_id: targetUserId,
          title: `Invitación de ${coachDisplay}${brandDisplay}`,
          message: `Te invitó a entrenar con "${resolvedPlanName}". Entra a tu panel para aceptar la vinculación.`,
          type: "subscription",
        });
      }
    };

    // === CASO B: Usuario YA registrado y activo con contraseña en MiGymBrou ===
    if (existingUserId && !existingUserNeedsPassword) {
      const relationId = await persistRelationAndRecord(
        "pending_acceptance",
        existingUserId
      );
      await sendInAppInviteNotification(existingUserId, relationId);

      return NextResponse.json({
        mode: "supabase",
        sent: true,
        existingUser: true,
        status: "pending_acceptance",
        relationId,
        inviteToken,
        activationLink,
        message:
          "Este alumno ya tiene cuenta en MiGymBrou. Le enviamos una notificación dentro de la plataforma para que acepte tu invitación en 1 clic sin volver a registrarse.",
      });
    }

    // === CASO B2: Usuario pre-creado por invitación previa que AÚN NO define contraseña ===
    if (existingUserId && existingUserNeedsPassword) {
      const relationId = await persistRelationAndRecord(
        "pending_signup",
        existingUserId
      );

      // Enviar también notificación in-app para cuando complete su activación e inicie sesión
      await sendInAppInviteNotification(existingUserId, relationId);

      return NextResponse.json({
        mode: "supabase",
        sent: true,
        existingUser: false,
        needsPasswordSetup: true,
        status: "pending_signup",
        relationId,
        inviteToken,
        activationLink,
        message:
          "Invitación lista. Se registró la notificación interna y puedes compartir el enlace de activación para que el alumno defina su contraseña.",
      });
    }

    // === CASO A: Usuario NUEVO en MiGymBrou ===
    const relationId = await persistRelationAndRecord("pending_signup", null);

    const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      cleanEmail,
      {
        redirectTo: callbackRedirect,
        data: {
          role: "student",
          full_name: cleanName,
          invited_by_coach_id: resolvedCoachId,
          invite_token: inviteToken,
          invited_plan_name: resolvedPlanName,
          fitness_goal: goals.join(", ") || "Recomposición corporal",
          password_set: false,
        },
      }
    );

    if (inviteErr) {
      // Si ya existía en auth.users aunque no tuviera fila en profiles
      if (inviteErr.message.toLowerCase().includes("already been registered")) {
        const { data: listRes } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        const matchedAuthUser = listRes?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );
        if (matchedAuthUser) {
          existingUserId = matchedAuthUser.id;
          await adminClient
            .from("coach_students")
            .update({
              student_id: existingUserId,
              invite_status: "pending_acceptance",
            })
            .eq("id", relationId);
          await adminClient
            .from("coach_student_records")
            .update({ student_id: existingUserId })
            .eq("coach_student_id", relationId);
          await sendInAppInviteNotification(existingUserId, relationId);
        }

        return NextResponse.json({
          mode: "supabase",
          sent: true,
          existingUser: true,
          status: "pending_acceptance",
          relationId,
          inviteToken,
          activationLink,
          message:
            "Este correo ya tiene cuenta en MiGymBrou. Se envió una solicitud de vinculación in-app y tienes el enlace directo listo para compartir.",
        });
      }

      return NextResponse.json({ error: inviteErr.message }, { status: 400 });
    }

    return NextResponse.json({
      mode: "supabase",
      sent: true,
      existingUser: false,
      status: "pending_signup",
      relationId,
      inviteToken,
      activationLink,
      message:
        "Invitación enviada por correo. En cuanto el alumno confirme su cuenta y cree su contraseña, quedará vinculado automáticamente con su expediente inicial.",
    });
  } catch (err) {
    console.error("[api/students/invite] error:", err);
    return NextResponse.json(
      { error: "Error procesando la invitación del alumno." },
      { status: 500 }
    );
  }
}

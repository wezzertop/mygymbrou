import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { canInviteMoreStudents, getSaasPlanById } from "@/lib/saas-plans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, coachId, token, planName } = body as {
      name?: string;
      email?: string;
      coachId?: string;
      token?: string;
      planName?: string;
    };

    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      return NextResponse.json(
        { error: "Nombre y correo electrónico son obligatorios." },
        { status: 400 }
      );
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");

    const inviteToken = token || `tok-${Date.now()}`;
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

    if (adminClient) {
      // 1. Validar cupo del plan SaaS del Coach en Supabase
      if (coachId) {
        const [{ data: coachProfile }, { count: rosterCount }] =
          await Promise.all([
            adminClient
              .from("profiles")
              .select("saas_plan_tier, saas_student_limit, full_name, brand_name")
              .eq("id", coachId)
              .maybeSingle(),
            adminClient
              .from("coach_students")
              .select("id", { count: "exact", head: true })
              .eq("coach_id", coachId)
              .in("invite_status", ["active", "pending"]),
          ]);

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
      }

      // 2. Verificar si el alumno ya tiene cuenta en MiGymBrou
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        return NextResponse.json({
          mode: "supabase",
          sent: true,
          existingUser: true,
          activationLink,
          message:
            "Este alumno ya tiene cuenta en MiGymBrou. Comparte el enlace de invitación para que acepte la vinculación en 1 clic.",
        });
      }

      // 3. Usuario nuevo: enviar correo de invitación vía Supabase Auth
      const { error } = await adminClient.auth.admin.inviteUserByEmail(
        cleanEmail,
        {
          redirectTo: callbackRedirect,
          data: {
            role: "student",
            full_name: cleanName,
            invited_by_coach_id: coachId,
            invite_token: inviteToken,
            invited_plan_name: planName || "Plan Mensual",
          },
        }
      );

      if (error) {
        // Si el usuario ya existía en auth.users aunque no tuviera perfil aún
        if (error.message.toLowerCase().includes("already been registered")) {
          return NextResponse.json({
            mode: "supabase",
            sent: true,
            existingUser: true,
            activationLink,
            message:
              "Este correo ya cuenta con registro previo. Comparte el enlace directo para vincularlo en 1 clic.",
          });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        mode: "supabase",
        sent: true,
        existingUser: false,
        activationLink,
      });
    }

    // Modo Demo: devolvemos el enlace de activación listo para probar
    return NextResponse.json({
      mode: "demo",
      sent: true,
      existingUser: false,
      activationLink,
    });
  } catch {
    return NextResponse.json(
      { error: "Error procesando la invitación." },
      { status: 500 }
    );
  }
}

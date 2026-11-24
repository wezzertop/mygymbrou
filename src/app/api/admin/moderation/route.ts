import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { getSaasPlanById } from "@/lib/saas-plans";

async function verifyAdminSession() {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return { mode: "demo" as const, adminClient: null, adminUserId: null };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      mode: "unauthorized" as const,
      adminClient: null,
      adminUserId: null,
    };
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { mode: "forbidden" as const, adminClient: null, adminUserId: null };
  }

  return { mode: "supabase" as const, adminClient, adminUserId: user.id };
}

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (auth.mode === "unauthorized") {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    if (auth.mode === "forbidden") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de administrador." },
        { status: 403 }
      );
    }
    if (auth.mode === "demo" || !auth.adminClient) {
      return NextResponse.json({ mode: "demo" });
    }

    const admin = auth.adminClient;
    const [profilesRes, certsRes, reportsRes, sanctionsRes, paymentsRes] =
      await Promise.all([
        admin
          .from("profiles")
          .select("*")
          .in("role", ["coach", "student"])
          .order("created_at", { ascending: false }),
        admin
          .from("coach_certifications")
          .select("*")
          .order("uploaded_at", { ascending: false }),
        admin
          .from("user_reports")
          .select("*")
          .order("created_at", { ascending: false }),
        admin
          .from("user_sanctions")
          .select("*")
          .order("created_at", { ascending: false }),
        admin
          .from("saas_payment_requests")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    return NextResponse.json({
      mode: "supabase",
      profiles: profilesRes.data || [],
      certifications: certsRes.data || [],
      reports: reportsRes.data || [],
      sanctions: sanctionsRes.data || [],
      paymentRequests: paymentsRes.data || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Error cargando datos de moderación." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdminSession();
    if (auth.mode === "unauthorized") {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    if (auth.mode === "forbidden") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de administrador." },
        { status: 403 }
      );
    }
    if (auth.mode === "demo" || !auth.adminClient) {
      return NextResponse.json({ mode: "demo", ok: true });
    }

    const admin = auth.adminClient;
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "review_coach") {
      const { coachId, decision, notes } = body as {
        coachId: string;
        decision: "verified" | "rejected";
        notes?: string;
      };
      const isVerified = decision === "verified";
      const now = new Date().toISOString();
      const message =
        notes?.trim() ||
        (isVerified
          ? "Tu perfil profesional y documentos han sido aprobados. Ya cuentas con tu insignia de Coach Verificado."
          : "Tu solicitud de verificación requiere ajustes. Revisa tus documentos y vuelve a enviarlos.");

      const { error } = await admin
        .from("profiles")
        .update({
          is_verified_identity: isVerified,
          verification_status: decision,
          verified_at: isVerified ? now : null,
          verification_notes: message,
          accepting_students: isVerified ? true : undefined,
        })
        .eq("id", coachId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await admin.from("notifications").insert({
        user_id: coachId,
        title: isVerified
          ? "Verificación de Coach aprobada"
          : "Verificación rechazada — Acción requerida",
        message,
        type: "verification",
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "update_report") {
      const { reportId, status, adminNotes } = body as {
        reportId: string;
        status: "pendiente" | "en_revision" | "resuelto" | "descartado";
        adminNotes?: string;
      };
      const isClosed = status === "resuelto" || status === "descartado";
      const { error } = await admin
        .from("user_reports")
        .update({
          status,
          admin_notes: adminNotes ?? null,
          resolved_by: isClosed ? auth.adminUserId : null,
          resolved_at: isClosed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "issue_sanction") {
      const { userId, userName, userRole, sanctionType, reason, durationDays } =
        body as {
          userId: string;
          userName: string;
          userRole: "coach" | "student";
          sanctionType: "warning" | "temporary_suspension" | "permanent_ban";
          reason: string;
          durationDays?: number;
        };

      if (!userId || !reason?.trim()) {
        return NextResponse.json(
          { error: "Usuario y motivo son obligatorios." },
          { status: 400 }
        );
      }

      const expiresAt =
        sanctionType === "temporary_suspension" && durationDays
          ? new Date(
              Date.now() + durationDays * 24 * 60 * 60 * 1000
            ).toISOString()
          : null;

      const { error: insertErr } = await admin.from("user_sanctions").insert({
        user_id: userId,
        user_name: userName || "Usuario",
        user_role: userRole,
        sanction_type: sanctionType,
        reason: reason.trim(),
        duration_days:
          sanctionType === "temporary_suspension" ? durationDays || 7 : null,
        expires_at: expiresAt,
        is_active: true,
        issued_by: auth.adminUserId,
      });

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 400 });
      }

      const nextStatus =
        sanctionType === "warning"
          ? "warned"
          : sanctionType === "temporary_suspension"
          ? "suspended"
          : "banned";

      await admin
        .from("profiles")
        .update({
          account_status: nextStatus,
          suspension_reason: reason.trim(),
          suspended_until: expiresAt,
          ...(userRole === "coach" && nextStatus !== "warned"
            ? { accepting_students: false }
            : {}),
        })
        .eq("id", userId);

      await admin.from("notifications").insert({
        user_id: userId,
        title:
          sanctionType === "warning"
            ? "Advertencia formal en tu cuenta"
            : sanctionType === "temporary_suspension"
            ? "Cuenta suspendida temporalmente"
            : "Cuenta suspendida indefinidamente",
        message: reason.trim(),
        type: "verification",
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "lift_sanction") {
      const { sanctionId, userId } = body as {
        sanctionId: string;
        userId: string;
      };

      const { error } = await admin
        .from("user_sanctions")
        .update({
          is_active: false,
          lifted_at: new Date().toISOString(),
          lifted_by: auth.adminUserId,
        })
        .eq("id", sanctionId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await admin
        .from("profiles")
        .update({
          account_status: "active",
          suspension_reason: null,
          suspended_until: null,
        })
        .eq("id", userId);

      await admin.from("notifications").insert({
        user_id: userId,
        title: "Sanción levantada",
        message: "Tu cuenta ha sido restablecida y se encuentra nuevamente activa.",
        type: "verification",
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "review_payment") {
      const { paymentId, decision, adminNotes } = body as {
        paymentId: string;
        decision: "aprobado" | "rechazado";
        adminNotes?: string;
      };

      const { data: payment } = await admin
        .from("saas_payment_requests")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();

      if (!payment) {
        return NextResponse.json(
          { error: "Solicitud de pago no encontrada." },
          { status: 404 }
        );
      }

      const { error: updErr } = await admin
        .from("saas_payment_requests")
        .update({
          status: decision,
          admin_notes: adminNotes?.trim() || null,
          reviewed_by: auth.adminUserId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 });
      }

      // Buscar coach por coach_id o por correo
      let targetCoachId: string | null = payment.coach_id || null;
      if (!targetCoachId && payment.coach_email) {
        const { data: prof } = await admin
          .from("profiles")
          .select("id")
          .ilike("email", payment.coach_email)
          .maybeSingle();
        targetCoachId = prof?.id || null;
      }

      if (decision === "aprobado" && targetCoachId) {
        const planConfig = getSaasPlanById(payment.plan_tier);
        await admin
          .from("profiles")
          .update({
            saas_plan_tier: planConfig.id,
            saas_student_limit: planConfig.studentLimit,
          })
          .eq("id", targetCoachId);

        await admin.from("notifications").insert({
          user_id: targetCoachId,
          title: `¡Plan ${planConfig.name} activado!`,
          message: `Tu pago SPEI fue aprobado. Ya cuentas con ${planConfig.studentLimitLabel} y 0% publicidad.`,
          type: "subscription",
        });
      } else if (decision === "rechazado" && targetCoachId) {
        await admin.from("notifications").insert({
          user_id: targetCoachId,
          title: "Comprobante de pago rechazado",
          message:
            adminNotes?.trim() ||
            "No pudimos validar tu comprobante SPEI. Por favor sube un comprobante legible desde Mi Plan MXN.",
          type: "subscription",
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Error procesando acción de administración." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, coachId, token } = body as {
      name?: string;
      email?: string;
      coachId?: string;
      token?: string;
    };

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nombre y correo electrónico son obligatorios." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const activationLink = `${appUrl}/auth/activate?token=${encodeURIComponent(
      token || "invite"
    )}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      supabaseUrl &&
      secretKey &&
      !supabaseUrl.includes("tu-proyecto") &&
      !secretKey.includes("tu-secret-key") &&
      !secretKey.includes("tu-service-role")
    ) {
      const adminClient = createClient(supabaseUrl, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: activationLink,
        data: {
          role: "student",
          full_name: name,
          invited_by_coach_id: coachId,
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        mode: "supabase",
        sent: true,
        activationLink,
      });
    }

    // Modo Demo: devolvemos el enlace de activación listo para probar
    return NextResponse.json({
      mode: "demo",
      sent: true,
      activationLink,
    });
  } catch {
    return NextResponse.json(
      { error: "Error procesando la invitación." },
      { status: 500 }
    );
  }
}

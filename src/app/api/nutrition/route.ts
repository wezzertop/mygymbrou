import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import type { MealItem, NutritionPlan } from "@/types/database";
import { getPlanCapabilities } from "@/lib/saas-plans";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asUuidOrNull(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  return UUID_REGEX.test(val.trim()) ? val.trim() : null;
}

export async function GET() {
  try {
    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ mode: "demo", nutritionPlans: [] });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { data: planRows, error: plansErr } = await adminClient
      .from("nutrition_plans")
      .select("*")
      .or(`coach_id.eq.${user.id},student_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (plansErr) {
      return NextResponse.json({ error: plansErr.message }, { status: 400 });
    }

    if (!planRows || planRows.length === 0) {
      return NextResponse.json({ mode: "supabase", nutritionPlans: [] });
    }

    const planIds = planRows.map((p) => p.id);
    const { data: mealRows, error: mealsErr } = await adminClient
      .from("meal_items")
      .select("*")
      .in("nutrition_plan_id", planIds)
      .order("sort_order", { ascending: true });

    if (mealsErr) {
      return NextResponse.json({ error: mealsErr.message }, { status: 400 });
    }

    const mealsByPlan = new Map<string, MealItem[]>();
    for (const m of mealRows || []) {
      const pId = String(m.nutrition_plan_id);
      const list = mealsByPlan.get(pId) || [];
      list.push({
        id: String(m.id),
        nutrition_plan_id: pId,
        sort_order: Number(m.sort_order ?? list.length + 1),
        meal_time: String(m.meal_time || "Comida"),
        suggested_hour: m.suggested_hour ? String(m.suggested_hour) : undefined,
        foods_description: String(m.foods_description || ""),
        exchange_options: m.exchange_options
          ? String(m.exchange_options)
          : undefined,
        calories: m.calories !== null && m.calories !== undefined ? Number(m.calories) : undefined,
        protein_g: m.protein_g !== null && m.protein_g !== undefined ? Number(m.protein_g) : undefined,
        carbs_g: m.carbs_g !== null && m.carbs_g !== undefined ? Number(m.carbs_g) : undefined,
        fats_g: m.fats_g !== null && m.fats_g !== undefined ? Number(m.fats_g) : undefined,
      });
      mealsByPlan.set(pId, list);
    }

    const nutritionPlans: NutritionPlan[] = planRows.map((p) => ({
      id: String(p.id),
      coach_id: String(p.coach_id),
      student_id: p.student_id ? String(p.student_id) : null,
      is_template: Boolean(p.is_template),
      title: String(p.title || "Plan Nutricional"),
      notes: p.notes ? String(p.notes) : undefined,
      image_url: p.image_url ? String(p.image_url) : null,
      daily_calories: Number(p.daily_calories ?? 2000),
      protein_g: Number(p.protein_g ?? 150),
      carbs_g: Number(p.carbs_g ?? 200),
      fats_g: Number(p.fats_g ?? 65),
      water_liters: Number(p.water_liters ?? 2.5),
      is_active: Boolean(p.is_active),
      meals: mealsByPlan.get(String(p.id)) || [],
      created_at: String(p.created_at || new Date().toISOString()),
    }));

    return NextResponse.json({ mode: "supabase", nutritionPlans });
  } catch (err) {
    console.error("[api/nutrition GET] error:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los planes nutricionales." },
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
      notes?: string;
      image_url?: string | null;
      daily_calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fats_g?: number;
      water_liters?: number;
      student_id?: string | null;
      is_template?: boolean;
      is_active?: boolean;
      meals?: Array<{
        sort_order?: number;
        meal_time?: string;
        suggested_hour?: string;
        foods_description?: string;
        exchange_options?: string;
        calories?: number;
        protein_g?: number;
        carbs_g?: number;
        fats_g?: number;
      }>;
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json(
        { error: "El título del plan nutricional es obligatorio." },
        { status: 400 }
      );
    }

    const targetStudentId = asUuidOrNull(body.student_id);
    const isTemplate = Boolean(body.is_template) || !targetStudentId;
    const isActive = body.is_active !== false;

    // Validar rol, tope de plantillas por plan SaaS y relación Coach-Alumno
    const { data: coachProf } = await adminClient
      .from("profiles")
      .select("role, saas_plan_tier")
      .eq("id", user.id)
      .maybeSingle();

    if (coachProf && coachProf.role !== "coach" && coachProf.role !== "admin") {
      return NextResponse.json(
        { error: "Solo un Coach puede crear o asignar planes nutricionales." },
        { status: 403 }
      );
    }

    if (isTemplate) {
      const caps = getPlanCapabilities(coachProf?.saas_plan_tier);
      if (caps.maxDietTemplates !== null) {
        const { count: tplCount } = await adminClient
          .from("nutrition_plans")
          .select("id", { count: "exact", head: true })
          .eq("coach_id", user.id)
          .eq("is_template", true);

        if ((tplCount ?? 0) >= caps.maxDietTemplates) {
          return NextResponse.json(
            {
              error: `Alcanzaste el límite de ${caps.maxDietTemplates} plantillas de dieta de tu plan actual. Mejora tu plan para crear más.`,
            },
            { status: 403 }
          );
        }
      }
    }

    if (targetStudentId && !isTemplate) {
      const { data: rel } = await adminClient
        .from("coach_students")
        .select("id")
        .eq("coach_id", user.id)
        .eq("student_id", targetStudentId)
        .in("invite_status", ["active", "pending", "pending_signup", "pending_acceptance"])
        .maybeSingle();

      if (!rel) {
        return NextResponse.json(
          { error: "No tienes una relación activa con este alumno." },
          { status: 403 }
        );
      }
    }

    if (targetStudentId && !isTemplate && isActive) {
      await adminClient
        .from("nutrition_plans")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("coach_id", user.id)
        .eq("student_id", targetStudentId)
        .eq("is_active", true);
    }

    const basePayload = {
      coach_id: user.id,
      student_id: isTemplate ? null : targetStudentId,
      is_template: isTemplate,
      title,
      notes: body.notes?.trim() || null,
      daily_calories: Number(body.daily_calories ?? 2000) || 2000,
      protein_g: Number(body.protein_g ?? 150) || 150,
      carbs_g: Number(body.carbs_g ?? 200) || 200,
      fats_g: Number(body.fats_g ?? 65) || 65,
      water_liters: Number(body.water_liters ?? 2.5) || 2.5,
      is_active: isActive,
    };

    let insertedPlan: Record<string, unknown> | null = null;
    const { data: planWithImg, error: planErr } = await adminClient
      .from("nutrition_plans")
      .insert({
        ...basePayload,
        image_url: body.image_url || null,
      })
      .select("*")
      .single();

    if (planErr) {
      // Fallback si la columna image_url aún no existe en BD
      const { data: planFallback, error: fbErr } = await adminClient
        .from("nutrition_plans")
        .insert(basePayload)
        .select("*")
        .single();
      if (fbErr || !planFallback) {
        return NextResponse.json(
          { error: fbErr?.message || "No se pudo guardar el plan nutricional." },
          { status: 400 }
        );
      }
      insertedPlan = planFallback as Record<string, unknown>;
    } else {
      insertedPlan = planWithImg as Record<string, unknown>;
    }

    const planId = String(insertedPlan.id);
    const inputMeals = Array.isArray(body.meals) ? body.meals : [];
    let savedMeals: MealItem[] = [];

    if (inputMeals.length > 0) {
      const mealPayloads = inputMeals.map((m, idx) => ({
        nutrition_plan_id: planId,
        sort_order: Number(m.sort_order ?? idx + 1),
        meal_time: m.meal_time?.trim() || `Comida ${idx + 1}`,
        suggested_hour: m.suggested_hour?.trim() || null,
        foods_description: m.foods_description?.trim() || "",
        exchange_options: m.exchange_options?.trim() || null,
        calories: m.calories !== undefined ? Number(m.calories) : null,
        protein_g: m.protein_g !== undefined ? Number(m.protein_g) : null,
        carbs_g: m.carbs_g !== undefined ? Number(m.carbs_g) : null,
        fats_g: m.fats_g !== undefined ? Number(m.fats_g) : null,
      }));

      const { data: insertedMeals, error: mealsErr } = await adminClient
        .from("meal_items")
        .insert(mealPayloads)
        .select("*");

      if (mealsErr) {
        console.error("[api/nutrition POST] meals insert error:", mealsErr);
      } else if (insertedMeals) {
        savedMeals = insertedMeals.map((m) => ({
          id: String(m.id),
          nutrition_plan_id: String(m.nutrition_plan_id),
          sort_order: Number(m.sort_order ?? 1),
          meal_time: String(m.meal_time),
          suggested_hour: m.suggested_hour
            ? String(m.suggested_hour)
            : undefined,
          foods_description: String(m.foods_description || ""),
          exchange_options: m.exchange_options
            ? String(m.exchange_options)
            : undefined,
          calories:
            m.calories !== null && m.calories !== undefined
              ? Number(m.calories)
              : undefined,
          protein_g:
            m.protein_g !== null && m.protein_g !== undefined
              ? Number(m.protein_g)
              : undefined,
          carbs_g:
            m.carbs_g !== null && m.carbs_g !== undefined
              ? Number(m.carbs_g)
              : undefined,
          fats_g:
            m.fats_g !== null && m.fats_g !== undefined
              ? Number(m.fats_g)
              : undefined,
        }));
      }
    }

    if (targetStudentId && !isTemplate) {
      await adminClient.from("notifications").insert({
        user_id: targetStudentId,
        title: "Nuevo plan nutricional asignado",
        message: `Tu coach publicó tu dieta "${title}" (${basePayload.daily_calories} kcal diarias).`,
        type: "diet",
      });
    }

    const nutritionPlan: NutritionPlan = {
      id: planId,
      coach_id: String(insertedPlan.coach_id),
      student_id: insertedPlan.student_id
        ? String(insertedPlan.student_id)
        : null,
      is_template: Boolean(insertedPlan.is_template),
      title: String(insertedPlan.title),
      notes: insertedPlan.notes ? String(insertedPlan.notes) : undefined,
      image_url: insertedPlan.image_url ? String(insertedPlan.image_url) : null,
      daily_calories: Number(insertedPlan.daily_calories ?? 2000),
      protein_g: Number(insertedPlan.protein_g ?? 150),
      carbs_g: Number(insertedPlan.carbs_g ?? 200),
      fats_g: Number(insertedPlan.fats_g ?? 65),
      water_liters: Number(insertedPlan.water_liters ?? 2.5),
      is_active: Boolean(insertedPlan.is_active),
      meals: savedMeals,
      created_at: String(
        insertedPlan.created_at || new Date().toISOString()
      ),
    };

    return NextResponse.json({ mode: "supabase", nutritionPlan });
  } catch (err) {
    console.error("[api/nutrition POST] error:", err);
    return NextResponse.json(
      { error: "Error al guardar el plan nutricional." },
      { status: 500 }
    );
  }
}

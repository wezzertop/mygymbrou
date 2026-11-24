import {
  Appointment,
  BodyAssessment,
  CoachStudentRelation,
  NutritionPlan,
  Profile,
  WorkoutPlan,
} from "@/types/database";

export type PdfExportSection =
  | "full"
  | "workout"
  | "diet"
  | "progress"
  | "appointments";

export interface StudentPdfPayload {
  section: PdfExportSection;
  coach: Profile;
  student: CoachStudentRelation;
  workout?: WorkoutPlan;
  diet?: NutritionPlan;
  assessments: BodyAssessment[];
  appointments: Appointment[];
}

const WEEKDAY_NAMES: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

const SECTION_TITLES: Record<PdfExportSection, string> = {
  full: "Expediente Integral 360°",
  workout: "Plan de Entrenamiento",
  diet: "Plan Nutricional",
  progress: "Reporte de Progreso y Antropometría",
  appointments: "Agenda de Citas y Evaluaciones",
};

function esc(value?: string | number | null): string {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtNum(val?: number, suffix = ""): string {
  if (val === undefined || val === null || Number.isNaN(val)) return "—";
  return `${val}${suffix}`;
}

function fmtDelta(current?: number, initial?: number, unit = ""): string {
  if (current === undefined || initial === undefined) return "";
  const diff = Number((current - initial).toFixed(1));
  if (diff === 0) return "Sin cambio";
  return `${diff > 0 ? "+" : ""}${diff}${unit}`;
}

function renderWorkoutHtml(workout?: WorkoutPlan): string {
  if (!workout) {
    return `
      <section class="section">
        <h2 class="section-title">Plan de Entrenamiento</h2>
        <p class="empty">Sin rutina activa asignada por el momento.</p>
      </section>`;
  }

  const daysHtml = workout.days
    .map((day) => {
      const weekdays = (day.assigned_weekdays || [])
        .map((d) => WEEKDAY_NAMES[d] || "")
        .filter(Boolean)
        .join(", ");

      const rows = day.exercises
        .map(
          (ex, idx) => `
          <tr>
            <td class="num">${idx + 1}</td>
            <td>
              <strong>${esc(ex.name)}</strong>
              ${ex.coach_notes ? `<div class="note">${esc(ex.coach_notes)}</div>` : ""}
            </td>
            <td><span class="tag">${esc(ex.muscle_group)}</span></td>
            <td class="mono">${esc(ex.sets)} × ${esc(ex.reps)}</td>
            <td class="mono">${esc(ex.rest_seconds)}s</td>
            <td>${esc(ex.target_weight_or_rpe || "—")}</td>
          </tr>`
        )
        .join("");

      return `
        <div class="subcard">
          <div class="subcard-head">
            <div>
              <strong>Día ${day.day_number}: ${esc(day.title)}</strong>
              ${day.focus_area ? `<span class="muted"> · ${esc(day.focus_area)}</span>` : ""}
            </div>
            <div class="meta-pills">
              ${weekdays ? `<span class="pill">${esc(weekdays)}</span>` : ""}
              ${day.estimated_minutes ? `<span class="pill">${day.estimated_minutes} min</span>` : ""}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:28px">#</th>
                <th>Ejercicio</th>
                <th style="width:92px">Músculo</th>
                <th style="width:86px">Series × Reps</th>
                <th style="width:70px">Descanso</th>
                <th style="width:90px">Carga / RPE</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    })
    .join("");

  return `
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Plan de Entrenamiento · ${esc(workout.title)}</h2>
        <span class="pill-emerald">${esc(workout.level.toUpperCase())}</span>
      </div>
      ${workout.description ? `<p class="lead">${esc(workout.description)}</p>` : ""}
      ${daysHtml}
    </section>`;
}

function renderDietHtml(diet?: NutritionPlan): string {
  if (!diet) {
    return `
      <section class="section">
        <h2 class="section-title">Plan Nutricional</h2>
        <p class="empty">Sin plan nutricional activo asignado por el momento.</p>
      </section>`;
  }

  const mealsHtml = diet.meals
    .map(
      (m) => `
      <tr>
        <td>
          <strong>${esc(m.meal_time)}</strong>
          ${m.suggested_hour ? `<div class="note">${esc(m.suggested_hour)}</div>` : ""}
        </td>
        <td>
          ${esc(m.foods_description)}
          ${m.exchange_options ? `<div class="note">Opciones: ${esc(m.exchange_options)}</div>` : ""}
        </td>
        <td class="mono" style="white-space:nowrap">
          ${m.calories ? `${m.calories} kcal` : "—"}
          ${
            m.protein_g !== undefined
              ? `<div class="note">P:${m.protein_g}g · C:${m.carbs_g ?? 0}g · G:${m.fats_g ?? 0}g</div>`
              : ""
          }
        </td>
      </tr>`
    )
    .join("");

  return `
    <section class="section">
      <h2 class="section-title">Plan Nutricional · ${esc(diet.title)}</h2>
      ${diet.notes ? `<p class="lead">${esc(diet.notes)}</p>` : ""}
      <div class="kpi-grid kpi-5">
        <div class="kpi"><span>Calorías</span><strong>${diet.daily_calories} kcal</strong></div>
        <div class="kpi"><span>Proteína</span><strong>${diet.protein_g} g</strong></div>
        <div class="kpi"><span>Carbohidratos</span><strong>${diet.carbs_g} g</strong></div>
        <div class="kpi"><span>Grasas</span><strong>${diet.fats_g} g</strong></div>
        <div class="kpi"><span>Hidratación</span><strong>${diet.water_liters} L</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:120px">Comida</th>
            <th>Alimentos y porciones</th>
            <th style="width:130px">Aporte</th>
          </tr>
        </thead>
        <tbody>${mealsHtml}</tbody>
      </table>
    </section>`;
}

function renderProgressHtml(assessments: BodyAssessment[]): string {
  if (assessments.length === 0) {
    return `
      <section class="section">
        <h2 class="section-title">Progreso y Antropometría</h2>
        <p class="empty">Aún no se registran evaluaciones corporales para este alumno.</p>
      </section>`;
  }

  const sorted = [...assessments].sort((a, b) =>
    b.assessment_date.localeCompare(a.assessment_date)
  );
  const latest = sorted[0];
  const initial = sorted[sorted.length - 1];

  const rows = sorted
    .map(
      (a) => `
      <tr>
        <td class="mono">${esc(a.assessment_date)}</td>
        <td class="mono"><strong>${fmtNum(a.weight_kg, " kg")}</strong></td>
        <td class="mono">${fmtNum(a.body_fat_percentage, "%")}</td>
        <td class="mono">${fmtNum(a.muscle_mass_kg, " kg")}</td>
        <td class="mono">${fmtNum(a.waist_cm, " cm")}</td>
        <td class="mono">${fmtNum(a.hip_cm, " cm")}</td>
        <td class="mono">${fmtNum(a.chest_cm, " cm")}</td>
        <td>${esc(a.coach_analysis_notes || "—")}</td>
      </tr>`
    )
    .join("");

  return `
    <section class="section">
      <h2 class="section-title">Progreso y Antropometría (${sorted.length} registro${sorted.length === 1 ? "" : "s"})</h2>
      <div class="kpi-grid kpi-4">
        <div class="kpi">
          <span>Peso actual</span>
          <strong>${fmtNum(latest.weight_kg, " kg")}</strong>
          <small>${sorted.length > 1 ? fmtDelta(latest.weight_kg, initial.weight_kg, " kg") : "Base inicial"}</small>
        </div>
        <div class="kpi">
          <span>Grasa corporal</span>
          <strong>${fmtNum(latest.body_fat_percentage, "%")}</strong>
          <small>${sorted.length > 1 ? fmtDelta(latest.body_fat_percentage, initial.body_fat_percentage, "%") : "Base inicial"}</small>
        </div>
        <div class="kpi">
          <span>Masa muscular</span>
          <strong>${fmtNum(latest.muscle_mass_kg, " kg")}</strong>
          <small>${sorted.length > 1 ? fmtDelta(latest.muscle_mass_kg, initial.muscle_mass_kg, " kg") : "Base inicial"}</small>
        </div>
        <div class="kpi">
          <span>Cintura</span>
          <strong>${fmtNum(latest.waist_cm, " cm")}</strong>
          <small>${sorted.length > 1 ? fmtDelta(latest.waist_cm, initial.waist_cm, " cm") : "Base inicial"}</small>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:82px">Fecha</th>
            <th style="width:68px">Peso</th>
            <th style="width:64px">% Grasa</th>
            <th style="width:72px">Músculo</th>
            <th style="width:64px">Cintura</th>
            <th style="width:64px">Cadera</th>
            <th style="width:60px">Pecho</th>
            <th>Notas del Coach</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function renderAppointmentsHtml(appointments: Appointment[]): string {
  const sorted = [...appointments].sort((a, b) =>
    b.scheduled_at.localeCompare(a.scheduled_at)
  );
  if (sorted.length === 0) {
    return `
      <section class="section">
        <h2 class="section-title">Agenda de Citas</h2>
        <p class="empty">Sin citas registradas para este alumno.</p>
      </section>`;
  }

  const rows = sorted
    .map((apt) => {
      const statusLabel =
        apt.status === "scheduled"
          ? "Programada"
          : apt.status === "completed"
          ? "Completada"
          : "Cancelada";
      const dateStr = new Date(apt.scheduled_at).toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      return `
        <tr>
          <td class="mono" style="white-space:nowrap">${esc(dateStr)}</td>
          <td><strong>${esc(apt.title)}</strong>${apt.notes ? `<div class="note">${esc(apt.notes)}</div>` : ""}</td>
          <td>${esc(apt.location_or_link)}</td>
          <td><span class="tag">${statusLabel}</span></td>
        </tr>`;
    })
    .join("");

  return `
    <section class="section">
      <h2 class="section-title">Agenda de Citas (${sorted.length})</h2>
      <table>
        <thead>
          <tr>
            <th style="width:140px">Fecha y hora</th>
            <th>Motivo e indicaciones</th>
            <th style="width:160px">Ubicación / Enlace</th>
            <th style="width:86px">Estado</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

export function exportStudentPdf(payload: StudentPdfPayload): void {
  if (typeof window === "undefined") return;

  const { section, coach, student, workout, diet, assessments, appointments } =
    payload;
  const docTitle = `${SECTION_TITLES[section]} — ${student.invited_name}`;
  const generatedAt = new Date().toLocaleDateString("es-MX", {
    dateStyle: "long",
  });

  const bodySections: string[] = [];
  if (section === "full" || section === "progress") {
    bodySections.push(renderProgressHtml(assessments));
  }
  if (section === "full" || section === "workout") {
    bodySections.push(renderWorkoutHtml(workout));
  }
  if (section === "full" || section === "diet") {
    bodySections.push(renderDietHtml(diet));
  }
  if (section === "full" || section === "appointments") {
    bodySections.push(renderAppointmentsHtml(appointments));
  }

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${esc(docTitle)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc { max-width: 820px; margin: 0 auto; padding: 20px; }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #10b981;
      padding-bottom: 14px;
      margin-bottom: 18px;
      gap: 16px;
    }
    .brand-eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #059669;
      margin: 0 0 4px;
    }
    .brand-title { font-size: 20px; font-weight: 800; margin: 0; color: #09090b; }
    .brand-sub { font-size: 11px; color: #475569; margin: 2px 0 0; }
    .doc-meta { text-align: right; font-size: 11px; color: #475569; }
    .doc-meta strong { display: block; font-size: 13px; color: #09090b; }
    .student-card {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 20px;
    }
    .student-card span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .student-card strong { display: block; font-size: 12px; color: #0f172a; margin-top: 2px; }
    .section { margin-bottom: 22px; page-break-inside: avoid; }
    .section-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #09090b;
      margin: 0 0 10px;
      padding-left: 10px;
      border-left: 3px solid #10b981;
    }
    .lead { margin: 0 0 12px; color: #475569; font-size: 11.5px; }
    .empty {
      padding: 12px 14px;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      color: #64748b;
      font-size: 11.5px;
    }
    .kpi-grid { display: grid; gap: 10px; margin-bottom: 12px; }
    .kpi-4 { grid-template-columns: repeat(4, 1fr); }
    .kpi-5 { grid-template-columns: repeat(5, 1fr); }
    .kpi {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }
    .kpi span { display: block; font-size: 10px; color: #64748b; }
    .kpi strong { display: block; font-size: 15px; color: #09090b; margin-top: 2px; }
    .kpi small { display: block; font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px; }
    .subcard {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .subcard-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 12px;
      background: #0f172a;
      color: #ffffff;
      font-size: 12px;
    }
    .muted { color: #94a3b8; font-weight: 400; }
    .meta-pills { display: flex; gap: 6px; }
    .pill {
      background: rgba(255,255,255,0.12);
      color: #e2e8f0;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
    }
    .pill-emerald {
      background: #d1fae5;
      color: #065f46;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th {
      text-align: left;
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 7px 9px;
      border-bottom: 1px solid #cbd5e1;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      padding: 7px 9px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    .num { color: #64748b; font-weight: 700; text-align: center; }
    .mono { font-variant-numeric: tabular-nums; }
    .note { color: #64748b; font-size: 10px; margin-top: 2px; }
    .tag {
      display: inline-block;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 1px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
    }
    .footer {
      margin-top: 26px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
      gap: 12px;
    }
    .print-bar {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 14px;
    }
    .print-btn {
      background: #10b981;
      color: #0a0a0a;
      border: none;
      border-radius: 999px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .print-bar { display: none !important; }
      .doc { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="doc">
    <div class="print-bar">
      <button class="print-btn" onclick="window.print()">Guardar como PDF / Imprimir</button>
    </div>

    <header class="topbar">
      <div>
        <p class="brand-eyebrow">${esc(coach.brand_name || "MiGymBrou")} · Coaching Profesional</p>
        <h1 class="brand-title">${esc(SECTION_TITLES[section])}</h1>
        <p class="brand-sub">Coach: ${esc(coach.full_name)}${coach.specialty ? ` · ${esc(coach.specialty)}` : ""}</p>
      </div>
      <div class="doc-meta">
        <strong>MiGymBrou</strong>
        <span>Emitido el ${esc(generatedAt)}</span>
      </div>
    </header>

    <div class="student-card">
      <div><span>Alumno</span><strong>${esc(student.invited_name)}</strong></div>
      <div><span>Objetivo</span><strong>${esc(student.fitness_goal || "General")}</strong></div>
      <div><span>Plan</span><strong>${esc(student.subscription_plan_name)}</strong></div>
      <div><span>Correo</span><strong>${esc(student.invited_email)}</strong></div>
    </div>

    ${bodySections.join("")}

    <footer class="footer">
      <span>Generado con MiGymBrou · Documento confidencial para uso exclusivo del alumno.</span>
      <span>Consulta a un médico antes de iniciar cambios intensos en entrenamiento o dieta.</span>
    </footer>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 250);
    });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=920,height=780");
  if (!win) {
    // Fallback con iframe oculto si el navegador bloqueó popups
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1500);
      }, 300);
    }
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function buildFriendlyShareSummary(payload: StudentPdfPayload): string {
  const { coach, student, workout, diet, assessments, appointments } = payload;
  const lines: string[] = [
    `Hola ${student.invited_name.split(" ")[0]}, te comparto tu resumen actualizado de ${coach.brand_name || "MiGymBrou"}:`,
    "",
  ];

  const latest = [...assessments].sort((a, b) =>
    b.assessment_date.localeCompare(a.assessment_date)
  )[0];
  if (latest) {
    lines.push(
      `📊 Progreso (${latest.assessment_date}): Peso ${latest.weight_kg} kg${
        latest.body_fat_percentage !== undefined
          ? ` · Grasa ${latest.body_fat_percentage}%`
          : ""
      }${
        latest.muscle_mass_kg !== undefined
          ? ` · Músculo ${latest.muscle_mass_kg} kg`
          : ""
      }`
    );
  }

  if (workout) {
    lines.push(
      `🏋️ Rutina activa: ${workout.title} (${workout.days.length} día(s))`
    );
  }

  if (diet) {
    lines.push(
      `🥗 Plan nutricional: ${diet.title} — ${diet.daily_calories} kcal (P:${diet.protein_g}g · C:${diet.carbs_g}g · G:${diet.fats_g}g · Agua ${diet.water_liters}L)`
    );
  }

  const nextApt = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
  if (nextApt) {
    lines.push(
      `📅 Próxima cita: ${nextApt.title} — ${new Date(
        nextApt.scheduled_at
      ).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })} (${
        nextApt.location_or_link
      })`
    );
  }

  lines.push("", `— ${coach.full_name} · MiGymBrou`);
  return lines.join("\n");
}

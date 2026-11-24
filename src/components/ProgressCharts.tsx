"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BodyAssessment } from "@/types/database";

interface ProgressChartsProps {
  assessments: BodyAssessment[];
}

export function ProgressCharts({ assessments }: ProgressChartsProps) {
  const sorted = [...assessments].sort((a, b) =>
    a.assessment_date.localeCompare(b.assessment_date)
  );

  const chartData = sorted.map((a) => ({
    date: new Date(`${a.assessment_date}T12:00:00`).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    }),
    peso: a.weight_kg,
    grasa: a.body_fat_percentage ?? null,
    musculo: a.muscle_mass_kg ?? null,
    abdomen: a.abdomen_cm ?? null,
    cintura: a.waist_cm ?? null,
    biceps: a.bicep_right_cm ?? a.bicep_left_cm ?? null,
    espalda: a.back_width_cm ?? null,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
        Aún no hay evaluaciones suficientes para graficar evolución.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Peso y Masa Muscular */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Evolución de Peso (kg)
            </h3>
            <p className="text-xs text-slate-400">Tendencia por evaluación</p>
          </div>
          <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
            Peso corporal
          </span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="peso"
                name="Peso (kg)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#weightGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Perímetros Clave */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Perímetros Clave (cm)
            </h3>
            <p className="text-xs text-slate-400">Abdomen, Cintura y Bíceps</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            Antropometría
          </span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="abdomen"
                name="Abdomen (cm)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="cintura"
                name="Cintura (cm)"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="biceps"
                name="Bíceps (cm)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

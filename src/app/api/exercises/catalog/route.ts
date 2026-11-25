import { NextResponse } from "next/server";
import { ExerciseLibraryItem, MuscleGroup } from "@/types/database";
import {
  FREE_EXERCISE_DB_JSON_URL,
  FreeExerciseDbItem,
  normalizeFreeExerciseDbItem,
  normalizeSearchText,
} from "@/lib/live-exercise-catalog";

async function fetchFreeExerciseDb(): Promise<ExerciseLibraryItem[]> {
  const res = await fetch(FREE_EXERCISE_DB_JSON_URL, {
    next: { revalidate: 86400 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const list: FreeExerciseDbItem[] = await res.json();
  const exercises: ExerciseLibraryItem[] = [];
  for (const item of list) {
    const normalized = normalizeFreeExerciseDbItem(item);
    if (normalized) exercises.push(normalized);
  }
  return exercises;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group") as MuscleGroup | "Todos" | null;
    const q = searchParams.get("q")?.trim();
    const limitParam = Number(searchParams.get("limit") || "0");
    const offsetParam = Math.max(0, Number(searchParams.get("offset") || "0"));

    let exercises = await fetchFreeExerciseDb();

    if (group && group !== "Todos") {
      exercises = exercises.filter((e) => e.muscle_group === group);
    }

    if (q && q.length >= 2) {
      const normalizedQuery = normalizeSearchText(q);
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      exercises = exercises.filter((ex) => {
        const haystack = normalizeSearchText(
          [
            ex.name,
            ex.muscle_group,
            ex.equipment,
            ...(ex.primary_muscles || []),
            ...(ex.secondary_muscles || []),
            ...(ex.search_aliases || []),
          ].join(" ")
        );
        return tokens.every((token) => haystack.includes(token));
      });
    }

    const total = exercises.length;
    const sliced =
      limitParam > 0
        ? exercises.slice(offsetParam, offsetParam + limitParam)
        : exercises.slice(offsetParam);

    return NextResponse.json({
      source: "free-exercise-db",
      total,
      exercises: sliced,
    });
  } catch {
    return NextResponse.json(
      { source: "free-exercise-db", total: 0, exercises: [] },
      { status: 200 }
    );
  }
}

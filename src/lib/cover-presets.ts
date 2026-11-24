import { Gender, Profile } from "@/types/database";

export type CoverType = "default_male" | "default_female" | "preset" | "custom";

export interface CoverPreset {
  id: string;
  label: string;
  category: "mujer" | "hombre" | "coaching" | "nutricion";
  url: string;
  objectPosition?: string;
}

export const DEFAULT_FEMALE_COVER = "/images/landing/hero-athlete.jpg";
export const DEFAULT_MALE_COVER = "/images/landing/hero-athlete-male.jpg";
export const DEFAULT_COACH_COVER = "/images/landing/coach-session.jpg";

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: "preset-female-strength",
    label: "Fuerza Editorial · Mujer",
    category: "mujer",
    url: "/images/landing/hero-athlete.jpg",
    objectPosition: "object-[center_30%]",
  },
  {
    id: "preset-male-strength",
    label: "Fuerza Editorial · Hombre",
    category: "hombre",
    url: "/images/landing/hero-athlete-male.jpg",
    objectPosition: "object-[center_28%]",
  },
  {
    id: "preset-coach-studio",
    label: "Sesión Privada · Coaching",
    category: "coaching",
    url: "/images/landing/coach-session.jpg",
    objectPosition: "object-[center_25%]",
  },
  {
    id: "preset-nutrition-dark",
    label: "Nutrición de Alto Rendimiento",
    category: "nutricion",
    url: "/images/landing/nutrition-editorial.jpg",
    objectPosition: "object-center",
  },
  {
    id: "preset-female-athletic",
    label: "Atleta Studio · Enfoque",
    category: "mujer",
    url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    objectPosition: "object-center",
  },
  {
    id: "preset-male-gym",
    label: "Hierro y Disciplina · Hombre",
    category: "hombre",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    objectPosition: "object-center",
  },
  {
    id: "preset-coach-kettlebell",
    label: "Entrenamiento Funcional",
    category: "coaching",
    url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
    objectPosition: "object-center",
  },
  {
    id: "preset-nutrition-prep",
    label: "Preparación y Macros",
    category: "nutricion",
    url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
    objectPosition: "object-center",
  },
];

export function resolveDefaultCoverByGender(
  gender?: Gender | string | null,
  role?: "coach" | "student" | "admin"
): { url: string; type: CoverType; position: string } {
  if (gender === "male") {
    return {
      url: DEFAULT_MALE_COVER,
      type: "default_male",
      position: "object-[center_28%]",
    };
  }
  if (gender === "female") {
    return {
      url: DEFAULT_FEMALE_COVER,
      type: "default_female",
      position: "object-[center_30%]",
    };
  }
  if (role === "coach") {
    return {
      url: DEFAULT_COACH_COVER,
      type: "preset",
      position: "object-[center_25%]",
    };
  }
  return {
    url: DEFAULT_FEMALE_COVER,
    type: "default_female",
    position: "object-[center_30%]",
  };
}

export function resolveUserCover(
  profile: Partial<Profile>,
  role: "coach" | "student"
): { url: string; position: string } {
  if (
    profile.cover_url &&
    (profile.cover_type === "custom" || profile.cover_type === "preset")
  ) {
    const matched = COVER_PRESETS.find((p) => p.url === profile.cover_url);
    return {
      url: profile.cover_url,
      position: matched?.objectPosition || "object-center",
    };
  }
  const fallback = resolveDefaultCoverByGender(profile.gender, role);
  return { url: fallback.url, position: fallback.position };
}

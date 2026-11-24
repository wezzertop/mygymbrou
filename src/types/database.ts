export type UserRole = "coach" | "student" | "admin";
export type Gender = "female" | "male";
export type SaasPlanTier = "free" | "base" | "pro" | "studio";
export type CoverType = "default_male" | "default_female" | "preset" | "custom";
export type AccountStatus = "active" | "warned" | "suspended" | "banned";
export type ReportStatus = "pendiente" | "en_revision" | "resuelto" | "descartado";
export type ReportCategory = "servicio" | "conducta" | "contenido" | "seguimiento" | "otro";
export type SanctionType = "warning" | "temporary_suspension" | "permanent_ban";
export type PaymentRequestStatus = "pendiente" | "aprobado" | "rechazado";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type IdentityDocumentType = "ine_id" | "passport" | "selfie_id";
export type CertificationCategory =
  | "entrenamiento"
  | "nutricion"
  | "salud"
  | "especialidad";

export interface Profile {
  id: string;
  role: UserRole;
  gender?: Gender;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  brand_name?: string;
  specialty?: string;
  bio?: string;
  city?: string;
  years_experience?: number;
  accepting_students?: boolean;
  fitness_goal?: string;
  is_verified_identity?: boolean;
  verification_status?: VerificationStatus;
  verified_at?: string;
  identity_document_url?: string;
  identity_document_name?: string;
  identity_document_type?: IdentityDocumentType;
  verification_notes?: string;
  has_completed_onboarding?: boolean;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  onboarding_skipped?: boolean;
  cover_url?: string;
  cover_type?: CoverType;
  custom_motivational_quote?: string;
  selected_quote_id?: string;
  account_status?: AccountStatus;
  suspension_reason?: string;
  suspended_until?: string;
  saas_plan_tier?: SaasPlanTier;
  saas_student_limit?: number | null;
  terms_accepted_at: string;
  created_at: string;
}

export interface UserReport {
  id: string;
  reporter_id?: string;
  reported_user_id?: string;
  reporter_name: string;
  reported_user_name: string;
  reported_role: "coach" | "student";
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  admin_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface UserSanction {
  id: string;
  user_id: string;
  user_name: string;
  user_role: "coach" | "student";
  sanction_type: SanctionType;
  reason: string;
  duration_days?: number;
  expires_at?: string;
  is_active: boolean;
  issued_by?: string;
  lifted_at?: string;
  created_at: string;
}

export interface SaasPaymentRequest {
  id: string;
  coach_id?: string | null;
  coach_name: string;
  coach_email: string;
  plan_tier: "base" | "pro" | "studio";
  amount_mxn: number;
  transfer_reference?: string;
  receipt_url: string;
  receipt_name: string;
  notes?: string;
  status: PaymentRequestStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface CoachCertification {
  id: string;
  coach_id: string;
  title: string;
  institution: string;
  issue_year: number;
  credential_id?: string;
  category: CertificationCategory;
  file_name: string;
  file_url: string;
  file_type: "pdf" | "image";
  file_size_bytes?: number;
  is_verified: boolean;
  uploaded_at: string;
}

export interface PublicCoachProfile extends Profile {
  certifications: CoachCertification[];
  plans: CoachSubscriptionPlan[];
  active_students_count: number;
  rating?: number;
}

export type InquiryStatus = "pending" | "accepted" | "declined";

export interface CoachInquiry {
  id: string;
  coach_id: string;
  student_id?: string;
  student_name: string;
  student_email: string;
  student_is_verified: boolean;
  goal: string;
  preferred_plan_name?: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export type CoachingMode = "none" | "intermittent" | "in_person";

export interface CoachSubscriptionPlan {
  id: string;
  coach_id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  includes_nutrition: boolean;
  includes_workouts: boolean;
  coaching_mode: CoachingMode;
  includes_assessments: boolean;
  is_active: boolean;
  created_at: string;
}

export type InviteStatus = "pending" | "active" | "inactive";
export type SubscriptionStatus = "active" | "trial" | "expired" | "pending_payment";

export interface CoachStudentRelation {
  id: string;
  coach_id: string;
  student_id: string | null;
  plan_id: string | null;
  gender?: Gender;
  invited_name: string;
  invited_email: string;
  invite_token: string;
  invite_status: InviteStatus;
  subscription_status: SubscriptionStatus;
  subscription_plan_name: string;
  subscription_price: number;
  subscription_started_at: string; // YYYY-MM-DD
  expires_at: string; // YYYY-MM-DD
  next_billing_date: string;
  avatar_url?: string;
  fitness_goal?: string;
  phone?: string;
  is_verified_identity?: boolean;
  verification_status?: VerificationStatus;
  verified_at?: string;
  identity_document_url?: string;
  identity_document_name?: string;
  identity_document_type?: IdentityDocumentType;
  verification_notes?: string;
  created_at: string;
}

export interface StudentGoal {
  student_id: string;
  primary_goal: string;
  priority_zones: string[];
  target_weight_kg?: number;
  days_per_week: number;
  limitations_or_injuries?: string;
  updated_at: string;
}

export type MuscleGroup =
  | "Pecho"
  | "Espalda"
  | "Pierna"
  | "Hombro"
  | "Bíceps"
  | "Tríceps"
  | "Abdomen"
  | "Cardio";

export type MediaType = "sequence" | "gif" | "video" | "lottie" | "svg_anim";

export interface ExerciseFrame {
  phase: number;
  label: string;
  image_url: string;
}

export interface ExerciseFrameVariants {
  female: ExerciseFrame[];
  male: ExerciseFrame[];
}

export type AnimationKey =
  | "bench_press"
  | "lat_pulldown"
  | "row"
  | "squat"
  | "hip_thrust"
  | "rdl"
  | "shoulder_press"
  | "lateral_raise"
  | "bicep_curl"
  | "tricep_pushdown"
  | "plank"
  | "crunch"
  | "cardio_jump";

export interface ExerciseLibraryItem {
  id: string;
  coach_id: string | null;
  name: string;
  muscle_group: MuscleGroup;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  equipment: string;
  instructions: string;
  media_url?: string;
  media_type: MediaType;
  frames?: ExerciseFrameVariants;
  frame_interval_ms?: number;
  animation_key?: AnimationKey;
}

export interface ProgressPhoto {
  label: "Frente" | "Perfil" | "Espalda" | string;
  url: string;
}

export interface BodyAssessment {
  id: string;
  student_id: string;
  coach_id: string;
  assessment_date: string; // YYYY-MM-DD
  weight_kg: number;
  height_cm?: number;
  body_fat_percentage?: number;
  muscle_mass_kg?: number;
  chest_cm?: number;
  back_width_cm?: number;
  waist_cm?: number;
  abdomen_cm?: number;
  hip_cm?: number;
  bicep_left_cm?: number;
  bicep_right_cm?: number;
  forearm_cm?: number;
  thigh_left_cm?: number;
  thigh_right_cm?: number;
  calf_cm?: number;
  coach_analysis_notes?: string;
  goal_tag?: string;
  progress_photos: ProgressPhoto[];
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_day_id: string;
  exercise_library_id?: string;
  sort_order: number;
  name: string;
  muscle_group: string;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  sets: number;
  reps: string;
  rest_seconds: number;
  target_weight_or_rpe?: string;
  coach_notes?: string;
  instructions?: string;
  demo_url?: string;
  media_url?: string;
  media_type?: MediaType;
  frames?: ExerciseFrameVariants;
  frame_interval_ms?: number;
  animation_key?: AnimationKey;
}

export interface WorkoutDay {
  id: string;
  workout_id: string;
  day_number: number;
  title: string;
  focus_area?: string;
  assigned_weekdays: number[]; // 0=Dom, 1=Lun .. 6=Sáb
  estimated_minutes?: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
  coach_id: string;
  student_id: string | null;
  is_template: boolean;
  title: string;
  description?: string;
  goal?: string;
  level: "principiante" | "intermedio" | "avanzado";
  is_active: boolean;
  days: WorkoutDay[];
  created_at: string;
}

export interface WorkoutSessionLog {
  id: string;
  student_id: string;
  workout_day_id: string;
  workout_day_title: string;
  completed_date: string; // YYYY-MM-DD
  status: "completed" | "partial";
  exercises_completed: number;
  total_exercises: number;
  created_at: string;
}

export interface MealItem {
  id: string;
  nutrition_plan_id: string;
  sort_order: number;
  meal_time: string;
  suggested_hour?: string;
  foods_description: string;
  exchange_options?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
}

export interface NutritionPlan {
  id: string;
  coach_id: string;
  student_id: string | null;
  is_template: boolean;
  title: string;
  notes?: string;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  water_liters: number;
  is_active: boolean;
  meals: MealItem[];
  created_at: string;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  coach_id: string;
  student_id: string;
  student_name: string;
  title: string;
  scheduled_at: string;
  location_or_link: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

export type NotificationType =
  | "workout"
  | "diet"
  | "assessment"
  | "appointment"
  | "subscription"
  | "goal"
  | "verification"
  | "inquiry";

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface AdPlacement {
  id: string;
  sponsor_name: string;
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
  badge_text: string;
  placement_slot: "student_footer" | "post_workout" | "diet_card";
  is_active: boolean;
}

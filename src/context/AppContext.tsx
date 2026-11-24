"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  AdPlacement,
  AppNotification,
  Appointment,
  AppointmentStatus,
  BodyAssessment,
  CoachCertification,
  CoachInquiry,
  CoachStudentRelation,
  CoachSubscriptionPlan,
  ExerciseLibraryItem,
  IdentityDocumentType,
  NotificationType,
  NutritionPlan,
  Profile,
  PublicCoachProfile,
  ReportCategory,
  ReportStatus,
  SaasPlanTier,
  SanctionType,
  StudentGoal,
  SubscriptionStatus,
  UserReport,
  UserRole,
  UserSanction,
  WorkoutPlan,
  WorkoutSessionLog,
} from "@/types/database";
import { getSaasPlanById } from "@/lib/saas-plans";
import {
  DEMO_ACTIVE_STUDENT,
  DEMO_ADS,
  DEMO_APPOINTMENTS,
  DEMO_ASSESSMENTS,
  DEMO_COACH,
  DEMO_COACH_CERTIFICATIONS,
  DEMO_COACH_INQUIRIES,
  DEMO_DIRECTORY_COACHES,
  DEMO_EXERCISE_LIBRARY,
  DEMO_NOTIFICATIONS,
  DEMO_NUTRITION_PLANS,
  DEMO_STUDENTS,
  DEMO_STUDENT_GOALS,
  DEMO_SUBSCRIPTION_PLANS,
  DEMO_WORKOUTS,
  DEMO_WORKOUT_LOGS,
} from "@/lib/demo-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const STORAGE_KEY = "migymbrou_demo_state_v8";

export function isDemoModeEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false" && isSupabaseConfigured()) {
    return false;
  }
  return !isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

interface AppState {
  coachProfile: Profile;
  studentProfile: Profile;
  coachCertifications: CoachCertification[];
  directoryCoaches: PublicCoachProfile[];
  coachInquiries: CoachInquiry[];
  students: CoachStudentRelation[];
  subscriptionPlans: CoachSubscriptionPlan[];
  studentGoals: StudentGoal[];
  exerciseLibrary: ExerciseLibraryItem[];
  assessments: BodyAssessment[];
  workouts: WorkoutPlan[];
  workoutLogs: WorkoutSessionLog[];
  nutritionPlans: NutritionPlan[];
  appointments: Appointment[];
  notifications: AppNotification[];
  ads: AdPlacement[];
  completedExercises: Record<string, boolean>;
  completedMeals: Record<string, boolean>;
  exerciseLoads: Record<string, string>;
  userReports: UserReport[];
  userSanctions: UserSanction[];
}

const DEMO_REPORTS: UserReport[] = [
  {
    id: "rep-1",
    reporter_id: "student-1",
    reported_user_id: "coach-1",
    reporter_name: "Sofía Ramírez",
    reported_user_name: "Carlos Mendoza",
    reported_role: "coach",
    category: "seguimiento",
    description: "Solicitud de aclaración sobre horario de cita presencial de evaluación mensual.",
    status: "pendiente",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const DEMO_SANCTIONS: UserSanction[] = [];

const demoInitialState: AppState = {
  coachProfile: { ...DEMO_COACH, saas_plan_tier: "pro", saas_student_limit: 50, has_completed_onboarding: false, onboarding_completed: false, account_status: "active" },
  studentProfile: { ...DEMO_ACTIVE_STUDENT, has_completed_onboarding: false, onboarding_completed: false, account_status: "active" },
  coachCertifications: DEMO_COACH_CERTIFICATIONS,
  directoryCoaches: DEMO_DIRECTORY_COACHES,
  coachInquiries: DEMO_COACH_INQUIRIES,
  students: DEMO_STUDENTS,
  subscriptionPlans: DEMO_SUBSCRIPTION_PLANS,
  studentGoals: DEMO_STUDENT_GOALS,
  exerciseLibrary: DEMO_EXERCISE_LIBRARY,
  assessments: DEMO_ASSESSMENTS,
  workouts: DEMO_WORKOUTS,
  workoutLogs: DEMO_WORKOUT_LOGS,
  nutritionPlans: DEMO_NUTRITION_PLANS,
  appointments: DEMO_APPOINTMENTS,
  notifications: DEMO_NOTIFICATIONS,
  ads: DEMO_ADS,
  completedExercises: {},
  completedMeals: {},
  exerciseLoads: {},
  userReports: DEMO_REPORTS,
  userSanctions: DEMO_SANCTIONS,
};

const emptyRealState: AppState = {
  coachProfile: {
    id: "",
    role: "coach",
    full_name: "Mi Cuenta Coach",
    email: "",
    saas_plan_tier: "free",
    saas_student_limit: 5,
    has_completed_onboarding: false,
    onboarding_completed: false,
    account_status: "active",
    terms_accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  studentProfile: {
    id: "",
    role: "student",
    gender: "female",
    full_name: "Mi Cuenta Alumno",
    email: "",
    has_completed_onboarding: false,
    onboarding_completed: false,
    account_status: "active",
    terms_accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  coachCertifications: [],
  directoryCoaches: [],
  coachInquiries: [],
  students: [],
  subscriptionPlans: [],
  studentGoals: [],
  exerciseLibrary: DEMO_EXERCISE_LIBRARY,
  assessments: [],
  workouts: [],
  workoutLogs: [],
  nutritionPlans: [],
  appointments: [],
  notifications: [],
  ads: DEMO_ADS,
  completedExercises: {},
  completedMeals: {},
  exerciseLoads: {},
  userReports: [],
  userSanctions: [],
};

interface AppContextValue extends AppState {
  hydrated: boolean;
  isDemoMode: boolean;
  authUserId: string | null;
  authUserRole: UserRole | null;
  manualTourTrigger: { role: "coach" | "student"; nonce: number } | null;
  completeOnboarding: (role: "coach" | "student", skipped?: boolean) => void;
  resetOnboarding: (role: "coach" | "student") => void;
  updateCoachSaasPlan: (tier: SaasPlanTier) => void;
  setExerciseLoad: (exerciseId: string, load: string) => void;
  submitUserReport: (input: {
    reported_user_id?: string;
    reported_user_name: string;
    reported_role: "coach" | "student";
    category: ReportCategory;
    description: string;
  }) => Promise<boolean>;
  updateReportStatus: (
    reportId: string,
    status: ReportStatus,
    adminNotes?: string
  ) => void;
  issueSanction: (input: {
    user_id: string;
    user_name: string;
    user_role: "coach" | "student";
    sanction_type: SanctionType;
    reason: string;
    duration_days?: number;
  }) => void;
  liftSanction: (sanctionId: string) => void;
  refreshData: () => Promise<void>;
  inviteStudent: (input: {
    name: string;
    email: string;
    planId?: string;
    planName: string;
    price: number;
    goal?: string;
  }) => CoachStudentRelation;
  activateInvitedStudent: (token: string, fullName?: string) => boolean;
  updateStudentSubscription: (
    relationId: string,
    updates: {
      plan_id?: string | null;
      subscription_status: SubscriptionStatus;
      subscription_plan_name: string;
      subscription_price: number;
      subscription_started_at?: string;
      expires_at?: string;
      next_billing_date: string;
    }
  ) => void;
  assignSubscriptionPlanToStudent: (
    relationId: string,
    planId: string,
    startDate?: string
  ) => void;
  addSubscriptionPlan: (
    plan: Omit<CoachSubscriptionPlan, "id" | "created_at">
  ) => CoachSubscriptionPlan;
  updateSubscriptionPlan: (
    planId: string,
    patch: Partial<Omit<CoachSubscriptionPlan, "id" | "coach_id" | "created_at">>
  ) => void;
  deleteSubscriptionPlan: (planId: string) => void;
  endStudentCoaching: (relationId: string, reason?: string) => void;
  requestPlanUpgrade: (studentId: string, targetPlan: CoachSubscriptionPlan) => void;
  updateStudentGoal: (goal: Omit<StudentGoal, "updated_at">) => void;
  addExerciseToLibrary: (
    exercise: Omit<ExerciseLibraryItem, "id">
  ) => ExerciseLibraryItem;
  addAssessment: (
    assessment: Omit<BodyAssessment, "id" | "created_at">,
    notifyStudent?: boolean
  ) => BodyAssessment;
  addWorkoutPlan: (plan: Omit<WorkoutPlan, "id" | "created_at">) => WorkoutPlan;
  assignWorkoutToStudent: (templateId: string, studentId: string) => void;
  logWorkoutCompleted: (input: {
    student_id: string;
    workout_day_id: string;
    workout_day_title: string;
    completed_date?: string;
    exercises_completed: number;
    total_exercises: number;
  }) => WorkoutSessionLog;
  addNutritionPlan: (plan: Omit<NutritionPlan, "id" | "created_at">) => NutritionPlan;
  assignNutritionToStudent: (templateId: string, studentId: string) => void;
  addAppointment: (apt: Omit<Appointment, "id" | "created_at">) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  pushNotification: (input: {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
  }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  toggleExerciseComplete: (exerciseId: string) => void;
  toggleMealComplete: (mealId: string) => void;
  updateCoachProfile: (updates: Partial<Profile>) => void;
  updateStudentProfile: (updates: Partial<Profile>) => void;
  addCoachCertification: (
    cert: Omit<CoachCertification, "id" | "uploaded_at" | "is_verified">
  ) => CoachCertification;
  deleteCoachCertification: (certId: string) => void;
  submitIdentityVerification: (input: {
    role: "coach" | "student";
    documentType: IdentityDocumentType;
    documentUrl: string;
    documentName: string;
    autoApproveDemo?: boolean;
  }) => void;
  reviewStudentVerification: (
    studentId: string,
    decision: "verified" | "rejected",
    notes?: string
  ) => void;
  sendCoachInquiry: (input: {
    coach_id: string;
    student_id?: string;
    student_name: string;
    student_email: string;
    student_is_verified: boolean;
    goal: string;
    preferred_plan_name?: string;
    message: string;
  }) => CoachInquiry;
  respondToCoachInquiry: (
    inquiryId: string,
    decision: "accepted" | "declined"
  ) => void;
  resetDemoData: () => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addDaysToDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function getDaysRemaining(expiresAt?: string): number {
  if (!expiresAt) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiresAt}T00:00:00`);
  const diffMs = exp.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isDemoMode = isDemoModeEnabled();
  const [state, setState] = useState<AppState>(
    isDemoMode ? demoInitialState : emptyRealState
  );
  const [hydrated, setHydrated] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authUserRole, setAuthUserRole] = useState<UserRole | null>(null);
  const [manualTourTrigger, setManualTourTrigger] = useState<{
    role: "coach" | "student";
    nonce: number;
  } | null>(null);

  // Load real data from Supabase for the currently authenticated user (strictly isolated by RLS)
  const loadRealUserData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthUserId(null);
      setAuthUserRole(null);
      setState(emptyRealState);
      setHydrated(true);
      return;
    }

    setAuthUserId(user.id);

    const [
      profileRes,
      studentsRes,
      plansRes,
      goalsRes,
      assessmentsRes,
      appointmentsRes,
      notificationsRes,
      logsRes,
      certsRes,
      inquiriesRes,
      publicCoachesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("coach_students")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("coach_subscription_plans")
        .select("*")
        .order("price", { ascending: true }),
      supabase.from("student_goals").select("*"),
      supabase
        .from("body_assessments")
        .select("*")
        .order("assessment_date", { ascending: false }),
      supabase
        .from("appointments")
        .select("*")
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("workout_logs")
        .select("*")
        .order("completed_date", { ascending: false }),
      supabase
        .from("coach_certifications")
        .select("*")
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("coach_inquiries")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "coach")
        .eq("accepting_students", true),
    ]);

    const userRole =
      (profileRes.data?.role as Profile["role"]) ||
      (user.user_metadata?.role as Profile["role"]) ||
      "coach";
    setAuthUserRole(userRole);

    const saasTier =
      (profileRes.data?.saas_plan_tier as SaasPlanTier) ||
      (user.user_metadata?.saas_plan_tier as SaasPlanTier) ||
      "free";
    const planConfig = getSaasPlanById(saasTier);

    const builtProfile: Profile = {
      id: user.id,
      role: userRole,
      gender: profileRes.data?.gender || "female",
      full_name:
        profileRes.data?.full_name ||
        (user.user_metadata?.full_name as string) ||
        user.email?.split("@")[0] ||
        "Usuario",
      email: profileRes.data?.email || user.email || "",
      avatar_url: profileRes.data?.avatar_url || undefined,
      phone: profileRes.data?.phone || undefined,
      brand_name:
        profileRes.data?.brand_name ||
        (user.user_metadata?.brand_name as string) ||
        undefined,
      specialty:
        profileRes.data?.specialty ||
        (user.user_metadata?.specialty as string) ||
        undefined,
      bio: profileRes.data?.bio || undefined,
      city: profileRes.data?.city || undefined,
      years_experience: profileRes.data?.years_experience ?? undefined,
      accepting_students: profileRes.data?.accepting_students ?? true,
      fitness_goal: profileRes.data?.fitness_goal || undefined,
      is_verified_identity: Boolean(profileRes.data?.is_verified_identity),
      verification_status: profileRes.data?.verification_status || "unverified",
      verified_at: profileRes.data?.verified_at || undefined,
      identity_document_url: profileRes.data?.identity_document_url || undefined,
      identity_document_name: profileRes.data?.identity_document_name || undefined,
      identity_document_type: profileRes.data?.identity_document_type || undefined,
      verification_notes: profileRes.data?.verification_notes || undefined,
      has_completed_onboarding: Boolean(
        profileRes.data?.onboarding_completed ||
          profileRes.data?.has_completed_onboarding
      ),
      onboarding_completed: Boolean(
        profileRes.data?.onboarding_completed ||
          profileRes.data?.has_completed_onboarding
      ),
      onboarding_completed_at:
        profileRes.data?.onboarding_completed_at || undefined,
      onboarding_skipped: Boolean(profileRes.data?.onboarding_skipped),
      cover_url: profileRes.data?.cover_url || undefined,
      cover_type: profileRes.data?.cover_type || undefined,
      custom_motivational_quote:
        profileRes.data?.custom_motivational_quote || undefined,
      selected_quote_id: profileRes.data?.selected_quote_id || undefined,
      account_status: profileRes.data?.account_status || "active",
      suspension_reason: profileRes.data?.suspension_reason || undefined,
      suspended_until: profileRes.data?.suspended_until || undefined,
      saas_plan_tier: saasTier,
      saas_student_limit:
        profileRes.data?.saas_student_limit !== undefined
          ? profileRes.data?.saas_student_limit
          : planConfig.studentLimit,
      terms_accepted_at:
        profileRes.data?.terms_accepted_at || new Date().toISOString(),
      created_at: profileRes.data?.created_at || new Date().toISOString(),
    };

    const studentsList: CoachStudentRelation[] = (studentsRes.data || []).map(
      (row) => ({
        id: row.id,
        coach_id: row.coach_id,
        student_id: row.student_id,
        plan_id: row.plan_id,
        invited_name: row.invited_name,
        invited_email: row.invited_email,
        invite_token: row.invite_token || "",
        invite_status:
          row.invite_status === "inactive" ||
          row.invite_status === "finalizado" ||
          Boolean(row.ended_at)
            ? "finalizado"
            : row.invite_status,
        ended_at: row.ended_at || null,
        end_reason: row.end_reason || null,
        subscription_status: row.subscription_status,
        subscription_plan_name: row.subscription_plan_name,
        subscription_price: Number(row.subscription_price || 0),
        subscription_started_at:
          row.subscription_started_at || new Date().toISOString().split("T")[0],
        expires_at: row.expires_at || row.next_billing_date || "",
        next_billing_date: row.next_billing_date || row.expires_at || "",
        created_at: row.created_at,
      })
    );

    const mappedAppointments: Appointment[] = (appointmentsRes.data || []).map(
      (a) => {
        const st = studentsList.find((s) => s.student_id === a.student_id);
        return {
          id: a.id,
          coach_id: a.coach_id,
          student_id: a.student_id,
          student_name: st?.invited_name || "Alumno",
          title: a.title,
          scheduled_at: a.scheduled_at,
          location_or_link: a.location_or_link || "",
          status: a.status,
          notes: a.notes || undefined,
          created_at: a.created_at,
        };
      }
    );

    const allCerts = (certsRes.data || []) as CoachCertification[];
    const allPlans = (plansRes.data || []) as CoachSubscriptionPlan[];
    const builtDirectoryCoaches: PublicCoachProfile[] = (
      (publicCoachesRes.data || []) as Profile[]
    ).map((c) => ({
      ...c,
      certifications: allCerts.filter((cert) => cert.coach_id === c.id),
      plans: allPlans.filter((p) => p.coach_id === c.id && p.is_active),
      active_students_count: 0,
    }));

    const linkedCoachId =
      userRole === "student" ? studentsList[0]?.coach_id : undefined;
    let resolvedCoachProfile: Profile = emptyRealState.coachProfile;
    if (userRole === "coach") {
      resolvedCoachProfile = builtProfile;
    } else if (linkedCoachId) {
      const fromDir = builtDirectoryCoaches.find((c) => c.id === linkedCoachId);
      if (fromDir) {
        resolvedCoachProfile = fromDir;
      } else {
        const { data: linkedCoachRow } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", linkedCoachId)
          .maybeSingle();
        if (linkedCoachRow) {
          resolvedCoachProfile = linkedCoachRow as Profile;
        }
      }
    }

    setState((prev) => ({
      ...emptyRealState,
      exerciseLibrary: prev.exerciseLibrary,
      coachProfile: resolvedCoachProfile,
      studentProfile:
        userRole === "student" ? builtProfile : emptyRealState.studentProfile,
      coachCertifications:
        userRole === "coach"
          ? allCerts.filter((c) => c.coach_id === user.id)
          : allCerts,
      directoryCoaches: builtDirectoryCoaches,
      coachInquiries: (inquiriesRes.data || []) as CoachInquiry[],
      students: studentsList,
      subscriptionPlans: allPlans,
      studentGoals: (goalsRes.data || []) as StudentGoal[],
      assessments: (assessmentsRes.data || []) as BodyAssessment[],
      appointments: mappedAppointments,
      notifications: (notificationsRes.data || []) as AppNotification[],
      workoutLogs: (logsRes.data || []).map((l) => ({
        id: l.id,
        student_id: l.student_id,
        workout_day_id: l.workout_day_id,
        workout_day_title: "Sesión completada",
        completed_date: l.completed_date,
        status: l.status || "completed",
        exercises_completed: l.completed_sets || 1,
        total_exercises: l.completed_sets || 1,
        created_at: l.created_at,
      })),
    }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AppState>;
          setState((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // ignore storage errors
      } finally {
        setHydrated(true);
      }
      return;
    }

    // Real Supabase Mode: never load fake demo students!
    loadRealUserData();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadRealUserData();
    });
    return () => subscription.unsubscribe();
  }, [isDemoMode, loadRealUserData]);

  // Only persist to localStorage in Demo Mode
  useEffect(() => {
    if (!hydrated || !isDemoMode) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state, hydrated, isDemoMode]);

  const pushNotification = (input: {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
  }) => {
    const notif: AppNotification = {
      id: uid("notif"),
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      type: input.type,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      notifications: [notif, ...prev.notifications],
    }));

    if (!isDemoMode) {
      const supabase = createClient();
      supabase.from("notifications").insert({
        user_id: input.user_id,
        title: input.title,
        message: input.message,
        type: input.type,
      });
    }
  };

  const inviteStudent: AppContextValue["inviteStudent"] = ({
    name,
    email,
    planId,
    planName,
    price,
    goal,
  }) => {
    const today = new Date().toISOString().split("T")[0];
    const matchedPlan = state.subscriptionPlans.find((p) => p.id === planId);
    const expires = addDaysToDate(today, matchedPlan?.duration_days || 30);
    const coachId = authUserId || state.coachProfile.id;

    const relation: CoachStudentRelation = {
      id: uid("rel"),
      coach_id: coachId,
      student_id: null,
      plan_id: matchedPlan?.id || null,
      invited_name: name,
      invited_email: email.toLowerCase(),
      invite_token: uid("tok"),
      invite_status: "pending",
      subscription_status: "trial",
      subscription_plan_name: matchedPlan?.name || planName || "Plan Mensual",
      subscription_price: matchedPlan?.price ?? price ?? 1000,
      subscription_started_at: today,
      expires_at: expires,
      next_billing_date: expires,
      fitness_goal: goal || "Recomposición Corporal",
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      students: [relation, ...prev.students],
    }));

    if (!isDemoMode && coachId) {
      const supabase = createClient();
      supabase
        .from("coach_students")
        .insert({
          coach_id: coachId,
          plan_id: matchedPlan?.id || null,
          invited_name: name,
          invited_email: email.toLowerCase(),
          invite_token: relation.invite_token,
          invite_status: "pending",
          subscription_status: "trial",
          subscription_plan_name: relation.subscription_plan_name,
          subscription_price: relation.subscription_price,
          subscription_started_at: today,
          expires_at: expires,
          next_billing_date: expires,
        })
        .then(() => loadRealUserData());
    }

    return relation;
  };

  const activateInvitedStudent = (token: string, fullName?: string) => {
    let found = false;
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => {
        if (s.invite_token === token || s.invited_email === token) {
          found = true;
          return {
            ...s,
            student_id: s.student_id || uid("student"),
            invited_name: fullName || s.invited_name,
            invite_status: "active",
            subscription_status:
              s.subscription_status === "trial" ? "active" : s.subscription_status,
          };
        }
        return s;
      }),
    }));
    return found;
  };

  const updateStudentSubscription: AppContextValue["updateStudentSubscription"] = (
    relationId,
    updates
  ) => {
    let targetStudentId: string | null = null;
    setState((prev) => {
      const updated = prev.students.map((s) => {
        if (s.id === relationId) {
          targetStudentId = s.student_id;
          return {
            ...s,
            ...updates,
            expires_at: updates.expires_at || updates.next_billing_date,
          };
        }
        return s;
      });
      return { ...prev, students: updated };
    });

    if (!isDemoMode) {
      const supabase = createClient();
      supabase
        .from("coach_students")
        .update({
          plan_id: updates.plan_id ?? undefined,
          subscription_status: updates.subscription_status,
          subscription_plan_name: updates.subscription_plan_name,
          subscription_price: updates.subscription_price,
          subscription_started_at: updates.subscription_started_at,
          expires_at: updates.expires_at || updates.next_billing_date,
          next_billing_date: updates.next_billing_date,
        })
        .eq("id", relationId);
    }

    if (targetStudentId) {
      pushNotification({
        user_id: targetStudentId,
        title: "Suscripción actualizada",
        message: `Tu plan "${updates.subscription_plan_name}" está activo hasta el ${updates.expires_at || updates.next_billing_date}.`,
        type: "subscription",
      });
    }
  };

  const assignSubscriptionPlanToStudent = (
    relationId: string,
    planId: string,
    startDate?: string
  ) => {
    const plan = state.subscriptionPlans.find((p) => p.id === planId);
    if (!plan) return;
    const start = startDate || new Date().toISOString().split("T")[0];
    const expires = addDaysToDate(start, plan.duration_days);

    updateStudentSubscription(relationId, {
      plan_id: plan.id,
      subscription_status: "active",
      subscription_plan_name: plan.name,
      subscription_price: plan.price,
      subscription_started_at: start,
      expires_at: expires,
      next_billing_date: expires,
    });
  };

  const addSubscriptionPlan: AppContextValue["addSubscriptionPlan"] = (plan) => {
    const coachId = authUserId || state.coachProfile.id;
    const created: CoachSubscriptionPlan = {
      ...plan,
      coach_id: coachId,
      id: uid("plan"),
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      subscriptionPlans: [...prev.subscriptionPlans, created],
    }));

    if (!isDemoMode && coachId) {
      const supabase = createClient();
      supabase
        .from("coach_subscription_plans")
        .insert({
          coach_id: coachId,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration_days: plan.duration_days,
          includes_nutrition: plan.includes_nutrition,
          includes_workouts: plan.includes_workouts,
          coaching_mode: plan.coaching_mode,
          includes_assessments: plan.includes_assessments,
          is_active: true,
        })
        .then(() => loadRealUserData());
    }

    return created;
  };

  const updateSubscriptionPlan: AppContextValue["updateSubscriptionPlan"] = (
    planId,
    patch
  ) => {
    setState((prev) => ({
      ...prev,
      subscriptionPlans: prev.subscriptionPlans.map((p) =>
        p.id === planId ? { ...p, ...patch } : p
      ),
      directoryCoaches: prev.directoryCoaches.map((c) => ({
        ...c,
        plans: c.plans.map((p) => (p.id === planId ? { ...p, ...patch } : p)),
      })),
    }));

    if (!isDemoMode) {
      const supabase = createClient();
      supabase
        .from("coach_subscription_plans")
        .update(patch)
        .eq("id", planId)
        .then(() => {});
    }
  };

  const deleteSubscriptionPlan = (planId: string) => {
    setState((prev) => ({
      ...prev,
      subscriptionPlans: prev.subscriptionPlans.filter((p) => p.id !== planId),
    }));
    if (!isDemoMode) {
      const supabase = createClient();
      supabase.from("coach_subscription_plans").delete().eq("id", planId);
    }
  };

  const endStudentCoaching: AppContextValue["endStudentCoaching"] = (
    relationId,
    reason
  ) => {
    const endedAt = new Date().toISOString();
    const trimmedReason = reason?.trim() || null;
    const target = state.students.find((s) => s.id === relationId);

    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === relationId
          ? {
              ...s,
              invite_status: "finalizado",
              subscription_status: "expired",
              ended_at: endedAt,
              end_reason: trimmedReason,
            }
          : s
      ),
    }));

    if (target?.student_id) {
      pushNotification({
        user_id: target.student_id,
        title: "Asesoramiento finalizado",
        message:
          "Tu Coach cerró el seguimiento activo. Tu cuenta y todo tu historial de medidas y progreso siguen intactos en tu perfil.",
        type: "subscription",
      });
    }

    if (!isDemoMode) {
      const supabase = createClient();
      supabase
        .from("coach_students")
        .update({
          invite_status: "finalizado",
          subscription_status: "expired",
          ended_at: endedAt,
          end_reason: trimmedReason,
        })
        .eq("id", relationId)
        .then(({ error }) => {
          if (error) {
            // Fallback si la migración SQL de 'finalizado'/ended_at aún no se ejecuta
            supabase
              .from("coach_students")
              .update({
                invite_status: "inactive",
                subscription_status: "expired",
              })
              .eq("id", relationId)
              .then(() => {});
          }
        });
    }
  };

  const requestPlanUpgrade = (
    studentId: string,
    targetPlan: CoachSubscriptionPlan
  ) => {
    pushNotification({
      user_id: studentId,
      title: `Solicitud de cambio a ${targetPlan.name}`,
      message: `Enviamos tu solicitud a tu Coach para actualizar a ${targetPlan.name} ($${targetPlan.price} / ${targetPlan.duration_days} días).`,
      type: "subscription",
    });
  };

  const updateStudentGoal: AppContextValue["updateStudentGoal"] = (goal) => {
    const updated: StudentGoal = {
      ...goal,
      updated_at: new Date().toISOString(),
    };
    setState((prev) => {
      const exists = prev.studentGoals.some(
        (g) => g.student_id === goal.student_id
      );
      return {
        ...prev,
        studentGoals: exists
          ? prev.studentGoals.map((g) =>
              g.student_id === goal.student_id ? updated : g
            )
          : [...prev.studentGoals, updated],
        studentProfile:
          prev.studentProfile.id === goal.student_id
            ? { ...prev.studentProfile, fitness_goal: goal.primary_goal }
            : prev.studentProfile,
        students: prev.students.map((s) =>
          s.student_id === goal.student_id
            ? { ...s, fitness_goal: goal.primary_goal }
            : s
        ),
      };
    });

    if (!isDemoMode && goal.student_id) {
      const supabase = createClient();
      supabase.from("student_goals").upsert(
        {
          student_id: goal.student_id,
          primary_goal: goal.primary_goal,
          priority_zones: goal.priority_zones,
          target_weight_kg: goal.target_weight_kg ?? null,
          days_per_week: goal.days_per_week,
          limitations_or_injuries: goal.limitations_or_injuries ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" }
      );
    }
  };

  const addExerciseToLibrary: AppContextValue["addExerciseToLibrary"] = (ex) => {
    const created: ExerciseLibraryItem = {
      ...ex,
      id: uid("lib"),
    };
    setState((prev) => ({
      ...prev,
      exerciseLibrary: [created, ...prev.exerciseLibrary],
    }));
    return created;
  };

  const addAssessment: AppContextValue["addAssessment"] = (
    assessment,
    notifyStudent = true
  ) => {
    const coachId = authUserId || assessment.coach_id;
    const newAssess: BodyAssessment = {
      ...assessment,
      coach_id: coachId,
      id: uid("assess"),
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      assessments: [...prev.assessments, newAssess],
    }));

    if (!isDemoMode && coachId) {
      const supabase = createClient();
      supabase.from("body_assessments").insert({
        student_id: assessment.student_id,
        coach_id: coachId,
        assessment_date: assessment.assessment_date,
        weight_kg: assessment.weight_kg,
        height_cm: assessment.height_cm,
        body_fat_percentage: assessment.body_fat_percentage,
        muscle_mass_kg: assessment.muscle_mass_kg,
        chest_cm: assessment.chest_cm,
        back_width_cm: assessment.back_width_cm,
        waist_cm: assessment.waist_cm,
        abdomen_cm: assessment.abdomen_cm,
        hip_cm: assessment.hip_cm,
        bicep_left_cm: assessment.bicep_left_cm,
        bicep_right_cm: assessment.bicep_right_cm,
        thigh_left_cm: assessment.thigh_left_cm,
        thigh_right_cm: assessment.thigh_right_cm,
        calf_cm: assessment.calf_cm,
        coach_analysis_notes: assessment.coach_analysis_notes,
        goal_tag: assessment.goal_tag,
        progress_photos: assessment.progress_photos || [],
      });
    }

    if (notifyStudent) {
      pushNotification({
        user_id: assessment.student_id,
        title: "Nueva evaluación física y análisis",
        message: `Tu coach registró nuevas medidas (${assessment.weight_kg} kg) y comentarios personalizados.`,
        type: "assessment",
      });
    }
    return newAssess;
  };

  const addWorkoutPlan: AppContextValue["addWorkoutPlan"] = (plan) => {
    const created: WorkoutPlan = {
      ...plan,
      id: uid("workout"),
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      workouts: [
        created,
        ...prev.workouts.map((w) =>
          plan.student_id && w.student_id === plan.student_id
            ? { ...w, is_active: false }
            : w
        ),
      ],
    }));
    if (plan.student_id) {
      pushNotification({
        user_id: plan.student_id,
        title: "Nueva rutina visual asignada",
        message: `Ya tienes disponible "${plan.title}" en tu app.`,
        type: "workout",
      });
    }
    return created;
  };

  const assignWorkoutToStudent = (templateId: string, studentId: string) => {
    const template = state.workouts.find((w) => w.id === templateId);
    if (!template) return;
    const clonedId = uid("workout");
    const cloned: WorkoutPlan = {
      ...template,
      id: clonedId,
      student_id: studentId,
      is_template: false,
      title: template.title.replace(/^Plantilla:\s*/i, ""),
      is_active: true,
      created_at: new Date().toISOString(),
      days: template.days.map((d) => {
        const dayId = uid("day");
        return {
          ...d,
          id: dayId,
          workout_id: clonedId,
          exercises: d.exercises.map((e) => ({
            ...e,
            id: uid("ex"),
            workout_day_id: dayId,
          })),
        };
      }),
    };
    setState((prev) => ({
      ...prev,
      workouts: [
        cloned,
        ...prev.workouts.map((w) =>
          w.student_id === studentId ? { ...w, is_active: false } : w
        ),
      ],
    }));
    pushNotification({
      user_id: studentId,
      title: "Rutina actualizada por tu Coach",
      message: `Se te asignó la rutina "${cloned.title}". ¡A entrenar!`,
      type: "workout",
    });
  };

  const logWorkoutCompleted: AppContextValue["logWorkoutCompleted"] = (input) => {
    const today =
      input.completed_date || new Date().toISOString().split("T")[0];
    const log: WorkoutSessionLog = {
      id: uid("wlog"),
      student_id: input.student_id,
      workout_day_id: input.workout_day_id,
      workout_day_title: input.workout_day_title,
      completed_date: today,
      status:
        input.exercises_completed >= input.total_exercises
          ? "completed"
          : "partial",
      exercises_completed: input.exercises_completed,
      total_exercises: input.total_exercises,
      created_at: new Date().toISOString(),
    };
    setState((prev) => {
      const filtered = prev.workoutLogs.filter(
        (l) =>
          !(
            l.student_id === input.student_id &&
            l.completed_date === today &&
            l.workout_day_id === input.workout_day_id
          )
      );
      return {
        ...prev,
        workoutLogs: [log, ...filtered],
      };
    });
    return log;
  };

  const addNutritionPlan: AppContextValue["addNutritionPlan"] = (plan) => {
    const created: NutritionPlan = {
      ...plan,
      id: uid("diet"),
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      nutritionPlans: [created, ...prev.nutritionPlans],
    }));
    if (plan.student_id) {
      pushNotification({
        user_id: plan.student_id,
        title: "Nuevo plan nutricional",
        message: `Tu coach actualizó tu dieta: "${plan.title}" (${plan.daily_calories} kcal).`,
        type: "diet",
      });
    }
    return created;
  };

  const assignNutritionToStudent = (templateId: string, studentId: string) => {
    const template = state.nutritionPlans.find((n) => n.id === templateId);
    if (!template) return;
    const clonedId = uid("diet");
    const cloned: NutritionPlan = {
      ...template,
      id: clonedId,
      student_id: studentId,
      is_template: false,
      title: template.title.replace(/^Plantilla:\s*/i, ""),
      is_active: true,
      created_at: new Date().toISOString(),
      meals: template.meals.map((m) => ({
        ...m,
        id: uid("meal"),
        nutrition_plan_id: clonedId,
      })),
    };
    setState((prev) => ({
      ...prev,
      nutritionPlans: [
        cloned,
        ...prev.nutritionPlans.map((n) =>
          n.student_id === studentId ? { ...n, is_active: false } : n
        ),
      ],
    }));
    pushNotification({
      user_id: studentId,
      title: "Dieta actualizada",
      message: `Se te asignó "${cloned.title}" (${cloned.daily_calories} kcal diarias).`,
      type: "diet",
    });
  };

  const addAppointment: AppContextValue["addAppointment"] = (apt) => {
    const coachId = authUserId || apt.coach_id;
    const created: Appointment = {
      ...apt,
      coach_id: coachId,
      id: uid("apt"),
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      appointments: [created, ...prev.appointments],
    }));

    if (!isDemoMode && coachId) {
      const supabase = createClient();
      supabase.from("appointments").insert({
        coach_id: coachId,
        student_id: apt.student_id,
        title: apt.title,
        scheduled_at: apt.scheduled_at,
        location_or_link: apt.location_or_link,
        status: apt.status,
        notes: apt.notes,
      });
    }

    pushNotification({
      user_id: apt.student_id,
      title: "Nueva cita agendada",
      message: `${apt.title} — ${new Date(apt.scheduled_at).toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      })}.`,
      type: "appointment",
    });
    return created;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    }));
    if (!isDemoMode) {
      const supabase = createClient();
      supabase.from("appointments").update({ status }).eq("id", id);
    }
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }));
    if (!isDemoMode) {
      const supabase = createClient();
      supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
  };

  const markAllNotificationsRead = (userId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.user_id === userId ? { ...n, is_read: true } : n
      ),
    }));
    if (!isDemoMode) {
      const supabase = createClient();
      supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId);
    }
  };

  const toggleExerciseComplete = (exerciseId: string) => {
    setState((prev) => ({
      ...prev,
      completedExercises: {
        ...prev.completedExercises,
        [exerciseId]: !prev.completedExercises[exerciseId],
      },
    }));
  };

  const toggleMealComplete = (mealId: string) => {
    setState((prev) => ({
      ...prev,
      completedMeals: {
        ...prev.completedMeals,
        [mealId]: !prev.completedMeals[mealId],
      },
    }));
  };

  const updateCoachProfile = (updates: Partial<Profile>) => {
    setState((prev) => {
      const updatedCoach = { ...prev.coachProfile, ...updates };
      return {
        ...prev,
        coachProfile: updatedCoach,
        directoryCoaches: prev.directoryCoaches.map((c) =>
          c.id === updatedCoach.id ? { ...c, ...updates } : c
        ),
      };
    });
    if (!isDemoMode && authUserId) {
      const supabase = createClient();
      supabase.from("profiles").update(updates).eq("id", authUserId);
    }
  };

  const updateStudentProfile = (updates: Partial<Profile>) => {
    setState((prev) => ({
      ...prev,
      studentProfile: { ...prev.studentProfile, ...updates },
      students: prev.students.map((s) =>
        s.student_id === prev.studentProfile.id
          ? {
              ...s,
              invited_name: updates.full_name ?? s.invited_name,
              avatar_url: updates.avatar_url ?? s.avatar_url,
              phone: updates.phone ?? s.phone,
              gender: updates.gender ?? s.gender,
            }
          : s
      ),
    }));
    if (!isDemoMode && authUserId) {
      const supabase = createClient();
      supabase.from("profiles").update(updates).eq("id", authUserId);
    }
  };

  const addCoachCertification: AppContextValue["addCoachCertification"] = (
    cert
  ) => {
    const coachId = authUserId || cert.coach_id || state.coachProfile.id;
    const created: CoachCertification = {
      ...cert,
      coach_id: coachId,
      id: uid("cert"),
      is_verified: true,
      uploaded_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      coachCertifications: [created, ...prev.coachCertifications],
      directoryCoaches: prev.directoryCoaches.map((c) =>
        c.id === coachId
          ? { ...c, certifications: [created, ...c.certifications] }
          : c
      ),
    }));
    if (!isDemoMode && coachId) {
      const supabase = createClient();
      supabase.from("coach_certifications").insert({
        coach_id: coachId,
        title: created.title,
        institution: created.institution,
        issue_year: created.issue_year,
        credential_id: created.credential_id,
        category: created.category,
        file_name: created.file_name,
        file_url: created.file_url,
        file_type: created.file_type,
        file_size_bytes: created.file_size_bytes,
        is_verified: true,
      });
    }
    return created;
  };

  const deleteCoachCertification = (certId: string) => {
    setState((prev) => ({
      ...prev,
      coachCertifications: prev.coachCertifications.filter(
        (c) => c.id !== certId
      ),
      directoryCoaches: prev.directoryCoaches.map((coach) => ({
        ...coach,
        certifications: coach.certifications.filter((c) => c.id !== certId),
      })),
    }));
    if (!isDemoMode) {
      const supabase = createClient();
      supabase.from("coach_certifications").delete().eq("id", certId);
    }
  };

  const submitIdentityVerification: AppContextValue["submitIdentityVerification"] =
    (input) => {
      const now = new Date().toISOString();
      const approveNow = Boolean(input.autoApproveDemo && isDemoMode);
      const updates: Partial<Profile> = {
        identity_document_type: input.documentType,
        identity_document_url: input.documentUrl,
        identity_document_name: input.documentName,
        verification_status: approveNow ? "verified" : "pending",
        is_verified_identity: approveNow,
        verified_at: approveNow ? now : undefined,
        verification_notes: approveNow
          ? "Identidad validada correctamente como persona real."
          : "Documento enviado y en espera de validación.",
      };

      if (input.role === "coach") {
        updateCoachProfile(updates);
      } else {
        setState((prev) => ({
          ...prev,
          studentProfile: { ...prev.studentProfile, ...updates },
          students: prev.students.map((s) =>
            s.student_id === prev.studentProfile.id
              ? {
                  ...s,
                  identity_document_type: input.documentType,
                  identity_document_url: input.documentUrl,
                  identity_document_name: input.documentName,
                  verification_status: approveNow ? "verified" : "pending",
                  is_verified_identity: approveNow,
                  verified_at: approveNow ? now : undefined,
                  verification_notes: updates.verification_notes,
                }
              : s
          ),
        }));
        if (!isDemoMode && authUserId) {
          const supabase = createClient();
          supabase.from("profiles").update(updates).eq("id", authUserId);
        }
      }
    };

  const reviewStudentVerification: AppContextValue["reviewStudentVerification"] =
    (studentId, decision, notes) => {
      const now = new Date().toISOString();
      const isVerified = decision === "verified";
      const noteText =
        notes ||
        (isVerified
          ? "Tu identidad como persona real fue verificada por tu Coach."
          : "Necesitamos una foto más clara de tu identificación para completar la verificación.");

      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.student_id === studentId || s.id === studentId
            ? {
                ...s,
                is_verified_identity: isVerified,
                verification_status: decision,
                verified_at: isVerified ? now : undefined,
                verification_notes: noteText,
              }
            : s
        ),
        studentProfile:
          prev.studentProfile.id === studentId
            ? {
                ...prev.studentProfile,
                is_verified_identity: isVerified,
                verification_status: decision,
                verified_at: isVerified ? now : undefined,
                verification_notes: noteText,
              }
            : prev.studentProfile,
      }));

      if (!isDemoMode) {
        const supabase = createClient();
        supabase
          .from("profiles")
          .update({
            is_verified_identity: isVerified,
            verification_status: decision,
            verified_at: isVerified ? now : null,
            verification_notes: noteText,
          })
          .eq("id", studentId);
      }

      pushNotification({
        user_id: studentId,
        title: isVerified
          ? "¡Identidad Verificada!"
          : "Revisión de Verificación",
        message: noteText,
        type: "verification",
      });
    };

  const sendCoachInquiry: AppContextValue["sendCoachInquiry"] = (input) => {
    const created: CoachInquiry = {
      ...input,
      id: uid("inq"),
      status: "pending",
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      coachInquiries: [created, ...prev.coachInquiries],
    }));

    if (!isDemoMode) {
      const supabase = createClient();
      supabase.from("coach_inquiries").insert({
        coach_id: input.coach_id,
        student_id: input.student_id || authUserId || null,
        student_name: input.student_name,
        student_email: input.student_email,
        student_is_verified: input.student_is_verified,
        goal: input.goal,
        preferred_plan_name: input.preferred_plan_name,
        message: input.message,
        status: "pending",
      });
    }

    pushNotification({
      user_id: input.coach_id,
      title: "Nueva solicitud de alumno",
      message: `${input.student_name}${input.student_is_verified ? " (Persona Verificada)" : ""} solicita entrenar contigo: "${input.goal}".`,
      type: "inquiry",
    });

    return created;
  };

  const respondToCoachInquiry: AppContextValue["respondToCoachInquiry"] = (
    inquiryId,
    decision
  ) => {
    const inquiry = state.coachInquiries.find((i) => i.id === inquiryId);
    setState((prev) => ({
      ...prev,
      coachInquiries: prev.coachInquiries.map((i) =>
        i.id === inquiryId ? { ...i, status: decision } : i
      ),
    }));

    if (!isDemoMode) {
      const supabase = createClient();
      supabase
        .from("coach_inquiries")
        .update({ status: decision })
        .eq("id", inquiryId);
    }

    if (inquiry && decision === "accepted") {
      const matchedPlan =
        state.subscriptionPlans.find(
          (p) => p.name === inquiry.preferred_plan_name
        ) || state.subscriptionPlans[0];

      const exists = state.students.some(
        (s) =>
          s.invited_email.toLowerCase() === inquiry.student_email.toLowerCase()
      );
      if (!exists) {
        const created = inviteStudent({
          name: inquiry.student_name,
          email: inquiry.student_email,
          planId: matchedPlan?.id,
          planName: matchedPlan?.name || inquiry.preferred_plan_name || "Plan Oro",
          price: matchedPlan?.price ?? 1200,
          goal: inquiry.goal,
        });
        if (inquiry.student_is_verified) {
          setState((prev) => ({
            ...prev,
            students: prev.students.map((s) =>
              s.id === created.id
                ? {
                    ...s,
                    is_verified_identity: true,
                    verification_status: "verified",
                    verified_at: new Date().toISOString(),
                  }
                : s
            ),
          }));
        }
      }
    }
  };

  const resetDemoData = () => {
    if (!isDemoMode) return;
    setState(demoInitialState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const signOut = async () => {
    if (!isDemoMode) {
      const supabase = createClient();
      await supabase.auth.signOut();
      setAuthUserId(null);
      setAuthUserRole(null);
      setState(emptyRealState);
    }
  };

  const completeOnboarding = (role: "coach" | "student", skipped = false) => {
    const now = new Date().toISOString();
    const userKey = authUserId || (role === "coach" ? state.coachProfile.id : state.studentProfile.id) || "local";
    try {
      localStorage.setItem(
        `migymbrou_onboarding_v2_${role}_${userKey}`,
        JSON.stringify({ completed: true, skipped, completed_at: now })
      );
    } catch {
      // ignore storage errors
    }

    const updates: Partial<Profile> = {
      has_completed_onboarding: true,
      onboarding_completed: true,
      onboarding_completed_at: now,
      onboarding_skipped: skipped,
    };

    if (role === "coach") {
      updateCoachProfile(updates);
    } else {
      updateStudentProfile(updates);
    }
  };

  const resetOnboarding = (role: "coach" | "student") => {
    // Abre el tutorial de forma explícita SIN borrar la persistencia de primera vez
    setManualTourTrigger({ role, nonce: Date.now() });
  };

  const submitUserReport: AppContextValue["submitUserReport"] = async (input) => {
    const reporter =
      authUserRole === "student" ? state.studentProfile : state.coachProfile;
    const created: UserReport = {
      id: uid("rep"),
      reporter_id: authUserId || reporter.id || undefined,
      reported_user_id: input.reported_user_id,
      reporter_name: reporter.full_name || "Usuario",
      reported_user_name: input.reported_user_name,
      reported_role: input.reported_role,
      category: input.category,
      description: input.description,
      status: "pendiente",
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      userReports: [created, ...prev.userReports],
    }));

    if (!isDemoMode) {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        return res.ok;
      } catch {
        return false;
      }
    }
    return true;
  };

  const updateReportStatus: AppContextValue["updateReportStatus"] = (
    reportId,
    status,
    adminNotes
  ) => {
    setState((prev) => ({
      ...prev,
      userReports: prev.userReports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status,
              admin_notes: adminNotes ?? r.admin_notes,
              resolved_at:
                status === "resuelto" || status === "descartado"
                  ? new Date().toISOString()
                  : r.resolved_at,
            }
          : r
      ),
    }));
  };

  const issueSanction: AppContextValue["issueSanction"] = (input) => {
    const expiresAt =
      input.sanction_type === "temporary_suspension" && input.duration_days
        ? new Date(
            Date.now() + input.duration_days * 24 * 60 * 60 * 1000
          ).toISOString()
        : undefined;
    const created: UserSanction = {
      id: uid("sanc"),
      user_id: input.user_id,
      user_name: input.user_name,
      user_role: input.user_role,
      sanction_type: input.sanction_type,
      reason: input.reason,
      duration_days: input.duration_days,
      expires_at: expiresAt,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    const nextAccountStatus =
      input.sanction_type === "warning"
        ? "warned"
        : input.sanction_type === "temporary_suspension"
        ? "suspended"
        : "banned";

    setState((prev) => ({
      ...prev,
      userSanctions: [created, ...prev.userSanctions],
      coachProfile:
        prev.coachProfile.id === input.user_id
          ? {
              ...prev.coachProfile,
              account_status: nextAccountStatus,
              suspension_reason: input.reason,
              suspended_until: expiresAt,
            }
          : prev.coachProfile,
      studentProfile:
        prev.studentProfile.id === input.user_id
          ? {
              ...prev.studentProfile,
              account_status: nextAccountStatus,
              suspension_reason: input.reason,
              suspended_until: expiresAt,
            }
          : prev.studentProfile,
    }));
  };

  const liftSanction: AppContextValue["liftSanction"] = (sanctionId) => {
    const target = state.userSanctions.find((s) => s.id === sanctionId);
    setState((prev) => ({
      ...prev,
      userSanctions: prev.userSanctions.map((s) =>
        s.id === sanctionId
          ? { ...s, is_active: false, lifted_at: new Date().toISOString() }
          : s
      ),
      coachProfile:
        target && prev.coachProfile.id === target.user_id
          ? {
              ...prev.coachProfile,
              account_status: "active",
              suspension_reason: undefined,
              suspended_until: undefined,
            }
          : prev.coachProfile,
      studentProfile:
        target && prev.studentProfile.id === target.user_id
          ? {
              ...prev.studentProfile,
              account_status: "active",
              suspension_reason: undefined,
              suspended_until: undefined,
            }
          : prev.studentProfile,
    }));
  };

  const updateCoachSaasPlan = (tier: SaasPlanTier) => {
    const plan = getSaasPlanById(tier);
    updateCoachProfile({
      saas_plan_tier: tier,
      saas_student_limit: plan.studentLimit,
    });
  };

  const setExerciseLoad = (exerciseId: string, load: string) => {
    setState((prev) => ({
      ...prev,
      exerciseLoads: {
        ...prev.exerciseLoads,
        [exerciseId]: load,
      },
    }));
  };

  const refreshData = async () => {
    if (!isDemoMode) {
      await loadRealUserData();
    }
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        hydrated,
        isDemoMode,
        authUserId,
        authUserRole,
        manualTourTrigger,
        completeOnboarding,
        resetOnboarding,
        updateCoachSaasPlan,
        setExerciseLoad,
        submitUserReport,
        updateReportStatus,
        issueSanction,
        liftSanction,
        refreshData,
        inviteStudent,
        activateInvitedStudent,
        updateStudentSubscription,
        assignSubscriptionPlanToStudent,
        addSubscriptionPlan,
        updateSubscriptionPlan,
        deleteSubscriptionPlan,
        endStudentCoaching,
        requestPlanUpgrade,
        updateStudentGoal,
        addExerciseToLibrary,
        addAssessment,
        addWorkoutPlan,
        assignWorkoutToStudent,
        logWorkoutCompleted,
        addNutritionPlan,
        assignNutritionToStudent,
        addAppointment,
        updateAppointmentStatus,
        pushNotification,
        markNotificationRead,
        markAllNotificationsRead,
        toggleExerciseComplete,
        toggleMealComplete,
        updateCoachProfile,
        updateStudentProfile,
        addCoachCertification,
        deleteCoachCertification,
        submitIdentityVerification,
        reviewStudentVerification,
        sendCoachInquiry,
        respondToCoachInquiry,
        resetDemoData,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

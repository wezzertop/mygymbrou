import type { User } from "@supabase/supabase-js";

/**
 * Determines whether a Supabase Auth user was created via an admin invite
 * and has NOT yet configured their own password.
 */
export function needsPasswordSetup(user: User | null | undefined): boolean {
  if (!user) return true;

  const meta = (user.user_metadata || {}) as Record<string, unknown>;

  // Explicitly marked once the user sets or resets their password
  if (meta.password_set === true) {
    return false;
  }

  // Completed activation/signup flow where terms were accepted alongside password creation
  if (
    typeof meta.terms_accepted_at === "string" &&
    meta.terms_accepted_at.length > 0
  ) {
    return false;
  }

  // If the user already went through password recovery and signed in afterward
  if (user.recovery_sent_at && user.last_sign_in_at) {
    const recoveryMs = new Date(user.recovery_sent_at).getTime();
    const lastSignInMs = new Date(user.last_sign_in_at).getTime();
    if (!Number.isNaN(recoveryMs) && !Number.isNaN(lastSignInMs) && lastSignInMs >= recoveryMs) {
      return false;
    }
  }

  // Users created by admin.inviteUserByEmail have invited_at / invited_by_coach_id
  // and no password until they complete /auth/activate
  const wasInvited =
    Boolean(user.invited_at) ||
    Boolean(meta.invited_by_coach_id) ||
    meta.password_set === false;

  return wasInvited;
}

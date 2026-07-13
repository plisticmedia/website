// Keep this in step with the Supabase password policy (Authentication →
// Sign In / Providers → Password Requirements). Shown to users and checked
// client-side so they get instant feedback instead of a server rejection.
export const PASSWORD_HINT =
  "At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.";

export function passwordError(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Add an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Add a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Add a number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Add a symbol (like ! or #).";
  return null;
}

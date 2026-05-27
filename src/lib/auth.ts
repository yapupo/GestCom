export const ALLOWED_EMAIL_PASSWORD = "yapuup@gmail.com";
export const ALLOWED_GOOGLE_EMAIL = "leonardogracaaguiar@gmail.com";

export const ALLOWED_EMAILS = new Set<string>([
  ALLOWED_EMAIL_PASSWORD.toLowerCase(),
  ALLOWED_GOOGLE_EMAIL.toLowerCase(),
]);

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.has(email.toLowerCase());
}

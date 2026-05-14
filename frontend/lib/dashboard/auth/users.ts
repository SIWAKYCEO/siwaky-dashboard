/**
 * Internal dashboard login: single admin email + password from env (no bcrypt).
 * Server-only — do not import this module from Edge / middleware.
 */

export type DashboardUserRecord = {
  email: string;
  role?: string;
};

const ADMIN_EMAIL_FALLBACK = "siwaky.assistance@gmail.com";
const ADMIN_PASSWORD_FALLBACK = "Siwaky#0317";

function adminEmail(): string {
  return process.env.DASHBOARD_ADMIN_EMAIL?.trim() || ADMIN_EMAIL_FALLBACK;
}

function adminPassword(): string {
  return process.env.DASHBOARD_ADMIN_PASSWORD || ADMIN_PASSWORD_FALLBACK;
}

/** Keep export for any legacy callers; admin list is a single user. */
export function loadDashboardUsers(): DashboardUserRecord[] {
  return [{ email: adminEmail(), role: "admin" }];
}

export async function verifyDashboardCredentials(
  emailRaw: string,
  password: string,
): Promise<{ email: string; role: string } | null> {
  const expectedEmail = adminEmail().toLowerCase();
  const attemptEmail = emailRaw.trim().toLowerCase();
  if (attemptEmail !== expectedEmail) return null;
  if (password !== adminPassword()) return null;
  return { email: adminEmail().trim(), role: "admin" };
}

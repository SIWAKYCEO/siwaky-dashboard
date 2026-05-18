/** HttpOnly session cookie — verified in middleware + route handlers. */
export const DASHBOARD_SESSION_COOKIE = "siwaky_dashboard_session";

/** Default session lifetime (JWT exp + cookie Max-Age). */
export const DASHBOARD_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

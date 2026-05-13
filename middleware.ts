import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// Exclude extensioned static files AND Next.js metadata routes (/icon, /apple-icon from app/icon.png etc.)
export const config = {
  matcher: ["/((?!api|_next|_vercel|icon$|apple-icon$|.*\\..*).*)"],
};

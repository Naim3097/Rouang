/**
 * Environment detection.
 *
 * Production means the live site on its real domain. Everything else (local dev, `next start`
 * on a laptop, Vercel preview deployments) is treated as a preview: drafts are visible, a
 * preview bar is shown, and every page is `noindex` so nothing unfinished reaches search engines.
 *
 * On Vercel, VERCEL_ENV is set automatically. Elsewhere, set SITE_ENV=production explicitly.
 */
type SiteEnv = "production" | "preview" | "development";

function resolveSiteEnv(): SiteEnv {
  const value = process.env.VERCEL_ENV ?? process.env.SITE_ENV;
  if (value === "production" || value === "preview" || value === "development") return value;
  return process.env.NODE_ENV === "production" ? "preview" : "development";
}

export const SITE_ENV: SiteEnv = resolveSiteEnv();
export const IS_PRODUCTION = SITE_ENV === "production";

/** Drafts and layout placeholders are only ever rendered outside production. */
export const SHOW_DRAFTS = !IS_PRODUCTION;

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  return "http://localhost:3000";
}

/** Canonical origin. Preview deployments still point canonicals at production. */
export const SITE_URL = resolveSiteUrl();

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null;
export const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || null;
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;

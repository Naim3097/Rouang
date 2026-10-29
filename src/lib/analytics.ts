/**
 * Conversion events. GA4 only receives them after the visitor has allowed analytics; before
 * that (or with no GA4 property configured) calls are dropped, never queued.
 *
 * Mark these as key events in GA4: generate_lead, whatsapp_click, contact_click.
 */
export type AnalyticsEvent =
  | "generate_lead" // enquiry stored successfully (the only event that means a real lead)
  | "whatsapp_click"
  | "contact_click" // tel: or mailto:
  | "cta_click" // primary calls to action that lead to the enquiry page
  | "form_start"
  | "form_error";

type Gtag = (command: "event", name: string, params?: Record<string, unknown>) => void;

export const CONSENT_KEY = "rouang-analytics-consent";

export function hasAnalyticsConsent() {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function track(name: AnalyticsEvent, params: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (!gtag || !hasAnalyticsConsent()) return;
  gtag("event", name, params);
}

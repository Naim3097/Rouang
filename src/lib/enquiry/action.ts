"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { deliveryConfigured, hashIp, isRateLimited, notifyByEmail, storeEnquiry, verifyTurnstile } from "./deliver";
import { CONTACT_REQUIRED, enquirySchema, missingContact } from "./validate";

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
  firstName?: string;
  category?: string;
};

const FIELDS = ["name", "email", "phone", "category", "projectType", "location", "budget", "timeline", "message", "sourcePath", "utm"] as const;

const NOT_SENT =
  "Sorry, your message didn't go through. Please try again in a moment, or contact us directly using the details on this page.";

/**
 * Receives the enquiry form. It only reports success once the enquiry has been stored in the
 * database, or, if no database is configured, once the notification email has been accepted.
 */
export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  const fail = (message: string, fieldErrors?: EnquiryState["fieldErrors"]): EnquiryState => ({
    status: "error",
    message,
    fieldErrors,
    values,
  });

  // Spam traps. A person never sees the honeypot field; a form sent within 2.5 seconds of loading is a script.
  // When the page's script ran (js=1) it always stamps the time, so a missing or odd stamp is not a browser.
  if (String(formData.get("company_website") ?? "") !== "") return fail(NOT_SENT);
  const started = Number(formData.get("started_at") || 0);
  if (formData.get("js") === "1" && !(started > 0 && started < Date.now() + 60_000)) return fail(NOT_SENT);
  if (started > 0 && Date.now() - started < 2500) return fail("That was quick. Please check your details and send the form again.");

  const parsed = enquirySchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    if (missingContact(values)) {
      fieldErrors.email ??= CONTACT_REQUIRED;
      fieldErrors.phone ??= CONTACT_REQUIRED;
    }
    return fail("Please check the highlighted fields.", fieldErrors);
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const ipHash = hashIp(ip);

  // Checked before Turnstile, so a rate-limited request does not spend the visitor's one-use token.
  if (await isRateLimited(ipHash)) {
    return fail("We've received several messages from you in the last few minutes. Please wait a little before sending another.");
  }

  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? "") || null, ip))) {
    return fail("We couldn't confirm you're not a bot. Please try again.");
  }

  const configured = deliveryConfigured();
  if (!configured.database && !configured.email) {
    console.error("[enquiry] No delivery configured: set SUPABASE_URL and SUPABASE_SECRET_KEY, or RESEND_API_KEY.");
    return fail("Online enquiries aren't switched on yet. Please contact the studio directly for now.");
  }

  const enquiry = parsed.data;

  if (configured.database) {
    const result = await storeEnquiry(enquiry, { ipHash, userAgent: h.get("user-agent") });
    if (!result.stored) return fail(NOT_SENT);
    // Stored safely: the notification can go after the response is sent.
    after(() => notifyByEmail(enquiry, result.id));
  } else {
    const sent = await notifyByEmail(enquiry, null);
    if (!sent) return fail(NOT_SENT);
  }

  return { status: "success", firstName: enquiry.name.split(/\s+/)[0], category: enquiry.category };
}

import "server-only";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Enquiry } from "./validate";

/**
 * Where enquiries go. Supabase is the system of record; email is a notification.
 * Secrets stay on the server: this module can never be imported by client code.
 */

let client: SupabaseClient | null | undefined;

function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

export function deliveryConfigured() {
  return { database: !!supabase(), email: !!(process.env.RESEND_API_KEY && process.env.ENQUIRY_NOTIFY_TO && process.env.ENQUIRY_NOTIFY_FROM) };
}

/** IPs are never stored. A salted hash is kept only to rate-limit repeat submissions. */
export function hashIp(ip: string | null) {
  if (!ip) return null;
  const salt = process.env.ENQUIRY_IP_SALT ?? "rouang-default-salt-change-me";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

const WINDOW_MINUTES = 10;
const MAX_PER_WINDOW = 4;

export async function isRateLimited(ipHash: string | null) {
  const db = supabase();
  if (!db || !ipHash) return false;
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await db
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if (error) return false; // never block a genuine enquiry because the limiter failed
  return (count ?? 0) >= MAX_PER_WINDOW;
}

export async function storeEnquiry(e: Enquiry, meta: { ipHash: string | null; userAgent: string | null }) {
  const db = supabase();
  if (!db) return { stored: false as const, reason: "not-configured" as const };
  const { data, error } = await db
    .from("enquiries")
    .insert({
      name: e.name,
      email: e.email,
      phone: e.phone,
      category: e.category,
      project_type: e.projectType,
      location: e.location,
      budget: e.budget,
      timeline: e.timeline,
      message: e.message,
      source_path: e.sourcePath,
      utm: e.utm,
      ip_hash: meta.ipHash,
      user_agent: meta.userAgent?.slice(0, 300) ?? null,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[enquiry] insert failed", error.code, error.message);
    return { stored: false as const, reason: "error" as const };
  }
  return { stored: true as const, id: data.id as string };
}

export async function notifyByEmail(e: Enquiry, id: string | null) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_NOTIFY_TO;
  const from = process.env.ENQUIRY_NOTIFY_FROM;
  if (!key || !to || !from) return false;
  const lines = [
    `New enquiry${id ? ` (${id})` : ""}`,
    "",
    `Name: ${e.name}`,
    `Email: ${e.email ?? "-"}`,
    `Phone: ${e.phone ?? "-"}`,
    `For: ${e.category === "residential" ? "A home" : "A business"}`,
    `Type: ${e.projectType ?? "-"}`,
    `Location: ${e.location ?? "-"}`,
    `Budget: ${e.budget ?? "-"}`,
    `Timeline: ${e.timeline ?? "-"}`,
    "",
    e.message,
    "",
    `Sent from: ${e.sourcePath ?? "-"}${e.utm ? `\nCampaign: ${e.utm}` : ""}`,
  ];
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        subject: `Enquiry: ${e.name} · ${e.category === "residential" ? "Home" : "Business"}${e.projectType ? ` · ${e.projectType}` : ""}`,
        text: lines.join("\n"),
        ...(e.email ? { reply_to: e.email } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[enquiry] email failed", res.status);
    return res.ok;
  } catch (err) {
    console.error("[enquiry] email error", err);
    return false;
  }
}

export async function verifyTurnstile(token: string | null, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not enabled
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(6000),
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

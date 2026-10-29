#!/usr/bin/env node
/**
 * Launch readiness check.
 *
 *   npm run launch-check            report everything outstanding (never fails)
 *   npm run launch-check -- --strict  exit 1 if any blocker remains
 *
 * It also runs before every build (prebuild) in "gate" mode: strict on Vercel production
 * deployments, report-only everywhere else. Set LAUNCH_CHECK=warn to deploy production anyway
 * (for example a soft launch agreed with the studio). The point is that nothing unconfirmed
 * reaches the live site by accident.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const f of [".env.local", ".env"]) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) process.loadEnvFile(p);
}

const args = new Set(process.argv.slice(2));
const env = process.env.VERCEL_ENV ?? process.env.SITE_ENV ?? "development";
const strict = args.has("--strict") || (args.has("--gate") && env === "production" && process.env.LAUNCH_CHECK !== "warn");

const blockers = [];
const warnings = [];
const block = (area, msg) => blockers.push(`${area}: ${msg}`);
const warn = (area, msg) => warnings.push(`${area}: ${msg}`);

function read(dir) {
  const folder = path.join(root, "content", dir);
  return fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => ({ slug: f.replace(/\.md$/, ""), ...matter(fs.readFileSync(path.join(folder, f), "utf8")).data }));
}

const isPending = (img) => img && typeof img === "object" && "pending" in img;

// ——— Projects ———
for (const p of read("projects")) {
  const area = `Project "${p.title}"`;
  if (p.placeholder) {
    warn(area, "layout placeholder: delete it or replace it with a real project");
    continue;
  }
  if (p.status !== "published") {
    warn(area, "draft: will not appear on the live site");
    continue;
  }
  if (!p.photography?.permissionConfirmed) block(area, "permission to publish the photographs is not confirmed");
  if (isPending(p.hero) || !p.hero) block(area, "no hero photograph");
  const pending = (p.gallery ?? []).filter(isPending).length;
  if (pending) block(area, `${pending} gallery photograph(s) still to come`);
  const provisional = [p.hero, ...(p.gallery ?? [])].filter((g) => g && g.provisional).length;
  if (provisional) block(area, `${provisional} provisional image(s) with unconfirmed licence`);
  for (const f of p.facts ?? []) if (!f.verified) block(area, `unverified fact: ${f.label}: ${f.value}`);
  if (p.quote && !p.quote.approved) warn(area, "quote is not approved and will be hidden");
  for (const t of p.todo ?? []) block(area, `open item: ${t}`);
}

// ——— Services ———
for (const s of read("services")) {
  const area = `Service "${s.navLabel ?? s.title}"`;
  if (s.status !== "published") {
    warn(area, "draft: will not appear on the live site");
    continue;
  }
  for (const o of s.offers ?? []) if (!o.confirmed) block(area, `offer not confirmed: ${o.title}`);
  for (const f of s.faqs ?? []) if (!f.confirmed) warn(area, `question hidden until answered: ${f.q}`);
  for (const t of s.todo ?? []) block(area, `open item: ${t}`);
}

// ——— Articles ———
for (const a of read("insights")) {
  const area = `Article "${a.title}"`;
  if (a.status !== "published") {
    warn(area, "draft: will not appear on the live site");
    continue;
  }
  for (const t of a.todo ?? []) block(area, `open item: ${t}`);
}

// ——— Cross-checks across collections ———
const allProjects = read("projects");
const liveProjects = new Set(allProjects.filter((p) => p.status === "published" && !p.placeholder).map((p) => p.slug));
if (liveProjects.size === 0) block("Projects", "no project is published, so the portfolio, the home page hero and the Work section would be empty");
// Published pages must not link to case studies that are still drafts.
for (const dir of ["projects", "services", "insights"]) {
  const folder = path.join(root, "content", dir);
  for (const f of fs.readdirSync(folder).filter((x) => x.endsWith(".md"))) {
    const parsed = matter(fs.readFileSync(path.join(folder, f), "utf8"));
    if (parsed.data.status !== "published") continue;
    for (const m of parsed.content.matchAll(/\]\(\/projects\/([a-z0-9-]+)\)/g)) {
      if (!liveProjects.has(m[1])) block(`${dir}/${f}`, `links to the draft project /projects/${m[1]}`);
    }
    for (const rel of parsed.data.relatedProjects ?? []) {
      if (!liveProjects.has(rel)) warn(`${dir}/${f}`, `related project ${rel} is a draft and will not be shown`);
    }
  }
}

// ——— Studio facts and process (read from the config source) ———
const studioSrc = fs.readFileSync(path.join(root, "src/config/studio.ts"), "utf8");
for (const m of studioSrc.matchAll(/\{\s*name:\s*"([^"]+)",\s*confirmed:\s*false\s*\}/g)) block("Studio", `service area not confirmed: ${m[1]}`);
if (/address:\s*null/.test(studioSrc)) warn("Studio", "no studio address (needed for Google Business Profile and LocalBusiness data)");
if (/foundingYear:\s*null/.test(studioSrc)) warn("Studio", "founding year not set");
const processSrc = fs.readFileSync(path.join(root, "src/config/process.ts"), "utf8");
const unconfirmedSteps = [...processSrc.matchAll(/title:\s*"([^"]+)"[\s\S]*?confirmed:\s*false/g)].map((m) => m[1]);
if (unconfirmedSteps.length) block("Process", `steps not confirmed by the studio: ${unconfirmedSteps.join(", ")}`);

// ——— Environment ———
const need = (key, area, why) => !process.env[key] && block(area, `${key} is not set (${why})`);
const want = (key, area, why) => !process.env[key] && warn(area, `${key} is not set (${why})`);
need("NEXT_PUBLIC_SITE_URL", "Environment", "canonical URLs, sitemap and social cards");
need("STUDIO_LEGAL_NAME", "Environment", "footer and privacy notice need the registered company name");
need("NEXT_PUBLIC_CONTACT_EMAIL", "Environment", "privacy notice requires a contact for data requests");
const hasDb = process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const hasMail = process.env.RESEND_API_KEY && process.env.ENQUIRY_NOTIFY_TO && process.env.ENQUIRY_NOTIFY_FROM;
if (!hasDb && !hasMail) block("Enquiries", "neither Supabase nor email delivery is configured, so the form cannot accept enquiries");
if (hasDb) need("ENQUIRY_IP_SALT", "Enquiries", "rate limiting needs a private salt");
if (hasDb && !hasMail) warn("Enquiries", "no email notification: enquiries will only appear in Supabase");
want("NEXT_PUBLIC_WHATSAPP_NUMBER", "Contact", "WhatsApp buttons are hidden without it");
want("NEXT_PUBLIC_GA_MEASUREMENT_ID", "Analytics", "no conversion tracking");
want("GOOGLE_SITE_VERIFICATION", "Search Console", "verify the domain in Search Console (or use DNS verification)");
want("TURNSTILE_SECRET_KEY", "Enquiries", "spam protection is honeypot plus rate limit only");

// ——— Manual checks that code cannot verify ———
const manual = [
  "Privacy notice (English and Bahasa Malaysia) reviewed by the studio's legal adviser",
  "LAM registration confirmed before any page describes the studio or its people as \"Interior Designers\"",
  "Legal advice on the descriptor \"Interior design studio\" (src/config/studio.ts descriptor) given the studio's LAM status",
  "Studio approves the voice copy: About principles, service introductions, the hero and home page lines",
  "If the studio carries out renovation or fit-out itself: CIDB registration and grade confirmed",
  "Rembayung: owners' consent to publish the project; scope wording (interior design only) confirmed",
  "Google Business Profile created and verified with the same name, address and phone as the site",
];

const print = (title, list) => {
  if (!list.length) return;
  console.log(`\n${title} (${list.length})`);
  for (const l of list) console.log(`  - ${l}`);
};
console.log(`ROUANG launch check · environment: ${env}${strict ? " · strict" : ""}`);
print("Blockers", blockers);
print("Warnings", warnings);
print("Manual checks", manual);
console.log("");

if (strict && blockers.length) {
  console.error(`Launch check failed with ${blockers.length} blocker(s). Set LAUNCH_CHECK=warn to override deliberately.`);
  process.exit(1);
}

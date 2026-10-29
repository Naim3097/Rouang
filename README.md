# ROUANG website

The website for ROUANG, a design-led interior studio for homes and businesses in Malaysia.
Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4 and Supabase.

> Status: **preview**. Content is in place and drafts are visible on preview builds, but the
> studio still has to confirm a number of facts before launch. Run `npm run launch-check` to see
> what is outstanding, and read [docs/CONFIRMATIONS.md](docs/CONFIRMATIONS.md).

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional for local work
npm run dev                  # http://localhost:3000
```

Node 22 or newer. Without any environment variables the site runs fully, but the enquiry form will
politely refuse submissions (it never pretends to succeed) and WhatsApp buttons stay hidden.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build. Runs the launch check first (strict on Vercel production) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run launch-check` | List every blocker, warning and manual check before launch |

## How the site is organised

```
content/                 Editable content (Markdown + validated frontmatter)
  projects/*.md          Case studies. Images live in public/images/projects/<slug>/
  services/*.md          Service pages
  insights/*.md          Articles
src/config/
  studio.ts              Business facts. Unknown facts are null and are hidden on the site
  process-steps.json     The process steps (named after the brand-kit icons), read by process.ts
  enquiry.ts             Enquiry form options (budget brackets, project types)
  privacy.ts             Privacy notice text in English and Bahasa Malaysia
  media.ts               Provisional brand-kit imagery (dropped automatically in production)
src/lib/
  content/               Loader, Markdown renderer and zod schemas for /content
  enquiry/               Server action, validation and delivery (Supabase, Resend, Turnstile)
  env.ts                 Production vs preview detection
  seo.ts, schema.ts      Metadata and schema.org builders
src/components/          Brand, layout, home, projects, contact and UI components
scripts/launch-check.mjs Launch gate
scripts/media/           Image curation list and export pipeline
supabase/migrations/     Database schema for enquiries
docs/                    Spec, keyword map, visual direction, confirmations, research, QA report
```

### Drafts, placeholders and the production gate

Every project, service and article has `status: draft | published`.

- **Preview builds** (local, `next start`, Vercel previews) show drafts, with a small preview bar
  linking to `/preview`, a live checklist of everything still owed. Every page is `noindex`, and
  `robots.txt` disallows crawling.
- **Production** (`VERCEL_ENV=production`, or `SITE_ENV=production` elsewhere) hides drafts, pending
  photographs, provisional brand-kit images, and any service offer, FAQ answer, process step or
  service area the studio has not confirmed, and becomes indexable. Sections with nothing confirmed
  are left out rather than shown empty.
- `npm run build` runs `scripts/launch-check.mjs --gate` first, reading the same env files as
  `next build` (`.env.production.local`, `.env.local`, `.env.production`, `.env`). For a production
  build it **fails the build** while blockers remain: unconfirmed services or process steps, missing
  photographs or permissions, unverified facts, missing studio details or enquiry delivery, or a
  half-configured Turnstile. Set `LAUNCH_CHECK=warn` to override deliberately, for example for an
  agreed soft launch. The production pages stay safe either way, because they never render
  unconfirmed material; the gate stops a launch that would look empty or incomplete.

### Editing content

Content files are Markdown with YAML frontmatter, validated by `src/lib/content/schema.ts` at build
time. An invalid field fails the build with the file name and field, so mistakes cannot ship. Edit
the files in GitHub's web editor or locally; a commit to `main` redeploys on Vercel.

- Put values containing `: ` in quotes.
- `todo:` lists are shown on `/preview` and block launch for published items. Empty the list when done.
- Facts in `facts:` need `verified: true` and a `source:` before a published project can launch.
- Projects marked `visualisation: true` are always labelled as design visualisations.

### Adding project photographs

1. Put the originals in a folder per project, e.g. `raw/rembayung/IMG_1234.heic`.
2. Add each chosen image to `scripts/media/curation.json` with its output name, alt text, span and role.
3. Run `node scripts/media/export.cjs <raw-folder>`. It converts HEIC (requires `ffmpeg` on the
   PATH), applies the ROUANG grade, resizes to at most 2400 px and **strips all metadata, including
   GPS**. Output goes to `public/images/projects/<slug>/` and `scripts/media/media-manifest.json`.
4. Reference the images in the project's frontmatter (`hero`, `card`, `gallery`).
5. For a portrait photograph that opens a page full screen, add `"wide": { "aspect": [3, 2], "focusY": 0.28 }`
   to its curation entry. The export also writes `<name>-wide.jpg`, a landscape crop around that line,
   which large screens load instead of the portrait. Add it to the image as `wide: { src, width, height }`.
   `--only <project>` re-exports a single project.

## Environment variables

See [.env.example](.env.example) for the full list with notes. In Vercel, set them per environment.

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, social cards (production) |
| `STUDIO_LEGAL_NAME`, `STUDIO_REGISTRATION_NO` | Footer and privacy notice |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | Contact links and WhatsApp buttons |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ENQUIRY_IP_SALT` | Storing enquiries (server only) |
| `RESEND_API_KEY`, `ENQUIRY_NOTIFY_TO`, `ENQUIRY_NOTIFY_FROM` | Email notification of new enquiries |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile spam check. Set both or neither. Required when enquiries go by email only (no Supabase rate limit) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 (production only, after consent) |
| `GOOGLE_SITE_VERIFICATION` | Search Console HTML-tag verification |

Secrets are only read in server code (`server-only` modules). Nothing secret is prefixed `NEXT_PUBLIC_`.

## Enquiries (Supabase)

1. Create a Supabase project and run `supabase/migrations/20261029000000_enquiries.sql` (SQL editor or
   `supabase db push`). Row Level Security is on with **no** policies, so the public keys cannot read
   or write the table; only the server, using the secret key, can insert.
2. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and a long random `ENQUIRY_IP_SALT` in Vercel.
3. Optional: set the Resend variables to get an email for each enquiry. If Supabase is not configured,
   email alone is used, and the form only reports success once the email provider accepts it.
4. The studio updates each enquiry's `status` (new, contacted, qualified, proposal, won, lost, spam)
   in the Supabase dashboard, so marketing can be judged on real outcomes, not clicks.

The form validates on the server, blocks a honeypot field and sub-2.5-second submissions, and limits
each (hashed) IP to four enquiries per ten minutes. It works without JavaScript.

## Analytics and conversion tracking

GA4 loads only in production, only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, and only after the
visitor allows it (advertising features off). Events sent: `generate_lead` (enquiry stored),
`whatsapp_click`, `contact_click` (phone or email), `cta_click`, `form_start`, `form_error`. Mark
`generate_lead`, `whatsapp_click` and `contact_click` as key events in GA4.

## Deployment (GitHub + Vercel)

1. Push this repository to GitHub (not done yet: no remote is configured).
2. Import it in Vercel. The framework preset is detected; no build settings need changing.
3. Set environment variables for **Production** and **Preview** separately. Leave Production
   unconfigured until launch if you want the gate to keep it closed.
4. Every pull request gets a preview deployment: drafts visible, `noindex`, preview bar on.
5. Point the domain at Vercel, set `NEXT_PUBLIC_SITE_URL`, verify the domain in Google Search Console
   and submit `/sitemap.xml`.

## Brand assets

The wordmark, mark and icons in `src/components/brand/paths.ts` and `public/brand/` were extracted as
vectors from the brand kit PDF (no master SVGs were supplied). Replace them with the studio's master
files (`ROUANG_wordmark_ink.svg` and so on) when available. Never redraw or retype the wordmark.
See [docs/VISUAL-DIRECTION.md](docs/VISUAL-DIRECTION.md).

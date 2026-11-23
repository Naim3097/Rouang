# What the company needs to confirm or supply

`npm run launch-check` and the `/preview` page on any preview build show the live version of this
list. This document groups it for a conversation with ROUANG. Items marked **(blocker)** stop a
production build until they are resolved.

## Confirmed by the company profile (November 2026)

ROUANG's company profile ("ROUANG for Marketing & Branding", 9 pages) is the company's own,
current description of the business. It settled the following, which the site now uses:

- **Positioning.** ROUANG is "a design-led construction company" integrating design thinking,
  functionality, planning, project management and construction delivery, from renovation and
  interior enhancement to new-build projects. Line: "Spaces Designed with Purpose. Delivered with
  Precision." Vision and mission (pp.2–3). `src/config/studio.ts` (`descriptor`, `line`,
  `positioning`) and the About page.
- **Scope.** Design and build is offered: the `renovationAndBuild` and `projectManagement`
  capabilities are on, and the Construction step shows in the process. Architecture is not offered
  as a service. Rembayung is still described as interior design only (see Projects).
- **Services.** Three capabilities (p.4): Design & Build, Renovation & Interior, New Build &
  Construction. They replace the residential, restaurant and commercial interior design pages,
  which redirect permanently to `/services/renovation-and-interior` (`next.config.ts`).
- **Process.** Six steps (p.5): Initial Discussion, Paid Design Engagement, Design Development,
  Project Proposal & Quotation, Construction, Handover. The one-line description of each step was
  written by the agency from the profile's overall description: please check the wording.
- **Business details** (p.9). Registered name ROUANG GLOBAL; SSM SA0626323-U; CIDB
  0120250108-SL148929; email hi.rouang@gmail.com; phone +6012-347 7170; office No. 52-1, Jalan
  Aman Sinaria 4, Bandar Tropicana, 42500 Telok Panglima Garang, Selangor; Instagram
  rouang_official; Facebook "Rouang". These are now the defaults in `src/config/studio.ts`
  (environment variables can still override them).
- **People** (pp.6–8). Co-founders Zhafiri Zainol and Shaidee Hafizi Khalid, with condensed
  biographies, and the team: Husna (Head of Design; the profile says "Head of Designer"), Qaesya
  (Designer), Arif Safuan (Head of Operation), Nurul Syazana (Project Executive), Najihah (Quantity
  Surveyor), Ainul Shahira (HR & Finance). `src/config/people.ts`.

## 1. Scope and positioning

- **LAM registration.** "Interior Designer" is a protected title under the Architects Act 1967
  (s.27A). The site does not use it. If the company or its people are LAM-registered, give the
  registration numbers so they can be shown, and the copy can say "interior designers".
- **CIDB grade.** The registration number is on the site; the grade is not stated and the site
  makes no claim about it.
- **Wording to approve.** The service pages, the process step lines, the founders' biographies and
  the About page are condensed from the profile. Shaidee's track record figures (design fees in
  2023, combined project value) were left out of his biography because they belong to his earlier
  business; add them back if the company wants them published.
- **Service questions.** Each service page has questions awaiting the company's own answers (fees,
  design-only engagements, single rooms, building to another architect's drawings). They are hidden
  on the live site until answered.
- **Projects for Design & Build and New Build & Construction.** No published project is tagged with
  either capability yet, so those pages show no work. Say which projects were delivered as design
  and build or as new builds.
- **Service areas**: Kuala Lumpur and Selangor are assumed; the profile does not list service
  areas (blocker until confirmed).
- **Single rooms**: whether the company takes on one room or area, not only whole homes. The
  enquiry form still offers "One room or area" as a type of space.
- **Budget brackets** in the enquiry form (`src/config/enquiry.ts`): keep, change or remove.

## 2. Business details

- **WhatsApp.** The profile gives a phone number but does not say it takes WhatsApp, so WhatsApp
  buttons stay hidden. Confirm the number to use (warning).
- **Opening hours** for Google Business Profile and LocalBusiness data (warning).
- **Website domain.** `rouang.com.my` is registered to "ROUANG GLOBAL" in Selangor, the registered
  name in the profile. Confirm it is the domain to launch on.
- **Social links.** The profile names Instagram (rouang_official) and Facebook ("Rouang") without
  addresses. Confirm the TikTok account (`@rouang_official`), which is linked although the profile
  does not name it, and the Facebook page address the site uses
  (`facebook.com/profile.php?id=61571364632150`); LinkedIn, if any.
- **Founding year** and **portraits**. No portraits were supplied, so the team is listed as text.
  The Ampang shoot includes a team photo (MR5_8678.jpg) that could be used with everyone's consent.
- **Team consent.** Everyone named on the About page should be happy to be named.

## 3. Projects

**Rembayung**
- Owners' consent to name, photograph and publish the project. (blocker)
- Permission and credit for the photographs (iPhone, October 2025 to January 2026). (blocker)
- The studio's account of the brief, the design idea, the plan, and two or three constraints with
  the response. These are the most valuable words on the site.
- Confirm the "Inside" description, and which elements were ROUANG's design and which the building's.
- Year and floor area, if publishable.
- Footage of the open restaurant, if any exists: 58 of the 59 clips on Drive were filmed during
  fit-out and cannot be used. A few slow, steady shots of the finished rooms (lights on, no people)
  would give Rembayung an opening film like Ampang's.

**Ampang (Beverly Heights)**
- Project name to publish, owners' consent, photographer's name and permission. (blocker)
- Videographer's name and permission to use clips from the film `ROUANG_1.mp4` on the website: the
  case study now opens with one and shows three more. (blocker)
- Full-size photographs over 10 MB (the wide room shots and HDR frames): download from Drive into
  `ROUANG/drive-large/` if more choice is wanted.
- The brief, concept and main design decisions.

**Seri Wirani, Bangi** and **Kota Warisan, Sepang** (design proposals)
- Owners' consent to publish, without names. Spelling of Seri or Sri Wirani.
- Confirm the concept and constraint notes paraphrased from the decks.
- Full-size renders (most are over the connector limit).

**Warung Soho**
- What it is, where, whether it was built, ROUANG's role, and full-resolution renders.

## 4. Articles (drafts)

- Restaurant decisions: review, and add one or two examples from ROUANG's own work.
- What shapes cost: add how ROUANG charges; confirm whether to publish typical ranges.
- How to choose a designer: publish only once ROUANG's own LAM and CIDB position holds up to the advice.

## 5. Legal and accounts

- Privacy notice (English and Bahasa Malaysia) reviewed by the studio's adviser. Data retention period (two years is drafted).
- Supabase project, Resend account and verified sending domain, GA4 property, Search Console,
  Cloudflare Turnstile (both keys, or neither; required if enquiries go by email without Supabase),
  Vercel project and GitHub repository. Credentials are entered in
  Vercel, never in the code.

## 6. Brand assets

- Master SVG files named in the kit (`ROUANG_wordmark_ink.svg`, `ROUANG_wordmark_kapur.svg`,
  `ROUANG_mark_ink.svg`, `ROUANG_seal_kunyit.svg`) and the tagline lockup. The site uses vectors
  extracted from the PDF until then.
- Licence status of the atmosphere images in the brand kit (the concrete facade, the horizon wall).
  They are used in previews only and are removed automatically in production.

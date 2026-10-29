# What the studio needs to confirm or supply

`npm run launch-check` and the `/preview` page on any preview build show the live version of this
list. This document groups it for a conversation with the studio. Items marked **(blocker)** stop a
production build until they are resolved.

## 1. Scope and positioning (decide first, it changes the copy)

- **Design only, or design and build?** Both design decks sign off "ROUANG — Design-led
  Construction Firm", and the Rembayung photos show ROUANG-branded crew assembling furniture and
  finishing timber screens on site. The agency brief says Rembayung was interior design only. The
  site currently says interior design only everywhere. Once confirmed, the "Build" process step and
  renovation wording can be switched on in `src/config/studio.ts` (`capabilities`). (blocker)
- **LAM registration.** "Interior Designer" is a protected title under the Architects Act 1967
  (s.27A). The site does not use it. If the studio or its principals are LAM-registered, give the
  registration numbers so they can be shown, and the copy can say "interior designers".
- **CIDB registration** and grade, if the studio carries out renovation or fit-out itself.
- **Service list**: confirm each "What we do" item on the residential and restaurant pages (blocker),
  and whether office and retail work is offered (the page is a draft). Until an item is confirmed it
  does not appear on the live site at all.
- **Service areas**: Kuala Lumpur and Selangor are assumed (blocker until confirmed).
- **Process**: confirm the Listen, Plan, Design and Live in steps describe how the studio works (blocker).
  Unconfirmed steps are hidden on the live site, so the process sections stay empty until then.
- **Single rooms**: whether the studio takes on one room or area, not only whole homes. The site no
  longer says so; the enquiry form still offers "One room or area" as a type of space.
- **Budget brackets** in the enquiry form (`src/config/enquiry.ts`): keep, change or remove.

## 2. Business details (all blockers for launch unless noted)

- Registered company name and SSM number (footer, privacy notice).
- Contact email for enquiries and data requests; phone; WhatsApp number.
- Studio address and opening hours (needed for Google Business Profile and LocalBusiness data; warning).
- Website domain (`rouang.com.my` is registered to "ROUANG GLOBAL" in Selangor; is that the studio's?).
- Instagram, Facebook, TikTok, LinkedIn links, if any.
- Founding year, team names and roles, portraits. The Ampang shoot includes a team photo
  (MR5_8678.jpg) that could be used with everyone's consent.

## 3. Projects

**Rembayung**
- Owners' consent to name, photograph and publish the project. (blocker)
- Permission and credit for the photographs (iPhone, October 2025 to January 2026). (blocker)
- The studio's account of the brief, the design idea, the plan, and two or three constraints with
  the response. These are the most valuable words on the site.
- Confirm the "Inside" description, and which elements were ROUANG's design and which the building's.
- Year and floor area, if publishable.

**Ampang (Beverly Heights)**
- Project name to publish, owners' consent, photographer's name and permission. (blocker)
- Full-size photographs over 10 MB (the wide room shots and HDR frames) and the edited film
  `ROUANG_1.mp4`: download from Drive into `ROUANG/drive-large/`.
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

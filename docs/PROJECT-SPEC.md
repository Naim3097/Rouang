# ROUANG website: project specification

Version 1, 29 October 2026. Prepared by Nexova Digital.

## 1. Positioning

ROUANG is a design-led construction company for homes and businesses (company profile, November
2026): design thinking, functionality, planning, project management and construction delivery,
from renovation and interior enhancement to new-build projects. Its line is *Spaces Designed with
Purpose. Delivered with Precision.* (Version 1 of this spec called it a design-led interior studio,
from the brief; the profile supersedes that.) The brand kit supplies the voice: the name comes from the Malay *ruang* (space)
with an added O for openness, originality and opportunity; the tagline is *Ruang tanpa batas*; the
studio's own line is *Anda cerita macam mana nak duduk. Kami terjemah jadi ruang.* The site's hero
headline is the company's line, set in sentence case like every headline: "Spaces designed with
purpose. Delivered with precision." (Version 1 used the English rendering of the kit's line, "Tell
us how you want to live. We'll translate it into space.")

The site stays clear of luxury-only language because the studio works across budgets.

## 2. Audiences

| Audience | What they need from the site | Where they land |
| --- | --- | --- |
| Homeowners (existing homes and new builds) | Proof of built homes, a sense of process and budget fit, an easy first step | Home, Renovation & Interior, New Build & Construction, Ampang, insights on cost and choosing a designer |
| Restaurant and F&B operators | Proof of a real restaurant, understanding of operations, credibility | Home, Renovation & Interior, Rembayung, restaurant article |
| Other commercial clients | The profile names "selected commercial projects" | Design & Build, New Build & Construction |

## 3. What is confirmed and what is not

| Fact | Status | Source |
| --- | --- | --- |
| ROUANG did the interior design of Rembayung, interior design only | Confirmed by brief | Agency brief |
| Rembayung: Lot 2791 Jalan Daud, Kampung Baru, KL; opened 6 January 2026 | Verified publicly | docs/research |
| Residential work | Confirmed by brief and by the Ampang shoot | Brief, Drive |
| Ampang house is a finished ROUANG project | Indicated (professional shoot in ROUANG's Drive) | Drive |
| Seri Wirani (Bangi) and Kota Warisan (Sepang) are design proposals, September 2026 | Confirmed by the decks | Design presentations |
| Warung Soho | Renders only; nature, location and status unknown | Drive |
| ROUANG is a design-led construction company: Design & Build, Renovation & Interior, New Build & Construction | Confirmed | Company profile, November 2026 |
| ROUANG crew assembled furniture and finished timber on site at Rembayung | Visible in photos; Rembayung stays interior design only | Drive photos, agency brief |
| Six-step process, legal name (ROUANG GLOBAL), SSM and CIDB numbers, email, phone, office, founders and team | Confirmed | Company profile, November 2026 |
| Fees, service areas, opening hours, WhatsApp number, founding year | Not supplied | |

See docs/CONFIRMATIONS.md for the full list.

## 4. Sitemap

```
/                         Home
/projects                 All projects (filter: homes / commercial)
/projects/<slug>          Case studies: rembayung, ampang, seri-wirani-bangi, kota-warisan-sepang, warung-soho
/services                 The three capabilities, and who they serve
/services/design-and-build
/services/renovation-and-interior         (the old interior design pages redirect here)
/services/new-build-and-construction
/about                    About (approach, vision and mission, capabilities, process, founders, team, name, mark)
/insights                 Articles
/insights/<slug>          3 drafts awaiting studio review
/contact                  Project enquiry
/privacy                  PDPA notice in English and Bahasa Malaysia
/preview                  Preview-only checklist (404 in production)
```

No city doorway pages: the research found that templated location pages are common and weak.
Location pages should be added only with real local case studies behind them.

## 5. Visual direction

See docs/VISUAL-DIRECTION.md. In short: the drawing sheet (hairline guides, registration crosses,
title-block facts), the aperture (the circle of the mark as a window onto the work), the curve lifted
from the mark as a rule, and the title pair in Outfit Regular and Light, on a light type scale of ten
levels (see "Type, as built"). Real photography leads;
renders are always labelled.

## 6. Technology

Next.js 16 with Cache Components and `ensureStatic = "navigation"` on every content route, so every
page is fully prerendered. Content in Markdown, validated with zod. Supabase for enquiries only
(RLS on, no public policies). Vercel hosting. GA4 behind consent. No CMS: the content model is
structured, and the README documents editing. A headless CMS (for example Keystatic, which keeps
the same files) can be added later without changing page templates.

## 7. Lead generation

Primary action: the enquiry form (short by default: name, a way to reply, home or business, a few
lines). Secondary: WhatsApp (when the number is supplied), email and phone. Persistent "Discuss your
project" in the header on desktop and a floating action on phones. Contextual CTAs on case studies
and services preselect home or business. Leads are stored with source page and campaign tags, and
the studio can mark lead quality in Supabase.

## 8. Launch criteria

Launch when `VERCEL_ENV=production npm run launch-check -- --strict` passes and the manual checks
it prints are signed off (legal review of the privacy notice, LAM/CIDB wording, Rembayung consent,
Google Business Profile). Core Web Vitals targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, measured
from field data after launch.

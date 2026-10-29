# ROUANG website: project specification

Version 1, 29 October 2026. Prepared by Nexova Digital.

## 1. Positioning

ROUANG is a design-led interior studio for homes and businesses. The working line, from the brief:
*considered spaces for homes and businesses, balancing aesthetics, functionality and the realities
of each project.* The brand kit supplies the voice: the name comes from the Malay *ruang* (space)
with an added O for openness, originality and opportunity; the tagline is *Ruang tanpa batas*; the
studio's own line is *Anda cerita macam mana nak duduk. Kami terjemah jadi ruang.* The site's hero
headline is its English rendering: "Tell us how you want to live. We'll translate it into space."

The site stays clear of luxury-only language because the studio works across budgets.

## 2. Audiences

| Audience | What they need from the site | Where they land |
| --- | --- | --- |
| Homeowners (condo and landed) | Proof of built homes, a sense of process and budget fit, an easy first step | Home, residential service, Ampang, insights on cost and choosing a designer |
| Restaurant and F&B operators | Proof of a real restaurant, understanding of operations, credibility | Home, restaurant service, Rembayung, restaurant article |
| Other commercial (office, retail) | Unconfirmed; the page exists as a draft | Draft service page only |

## 3. What is confirmed and what is not

| Fact | Status | Source |
| --- | --- | --- |
| ROUANG did the interior design of Rembayung, interior design only | Confirmed by brief | Agency brief |
| Rembayung: Lot 2791 Jalan Daud, Kampung Baru, KL; opened 6 January 2026 | Verified publicly | docs/research |
| Residential work | Confirmed by brief and by the Ampang shoot | Brief, Drive |
| Ampang house is a finished ROUANG project | Indicated (professional shoot in ROUANG's Drive) | Drive |
| Seri Wirani (Bangi) and Kota Warisan (Sepang) are design proposals, September 2026 | Confirmed by the decks | Design presentations |
| Warung Soho | Renders only; nature, location and status unknown | Drive |
| ROUANG calls itself a "Design-led Construction Firm" | Stated in both decks, conflicts with the brief's caution | Design presentations |
| ROUANG crew assembled furniture and finished timber on site at Rembayung | Visible in photos; scope unconfirmed | Drive photos |
| Full service list, fees, contact details, address, legal name, team | Not supplied | |

See docs/CONFIRMATIONS.md for the full list.

## 4. Sitemap

```
/                         Home
/projects                 All projects (filter: homes / commercial)
/projects/<slug>          Case studies: rembayung, ampang, seri-wirani-bangi, kota-warisan-sepang, warung-soho
/services                 Overview by audience
/services/residential-interior-design
/services/restaurant-interior-design
/services/commercial-interior-design      (draft until confirmed)
/about                    Studio (name, mark, principles, process)
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
from the mark as a rule, and the Outfit / EB Garamond italic title pair. Real photography leads;
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

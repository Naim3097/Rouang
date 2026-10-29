# SEO: keyword map and search strategy

Based on the SERP research in docs/research/discovery-research.md (Google Malaysia, Klang Valley
location, 28 October 2026). **No search volumes or difficulty scores were available from a reliable
source, so none are given here.** Validate with Google Search Console data after launch and, if the
studio wants paid data, a keyword tool before investing in new pages.

## What the research found

- Every commercial query shows a **map pack above the organic results**. A complete, verified Google
  Business Profile matters as much as any page. This needs the studio's real address.
- Studio homepages and project pages rank for "interior designer KL" and for F&B queries. Detailed
  case studies are the gap competitors leave open: most F&B pages are galleries.
- Cost questions dominate People Also Ask. Studios rarely answer them; AI Overviews cite third-party
  cost guides. A cost page from a real studio fills that gap, **once the studio confirms how it charges**.
- Location pages from competitors are templated, so a genuinely local page, built on real local
  projects, has less competition than it seems. Do not create them without projects behind them.
- Design-and-build and CIDB grades are common trust signals in titles. Only use them if true for ROUANG.
- "Interior designer" is a protected title (Architects Act s.27A). Targeting "interior designer KL"
  in titles or copy is only safe once the studio's LAM registration is confirmed. Until then the site
  targets "interior design" phrasing.

## One primary page per intent

| Intent cluster | Primary page | Title pattern (current) | Notes |
| --- | --- | --- | --- |
| Brand + "interior design studio KL" | `/` | ROUANG · Interior design studio in Kuala Lumpur | Home carries Rembayung proof and both audiences |
| "residential interior design KL / Selangor", "condo interior design KL" | `/services/residential-interior-design` | Residential interior design in Kuala Lumpur and Selangor | Later: split into condo and landed child pages when there are 2+ projects each |
| "restaurant interior design KL", "cafe interior design Malaysia" | `/services/restaurant-interior-design` | Restaurant interior design in Kuala Lumpur | Strongest page: real flagship project. Add cost guidance and approvals notes when the studio supplies them |
| "commercial / office / retail interior design" | `/services/commercial-interior-design` | (draft) | Publish only if the studio takes this work and has a project to show |
| "Rembayung interior", "Rembayung Kampung Baru" | `/projects/rembayung` | Rembayung, Kampung Baru: restaurant interior design | Brand-adjacent searches from Rembayung's own popularity |
| Residential proof | `/projects/ampang` and the two proposals | Per project | Name projects by area once owners agree (e.g. "House in Ampang") |
| "interior design cost Malaysia" | `/insights/what-shapes-interior-design-cost` | What shapes the cost of an interior design project | Draft: needs the studio's own fee model before publishing |
| "how to choose an interior designer Malaysia" | `/insights/how-to-choose-an-interior-designer-malaysia` | How to choose an interior designer in Malaysia | Draft: publish only once ROUANG's own LAM and CIDB position is confirmed |
| "restaurant interior design considerations" | `/insights/restaurant-interior-design-decisions` | Restaurant interior design: seven decisions… | Draft: studio to add its own examples |

Each page has a unique title and description (`src/lib/seo.ts`), one H1, a canonical URL, breadcrumbs
with BreadcrumbList data, and Open Graph images generated in the brand style.

## Next content to commission (in priority order)

1. **Rembayung case study in the studio's words**: brief, constraints, decisions. The single most
   valuable page on the site for both F&B search and credibility.
2. **Fees and scope** page or section: design-only vs design-and-build, what each includes, how the
   studio charges. Answers the dominant PAA questions. Requires the studio's real model.
3. **Ampang case study** with the brief and the owners' consent.
4. **Designing for the tropics**: materials that cope with humidity, termites, glare and wet cooking,
   using the studio's own projects. An open gap in Malaysian search results.
5. A **condominium** page once there are condo projects to show, covering strata approvals and
   working hours.

## Local SEO checklist (needs the studio)

- Google Business Profile: exact legal name, address, phone, hours, categories (Interior designer,
  only if LAM-registered; otherwise "Interior design" services under a suitable category), photos
  from the curated set, service list matching the site.
- Same name, address and phone on the site footer, contact page, schema and directories.
- Ask past clients for Google reviews. The site will not show ratings in schema unless they are real.

## Structured data in place

Organization (LocalBusiness added automatically once an address is set), WebSite, Service on each
service page, BlogPosting on articles, BreadcrumbList everywhere. No ratings, reviews or awards are
emitted. Validate with the Rich Results Test after launch.

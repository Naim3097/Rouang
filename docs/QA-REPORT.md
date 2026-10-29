# QA report

29 October 2026. Covers the site as of the "QA round 2" commit. Nothing has been deployed: every
result below comes from local preview and production-mode builds.

## How it was reviewed

1. **An independent review in six areas**: claims and accuracy, SEO, accessibility, code and
   security, performance, and visual design. A second reviewer then tried to disprove each finding
   before it was accepted. 64 findings were confirmed (claims 15, accessibility 11, SEO 7, code 10,
   performance 12, visual 9). One verification timed out. It concerned the mobile walkthrough width,
   which had already been fixed and is re-checked below.
2. **Round 1** (commit `1af5309`) fixed the claims, SEO and visual findings, and the production build.
3. **Round 2** (this commit) fixed the code, performance and accessibility findings, plus the claims
   items left over from round 1.
4. **Re-tests** were run against the dev server, a preview build and a production-mode build.

## Tests run after the fixes

| Check | Result |
| --- | --- |
| `tsc --noEmit` | Clean |
| `npm run lint` | 0 errors, 0 warnings (was 9 errors) |
| Content against the strict schemas | 11 of 11 files pass. Unknown keys and impossible dates (2026-02-31) are rejected |
| Markdown rendering | `javascript:`, `data:` and `//host` links keep only their text. Raw HTML is escaped. Titles and `&` are escaped |
| `next build`, preview and production mode | Both pass (26 static pages) |
| Launch gate | A production build fails with 24 blockers. `LAUNCH_CHECK=warn` lets it through. `.env.production` is now read |
| Browser checks, dev server and preview build (headless Chrome) | 30 of 30 pass on each (list below) |
| Production-mode checks | 34 of 34 pass (list below) |
| Turnstile, with Cloudflare's published test keys | Pass (details below) |

**Browser checks (30)**
- **Hero:** desktop loads the landscape crop and phones keep the portrait. It loads eagerly at high
  priority. Hero links that have faded out leave the tab order.
- **Header:** dark over the hero, light over light sections.
- **Navigation:** a client-side navigation opens the new page at the top with the header showing.
  Index numerals are at full contrast.
- **Mobile menu:** locks page scroll and reports `aria-expanded`. The floating contact bar is a
  landmark.
- **Walkthrough:**
  - The server HTML already has the final layout, so hydration moves nothing.
  - Reduced motion and no-JavaScript visitors get the photographs in sequence.
  - Screen readers get every frame and caption as a list.
  - No frame loads eagerly.
- **Contact form:**
  - `?project=commercial` preselects "A business" and narrows the types.
  - The type list works without JavaScript.
  - Timing fields are stamped after mount.
  - An empty submit shows a linked error summary, on screen and focused, and flags email and phone
    on the first attempt. A summary link moves focus to its field.
- **/projects:** the first plate loads eagerly at high priority, and each plate requests its own
  width. The sector filter announces its count.
- **Case study:** breadcrumbs over the photograph are solid Milky White, the h1 starts with the
  project name, and the desktop hero uses the landscape crop.
- **Footer and About:** no dead "Analytics settings" button without GA. "Ruang" is marked as Malay.
  The principles italic passes contrast.

**Production-mode checks (34)**
- **Hidden content:**
  - No Rembayung, Khairul Aming, placeholder, draft tag or brand-kit image on any public page.
  - No unconfirmed process steps, service offers or "single rooms" claim.
  - All drafts and `/preview` return 404.
- **Search and metadata:**
  - The empty /projects listing is noindex, and the sitemap lists only live pages.
  - robots.txt allows crawling except /preview, there is no noindex header, and canonicals use the
    configured domain.
  - Every page has a share image, a title of 60 characters or fewer, and a description of 160
    characters or fewer.

**Turnstile (test keys, dev server)**
- The script is not loaded at the top of the home page. It loads as the form comes near.
- The widget renders and issues a token after a client-side navigation to /contact. This was the
  high-severity bug: before the fix, every enquiry after such a navigation was rejected.
- A valid submission passes server-side verification and stops at "Online enquiries aren't switched
  on yet", as expected with no delivery configured.
- The reset after a failed send cannot be confirmed by value with the test keys, which always return
  the same token.

**Lighthouse** (mobile unless noted; simulated slow 4G and 4× CPU)

| Page (build) | Perf | A11y | Best practices | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| / (production) | 100 | 100 | 100 | 100 | 0.9 s | 0 |
| /services/restaurant-interior-design (production) | 100 | 100 | 100 | 100 | 0.8 s | 0 |
| / (preview, with the Rembayung hero) | 92–95 | 100 | 100 | 69* | 2.9–3.4 s | 0 |
| /projects (preview) | 100 | 100 | 100 | 69* | 0.8 s | 0 |
| /projects/rembayung (preview) | 100 | 100 | 100 | 69* | 0.9 s | 0 |
| / desktop (preview) | 100 | 100 | 100 | 69* | 0.7 s | 0 |

\* Preview builds are deliberately noindex, which is what costs the SEO score. Production scores 100.

## What changed in round 2

**Claims**
- Unconfirmed service offers and process steps no longer render in production. Sections with
  nothing confirmed are left out. The production pages no longer depend on the launch gate to stay
  accurate.
- "Awaiting studio" notes render nothing in production, wherever they are used.
- "Single rooms" is removed from the services page until the studio confirms it.
- The launch check now lists "no AI-generated interior shown as a completed space" as a manual check.

**Accessibility**
- **Navigation:** client-side navigation now lands at the top of the page (Next 16's
  `data-scroll-behavior`).
- **Enquiry panel contrast:** the panel now runs from an even mix of the kit's two Rikyū stops to the
  deep end, with solid Milky White text (5.1:1 to 8.7:1). Before, kapur on Rikyū Grey measured 3:1.
  Form lines, labels, hints, placeholders and focus rings all clear their minimums.
- **Hero links:** faded-out links leave the tab order, and a focused link is always shown.
- **Over photographs:** breadcrumbs and the facts line are solid Milky White on a deeper scrim.
- **Index numerals:** no longer faded to 2.3:1.
- **Walkthrough:** every frame and caption is available to screen readers as a list. No more
  live-region chatter. Inactive labels pass contrast.
- **Form errors:** come back all at once, in a linked summary that is scrolled into view.
- **Smaller items:**
  - Headings read the page name before the eyebrow.
  - The mobile menu has clean link names and reports its state.
  - The sector filter announces its count.
  - "Ruang" is marked as Malay.
  - The floating bar is a landmark.

**Code and security**
- **Turnstile:**
  - Rendered explicitly, so it survives client-side navigation.
  - Reset after a failed send.
  - Loaded only when the form is near or used.
  - The rate limit is checked before Turnstile, so a limited request does not spend the token.
- **Spam:**
  - A form submitted by the page's script must carry a valid timestamp.
  - The launch check blocks half-configured Turnstile keys, and email-only delivery without Turnstile.
- **Launch check:**
  - Loads env files exactly as `next build` does.
  - Reads process steps from `process-steps.json` instead of regex-parsing TypeScript. That fixed
    wrong step names and stopped the hidden Build step being counted.
- **Content and Markdown:**
  - All content schemas are strict.
  - Dates must be real.
  - Markdown links are escaped and limited to safe schemes; raw HTML is escaped.
- **Components:**
  - "Type of space" works without JavaScript.
  - The film pauses when reduced motion is switched on, and keeps its pause button while playing.
  - Effects that read storage or media queries use `useSyncExternalStore`.
  - Lint is clean.

**Performance**
- **Page transition:** the page-wide view transition is removed. It crossfaded `<main>` after every
  load. Together with the Suspense reveal removed in round 1, it had held case-study LCP back by
  about 0.5 s. Project images still morph between pages.
- **Hero:** art-directed. Large screens load a 3:2 crop (252 KB source, against 524 KB for the
  portrait), and phones size for the 30rem circle.
- **Images and links:**
  - The first plate on /projects loads at high priority, and plates request their own width.
  - Full prefetch is dropped on index rows and plates.
  - `priority` is replaced with `loading="eager"` and `fetchPriority="high"`.
  - The image cache is kept for 31 days, and unused sizes and qualities are removed.
- **Header:** finds its tone with an IntersectionObserver instead of a hit test and forced layout
  on every scroll frame.
- **Walkthrough:** the scroll loop runs only while it is near the screen and writes only changed
  values. Nothing shifts at hydration.
- **Mobile action bar:** throttled, and inactive at 1024 px and up.
- **Film:** posters are served through the image optimiser.

## Known issues not fixed

| Issue | Why it is open |
| --- | --- |
| Mobile home LCP is 2.9–3.4 s in Lighthouse's simulation once the Rembayung hero shows (0.9 s observed locally) | The hero is 41 KB and preloaded at high priority. The rest is fonts (two files, 58 KB), CSS and JS under simulated throttling. Next steps: a square phone crop of the hero, font subsetting, and `inlineCss`. Field data after launch is the real measure |
| The hero aperture animates `clip-path`, which is not composited | The measured cost is small (no task over 5 ms on desktop). It could move to a transform-based mask if low-end devices stutter |
| Render-blocking stylesheet (13 KB gzip) | `experimental.inlineCss` would save 50–100 ms of first paint but loses caching for repeat visits. A choice for after launch |
| The rate limiter can be beaten by a burst of simultaneous posts, and needs Supabase | Turnstile is required when there is no database. A database-independent limiter (e.g. Upstash) is optional |
| With Turnstile on, visitors without JavaScript cannot send the form | Inherent to Turnstile. WhatsApp and email remain available |
| Share image for an unknown project or article slug returns a generic card instead of 404 | Low risk. A 404 there could break the empty-collection build |
| Focus is not moved to the h1 after a client-side navigation | Next's route announcer reads the new page title. Optional |
| Section numbers skip when a section is hidden in production (for example Process) | Only until the studio confirms the content. Cosmetic |

## Implemented, and what depends on the studio

**Working now:**
- Design system and the full page set.
- Case-study template, walkthrough and hero aperture.
- Curated and graded photography, with metadata stripped.
- Enquiry form with validation, spam controls, a Supabase table, email notification and Turnstile
  support.
- WhatsApp links.
- GA4 after consent.
- Bilingual privacy notice.
- Metadata, structured data, sitemap, robots and share images.
- Preview/production separation and the launch gate.

**Depends on the studio or on accounts** (full list in [CONFIRMATIONS.md](CONFIRMATIONS.md); live
list via `npm run launch-check`, currently 24 blockers):
- **Scope:** design only, or design and build. This also decides the Build step and the CIDB
  question.
- **LAM status:** legal advice on the wording "interior design studio".
- **Services and areas:** confirm each service offer, process step, service area and FAQ answer.
- **Rembayung:** the owners' consent to publish it and name it, and to name Khairul Aming. Its scope
  wording.
- **Photographs:** permission for the project photography, and the full-size files and videos still
  on Drive (over the connector's 10 MB limit).
- **Business details:** registered company name, contact email, phone and WhatsApp number.
- **Accounts:** Supabase or Resend for enquiry delivery, GA4, Search Console, Turnstile keys, the
  Vercel project and the GitHub repository.
- **Privacy notice:** review by the studio's legal adviser, in English and Bahasa Malaysia.

# Visual direction and image curation

## The signature (four elements, used with restraint)

1. **The drawing sheet.** The brand kit says its patterns are "taken from how the work is drawn".
   Sections meet on hairlines with registration crosses at the page margins; project facts sit in a
   title block like an architectural sheet.
2. **The aperture.** The circle of the mark is a window onto the work. Project index rows reveal
   their photograph in a circle. (The home page's project cards no longer do: since round 4 they
   fade, at the client's request. The homepage no longer opens on a circular crop: since round 2
   it opens full bleed on the Rembayung film, which still tells "the moment an empty space becomes
   one that is lived in", kit p.3, as the visitor scrolls.)
3. **The curve as a rule.** The curve is lifted out of the mark and drawn as a hairline divider. It
   keeps its direction: high on the left, settling to the right. Never flipped. It draws itself left
   to right as it rises into view, on its own 24 px of entry rather than a share of the screen, so
   it is finished the moment all of it is on screen and whole wherever it comes to rest, on a short
   phone too.
4. **The title pair.** An Outfit Regular headline over a second line in Outfit Light, in Rikyū Grey,
   at the same size. Weight and colour together carry the contrast. Project titles are Outfit
   Regular, at the card-title level.

Calls to action are the kit's pills with the open ring (the mark) at the end: solid for the main
action, outline for the next step out of a section ("About ROUANG", "Read the case study", "All
projects"). On hover or focus a pill floods with the Rikyū gradient; the ring stays still. Round 2
removed every arrow and every underline from buttons and calls to action. Everything else is a text
link with no line and no arrow: navigation, footer, contact details and index rows. On hover its
words fade a step quieter (in a card or a row, only the name does); links set in a muted grey come up
to the full text colour instead. Keyboard focus is the outline ring; form fields, which draw a line
under the answer rather than a box, mark focus by doubling that line at full strength. Underlines remain only on links
inside running text (articles, case studies, the form's consent line), where they are the cue that
does not rely on colour.

## Colour, as built

Four colours: Chinese Black #141414, Milky White #F3F3F3, Mouse Grey #949495, Rikyū Grey #888E7E
(with the kit's gradient end #404732). Tints of black are used for small text on Milky White, where
Mouse Grey would fail contrast. Rikyū Grey is the ground of a section only where the page turns to
the studio itself: on the home page, 02 Studio (a field from #636957 to #393F2E, with a soft light
that drifts with its pinned pan and a fine grain) and the enquiry panel at the end, which closes the
page on the green it turned to at 02. Elsewhere it is an accent: the lit line and rings of the
process, the centre line of What we do, the flood of a pill on hover, the second line of a title.
Over a green section the header, once solid, is a bar of the deep green (#404732), not black.

Milky White on Rikyū Grey itself is only 3:1, so a green ground runs from an even mix of the kit's
two Rikyū stops (#888E7E and #404732) to the deep end: text and form fields measure 5.1:1 to 8.7:1
across it. Small text never sits on Rikyū Grey at full strength. Rikyū Grey text on Milky White
measures 3.0:1, so there it is used only at 24 px and up, the WCAG large-text size: in practice the
Light line of a title pair, and every title level starts above that (26 px). On Chinese Black it
measures 5.5:1.

## Type, as built (round 3)

One typeface, Outfit, loaded as a variable font. Round 3 answered "too heavy and oversized": every
level came down in size and weight, and each level now has one job. Size carries the hierarchy;
weight stays light. Regular 400 is the default, Light 300 sets leads, quotes and the second line of a
title pair, and Medium 500 is kept for emphasis at small sizes (an `em`, a `strong`, the current page
in the navigation, a name heading a short list row, a heading inside an article). Nothing is set in
SemiBold or heavier, and nothing in italic: Outfit has none, and emphasis is set in Medium.

Each level is one utility in `src/app/globals.css`, with its size in a `--fs-*` variable in `:root`
for section stylesheets that need it. Sizes grow evenly from a 360 px phone to a 1920 px screen
(a `clamp()`) and hold outside that range. The middle column gives the size at 360 px, 1440 px and
1920 px.

| Level | Utility | Size (360 / 1440 / 1920 px) | Weight | Use |
| --- | --- | --- | --- | --- |
| Display | `t-display` | 36 / 55 / 64 px | 400, second line 300 (`t-follow`) | The home page's statement, and nothing else. |
| Page title | `t-headline-hero` | 32 / 46 / 52 px | 400, follow 300 in Rikyū | The h1 that opens every other page, the case-study name included. `TitlePair size="hero"`. |
| Section title | `t-headline` | 26 / 34 / 38 px | 400, follow 300 in Rikyū | Every h2 and both lines of a title pair (`TitlePair`); also the flagship project's name and the menu's links. |
| Quote | `t-quote` | 20 / 25 / 28 px | 300 | Quotes, the Malay lines, a case study's client quote. |
| Card and project title | `t-title` | 20 / 23 / 24 px | 400 | Every h3: a project, service, step, person or article named in a card or a list; FAQ questions. |
| Lead and sub-heading | `t-sub` | 18 / 19.4 / 20 px | 300 | The paragraph under a title, a standfirst, a summary, a caption in the Inside a project walk. Kept to about 38–40 rem wide. |
| Body | `t-body` (and `body`) | 16 / 16.7 / 17 px, line height 1.65 | 400 | Running text and form fields (never under 16 px, so phones do not zoom into a field). |
| Supporting information | `t-meta` | 14 / 14.7 / 15 px | 400 | Facts in the title block, the line under a name in a list or a card, process steps, interface text (navigation, pills, buttons). |
| Small and caption | `t-caption` | 13 px | 400 | Photograph captions, hints, notes, the reading time, the legal line. |
| Label and eyebrow | `t-label` | 11 / 11.7 / 12 px, caps, tracked 0.12em | 400 | Section labels ("01 Work"), eyebrows, the field labels of a form and a title block. |

Body text stays Regular, after a measurement. At 16 px Outfit Light's stems render about 1.1 px wide
on Milky White against 1.45 px for Regular (Chrome, 1x screen), one device pixel, and in the softer
greys body text is set in (ink-soft, 8.4:1) it reads faint. APCA, which accounts for weight, also
rules out Light 300 for 16 px body text. Light starts at the lead, 18 px and up, where its strokes
hold.

Inside running text (`.prose-rouang`: articles, case-study narratives, the privacy notice) headings
sit a step down so they divide the text without competing with the page title: h2 at the quote size
in Regular, h3 at the lead size in Medium.

The pieces that are drawn rather than set stay outside the scale: the wordmark, the footer lockup
("Ruang tanpa batas" set to the wordmark's width) and the large word *built* (no full stop, at the client's request) that ends the sentence
in 02 Studio, which keeps its size as a graphic, at Regular.

**The label pill.** Any section label can be set in a small pill: `<Label index="01" pill>Work</Label>`
renders "01 / Work" in label type inside a 28 px rounded pill, sized to its words, with a hairline
ring in the label's own colour (40%). It has no fill, so the label keeps the contrast it has on Milky
White, Chinese Black and the Rikyū green; even a 5% tint would take ink-muted on kapur-deep under
4.5:1. It is a block that shrinks to its text, so `mx-auto` centres it. As the client asked, it
stands centred above the Selected work headline ("01 / Work", Mouse Grey on Chinese Black), and every
section of the home page now carries one, numbered in page order (01 Work to 07 Start a conversation;
the numbers count only the sections that show, so they close up if one is left out), 1.5 rem above
its title. The other pages set their numbered section labels in the same pill, kept in the margin of
the grid beside the title, like the title block of a drawing; a page's own kicker beside its h1
("About", "Services") stays plain. On a case study every label in that margin is a pill: the story's
chapters are numbered (01 The brief to 04 Light), the sections around them are not (Project, In
motion, Materials and finishes, Problems worth solving). Where a section has no title of its own
(every section of a service page; In motion and Materials and finishes on a case study) its pill is
its h2; where it has one, the pill is a label and the title is the h2. On a service page the
service's own text runs on under 02 What we do, so its headings are set one level down, as h3s.

## Motion

Purposeful and quiet: on a first visit ROUANG is spelled out on white and fades onto the page; the
hero film, the pinned home scenes and the walk inside a project are driven by the visitor's own
scrolling, never by a clock, and the scroll itself glides (Lenis); photographs settle as they come
into view; project images morph between the index and the case study (View Transitions). There is no
page-wide crossfade: it ran after every load and held back the first paint. With reduced motion
everything is static, and nothing depends on animation to be read: the hero is one still of the
finished room, the walk becomes the rooms held still, each its own stack of discs, and screen readers always get every
frame and caption as a list.

**The opening, as built (round 3).** One continuous passage from the hero into 01 Work, and nothing
in it slides vertically:

- **Hero.** The statement and the descriptor stand centred on the film's own axis (the gable, the
  pavilion), below the middle so they sit on the hall's brick back wall under the bright glass and
  the mezzanine rail (lower still on an upright phone, the roof's apex pointing down to them). They
  carry their own soft pool of shade, centred on them at any size and gone with them once they fade,
  so the film runs undimmed; measured over the first frame, every pixel behind them keeps at least
  8:1 on a phone and 10:1 on desktop. The caption ("Rembayung, Kampung Baru · Interior design ·
  Visualisation") is centred at the foot, on a band of shade that never lightens. The scroll runs the
  film over 180svh; the finished room holds for 20svh.
- **Fade, not a slide.** Over the next 40svh the whole film, caption included, fades to the dark
  ground (a dip to black, as in a film edit), and only then does "Selected work" fade in, centred, in
  the same place, with "01 / Work" in its pill above it. The caption is visible for exactly as long as
  the film is, and never alongside the title. Under the hood 01 Work's scene is already pinned over the
  hero's last screen with its ground clear (styles/home/work.css), so when the hero then lets go, dark
  meets dark. Both fades are on scroll timelines that start at the top of the page, so they meet at the
  same scroll position on every screen.
- **The flagship run.** Rembayung's photograph comes in from the right over the title, the picture
  travelling at about half the speed of its frame, so it is drawn open rather than slid in; its name,
  summary, facts and "Read the case study" gather at its foot and hold. Then the whole strip moves on,
  right to left, steadily (about 1.4 times as far as the page scrolls), and four tall photographs
  of the same project come in after it, each the full height of the screen with a thin dark gap
  between, each picture drifting slowly inside its frame, each numbered (02 / 05 to 05 / 05) and
  captioned at its foot. The run ends on a composed frame: two photographs edge to edge on a 16:10 or
  4:3 screen, three on 16:9 and wider, one with a glimpse of its neighbour on an upright screen. It
  holds briefly, and the page hands over to the other projects with no gap. There are no arrows, dots
  or buttons: the scroll is the only control. Keyboard focus on the flagship's links always lands where
  its panel holds still (FlagshipRun).
- **Reduced motion, or no scroll timelines:** the hero is the still of the finished room with the same
  centred words. The still is drawn a fifth larger from its top edge (a third on an upright screen),
  so the pavilion's lit sign falls below the words rather than between the statement and the line
  under it, and their pool of shade is a fifth deeper over the rail and lamps behind them. Then the
  title, the full photograph with its facts, and the four photographs as a contact sheet with their
  captions beneath: four across on large screens, two by two on tablets and phones.

**The rest of the home page, as built (round 3).**

- **Other projects (01 Work).** Round 5, after the client's reference (the Ftech Lighting home page,
  for its motion only): the four other projects as a row of photographs the full height of the
  screen, ruled apart by hairlines on the flagship's ink ground. At rest every photograph shows, grey
  and at four tenths of its light, with the project's name set sideways in Light in the middle of
  the card and, on proposals, "Design proposal" beside it, so the label is there in every state.
  Hover or keyboard focus opens a card: it widens to twice the width of each of the others (40% of
  the row; the reference's 3:1 squeezed the others to slivers, 1.6:1 hardly singled the card out),
  its photograph comes up to full colour, the sideways words fade, and after 0.3s the write-up (the
  name, type and place, and "Design proposal" on proposals) rises 35px into the same middle, its
  lines centred on one another. The words stand in the same place on every card, at rest and open,
  as the client asked on 19 November (the reference's bottom-left place was dropped). The pointer
  leaving the row closes it. The widening is done with transforms alone, so nothing reflows and the
  photographs, already sized for the open card, are never fetched again. No shade, panel or
  gradient sits behind the words; each photograph is cropped so that its middle carries them as well
  as it can (Showcase.tsx, SPOTS), measured line by line at every card size against the brightest
  pixel behind white words (the darkest behind ink). The resting words read on every picture, 5.3:1
  or better, because the veil holds the picture down. Open, Kota Warisan (ink, on the patterned
  panel above the bed) reads at 6.3:1 or better everywhere. The other three fall short at the middle
  of any crop of their present photographs: Seri Wirani (ink, the pale wall under the garden fence)
  by a few dark pixels, its label at 3.9–4.2:1 at some sizes of the row and, on tablets and phones,
  its name down to 2.7:1 and its label to 3.5:1;
  Warung Soho (white, the left of the room) its name at 2.3–3.2:1 and its label at 2.4–4.1:1; Ampang,
  whose middle is the lit glass of its doors, its name at 1.3–1.7:1, with ink no better. Other
  photographs of the same projects would carry the words at the middle on every screen (Ampang's
  velvet seat, Seri Wirani's living room, both in white); none of Warung Soho's does. Which
  photograph leads each card is for the client to choose. A pointer resting while the cards move
  under it does not open them; turning the wheel while the row holds still keeps an opened card
  open, and without the script hover simply works. On large landscape screens the row rises out of
  the flagship's dark ground as a staircase, left to right. Touch: stacked cards on phones and
  upright tablets, where the card at the middle of the screen opens as it passes; on a tablet on its
  side the row holds and its cards open in turn, left to right; on a phone on its side the cards stay
  at rest. Wherever the scroll stops a card is closed or open, never on its way. Reduced motion: the
  same states without travel, the width changing at once and the colour and words cross-fading in a
  moment. The All projects button was removed; the header's Work link and "See our projects" lead to
  /projects.
- **02 Studio.** The section the client liked, kept as it moved (the stage pins, the sentence pans
  left at three rates, the studio arrives from the right), with new words and a green ground: the
  conviction co-founder Zhafiri Zainol brought to the company, credited to him as the profile gives
  it, set as one sentence ending in the large word *built* (no full stop), then what the company is, who
  leads it, and its vision and mission, all from the company profile. The profile states no values
  of its own, so the section gives none; "transparency, integrity and accountability" stays in the
  Mission, where p.3 puts it. The field drifts at half the pace of the type, so the light leaves
  with the sentence. Round 5: the empty room to the right of *built* holds the client's exploded
  drawing of a house, in Milky White line on the green: a generic drawing, decorative and
  uncaptioned, never presented as a ROUANG project. It is placed and sized as in the client's
  mockup: its lines run from 11.4% of the screen's height, just under the header, to 2.6% above the
  foot (86% of the height), centred 70.9% across, with the drawing's own proportions. The mockup's
  house is a redrawn copy about a quarter wider for its height; ours keeps the PDF's proportions, so
  it matches the mockup's height and centre and is narrower. As the stage pins, the house comes
  together in the middle (the client's direction of 19 Nov): the ground floor and its garden rise
  onto the upper floor first, then the roof comes down as the floors rise a little to meet it, and
  the guides shorten with the gaps until they are gone. The finished house stands on the middle of
  the stage. It is complete before the sentence leaves, and leaves with it. A higher layer hides
  what lies behind it by cutting it away, so the field and its grain show through and no flat patch
  appears. The coming together is drawn on a canvas, from the line work, as the page scrolls: the
  floors move in whole pixels and the roof is drawn from its outline at each step, so the lines stay
  as sharp as the still drawing throughout. Round 5's first version moved masked layers in CSS
  instead, which left the lines soft while the roof came down and then sharpened them with a jolt.
  The rest of the scene's moves are set up only once the section is within a screen of the window,
  so Chrome runs them on the compositor. Tablets and phones: the panels follow each other, and the
  house follows *built* (beside it on a phone on its side, below it otherwise), whole by the time it
  reaches the middle of the screen. Reduced motion and no JavaScript: the exploded drawing, still.
  Without scroll-driven animation: the finished house, still.
- **03 What we do.** Two doors, for homes and for businesses, either side of the three capabilities,
  which sit on one centre line in Rikyū Grey that runs the height of the composition. The door
  photographs are seen the same way, straight down a long room to its end (the Ampang corridor and
  its arched door; the Rembayung hall). Round 4 brought the doors in from the screen's edges: nothing
  bleeds. From a tablet up, each door's photograph and words keep a second page margin inside the
  first (twice `--page-gutter`: 132 px from the edge at 1440, 160 px at 1920, 75 px on an 820
  tablet). On a wide screen that space matches the space between each door and the words on the
  centre line (132 px at 1440), and each capability sets its line in two to keep it so. On phones,
  photographs and words keep to the page margin, like every other section. As the composition enters
  on wide screens the doors draw apart by about 3vw, finished before it is fully on screen. Still on
  tablets and phones.
- **04 Inside a project.** A walk in depth, never sideways, taken in steps (round 5: the client asked
  for the rings of round 4's concentric ripple to feel stacked, stair-like rather than a smooth
  transition, and to carry the photographs instead of flat colour). Each room is a stack of five discs,
  like terraces seen from above: the photograph's own disc on top and four rings stepping down and out
  beneath it. Every disc is a print of the room's photograph at its own size, so the picture steps at
  each edge like a terrace; each ring is a shade darker than the one it carries (ink at 13% a step),
  has a fine Milky White lip and casts a soft shadow on the ring below. (Rings alternating between the
  room being left and the room opening were tried and set aside: the screen flicked back to the last
  room at every other step.) The plate opens on the first room's stack, centred between the title and
  the words at its foot. Scrolling, every move is one disc, in its own short stretch of the scroll,
  with a firm ease and then a hold: the discs sweep out past the corners of the screen one at a time,
  the outer ring first and the photograph last, each a step lighter, until the room fills the screen
  in full colour. Then that room darkens and in its middle the next stack is built from the middle
  out, its photograph popping up first and each ring stepping out from under the one inside it; held a
  moment, it sweeps open in turn, each room stacked over the last, from the dining room under the
  glazed gable to the grain of the timber. A disc grows as a whole, its photograph with it, so only
  transforms and opacity move, and a photograph printed on five discs is one download. The rooms and
  their captions are only set up once the section is a screen below the fold, so the browser runs
  their moves on the compositor rather than the main thread (set up at load, far off screen, Chrome
  keeps them on the main thread for good). Every stack is sized to the shorter side of the screen,
  so it stays round and centred on phones, tablets and phones on their side. The walk opens on the gable dining room because, cut to a landscape band, it
  still holds the screens, pendants, chairs and glass wall. A short landscape screen keeps the label
  and gives the lead's room to the stack. The lead and captions stay clear of the corner where the
  preview pill sits; the project and its case-study link, on screen all through the walk on laptops
  and desktops, carry a soft shade of their own so they read over any disc. With reduced motion, the
  opening plate and then the five rooms held still, each its own stack and its caption beneath: the
  two spaces side by side, then the three materials (one column on phones).
- **05 Process.** One line runs through the six steps, from the first numbered ring to the last,
  horizontal from 1360 px and vertical below. The whole line is always there as a faint hairline; a
  Rikyū deep line travels along it with the scroll and each ring fills as the line reaches it. The
  section is one composition on the centre line (round 4): the heading (pill, title pair, summary)
  is centred, and so is the flow. Side by side, each step stands centred under its ring (icon, title,
  text), so the line runs from the middle of the first column to the middle of the last and the row
  is symmetrical about the centre of the page. Running down (tablets and laptops under 1360 px) the
  list is one centred block, at most 58 rem wide, ring, icon and title on the left of the centre line
  and the text on the right; on phones the line keeps to the left and the block fills the page between
  its margins. The About page draws its process with the same steps (ProcessSteps), left-aligned
  under its left-aligned heading.
- **06 Insights and 07 Start a conversation** are still: the latest article leads, wide, with three
  more beside it; the page ends on the green it turned to at 02.

**One page, one language.** What holds the sections together:

- **Grounds.** Dark for the work (the film, the flagship, the walk inside a project), Milky White for
  reading (the project cards, What we do, Process, Insights), the green where the studio speaks for
  itself (02 Studio, the enquiry). They alternate, so each section begins on a change of ground, and
  two light sections in a row (Process, then Insights) meet on a hairline with registration crosses.
- **Section openings.** Every section opens the same way: the label pill, then 1.5 rem, then the title
  pair. It is centred where the section is a composition on the centre line (01 Work, 03 What we do,
  04 Inside a project, 05 Process) and on the left edge of the grid where it reads left to right
  (02 Studio, 06 Insights, 07 Start a conversation).
- **Spacing.** One space above and below a section, `--section-space`: 80 px on phones and tablets,
  130 px at 1440, 144 px at most. It came down with the type, so the room around a title stays in
  proportion. Pinned scenes are a screen high and set their own space inside it.
- **Motion.** Each moving section has one movement of its own, and none repeats another's: the film
  runs, the flagship strip travels right to left, the cards rise, the studio pans, the doors draw
  apart, the walk goes into depth, the process line is drawn. All of it is scroll-driven (CSS scroll
  timelines, and the hero's film), so it stops when the scroll stops and runs back with it; only
  transforms, opacity and clip-paths change, and nothing is read from the layout while scrolling.
- **Phones and touch.** Every hover has a touch counterpart that needs no tap: the cards open as they
  pass the middle of the screen, or in turn across the row on a tablet held on its side; links simply
  follow on a tap. Horizontal runs keep to the scroll
  (nothing captures a swipe), full-height panels keep their words within the small viewport so the
  browser's bar never hides them, and every caption stands clear of the floating contact bar.
- **Performance.** A few things are drawn the cheap way on purpose: the grain on the green is a small
  bitmap tile (an SVG noise filter held a frame up for 150 ms as the section came near), the enquiry
  form's message box grows with its text instead of carrying a drag handle (which cost the same), and
  the hero's film stops following the scroll once the hero is off screen.

## Photography: what was chosen and why

The studio's Drive held about 400 images across five projects. The selection follows the kit's three
kinds of picture, **Space** (a room with light moving through it), **Material** (timber, stone,
plaster and the joints) and **Whole** (the finished space, straight on), and builds a flow across the
site, not just good single frames:

- **Rembayung leads.** It is the best-known project and its photos carry the brand's warmth: timber,
  rattan, batik and daylight. The home hero is a film of its hall going from the empty shell to the
  finished dining room, run by the scroll; it is a generated visualisation, not footage (see below),
  and is captioned as one. On the case study the glazed gable leads, with the city skyline in the
  glass, which places the project in Kuala Lumpur. 14 frames were chosen from about 88 usable
  ones, and each placement on the home page uses its own frames (01 Work's flagship run, What we
  do and the walk inside the project never repeat a photograph between them; the case study's
  gallery holds them all). The flagship run's four were picked for range, in this order: the
  space (the hall's timber roof, looking up), a material (batik on its timber frames), colour and
  identity (the stained glass and the restaurant's name), and light (a table by the window in the
  afternoon sun), which ends the run quietly before the white of the other projects. Construction and installation shots (people on site, wrapped furniture) were left out.
- **Ampang balances it.** Professional photography of a white house drawn in black and brass: crisp
  where Rembayung is warm. Frames with the house number and street name were left out for the owners'
  privacy.
- **Proposals sit after built work.** Seri Wirani and Kota Warisan are renders from September 2026
  design presentations. They are labelled "Design visualisation" everywhere and listed after finished
  projects. Their palettes (textured white and timber; white, arches and black frames) echo the built
  work, so the site reads as one body of thinking.
- **Warung Soho** renders are low resolution (1080 px) and more saturated than the brand, so they are
  used small and last until better files arrive.

One gentle grade is applied to every photograph (slightly warm, calmer saturation, softened contrast,
as the kit asks: "grade slightly warm"), and a lighter version to renders, so phone photos, a
professional shoot and renders sit together. No photograph has been altered beyond grading,
resizing and cropping, and all metadata (including GPS on the iPhone originals) is stripped.

## Motion from real footage

The site's project films are short silent loops cut from real footage of the finished rooms, never
AI-generated. A generated "cinematic" interior would show details that do not exist in the built
room and misrepresent the project.

**The one exception: the home hero.** At the client's request the hero is a generated film of
Rembayung's hall being fitted out, from the empty shell to the finished dining room (it differs from
the real building: its gable looks onto trees, the real one onto the city towers). It is shown only
as a visualisation: its caption, "Rembayung, Kampung Baru · Interior design · Visualisation", stays
on screen for the whole film and names ROUANG's part (interior design only), and the film never
appears on the case study or as evidence of the finished room. The launch check's manual list asks
for this to be confirmed.

**Where the loops play**
- **Case-study opener:** a loop plays over its own first frame, so the still is the first paint and
  the film fades in once it is playing.
- **"In motion" band:** short loops sit together lower down the case study.
- **When they stop:** loops pause off screen, have a pause control, and never play with reduced
  motion.

**Ampang.** The videographer's edited film (`ROUANG_1.mp4`) gives the opener and three loops:
- **Opener:** the master bedroom, slowed to half speed. It has a 16:9 version for desktop and a 9:16
  crop for phones.
- **Loops:** the foyer into the living room, the walk-in wardrobe, and the master dressing alcove.

Left out: every exterior shot (the house number and the development name are legible), the stretches
with people in them, the children's bedroom and the home cinema.

**Rembayung.** Of the 59 phone clips, 58 were filmed during fit-out (October and November 2025), with
shrink-wrapped chairs, crew at work or recognisable faces, and cannot be shown under "interior
design only". One clip from the open restaurant (IMG_2216, 9 January 2026) gives a single loop,
cropped to keep the table-number cards out of frame.

**Specification.**
- **Format:** H.264 MP4 with fast start, graded with the ROUANG grade (lighter on the already-graded
  Ampang film).
- **The loop point:** the last half second to one second crossfades into the opening, so the loop
  has no jump.
- **Audio and metadata:** none. The iPhone clips carried GPS coordinates; the web files do not.
- **Sizes:** the desktop opener is 1.5 MB; the phone opener and the band loops are 350–700 KB each.

Footage reviewed: 59 Rembayung clips and the whole 5-minute Ampang film.

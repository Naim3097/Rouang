import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Mark, Wordmark } from "@/components/brand/Brand";
import { ProcessSteps } from "@/components/home/Process";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { Capabilities } from "@/components/services/Capabilities";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { CtaPanel } from "@/components/ui/RikyuField";
import { Pending } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import { brandImagery, placeholderImagery } from "@/config/media";
import { founders, team } from "@/config/people";
import { processSteps, processSummary } from "@/config/process";
import { studio } from "@/config/studio";
import { getProjects, getServices, projectImage, publicImage } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "About ROUANG, a design-led construction company",
  description:
    "ROUANG is a design-led construction company bringing design, planning, project management and construction together. Its vision, mission, process and people.",
  path: "/about",
});

/** Vision and mission, as the company profile states them (p.3). */
const purpose = [
  {
    title: "Vision",
    body: "To become a benchmark design-led construction company recognised for design excellence, quality execution and disciplined project management, building a trusted, high-capability organisation that helps shape new standards for the construction industry in Malaysia and the region.",
  },
  {
    title: "Mission",
    body: "We translate our clients’ aspirations into high-quality, functional and distinctive spaces through thoughtful planning, comprehensive project management and high standards of execution. We uphold transparency, integrity and accountability while continuously developing our people, systems and culture of excellence.",
  },
];

/*
 * Temporary photographs (src/config/media.ts), dropped from production by publicImage(): every
 * section keeps its words and its layout without them. None shows ROUANG's work or its people, so
 * none is captioned, and the ones set beside a person's name are described as nothing (alt=""):
 * the name is their heading, and a description of a stranger would be read as that person.
 */

/** The Capabilities band, built exactly as the Services page builds it (components/services/Capabilities.tsx). */
const capabilityImagery = {
  lead: publicImage(placeholderImagery.capabilitiesLead),
  thumbs: {
    "design-and-build": publicImage(placeholderImagery.capabilityDesignBuild),
    "renovation-and-interior": publicImage(placeholderImagery.capabilityRenovation),
    "new-build-and-construction": publicImage(placeholderImagery.capabilityNewBuild),
  },
};

/*
 * A headshot at the head of each founder's column, in the order of `founders` (Zhafiri, then
 * Shaidee). Stand-ins until the founders' own portraits arrive: previews only, never captioned,
 * alt="". The two are presented alike (about.css, about-founder): the same 4:5 frame, the same
 * monochrome grade, the eyes on one line a third of the way down and the faces drawn at the same
 * size. `focus` sets each photograph's eyes on that line, and `zoom` draws in, about the eyes, a
 * photograph taken from further back: the first stand-in's face is 1.6 times smaller in its
 * picture than the second's. A new portrait needs only these two values set afresh.
 */
const founderImagery = [
  { image: publicImage(placeholderImagery.founderPortraitA), focus: "50% 47%", zoom: 1.6 },
  { image: publicImage(placeholderImagery.founderPortraitB), focus: "50% 20%", zoom: 1 },
];

/** The frame's width (about-founder-figure: 14rem, a fifth of the screen, 18rem at most), times the zoom. */
const founderSizes = (zoom: number) =>
  `(min-width: 90rem) ${Math.ceil(18 * zoom)}rem, (min-width: 70rem) ${Math.ceil(20 * zoom)}vw, ${Math.ceil(14 * zoom)}rem`;

export default async function AboutPage() {
  const [projects, services] = await Promise.all([getProjects(), getServices()]);
  // The opening: a photograph across the whole hero, the words centred on it.
  const hero = publicImage(placeholderImagery.aboutHero);
  // A real material photograph behind the wordmark; brand-kit atmosphere only as a preview fallback.
  const horizon = projectImage(projects.find((p) => p.slug === "ampang"), "ampang-black-joinery") ?? publicImage(brandImagery.horizonWall);
  // Approach: a drawing being made by hand, beside the words about how the work is planned.
  const drawing = publicImage(placeholderImagery.drawingByHand);
  // Team: one picture for everyone, a site crew seen from far above.
  const crew = publicImage(placeholderImagery.siteCrew);

  const approach = [
    <p key="framework">
      Our approach brings design and construction together under a clear project framework, supported by thoughtful
      planning, transparent communication and responsible project management. From initial concept through construction
      and handover, every decision is guided by the project&rsquo;s purpose, our clients&rsquo; needs and a commitment to
      quality.
    </p>,
    <p key="growth">
      As ROUANG continues to grow, we are building more than a portfolio of completed spaces. We are building stronger
      systems, developing capable teams and continuously refining the standards by which we design, manage and deliver our
      work.
    </p>,
  ];

  return (
    <>
      {/* The opening: a photograph across the whole hero under a dark shade, and the words centred on it
          in Milky White. Without the photograph (production, until the studio supplies its own) the
          ground is Chinese Black and the words sit exactly where they do on the photograph.
          styles/pages/about.css (about-hero). */}
      <section data-tone="dark" className="about-hero" aria-labelledby="about-title">
        {hero ? (
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <Image
              src={hero.src}
              // Atmosphere behind the page title, not a photograph of ROUANG's work: nothing to read.
              alt=""
              fill
              // The 3:2 photograph covers the hero: the screen's width on laptops, where the hero is
              // wider than 3:2; on tablets and phones the hero stands taller, so it is covered by its
              // height and drawn about one and a half and nearly three times the screen's width.
              sizes="(min-width: 64rem) 100vw, (min-width: 40rem) 150vw, 270vw"
              loading="eager"
              fetchPriority="high"
              quality={78}
              className="object-cover"
              style={{ objectPosition: hero.focus ?? "50% 50%" }}
            />
            <span className="about-hero-scrim" />
          </div>
        ) : null}
        <div className="about-hero-inner page-x">
          <Breadcrumbs tone={hero ? "photo" : "dark"} items={[{ name: "About", href: "/about" }]} />
          <div className="about-hero-body">
            <TitlePair
              as="h1"
              size="hero"
              id="about-title"
              // "design-led" kept whole: a narrow column would otherwise break it at its hyphen.
              eyebrow={
                <>
                  About ROUANG, <span className="whitespace-nowrap">design-led</span> construction company
                </>
              }
              lead={studio.line.lead}
              follow={studio.line.follow}
              followClassName="text-kapur"
              // Full Milky White: at 80% the small capitals measured 3.9:1 over the pale photograph.
              eyebrowClassName="text-kapur"
            />
            <p className="t-sub mx-auto mt-8 max-w-[38rem] text-kapur">
              ROUANG is a design-led construction company that integrates design thinking, functionality, planning,
              project management and construction delivery. From renovation and interior enhancement to new-build
              projects, we approach each project as a coordinated process, translating ideas into well-considered
              spaces that are distinctive, functional and built to last.
            </p>
          </div>
        </div>
      </section>

      {/* Approach, in the profile's words (p.2): the picture on the left, larger than the words, and the
          label, statement and paragraphs on the right; stacked, the picture comes first. Without the
          picture (production) the label takes the first three columns and the words the other nine,
          like the sections below it. about.css (about-approach). */}
      <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="approach-title">
        <div className="page-x section-y">
          <div className="about-approach page-grid">
            {drawing ? (
              <Figure
                image={drawing}
                // 4:3, 4:5 on small laptops (about.css).
                aspect="var(--about-drawing-ratio)"
                // The 16:9 photograph covers its frame by height and is then drawn in on the hands
                // (about-drawing, scale 1.3): 1.73 times a 4:3 frame's width, 2.89 times a 4:5
                // one's. The frame is seven columns on laptops (52% of the screen) and the page's
                // width stacked (91%).
                sizes="(min-width: 80rem) 90vw, (min-width: 64rem) 150vw, 157vw"
                className="about-approach-figure"
                imgClassName="about-drawing"
              />
            ) : null}
            <div className={`about-approach-text ${drawing ? "" : "about-approach-text-alone"}`}>
              <Label pill index="01" className="text-ink-muted">
                Approach
              </Label>
              <h2 id="approach-title" className="t-headline mt-6 max-w-[22ch]">
                Great spaces are shaped by purposeful design and delivered through disciplined execution.
              </h2>
              <div className="mt-8 max-w-[40rem] space-y-5 text-ink-soft">{approach}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision and mission */}
      <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="purpose-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <div className="col-span-12 lg:col-span-3">
              <Label pill index="02" className="text-ink-muted">
                Purpose
              </Label>
              <h2 id="purpose-title" className="visually-hidden">
                Vision and mission
              </h2>
            </div>
            <div className="col-span-12 grid gap-x-[var(--grid-gap)] gap-y-12 lg:col-span-9 lg:grid-cols-2">
              {purpose.map((p) => (
                <div key={p.title} className="border-t border-ink/15 pt-6">
                  <h3 className="t-title">{p.title}</h3>
                  <p className="t-sub mt-5 text-ink-soft">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities, each row leading to its service page: the Services page's own band, the same
          component with the same pictures, so the two pages show the three capabilities identically. */}
      {services.length ? (
        <Capabilities index="03" services={services} lead={capabilityImagery.lead} thumbs={capabilityImagery.thumbs} />
      ) : null}

      {/* Process, set as the home page sets it (home/Process.tsx): the label, the title pair and the summary
          on the centre line, and the steps centred under them, each one's text on the same short measure. */}
      {processSteps.length ? (
        <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="process-title">
          <div className="page-x section-y">
            <div className="flex flex-col items-center text-center">
              <Label pill index="04" className="text-ink-muted">
                Process
              </Label>
              <TitlePair
                id="process-title"
                lead="How a project runs"
                follow="from the first discussion to handover"
                className="mt-6"
              />
              <p className="mt-8 max-w-[38rem] text-balance text-ink-soft">{processSummary}</p>
            </div>
            <ProcessSteps centred />
          </div>
        </section>
      ) : null}

      {/* Who we are: the founders, condensed from the profile (pp.6–7). */}
      <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="founders-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label pill index="05" className="col-span-12 text-ink-muted lg:col-span-3">
              Who we are
            </Label>
            <div className="col-span-12 lg:col-span-9">
              <h2 id="founders-title" className="t-headline">
                The founders
              </h2>
              {/* Two columns, one per founder, from tablets (stacked on phones): a headshot at the head of
                  each (the same 4:5 frame and capped width for both, at the column's start), then the
                  name, role, degrees and biography. Stand-in headshots until the founders' own
                  portraits arrive; in production the columns read as text alone. about.css (about-founder). */}
              <div className="mt-14 grid gap-x-[var(--grid-gap)] gap-y-16 md:grid-cols-2">
                {founders.map((f, i) => {
                  const picture = founderImagery[i];
                  return (
                    <article key={f.name} className="border-t border-ink/15 pt-8">
                      {picture?.image ? (
                        <Figure
                          // A stranger beside a founder's name: never captioned, never described.
                          image={{ ...picture.image, alt: "", focus: picture.focus }}
                          aspect="4/5"
                          sizes={founderSizes(picture.zoom)}
                          className="about-founder-figure"
                          imgClassName="about-founder-photo"
                          style={{ "--about-founder-zoom": picture.zoom } as CSSProperties}
                        />
                      ) : null}
                      <h3 className="t-title">{f.name}</h3>
                      <p className="mt-2">{f.role}</p>
                      <p className="t-caption mt-2 text-ink-muted">{f.credentials}</p>
                      <div className="mt-6 max-w-[40rem] space-y-4 text-ink-soft">
                        {f.bio.map((para) => (
                          <p key={para}>{para}</p>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The team (p.8): names and roles, under one picture for the whole team. A stand-in (a site crew
          seen from far above, no face to be taken for anyone's) until the studio's own team photograph
          is in; in production the names stand alone under the heading. */}
      <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="team-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label pill index="06" className="col-span-12 text-ink-muted lg:col-span-3">
              Team
            </Label>
            <div className="col-span-12 lg:col-span-9">
              <h2 id="team-title" className="t-headline">
                Our team
              </h2>
              {crew ? (
                <Figure
                  // Not ROUANG's team: described as nothing, so it is never read as them.
                  image={{ ...crew, alt: "" }}
                  aspect="var(--about-team-ratio)"
                  sizes="(min-width: 64rem) 68vw, 92vw"
                  className="about-team-figure mt-10 sm:mt-12"
                />
              ) : null}
              <ul className={`grid gap-x-[var(--grid-gap)] border-t border-ink/15 sm:grid-cols-2 lg:grid-cols-3 ${crew ? "mt-10 sm:mt-12" : "mt-14"}`}>
                {team.map((m) => (
                  <li key={m.name} className="border-b border-ink/15 py-6">
                    <p className="t-title">{m.name}</p>
                    <p className="t-meta mt-1 text-ink-soft">{m.role}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Pending title="Founders’ portraits, team pictures and founding year">
                  The founders&rsquo; headshots are stand-ins of strangers, and the picture over the team is a stock
                  photograph of a site crew seen from far above. Both are shown in previews only and never captioned.
                  Still owed: a head-and-shoulders portrait of each founder, shot alike (backdrop, light, distance), to
                  replace the stand-ins; and the team&rsquo;s pictures, once the client has settled between headshots
                  of each member and one team photograph. Every picture taken with the person&rsquo;s consent.
                  {studio.foundingYear ? "" : " The year ROUANG was founded is also still needed."}
                </Pending>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The name, as the brand book tells it. */}
      <section data-tone="dark" aria-labelledby="name-title" className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="page-x section-y order-2 lg:order-1">
            <Label pill index="07" className="text-mouse">
              The name
            </Label>
            <h2 id="name-title" className="t-headline mt-8">
              <span className="block">
                <span lang="ms">Ruang</span> means space.
              </span>
              <span className="t-follow block text-rikyu">We added an O.</span>
            </h2>
            <div className="mt-8 max-w-[34rem] space-y-5 text-kapur/80">
              <p>
                ROUANG comes from the Malay word <em lang="ms">ruang</em>, space. The added O
                brings with it the idea that space has no fixed limit.
              </p>
              <p>
                The name carries three ideas that begin with the same letter: openness, originality and opportunity. They
                are what ROUANG offers long before any wall goes up.
              </p>
            </div>
          </div>
          {/* Phones and tablets: a band of a set shape above the words (4:3, then 3:2), never most of the
              screen: capped at three quarters of it, so on a phone held sideways the photograph crops
              rather than running a screen and a half (w-full keeps the capped band full width). Side by
              side: exactly as tall as the words beside it. */}
          <div className="relative order-1 aspect-[4/3] max-h-[min(75svh,760px)] w-full sm:aspect-[3/2] lg:order-2 lg:aspect-auto lg:max-h-none lg:min-h-full">
            {horizon ? <Figure image={horizon} sizes="(min-width: 1024px) 50vw, 100vw" aspect="auto" className="absolute inset-0 h-full" tone="dark" /> : null}
            <div className="absolute inset-0 flex items-center justify-center p-10">
              <Wordmark className="h-auto w-[min(80%,26rem)] text-kapur" title="ROUANG" />
            </div>
          </div>
        </div>
      </section>

      {/* The mark. Its dashed guides run past the circle, so the section clips them at the screen's edge. */}
      <section data-tone="light" className="overflow-x-clip bg-kapur text-ink" aria-labelledby="mark-title">
        <div className="page-x section-y">
          {/* The mark is sized to the words beside it (about-mark), so it is never the larger of the two.
              From tablets the two stand side by side. */}
          <div className="page-grid items-center gap-y-12">
            <div className="col-span-12 flex justify-center md:col-span-5">
              <div className="about-mark relative aspect-square">
                <span className="absolute -inset-[9%] rounded-full border border-dashed border-ink/25" aria-hidden="true" />
                <span className="absolute inset-x-[-30%] top-0 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)] opacity-25" aria-hidden="true" />
                <span className="absolute inset-x-[-30%] bottom-0 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)] opacity-25" aria-hidden="true" />
                <Mark className="h-full w-full" title="The ROUANG mark" />
              </div>
            </div>
            <div className="col-span-12 md:col-span-7 lg:col-span-6 lg:col-start-7">
              <Label pill index="08" className="text-ink-muted">
                The mark
              </Label>
              <h2 id="mark-title" className="t-headline mt-8">
                <span className="block">The letters say build.</span>
                <span className="t-follow block text-rikyu">The circle says space.</span>
              </h2>
              <p className="mt-8 max-w-[34rem] text-ink-soft">
                Inside the circle is a curve that enters high on the left and settles to the right. Read it as a horizon,
                as ground meeting light, as water finding its level: the moment an empty space becomes one that is lived
                in. It is the moment every project works towards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {projects.length ? (
        <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="work-title">
          <div className="page-x section-y">
            <Label pill index="09" className="mb-4 text-ink-muted">
              Work
            </Label>
            <h2 id="work-title" className="t-headline mb-10">Projects</h2>
            <ProjectIndex projects={projects} />
          </div>
        </section>
      ) : null}

      {/* The close: the rounded green panel the Services page also ends on, on the grey of the section
          above it (Projects, or the mark when there are no projects to show). */}
      <CtaPanel
        id="cta-title"
        lead="Have a space in mind?"
        follow="Tell us how you want to use it."
        surface={projects.length ? "kapur-deep" : "kapur"}
      />
    </>
  );
}

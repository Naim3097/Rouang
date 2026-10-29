import Link from "next/link";
import { CurveRule, Icon, Mark } from "@/components/brand/Brand";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { ContactLink } from "@/components/layout/ContactLink";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { TitleBlock } from "@/components/projects/TitleBlock";
import { ArrowLink } from "@/components/ui/Button";
import { Figure } from "@/components/ui/Figure";
import { Label, TitlePair } from "@/components/ui/Typography";
import { Crosses, Pending, Section } from "@/components/ui/Section";
import { processSteps } from "@/config/process";
import { studio, whatsappHref } from "@/config/studio";
import { Walkthrough, type WalkFrame } from "@/components/projects/Walkthrough";
import type { Insight, Project, Service } from "@/lib/content";
import { publicImage } from "@/lib/content";
import type { Image } from "@/lib/content/schema";
import { SHOW_DRAFTS, TURNSTILE_SITE_KEY } from "@/lib/env";

/* ——— 01 Work ——— */

export function SelectedWork({ flagship, others }: { flagship: Project | null; others: Project[] }) {
  if (!flagship && others.length === 0) return null;
  const hero = flagship ? publicImage(flagship.card ?? flagship.hero) : null;
  return (
    <Section labelledBy="work-title" className="section-y">
      <div className="page-x">
        <div className="page-grid items-end gap-y-8">
          <Label index="01" className="col-span-12 text-ink-muted lg:col-span-3">
            Work
          </Label>
          <TitlePair
            id="work-title"
            lead="Selected work"
            italic="from dining rooms to homes"
            className="col-span-12 lg:col-span-9"
          />
        </div>

        {flagship ? (
          <article className="page-grid mt-16 gap-y-10 sm:mt-24" aria-labelledby="flagship-title">
            <Link
              href={`/projects/${flagship.slug}`}
              className="group col-span-12 block sm:col-span-8 sm:col-start-3 lg:col-span-6 lg:col-start-2"
              aria-label={`${flagship.title}: read the case study`}
              tabIndex={-1}
            >
              {hero ? (
                <Figure
                  image={hero}
                  sizes="(min-width: 1024px) 50vw, (min-width: 640px) 66vw, 100vw"
                  aspect="4/5"
                  transitionName={`project-${flagship.slug}`}
                  imgClassName="transition-transform duration-[1.6s] ease-[var(--ease-brand)] group-hover:scale-[1.02]"
                />
              ) : null}
            </Link>
            <div className="col-span-12 flex flex-col lg:col-span-4 lg:col-start-9 lg:self-end">
              <p className="t-label text-ink-muted">Flagship project · {flagship.sector === "commercial" ? "Commercial" : "Residential"}</p>
              <h3 id="flagship-title" className="mt-4 font-serif text-[clamp(2.75rem,2rem+3vw,4.75rem)] italic leading-[0.98] tracking-[-0.015em]">
                <Link href={`/projects/${flagship.slug}`} className="link-reveal">
                  {flagship.title}
                </Link>
              </h3>
              <p className="t-sub mt-6 text-ink-soft">{flagship.summary}</p>
              <TitleBlock project={flagship} className="mt-8" />
              <ArrowLink href={`/projects/${flagship.slug}`} className="mt-8 self-start" prefetch={true}>
                Read the case study
              </ArrowLink>
            </div>
          </article>
        ) : null}

        {others.length > 0 ? (
          <div className="mt-20 sm:mt-28">
            <ProjectIndex projects={others} startAt={2} />
            <ArrowLink href="/projects" className="mt-10">
              All projects
            </ArrowLink>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

/* ——— 02 The name ——— */

export function StudioName() {
  return (
    <Section labelledBy="name-title" className="overflow-hidden pb-[var(--section-space)] pt-[calc(var(--section-space)*0.5)]" guides>
      <div className="page-x">
        <div className="page-grid gap-y-12">
          <Label index="02" className="col-span-12 text-ink-muted lg:col-span-3">
            Studio
          </Label>

          <div className="col-span-12 lg:col-span-9">
            <h2 id="name-title" className="visually-hidden">
              Why the studio is called ROUANG
            </h2>
            {/* A dictionary entry for the word the studio is named after. */}
            <p className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <span lang="ms" className="font-serif text-[clamp(5.5rem,3rem+13vw,15rem)] italic leading-[0.8] tracking-[-0.02em]">
                ruang
              </span>
              <span className="t-caption text-ink-muted">
                <span lang="ms">/ru·ang/</span> · noun, Malay
                <br />
                <span className="text-ink">space</span>
              </span>
            </p>
          </div>

          <div className="col-span-12 grid gap-10 lg:col-span-9 lg:col-start-4 lg:grid-cols-9 lg:gap-x-[var(--grid-gap)]">
            <p className="t-sub lg:col-span-5">
              ROUANG comes from the Malay word <em lang="ms" className="font-serif">ruang</em>, space. The studio
              added an O, and with it the idea that space has no fixed limit.
            </p>
            <div className="lg:col-span-4">
              <p className="text-ink-soft">
                The O carries three ideas that begin with the same letter. They describe how we work long before any
                wall goes up.
              </p>
              <ul className="mt-6 border-t border-ink/15">
                {[
                  ["Openness", "Plans that let light and people move through them."],
                  ["Originality", "A design drawn for your space, not adapted from the last one."],
                  ["Opportunity", "Finding what a space, a budget and a site make possible."],
                ].map(([word, line]) => (
                  <li key={word} className="flex gap-4 border-b border-ink/15 py-4">
                    <Mark className="mt-1 h-4 w-4 shrink-0 text-ink" />
                    <span>
                      <span className="font-medium">{word}.</span> <span className="text-ink-soft">{line}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <ArrowLink href="/about" className="mt-8">
                About the studio
              </ArrowLink>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ——— 03 Services: two doors ——— */

type DoorImage = Image | null | undefined;

export function Pathways({
  services,
  images = {},
  proof = null,
}: {
  services: Service[];
  images?: { homes?: DoorImage; business?: DoorImage };
  /** A built commercial project to name as proof. Only passed when that project is live. */
  proof?: { title: string; location: string | null } | null;
}) {
  const residential = services.filter((s) => s.sector === "residential");
  const commercial = services.filter((s) => s.sector === "commercial");
  const doors = [
    {
      key: "homes",
      tone: "light" as const,
      label: "For homes",
      title: "Homeowners, condominiums and landed houses",
      body: "For people moving into a new place, or tired of one that has stopped working. We plan around how your household actually lives, then design the rooms, storage and light to suit, at the scale your budget allows.",
      list: residential,
      image: images.homes as DoorImage,
    },
    {
      key: "business",
      tone: "dark" as const,
      label: "For businesses",
      title: "Restaurants, cafés and food businesses",
      body: `For operators who need a space that works hard: guests seated well, staff moving without collisions, a room people remember.${proof ? ` We designed the interior of ${proof.title}${proof.location ? ` in ${proof.location}` : ""}.` : ""}`,
      list: commercial,
      image: images.business,
    },
  ];

  return (
    <section aria-labelledby="services-title" className="relative">
      <h2 id="services-title" className="visually-hidden">
        Services for homes and businesses
      </h2>
      <div className="grid lg:grid-cols-2">
        {doors.map((d, i) => (
          <div
            key={d.key}
            data-tone={d.tone}
            className={`relative flex flex-col px-[var(--page-gutter)] pb-[clamp(5rem,9vw,9rem)] pt-[clamp(3rem,5vw,5rem)] ${d.tone === "light" ? "bg-kapur-deep text-ink" : ""}`}
          >
            {d.image ? (
              <Figure
                image={d.image}
                aspect="3/2"
                sizes="(min-width: 1024px) 45vw, 100vw"
                tone={d.tone}
                className="mb-14"
              />
            ) : null}
            <Label index={`0${i + 3}`} className={d.tone === "dark" ? "text-mouse" : "text-ink-muted"}>
              {d.label}
            </Label>
            <h3 className="t-headline mt-8 max-w-[16ch]">{d.title}</h3>
            <p className={`mt-6 max-w-[34rem] ${d.tone === "dark" ? "text-kapur/80" : "text-ink-soft"}`}>{d.body}</p>
            <ul className={`mt-10 border-t ${d.tone === "dark" ? "border-kapur/15" : "border-ink/15"}`}>
              {d.list.map((s) => (
                <li key={s.slug} className={`border-b ${d.tone === "dark" ? "border-kapur/15" : "border-ink/15"}`}>
                  <Link href={`/services/${s.slug}`} className="group flex items-center justify-between gap-6 py-5">
                    <span className="t-sub">{s.navLabel}</span>
                    <span className="t-caption flex items-center gap-3 opacity-70">
                      {s.isDraft ? "Draft" : null}
                      <svg viewBox="0 0 22 12" className="h-3 w-[1.375rem] transition-transform duration-500 group-hover:translate-x-1" fill="none" aria-hidden="true">
                        <path d="M0 6h20.5M15.5 1l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ——— 05 A walk through the flagship, in its own photographs ——— */

const ROLE_LABEL = { space: "Space", material: "Material", whole: "Whole" } as const;

/** "/images/projects/rembayung/rembayung-batik-frame.jpg" becomes "Batik frame". */
function frameLabel(src: string, slug: string) {
  const name = src.split("/").pop()?.replace(/\.jpg$/, "").replace(`${slug}-`, "").replace(/-/g, " ") ?? "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function InsideProject({ project }: { project: Project | null }) {
  if (!project) return null;
  const frames: WalkFrame[] = project.gallery
    .map((g) => publicImage(g))
    .filter((g): g is Extract<NonNullable<typeof g>, { src: string }> => !!g && !("pending" in g) && !!g.walk)
    .sort((a, b) => (a.walkOrder ?? 99) - (b.walkOrder ?? 99))
    .map((g) => ({
      src: g.src,
      alt: g.alt,
      width: g.width,
      height: g.height,
      focus: g.focus,
      role: ROLE_LABEL[g.role ?? "space"],
      caption: g.walk as string,
      label: frameLabel(g.src, project.slug),
    }));
  if (frames.length < 3) return null;

  return (
    <section data-tone="dark" aria-labelledby="inside-title" className="relative border-t border-kapur/10">
      <Crosses />
      <div className="page-x pb-4 pt-[var(--section-space)]">
        <div className="page-grid gap-y-8">
          <Label index="05" className="col-span-12 text-mouse lg:col-span-3">
            Inside a project
          </Label>
          <div className="col-span-12 lg:col-span-9">
            <TitlePair
              id="inside-title"
              lead={
                <>
                  A walk through <span className="font-serif font-normal italic">{project.title}</span>
                </>
              }
              italic="space, material, whole"
            />
            <p className="mt-8 max-w-[38rem] text-kapur/75">
              Three kinds of picture tell a space properly: the room with light moving through it, the materials and the
              joints between them, and the whole. Scroll to walk through.
            </p>
          </div>
        </div>
      </div>
      <Walkthrough
        frames={frames}
        title={project.title}
        href={`/projects/${project.slug}`}
        kicker={[project.type, project.location].filter(Boolean).join(" · ")}
      />
    </section>
  );
}

/* ——— A project, told through its constraints (used once the studio supplies them) ——— */

export function ProjectStory({ project }: { project: Project | null }) {
  if (!project) return null;
  // Only told when the studio has supplied real constraints; the walkthrough carries the page until then.
  if (project.challenges.length === 0) return null;
  const quote = project.quote && (project.quote.approved || SHOW_DRAFTS) ? project.quote : null;

  return (
    <Section tone="dark" labelledBy="story-title" className="section-y">
      <div className="page-x">
        <div className="page-grid gap-y-10">
          <Label index="05" className="col-span-12 text-mouse lg:col-span-3">
            Inside a project
          </Label>
          <TitlePair
            id="story-title"
            lead={<>How <span className="font-serif font-normal italic">{project.title}</span> came together</>}
            italic="constraint, then response"
            className="col-span-12 lg:col-span-9"
          />
        </div>

        <div className="page-grid mt-16 gap-y-12">
          <div className="col-span-12 lg:col-span-4 lg:col-start-4">
            {project.concept ? (
              <p className="t-quote text-kapur">{project.concept}</p>
            ) : (
              <Pending title="Design concept" tone="dark">
                Two or three sentences in the studio&rsquo;s words: the idea that organised the interior.
              </Pending>
            )}
            {quote ? (
              <blockquote className="mt-10 border-l border-rikyu pl-5">
                <p className="t-quote text-kapur">&ldquo;{quote.text}&rdquo;</p>
                <footer className="t-caption mt-3 text-mouse">{quote.attribution}</footer>
              </blockquote>
            ) : null}
          </div>

          <div className="col-span-12 lg:col-span-5">
            {project.challenges.length > 0 ? (
              <ol className="border-t border-kapur/15">
                {project.challenges.slice(0, 3).map((c, i) => (
                  <li key={i} className="grid gap-4 border-b border-kapur/15 py-7 sm:grid-cols-2 sm:gap-8">
                    <div>
                      <p className="t-label text-mouse">Constraint</p>
                      <p className="mt-2">{c.constraint}</p>
                    </div>
                    <div>
                      <p className="t-label text-rikyu">Response</p>
                      <p className="mt-2 text-kapur/85">{c.response}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Pending title="Constraints and responses" tone="dark">
                Two or three real design problems on this project (site, kitchen, seating, budget, programme) and what the
                studio decided in response.
              </Pending>
            )}
            <ArrowLink href={`/projects/${project.slug}`} className="mt-10 text-kapur">
              Read the full case study
            </ArrowLink>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ——— 06 Process ——— */

export function Process() {
  return (
    <Section labelledBy="process-title" className="section-y">
      <div className="page-x">
        <div className="page-grid gap-y-8">
          <Label index="06" className="col-span-12 text-ink-muted lg:col-span-3">
            Process
          </Label>
          <div className="col-span-12 lg:col-span-9">
            <TitlePair id="process-title" lead="How a project runs" italic="from the first visit to a design you can sign off" />
            <p className="mt-8 max-w-[40rem] text-ink-soft">
              Every project is different in size and budget, so the scope is agreed with you at the start. What stays the
              same is the order of work: understand first, plan second, finish last.
            </p>
          </div>
        </div>

        <CurveRule className="mt-16 text-ink/30 sm:mt-24" at="18%" />

        <ol className={`mt-10 grid gap-x-[var(--grid-gap)] gap-y-12 sm:grid-cols-2 ${processSteps.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
          {processSteps.map((step, i) => (
            <li key={step.title} data-reveal>
              <div className="flex items-center justify-between">
                <Icon name={step.icon} className="h-14 w-14 -ml-2" />
                <span className="t-label tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="t-sub mt-6">{step.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ——— 08 Insights ——— */

export function InsightsList({ insights, index = "07" }: { insights: Insight[]; index?: string }) {
  if (insights.length === 0) return null;
  const [lead, ...rest] = insights;
  return (
    <Section labelledBy="insights-title" className="bg-kapur pb-[var(--section-space)] pt-[calc(var(--section-space)*0.5)]">
      <div className="page-x">
        <div className="page-grid gap-y-8">
          <Label index={index} className="col-span-12 text-ink-muted lg:col-span-3">
            Insights
          </Label>
          <TitlePair id="insights-title" lead="Notes for people planning a space" className="col-span-12 lg:col-span-9" />
        </div>

        <div className="page-grid mt-16 gap-y-12 sm:mt-20">
          <article className="col-span-12 lg:col-span-6 lg:col-start-4">
            <Link href={`/insights/${lead.slug}`} className="group block border-t border-ink/15 pt-6">
              <p className="t-label text-ink-muted">
                {lead.category} · {lead.readingMinutes} min read{lead.isDraft ? " · Draft" : ""}
              </p>
              <h3 className="t-headline mt-5 max-w-[22ch] text-[clamp(1.875rem,1.4rem+1.9vw,3rem)]">
                <span className="link-reveal">{lead.title}</span>
              </h3>
              <p className="mt-5 max-w-[36rem] text-ink-soft">{lead.description}</p>
            </Link>
          </article>
          <ul className="col-span-12 lg:col-span-3">
            {rest.slice(0, 3).map((a) => (
              <li key={a.slug} className="border-t border-ink/15">
                <Link href={`/insights/${a.slug}`} className="group block py-6">
                  <p className="t-label text-ink-muted">{a.category}{a.isDraft ? " · Draft" : ""}</p>
                  <p className="mt-3 text-[1.1875rem] leading-snug tracking-[-0.01em]">
                    <span className="link-reveal">{a.title}</span>
                  </p>
                </Link>
              </li>
            ))}
            <li className="border-t border-ink/15 pt-6">
              <ArrowLink href="/insights">All insights</ArrowLink>
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ——— 09 Enquiry: the one Rikyū panel on the page ——— */

export function EnquiryPanel({ index = "08" }: { index?: string }) {
  const wa = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  return (
    <section data-tone="rikyu" aria-labelledby="enquiry-title" className="relative overflow-hidden">
      <div className="pattern-halftone pointer-events-none absolute inset-y-0 right-0 w-[70%]" aria-hidden="true" />
      <div className="page-x section-y relative">
        <div className="page-grid gap-y-14">
          <div className="col-span-12 lg:col-span-5">
            <Label index={index} className="text-kapur/75">
              Start a conversation
            </Label>
            <h2 id="enquiry-title" className="t-headline mt-8">
              <span className="block">Tell us about the space.</span>
              <span className="t-italic-display mt-[0.06em] block text-[1.08em] text-kapur/80">We&rsquo;ll take it from there.</span>
            </h2>
            <p className="mt-8 max-w-[30rem] text-kapur/85">
              A few lines is enough to begin. Tell us what the space is and what you would like to change, and we&rsquo;ll
              reply to arrange a first conversation.
            </p>
            {wa ? (
              <p className="mt-8">
                <ContactLink href={wa} kind="whatsapp" location="home_panel" className="link-line">
                  Or message the studio on WhatsApp
                </ContactLink>
              </p>
            ) : null}
            {studio.contact.email ? (
              <p className="mt-3">
                <ContactLink href={`mailto:${studio.contact.email}`} kind="email" location="home_panel" className="link-line">
                  {studio.contact.email}
                </ContactLink>
              </p>
            ) : null}
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <EnquiryForm tone="dark" location="home" turnstileSiteKey={TURNSTILE_SITE_KEY} />
          </div>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { ProjectCaption } from "@/components/ui/Typography";
import type { Image as ImageData, PendingImage } from "@/lib/content/schema";

type HeroProject = { slug: string; title: string; type: string; location: string | null } | null;

/**
 * The opening. The circle from the mark is a window onto the work; scrolling opens it until the
 * photograph fills the screen: "the moment an empty space becomes one that is lived in" (kit p.3).
 * Construction lines are the dashed guides from the logo drawing (kit p.3–4).
 *
 * On phones, without scroll-driven animation support, or with reduced motion, the hero is a
 * still composition with the same content.
 */
export function HeroAperture({
  image,
  project,
  areas,
}: {
  image: ImageData | PendingImage | null;
  /** Set only when the image is a photograph of this project, so the caption never mislabels a picture. */
  project: HeroProject;
  areas: string;
}) {
  const photo = image && !("pending" in image) ? image : null;

  return (
    <section data-tone="dark" aria-labelledby="hero-title" className="aperture-track relative">
      {/* Padding, not margin, so the dark section starts under the header on phones. */}
      <div className="aperture-stage relative pt-[calc(var(--header-h)+1.5rem)] lg:min-h-[100svh] lg:pt-0">
        {/* Image layer: full-bleed, clipped to the aperture on large screens. */}
        <div
          className="aperture-window relative mx-auto aspect-square w-[min(84vw,30rem)] overflow-hidden rounded-full lg:absolute lg:inset-0 lg:aspect-auto lg:w-auto lg:rounded-none"
          style={{
            ["--aperture-x" as string]: "71%",
            ["--aperture-y" as string]: "53%",
            ["--aperture-r" as string]: "min(27vw, 35svh)",
            ["--aperture-r-start" as string]: "min(27vw, 35svh)",
          }}
        >
          {photo ? (
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority
              fetchPriority="high"
              quality={78}
              sizes="(min-width: 1024px) 100vw, 84vw"
              className="object-cover"
              style={{ objectPosition: photo.focus ?? "50% 40%" }}
            />
          ) : (
            <div className="absolute inset-0 bg-ink-raised" role="img" aria-label="Photograph to come" />
          )}
          <div className="aperture-caption pointer-events-none absolute inset-x-0 bottom-0 hidden bg-linear-to-t from-ink/80 via-ink/30 to-transparent pb-10 pt-40 lg:block">
            <div className="page-x pointer-events-auto flex items-end justify-between gap-8">
              {project ? (
                <>
                  <ProjectCaption
                    title={project.title}
                    facts={[project.type, project.location, "Interior design by ROUANG"]}
                    className="text-kapur"
                  />
                  <Link href={`/projects/${project.slug}`} className="link-line t-caption text-kapur">
                    View the project
                  </Link>
                </>
              ) : photo?.provisional ? (
                <p className="t-caption text-kapur/80">Atmosphere image from the brand kit. Replace with project photography.</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Construction lines around the aperture, as in the logo drawing. */}
        <div className="aperture-fade pointer-events-none absolute inset-0 hidden text-kapur lg:block" aria-hidden="true">
          <ConstructionLines />
        </div>

        {/* The studio's own line, in Malay, set under the aperture like a caption on a drawing. */}
        <p
          lang="ms"
          className="aperture-fade t-quote absolute bottom-[3.5svh] right-[var(--page-gutter)] hidden max-w-[22rem] text-right text-mouse lg:block"
        >
          Anda cerita macam mana nak duduk. Kami terjemah jadi ruang.
        </p>

        {/* Text block */}
        <div className="aperture-fade relative z-10 page-x pb-16 pt-12 lg:absolute lg:inset-0 lg:flex lg:items-center lg:pb-[4svh] lg:pt-[calc(var(--header-h)+2svh)]">
          <div className="max-w-[38rem] lg:w-[46%] lg:max-w-none xl:w-[44%]">
            <h1 id="hero-title">
              <span className="t-label mb-[min(2rem,3.5svh)] block text-mouse">Interior design studio · {areas}</span>
              <span className="t-headline-hero block lg:text-[clamp(2.625rem,min(1.4rem+4.2vw,8.6svh),5.75rem)]">
                Tell us how you want to live.
              </span>
              <span className="t-italic-display mt-[0.08em] block text-[clamp(2.75rem,1.45rem+4.85vw,6.1rem)] leading-[1.02] text-rikyu lg:text-[clamp(2.75rem,min(1.5rem+4.45vw,9.2svh),6.1rem)]">
                We&rsquo;ll translate it into space.
              </span>
            </h1>
            <p className="mt-[min(2rem,4svh)] max-w-[32rem] text-kapur/85">
              Interior design for homes and for businesses such as restaurants. We start with how a space will be used,
              then plan it, finish it and light it, within the budget you are working to.
            </p>
            <div className="mt-[min(2.5rem,4.5svh)] flex flex-wrap gap-3">
              <ButtonLink href="/projects" variant="light">
                See our projects
              </ButtonLink>
              <ButtonLink href="/contact" variant="outline">
                Discuss your project
              </ButtonLink>
            </div>
            <p lang="ms" className="t-quote mt-10 text-mouse lg:hidden">
              Anda cerita macam mana nak duduk. Kami terjemah jadi ruang.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConstructionLines() {
  // Bounding square of the aperture circle, drawn as dashed guides that run off the page edges.
  const r = "min(27vw, 35svh)";
  const cx = "71%";
  const cy = "53%";
  const dash = "bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)]";
  const dashV = "bg-[repeating-linear-gradient(180deg,currentColor_0_6px,transparent_6px_12px)]";
  return (
    <div className="absolute inset-0 opacity-30">
      <span className={`absolute inset-x-0 h-px ${dash}`} style={{ top: `calc(${cy} - ${r})` }} />
      <span className={`absolute inset-x-0 h-px ${dash}`} style={{ top: `calc(${cy} + ${r})` }} />
      <span className={`absolute inset-y-0 w-px ${dashV}`} style={{ left: `calc(${cx} - ${r})` }} />
      <span className={`absolute inset-y-0 w-px ${dashV}`} style={{ left: `calc(${cx} + ${r})` }} />
      <span
        className="absolute rounded-full border border-dashed border-current"
        style={{
          left: `calc(${cx} - ${r} - 1.75rem)`,
          top: `calc(${cy} - ${r} - 1.75rem)`,
          width: `calc(2 * ${r} + 3.5rem)`,
          height: `calc(2 * ${r} + 3.5rem)`,
        }}
      />
    </div>
  );
}

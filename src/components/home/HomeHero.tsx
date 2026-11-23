import Image, { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { preload } from "react-dom";
import { WORDMARK } from "@/components/brand/paths";
import { FirstPaintScript } from "@/components/ui/FirstPaintScript";
import { studio } from "@/config/studio";
import type { Image as ImageData } from "@/lib/content/schema";
import { HeroFilm } from "./HeroFilm";
import { HeroIntroControl } from "./HeroIntroControl";

/**
 * The opening.
 *
 * Intro (first visit in a session, motion allowed): a white screen; the letters of ROUANG arrive
 * one by one; once the word is whole it holds for a moment, then the white and the word fade out
 * together onto the hero and the rest of the page, and the header fades in with them. It is CSS
 * animation on a clock (styles/home/hero.css, "Intro"); HeroIntroControl lets the visitor cut it short and
 * retires the overlay at the end.
 *
 * Hero: a film of Rembayung's hall, edge to edge, with the statement centred over it, on the
 * film's own axis (the gable, the pavilion). It does not play on its own: the hero holds still on
 * the screen while the scroll runs the film, from the empty shell to the finished room (HeroFilm);
 * the finished room holds for a moment, then fades, caption and all, to the dark ground, where
 * "Selected work" fades in in its place (styles/home/hero.css and work.css). Nothing slides. The
 * statement fades as the film starts; the caption, centred at the foot, stays as long as the film
 * shows, naming the project, ROUANG's part in it, and that the film is a visualisation rather
 * than footage. With reduced motion or Data Saver it is one still of the finished room and nothing
 * pins. Where Rembayung is not visible (an unpublished draft), a photograph of built work stands
 * in, still; where that is not visible either, the hero stands on its dark ground alone.
 */

/**
 * The film, a generated sequence of Rembayung's hall being fitted out (10 s at 30 fps, 1920×1080,
 * silent), in three cuts (HeroFilm picks one per screen; scripts/media/hero-film.cjs makes them)
 * and its first and last frames as stills.
 */
export const HERO_FILM = {
  project: "rembayung",
  duration: 10,
  fps: 30,
  sources: {
    wide: "/films/hero/rembayung-film-1080.mp4",
    mid: "/films/hero/rembayung-film-720.mp4",
    tall: "/films/hero/rembayung-film-portrait.mp4",
  },
  first: "/images/hero/rembayung-film-first.jpg",
  last: "/images/hero/rembayung-film-last.jpg",
  aspect: 1920 / 1080,
  description:
    "Visualisation of Rembayung's hall in Kampung Baru: an empty shell under a timber A-frame roof fills, as the page scrolls, with the restaurant's interior, bentwood chairs on terracotta tiles, rattan lamps and a timber pavilion bearing its name.",
} as const;

/**
 * The photograph that stands in for the film where Rembayung is not visible, a landscape of a
 * ROUANG project's gallery (here the Ampang house's facade, 3:2), and where to hold it when the
 * screen crops it: centred on landscape screens; on portrait ones, on the balcony window with the
 * trees in front of it.
 */
export const HERO_PHOTO = {
  project: "ampang",
  file: "ampang-facade",
  focus: { landscape: "50% 50%", portrait: "57% 50%" },
} as const;

// Decides before first paint whether this visit plays the intro: once per session, never with
// reduced motion, never when arriving at an anchor. It marks its own section, which therefore
// suppresses the hydration warning for that one attribute. Only on a full page load: arriving from
// another page of the site, the intro does not play.
const INTRO_SCRIPT = `(function(){var s=document.currentScript&&document.currentScript.parentElement;if(!s)return;try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("rouang-intro")||location.hash){s.setAttribute("data-intro","none");return}sessionStorage.setItem("rouang-intro","1");s.setAttribute("data-intro","play")}catch(e){s.setAttribute("data-intro","none")}})();`;

// Decides before first paint whether the scroll runs the film: not with reduced motion, not with
// Data Saver. Before paint, because it sets the hero's height, and an anchor must land where the
// page will stay. After a navigation within the site HeroFilm makes the same test instead.
const FILM_SCRIPT = `(function(){var s=document.currentScript&&document.currentScript.parentElement;if(!s)return;var on=true;try{var c=navigator.connection;on=!window.matchMedia("(prefers-reduced-motion: reduce)").matches&&!(c&&c.saveData)}catch(e){}s.setAttribute("data-film",on?"on":"off")})();`;

/** The project the film shows, as the caption names it; null where it is not visible here. */
export type HeroFilmProject = { title: string; place: string | null; scope: string[] };

export function HomeHero({
  areas,
  film,
  photo,
}: {
  areas: string;
  film: HeroFilmProject | null;
  photo: ImageData | null;
}) {
  // A still covers the screen, so on a screen taller than its own shape it is drawn wider than the
  // screen: as wide as the screen's height times its aspect ratio. Asking for only the screen's
  // width would leave a phone or a portrait tablet with a file a third of the size it shows.
  const coverSizes = (aspect: number) => `max(100vw, ${Math.ceil(aspect * 100)}vh)`;
  const caption = film
    ? [[film.title, film.place].filter(Boolean).join(", "), film.scope.join(", "), "Visualisation"].filter(Boolean).join(" · ")
    : null;

  // The first frame is only seen while the scroll runs the film. With reduced motion its picture
  // points at an empty image, so the browser downloads nothing for it, and the last frame, which is
  // then the picture the page opens on, is fetched first. (Data Saver has no media query: there
  // the first frame is still fetched, unseen.)
  const still = { alt: "", fill: true, sizes: coverSizes(HERO_FILM.aspect), quality: 85 } as const;
  const first = film ? getImageProps({ ...still, src: HERO_FILM.first, loading: "eager", fetchPriority: "high" }).props : null;
  if (film) {
    const last = getImageProps({ ...still, src: HERO_FILM.last }).props;
    preload(last.src, {
      as: "image",
      imageSrcSet: last.srcSet,
      imageSizes: last.sizes,
      fetchPriority: "high",
      media: "(prefers-reduced-motion: reduce)",
    });
  }

  return (
    <section
      data-tone="dark"
      data-hero
      aria-labelledby="hero-title"
      className="home-hero relative"
      suppressHydrationWarning
    >
      <FirstPaintScript code={INTRO_SCRIPT} />
      {film ? <FirstPaintScript code={FILM_SCRIPT} /> : null}

      <div className="home-hero-stage">
        {film && first ? (
          // One description for whichever of the stills or the film is showing.
          <div className="absolute inset-0" role="img" aria-label={HERO_FILM.description}>
            <Image {...still} src={HERO_FILM.last} alt="" loading="eager" className="object-cover" />
            <picture>
              <source media="(prefers-reduced-motion: reduce)" srcSet={BLANK} />
              <img {...first} alt="" className="home-hero-first object-cover" />
            </picture>
            <HeroFilm sources={HERO_FILM.sources} duration={HERO_FILM.duration} fps={HERO_FILM.fps} />
          </div>
        ) : photo ? (
          <div
            className="absolute inset-0"
            style={
              {
                ["--focus" as string]: HERO_PHOTO.focus.landscape,
                ["--focus-tall" as string]: HERO_PHOTO.focus.portrait,
              } as CSSProperties
            }
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes={coverSizes(photo.width / photo.height)}
              quality={85}
              loading="eager"
              fetchPriority="high"
              className="object-cover [object-position:var(--focus)] portrait:[object-position:var(--focus-tall)]"
            />
          </div>
        ) : null}
        <div className="home-hero-scrim absolute inset-0" aria-hidden="true" />
        <div className="home-hero-shade absolute inset-0" aria-hidden="true" />

        <div className="home-hero-body page-x relative">
          <div className="home-hero-copy">
            {/* Regular, then Light: the same face at two weights carries the two halves of the line. */}
            <h1 id="hero-title" className="t-display mx-auto max-w-[22ch] sm:max-w-none">
              <span className="block">{studio.line.lead}</span>
              <span className="t-follow block">{studio.line.follow}</span>
            </h1>
            <p className="t-sub mx-auto mt-5 max-w-[30rem] text-balance text-kapur/90 sm:mt-6">
              {studio.descriptor} in {areas}.
            </p>
          </div>
          {caption ? <p className="home-hero-caption t-label text-kapur/85">{caption}</p> : null}
        </div>
      </div>

      {/* The intro. Decorative and silent for assistive technology: the page beneath is already there. */}
      {/* Lenis leaves its wheel alone, so HeroIntroControl can keep the skipping gesture from moving the page. */}
      <div className="intro" aria-hidden="true" data-lenis-prevent>
        <div className="intro-word">
          {/* One drawing per letter, each with room around it, so a letter can soften as it arrives
              without being cut off at the edge of the word. */}
          {WORDMARK.paths.map((p, i) => (
            <svg
              key={i}
              className="intro-letter"
              style={{ ["--n" as string]: i } as CSSProperties}
              viewBox={`${-PAD} ${-PAD} ${WORDMARK.width + PAD * 2} ${WORDMARK.height + PAD * 2}`}
              fill="currentColor"
            >
              <path transform={`matrix(${p.m.join(",")})`} d={p.d} />
            </svg>
          ))}
        </div>
      </div>
      <HeroIntroControl />
    </section>
  );
}

/** Room, in wordmark units, around each intro letter for its blur and soft mask. */
const PAD = 16;

/** A transparent pixel, for a picture that should download nothing. */
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

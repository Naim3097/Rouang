import type { CSSProperties } from "react";
import { MARK, WORDMARK } from "@/components/brand/paths";
import { studio } from "@/config/studio";
import { HeroIntroControl, HeroTextRelease } from "./HeroIntroControl";
import { HERO_ALT, OPENING_MASKS, sceneryProps, wallProps } from "./heroMedia";

/**
 * The opening, as one continuous piece.
 *
 * Intro (first visit in a session, motion allowed): a blank white screen; the letters of ROUANG
 * arrive one by one; the others fall away while the O glides to its place and opens out to the
 * size of the emblem in the wall, becoming a hairline of the same silhouette; then the white gives
 * way to the wall and the view, and the statement condenses in the opening.
 *
 * Hero: the ROUANG O built into a concrete wall (a path-traced render, scripts/render/
 * o-installation, with its opening transparent), looking out to the client's scenery photograph.
 * Scrolling disperses the statement into soft mist: its letters fade and drift while each word
 * gives off a pale haze; the description condenses out of the same haze; then it thins away as the
 * camera moves through the O until the view fills the screen, where Selected Work picks it up
 * (SelectedWork.tsx; `handoff` says it is there to pick it up).
 *
 * All of it is CSS animation (time for the intro, scroll for the hero) on opacity, transforms and
 * blur: nothing runs on the main thread while scrolling. See globals.css, "Hero" and "Intro". With
 * reduced motion there is no intro and everything cross-fades; without scroll-driven animation the
 * texts are shown in turn. The installation is a rendering and the mist is generated
 * (scripts/media/mist.cjs): neither depicts a real place or a ROUANG project.
 */

const STATEMENT = ["Tell us how you want to live,", "and we’ll translate it into space."] as const;
const DESCRIPTION =
  "Interior design for homes and businesses, including restaurants. We start with how a space will be used, then plan it, select its finishes and lighting, all within your working budget.";

/** A stable pseudo-random number in [0, 1) for glyph i, so server and client render the same. */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Numbers every character across the lines (spaces included), so the dispersal front can travel
 * through the whole statement rather than restart on each line. */
function layOut(lines: readonly string[]) {
  let offset = 0;
  return lines.map((line) =>
    line.split(" ").map((word) => {
      const start = offset;
      offset += word.length + 1;
      return { word, start };
    }),
  );
}

/** Where a word whose middle is character i sits in the dispersal, 0..1: roughly left to right
 * and top to bottom, with a slightly ragged front. */
function order(i: number, total: number) {
  return Math.min(1, Math.max(0, (i / total) * 0.82 + (rand(i, 1) - 0.5) * 0.12));
}

/** The statement, word by word. Each word fades as a whole and drifts up a little, and gives off a
 * pale haze of its own shape (::after, from data-t) that rises and opens out into the air. */
function Disperse({ lines }: { lines: readonly string[] }) {
  const total = lines.join(" ").length;
  const laid = layOut(lines);

  return (
    <>
      {laid.map((words, li) => (
        <span key={li} className={`hero-line hero-line-${li + 1} block`}>
          {words.map(({ word, start }, wi) => {
            const style = {
              ["--d" as string]: order(start + word.length / 2, total).toFixed(3),
              ["--dx" as string]: `${((rand(start, 6) - 0.35) * 0.5).toFixed(3)}em`,
              ["--dy" as string]: `${(-0.45 - rand(start, 7) * 0.5).toFixed(3)}em`,
            } as CSSProperties;
            return (
              <span key={wi}>
                <span className="hero-wisp inline-block whitespace-nowrap" data-t={word} style={style}>
                  <span className="hero-ink inline-block">{word}</span>
                </span>
                {wi < words.length - 1 ? " " : null}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

/** The description as words that condense out of a haze of their own shape, a ragged front moving
 * through the text. */
function Condense({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => {
        const at = i / words.length;
        const style = {
          ["--d" as string]: Math.min(1, Math.max(0, at * 0.8 + (rand(i, 7) - 0.5) * 0.08)).toFixed(3),
          ["--dx" as string]: "0em",
          ["--dy" as string]: `${(0.12 + rand(i, 9) * 0.04).toFixed(3)}em`,
        } as CSSProperties;
        return (
          <span key={i}>
            <span className="hero-word inline-block" data-t={word} style={style}>
              <span className="hero-ink inline-block">{word}</span>
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </>
  );
}

// Decides before first paint whether this visit plays the intro: once per session, never with
// reduced motion, never when arriving at an anchor. It marks its own section, which therefore
// suppresses the hydration warning for that one attribute.
const INTRO_SCRIPT = `(function(){var s=document.currentScript&&document.currentScript.parentElement;if(!s)return;try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("rouang-intro")||location.hash){s.setAttribute("data-intro","none");return}sessionStorage.setItem("rouang-intro","1");s.setAttribute("data-intro","play")}catch(e){s.setAttribute("data-intro","none")}})();`;

/**
 * `handoff`: Selected Work's pinned scene follows and takes over the view (SelectedWork's
 * FlagshipScene). Only then does the hero stop being drawn at the end of its move; without it, the
 * hero scrolls away as ordinary content.
 */
export function HeroAperture({ areas, handoff }: { areas: string; handoff: boolean }) {
  const wall = wallProps();
  const scenery = sceneryProps();
  const masks = {
    ["--o-mask-desktop" as string]: `url("${OPENING_MASKS.desktop}")`,
    ["--o-mask-portrait" as string]: `url("${OPENING_MASKS.portrait}")`,
  } as CSSProperties;

  return (
    <section
      data-tone="dark"
      data-hero
      data-handoff={handoff ? "" : undefined}
      aria-labelledby="hero-title"
      className="hero-track relative"
      style={masks}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      {/* The opening's shape clips the words, so it is needed with the first paint. React places
          these in the head; the media queries match the CSS's switch between the two walls. */}
      <link rel="preload" as="image" href={OPENING_MASKS.portrait} media="(max-aspect-ratio: 4/5)" fetchPriority="high" />
      <link rel="preload" as="image" href={OPENING_MASKS.desktop} media="not all and (max-aspect-ratio: 4/5)" fetchPriority="high" />

      <div className="hero-stage relative">
        {/* The view through the O: the client's photograph, behind the wall. It moves less than the
            wall as the visitor passes through, as a distant view does. */}
        <div className="hero-scenery" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- an optimised srcset from getImageProps */}
          <img {...scenery} alt="" />
        </div>

        {/* The wall with the O built into it (scripts/render/o-installation). The opening is transparent. */}
        <div className="hero-scene">
          <picture className="hero-wall">
            <source media="(max-aspect-ratio: 4/5)" srcSet={wall.portrait.srcSet} sizes={wall.portrait.sizes} />
            {/* An art-directed <picture> built with getImageProps, as the Next.js image docs describe. */}
            <img {...wall.desktop} alt={HERO_ALT} loading="eager" fetchPriority="high" />
          </picture>

          {/* The words, inside the opening. */}
          <div className="hero-o">
            <div className="hero-mist" aria-hidden="true">
              <span className="hero-mist-1" />
              <span className="hero-mist-2" />
              <span className="hero-mist-3" />
            </div>

            {/* What assistive technology reads, once, whichever way the page is animated: the heading
                and the description. The animated copies are for the eye only. */}
            <h1 id="hero-title" className="hero-statement">
              <span className="visually-hidden">{`${STATEMENT.join(" ")} ${studio.descriptor}, ${areas}.`}</span>
              <span aria-hidden="true">
                <Disperse lines={STATEMENT} />
              </span>
            </h1>
            <p className="visually-hidden">{DESCRIPTION}</p>

            <p className="hero-copy" aria-hidden="true">
              {/* One flex item, so the words flow as a paragraph. */}
              <span>
                <Condense text={DESCRIPTION} />
              </span>
            </p>
          </div>
        </div>

        {/* A little shade under the header, so the white navigation reads on the concrete. */}
        <div className="hero-shade" aria-hidden="true" />
      </div>

      {/* Without scroll-driven animation, the description follows the hero instead. */}
      <p className="hero-copy-static page-x" aria-hidden="true">
        {DESCRIPTION}
      </p>

      {/* The intro. Decorative and silent for assistive technology: the page beneath is already there. */}
      <div className="intro" aria-hidden="true">
        <div className="intro-white" />
        <div className="intro-word">
          {/* One drawing per letter, each with room around it, so a letter can soften and fade
              without being cut off at the edge of the word. */}
          {WORDMARK.paths.map((p, i) => (
            <svg
              key={i}
              className={`intro-letter intro-letter-${i}`}
              viewBox={`${-PAD} ${-PAD} ${WORDMARK.width + PAD * 2} ${WORDMARK.height + PAD * 2}`}
              fill="currentColor"
            >
              <path transform={`matrix(${p.m.join(",")})`} d={p.d} />
            </svg>
          ))}
        </div>
        {/* The O that grows into the opening: the glyph itself, which gives way to a fine outline of
            the same silhouette (its stroke stays hairline thin at any size). */}
        <svg className="intro-o" viewBox={`0 0 ${MARK.width} ${MARK.height}`} preserveAspectRatio="none">
          {MARK.paths.map((p, i) => (
            <g key={i} transform={`matrix(${p.m.join(",")})`}>
              <path className="intro-o-fill" d={p.d} fill="currentColor" />
              <path className="intro-o-line" d={p.d} fill="none" stroke="currentColor" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
      </div>
      <HeroIntroControl />
      {/* 100svh down: by then the statement and description have finished arriving or leaving. */}
      <span className="hero-text-past" aria-hidden="true" />
      <HeroTextRelease />
    </section>
  );
}

/** Room, in wordmark units, around each intro letter for its blur and soft mask. */
const PAD = 16;

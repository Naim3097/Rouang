"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/** The film in three cuts, so a screen downloads only the one it can show. */
export type FilmSources = {
  /** 1920×1080, for landscape screens with the pixels to show it. */
  wide: string;
  /** 1280×720, for smaller landscape screens. */
  mid: string;
  /** A 9:16 slice from the middle of the frame, for phones held upright. */
  tall: string;
};

/** The share of the hero's pinned scroll that runs the film (180svh of 240svh). Over the rest the last frame holds,
 * then fades to the dark ground (styles/home/hero.css). */
const RUN = 0.75;
/** How far the drawn frame closes on the scrolled position each animation frame. The scroll itself already glides
 * (SmoothScroll), so this only takes the edge off seeks and a phone flick: kept light, so the film never trails the page. */
const EASE = 0.3;
/** How long a downloaded film may take to show its first frame before the stills are left in its place. */
const METADATA_MS = 8000;

/** The test HomeHero's script makes before first paint: motion allowed, and no Data Saver. */
function filmAllowed() {
  try {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !connection?.saveData;
  } catch {
    return true;
  }
}

/** An upright phone gets the slice from the middle; a landscape screen the cut its pixels can show. */
function pickCut(): keyof FilmSources {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return w / h < 0.62 ? "tall" : w * Math.min(window.devicePixelRatio || 1, 2) > 1400 ? "wide" : "mid";
}

/**
 * The hero's film, run by the scroll rather than the clock: it never plays on its own. Scrolling
 * down through the hero moves it forward, scrolling back moves it back, and it stops when the
 * scrolling stops.
 *
 * The hero is 240svh of scroll taller than the screen while its stage stays pinned (CSS, "Hero"),
 * and this maps how far through that the page is onto the film's time. It also writes that
 * progress to the hero as --film-p (0-1), which the CSS uses to fade the statement out as the film
 * starts (and, in a browser without scroll-driven animation, the film itself out at the end).
 *
 * The whole file is downloaded before the film takes over, so every scroll is a seek within memory
 * rather than a request; until then (or if it fails) the first and last frames stand in, as
 * stills. A screen that changes shape (a phone turned on its side) gets the cut that fits it, with
 * the stills standing in again while it loads.
 *
 * Only runs when the hero is marked data-film="on": not with reduced motion and not with Data
 * Saver, where the hero is a single still of the finished room instead. The hero's own script marks
 * it before first paint on a full page load; React never runs that script after a navigation within
 * the site, so then the same test is made here, before paint.
 */
export function HeroFilm({ sources, duration }: { sources: FilmSources; duration: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { wide, mid, tall } = sources;

  useLayoutEffect(() => {
    const hero = ref.current?.closest<HTMLElement>("[data-hero]");
    if (hero && !hero.dataset.film) hero.dataset.film = filmAllowed() ? "on" : "off";
  }, []);

  useEffect(() => {
    const video = ref.current;
    const hero = video?.closest<HTMLElement>("[data-hero]");
    if (!video || !hero || hero.dataset.film !== "on") return;

    const files = { wide, mid, tall };
    let job: AbortController | null = null;
    let cut: keyof FilmSources | null = null; // the cut being loaded or shown
    let url = "";
    let ready = false;
    let target = 0; // where the scroll says the film should be, 0-1
    let shown = 0; // where the drawn frame is, easing towards target
    let frame = 0;
    let repick = 0;
    // The hero's place in the page and its pinned scroll, read once and again only when a size
    // changes, so scrolling reads nothing from the layout (the scroll position aside).
    let top = 0;
    let run = 0;
    let written = "";
    // Never ask for a time past the last frame, which some browsers draw as black.
    const last = duration - 1 / 24;

    const seek = (t: number) => {
      if (!video.seeking && Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t;
    };

    const tick = () => {
      frame = 0;
      if (!ready) return;
      const gap = target - shown;
      shown = Math.abs(gap) < 0.0005 ? target : shown + gap * EASE;
      seek(shown * last);
      // Keep going until the frame has caught up with the scroll and the last seek has landed.
      if (shown !== target || video.seeking) frame = requestAnimationFrame(tick);
    };

    const geometry = () => {
      top = hero.getBoundingClientRect().top + window.scrollY;
      run = hero.offsetHeight - window.innerHeight;
    };

    // On every scroll event while the hero is on screen. It writes to the hero (which restyles it)
    // only when the value has changed.
    const measure = () => {
      const p = run > 0 ? Math.min(1, Math.max(0, (window.scrollY - top) / run)) : 0;
      const value = p.toFixed(4);
      if (value !== written) hero.style.setProperty("--film-p", (written = value));
      target = Math.min(1, p / RUN);
      if (!frame && (shown !== target || video.seeking)) frame = requestAnimationFrame(tick);
    };

    const load = (next: keyof FilmSources) => {
      job?.abort();
      const { signal } = (job = new AbortController());
      cut = next;
      ready = false;
      delete hero.dataset.filmState;
      const once = { once: true, signal };

      fetch(files[next], { signal })
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`${r.status}`))))
        .then(
          (blob) =>
            new Promise<void>((resolve, reject) => {
              if (signal.aborted) return reject(signal.reason);
              // Wait for the first frame, but not for ever: a browser that never gets there leaves the stills in place.
              const timer = window.setTimeout(() => reject(new Error("metadata")), METADATA_MS);
              const settle = (done: () => void) => () => {
                window.clearTimeout(timer);
                done();
              };
              signal.addEventListener("abort", settle(() => reject(signal.reason)), { once: true });
              video.addEventListener("loadedmetadata", settle(resolve), once);
              video.addEventListener("error", settle(() => reject(video.error)), once);
              if (url) URL.revokeObjectURL(url);
              url = URL.createObjectURL(blob);
              video.src = url;
            }),
        )
        .then(async () => {
          // Some mobile browsers draw nothing on a seek until a film has played once. It is muted and
          // still hidden, and stopped at once, so nothing is seen of this.
          try {
            await video.play();
          } catch {
            // Refused (a phone in low-power mode): seeking still works in current browsers.
          }
          video.pause();
          if (signal.aborted) return;
          // Start from wherever the scroll already is, not from the beginning.
          shown = target;
          video.currentTime = shown * last;
          await Promise.race([
            new Promise((resolve) => video.addEventListener("seeked", resolve, once)),
            new Promise((resolve) => window.setTimeout(resolve, 600)),
          ]);
          if (signal.aborted) return;
          ready = true;
          hero.dataset.filmState = "ready";
          measure();
        })
        .catch(() => {
          if (!signal.aborted) hero.dataset.filmState = "failed";
        });
    };

    const onResize = () => {
      geometry();
      measure();
      window.clearTimeout(repick);
      repick = window.setTimeout(() => {
        // The wide cut serves every screen. Any other is swapped when the screen no longer suits it:
        // the upright slice on a screen turned on its side, the smaller cut on one that has grown.
        const next = pickCut();
        if (cut !== "wide" && next !== cut) load(next);
      }, 250);
    };

    // The hero's own height can change without the window's (a font arriving above it, a banner).
    const sized = new ResizeObserver(() => {
      geometry();
      measure();
    });

    // The scroll is followed only while the hero is on screen: reading the scroll position makes the
    // browser bring its layout up to date, and further down the page the hero has nothing to do.
    // Leaving, it settles once more where the scroll left it (the end of the film). A quick flick can
    // hand over several crossings at once; the last one is where the hero is now.
    const near = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      measure();
      if (entry.isIntersecting) window.addEventListener("scroll", measure, { passive: true });
      else window.removeEventListener("scroll", measure);
    });

    load(pickCut());
    geometry();
    measure();
    sized.observe(hero);
    near.observe(hero);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      job?.abort();
      sized.disconnect();
      near.disconnect();
      window.clearTimeout(repick);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", onResize);
      delete hero.dataset.filmState;
      hero.style.removeProperty("--film-p");
      video.removeAttribute("src");
      video.load();
      if (url) URL.revokeObjectURL(url);
    };
  }, [wide, mid, tall, duration]);

  return (
    <video
      ref={ref}
      className="home-hero-film"
      muted
      playsInline
      // It has no source until the whole file is in memory, so this asks for nothing early. It must
      // not be "none": Safari and Firefox would then never read the file it is given.
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

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
/** How long a downloaded film may take to show its first frame before the stills are left in its place. */
const METADATA_MS = 8000;
/** While the film plays, a gap to the scroll closes over about this long (seconds): the rate is the scroll's own pace
 * through the film, plus the gap over this. Short, so the film never trails the page. */
const CATCH_UP = 0.25;
/** The slowest and fastest rates to ask for (Chrome and Firefox refuse anything outside 1/16 to 16). */
const MIN_RATE = 0.0625;
const MAX_RATE = 16;
/** Plays (rather than seeks) only up to these rates: in at PLAY_IN, out above PLAY_OUT. */
const PLAY_IN = 1.8;
const PLAY_OUT = 2.4;
/** A scroll pace (seconds of film a second) below this counts as standing still. */
const STILL = 0.02;
/** Further ahead than this (seconds of film) and the film jumps rather than races: a link to the foot of the page, a
 * dragged scrollbar. */
const JUMP = 1.5;
/** A seek that has not landed in this long is given up on, so one lost event never stops the film. */
const SEEK_MS = 1000;

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

// ——— LAB (temporary, for measurement only; removed before hand-off) ———
type Lab = { mode?: "old" | "seek" | "rvfc" | "play" | "hybrid"; src?: "old" };
function readLab(): Lab {
  try {
    return JSON.parse(sessionStorage.getItem("hero-film-lab") || "{}") as Lab;
  } catch {
    return {};
  }
}
// ——— END LAB ———

/**
 * The hero's film, run by the scroll rather than the clock: it never plays on its own. Scrolling
 * down through the hero moves it forward, scrolling back moves it back, and it holds when the
 * scrolling stops.
 *
 * The hero is 240svh of scroll taller than the screen while its stage stays pinned (CSS, "Hero"),
 * and this maps how far through that the page is onto the film's time. It also writes that
 * progress to the hero as --film-p (0-1), which the CSS uses to fade the statement out as the film
 * starts (and, in a browser without scroll-driven animation, the film itself out at the end).
 *
 * How the film follows the scroll, so that it never stutters:
 * - Forwards, the browser plays it, at the pace the scroll is moving through it plus whatever
 *   closes the gap, and pauses it when it has caught up. Playing is the browser's smoothest path:
 *   it decodes ahead and puts each frame on screen itself, even while the page is busy, where a
 *   seek per animation frame waits on the page every time.
 * - Backwards (no browser plays a film in reverse), for a jump too far to race, and wherever the
 *   browser will not play it (a phone in low-power mode), it seeks: one seek at a time, each to
 *   the latest frame the scroll asks for, the next only once the last has landed. The cuts have a
 *   keyframe every 6 frames and no B-frames (scripts/media/hero-film.cjs), so a seek decodes at
 *   most 5 frames besides its own.
 * - Every target is the middle of a frame, so the frame shown is never in doubt, and the film
 *   always comes to rest on the frame the scroll stopped at.
 *
 * The whole file is downloaded before the film takes over, so every seek is within memory rather
 * than a request; until then (or if it fails) the first and last frames stand in, as stills. A
 * screen that changes shape (a phone turned on its side) gets the cut that fits it, with the
 * stills standing in again while it loads.
 *
 * Only runs when the hero is marked data-film="on": not with reduced motion and not with Data
 * Saver, where the hero is a single still of the finished room instead. The hero's own script marks
 * it before first paint on a full page load; React never runs that script after a navigation within
 * the site, so then the same test is made here, before paint.
 */
export function HeroFilm({ sources, duration, fps }: { sources: FilmSources; duration: number; fps: number }) {
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

    // ——— LAB ———
    const lab = readLab();
    const oldFiles = {
      wide: "/films/hero/_old/rembayung-film-1080.mp4",
      mid: "/films/hero/_old/rembayung-film-720.mp4",
      tall: "/films/hero/_old/rembayung-film-portrait.mp4",
    };
    const labFps = lab.src === "old" ? 24 : fps;
    // ——— END LAB ———

    const files = lab.src === "old" ? oldFiles : { wide, mid, tall };
    const frames = Math.round(duration * labFps);
    const step = 1 / labFps;
    /** The frame a time falls in. */
    const frameAt = (t: number) => Math.min(frames - 1, Math.max(0, Math.floor(t * labFps + 1e-4)));

    let job: AbortController | null = null;
    let cut: keyof FilmSources | null = null; // the cut being loaded or shown
    let url = "";
    let ready = false;
    let canPlay = lab.mode === "play" || lab.mode === "hybrid";
    // Where the scroll says the film should be, in seconds: always the middle of a frame.
    let target = step / 2;
    let previous = target; // the target at the last animation frame
    let pace = 0; // how fast the scroll is moving through the film, in seconds of film a second
    let landing = false; // a seek in flight
    let landTimer = 0;
    let repick = 0;
    let raf = 0;
    let then = 0; // the last animation frame's time
    let playedFrom = -1; // where the film last started playing, to see that it does move
    let playedAt = 0;
    // The hero's place in the page and its pinned scroll, read once and again only when a size
    // changes, so scrolling reads nothing from the layout (the scroll position aside).
    let top = 0;
    let run = 0;
    let written = "";
    let progress = 0; // LAB: the old mode's 0-1 target
    let shown = 0; // LAB: the old mode's eased position

    const land = () => {
      landing = false;
      window.clearTimeout(landTimer);
      wake();
    };

    const seek = (t: number) => {
      landing = true;
      window.clearTimeout(landTimer);
      landTimer = window.setTimeout(land, SEEK_MS);
      video.currentTime = t;
      // LAB: the alternative gate, on the frame being presented rather than the seek landing.
      if (lab.mode === "rvfc" && "requestVideoFrameCallback" in video) video.requestVideoFrameCallback(() => land());
    };

    const play = () => {
      playedFrom = video.currentTime;
      playedAt = performance.now();
      video.play().catch(() => {
        // Refused (a phone in low-power mode): from here on the film only seeks.
        canPlay = false;
        wake();
      });
    };

    let rateAt = 0;
    const setRate = (r: number, now: number) => {
      const rate = Math.min(MAX_RATE, Math.max(MIN_RATE, r));
      const change = Math.abs(rate / video.playbackRate - 1);
      // Only a real change, and not every frame: each write resets the browser's frame timing.
      if (change > 0.25 || (change > 0.06 && now - rateAt > 250)) {
        rateAt = now;
        try {
          video.playbackRate = rate;
        } catch {
          // Outside this browser's range: keep the last rate.
        }
      }
    };
    const playIn = lab.mode === "play" ? MAX_RATE : PLAY_IN;
    const playOut = lab.mode === "play" ? MAX_RATE : PLAY_OUT;

    const tick = (now: number) => {
      raf = 0;
      if (!ready) return;

      // ——— LAB: the previous algorithm, verbatim ———
      if (lab.mode === "old") {
        const last = duration - 1 / 24;
        const gap = progress - shown;
        shown = Math.abs(gap) < 0.0005 ? progress : shown + gap * 0.3;
        const t = shown * last;
        if (!video.seeking && Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t;
        if (shown !== progress || video.seeking) raf = requestAnimationFrame(tick);
        return;
      }
      // ——— END LAB ———

      const dt = then ? Math.min(0.1, Math.max(0.004, (now - then) / 1000)) : 0;
      then = now;
      if (dt) pace += ((target - previous) / dt - pace) * 0.3;
      previous = target;
      const still = Math.abs(pace) < STILL;

      // A film that was told to play and has not moved in half a second will not play here.
      if (playedFrom >= 0 && now - playedAt > 500) {
        if (!video.paused && Math.abs(video.currentTime - playedFrom) < 0.001) canPlay = false;
        playedFrom = -1;
      }

      if (!landing) {
        const at = video.currentTime;
        const ahead = target - at;
        const there = frameAt(at) === frameAt(target);
        // Playing on from the end would start the film again from the beginning.
        const atEnd = video.ended || at >= (frames - 0.5) * step;
        const want = pace + ahead / CATCH_UP;
        const forward =
          canPlay &&
          !atEnd &&
          ahead < JUMP &&
          (still ? ahead > 0 && !there : pace > 0 && ahead > -2 * step) &&
          want <= (video.paused ? playIn : playOut);

        if (forward) {
          setRate(want, now);
          if (video.paused) play();
        } else {
          if (!video.paused) video.pause();
          // Behind the film, far ahead of it, or where it cannot play: seek, to the frame the scroll is on.
          if (frameAt(video.currentTime) !== frameAt(target)) seek(target);
        }
      }

      const settled = video.paused && !landing && still && frameAt(video.currentTime) === frameAt(target);
      if (!settled) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (ready && !raf) {
        then = 0;
        raf = requestAnimationFrame(tick);
      }
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
      progress = Math.min(1, p / RUN);
      target = (progress * (frames - 1) + 0.5) * step;
      wake();
    };

    const load = (next: keyof FilmSources) => {
      job?.abort();
      const { signal } = (job = new AbortController());
      cut = next;
      ready = false;
      landing = false;
      pace = 0;
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
          // still hidden, and stopped at once, so nothing is seen of this. It also tells whether this
          // browser will play the film at all, or only seek it.
          try {
            await video.play();
          } catch {
            // Refused (a phone in low-power mode): seeking still works in current browsers.
            canPlay = false;
          }
          video.pause();
          video.playbackRate = 1;
          if (signal.aborted) return;
          // Start from wherever the scroll already is, not from the beginning.
          shown = progress;
          video.currentTime = lab.mode === "old" ? shown * (duration - 1 / 24) : target;
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

    video.muted = true;
    video.addEventListener("seeked", land);
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
      window.clearTimeout(landTimer);
      cancelAnimationFrame(raf);
      video.removeEventListener("seeked", land);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", onResize);
      delete hero.dataset.filmState;
      hero.style.removeProperty("--film-p");
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (url) URL.revokeObjectURL(url);
    };
  }, [wide, mid, tall, duration, fps]);

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

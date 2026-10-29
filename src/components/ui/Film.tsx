"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type FilmSource = { src: string; media?: string };

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/**
 * A silent loop of real project footage, laid over its still. The page renders the still with
 * next/image as the first paint; the film fades in only once it is actually playing, so it never
 * delays the page or flashes black. It plays only while on screen, never for visitors who prefer
 * reduced motion, and has a visible pause control whenever it plays (WCAG 2.2.2).
 *
 * A source with `media` is used only where that media query matches. Where no source applies
 * (a phone-only loop on a desktop), nothing is rendered and the still remains.
 */
export function Film({
  sources,
  label,
  controlTone = "dark",
  compact = false,
}: {
  sources: FilmSource[];
  label: string;
  controlTone?: "light" | "dark";
  /** Smaller control for loops in a grid. */
  compact?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [shown, setShown] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  // False on the server, so the film never starts before the visitor's preference is known.
  const allowed = useSyncExternalStore(subscribeMotion, () => !window.matchMedia(REDUCED).matches, () => false);
  const applies = useSyncExternalStore(
    subscribeResize,
    () => sources.some((s) => !s.media || window.matchMedia(s.media).matches),
    () => false,
  );

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Switching reduced motion on mid-film stops it straight away.
    if (!allowed || userPaused) {
      video.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (video.preload === "none") video.preload = "auto";
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [allowed, userPaused, applies]);

  if (!applies || (!allowed && !playing)) return null;

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      video.play().catch(() => undefined);
    } else {
      setUserPaused(true);
      video.pause();
    }
  };

  return (
    <div className="absolute inset-0">
      <video
        ref={ref}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-brand)] ${shown ? "opacity-100" : "opacity-0"}`}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onPlaying={() => {
          setPlaying(true);
          setShown(true);
        }}
        onPause={() => setPlaying(false)}
      >
        {sources.map((s) => (
          <source key={s.src} src={s.src} media={s.media} type="video/mp4" />
        ))}
      </video>
      {shown ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={`${playing ? "Pause" : "Play"} film: ${label}`}
          className={`t-label absolute z-10 inline-flex min-h-11 items-center gap-2.5 rounded-full ${
            compact ? "bottom-3 right-3 min-w-11 justify-center px-3" : "bottom-4 right-4 px-4"
          } ${controlTone === "dark" ? "bg-ink/70 text-kapur" : "bg-kapur/85 text-ink"}`}
        >
          <span aria-hidden="true" className="flex h-2.5 w-2.5 items-center justify-center gap-[3px]">
            {playing ? (
              <>
                <span className="h-2.5 w-[3px] bg-current" />
                <span className="h-2.5 w-[3px] bg-current" />
              </>
            ) : (
              <span className="h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current" />
            )}
          </span>
          {compact ? null : <span aria-hidden="true">{playing ? "Pause film" : "Play film"}</span>}
        </button>
      ) : null}
    </div>
  );
}

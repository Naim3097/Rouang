"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * A silent loop of real project footage. It only plays while on screen, never plays for visitors
 * who prefer reduced motion, and always has a visible pause control (WCAG 2.2.2).
 * The poster is the first paint, so the film never delays the page.
 */
export function Film({
  src,
  poster,
  width,
  height,
  label,
  className = "",
  controlTone = "dark",
  fill = false,
}: {
  src: string;
  poster: string;
  width: number;
  height: number;
  label: string;
  className?: string;
  controlTone?: "light" | "dark";
  fill?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  // False on the server, so the film never starts before the visitor's preference is known.
  const allowed = useSyncExternalStore(subscribeMotion, () => !window.matchMedia(REDUCED).matches, () => false);

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
  }, [allowed, userPaused]);

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
    <div className={`relative ${fill ? "h-full w-full" : ""} ${className}`} style={fill ? undefined : { aspectRatio: `${width}/${height}` }}>
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        width={width}
        height={height}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={src} type="video/mp4" />
      </video>
      {allowed || playing ? (
        <button
          type="button"
          onClick={toggle}
          className={`t-label absolute bottom-4 right-4 z-10 inline-flex min-h-11 items-center gap-2.5 rounded-full px-4 ${
            controlTone === "dark" ? "bg-ink/70 text-kapur" : "bg-kapur/85 text-ink"
          }`}
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
          {playing ? "Pause film" : "Play film"}
        </button>
      ) : null}
    </div>
  );
}

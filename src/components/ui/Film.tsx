"use client";

import { useEffect, useRef, useState } from "react";

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
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAllowed(!mq.matches);
    const onChange = () => setAllowed(!mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !allowed || userPaused) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (video.preload === "none") video.preload = "auto";
          video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
          video.pause();
          setPlaying(false);
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
      video.play().then(() => setPlaying(true)).catch(() => undefined);
    } else {
      setUserPaused(true);
      video.pause();
      setPlaying(false);
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
      >
        <source src={src} type="video/mp4" />
      </video>
      {allowed ? (
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

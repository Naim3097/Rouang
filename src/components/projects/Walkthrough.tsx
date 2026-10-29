"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/brand/Brand";

export type WalkFrame = {
  src: string;
  alt: string;
  width: number;
  height: number;
  focus?: string;
  /** One of the brand kit's three kinds of picture. */
  role: "Space" | "Material" | "Whole";
  caption: string;
};

/**
 * A walk through a project, driven by the visitor's own scrolling. The frame stays pinned while
 * each photograph opens out of the last through the circle of the mark. Real photographs only.
 *
 * Without JavaScript, or with reduced motion, it is simply the photographs in sequence.
 */
export function Walkthrough({
  frames,
  title,
  href,
  kicker,
}: {
  frames: WalkFrame[];
  title: string;
  href: string;
  kicker: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"static" | "pinned">("static");
  const layers = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setMode(reduce.matches ? "static" : "pinned");
    decide();
    reduce.addEventListener("change", decide);
    return () => reduce.removeEventListener("change", decide);
  }, []);

  useEffect(() => {
    if (mode !== "pinned") return;
    let frame = 0;
    const n = frames.length;
    const update = () => {
      frame = 0;
      const el = track.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / travel));
      const pos = p * (n - 1);
      let showing = 0;
      layers.current.forEach((layer, i) => {
        if (!layer) return;
        if (i === 0) return;
        // Each photograph opens over 70% of its step, centred on the step boundary.
        const t = Math.min(1, Math.max(0, (pos - (i - 1) - 0.15) / 0.7));
        const eased = 1 - Math.pow(1 - t, 3);
        // The caption follows the photograph that has mostly opened, not the scroll position.
        if (t >= 0.5) showing = i;
        layer.style.clipPath = `circle(${(eased * 75).toFixed(2)}% at 50% 50%)`;
        const img = layer.firstElementChild as HTMLElement | null;
        if (img) img.style.transform = `scale(${(1.12 - 0.12 * eased).toFixed(4)})`;
      });
      setActive(showing);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mode, frames.length]);

  if (mode === "static") {
    return (
      <div className="page-x space-y-16 pb-24">
        {frames.map((f, i) => (
          <figure key={f.src} className="grid gap-6 lg:grid-cols-12">
            <div className="relative aspect-[4/5] lg:col-span-6 lg:col-start-4">
              <Image src={f.src} alt={f.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" style={f.focus ? { objectPosition: f.focus } : undefined} />
            </div>
            <figcaption className="lg:col-span-3">
              <p className="t-label text-mouse">
                {String(i + 1).padStart(2, "0")} · {f.role}
              </p>
              <p className="t-quote mt-3 text-kapur">{f.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }

  const current = frames[active];

  return (
    <div ref={track} className="relative" style={{ height: `${frames.length * 85 + 20}svh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="page-x grid w-full items-center gap-8 lg:grid-cols-12 lg:gap-[var(--grid-gap)]">
          {/* The picture: photographs stacked, each opening out of the last. */}
          <div className="relative mx-auto aspect-[4/5] h-[min(62svh,40rem)] max-w-full lg:order-2 lg:col-span-5 lg:col-start-5 lg:h-[min(80svh,52rem)]">
            {frames.map((f, i) => (
              <div
                key={f.src}
                ref={(el) => {
                  layers.current[i] = el;
                }}
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: i === 0 ? undefined : "circle(0% at 50% 50%)", zIndex: i }}
                aria-hidden={i !== active}
              >
                <Image
                  src={f.src}
                  alt={i === active ? f.alt : ""}
                  fill
                  sizes="(min-width: 1024px) 42vw, 90vw"
                  className="object-cover will-change-transform"
                  style={f.focus ? { objectPosition: f.focus } : undefined}
                  loading={i < 2 ? "eager" : "lazy"}
                />
              </div>
            ))}
            <span className="pointer-events-none absolute -inset-5 rounded-full border border-dashed border-kapur/0" aria-hidden="true" />
          </div>

          {/* The words: what you are looking at, frame by frame. */}
          <div className="lg:order-1 lg:col-span-3">
            <p className="t-label text-mouse">{kicker}</p>
            <p className="mt-4 font-serif text-[clamp(2rem,1.4rem+2vw,3.25rem)] italic leading-none">{title}</p>
            <div className="mt-8 h-px w-full bg-kapur/15">
              <div className="h-px bg-rikyu transition-[width] duration-500" style={{ width: `${((active + 1) / frames.length) * 100}%` }} />
            </div>
            <div aria-live="polite" className="mt-6 min-h-[8.5rem]">
              <p className="t-label tabular-nums text-mouse">
                {String(active + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")} · {current.role}
              </p>
              <p key={current.src} className="t-quote mt-3 animate-[walk-in_0.7s_var(--ease-brand)_both] text-kapur">
                {current.caption}
              </p>
            </div>
            <Link href={href} className="group mt-8 inline-flex items-center gap-3 text-kapur">
              <span className="link-line">Read the case study</span>
              <Mark className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>

          <ol className="hidden lg:order-3 lg:col-span-2 lg:col-start-11 lg:block" aria-hidden="true">
            {frames.map((f, i) => (
              <li key={f.src} className={`t-caption flex items-center gap-3 py-1.5 transition-colors duration-500 ${i === active ? "text-kapur" : "text-kapur/35"}`}>
                <span className={`block h-px transition-all duration-500 ${i === active ? "w-8 bg-kapur" : "w-4 bg-kapur/35"}`} />
                {f.role}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

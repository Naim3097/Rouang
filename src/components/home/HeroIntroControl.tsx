"use client";

import { useEffect } from "react";

/** How long the intro takes to hand over to the page, in ms (keep in step with "Intro" in globals.css). */
const INTRO_MS = 9600;
/** How long a skipped intro takes to clear. */
const SKIP_MS = 800;
/** From here on the intro is only settling (the statement is arriving): a skip would replay it. */
const SETTLING_MS = 7900;

/**
 * Lets the visitor cut the intro short. The first scroll, touch, key or click during the intro
 * fast-forwards it to the finished hero; either way the overlay is then retired, so nothing of it
 * stays on the page. Timed from the intro's own CSS clock, not from hydration, which can come
 * seconds after the first frame. Renders nothing.
 */
export function HeroIntroControl() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (!hero || hero.dataset.intro !== "play") return;

    const clock = hero.querySelector(".intro")?.getAnimations()[0];
    const elapsed = () => {
      const now = document.timeline.currentTime;
      return clock && clock.startTime !== null && typeof now === "number" ? now - Number(clock.startTime) : 0;
    };
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    let timer = window.setTimeout(() => finish(), Math.max(0, INTRO_MS - elapsed()));

    function finish() {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, skip));
      if (hero) hero.dataset.intro = "done";
    }

    function skip() {
      if (!hero || hero.dataset.intro !== "play") return;
      if (elapsed() >= SETTLING_MS) return finish();
      hero.dataset.intro = "skip";
      events.forEach((e) => window.removeEventListener(e, skip));
      window.clearTimeout(timer);
      timer = window.setTimeout(() => finish(), SKIP_MS);
    }

    events.forEach((e) => window.addEventListener(e, skip, { passive: true, once: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, skip));
    };
  }, []);

  return null;
}

/**
 * Once the page is scrolled past the hero's words (the .hero-text-past mark, 100svh down), marks
 * the section so their scroll animations are switched off (globals.css): each word then rests in
 * its final state, and the browser can let go of the many small layers those animations keep.
 * Scrolling back above the mark turns them on again. Renders nothing.
 */
export function HeroTextRelease() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const mark = hero?.querySelector(".hero-text-past");
    if (!hero || !mark) return;
    const io = new IntersectionObserver(([e]) => {
      hero.toggleAttribute("data-text-past", !e.isIntersecting && e.boundingClientRect.top < 0);
    });
    io.observe(mark);
    return () => io.disconnect();
  }, []);

  return null;
}

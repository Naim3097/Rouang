"use client";

import { useEffect } from "react";

/** When the intro has finished fading onto the page, in ms (keep in step with "Intro" in styles/home/hero.css). */
const INTRO_MS = 5600;
/** From here on the intro is already fading out: a skip would only restart the fade. */
const FADING_MS = 4500;
/** How long a skipped intro takes to clear. */
const SKIP_MS = 800;
/** Keys that would scroll the page beneath the intro. Tab still moves focus. */
const SCROLL_KEYS = new Set([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"]);

/**
 * Lets the visitor cut the intro short. The first scroll, touch, key or click while the word is
 * being spelled fades the intro straight out; either way the overlay is then retired, so nothing
 * of it stays on the page. Timed from the intro's own CSS clock, not from hydration, which can
 * come seconds after the first frame. Renders nothing.
 *
 * The gesture that skips the intro does not also scroll the page beneath it: until the overlay has
 * cleared, the wheel, a finger and the scrolling keys are held (Lenis leaves the overlay's wheel
 * alone, see HomeHero), so the visitor arrives at the top of the hero with the statement whole.
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
    const stopListening = () => events.forEach((e) => window.removeEventListener(e, skip));
    let timer = window.setTimeout(() => finish(), Math.max(0, INTRO_MS - elapsed()));

    const hold = (e: Event) => {
      if (e.cancelable && (!(e instanceof KeyboardEvent) || SCROLL_KEYS.has(e.key))) e.preventDefault();
    };
    const holds = ["wheel", "touchmove", "keydown"] as const;
    holds.forEach((e) => window.addEventListener(e, hold, { passive: false }));
    const release = () => holds.forEach((e) => window.removeEventListener(e, hold));

    function finish() {
      window.clearTimeout(timer);
      stopListening();
      release();
      if (hero) hero.dataset.intro = "done";
    }

    function skip() {
      if (!hero || hero.dataset.intro !== "play") return;
      stopListening();
      // Already fading: let it finish as it is.
      if (elapsed() >= FADING_MS) return;
      hero.dataset.intro = "skip";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => finish(), SKIP_MS);
    }

    events.forEach((e) => window.addEventListener(e, skip, { passive: true, once: true }));
    return () => {
      window.clearTimeout(timer);
      stopListening();
      release();
    };
  }, []);

  return null;
}

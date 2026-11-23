"use client";

import { useEffect } from "react";

/**
 * Keyboard reach for a pinned scene whose links are revealed by scrolling: the other projects
 * (styles/home/showcase.css), 02 Studio (studio.css) and Inside a project (inside.css). The flagship
 * scene has its own (FlagshipRun). Tabbing into one, the browser scrolls only as far as the link's
 * own box, not as far as the reveal, so focus would otherwise land on a link that is still hidden or
 * on its way in. When keyboard focus enters the scene while its stage is pinned (it sticks to the
 * top of the screen), the page moves straight on to `settle` of the way through the pinned run,
 * where every reveal in it has finished.
 *
 * Never backwards, only for keyboard focus (a mouse or touch press focuses a link too, and must not
 * move the page), and only where the reveals run: scroll-driven animation, motion allowed.
 * Renders nothing.
 */
export function RevealFocus({ scene: selector, settle }: { scene: string; settle: number }) {
  useEffect(() => {
    const animated =
      CSS.supports("animation-timeline: view()") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = document.querySelector<HTMLElement>(selector);
    const stage = scene?.firstElementChild;
    if (!animated || !scene || !stage) return;

    const onFocus = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement) || !target.matches(":focus-visible")) return;
      if (getComputedStyle(stage).position !== "sticky") return;
      const top = scene.getBoundingClientRect().top + window.scrollY + settle * (scene.offsetHeight - window.innerHeight);
      if (window.scrollY < top - 1) window.scrollTo({ top, behavior: "instant" });
    };
    scene.addEventListener("focusin", onFocus);
    return () => scene.removeEventListener("focusin", onFocus);
  }, [selector, settle]);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * Keyboard reach for the pinned flagship scene. Its links are revealed by scrolling (globals.css,
 * "01 Work"), so focus arriving by Tab would otherwise land on a link that is still hidden, or
 * still under the hero's last screen. When focus enters the scene before it has settled, the page
 * moves straight to where everything in it is shown. Only for keyboard focus, and only in the
 * pinned, animated version of the scene; renders nothing.
 */
export function FlagshipFocus() {
  useEffect(() => {
    const pinned =
      CSS.supports("animation-timeline: view()") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = document.querySelector<HTMLElement>(".work-scene");
    const feature = scene?.querySelector<HTMLElement>(".work-feature");
    if (!pinned || !scene || !feature) return;

    const onFocus = (e: FocusEvent) => {
      // Keyboard focus only: a mouse or touch press focuses the link too, and must not move the page.
      if (!(e.target instanceof HTMLAnchorElement) || !e.target.matches(":focus-visible")) return;
      // 90% through the scene's pinned run: every reveal in it has finished by 86%.
      const top = scene.getBoundingClientRect().top + window.scrollY;
      const settled = top + 0.9 * (scene.offsetHeight - window.innerHeight);
      if (window.scrollY < settled - 1) window.scrollTo({ top: settled, behavior: "instant" });
    };
    feature.addEventListener("focusin", onFocus);
    return () => feature.removeEventListener("focusin", onFocus);
  }, []);

  return null;
}

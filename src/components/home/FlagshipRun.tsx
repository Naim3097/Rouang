"use client";

import { useEffect } from "react";

/**
 * Two pieces of help for the flagship scene (FlagshipScene, styles/home/work.css). Renders nothing.
 *
 * Photographs on time. The run's photographs wait off to the right of the pinned stage, which clips
 * them, so the browser's lazy loading would only fetch each one as it is about to come on screen.
 * Once the scene reaches the screen, they are all asked for at once (lazy becomes eager), so each is
 * in hand well before the strip brings it in.
 *
 * Keyboard reach. The flagship's links, its name and "Read the case study", are on its own panel,
 * which is in view and still only while it holds: before that it is still coming in from the right,
 * after it the strip has carried it off to the left. So when keyboard focus lands on either link
 * anywhere else in the scene's run, forwards (Tab) or backwards (Shift+Tab from the other
 * projects), the page moves straight to the middle of the hold, which the scene marks with
 * .work-hold. Only for keyboard focus (a press focuses a link too, and must not move the page), and
 * only while the stage is pinned: scroll-driven animation, motion allowed.
 */
export function FlagshipRun() {
  useEffect(() => {
    const scene = document.querySelector<HTMLElement>(".work-scene");
    if (!scene) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        scene.querySelectorAll<HTMLImageElement>(".work-strip img[loading='lazy']").forEach((img) => {
          img.loading = "eager";
        });
        io.disconnect();
      },
      // When the scene's top reaches the screen: after the film, that is halfway through its run, so
      // the film has had the line to itself first, and there are still screens of scroll to go.
      { rootMargin: "0px" },
    );
    io.observe(scene);

    const animated =
      CSS.supports("animation-timeline: view()") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = scene.querySelector<HTMLElement>(".work-stage");
    const lead = scene.querySelector<HTMLElement>(".work-lead");
    const hold = scene.querySelector<HTMLElement>(".work-hold");
    const onFocus = (e: FocusEvent) => {
      const target = e.target;
      if (!stage || !lead || !hold) return;
      if (!(target instanceof HTMLElement) || !lead.contains(target) || !target.matches(":focus-visible")) return;
      if (getComputedStyle(stage).position !== "sticky") return;
      const r = hold.getBoundingClientRect();
      const from = r.top + window.scrollY;
      // Already within the hold: leave the page where it is.
      if (window.scrollY >= from - 1 && window.scrollY <= from + r.height + 1) return;
      window.scrollTo({ top: from + r.height / 2, behavior: "instant" });
    };
    if (animated) scene.addEventListener("focusin", onFocus);

    return () => {
      io.disconnect();
      scene.removeEventListener("focusin", onFocus);
    };
  }, []);

  return null;
}

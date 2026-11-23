"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Smooth scrolling for the whole site (Lenis). A wheel or trackpad no longer moves the page in
 * steps: the page glides to where the input sends it, which also evens out everything the scroll
 * drives (the hero's film, the pinned scenes, the scroll-timed reveals). The page still scrolls
 * natively underneath, so sticky positioning, scroll timelines and the browser's own scroll
 * position all work as before; touch keeps the phone's own momentum.
 *
 * - In-page links (a service page's "See the work", the privacy notice's language links) glide too,
 *   and stop short of the header (the page's scroll-padding).
 * - It stands still while the page behind the open mobile menu is held (globals.css), and lets
 *   anything with its own scroll scroll itself.
 * - A click on a link to another page cuts any glide short, so the new page starts where Next puts it.
 * - Not with reduced motion: the page scrolls as the device does. Follows a change of that setting.
 *
 * Renders nothing.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const sync = () => {
      if (reduce.matches) {
        lenis?.destroy();
        lenis = null;
      } else if (!lenis) {
        lenis = new Lenis({
          autoRaf: true,
          anchors: true,
          autoToggle: true,
          allowNestedScroll: true,
          stopInertiaOnNavigate: true,
        });
      }
    };

    sync();
    reduce.addEventListener("change", sync);
    return () => {
      reduce.removeEventListener("change", sync);
      lenis?.destroy();
    };
  }, []);

  return null;
}

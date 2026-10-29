"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not([data-in]), [data-curve]:not([data-in])";

/**
 * Marks [data-reveal] and [data-curve] elements with `data-in` as they enter the viewport.
 * An attribute rather than a class, because React owns `className` and would flag it at hydration.
 * Pure progressive enhancement: the `js` class that hides them is set by an inline script,
 * and removed again if this never runs, so content is always reachable.
 *
 * Page content can stream in after the layout has hydrated (and stays mounted across
 * navigations), so new elements are picked up with a MutationObserver rather than a one-off scan.
 */
export function RevealObserver() {
  useEffect(() => {
    (window as unknown as { __rouangReveal?: boolean }).__rouangReveal = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      const showAll = () => document.querySelectorAll(SELECTOR).forEach((el) => el.setAttribute("data-in", ""));
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-in", "");
            io.unobserve(entry.target);
          }
        }
      },
      // Threshold 0 on purpose: Chrome applies a target's own clip-path to the intersection, so an
      // image waiting to be revealed (clip-path: inset(100% ...)) always reports a ratio of 0.
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );

    const watched = new WeakSet<Element>();
    const scan = (root: ParentNode) => {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (!watched.has(el)) {
          watched.add(el);
          io.observe(el);
        }
      });
    };
    scan(document);

    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan(document);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}

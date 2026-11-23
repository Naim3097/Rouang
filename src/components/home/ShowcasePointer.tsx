"use client";

import { useEffect } from "react";

/**
 * Hover that waits for the pointer. The cards of the other projects fill the screen, so a pointer
 * resting where the visitor left it is always over one of them, and the browser hovers whatever
 * scrolls under it: a card would open (widen, come up to colour) by itself as the row comes up and
 * lands. So when the cards move under a pointer at rest, the scene is marked data-pointer-rest, which
 * styles/home/showcase.css reads to hold hover back, until the pointer next moves over the row.
 * Turning the wheel while the row holds still (its pinned stretch) moves no card, so a card the
 * visitor has opened stays open; the cards widening and narrowing as one opens is not scrolling and
 * does not count. Hover itself is plain CSS: without this script, or before it runs, it simply
 * works. Keyboard focus is not affected. Renders nothing.
 */
export function ShowcasePointer() {
  useEffect(() => {
    const scene = document.querySelector<HTMLElement>(".showcase-scene");
    if (!scene) return;
    let rest = false;
    let moved = 0;
    // The card under the pointer when it last moved, and where that card was then.
    let card: HTMLElement | null = null;
    let top = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      moved = e.timeStamp;
      card = e.target instanceof Element ? e.target.closest<HTMLElement>(".showcase-card") : null;
      if (card) top = card.getBoundingClientRect().top;
      if (!rest) return;
      rest = false;
      scene.removeAttribute("data-pointer-rest");
    };
    // A smooth scroll runs on for a moment after the wheel stops; a pointer still moving through that
    // keeps its hover. A pointer that last moved off the cards holds back whatever scrolls under it.
    const onScroll = (e: Event) => {
      if (rest || e.timeStamp - moved < 150) return;
      if (card && Math.abs(card.getBoundingClientRect().top - top) < 1) return;
      rest = true;
      scene.setAttribute("data-pointer-rest", "");
    };

    scene.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scene.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}

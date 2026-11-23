"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";

/* How long the bar shows in full after the page loads (or after a tap opens it), and how long it
   stays open once the mouse or the focus leaves it, before it folds to its dot. */
const SHOW_MS = 4000;
const LINGER_MS = 1200;

/**
 * Visible only outside production, so a reviewer always knows drafts and placeholders are on show.
 * It opens in full, then folds to a small dot in the corner after a few seconds or as soon as the
 * page scrolls, so it never sits over the content of a pinned scene. Hovering the dot, focusing it
 * from the keyboard or tapping it opens it again (on touch, the first tap opens it and the second
 * follows the link). Folded, it is clipped, not shrunk: the link keeps its full name for assistive
 * technology, and only the dot takes clicks. Without JavaScript it simply stays open.
 * Not on a short screen (a phone on its side), where it would sit over the home hero's caption.
 */
export function PreviewBar() {
  const [folded, setFolded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const pointer = useRef("mouse");

  const foldAfter = (ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFolded(true), ms);
  };

  useEffect(() => {
    timer.current = window.setTimeout(() => setFolded(true), SHOW_MS);
    const startY = window.scrollY;
    const onScroll = () => {
      // A scroll position restored on load is not the visitor scrolling.
      if (Math.abs(window.scrollY - startY) < 40) return;
      window.clearTimeout(timer.current);
      setFolded(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer.current);
    };
  }, []);

  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    setFolded(false);
  };

  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") foldAfter(LINGER_MS);
  };

  return (
    // In the corner, 8px from the edges: folded, the dot ends at 36px, short of the page gutter on
    // laptops and desktops, and below pinned scenes' text on tablets (which clears the action bar).
    <div className="pointer-events-none fixed bottom-2 left-2 z-[55] hidden sm:[@media(min-height:30.0625rem)]:block">
      {/* Folded, the clip keeps only the 28px circle at the left end, around the green dot. */}
      <Link
        href="/preview"
        data-folded={folded ? "" : undefined}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={(e) => {
          pointer.current = e.pointerType;
        }}
        onClick={(e) => {
          // A tap on the folded dot opens the bar first; the next tap follows the link.
          if (folded && pointer.current !== "mouse") {
            e.preventDefault();
            setFolded(false);
            foldAfter(SHOW_MS);
          }
        }}
        onBlur={() => foldAfter(LINGER_MS)}
        className="pointer-events-auto t-label relative inline-flex h-7 items-center gap-2.5 whitespace-nowrap rounded-full border border-ink/15 bg-kapur/95 pl-[0.5625rem] pr-3.5 text-ink shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)] [clip-path:inset(-2rem_round_999px)] motion-safe:transition-[clip-path] motion-safe:duration-500 motion-safe:ease-[var(--ease-brand)] [&[data-folded]:not(:focus-visible)]:[clip-path:inset(0_calc(100%_-_1.75rem)_0_0_round_999px)]"
      >
        {/* The pill's own hairline only rounds its left end, so the folded dot draws its full ring. */}
        <span
          aria-hidden="true"
          className="absolute -left-px -top-px h-7 w-7 rounded-full opacity-0 shadow-[inset_0_0_0_1px_rgb(20_20_20/0.15)] motion-safe:transition-opacity motion-safe:duration-500 [[data-folded]:not(:focus-visible)>&]:opacity-100"
        />
        <span className="h-2 w-2 shrink-0 rounded-full bg-rikyu" aria-hidden="true" />
        <span>Preview · drafts visible · open checklist</span>
      </Link>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Image as ImageData } from "@/lib/content/schema";

/**
 * A before-and-after comparison: two photographs of a space in one frame, parted by a line the
 * visitor moves. The "before" photograph fills the frame and the "after" one is laid over it,
 * clipped to the right of the line, so moving the line only changes a clip (clip-path), never the
 * size of a picture. The line's place is one CSS number, --ba-pos (0 to 100, the share of the frame
 * showing "before"), set on the figure; styles/pages/services.css draws everything from it.
 *
 * - The handle on the line is the slider (role="slider"): Left and Right (or Down and Up) move it
 *   a step, Page Up and Page Down a larger one, Home and End to either edge.
 * - A mouse or pen pressed on the photographs moves the line there and drags it; pressed on the
 *   handle, it carries the line from where it is. The pointer is captured, so a drag can leave the frame.
 * - On a touch screen the page still scrolls under a vertical swipe (touch-action: pan-y); a
 *   sideways drag moves the line, and a tap moves it to the tap. A drag that starts on the handle
 *   moves the line at once.
 * - Once both photographs have loaded and half the frame is in view, the line makes one slow sweep
 *   to show that it moves. Never with reduced motion, and it stops the moment the visitor touches
 *   the frame or the keys.
 *
 * Each photograph keeps its own alt text. The labels default to "Before" and "After"; any caption
 * naming the project belongs to the page, under the figure, and only for a real pair.
 */
export function BeforeAfter({
  before,
  after,
  sizes,
  beforeLabel = "Before",
  afterLabel = "After",
  initial = 50,
  priority = false,
  className = "",
}: {
  before: ImageData;
  after: ImageData;
  /** `sizes` for both photographs: the frame's width (both are drawn to cover it). */
  sizes: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Where the line starts, as the share of the frame showing "before" (0 to 100). */
  initial?: number;
  /** Near the top of the page: load both photographs at once, the first at high priority. */
  priority?: boolean;
  className?: string;
}) {
  const [pos, setPos] = useState(() => clamp(initial));
  const [dragging, setDragging] = useState(false);
  const [sweep, setSweep] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  // The sweep waits for both photographs and for the frame to be half in view, and runs once at most.
  const cue = useRef({ loaded: 0, seen: false, done: false });
  // The pointer pressed on the frame: where it went down, whether it is dragging yet, and how far
  // from the line it took hold (a press on the handle carries the line without a jump).
  const press = useRef<{ id: number; x: number; moving: boolean; offset: number } | null>(null);
  const hintId = useId();

  const maybeSweep = () => {
    const c = cue.current;
    if (c.done || !c.seen || c.loaded < 2) return;
    c.done = true;
    setSweep(true);
  };
  const onImageLoad = () => {
    cue.current.loaded += 1;
    maybeSweep();
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Reduced motion: no sweep at all.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cue.current.done = true;
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        cue.current.seen = true;
        maybeSweep();
      },
      { threshold: 0.5 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  /** The visitor has taken hold: the sweep stops, and never starts later. */
  const takeOver = () => {
    cue.current.done = true;
    setSweep(false);
  };

  const posAt = (clientX: number) => {
    const r = frameRef.current?.getBoundingClientRect();
    return r && r.width ? clamp(((clientX - r.left) / r.width) * 100) : pos;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const onHandle = e.target instanceof Element && e.target.closest('[role="slider"]') !== null;
    const touch = e.pointerType === "touch";
    // Where the line is drawn right now, mid-sweep included.
    const root = rootRef.current;
    const shownAt = root ? parseFloat(getComputedStyle(root).getPropertyValue("--ba-pos")) : NaN;
    const current = Number.isFinite(shownAt) ? shownAt : pos;
    const r = e.currentTarget.getBoundingClientRect();
    takeOver();
    press.current = {
      id: e.pointerId,
      x: e.clientX,
      moving: !touch || onHandle,
      offset: onHandle ? e.clientX - (r.left + (current / 100) * r.width) : 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    // A mouse or pen pressed on the photographs moves the line there at once; pressed on the handle,
    // the line stays put until it is dragged. (No text is selected and no photograph dragged away:
    // the frame is user-select: none and the photographs are not draggable. A press on the handle
    // focuses it as any click would, without a focus ring.)
    setPos(!touch && !onHandle ? posAt(e.clientX) : current);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moving) {
      // A touch only takes the line once it moves sideways; a vertical swipe is the page's.
      if (Math.abs(e.clientX - p.x) < 6) return;
      p.moving = true;
    }
    if (!dragging) setDragging(true);
    setPos(posAt(e.clientX - p.offset));
  };

  const release = (e: PointerEvent<HTMLDivElement>, tap: boolean) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    // A tap that never moved sends the line to where it landed.
    if (tap && !p.moving) setPos(posAt(e.clientX));
    press.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const next =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? pos - step
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? pos + step
          : e.key === "PageDown"
            ? pos - 10
            : e.key === "PageUp"
              ? pos + 10
              : e.key === "Home"
                ? 0
                : e.key === "End"
                  ? 100
                  : null;
    if (next === null) return;
    e.preventDefault();
    takeOver();
    setPos(clamp(next));
  };

  const shown = Math.round(pos);

  return (
    <figure
      ref={rootRef}
      className={`ba ${className}`}
      style={{ ["--ba-pos" as string]: String(pos) }}
      data-dragging={dragging ? "" : undefined}
      data-sweep={sweep ? "" : undefined}
      onAnimationEnd={(e) => {
        if (e.animationName === "ba-sweep") setSweep(false);
      }}
    >
      <div
        ref={frameRef}
        className="ba-frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => release(e, true)}
        onPointerCancel={(e) => release(e, false)}
        onLostPointerCapture={(e) => release(e, false)}
      >
        <div className="ba-layer">
          <Image
            src={before.src}
            alt={before.alt}
            fill
            sizes={sizes}
            quality={78}
            draggable={false}
            onLoad={onImageLoad}
            loading={priority ? "eager" : undefined}
            fetchPriority={priority ? "high" : undefined}
            className="object-cover"
            style={before.focus ? { objectPosition: before.focus } : undefined}
          />
          <span className="ba-tag ba-tag-before t-label" aria-hidden="true">
            {beforeLabel}
          </span>
        </div>
        <div className="ba-layer ba-after">
          <Image
            src={after.src}
            alt={after.alt}
            fill
            sizes={sizes}
            quality={78}
            draggable={false}
            onLoad={onImageLoad}
            loading={priority ? "eager" : undefined}
            className="object-cover"
            style={after.focus ? { objectPosition: after.focus } : undefined}
          />
          <span className="ba-tag ba-tag-after t-label" aria-hidden="true">
            {afterLabel}
          </span>
        </div>
        <span className="ba-line" aria-hidden="true" />
        <span
          className="ba-handle"
          role="slider"
          tabIndex={0}
          aria-label={`${beforeLabel} and ${afterLabel.toLowerCase()} comparison`}
          aria-describedby={hintId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={shown}
          aria-valuetext={`${shown}% ${beforeLabel.toLowerCase()}, ${100 - shown}% ${afterLabel.toLowerCase()}`}
          onKeyDown={onKeyDown}
        >
          <svg viewBox="0 0 40 16" aria-hidden="true">
            <path d="M8 3 3 8l5 5M32 3l5 5-5 5" />
            <path d="M20 1v14" className="ba-handle-rule" />
          </svg>
        </span>
      </div>
      <figcaption id={hintId} className="ba-hint t-caption">
        <span className="ba-hint-fine">Drag the line or use the arrow keys to compare.</span>
        <span className="ba-hint-touch">Drag the line to compare.</span>
      </figcaption>
    </figure>
  );
}

function clamp(n: number) {
  return Math.min(100, Math.max(0, n));
}

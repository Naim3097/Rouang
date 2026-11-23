"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * An inline script that runs as the page's HTML is read, before anything is painted. It only
 * exists in the HTML of a full page load: React never runs a script it renders itself, so after a
 * navigation within the site it is left out (React would warn about it), and whatever depends on
 * it makes the same decision on the client instead.
 */
export function FirstPaintScript({ code }: { code: string }) {
  // True while the server's HTML is being hydrated, false for anything React renders afterwards.
  const fromHtml = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  return fromHtml ? <script dangerouslySetInnerHTML={{ __html: code }} /> : null;
}

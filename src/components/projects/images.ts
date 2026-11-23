import { publicImage } from "@/lib/content";
import type { Image, PendingImage } from "@/lib/content/schema";
import { SHOW_NOTES } from "@/lib/env";

/**
 * publicImage() for the Work pages, less the "Photograph to come" frames. A photograph the studio has
 * still to supply is an agency note, so, like the other notes, its frame shows on the local
 * development server only (SHOW_NOTES). Everywhere else it is simply absent, as it is in production,
 * and every layout on these pages already holds without it.
 */
export function shownImage<T extends Image | PendingImage>(img: T | null | undefined): T | null {
  const visible = publicImage(img ?? null);
  if (!visible) return null;
  return "pending" in visible && !SHOW_NOTES ? null : visible;
}

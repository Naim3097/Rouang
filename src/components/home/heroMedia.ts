import { getImageProps } from "next/image";
import files from "./heroFiles.json";

/**
 * The hero's images (public/images/hero, made by scripts/render/o-installation and published by its
 * site-geometry.cjs under content-hashed names, listed in heroFiles.json). Shared by the hero and
 * the Selected Work scene, which picks up the same view where the hero leaves it, so both must ask
 * for exactly the same file at the same sizes (the browser then reuses it).
 */
export const HERO_IMAGES = files;

/** A rendered installation, not a photograph of a ROUANG project: the description says what it shows and claims nothing. */
export const HERO_ALT = "The ROUANG emblem as an opening in a concrete wall, looking out to a lake at sunset";

/**
 * How wide each image is drawn, for the browser's choice from the srcset. The view is drawn at its
 * cover size (16:9, so on a tall phone screen far wider than the screen) times --sv-k1 in
 * globals.css (1.23 on landscape screens, 1.27 on phones, 1.64 on portrait tablets); the landscape
 * wall at its cover size (16:9); the portrait wall at about the screen's width.
 */
const SCENERY_SIZES = "max(123vw, 292vh)";
const WALL_SIZES = { desktop: "max(100vw, 178vh)", portrait: "100vw" } as const;
/** One of next.config.ts images.qualities. */
const QUALITY = 85;

/** The client's scenery, as the view through the O and, after it, the backdrop of Selected Work. */
export function sceneryProps() {
  return getImageProps({
    src: files.scenery.src,
    alt: "",
    width: files.scenery.width,
    height: files.scenery.height,
    sizes: SCENERY_SIZES,
    quality: QUALITY,
    loading: "eager",
    fetchPriority: "high",
  }).props;
}

export function wallProps() {
  const props = (img: { src: string; width: number; height: number }, sizes: string) =>
    getImageProps({ src: img.src, alt: "", width: img.width, height: img.height, sizes, quality: QUALITY }).props;
  return {
    desktop: props(files.wallDesktop, WALL_SIZES.desktop),
    portrait: props(files.wallPortrait, WALL_SIZES.portrait),
  };
}

/** The opening of each wall as a mask (white where the view shows through), for clipping the mist. */
export const OPENING_MASKS = { desktop: files.maskDesktop.src, portrait: files.maskPortrait.src };

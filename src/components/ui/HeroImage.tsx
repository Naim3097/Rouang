import { getImageProps } from "next/image";
import type { Image as ImageData } from "@/lib/content/schema";

/**
 * The opening photograph of a page, filling its parent. When the photograph has a `wide` crop,
 * large screens load that landscape file and phones keep the portrait, so neither downloads
 * rows it never shows. It is the page's largest paint, so it loads eagerly at high priority.
 */
export function HeroImage({
  image,
  narrowSizes,
  defaultFocus = "50% 50%",
}: {
  image: ImageData;
  /** `sizes` below 1024px, where the portrait is shown. */
  narrowSizes: string;
  defaultFocus?: string;
}) {
  const { wide } = image;
  const wideSet = wide
    ? getImageProps({ src: wide.src, alt: "", width: wide.width, height: wide.height, quality: 78, sizes: "100vw" }).props.srcSet
    : undefined;
  const { props } = getImageProps({
    src: image.src,
    alt: image.alt,
    fill: true,
    quality: 78,
    sizes: wide ? narrowSizes : `(min-width: 1024px) 100vw, ${narrowSizes}`,
    loading: "eager",
    fetchPriority: "high",
  });

  return (
    <picture>
      {wideSet ? <source media="(min-width: 1024px)" srcSet={wideSet} sizes="100vw" /> : null}
      {/* An art-directed <picture> built with getImageProps, as the Next.js image docs describe. */}
      <img
        {...props}
        alt={image.alt}
        // The wide crop is already centred on the focus line, so it sits centred.
        className={`object-cover [object-position:var(--focus)] ${wide ? "lg:[object-position:50%_50%]" : ""}`}
        style={{ ...props.style, ["--focus" as string]: image.focus ?? defaultFocus }}
      />
    </picture>
  );
}

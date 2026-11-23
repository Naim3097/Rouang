import Image from "next/image";
import { Mark } from "@/components/brand/Brand";
import type { Image as ImageData } from "@/lib/content/schema";

/**
 * An article's picture in a frame of set proportions. The frame's class gives its ratio at each width
 * (src/styles/pages/insights.css) and the photograph covers it, around its focus point.
 * Given no picture, the frame stays as a quiet plate with the mark in it, so a row of cards keeps one
 * rhythm when only some articles have a picture. Lists with no pictures at all leave the frame out.
 *
 * The frame sits after the words in the markup and is moved before them on screen, so a card's link
 * is announced by its title. Inside a link the picture is `decorative` (alt=""), as every picture in a
 * link on the site is: the link already names the article, and the photograph only illustrates its
 * subject. Only an article's own lead picture, outside any link, keeps its description.
 */
export function InsightPicture({
  image,
  sizes,
  className = "",
  lead = false,
  decorative = false,
}: {
  image: ImageData | null;
  sizes: string;
  className?: string;
  /** A picture in the first screen (an article's own, the index's first): loaded at once, without the settle. */
  lead?: boolean;
  /** The picture sits inside a link that already names the article: no description of its own. */
  decorative?: boolean;
}) {
  return (
    <div className={`ins-frame ${className}`} data-ins-frame="" data-reveal={image && !lead ? "image" : undefined}>
      <div className="absolute inset-0">
        {image ? (
          <Image
            src={image.src}
            alt={decorative ? "" : image.alt}
            fill
            sizes={sizes}
            quality={78}
            loading={lead ? "eager" : undefined}
            fetchPriority={lead ? "high" : undefined}
            className="ins-img object-cover"
            style={image.focus ? { objectPosition: image.focus } : undefined}
          />
        ) : (
          <div className="ins-plate" aria-hidden="true">
            <Mark className="ins-plate-mark" />
          </div>
        )}
      </div>
    </div>
  );
}

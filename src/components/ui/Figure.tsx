import Image from "next/image";
import { ViewTransition } from "react";
import type { Image as ImageData, PendingImage } from "@/lib/content/schema";

type FigureProps = {
  image: ImageData | PendingImage;
  sizes: string;
  /** CSS aspect-ratio. Defaults to the photograph's own proportions. */
  aspect?: string;
  priority?: boolean;
  reveal?: boolean;
  revealDelay?: number;
  className?: string;
  imgClassName?: string;
  tone?: "light" | "dark";
  /** Shared-element name so a project image can morph between the index and its case study. */
  transitionName?: string;
  showCaption?: boolean;
};

/**
 * A photograph, or, while the studio is still supplying it, a drawing-frame placeholder.
 * The placeholder borrows the architectural symbol for an opening: a rectangle crossed corner
 * to corner. Placeholders are filtered out of production by the content layer.
 */
export function Figure({
  image,
  sizes,
  aspect,
  priority = false,
  reveal = true,
  revealDelay = 0,
  className = "",
  imgClassName = "",
  tone = "light",
  transitionName,
  showCaption = false,
}: FigureProps) {
  const isPending = "pending" in image;
  const ratio = aspect ?? (isPending ? image.aspect : `${image.width}/${image.height}`);

  const frame = isPending ? (
    <PendingFrame label={image.pending} tone={tone} />
  ) : (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      quality={78}
      className={`object-cover ${imgClassName}`}
      style={image.focus ? { objectPosition: image.focus } : undefined}
    />
  );

  const box = (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ aspectRatio: ratio, ["--reveal-delay" as string]: `${revealDelay}ms` }}
      data-reveal={reveal && !priority ? "image" : undefined}
    >
      <div className="absolute inset-0">{frame}</div>
    </div>
  );

  const caption = !isPending && showCaption && (image.caption || image.credit) ? (
    <figcaption className={`t-caption mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 ${tone === "dark" ? "text-mouse" : "text-ink-muted"}`}>
      {image.caption ? <span>{image.caption}</span> : <span />}
      {image.credit ? <span>Photograph: {image.credit}</span> : null}
    </figcaption>
  ) : null;

  return (
    <figure className={className}>
      {transitionName ? (
        <ViewTransition name={transitionName} share="project-image" default="none">
          {box}
        </ViewTransition>
      ) : (
        box
      )}
      {caption}
    </figure>
  );
}

function PendingFrame({ label, tone }: { label: string; tone: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div
      className={`absolute inset-0 ${dark ? "bg-ink-raised text-kapur" : "bg-kapur-deep text-ink"}`}
      role="img"
      aria-label={`Photograph to come: ${label}`}
    >
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        <g stroke="currentColor" strokeOpacity={dark ? 0.16 : 0.18} fill="none">
          <rect x="0.5" y="0.5" width="99" height="99" vectorEffect="non-scaling-stroke" />
          <path d="M0 0 L100 100 M100 0 L0 100" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <span className="cross left-4 top-4" />
      <span className="cross right-4 top-4 translate-x-1/2" />
      <span className="cross bottom-4 left-4 translate-y-1/2" />
      <span className="cross bottom-4 right-4 translate-x-1/2 translate-y-1/2" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
        <p className={`t-caption max-w-[28ch] ${dark ? "bg-ink-raised text-mouse" : "bg-kapur-deep text-ink-muted"} pr-2`}>
          <span className="t-label mb-1 block">Photograph to come</span>
          {label}
        </p>
      </div>
    </div>
  );
}

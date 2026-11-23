import Image from "next/image";
import Link from "next/link";
import { Label } from "@/components/ui/Typography";
import type { Service } from "@/lib/content";
import type { Image as ImageData } from "@/lib/content/schema";

/* ——— Services, 01 Capabilities: a photograph and the three ways to work with us ———
 * A band in two parts. Wide screens (64rem): on the left, the full height of the band, a photograph
 * carrying the section label and its line in light type; on the right, on the quiet grey, the three
 * capabilities in rows parted by hairlines, each with its number, its name and summary, and a
 * landscape picture at the row's end. Each row links to its service page. Narrower screens stack:
 * the photograph becomes a band across the screen with the words on it, then the rows, each keeping
 * its picture beside its name. Without a photograph the left part is a dark panel and a row simply
 * has no picture. styles/pages/services.css (cap-*).
 */

/** The row pictures are drawn 2:1. */
const THUMB = 2;

/** `sizes` for a row picture: its frame's width (services.css), widened when it has to cover a 2:1 frame. */
function thumbSizes(image: ImageData) {
  const cover = Math.max(1, image.width / image.height / THUMB);
  const at = (w: string) => (cover === 1 ? w : `calc(${w} * ${cover.toFixed(2)})`);
  return [`(min-width: 80rem) ${at("15rem")}`, `(min-width: 64rem) ${at("16vw")}`, `(min-width: 40rem) ${at("26vw")}`, at("7.5rem")].join(", ");
}

export function Capabilities({
  index,
  services,
  lead,
  thumbs = {},
}: {
  /** The section's number on the page ("01"). */
  index: string;
  services: Service[];
  /** The large photograph. Without it the panel is dark. */
  lead?: ImageData | null;
  /** A picture for each capability, by service slug. */
  thumbs?: Record<string, ImageData | null | undefined>;
}) {
  return (
    <section data-tone="light" className="cap bg-kapur-deep text-ink" aria-labelledby="capabilities-title">
      {/* Dark under the photograph, so the header turns light over it on a phone. */}
      <div className={`cap-lead ${lead ? "" : "cap-lead-plain"}`} data-tone="dark">
        {lead ? (
          <>
            <Image
              src={lead.src}
              alt={lead.alt}
              fill
              // The 3:2 photograph covers its panel. Wide screens: a tall panel, covered by its height
              // (measured 69vw wide at 1440, 82vw at 1024). Tablets: a 16:9 band, the screen's width.
              // Phones: a 4:3 band, covered by its height.
              sizes="(min-width: 64rem) 82vw, (min-width: 40rem) 100vw, 113vw"
              quality={78}
              className="object-cover"
              style={{ objectPosition: lead.focus ?? "50% 50%" }}
            />
            <span className="cap-scrim" aria-hidden="true" />
          </>
        ) : null}
        <div className="cap-lead-text">
          <div className="flex items-center gap-4">
            <Label pill index={index} className="text-kapur">
              Capabilities
            </Label>
            <span className="h-px w-10 bg-kapur/60 sm:w-16" aria-hidden="true" />
          </div>
          <h2 id="capabilities-title" className="cap-intro t-headline t-follow">
            Three ways to work with us, for residential and commercial projects.
          </h2>
        </div>
      </div>

      <ol className="cap-list">
        {services.map((s, i) => {
          const thumb = thumbs[s.slug];
          return (
            <li key={s.slug} className="cap-item">
              <Link href={`/services/${s.slug}`} className={`cap-row ${thumb ? "" : "cap-row-plain"}`}>
                <span className="cap-num t-label tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="cap-rule" aria-hidden="true" />
                <h3 className="cap-title t-title">
                  <span className="cap-name">{s.title}</span>
                  {s.isDraft ? <span className="t-label ml-3 align-middle opacity-60">Draft</span> : null}
                </h3>
                <p className="cap-body t-meta text-ink-soft">{s.summary}</p>
                {thumb ? (
                  <span className="cap-thumb">
                    {/* The row's name and summary say where it leads; the picture adds nothing to read. */}
                    <Image
                      src={thumb.src}
                      alt=""
                      fill
                      sizes={thumbSizes(thumb)}
                      quality={78}
                      className="object-cover"
                      style={thumb.focus ? { objectPosition: thumb.focus } : undefined}
                    />
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

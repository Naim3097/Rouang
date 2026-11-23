import Link from "next/link";
import { Figure } from "@/components/ui/Figure";
import { Label, TitlePair } from "@/components/ui/Typography";
import type { Service } from "@/lib/content";
import type { Image } from "@/lib/content/schema";

/* ——— 03 What we do: two ways in, one process ———
 * Two doors, for homes and for businesses, stand either side of the three capabilities they share,
 * laid out on one centre line under the section title. Wide screens see the whole composition at
 * once: the homes door high on the left, the business door low on the right, and as it rises into
 * view the doors draw apart to their places. Smaller screens set each door's photograph beside its
 * name, the second mirroring the first, with the capabilities after them. styles/home/pathways.css.
 */

type DoorImage = Image | null | undefined;

/** Every door photograph is drawn in the same 4:5 frame at every width (pathways.css). */
const FRAME = 4 / 5;

/**
 * The `sizes` for a door photograph: its frame fills its column inside the page margins, about 23%
 * of the width on wide screens (25% allowed for very wide ones), 33% on tablets (26% on a phone held
 * sideways) and 43% on phones. A photograph wider than the frame is drawn wider still to cover it,
 * so the width scales up by the same amount.
 */
function doorSizes(image: Image) {
  const cover = Math.max(1, image.width / image.height / FRAME);
  const vw = (frame: number) => `${Math.ceil(frame * cover)}vw`;
  return [
    `(min-width: 80rem) ${vw(25)}`,
    `(min-width: 48rem) and (max-height: 32rem) ${vw(27)}`,
    `(min-width: 48rem) ${vw(34)}`,
    vw(45),
  ].join(", ");
}

export function Pathways({
  index,
  services,
  images = {},
  proof = null,
}: {
  /** The section's number on the page ("03"). */
  index: string;
  services: Service[];
  images?: { homes?: DoorImage; business?: DoorImage };
  /** A built commercial project to name as proof. Only passed when that project is live. */
  proof?: { title: string; location: string | null } | null;
}) {
  const doors = [
    {
      key: "homes",
      label: "For homes",
      title: "Homes, renovated or newly built",
      body: "For owners of a home that has stopped working, and for those planning a new one. We start from how the household lives, then plan, design and build as one coordinated process.",
      image: images.homes,
    },
    {
      key: "business",
      label: "For businesses",
      title: "Restaurants and commercial spaces",
      // The proof names interior design only: that was ROUANG's whole role at Rembayung.
      body: `For operators who need a space that works hard: guests seated well, staff moving without collisions, a room people remember. We take on renovation and interior work, and selected new commercial projects.${proof ? ` We designed the interior of ${proof.title}${proof.location ? ` in ${proof.location}` : ""}.` : ""}`,
      image: images.business,
    },
  ];

  return (
    <section data-tone="light" aria-labelledby="services-title" className="pw relative bg-kapur text-ink">
      <div className="page-x">
        <div className="pw-intro">
          <Label index={index} pill className="mx-auto text-ink-muted">
            What we do
          </Label>
          <TitlePair
            id="services-title"
            lead="Design, planning and construction,"
            follow="brought together as one coordinated process."
            className="mt-6"
          />
        </div>

        <div className="pw-spread">
          {doors.map((d) => (
            <div key={d.key} className={`pw-door pw-door-${d.key}`}>
              <div className="pw-head">
                <Label className="text-ink-muted">{d.label}</Label>
                <h3 className="t-title mt-4 max-w-[18ch]">{d.title}</h3>
              </div>
              <p className="pw-body text-ink-soft">{d.body}</p>
              {d.image ? (
                <Figure
                  image={d.image}
                  aspect="4/5"
                  sizes={doorSizes(d.image)}
                  className="pw-photo"
                />
              ) : null}
            </div>
          ))}

          {/* The three capabilities from the company profile, each leading to its service page: its
              name over the second line of that page's own title. */}
          {services.length ? (
            <ol className="pw-services">
              {services.map((s, i) => (
                <li key={s.slug} className="pw-service">
                  <Link href={`/services/${s.slug}`} className="pw-service-link">
                    <span className="t-label tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="link-name t-title mt-3 block">
                      {s.navLabel}
                      {s.isDraft ? <span className="t-label ml-2 align-middle opacity-60">Draft</span> : null}
                    </span>
                    <span className="t-sub mt-2 block text-balance text-ink-soft">{s.headlineFollow}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </section>
  );
}

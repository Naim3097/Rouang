import { ButtonLink } from "@/components/ui/Button";
import { Label } from "@/components/ui/Typography";
import { studio } from "@/config/studio";
import { RevealFocus } from "./RevealFocus";
import { StudioHouse } from "./StudioHouse";

/* ——— 02 Studio ———
 * Who ROUANG is, on a ground of the brand's green. First the conviction its co-founder brought to it,
 * set as one sentence that ends in a single large word; then what the company is, who leads it, and its
 * vision and mission. Beside the large word, a drawing of a house hangs apart in layers and comes
 * together as the page scrolls (StudioHouse). On large screens the stage pins: the house comes
 * together first, then the sentence travels left out of the frame, the house with it, as the
 * studio arrives from the right, one continuous pan, over a field of green that drifts more slowly
 * behind it (styles/home/studio.css). Elsewhere the two simply follow each other, the house below
 * or beside the word, coming together as it crosses the screen. Tabbing to its link moves the page
 * on to where the studio has arrived (RevealFocus).
 *
 * Every line comes from the company profile (November 2026): the conviction from Zhafiri Zainol's
 * page (p.6), where it is his own and so is credited to him, the company from About us (p.2), the
 * founders and team from pp.6–8, the vision and mission from p.3. The profile has no separate
 * statement of values, so none is set out here: its "transparency, integrity and accountability"
 * stays where p.3 puts it, in the Mission, which keeps the profile's own words up to there.
 */

const purpose: [term: string, line: string][] = [
  [
    "Vision",
    "To become a benchmark design-led construction company, and help shape new standards for the construction industry in Malaysia and the region.",
  ],
  [
    "Mission",
    "We translate our clients’ aspirations into high-quality, functional and distinctive spaces through thoughtful planning, comprehensive project management and high standards of execution. We uphold transparency, integrity and accountability.",
  ],
];

export function StudioName({ index }: { index: string }) {
  // The company's own descriptor, its first word ("design-led") kept whole: a narrow column would
  // otherwise break it at its hyphen.
  const [first, ...rest] = studio.descriptor.toLowerCase().split(" ");
  const descriptor = (
    <>
      <span className="whitespace-nowrap">{first}</span> {rest.join(" ")}
    </>
  );
  return (
    <section data-tone="rikyu" aria-labelledby="name-title" className="studio-scene relative">
      <div className="studio-stage relative">
        {/* The green field: lighter behind the sentence, deep where the smaller text is read. */}
        <div className="studio-field" aria-hidden="true" />

        <div className="studio-word page-x pt-[var(--section-space)]">
          <Label index={index} pill className="text-kapur">
            Studio
          </Label>
          <h2 id="name-title" className="visually-hidden">
            Who we are
          </h2>
          <div className="studio-pair mt-12 lg:mt-[min(4rem,7svh)]">
            <div className="flex flex-col items-start">
              {/* The profile gives this conviction as Zhafiri's own (p.6), so it is his, not the company's. */}
              <p className="studio-line studio-line-1 t-caption">What our co-founder Zhafiri Zainol believes</p>
              <p className="mt-4">
                <span className="studio-line studio-line-2 studio-follow t-headline t-follow block max-w-[19em]">
                  Good design can&rsquo;t be separated from how a project is planned, managed and
                </span>
                {/* The last word is drawn as a graphic, at its own size; it keeps to the scale's weight. */}
                <span className="studio-line studio-line-3 studio-built -ml-[0.04em] mt-1 block">
                  built
                </span>
              </p>
            </div>
            {/* Beside "built", or below it on a narrow screen: a house that comes together. */}
            <StudioHouse />
          </div>
        </div>

        <div className="studio-idea page-x pb-[var(--section-space)] pt-16 lg:pt-24">
          <div className="page-grid gap-y-10">
            <div className="col-span-12 lg:col-span-5">
              <p className="t-sub max-w-[30rem]">
                {studio.name} is a {descriptor}. We design, plan, manage and build as one coordinated process,
                from the first concept to handover, for renovations, interiors and new builds.
              </p>
              <p className="studio-soft mt-6 max-w-[30rem]">
                The company is led by its two co-founders. Zhafiri Zainol brings more than 13 years in architectural
                design and construction delivery; Shaidee Hafizi Khalid helped build and grow a design and build
                business. Around them, a team covers design, operations, quantity surveying and project delivery.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-5 lg:col-start-8">
              {/* Set out like the title block of a drawing: the term in the margin, the line beside it.
                  Where the column is narrow (a small laptop), the term sits above its line. */}
              <dl className="hairline-dark border-t">
                {purpose.map(([term, line]) => (
                  <div key={term} className="hairline-dark border-b py-4 sm:grid sm:grid-cols-[7rem_1fr] sm:gap-x-4 lg:block xl:grid">
                    <dt className="studio-follow t-label pt-[0.3em]">{term}</dt>
                    <dd className="studio-soft mt-1.5 sm:mt-0 lg:mt-1.5 xl:mt-0">{line}</dd>
                  </div>
                ))}
              </dl>
              <ButtonLink href="/about" variant="outline" className="mt-8">
                About ROUANG
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
      {/* 93% through the pinned run: the studio is in place by 90%. */}
      <RevealFocus scene=".studio-scene" settle={0.93} />
    </section>
  );
}

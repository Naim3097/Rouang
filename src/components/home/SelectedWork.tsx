import { Label, TitlePair } from "@/components/ui/Typography";
import type { Project } from "@/lib/content";
import { FlagshipScene } from "./FlagshipScene";
import { Showcase } from "./Showcase";

/**
 * 01 Work, told in two movements: the flagship scene, which opens on the section's title
 * (FlagshipScene.tsx), then the other projects as a showcase on kapur (Showcase.tsx). Without a
 * flagship the title stands on its own above the showcase.
 *
 * After the hero's film the scene takes over in the same place: the film fades to the dark ground
 * and the title fades in where it was (styles/home/hero.css and work.css, which find this section
 * as the hero's next sibling, .work-section).
 *
 * Without scroll-driven animation, or with reduced motion, both are still compositions with the
 * same content in the same order.
 */
export function SelectedWork({ index, flagship, others }: { index: string; flagship: Project | null; others: Project[] }) {
  if (!flagship && others.length === 0) return null;
  return (
    <section aria-labelledby="work-title" className="work-section relative">
      {flagship ? (
        // work-intro-inner is the scene's hook for the title giving way as the flagship comes in (work.css).
        <FlagshipScene project={flagship} title={<WorkTitle index={index} tone="dark" className="work-intro-inner" />} />
      ) : (
        <WorkTitle index={index} className="page-x pt-[var(--section-space)]" />
      )}
      {others.length > 0 ? <Showcase projects={others} /> : null}
    </section>
  );
}

/** The section's title, centred: "01 / Work" in its pill, the title pair beneath. */
function WorkTitle({ index, className = "", tone = "light" }: { index: string; className?: string; tone?: "light" | "dark" }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <Label index={index} pill className={tone === "dark" ? "text-mouse" : "text-ink-muted"}>
        Work
      </Label>
      <TitlePair id="work-title" lead="Selected work" follow="from dining rooms to homes" className="mt-6" />
    </div>
  );
}

import type { IconName } from "@/components/brand/paths";
import { studio } from "./studio";

export type ProcessStep = {
  icon: IconName;
  title: string;
  body: string;
  /** False until the studio confirms this step describes how it actually works. */
  confirmed: boolean;
};

/**
 * The studio's process, named after the icon set in the brand kit (Listen, Plan, Design, Build,
 * Live in). The Build step only appears if the studio confirms it delivers construction.
 */
const steps: (ProcessStep & { requires?: keyof typeof studio.capabilities })[] = [
  {
    icon: "listen",
    title: "Listen",
    body: "A first conversation about the space, how it is used now, what is not working and what you have to spend. Then a visit to measure and photograph it.",
    confirmed: false,
  },
  {
    icon: "plan",
    title: "Plan",
    body: "Layouts come first. We test where people move, sit, cook, work or wait before any finish is chosen, because a plan that works is what makes the rest affordable.",
    confirmed: false,
  },
  {
    icon: "design",
    title: "Design",
    body: "Materials, colour, lighting and built-in joinery are drawn and specified together, with the budget in view, until there is a single design you can sign off.",
    confirmed: false,
  },
  {
    icon: "build",
    title: "Build",
    body: "Construction and renovation delivered by one team, to the drawings, with one timeline and one person to call.",
    confirmed: false,
    requires: "renovationAndBuild",
  },
  {
    icon: "liveIn",
    title: "Live in",
    body: "The point of all of it: a space that is used the way it was imagined, and that still works when life changes around it.",
    confirmed: false,
  },
];

export const processSteps: ProcessStep[] = steps.filter((s) => !s.requires || studio.capabilities[s.requires]);

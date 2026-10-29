import type { IconName } from "@/components/brand/paths";
import { SHOW_DRAFTS } from "@/lib/env";
import data from "./process-steps.json";
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
 * Live in). The steps live in process-steps.json so the launch check can read them as data.
 * The Build step only appears if the studio confirms it delivers construction, and in
 * production only confirmed steps are shown: each one describes how the studio works.
 */
const steps = data as (ProcessStep & { requires?: keyof typeof studio.capabilities })[];

/** Every step the studio offers, confirmed or not, for the preview checklist. */
export const allProcessSteps: ProcessStep[] = steps.filter((s) => !s.requires || studio.capabilities[s.requires]);

export const processSteps: ProcessStep[] = allProcessSteps.filter((s) => s.confirmed || SHOW_DRAFTS);

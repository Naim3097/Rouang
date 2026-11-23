import type { IconName } from "@/components/brand/paths";
import { SHOW_DRAFTS } from "@/lib/env";
import data from "./process-steps.json";
import { studio } from "./studio";

export type ProcessStep = {
  icon: IconName;
  title: string;
  body: string;
  /** False until the company confirms this step describes how it actually works. */
  confirmed: boolean;
};

/**
 * The company's six-step process, as named in its profile (p.5), each drawn with an icon from the
 * brand kit set. The steps live in process-steps.json so the launch check can read them as data.
 * A step that needs a capability (Construction) only appears while the company offers it, and in
 * production only confirmed steps are shown.
 */
const steps = data as (ProcessStep & { requires?: keyof typeof studio.capabilities })[];

/** Every step the company offers, confirmed or not, for the preview checklist. */
export const allProcessSteps: ProcessStep[] = steps.filter((s) => !s.requires || studio.capabilities[s.requires]);

export const processSteps: ProcessStep[] = allProcessSteps.filter((s) => s.confirmed || SHOW_DRAFTS);

/** The profile's own summary of the process (p.5), lightly condensed. */
export const processSummary =
  "Our process ensures that each project is meticulously planned and executed. From the initial discussion to handover, we work closely with our clients so that their vision is brought to life with precision and creativity.";

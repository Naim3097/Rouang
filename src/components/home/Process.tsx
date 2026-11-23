import type { CSSProperties } from "react";
import { Icon } from "@/components/brand/Brand";
import { Section } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import { processSteps, processSummary } from "@/config/process";

/* ——— 05 Process ———
   One line runs through every step, from the first ring to the last. Each step hangs off its ring in
   the same order: number, icon, title, text. From 1360px the steps stand side by side on a
   horizontal line; phones, tablets and smaller laptops run them down a vertical one. Here the whole
   section is one composition on the centre line: the heading is centred, and so is the flow under
   it. The layout and the line's motion are in styles/home/process.css. */

export function Process({ index }: { index: string }) {
  if (processSteps.length === 0) return null;
  return (
    <Section labelledBy="process-title" className="section-y">
      <div className="page-x">
        <div className="flex flex-col items-center text-center">
          <Label index={index} pill className="text-ink-muted">
            Process
          </Label>
          <TitlePair
            id="process-title"
            lead="How a project runs"
            follow="from the first discussion to handover"
            className="mt-6"
          />
          <p className="mt-8 max-w-[38rem] text-balance text-ink-soft">{processSummary}</p>
        </div>

        <ProcessSteps centred />
      </div>
    </Section>
  );
}

/**
 * The six steps on their line, across the page grid. Also used by the About page, under its own
 * heading, so the process is drawn the same way wherever it appears. `centred` sets the flow on the
 * section's centre line (each step centred on its ring when they stand side by side, the list one
 * centred block when they run down); without it the steps keep to the left edge of the grid, under
 * a heading that does too.
 */
export function ProcessSteps({ centred = false }: { centred?: boolean }) {
  const count = processSteps.length;
  if (count === 0) return null;
  return (
    <ol className={`process-steps ${centred ? "process-centred" : ""}`} style={{ "--steps": count } as CSSProperties}>
      {processSteps.map((step, i) => (
        <li key={step.title} className="process-step" style={{ "--i": i } as CSSProperties}>
          {/* The list itself numbers the steps for assistive technology; the ring is the drawn number. */}
          <span className="process-node t-label" aria-hidden="true">
            <span>{String(i + 1).padStart(2, "0")}</span>
            <span className="process-node-on">{String(i + 1).padStart(2, "0")}</span>
          </span>
          {i < count - 1 ? (
            <span className="process-link" aria-hidden="true">
              <span />
            </span>
          ) : null}
          <Icon name={step.icon} className="process-icon" />
          <h3 className="process-title t-title">{step.title}</h3>
          <p className="process-body t-meta text-ink-soft">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

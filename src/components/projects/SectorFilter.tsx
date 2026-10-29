"use client";

import { useState } from "react";

const options = [
  { value: "all", label: "All work" },
  { value: "residential", label: "Homes" },
  { value: "commercial", label: "Commercial" },
] as const;

/**
 * Filters the project plates by toggling an attribute on their container; CSS does the hiding.
 * Without JavaScript every project is simply shown.
 */
export function SectorFilter({ targetId, counts }: { targetId: string; counts: Record<string, number> }) {
  const [value, setValue] = useState<(typeof options)[number]["value"]>("all");

  const choose = (v: typeof value) => {
    setValue(v);
    document.getElementById(targetId)?.setAttribute("data-filter", v);
  };

  return (
    <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          aria-controls={targetId}
          onClick={() => choose(o.value)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/25 px-4 text-[0.9375rem] transition-colors aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-kapur"
        >
          {o.label}
          <span className="t-caption tabular-nums opacity-60">{counts[o.value] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

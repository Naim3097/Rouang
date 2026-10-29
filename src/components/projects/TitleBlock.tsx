import type { Project } from "@/lib/content";

/**
 * Project facts set out like the title block of an architectural drawing sheet:
 * hairline cells, a small caps label over each value. Rows with no confirmed value are left out.
 */
export function TitleBlock({
  project,
  tone = "light",
  className = "",
}: {
  project: Pick<Project, "type" | "location" | "year" | "scope" | "area" | "sector" | "visualisation">;
  tone?: "light" | "dark";
  className?: string;
}) {
  const rows: [string, string | null][] = [
    ["Type", project.type],
    ["Location", project.location],
    ["Our role", project.scope.join(", ")],
    ["Area", project.area],
    // A proposal has a stage, not a completion date.
    project.visualisation ? ["Stage", ["Design proposal", project.year].filter(Boolean).join(", ")] : ["Completed", project.year],
  ];
  const visible = rows.filter(([, v]) => v);
  const line = tone === "dark" ? "border-kapur/15" : "border-ink/15";
  const label = tone === "dark" ? "text-mouse" : "text-ink-muted";

  return (
    <dl className={`grid grid-cols-2 border-l border-t ${line} ${className}`}>
      {visible.map(([k, v], i) => (
        <div
          key={k}
          className={`border-b border-r ${line} px-4 py-3.5 ${visible.length % 2 === 1 && i === visible.length - 1 ? "col-span-2" : ""}`}
        >
          <dt className={`t-label ${label}`}>{k}</dt>
          <dd className="mt-1.5 text-[0.9375rem] leading-snug">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

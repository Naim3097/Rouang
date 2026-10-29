import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schema";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
/** `photo` is for a trail set over a photograph, where Mouse Grey cannot hold its contrast. */
export function Breadcrumbs({ items, tone = "light" }: { items: Crumb[]; tone?: "light" | "dark" | "photo" }) {
  const trail: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  const colour = tone === "photo" ? "text-kapur" : tone === "dark" ? "text-mouse" : "text-ink-muted";
  return (
    <>
      <nav aria-label="Breadcrumb" className={`t-caption ${colour}`}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className={tone === "light" ? "text-ink" : "text-kapur"}>
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.href} className="link-reveal">
                      {c.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(trail)} />
    </>
  );
}

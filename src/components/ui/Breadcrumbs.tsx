import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schema";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items, tone = "light" }: { items: Crumb[]; tone?: "light" | "dark" }) {
  const trail: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={`t-caption ${tone === "dark" ? "text-mouse" : "text-ink-muted"}`}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className={tone === "dark" ? "text-kapur" : "text-ink"}>
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

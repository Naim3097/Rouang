"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mark, Wordmark } from "@/components/brand/Brand";
import type { NavItem } from "@/lib/nav";
import { MobileMenu } from "./MobileMenu";

type Tone = "light" | "dark";

/**
 * Wordmark top left on the margin, like the title block on a drawing (kit p.8).
 * The header takes the tone of whatever section sits beneath it, hides while reading
 * downwards and returns on the way back up.
 */
export function SiteHeader({ whatsapp, nav }: { whatsapp: string | null; nav: NavItem[] }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const header = ref.current;
      if (!header) return;
      const y = window.scrollY;
      const probeY = header.offsetHeight / 2;
      const stack = document.elementsFromPoint(window.innerWidth / 2, probeY);
      // During a view transition the page is a snapshot and only <html> is hit-testable, so the
      // reading would be meaningless. Keep the current tone and look again once it has finished.
      if (!stack.includes(header)) {
        window.setTimeout(onScroll, 200);
        return;
      }
      const section = stack.find((el) => !header.contains(el))?.closest<HTMLElement>("[data-tone]");
      setTone(section?.dataset.tone === "dark" || section?.dataset.tone === "rikyu" ? "dark" : "light");
      setSolid(y > 24);
      const delta = y - lastY;
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 240);
        lastY = y;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    // The page below may paint after this effect runs (navigation, late images), so the tone is
    // measured again whenever the content under the header changes size.
    measure();
    const settle = window.setTimeout(onScroll, 250);
    const main = document.getElementById("main");
    const ro = main ? new ResizeObserver(onScroll) : null;
    if (main && ro) ro.observe(main);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", onScroll);
      window.clearTimeout(settle);
      ro?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => setHidden(false), [pathname]);

  const dark = tone === "dark";

  return (
    <header
      ref={ref}
      data-site-header
      data-header-tone={tone ?? undefined}
      onFocusCapture={() => setHidden(false)}
      className={`site-header fixed inset-x-0 top-0 z-50 transition-[translate,background-color,color] duration-500 ease-[var(--ease-brand)] ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${solid ? (dark ? "bg-ink/95 text-kapur" : "bg-kapur/95 text-ink") : dark ? "text-kapur" : "text-ink"}`}
    >
      <div className="page-x flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link href="/" className="block shrink-0" aria-label="ROUANG, home">
          <Wordmark className="h-auto w-[8.75rem] sm:w-[9.5rem]" title="ROUANG" />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {nav.map((item) => {
              const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link href={item.href} className="link-reveal text-[0.9375rem]" aria-current={current ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/contact"
            className={`group inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[0.9375rem] transition-colors duration-500 ${
              dark ? "border-kapur/40 hover:border-kapur" : "border-ink/30 hover:border-ink"
            }`}
          >
            <span>Discuss your project</span>
            <Mark className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <MobileMenu pathname={pathname} whatsapp={whatsapp} nav={nav} />
      </div>
      <div className={`h-px w-full transition-opacity duration-500 ${solid ? "opacity-100" : "opacity-0"} ${dark ? "bg-kapur/10" : "bg-ink/10"}`} />
    </header>
  );
}

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
  // A new page always starts with the header showing.
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setHidden(false);
  }

  // Tone: whichever [data-tone] section crosses a one-pixel line at the header's middle, found by
  // an IntersectionObserver so scrolling never forces a layout read. A nested section wins over
  // the one containing it, as the topmost layer does on screen.
  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    const hits = new Map<HTMLElement, DOMRectReadOnly>();
    let io: IntersectionObserver | null = null;
    let rebuild = 0;

    const pick = () => {
      const x = window.innerWidth / 2;
      let best: HTMLElement | null = null;
      for (const [el, rect] of hits) {
        if (rect.left > x || rect.right < x) continue;
        if (!best || best.contains(el)) best = el;
      }
      const t = best?.dataset.tone;
      setTone(t === "dark" || t === "rikyu" ? "dark" : "light");
    };

    const build = () => {
      rebuild = 0;
      io?.disconnect();
      hits.clear();
      const mid = Math.round(header.offsetHeight / 2);
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const el = e.target as HTMLElement;
            if (e.isIntersecting) hits.set(el, e.boundingClientRect);
            else hits.delete(el);
          }
          pick();
        },
        { rootMargin: `-${mid}px 0px -${Math.max(0, window.innerHeight - mid - 1)}px 0px` },
      );
      for (const el of document.querySelectorAll<HTMLElement>("[data-tone]")) {
        if (!header.contains(el)) io.observe(el);
      }
    };
    const schedule = () => {
      if (!rebuild) rebuild = requestAnimationFrame(build);
    };

    build();
    // Sections that mount after this effect (client-only content) are picked up as they appear.
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n instanceof HTMLElement && (n.matches("[data-tone]") || n.querySelector("[data-tone]"))) return schedule();
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    return () => {
      io?.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      if (rebuild) cancelAnimationFrame(rebuild);
    };
  }, [pathname]);

  // Solid background and hide-on-scroll come from the scroll position alone.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setSolid(y > 24);
      const delta = y - lastY;
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 240);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

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

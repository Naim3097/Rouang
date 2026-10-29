"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Mark } from "@/components/brand/Brand";
import { track } from "@/lib/analytics";

/**
 * On phones, the two ways to start a conversation stay one tap away once the visitor is past
 * the first screen. Hidden on the contact page, where the form is already in view.
 */
export function MobileActionBar({ whatsapp }: { whatsapp: string | null }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The bar only exists below 1024px, so nothing is watched on larger screens.
    const phone = window.matchMedia("(max-width: 1023px)");
    let stop: (() => void) | null = null;

    const start = () => {
      // Out of the way while the footer or an enquiry form is on screen: it would cover their links
      // and fields, and a form in view is already the next step.
      const blocking = new Set<Element>();
      let pastHero = false;
      let frame = 0;
      const sync = () => setVisible(pastHero && blocking.size === 0);
      const measure = () => {
        frame = 0;
        const next = window.scrollY > window.innerHeight * 0.8;
        if (next !== pastHero) {
          pastHero = next;
          sync();
        }
      };
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(measure);
      };
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) blocking.add(e.target);
          else blocking.delete(e.target);
        }
        sync();
      });
      document.querySelectorAll("footer, form").forEach((el) => io.observe(el));
      pastHero = window.scrollY > window.innerHeight * 0.8;
      sync();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        io.disconnect();
        if (frame) cancelAnimationFrame(frame);
      };
    };

    const apply = () => {
      stop?.();
      stop = phone.matches ? start() : null;
    };
    apply();
    phone.addEventListener("change", apply);
    return () => {
      phone.removeEventListener("change", apply);
      stop?.();
    };
  }, [pathname]);

  if (pathname.startsWith("/contact")) return null;

  return (
    <aside
      aria-label="Contact the studio"
      className={`fixed bottom-3 right-3 z-40 flex items-center gap-2 transition-[translate,opacity] duration-500 ease-[var(--ease-brand)] lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"
      }`}
      aria-hidden={!visible}
    >
      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visible ? 0 : -1}
          onClick={() => track("whatsapp_click", { location: "mobile_bar" })}
          className="flex min-h-12 items-center rounded-full bg-kapur px-5 text-[0.9375rem] text-ink shadow-[0_12px_30px_-12px_rgb(0_0_0/0.45)]"
        >
          WhatsApp<span className="visually-hidden"> (opens WhatsApp)</span>
        </a>
      ) : null}
      <Link
        href="/contact"
        tabIndex={visible ? 0 : -1}
        onClick={() => track("cta_click", { location: "mobile_bar" })}
        className="flex min-h-12 items-center gap-3 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-[0.9375rem] text-kapur shadow-[0_12px_30px_-12px_rgb(0_0_0/0.55)] ring-1 ring-kapur/25"
      >
        <span>Discuss your project</span>
        <Mark className="h-8 w-8" />
      </Link>
    </aside>
  );
}

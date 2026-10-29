"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Mark, Wordmark } from "@/components/brand/Brand";
import { primaryNav } from "@/config/navigation";
import { track } from "@/lib/analytics";

/**
 * Full-screen menu on a native modal <dialog>: focus is trapped, Escape closes it and the page
 * behind becomes inert without extra code. Wordmark top left, mark in the opposite corner (kit p.8).
 */
export function MobileMenu({ pathname, whatsapp }: { pathname: string; whatsapp: string | null }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  const open = () => dialog.current?.showModal();
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="-mr-2 inline-flex min-h-11 items-center gap-3 px-2 text-[0.9375rem] lg:hidden"
        aria-haspopup="dialog"
      >
        <span>Menu</span>
        <span className="flex w-6 flex-col gap-[5px]" aria-hidden="true">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-4/6 self-end bg-current" />
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-label="Menu"
        className="mobile-menu m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-kapur backdrop:bg-ink"
        data-tone="dark"
      >
        <div className="page-x relative flex min-h-full flex-col">
          <div className="flex h-[var(--header-h)] items-center justify-between">
            <Link href="/" onClick={close} aria-label="ROUANG, home">
              <Wordmark className="h-auto w-[8.75rem]" />
            </Link>
            <button type="button" onClick={close} className="-mr-2 inline-flex min-h-11 items-center gap-3 px-2 text-[0.9375rem]">
              <span>Close</span>
              <span className="relative block h-4 w-4" aria-hidden="true">
                <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
                <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
              </span>
            </button>
          </div>

          <nav aria-label="Menu" className="mt-[8vh]">
            <ul className="border-t border-kapur/15">
              {primaryNav.map((item, i) => (
                <li key={item.href} className="border-b border-kapur/15">
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="flex items-baseline justify-between gap-4 py-4"
                  >
                    <span className="text-[2.25rem] font-medium leading-none tracking-[-0.03em] xs:text-[2.75rem]">{item.label}</span>
                    <span className="t-label tabular-nums text-mouse">{String(i + 1).padStart(2, "0")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto flex items-end justify-between gap-6 pb-8 pt-12">
            <div className="space-y-4">
              <p lang="ms" className="t-quote max-w-[22ch] text-rikyu">
                Anda cerita macam mana nak duduk. Kami terjemah jadi ruang.
              </p>
              {whatsapp ? (
                <a
                  href={whatsapp}
                  className="link-line inline-block"
                  onClick={() => track("whatsapp_click", { location: "menu" })}
                >
                  Message us on WhatsApp
                </a>
              ) : null}
            </div>
            <Mark className="h-6 w-6 shrink-0 text-kapur" />
          </div>
        </div>
      </dialog>
    </>
  );
}

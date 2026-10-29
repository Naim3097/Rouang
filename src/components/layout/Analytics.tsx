"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_KEY } from "@/lib/analytics";

type Choice = "granted" | "denied" | null;

function readChoice(): Choice {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Google Analytics 4, loaded only after the visitor agrees. No advertising features.
 * Renders nothing at all when no measurement ID is configured.
 * The footer's "Analytics settings" button reopens the choice via the `rouang:consent` event.
 */
export function Analytics({ measurementId }: { measurementId: string | null }) {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const current = readChoice();
    setChoice(current);
    setOpen(current === null);
    setReady(true);
    const reopen = () => setOpen(true);
    window.addEventListener("rouang:consent", reopen);
    return () => window.removeEventListener("rouang:consent", reopen);
  }, []);

  if (!measurementId) return null;

  const decide = (value: Exclude<Choice, null>) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* storage unavailable: the choice lasts for this page view only */
    }
    if (value === "denied" && choice === "granted") {
      // Withdrawing consent: stop collection and clear GA cookies, then reload without the tag.
      (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = true;
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        if (name.startsWith("_ga")) document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname.replace(/^www\./, "")}`;
      });
      window.location.reload();
      return;
    }
    setChoice(value);
    setOpen(false);
  };

  return (
    <>
      {choice === "granted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
        </>
      ) : null}

      {ready && open ? (
        <div
          role="region"
          aria-label="Analytics choice"
          className="fixed bottom-4 left-4 right-4 z-[60] max-w-md rounded-[1.25rem] bg-ink p-5 text-kapur shadow-[0_20px_60px_-20px_rgb(0_0_0/0.5)] sm:right-auto"
          data-tone="dark"
        >
          <p className="t-caption text-[0.875rem] leading-relaxed text-kapur/85">
            May we use Google Analytics cookies to see which pages people find useful? No advertising, and you can change
            your mind any time. <Link href="/privacy#analytics" className="underline underline-offset-2">Privacy notice</Link>
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => decide("granted")} className="min-h-11 rounded-full bg-kapur px-5 text-[0.9375rem] text-ink">
              Allow analytics
            </button>
            <button type="button" onClick={() => decide("denied")} className="min-h-11 rounded-full border border-kapur/40 px-5 text-[0.9375rem]">
              No thanks
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ConsentSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("rouang:consent"))}>
      Analytics settings
    </button>
  );
}

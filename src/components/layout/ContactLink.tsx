"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

/** WhatsApp, phone and email links that report a conversion event when used. */
export function ContactLink({
  href,
  kind,
  location,
  className = "",
  children,
}: {
  href: string;
  kind: "whatsapp" | "phone" | "email";
  location: string;
  className?: string;
  children: ReactNode;
}) {
  const external = kind === "whatsapp";
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() =>
        kind === "whatsapp" ? track("whatsapp_click", { location }) : track("contact_click", { method: kind, location })
      }
    >
      {children}
      {external ? <span className="visually-hidden"> (opens WhatsApp)</span> : null}
    </a>
  );
}

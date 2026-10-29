import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Mark } from "@/components/brand/Brand";

type Variant = "light" | "dark" | "outline";

const variantClass: Record<Variant, string> = {
  light: "btn btn-solid-light",
  dark: "btn btn-solid-dark",
  outline: "btn btn-outline",
};

/** The mark sits in the open ring at the end of the pill, as drawn in the kit (p.14). */
function Ring() {
  return (
    <span className="btn-ring" aria-hidden="true">
      <Mark className="h-[1.85rem] w-[1.85rem]" />
    </span>
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "light", className = "", children, ...props }: ButtonLinkProps) {
  return (
    <Link className={`${variantClass[variant]} ${className}`} {...props}>
      <span>{children}</span>
      <Ring />
    </Link>
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "dark", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`${variantClass[variant]} ${className}`} {...props}>
      <span>{children}</span>
      <Ring />
    </button>
  );
}

export function ButtonAnchor({
  variant = "outline",
  className = "",
  children,
  ...props
}: ComponentProps<"a"> & { variant?: Variant }) {
  return (
    <a className={`${variantClass[variant]} ${className}`} {...props}>
      <span>{children}</span>
      <Ring />
    </a>
  );
}

/** A quiet text link with an arrow built from a straight line, as the icon rules allow. */
export function ArrowLink({
  className = "",
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "className"> & { className?: string; children: ReactNode }) {
  return (
    <Link className={`group inline-flex items-center gap-3 ${className}`} {...props}>
      <span className="link-line">{children}</span>
      <Arrow className="transition-transform duration-500 ease-[var(--ease-brand)] group-hover:translate-x-1" />
    </Link>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 12" className={`h-3 w-[1.375rem] shrink-0 ${className}`} fill="none" aria-hidden="true">
      <path d="M0 6h20.5M15.5 1l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

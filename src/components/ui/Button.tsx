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

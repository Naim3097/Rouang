import { Mark } from "@/components/brand/Brand";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section data-tone="dark" className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="page-x relative w-full pt-[var(--header-h)]">
        <p className="t-label text-mouse">Error 404</p>
        <h1 className="t-headline-hero mt-8 max-w-[14ch]">
          <span className="block">This room is empty.</span>
          <span className="t-italic-display block text-[1.08em] text-rikyu">Nothing has been built here yet.</span>
        </h1>
        <p className="mt-8 max-w-[32rem] text-kapur/75">The page you were looking for has moved or never existed.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="light">
            Go to the home page
          </ButtonLink>
          <ButtonLink href="/projects" variant="outline">
            See our projects
          </ButtonLink>
        </div>
      </div>
      <Mark className="absolute bottom-8 right-[var(--page-gutter)] h-6 w-6 text-kapur" />
    </section>
  );
}

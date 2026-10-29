import type { Metadata } from "next";
import { HeroAperture } from "@/components/home/HeroAperture";
import {
  EnquiryPanel,
  InsideProject,
  InsightsList,
  Pathways,
  Process,
  ProjectStory,
  SelectedWork,
  StudioName,
} from "@/components/home/HomeSections";
import { areaLabel } from "@/config/studio";
import { brandImagery } from "@/config/media";
import { getInsights, getProjects, getServices, publicImage, type Project } from "@/lib/content";
import type { Image } from "@/lib/content/schema";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "ROUANG · Interior design studio in Kuala Lumpur",
  absoluteTitle: true,
  description:
    "ROUANG is an interior design studio for homes and businesses in Kuala Lumpur and Selangor. The studio behind the interior of Rembayung, Kampung Baru.",
  path: "/",
});

/** A named photograph from a project's gallery, if it is cleared for this environment. */
function galleryImage(project: Project | undefined, file: string): Image | null {
  const item = project?.gallery.find((g) => !("pending" in g) && g.src.endsWith(`/${file}.jpg`));
  const img = item ? publicImage(item) : null;
  return img && !("pending" in img) ? img : null;
}

export default async function HomePage() {
  const [projects, services, insights] = await Promise.all([getProjects(), getServices(), getInsights()]);

  const flagship = projects.find((p) => p.featured) ?? projects[0] ?? null;
  // Built work first, design proposals after, so the index reads from finished rooms to ideas.
  const others = projects
    .filter((p) => p !== flagship)
    .sort((a, b) => Number(a.visualisation) - Number(b.visualisation) || a.order - b.order);

  // The hero shows the flagship's photograph when one is cleared; otherwise brand atmosphere (previews only).
  const flagshipPhoto = flagship ? publicImage(flagship.hero) : null;
  const heroIsProject = !!flagshipPhoto && !("pending" in flagshipPhoto);
  const heroImage = heroIsProject ? flagshipPhoto : publicImage(brandImagery.concreteFacade);

  const homeDoor = galleryImage(projects.find((p) => p.slug === "ampang"), "ampang-foyer-to-dining");
  const businessDoor = galleryImage(projects.find((p) => p.slug === "rembayung"), "rembayung-table-in-sun");

  return (
    <>
      <HeroAperture
        image={heroImage}
        project={heroIsProject && flagship ? { slug: flagship.slug, title: flagship.title, type: flagship.type, location: flagship.location } : null}
        areas={areaLabel()}
      />
      <SelectedWork flagship={flagship} others={others} />
      <StudioName />
      <Pathways services={services} images={{ homes: homeDoor, business: businessDoor }} />
      <InsideProject project={flagship} />
      <ProjectStory project={flagship} />
      <Process />
      <InsightsList insights={insights} />
      <EnquiryPanel />
    </>
  );
}

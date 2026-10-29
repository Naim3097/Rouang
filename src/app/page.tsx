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
import { areaLabel, studio } from "@/config/studio";
import { brandImagery } from "@/config/media";
import { getInsights, getProjects, getServices, projectImage, publicImage } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export async function generateMetadata(): Promise<Metadata> {
  const flagship = (await getProjects()).find((p) => p.featured && !p.visualisation);
  const areas = areaLabel();
  return pageMetadata({
    title: `ROUANG · ${studio.descriptor} in ${areas}`,
    absoluteTitle: true,
    // A project is named in search results only once its own case study is live.
    description: flagship
      ? `ROUANG is an interior design studio for homes and businesses in ${areas}. The studio behind the interior of ${flagship.title}${flagship.location ? `, ${flagship.location.split(",")[0]}` : ""}.`
      : `ROUANG is an interior design studio for homes and businesses in ${areas}: layouts, materials, lighting and joinery, planned around how a space is used.`,
    path: "/",
  });
}

export default async function HomePage() {
  const [projects, services, insights] = await Promise.all([getProjects(), getServices(), getInsights()]);

  // The flagship is always built work, never a design proposal.
  const built = projects.filter((p) => !p.visualisation);
  const flagship = built.find((p) => p.featured) ?? built[0] ?? null;
  // Built work first, design proposals after, so the index reads from finished rooms to ideas.
  const others = projects
    .filter((p) => p !== flagship)
    .sort((a, b) => Number(a.visualisation) - Number(b.visualisation) || a.order - b.order);

  // The hero shows the flagship's photograph when one is cleared; otherwise brand atmosphere (previews only).
  const flagshipPhoto = flagship ? publicImage(flagship.hero) : null;
  const heroIsProject = !!flagshipPhoto && !("pending" in flagshipPhoto);
  const heroImage = heroIsProject ? flagshipPhoto : publicImage(brandImagery.concreteFacade);

  const homeDoor = projectImage(projects.find((p) => p.slug === "ampang"), "ampang-porch");
  const businessDoor = projectImage(projects.find((p) => p.slug === "rembayung"), "rembayung-long-hall");

  return (
    <>
      <HeroAperture
        image={heroImage}
        project={heroIsProject && flagship ? { slug: flagship.slug, title: flagship.title, type: flagship.type, location: flagship.location } : null}
        areas={areaLabel()}
        hasWork={projects.length > 0}
      />
      <SelectedWork flagship={flagship} others={others} />
      <StudioName />
      <Pathways
        services={services}
        images={{ homes: homeDoor, business: businessDoor }}
        proof={flagship && flagship.sector === "commercial" ? { title: flagship.title, location: flagship.location?.split(",").at(-1)?.trim() ?? null } : null}
      />
      <InsideProject project={flagship} />
      <ProjectStory project={flagship} />
      <Process />
      <InsightsList insights={insights} />
      <EnquiryPanel />
    </>
  );
}

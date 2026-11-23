import type { Metadata } from "next";
import { EnquiryPanel } from "@/components/home/EnquiryPanel";
import { HERO_FILM, HERO_PHOTO, HomeHero } from "@/components/home/HomeHero";
import { InsideProject, ProjectStory, hasInsideWalk, hasProjectStory } from "@/components/home/InsideProject";
import { InsightsList } from "@/components/home/InsightsList";
import { Pathways } from "@/components/home/Pathways";
import { Process } from "@/components/home/Process";
import { SelectedWork } from "@/components/home/SelectedWork";
import { StudioName } from "@/components/home/StudioName";
import { processSteps } from "@/config/process";
import { areaLabel, studio } from "@/config/studio";
import { getInsights, getProjects, getServices, projectImage } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export async function generateMetadata(): Promise<Metadata> {
  const flagship = (await getProjects()).find((p) => p.featured && !p.visualisation);
  const areas = areaLabel();
  return pageMetadata({
    title: `ROUANG · ${studio.descriptor} in ${areas}`,
    absoluteTitle: true,
    // Built from the studio's own descriptor and positioning, so it follows them when they change.
    // A project is named in search results only once its own case study is live.
    description: flagship
      ? `${studio.positioning} Working in ${areas}; the team behind the interior of ${flagship.title}${flagship.location ? `, ${flagship.location.split(",")[0]}` : ""}.`
      : `${studio.positioning} Working in ${areas}.`,
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

  // The hero's film shows Rembayung, so it runs only where Rembayung itself is visible; elsewhere the
  // photograph stands in, borrowed through projectImage so it too shows only where its project is.
  const filmProject = projects.find((p) => p.slug === HERO_FILM.project);
  const heroFilm = filmProject
    ? { title: filmProject.title, place: filmProject.location?.split(",")[0]?.trim() ?? null, scope: filmProject.scope }
    : null;
  const heroPhoto = heroFilm ? null : projectImage(projects.find((p) => p.slug === HERO_PHOTO.project), HERO_PHOTO.file);
  // Two doors seen the same way, straight down a long room to its end: the Ampang corridor and its
  // arched door, the Rembayung hall under its roof.
  const homeDoor = projectImage(projects.find((p) => p.slug === "ampang"), "ampang-corridor");
  const businessDoor = projectImage(projects.find((p) => p.slug === "rembayung"), "rembayung-long-hall");

  // Each section's number counts only the sections that show, so the labels run 01, 02, 03… in
  // order even where one is left out (Inside a project needs its flagship's photographs cleared).
  let shown = 0;
  const number = (shows: boolean) => (shows ? String(++shown).padStart(2, "0") : "");
  const no = {
    work: number(!!flagship || others.length > 0),
    studio: number(true),
    services: number(true),
    inside: number(hasInsideWalk(flagship) || hasProjectStory(flagship)),
    process: number(processSteps.length > 0),
    insights: number(insights.length > 0),
    enquiry: number(true),
  };

  return (
    <>
      <HomeHero areas={areaLabel()} film={heroFilm} photo={heroPhoto} />
      <SelectedWork index={no.work} flagship={flagship} others={others} />
      <StudioName index={no.studio} />
      <Pathways
        index={no.services}
        services={services}
        images={{ homes: homeDoor, business: businessDoor }}
        proof={flagship && flagship.sector === "commercial" ? { title: flagship.title, location: flagship.location?.split(",").at(-1)?.trim() ?? null } : null}
      />
      <InsideProject index={no.inside} project={flagship} />
      <ProjectStory index={no.inside} project={flagship} />
      <Process index={no.process} />
      <InsightsList index={no.insights} insights={insights} />
      <EnquiryPanel index={no.enquiry} />
    </>
  );
}

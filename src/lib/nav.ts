import "server-only";
import { primaryNav } from "@/config/navigation";
import { getInsights, getProjects } from "@/lib/content";

export type NavItem = { href: string; label: string };

/** Primary navigation without sections that have nothing live in them yet. */
export async function liveNav(): Promise<NavItem[]> {
  const [projects, insights] = await Promise.all([getProjects(), getInsights()]);
  return primaryNav.filter(
    (item) => (item.href !== "/projects" || projects.length > 0) && (item.href !== "/insights" || insights.length > 0),
  );
}

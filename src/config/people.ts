/**
 * The people at ROUANG, from the company profile (November 2026, pp.6–8).
 *
 * Names and roles are published as the company gave them; the founders' biographies are condensed
 * from the profile without adding to it. No portraits have been supplied, so the About page lists
 * everyone as text only.
 */

export type Founder = {
  name: string;
  role: string;
  /** Degrees as the profile lists them. */
  credentials: string;
  /** Short paragraphs, condensed from the profile. */
  bio: string[];
};

export const founders: Founder[] = [
  {
    name: "Zhafiri Zainol",
    role: "Co-Founder · Strategy, Design & Project Delivery",
    credentials: "B. Architecture (IIUM), BSc in Architectural Studies (IIUM)",
    bio: [
      "Zhafiri has more than 13 years of experience in architectural design, project coordination and construction delivery, and a practical understanding of how projects move from concept to execution.",
      // His earlier employers' developers, never presented as ROUANG's clients.
      "Before ROUANG, he spent eight years with HIA Architects Sdn Bhd and nearly five with AF Consultant Architect, working on residential, hospitality, commercial and large-scale developments, including projects associated with Sime Darby Property, UEM Sunrise and TH Properties. A move into design and construction then took him into project leadership, coordination and on-site execution.",
      "At ROUANG he leads the company’s strategic direction, design philosophy and project delivery standards.",
    ],
  },
  {
    name: "Shaidee Hafizi Khalid",
    role: "Co-Founder · Business Development, Client Relations & Growth",
    credentials: "B. Engineering in Electrical & Electronics (UPM)",
    bio: [
      "Shaidee brings experience across design and construction, business development and client management: a commercially driven perspective, with a strong understanding of project delivery and client expectations.",
      "Before establishing ROUANG, he played a key role in building and growing a design and build business, across business development, sales strategy, marketing, customer success and project operations.",
      "At ROUANG he leads business development, client relations and growth, keeping commercial opportunities aligned with the company’s positioning, capabilities and standards.",
    ],
  },
];

/**
 * The team below the founders, in the order of the profile's chart (p.8), each next to the person
 * they work with. The profile's "Head of Designer" is published as Head of Design.
 */
export const team: { name: string; role: string }[] = [
  { name: "Husna", role: "Head of Design" },
  { name: "Qaesya", role: "Designer" },
  { name: "Arif Safuan", role: "Head of Operation" },
  { name: "Nurul Syazana", role: "Project Executive" },
  { name: "Najihah", role: "Quantity Surveyor" },
  { name: "Ainul Shahira", role: "HR & Finance" },
];

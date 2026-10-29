import type { Image } from "@/lib/content/schema";

/**
 * Brand-kit imagery used for atmosphere while project photography is outstanding.
 * Every entry is `provisional`: the licence for these images has not been confirmed, so the
 * content layer drops them from production and they are never used on a project page.
 */
export const brandImagery = {
  concreteFacade: {
    src: "/images/brand-kit/concrete-facade.jpg",
    alt: "Stacked concrete volumes in low light, seen from below",
    width: 2000,
    height: 1121,
    provisional: true,
  },
  horizonWall: {
    src: "/images/brand-kit/horizon-wall.jpg",
    alt: "A dark plaster wall meeting a pale floor where daylight falls",
    width: 2000,
    height: 1143,
    provisional: true,
  },
  curvedFacade: {
    src: "/images/brand-kit/curved-facade.jpg",
    alt: "White curved floor plates of a building against a bright sky",
    width: 2000,
    height: 1333,
    provisional: true,
  },
} satisfies Record<string, Image>;

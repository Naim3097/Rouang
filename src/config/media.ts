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

/**
 * Temporary photographs from Unsplash (free to use under the Unsplash licence), standing in where
 * the studio has no photograph of its own yet: the client's brief of 23 November 2026 asked for
 * them so the redesigned layouts could be judged with real pictures in place. None of them shows a
 * ROUANG project, so none is ever captioned or described as one.
 *
 * They are `provisional`, so publicImage() drops them from production, and scripts/launch-check.mjs
 * blocks a production build while any is still referenced. Replace each with the studio's own
 * photograph, then delete its entry. The source is the Unsplash CDN, capped at 2400 px wide;
 * next/image optimises it like a local file (images.remotePatterns in next.config.ts).
 */
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?fm=jpg&q=80&w=2400&fit=max`;

export const placeholderImagery = {
  // Services: Capabilities (the large panel, then one picture per capability)
  capabilitiesLead: {
    src: unsplash("1512972972907-6d71529c5e92"),
    alt: "A quiet room with a long timber bench, low cushions and a round window in soft daylight",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/SoNaNOFT974",
    provisional: true,
  },
  capabilityDesignBuild: {
    src: unsplash("1501619438411-47314d5a0580"),
    alt: "Timber slats lining a curved interior, lit warmly from above",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/iOMSkywIHtI",
    provisional: true,
  },
  capabilityRenovation: {
    src: unsplash("1502005097973-6a7082348e28"),
    alt: "A long galley kitchen in pale timber, opening onto a garden",
    width: 2400,
    height: 3600,
    credit: "Unsplash, unsplash.com/photos/AQl-J19ocWE",
    provisional: true,
  },
  capabilityNewBuild: {
    src: unsplash("1558455322-911adf441b5a"),
    alt: "A skylight framing the sky above a white wall",
    width: 2400,
    height: 3200,
    credit: "Unsplash, unsplash.com/photos/KqAN5HRBgDk",
    provisional: true,
  },
  // Services hero: a before-and-after pair. Two different kitchens, not one room twice: stand-ins
  // until the studio supplies a real pair taken from the same spot.
  beforeKitchen: {
    src: unsplash("1618832515490-e181c4794a45"),
    alt: "A kitchen during renovation, its cabinets wrapped in plastic sheeting",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/UqNEbyRQ660",
    provisional: true,
  },
  afterKitchen: {
    src: unsplash("1601760561441-16420502c7e0"),
    alt: "A finished white kitchen with a window over the sink and a pendant light",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/1by_GbwEMwc",
    provisional: true,
  },
  // Services: who we work with
  forHomes: {
    src: unsplash("1605774337664-7a846e9cdf17"),
    alt: "A living room with a grey sofa, a timber coffee table and a tall plant",
    width: 2400,
    height: 1800,
    credit: "Unsplash, unsplash.com/photos/77JACslA8G0",
    provisional: true,
  },
  forBusinesses: {
    src: unsplash("1544031064-9de80864ade5"),
    alt: "A café with timber tables and chairs in a white room",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/k6w8miMpfUI",
    provisional: true,
  },
  // About
  drawingByHand: {
    src: unsplash("1503387762-592deb58ef4e"),
    alt: "A drawing being made by hand at a timber desk, with a scale rule and a roll of paper",
    width: 2400,
    height: 1350,
    credit: "Unsplash, unsplash.com/photos/HtBlQdxfG9k",
    provisional: true,
  },
  // Service pages, one each
  serviceDesignBuild: {
    src: unsplash("1542621334-a254cf47733d"),
    alt: "A pencil resting on a construction drawing beside a scale rule",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/fteR0e2BzKo",
    provisional: true,
  },
  serviceRenovation: {
    src: unsplash("1666003449012-61951d621555"),
    alt: "A kitchen with a timber island and stools",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/8fd0resdtBk",
    provisional: true,
  },
  serviceNewBuild: {
    src: unsplash("1625337904562-efe0a0d9793f"),
    alt: "Brick walls of a house going up, with a mortar tub on the slab",
    width: 2400,
    height: 3600,
    credit: "Unsplash, unsplash.com/photos/0L1e0vqQHIM",
    provisional: true,
  },
  // Insights, one per article (keyed by the article's slug in insightImagery below)
  sunlitLivingRoom: {
    src: unsplash("1665249934445-1de680641f50"),
    alt: "A sunlit living room with a cream sofa, plants and tall curtains",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/AgK_XAqSbfk",
    provisional: true,
  },
  restaurantCounter: {
    src: unsplash("1622140739492-f82f386260b5"),
    alt: "A restaurant with timber tables, high stools and an open counter",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/iFyLBKmCrmQ",
    provisional: true,
  },
  swatchesOnPlan: {
    src: unsplash("1667400104764-a5fd01a919b0"),
    alt: "A hand holding a fan of colour swatches over a floor plan",
    width: 2400,
    height: 3600,
    credit: "Unsplash, unsplash.com/photos/pdCTX1harH4",
    provisional: true,
    focus: "50% 60%",
  },
  // Spares, for any other section that needs one
  diningByWindow: {
    src: unsplash("1623903800664-a840b8be323b"),
    alt: "A dining table under a pendant light beside a wall of tall windows",
    width: 2400,
    height: 1350,
    credit: "Unsplash, unsplash.com/photos/DsH3VOZanYA",
    provisional: true,
  },
  slattedCafe: {
    src: unsplash("1553487164-47dd19cf0a72"),
    alt: "A long room lined with vertical timber slats, with timber tables and stools",
    width: 2400,
    height: 2370,
    credit: "Unsplash, unsplash.com/photos/CVVbynP7DQ4",
    provisional: true,
  },
  roofTrusses: {
    src: unsplash("1621673610286-a6b5e788ab82"),
    alt: "New timber roof trusses against a blue sky",
    width: 2400,
    height: 3600,
    credit: "Unsplash, unsplash.com/photos/o-ANXY28n_w",
    provisional: true,
  },

  // About (round 7, 23 Nov 2026). The hero behind the opening words, a stand-in for each founder's
  // portrait and one for the team photograph. No faces anywhere: a stranger's face must never be
  // read as Zhafiri's, Shaidee's or the team's, so the founders' frames hold still lifes of the work
  // and the team picture is a site crew seen from far above.
  aboutHero: {
    src: unsplash("1611827886404-495e633249ae"),
    alt: "A pale stone stair rising past a screen of timber slats under a skylight",
    width: 2400,
    height: 1600,
    focus: "50% 45%",
    credit: "Unsplash, unsplash.com/photos/8vLUJOdQR2Q",
    provisional: true,
  },
  founderDesk: {
    src: unsplash("1781888688940-5730c3fd5baf"),
    alt: "Floor plans and a laptop on a marble desk",
    width: 2400,
    height: 3598,
    focus: "50% 62%",
    credit: "Unsplash, unsplash.com/photos/rn00OVh0gEI",
    provisional: true,
  },
  founderSite: {
    src: unsplash("1791560120599-bc1063fb6a81"),
    alt: "Two white hard hats and work gloves hanging on hooks",
    width: 2400,
    height: 3600,
    focus: "50% 55%",
    credit: "Unsplash, unsplash.com/photos/uBhOzqx8__0",
    provisional: true,
  },
  siteCrew: {
    src: unsplash("1541888894402-f3b1af908be4"),
    alt: "A small crew in hard hats standing on a new concrete slab, seen from above",
    width: 2400,
    height: 1600,
    focus: "50% 58%",
    credit: "Unsplash, unsplash.com/photos/s9XDWLJ_LyE",
    provisional: true,
  },

  // Round 7b (23 Nov 2026): the client asked for professional headshots in the founders' frames.
  // Stand-ins only, until the studio's own portraits arrive. Like every photograph here they are
  // provisional: publicImage() drops them from production and the launch check blocks a live build
  // while they are referenced, so a stranger's face never goes live under a founder's name.
  founderPortraitA: {
    src: unsplash("1625850902501-cc6baef3e3b2"),
    alt: "Head-and-shoulders portrait of a man in a black T-shirt against a dark mottled backdrop",
    width: 2400,
    height: 3607,
    focus: "50% 38%",
    credit: "Unsplash, unsplash.com/photos/dwogG5EROW4",
    provisional: true,
  },
  founderPortraitB: {
    src: unsplash("1624395213043-fa2e123b2656"),
    alt: "Head-and-shoulders portrait of a man in a black T-shirt against a dark backdrop",
    width: 2400,
    height: 3600,
    focus: "50% 34%",
    credit: "Unsplash, unsplash.com/photos/hr_feH2URs0",
    provisional: true,
  },

  // The team, as one professional group portrait (the client's choice, 23 Nov 2026): a stand-in
  // until the studio's own team photograph, never captioned as ROUANG's people.
  teamGroup: {
    src: unsplash("1601513043334-36a0088140d4"),
    alt: "A group portrait of five colleagues standing against a plain studio backdrop",
    width: 2400,
    height: 1600,
    focus: "50% 40%",
    credit: "Unsplash, unsplash.com/photos/On_2YI8_cBU",
    provisional: true,
  },

  // The footer's background (round 7b), after the client's reference: a warm, sunlit interior.
  // footerRoom is the first choice; footerWall (plaster with leaf shadows) is the closer match in
  // tone but has no depth of room.
  footerRoom: {
    src: unsplash("1690927324993-53afef8c85ee"),
    alt: "Sunlight falling through a slatted skylight across a pale wall, with a tree in silhouette",
    width: 2400,
    height: 1600,
    focus: "60% 50%",
    credit: "Unsplash, unsplash.com/photos/BtSNothdKo4",
    provisional: true,
  },
  footerWall: {
    src: unsplash("1690983323067-aabb5b097c2a"),
    alt: "Soft leaf shadows on a beige plaster wall",
    width: 2400,
    height: 1600,
    credit: "Unsplash, unsplash.com/photos/lRIvBrnVEwA",
    provisional: true,
  },
} satisfies Record<string, Image>;

/** The temporary picture for each article, by slug. */
export const insightImagery: Record<string, Image> = {
  "how-to-choose-an-interior-designer-malaysia": placeholderImagery.sunlitLivingRoom,
  "restaurant-interior-design-decisions": placeholderImagery.restaurantCounter,
  "what-shapes-interior-design-cost": placeholderImagery.swatchesOnPlan,
};

/**
 * Enquiry form options. Plain data so the client form and the server validation share one list.
 * Budget brackets are provisional until the studio confirms how it wants to qualify enquiries.
 */

export const categories = [
  { value: "residential", label: "A home" },
  { value: "commercial", label: "A business" },
] as const;

export const projectTypes = {
  residential: ["Condominium or apartment", "Landed house", "One room or area", "Not sure yet"],
  // Neutral until the studio confirms office and retail work (the commercial service page is a draft).
  commercial: ["Restaurant, café or bar", "Another food business", "Another kind of space", "Not sure yet"],
} as const;

export const budgets = [
  "Not sure yet",
  "Under RM 50,000",
  "RM 50,000 to RM 100,000",
  "RM 100,000 to RM 250,000",
  "RM 250,000 to RM 500,000",
  "Above RM 500,000",
] as const;

export const timelines = ["As soon as possible", "Within 3 months", "In 3 to 6 months", "In 6 to 12 months", "Just exploring for now"] as const;

export type Category = (typeof categories)[number]["value"];

import "server-only";
import { z } from "zod";
import { budgets, projectTypes, timelines } from "@/config/enquiry";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .transform((v) => (v === "" ? null : v));

const phonePattern = /^\+?[\d\s\-().]{8,20}$/;

export const enquirySchema = z
  .object({
    name: z.string().trim().min(2, "Please tell us your name.").max(120, "Please shorten your name."),
    email: optionalText(254).refine((v) => v === null || z.email().safeParse(v).success, "That email address doesn't look right."),
    phone: optionalText(24).refine(
      (v) => v === null || (phonePattern.test(v) && v.replace(/\D/g, "").length >= 8),
      "Please include the full number, for example +60 12 345 6789.",
    ),
    category: z.enum(["residential", "commercial"], { error: "Is this for a home or a business?" }),
    projectType: optionalText(80),
    location: optionalText(120),
    budget: optionalText(60).refine((v) => v === null || (budgets as readonly string[]).includes(v), "Please choose a budget range."),
    timeline: optionalText(60).refine((v) => v === null || (timelines as readonly string[]).includes(v), "Please choose a timeline."),
    message: z
      .string()
      .trim()
      .min(10, "A sentence or two about the space helps us reply properly.")
      .max(3000, "Please keep this under 3,000 characters. You can send more detail later."),
    sourcePath: optionalText(300),
    utm: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if (!v.email && !v.phone) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Please give us an email address or a phone number." });
    }
    if (v.projectType) {
      const allowed = projectTypes[v.category] as readonly string[];
      if (!allowed.includes(v.projectType)) {
        ctx.addIssue({ code: "custom", path: ["projectType"], message: "Please choose a project type." });
      }
    }
  });

export type Enquiry = z.infer<typeof enquirySchema>;

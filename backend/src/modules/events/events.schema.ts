import { z } from "zod";

  export const createEventSchema = z.object({
    venueId: z.string().min(1, "venueId is required"),
    type: z.enum(["MOVIE", "CONCERT"]),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().default(""),
  });

  export type CreateEventInput = z.infer<typeof createEventSchema>;
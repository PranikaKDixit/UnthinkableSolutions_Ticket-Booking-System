 import { z } from "zod";

  export const createShowSchema = z.object({
    eventId: z.string().min(1, "eventId is required"),
    startsAt: z.coerce.date(),                       // ISO string -> Date
    pricing: z.array(z.object({
      categoryId: z.string().min(1),
      price: z.number().int().min(0),
    })).min(1, "At least one category price"),
  });

  export type CreateShowInput = z.infer<typeof createShowSchema>;
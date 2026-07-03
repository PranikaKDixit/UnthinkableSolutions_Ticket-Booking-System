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

  // Hold / release take an array of ShowSeat ids (what the seat map renders).
  export const seatIdsSchema = z.object({
    seatIds: z.array(z.string().min(1)).min(1, "Select at least one seat").max(8, "Up to 8 seats"),
  });
  export type SeatIdsInput = z.infer<typeof seatIdsSchema>;

  export const joinWaitlistSchema = z.object({
    categoryId: z.string().min(1, "categoryId is required"),
  });
  export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;
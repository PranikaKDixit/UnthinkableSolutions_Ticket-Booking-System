import { z } from "zod";

export const createBookingSchema = z.object({
  showId: z.string().min(1, "showId is required"),
  seatIds: z.array(z.string().min(1)).min(1, "Select at least one seat").max(8, "Up to 8 seats"),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

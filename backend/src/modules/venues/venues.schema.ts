import { z } from "zod";

export const createVenueSchema = z.object({
name: z.string().trim().min(1, "Name is required"),
address: z.string().trim().min(1, "Address is required"),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;

 export const createCategorySchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    rank: z.number().int().min(0).default(0),        // 1 = Premium, 2 = Standard...
    color: z.string().trim().default("#888888"),     // for the seat-map UI later
  });

  export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

 export const createSeatsSchema = z.object({
    categoryId: z.string().min(1, "categoryId is required"),
    rows: z.array(z.string().trim().min(1)).min(1, "At least one row"),
    seatsPerRow: z.number().int().min(1).max(100),
  });

export type CreateSeatsInput = z.infer<typeof createSeatsSchema>;
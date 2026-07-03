import { prisma } from "../../lib/prisma";
import { CreateVenueInput, CreateCategoryInput, CreateSeatsInput } from "./venues.schema";
import { HttpError } from "../../lib/httpError";   // add this import at the top

export function createVenue(input: CreateVenueInput) {
return prisma.venue.create({ data: input });
}

export function listVenues() {
return prisma.venue.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createCategory(venueId: string, input: CreateCategoryInput) {
const venue = await prisma.venue.findUnique({ where: { id: venueId } });
if (!venue) throw new HttpError(404, "Venue not found");
return prisma.seatCategory.create({ data: { venueId, ...input } });
}

export function listCategories(venueId: string) {
return prisma.seatCategory.findMany({
    where: { venueId },
    orderBy: { rank: "asc" },
});
}

 export async function createSeats(venueId: string, input: CreateSeatsInput) {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new HttpError(404, "Venue not found");

    // Category must exist AND belong to THIS venue
    const category = await prisma.seatCategory.findUnique({ where: { id: input.categoryId }
  });
    if (!category || category.venueId !== venueId) {
      throw new HttpError(404, "Category not found in this venue");
    }

    // Build the grid in memory
    const data = [];
    for (const rowLabel of input.rows) {
      for (let n = 1; n <= input.seatsPerRow; n++) {
        data.push({ venueId, categoryId: input.categoryId, rowLabel, seatNumber: n });
      }
    }

    // One bulk insert; skip seats that already exist
    return prisma.seat.createMany({ data, skipDuplicates: true }); // -> { count }
  }

  export function listSeats(venueId: string) {
    return prisma.seat.findMany({
      where: { venueId },
      orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
      include: { category: { select: { name: true, color: true, rank: true } } },
    });
  }

 import { prisma } from "../../lib/prisma";
  import { HttpError } from "../../lib/httpError";
  import { CreateShowInput } from "./shows.schema";

  export async function createShow(organiserId: string, input: CreateShowInput) {
    // 1. Load event + its venue's seats & categories; verify ownership
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      include: { venue: { include: { seats: true, categories: true } } },
    });
    if (!event) throw new HttpError(404, "Event not found");
    if (event.organiserId !== organiserId) throw new HttpError(403, "Not your event");

    // 2. Every pricing category must belong to this venue
    const validCategoryIds = new Set(event.venue.categories.map((c) => c.id));
    for (const p of input.pricing) {
      if (!validCategoryIds.has(p.categoryId)) {
        throw new HttpError(400, `Category ${p.categoryId} does not belong to this venue`);
      }
    }

    const seats = event.venue.seats;
    if (seats.length === 0) throw new HttpError(400, "Venue has no seats");

    // 3. Atomic: show + pricing + one ShowSeat per venue seat
    return prisma.$transaction(async (tx) => {
      const show = await tx.show.create({
        data: { eventId: input.eventId, startsAt: input.startsAt },
      });

      await tx.showPricing.createMany({
        data: input.pricing.map((p) => ({
          showId: show.id,
          categoryId: p.categoryId,
          price: p.price,
        })),
      });

      await tx.showSeat.createMany({
        data: seats.map((s) => ({ showId: show.id, seatId: s.id })), 
      });

      return show;
    });
  }

  export async function getShow(showId: string) {
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        event: { include: { venue: { select: { name: true } } } },
        pricing: { include: { category: { select: { name: true, color: true, rank: true } }
  } },
        _count: { select: { showSeats: true } },   // handy to confirm materialization
      },
    });
    if (!show) throw new HttpError(404, "Show not found");
    return show;
  }
  import { prisma } from "../../lib/prisma";
  import { HttpError } from "../../lib/httpError";
  import { CreateEventInput } from "./events.schema";

  export async function createEvent(organiserId: string, input: CreateEventInput) {
    const venue = await prisma.venue.findUnique({ where: { id: input.venueId } });
    if (!venue) throw new HttpError(404, "Venue not found");
    return prisma.event.create({ data: { organiserId, ...input } });
  }

  // Public browse, with an optional ?type= filter (MOVIE / CONCERT)
  export function listEvents(type?: string) {
    return prisma.event.findMany({
      where: type === "MOVIE" || type === "CONCERT" ? { type } : {},
      orderBy: { createdAt: "desc" },
      include: { venue: { select: { name: true, address: true } } },
    });
  }

  export async function getEvent(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: true, shows: true },
    });
    if (!event) throw new HttpError(404, "Event not found");
    return event;
  }

  // Events owned by the logged-in organiser (for their dashboard).
  export function listMyEvents(organiserId: string) {
    return prisma.event.findMany({
      where: { organiserId },
      orderBy: { createdAt: "desc" },
      include: { venue: { select: { name: true, address: true } }, shows: true },
    });
  }

  /**
   * Booking + revenue summary for one event, broken down per show. Organiser
   * must own the event. Powers the revenue report / charts.
   */
  export async function getEventSummary(organiserId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: { select: { name: true } }, shows: { orderBy: { startsAt: "asc" } } },
    });
    if (!event) throw new HttpError(404, "Event not found");
    if (event.organiserId !== organiserId) throw new HttpError(403, "Not your event");

    const shows = await Promise.all(
      event.shows.map(async (show) => {
        const [capacity, seatsSold, agg] = await Promise.all([
          prisma.showSeat.count({ where: { showId: show.id } }),
          prisma.showSeat.count({ where: { showId: show.id, status: "BOOKED" } }),
          prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: { showId: show.id, status: "CONFIRMED" },
          }),
        ]);
        const revenue = agg._sum.totalAmount ?? 0;
        return {
          ...show,
          summary: { seatsSold, capacity, revenue, occupancy: capacity ? seatsSold / capacity : 0 },
        };
      }),
    );

    const totalRevenue = shows.reduce((s, x) => s + x.summary.revenue, 0);
    const totalBooked = shows.reduce((s, x) => s + x.summary.seatsSold, 0);

    return { event, totalRevenue, totalBooked, shows };
  }
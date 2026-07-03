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
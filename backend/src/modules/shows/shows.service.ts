 import { prisma } from "../../lib/prisma";
  import { HttpError } from "../../lib/httpError";
  import { CreateShowInput } from "./shows.schema";
  import { env } from "../../lib/env";
  import { emitSeatUpdate } from "../../realtime";

  // Shared shape/order for reading a show's seats.
  const seatInclude = {
    seat: { include: { category: { select: { id: true, name: true, color: true, rank: true } } } },
  } as const;

  type SeatRow = {
    id: string;
    seatId: string;
    status: string;
    heldById: string | null;
    holdExpiresAt: Date | null;
    seat: {
      rowLabel: string;
      seatNumber: number;
      categoryId: string;
      category: { name: string; color: string; rank: number };
    };
  };

  // Map a raw ShowSeat row into the frontend `ShowSeat` shape. An expired hold
  // that the sweeper hasn't reclaimed yet is presented as AVAILABLE.
  function shapeSeat(r: SeatRow, priceByCat: Map<string, number>, now: Date, userId?: string) {
    const expired = r.status === "HELD" && !!r.holdExpiresAt && r.holdExpiresAt < now;
    const status = expired ? "AVAILABLE" : r.status;
    return {
      id: r.id,
      seatId: r.seatId,
      rowLabel: r.seat.rowLabel,
      seatNumber: r.seat.seatNumber,
      status,
      categoryId: r.seat.categoryId,
      category: r.seat.category,
      price: priceByCat.get(r.seat.categoryId) ?? 0,
      heldByMe: status === "HELD" && !!userId && r.heldById === userId,
      holdExpiresAt: status === "HELD" ? r.holdExpiresAt : null,
    };
  }

  async function priceMap(showId: string) {
    const pricing = await prisma.showPricing.findMany({ where: { showId } });
    return new Map(pricing.map((p) => [p.categoryId, p.price]));
  }

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

  /** Full seat map for a show, sorted row then seat number. */
  export async function getShowSeats(showId: string, userId?: string) {
    const show = await prisma.show.findUnique({ where: { id: showId }, select: { id: true } });
    if (!show) throw new HttpError(404, "Show not found");

    const now = new Date();
    const [rows, priceByCat] = await Promise.all([
      prisma.showSeat.findMany({ where: { showId }, include: seatInclude }),
      priceMap(showId),
    ]);

    return rows
      .map((r) => shapeSeat(r as unknown as SeatRow, priceByCat, now, userId))
      .sort((a, b) => a.rowLabel.localeCompare(b.rowLabel) || a.seatNumber - b.seatNumber);
  }

  /**
   * Place a hold on the given ShowSeat ids for `userId`.
   *
   * Concurrency safety: a single `updateMany` atomically flips seats to HELD
   * only when they are currently AVAILABLE, an expired hold, or already held by
   * this same user. Postgres row locks serialise competing calls, so if two
   * customers race for the same seat exactly one `updateMany` matches it — the
   * loser's `count` falls short and the whole transaction rolls back with 409.
   */
  export async function holdSeats(showId: string, userId: string, seatIds: string[]) {
    const now = new Date();
    const holdExpiresAt = new Date(now.getTime() + env.holdTtlSeconds * 1000);

    const claimed = await prisma.$transaction(async (tx) => {
      const result = await tx.showSeat.updateMany({
        where: {
          id: { in: seatIds },
          showId,
          OR: [
            { status: "AVAILABLE" },
            { status: "HELD", heldById: userId }, // extend my own hold
            { status: "HELD", holdExpiresAt: { lt: now } }, // reclaim an expired hold
          ],
        },
        data: { status: "HELD", heldById: userId, holdExpiresAt },
      });

      if (result.count !== seatIds.length) {
        throw new HttpError(409, "Some of those seats are no longer available");
      }

      return tx.showSeat.findMany({ where: { id: { in: seatIds }, showId }, include: seatInclude });
    });

    emitSeatUpdate(showId);
    const priceByCat = await priceMap(showId);
    const seats = claimed.map((r) => shapeSeat(r as unknown as SeatRow, priceByCat, now, userId));
    return { seats, holdExpiresAt };
  }

  /** Release seats the user currently holds (no-op for seats they don't). */
  export async function releaseSeats(showId: string, userId: string, seatIds: string[]) {
    const result = await prisma.showSeat.updateMany({
      where: { id: { in: seatIds }, showId, status: "HELD", heldById: userId },
      data: { status: "AVAILABLE", heldById: null, holdExpiresAt: null },
    });
    if (result.count > 0) emitSeatUpdate(showId);
    return { released: result.count };
  }

  /** Booking summary + revenue for a single show. */
  export async function showSummary(showId: string) {
    const show = await prisma.show.findUnique({ where: { id: showId }, select: { id: true } });
    if (!show) throw new HttpError(404, "Show not found");

    const [capacity, seatsSold, agg] = await Promise.all([
      prisma.showSeat.count({ where: { showId } }),
      prisma.showSeat.count({ where: { showId, status: "BOOKED" } }),
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { showId, status: "CONFIRMED" } }),
    ]);

    return {
      seatsSold,
      capacity,
      revenue: agg._sum.totalAmount ?? 0,
      occupancy: capacity ? seatsSold / capacity : 0,
    };
  }

  /** Join the waitlist for a category (idempotent per user/category). */
  export async function joinWaitlist(showId: string, userId: string, categoryId: string) {
    const pricing = await prisma.showPricing.findUnique({
      where: { showId_categoryId: { showId, categoryId } },
    });
    if (!pricing) throw new HttpError(400, "That category isn't available for this show");

    const existing = await prisma.waitlistEntry.findFirst({
      where: { showId, userId, categoryId, status: { in: ["WAITING", "OFFERED"] } },
      include: { category: { select: { name: true } } },
    });
    if (existing) return existing;

    const last = await prisma.waitlistEntry.findFirst({
      where: { showId, categoryId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    return prisma.waitlistEntry.create({
      data: { showId, userId, categoryId, position: (last?.position ?? 0) + 1, status: "WAITING" },
      include: { category: { select: { name: true } } },
    });
  }

  /** The user's active waitlist entry for a show, if any. */
  export async function myWaitlist(showId: string, userId: string) {
    return prisma.waitlistEntry.findFirst({
      where: { showId, userId, status: { in: ["WAITING", "OFFERED"] } },
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
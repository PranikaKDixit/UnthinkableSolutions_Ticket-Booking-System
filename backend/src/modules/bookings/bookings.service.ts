import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { emitSeatUpdate } from "../../realtime";
import { generateReference, qrDataUrl } from "../../lib/qr";
import { sendTicketEmail } from "../../lib/mailer";
import { offerSeatToNextInLine } from "../waitlist/waitlist.service";

// Everything needed to render a ticket + email it.
const bookingInclude = {
  user: { select: { name: true, email: true } },
  show: {
    select: {
      startsAt: true,
      event: { select: { title: true, type: true, venue: { select: { name: true } } } },
    },
  },
  seats: {
    include: {
      seat: { select: { rowLabel: true, seatNumber: true, category: { select: { name: true, color: true } } } },
    },
  },
} as const;

type FullBooking = Awaited<ReturnType<typeof loadBooking>>;

async function loadBooking(id: string) {
  const b = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!b) throw new HttpError(404, "Booking not found");
  return b;
}

/** Frontend `Booking` shape. QR is generated on demand from the reference. */
async function shapeBooking(b: NonNullable<FullBooking>, withQr = true) {
  const seats = b.seats
    .map((s) => ({
      rowLabel: s.seat.rowLabel,
      seatNumber: s.seat.seatNumber,
      category: s.seat.category,
    }))
    .sort((a, z) => a.rowLabel.localeCompare(z.rowLabel) || a.seatNumber - z.seatNumber);

  return {
    id: b.id,
    reference: b.reference,
    status: b.status,
    totalAmount: b.totalAmount,
    createdAt: b.createdAt,
    show: {
      startsAt: b.show.startsAt,
      event: { title: b.show.event.title, type: b.show.event.type, venue: b.show.event.venue },
    },
    seats,
    ...(withQr ? { qr: await qrDataUrl(b.reference) } : {}),
  };
}

async function emailTicket(b: NonNullable<FullBooking>) {
  const qr = await qrDataUrl(b.reference);
  await sendTicketEmail({
    to: b.user.email,
    name: b.user.name,
    reference: b.reference,
    eventTitle: b.show.event.title,
    venueName: b.show.event.venue?.name ?? "",
    startsAt: b.show.startsAt,
    seats: b.seats
      .map((s) => `${s.seat.rowLabel}${s.seat.seatNumber}`)
      .sort(),
    totalAmount: b.totalAmount,
    qr,
  });
}

/**
 * Convert the customer's held seats into a confirmed booking.
 *
 * Concurrency: inside one transaction we verify every seat is still HELD by
 * this user and unexpired, then flip them to BOOKED with a guarded updateMany.
 * If the guard matches fewer rows than requested (a hold expired or was stolen)
 * the transaction rolls back — no partial bookings, no double-selling.
 */
export async function createBooking(userId: string, showId: string, seatIds: string[]) {
  const booking = await prisma.$transaction(async (tx) => {
    const seats = await tx.showSeat.findMany({
      where: { id: { in: seatIds }, showId },
      include: { seat: { select: { categoryId: true } } },
    });
    if (seats.length !== seatIds.length) {
      throw new HttpError(400, "Some seats don't belong to this show");
    }

    const now = new Date();
    for (const s of seats) {
      const validHold =
        s.status === "HELD" && s.heldById === userId && !!s.holdExpiresAt && s.holdExpiresAt > now;
      if (!validHold) {
        throw new HttpError(409, "Your hold on one or more seats has expired — please re-select");
      }
    }

    const priceByCat = new Map(
      (await tx.showPricing.findMany({ where: { showId } })).map((p) => [p.categoryId, p.price]),
    );
    const totalAmount = seats.reduce((sum, s) => sum + (priceByCat.get(s.seat.categoryId) ?? 0), 0);

    const created = await tx.booking.create({
      data: { reference: generateReference(), userId, showId, totalAmount, status: "CONFIRMED" },
    });

    const upd = await tx.showSeat.updateMany({
      where: { id: { in: seatIds }, showId, status: "HELD", heldById: userId },
      data: { status: "BOOKED", bookingId: created.id, heldById: null, holdExpiresAt: null },
    });
    if (upd.count !== seatIds.length) {
      throw new HttpError(409, "Seat hold changed during checkout — please try again");
    }

    return created;
  });

  emitSeatUpdate(showId);
  const full = await loadBooking(booking.id);
  await emailTicket(full); // best-effort (never throws)
  return shapeBooking(full);
}

export async function listBookings(userId: string) {
  const rows = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: bookingInclude,
  });
  // List view doesn't render the QR — skip generating it for speed.
  return Promise.all(rows.map((b) => shapeBooking(b, false)));
}

export async function getBooking(userId: string, bookingId: string) {
  const b = await loadBooking(bookingId);
  if (b.userId !== userId) throw new HttpError(403, "Not your booking");
  return shapeBooking(b);
}

/**
 * Cancel a confirmed booking: free its seats and offer each one to the next
 * waitlisted customer in that category (time-limited offer + email).
 */
export async function cancelBooking(userId: string, bookingId: string) {
  const { showId, seatIds } = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { seats: { select: { id: true } } },
    });
    if (!b) throw new HttpError(404, "Booking not found");
    if (b.userId !== userId) throw new HttpError(403, "Not your booking");
    if (b.status !== "CONFIRMED") throw new HttpError(400, "Booking is already cancelled");

    await tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

    const ids = b.seats.map((s) => s.id);
    await tx.showSeat.updateMany({
      where: { id: { in: ids } },
      data: { status: "AVAILABLE", bookingId: null, heldById: null, holdExpiresAt: null },
    });

    return { showId: b.showId, seatIds: ids };
  });

  emitSeatUpdate(showId);

  // Re-allocate each freed seat to the waitlist (best-effort, non-blocking).
  for (const id of seatIds) {
    await offerSeatToNextInLine(id).catch((err) => console.error("[booking] offer failed:", err));
  }

  return shapeBooking(await loadBooking(bookingId));
}

/**
 * Accept a time-limited waitlist offer: turn the reserved seat into a confirmed
 * booking for the offered customer.
 */
export async function acceptOffer(userId: string, token: string) {
  const entry = await prisma.waitlistEntry.findUnique({ where: { offerToken: token } });
  if (!entry) throw new HttpError(404, "Offer not found");
  if (entry.userId !== userId) throw new HttpError(403, "This offer isn't yours");
  if (entry.status !== "OFFERED" || !entry.offeredSeatId) {
    throw new HttpError(400, "This offer is no longer available");
  }
  if (!entry.offerExpiresAt || entry.offerExpiresAt < new Date()) {
    await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { status: "EXPIRED" } });
    throw new HttpError(410, "This offer has expired");
  }

  const seatId = entry.offeredSeatId;

  const booking = await prisma.$transaction(async (tx) => {
    const seat = await tx.showSeat.findUnique({
      where: { id: seatId },
      include: { seat: { select: { categoryId: true } } },
    });
    if (!seat || seat.status !== "HELD" || seat.heldById !== userId) {
      throw new HttpError(409, "That seat is no longer available");
    }

    const pricing = await tx.showPricing.findUnique({
      where: { showId_categoryId: { showId: entry.showId, categoryId: seat.seat.categoryId } },
    });

    const created = await tx.booking.create({
      data: {
        reference: generateReference(),
        userId,
        showId: entry.showId,
        totalAmount: pricing?.price ?? 0,
        status: "CONFIRMED",
      },
    });

    const upd = await tx.showSeat.updateMany({
      where: { id: seatId, status: "HELD", heldById: userId },
      data: { status: "BOOKED", bookingId: created.id, heldById: null, holdExpiresAt: null },
    });
    if (upd.count !== 1) throw new HttpError(409, "That seat is no longer available");

    await tx.waitlistEntry.update({ where: { id: entry.id }, data: { status: "CONVERTED" } });
    return created;
  });

  emitSeatUpdate(entry.showId);
  const full = await loadBooking(booking.id);
  await emailTicket(full);
  return shapeBooking(full);
}

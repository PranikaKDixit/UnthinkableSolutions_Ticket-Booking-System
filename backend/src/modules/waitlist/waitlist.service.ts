import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";
import { emitSeatUpdate } from "../../realtime";
import { generateOfferToken } from "../../lib/qr";
import { sendOfferEmail } from "../../lib/mailer";

/**
 * Offer a single freed ShowSeat to the next WAITING customer in that seat's
 * category. Reserves the seat (HELD to the offered user, TTL = OFFER_TTL) and
 * emails them a time-limited claim link. Returns true if an offer was made.
 *
 * The seat must currently be AVAILABLE; a conditional update guarantees we
 * never offer a seat someone else grabbed in the meantime.
 */
export async function offerSeatToNextInLine(showSeatId: string): Promise<boolean> {
  const seat = await prisma.showSeat.findUnique({
    where: { id: showSeatId },
    include: {
      seat: { select: { rowLabel: true, seatNumber: true, categoryId: true } },
      show: { select: { id: true, event: { select: { title: true } } } },
    },
  });
  if (!seat || seat.status !== "AVAILABLE") return false;

  const next = await prisma.waitlistEntry.findFirst({
    where: { showId: seat.showId, categoryId: seat.seat.categoryId, status: "WAITING" },
    orderBy: { position: "asc" },
    include: { user: { select: { name: true, email: true } }, category: { select: { name: true } } },
  });
  if (!next) return false;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.offerTtlSeconds * 1000);
  const token = generateOfferToken();

  // Reserve the seat for the offered user — bail if it slipped away.
  const claimed = await prisma.showSeat.updateMany({
    where: { id: showSeatId, status: "AVAILABLE" },
    data: { status: "HELD", heldById: next.userId, holdExpiresAt: expiresAt },
  });
  if (claimed.count === 0) return false;

  await prisma.waitlistEntry.update({
    where: { id: next.id },
    data: { status: "OFFERED", offerToken: token, offerExpiresAt: expiresAt, offeredSeatId: showSeatId },
  });

  emitSeatUpdate(seat.showId);

  await sendOfferEmail({
    to: next.user.email,
    name: next.user.name,
    eventTitle: seat.show.event.title,
    categoryName: next.category.name,
    seatLabel: `${seat.seat.rowLabel}${seat.seat.seatNumber}`,
    offerUrl: `${env.frontendUrl}/offer/${token}`,
    expiresAt,
  });

  return true;
}

/**
 * Expire waitlist offers whose window has passed: mark them EXPIRED, free the
 * reserved seat, and roll the offer to the next person in line. Called by the
 * scheduler. Returns how many offers expired.
 */
export async function expireOffers(): Promise<number> {
  const now = new Date();
  const expired = await prisma.waitlistEntry.findMany({
    where: { status: "OFFERED", offerExpiresAt: { lt: now } },
    select: { id: true, showId: true, offeredSeatId: true },
  });

  for (const e of expired) {
    await prisma.waitlistEntry.update({ where: { id: e.id }, data: { status: "EXPIRED" } });
    if (!e.offeredSeatId) continue;

    // Free the reserved seat (only if still held for this offer)…
    const freed = await prisma.showSeat.updateMany({
      where: { id: e.offeredSeatId, status: "HELD" },
      data: { status: "AVAILABLE", heldById: null, holdExpiresAt: null },
    });
    if (freed.count > 0) {
      emitSeatUpdate(e.showId);
      // …and offer it to whoever is next.
      await offerSeatToNextInLine(e.offeredSeatId).catch((err) =>
        console.error("[waitlist] re-offer failed:", err),
      );
    }
  }

  return expired.length;
}

/**
 * Release normal (non-offer) seat holds whose TTL has expired. Seats reserved
 * for an active waitlist offer are excluded — those are managed by expireOffers.
 * Called by the scheduler. Returns how many holds were released.
 */
export async function releaseExpiredHolds(): Promise<number> {
  const now = new Date();
  const expired = await prisma.showSeat.findMany({
    where: { status: "HELD", holdExpiresAt: { lt: now } },
    select: { id: true, showId: true },
  });
  if (expired.length === 0) return 0;

  const offered = await prisma.waitlistEntry.findMany({
    where: { status: "OFFERED", offeredSeatId: { in: expired.map((e) => e.id) } },
    select: { offeredSeatId: true },
  });
  const offeredIds = new Set(offered.map((o) => o.offeredSeatId));
  const toRelease = expired.filter((e) => !offeredIds.has(e.id));
  if (toRelease.length === 0) return 0;

  await prisma.showSeat.updateMany({
    where: { id: { in: toRelease.map((e) => e.id) }, status: "HELD", holdExpiresAt: { lt: now } },
    data: { status: "AVAILABLE", heldById: null, holdExpiresAt: null },
  });

  new Set(toRelease.map((e) => e.showId)).forEach(emitSeatUpdate);
  return toRelease.length;
}

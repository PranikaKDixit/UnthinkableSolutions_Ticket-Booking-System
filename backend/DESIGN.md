# System Design Write-up

This document covers the four mechanisms the brief evaluates: the seat-hold TTL, concurrency prevention, waitlist auto-assignment, and the time-limited offer flow.

## Data model foundation

Every mechanism rests on one table: **`ShowSeat`**. When an organiser creates a show, the system materialises exactly one `ShowSeat` row per physical venue seat, guarded by a unique constraint `@@unique([showId, seatId])`. Each row is a small state machine with `status` (`AVAILABLE → HELD → BOOKED`), plus `heldById`, `holdExpiresAt`, and `bookingId`. Because there is a single authoritative row per seat, "who owns this seat right now" is never ambiguous, and the database — not application code — is the arbiter of contention.

## Seat hold & TTL mechanism

Holding is deliberately a *database* operation, not a read-then-write in application memory. A hold request runs a single guarded `updateMany` inside a transaction:

```
UPDATE ShowSeat
SET status='HELD', heldById=:user, holdExpiresAt=now()+TTL
WHERE id IN (:seatIds) AND showId=:show
  AND ( status='AVAILABLE'
     OR (status='HELD' AND heldById=:user)          -- extend my own hold
     OR (status='HELD' AND holdExpiresAt < now()) )  -- reclaim an expired hold
```

`holdExpiresAt` is stamped as `now() + HOLD_TTL_SECONDS` (default 600s / 10 min). The predicate lets a user re-hold their own seats and lets anyone reclaim a hold whose TTL has lapsed, without waiting for a background job.

**Auto-release** happens two ways. First, a `node-cron` **sweeper** runs every `SWEEP_INTERVAL_SECONDS`, flipping any `HELD` row past its `holdExpiresAt` back to `AVAILABLE` and emitting a real-time update — this is the durable, authoritative release. Second, the seat-map *read* endpoint treats a hold past expiry as `AVAILABLE` on the fly, so the UI is never wrong in the gap between sweeps. Abandoning checkout therefore needs no explicit action: the timer lapses, the sweep runs, the seat frees, and every open seat map refreshes.

## Concurrency prevention

The core guarantee — two customers must never both hold or book the same seat — comes from making the winning condition part of the `WHERE` clause and checking the **affected-row count**. When two requests race for the same seat, Postgres serialises the row-level writes; the first `UPDATE` matches the row, the second finds `status` no longer `AVAILABLE` and matches nothing. The service compares `result.count` against the number of requested seats: if they differ, at least one seat was lost, so the whole transaction throws `409 Conflict` and rolls back. This is atomic and all-or-nothing — a partial multi-seat hold can never be committed. No optimistic-locking version column, no advisory locks, and no distributed lock service are required; the unique row plus the conditional update *is* the lock.

**Booking** reuses the identical pattern one state further along. Inside a transaction it verifies each seat is still a valid, unexpired hold owned by the caller, creates the `Booking`, then flips `HELD → BOOKED` with a guarded `updateMany` keyed on `heldById=:user`. If the count falls short (a hold expired mid-checkout, or the sweeper reclaimed it), the transaction rolls back and the booking never exists.

## Waitlist auto-assignment

A `WaitlistEntry` is a per-**category** FIFO queue: each new entry takes `max(position)+1` for that show+category, with an index on `(showId, categoryId, status, position)` for fast "next in line" lookups. Joining is idempotent — a user already `WAITING`/`OFFERED` for a category gets their existing entry back rather than a duplicate.

Assignment is event-driven, triggered by a cancellation. Cancelling a booking flips its seats to `AVAILABLE` and then, for each freed seat, calls `offerSeatToNextInLine(seat)`. That routine finds the earliest `WAITING` entry in the seat's category and makes it an offer (below). Because assignment keys on the freed seat's own category, a Premium cancellation only ever flows to Premium waiters.

## Time-limited offer flow

Offering is not a soft "you're up" ping — it **reserves** the physical seat so nobody can grab it from under the offered customer. `offerSeatToNextInLine` conditionally re-holds the seat (`AVAILABLE → HELD`, `heldById =` the waiter, `holdExpiresAt = now + OFFER_TTL_SECONDS`), sets the entry to `OFFERED` with a random `offerToken` and `offeredSeatId`, and emails a link `/offer/:token`. The conditional update means if the seat vanished in the interim, no false offer is sent.

**Accepting** (`POST /waitlist/offer/:token/accept`) validates the token, ownership, `OFFERED` status, and expiry, then — in a transaction — converts the reserved seat `HELD → BOOKED`, creates the booking, marks the entry `CONVERTED`, and emails the QR ticket.

**Expiry and roll-over** are handled by the same sweeper. Offers past `offerExpiresAt` are marked `EXPIRED`, their reserved seat is freed, and `offerSeatToNextInLine` is called again — cascading the offer down the queue automatically until someone accepts or the queue empties. Because the offer seat is excluded from the ordinary hold-release path (it's tracked as an active offer, not an abandoned hold), the two TTL flows never fight over the same row.

## Real-time & delivery

Every state transition emits a Socket.IO `seat:update` to the show's room; clients refetch, with a 20-second poll as a fallback. QR codes encode the unique booking reference and are rendered to PNG data-URLs; email is best-effort (a mail outage can't fail a confirmed booking) and falls back to an Ethereal test inbox when no SMTP is configured.

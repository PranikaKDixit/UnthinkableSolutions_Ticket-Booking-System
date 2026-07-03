# CineSeat — Backend

REST + WebSocket API for a ticket-booking platform: visual seat maps, concurrency-safe seat holds with a TTL auto-release, a per-category waitlist with time-limited offers, and QR-code email tickets.

**Stack:** Node.js · Express · TypeScript · Prisma · PostgreSQL · Socket.IO · node-cron · Nodemailer · JWT (httpOnly cookies) · Zod

---

## 1. Setup

### Prerequisites
- Node 18+
- PostgreSQL 13+

### Install
```bash
cd backend
npm install
cp .env.example .env      # then edit values (DATABASE_URL, JWT_SECRET…)
```

### Database
```bash
npx prisma migrate deploy   # apply migrations
npx prisma generate         # generate the client
npx ts-node prisma/seed.ts  # create the admin user
```
The seed creates an admin: **admin@ticketing.com / admin123**.

### Run
```bash
npm run dev     # ts-node-dev, hot reload
# or
npm run build && npm start
```
Server starts on `http://localhost:5000`, attaches Socket.IO on the same port, and starts the TTL sweeper.

### Email in development
If `SMTP_HOST` is blank, the app auto-creates a free **Ethereal** test inbox and logs a **preview URL** for every email (ticket confirmations, waitlist offers). No mail credentials needed to exercise the full flow. Set the SMTP vars for real delivery.

---

## 2. Environment variables

See [`.env.example`](./.env.example). Key ones:

| Var | Meaning |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_EXPIRES` | Auth token signing + lifetime |
| `HOLD_TTL_SECONDS` | Seat-hold lifetime before auto-release (default 600) |
| `OFFER_TTL_SECONDS` | Waitlist-offer link lifetime (default 600) |
| `SWEEP_INTERVAL_SECONDS` | How often the TTL sweeper runs (default 30) |
| `CORS_ORIGIN` / `FRONTEND_URL` | Frontend origin; offer links in emails |
| `SMTP_*` / `MAIL_FROM` | Email delivery (blank host → Ethereal) |

---

## 3. Auth model

- JWT is issued on register/login and stored in an **httpOnly cookie** (`token`). The frontend calls the API with `withCredentials: true`; no token is exposed to JS.
- Roles: `CUSTOMER`, `ORGANISER`, `ADMIN`. Registration allows CUSTOMER/ORGANISER; ADMIN exists only via the seed.
- Middleware: `requireAuth` (rejects if no valid cookie), `optionalAuth` (attaches user if present, else anonymous — used by the public seat map so it can flag "held by me"), `requireRole(...roles)`.

---

## 4. API reference

All responses are JSON `{ success: true, ... }`; errors are `{ success: false, message, errors? }` with an appropriate status code.

### Auth
| Method | Path | Auth | Body / notes |
|---|---|---|---|
| POST | `/auth/register` | – | `{ name, email, password, role? }` → sets cookie |
| POST | `/auth/login` | – | `{ email, password }` → sets cookie |
| POST | `/auth/logout` | – | clears cookie |
| GET | `/auth/me` | cookie | current user |

### Venues (admin)
| Method | Path | Role | Body |
|---|---|---|---|
| POST | `/venues` | ADMIN | `{ name, address }` |
| GET | `/venues` | any | list |
| POST | `/venues/:venueId/categories` | ADMIN | `{ name, rank, color }` |
| GET | `/venues/:venueId/categories` | any | list |
| POST | `/venues/:venueId/seats` | ADMIN | `{ categoryId, rows:[], seatsPerRow }` → `{ created }` |
| GET | `/venues/:venueId/seats` | any | list |

### Events
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/events` | ORGANISER | `{ venueId, type, title, description }` |
| GET | `/events` | public | `?type=MOVIE\|CONCERT` filter |
| GET | `/events/mine` | ORGANISER | organiser's own events |
| GET | `/events/:eventId/summary` | ORGANISER | revenue + occupancy per show |
| GET | `/events/:eventId` | public | detail incl. shows |

### Shows & seat map
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/shows` | ORGANISER | `{ eventId, startsAt, pricing:[{categoryId, price}] }` — materializes one `ShowSeat` per venue seat |
| GET | `/shows/:showId` | public | show + pricing |
| GET | `/shows/:showId/seats` | optional | full seat map with live status, price, `heldByMe` |
| POST | `/shows/:showId/hold` | cookie | `{ seatIds:[] }` → `{ seats, holdExpiresAt }` (409 on conflict) |
| POST | `/shows/:showId/release` | cookie | `{ seatIds:[] }` → releases own holds |
| GET | `/shows/:showId/summary` | public | `{ seatsSold, capacity, revenue, occupancy }` |
| POST | `/shows/:showId/waitlist` | cookie | `{ categoryId }` → join waitlist |
| GET | `/shows/:showId/waitlist/me` | cookie | caller's active waitlist entry |

### Bookings
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/bookings` | cookie | `{ showId, seatIds }` → confirms held seats, generates QR, emails ticket |
| GET | `/bookings` | cookie | caller's booking history |
| GET | `/bookings/:bookingId` | cookie | detail incl. QR data-URL |
| POST | `/bookings/:bookingId/cancel` | cookie | cancels + frees seats + offers to waitlist |
| POST | `/waitlist/offer/:token/accept` | cookie | claim a time-limited offer → new confirmed booking |

### Real-time (Socket.IO)
- Client emits `show:join` / `show:leave` with a `showId` (per-show room).
- Server emits `seat:update` `{ showId }` on every hold, release, booking, cancellation, offer, and TTL expiry. The frontend refetches the seat map on receipt (with a 20s poll fallback).

---

## 5. Database schema

```
User (id, name, email, passwordHash, role)
Venue (id, name, address)
  └─ SeatCategory (id, venueId, name, rank, color)
  └─ Seat (id, venueId, categoryId, rowLabel, seatNumber)  @@unique(venueId,row,number)
Event (id, organiserId, venueId, type, title, description)
  └─ Show (id, eventId, startsAt)
       ├─ ShowPricing (showId, categoryId, price)          @@unique(showId,categoryId)
       ├─ ShowSeat (id, showId, seatId, status,            @@unique(showId,seatId)
       │            heldById, holdExpiresAt, bookingId)
       ├─ Booking (id, reference[unique], userId, status, totalAmount)
       └─ WaitlistEntry (id, showId, categoryId, userId, position,
                         status, offerToken[unique], offerExpiresAt, offeredSeatId)
```

- **`ShowSeat`** is the heart of the system: exactly one row per (show, seat) — enforced by `@@unique([showId, seatId])` — carrying the live `status` (`AVAILABLE | HELD | BOOKED`), who holds it, and when the hold expires.
- **`Booking.reference`** is unique and is the value encoded into the QR code.
- **`WaitlistEntry`** is a per-category FIFO queue (`position`), with an `offerToken` + `offerExpiresAt` for the time-limited offer and `offeredSeatId` naming the reserved seat while `OFFERED`.

---

## 6. Seat-hold & waitlist logic (summary)

**Hold (concurrency-safe).** A hold is a single guarded `updateMany` inside a transaction: flip the requested seats to `HELD` **only if** they are currently `AVAILABLE`, an expired hold, or already held by the same user. If the affected-row count ≠ requested count, the transaction rolls back with **409** — so of two racing customers exactly one wins. `holdExpiresAt = now + HOLD_TTL_SECONDS`.

**Auto-release (TTL).** A `node-cron` sweeper (`SWEEP_INTERVAL_SECONDS`) flips expired holds back to `AVAILABLE` and emits `seat:update`. The seat map also treats a hold past its expiry as available on read, so the UI never shows a phantom hold even between sweeps.

**Booking.** Confirming re-checks each seat is still a valid unexpired hold by the caller, then flips `HELD → BOOKED` with a guarded `updateMany` in a transaction (no partial bookings). A unique `reference` is generated, rendered to a QR PNG data-URL, and emailed.

**Waitlist.** When sold out, a customer joins a per-category FIFO queue. On cancellation each freed seat is offered to the next `WAITING` customer: the seat is reserved (`HELD` to them, TTL = `OFFER_TTL_SECONDS`), the entry becomes `OFFERED` with a token, and an email with a time-limited link is sent. Accepting converts it to a booking; if the offer expires, the sweeper frees the seat and re-offers it to the next in line.

See [`DESIGN.md`](./DESIGN.md) for the full write-up.

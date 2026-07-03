# 🎟️ CineSeat — Ticket Booking System

A full-stack ticket-booking platform for **movies and concerts**: customers book seats from a real-time visual map, held seats auto-release on checkout abandonment, sold-out shows run a **waitlist with automatic seat reallocation**, and every confirmed booking produces a **QR-code email ticket**.

Built for the Unthinkable Solutions assignment.

---

## 🔗 Live Demo

**App:** https://cineseat-nine.vercel.app

> ⏱️ The backend is on Render's free tier and **sleeps after ~15 min idle** — the first request may take ~40s to wake up, then it's fast. Give it a moment on first load.

### Demo logins

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@ticketing.com` | `admin123` |
| **Organiser** | `organiser@cineseat.com` | `demo1234` |
| **Customer** | `aarav@example.com` | `demo1234` |
| **Customer** | `diya@example.com` | `demo1234` |

The database is pre-seeded with a catalogue (4 movies, 4 concerts, full seat grids). One show — **“Sneak Preview: Tenet”** — is deliberately staged **sold-out with a customer already waitlisted**, so the waitlist → offer-email → claim flow can be demoed in a single click: log in as **Aarav → My Bookings → cancel**, and **Diya** receives the time-limited offer.

> 📧 **Where are the emails?** No real inbox is configured, so tickets and offers are sent to a free **Ethereal** test inbox. Each send logs a preview URL in the **Render → Logs** tab (`preview: https://ethereal.email/...`) — open it to see the rendered email with the QR code.

---

## 📸 Screenshots

| Login | Seat selection | QR ticket |
|:---:|:---:|:---:|
| ![Login page](docs/screenshots/login.png) | ![Selecting seats on the visual map](docs/screenshots/seat-selection.png) | ![Confirmed booking with QR ticket](docs/screenshots/qr-ticket.png) |

---

## ✨ Features

Mapped to the assignment's evaluation focus:

- **Visual seat map** with per-seat live status — *available / held / booked* — rendered as a grid, one `ShowSeat` row per seat per show.
- **Seat holds with a configurable TTL** (default 10 min); held seats are locked for everyone else and **auto-release** via a background sweeper on abandonment.
- **Concurrency protection** — two customers can never hold or book the same seat; a guarded conditional update inside a transaction guarantees exactly one winner.
- **Waitlist per seat category** — when sold out, customers queue up (FIFO); on cancellation the freed seat is **auto-offered to the next in line** with a **time-limited link**, cascading down the queue on expiry.
- **QR-code email tickets** — every confirmed booking generates a unique reference, encodes it as a QR code, and emails the ticket.
- **Real-time updates** — Socket.IO pushes `seat:update` events so open seat maps reflect holds/bookings instantly (with a poll fallback).
- **Role-based auth** — Customer / Organiser / Admin, via JWT in an httpOnly cookie.
- **Organiser dashboard** — booking summary, revenue, and occupancy per event/show.

---

## 🧱 Tech Stack

**Backend** — Node.js · Express · TypeScript · Prisma · PostgreSQL · Socket.IO · node-cron · Nodemailer · JWT · Zod
**Frontend** — React 19 · Vite · TypeScript · Tailwind CSS · TanStack Query · Framer Motion · socket.io-client · Recharts
**Hosting** — Neon (Postgres) · Render (API) · Vercel (frontend)

---

## 📂 Project Structure

```
.
├── backend/           # Express + Prisma API, Socket.IO, TTL sweeper
│   ├── prisma/        # schema, migrations, seed
│   ├── src/
│   │   ├── modules/   # auth, venues, events, shows, bookings, waitlist
│   │   ├── lib/       # env, prisma, jwt, qr, mailer
│   │   ├── middleware/# auth (JWT + RBAC), error handler
│   │   ├── realtime.ts# socket.io server
│   │   ├── scheduler.ts# node-cron TTL sweeper
│   │   └── server.ts  # entry point
│   ├── README.md      # ← full setup guide, API reference, DB schema
│   └── DESIGN.md      # ← 800-word system design write-up
└── frontend/          # React + Vite SPA
    └── src/           # pages, components, hooks, api client
```

---

## 🚀 Quick Start (local)

**Prerequisites:** Node 18+, PostgreSQL 13+

### Backend
```bash
cd backend
npm install
cp .env.example .env            # then set DATABASE_URL, JWT_SECRET
npx prisma migrate deploy       # create tables
npx prisma generate
npx ts-node prisma/seed.ts      # seed the admin user
npm run dev                     # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to the backend, so no extra config is needed locally.

📖 **Full setup, environment variables, API reference, and DB schema:** [`backend/README.md`](./backend/README.md)

---

## 🧠 How the core mechanisms work

A concise summary — the full **800-word design write-up** is in [`backend/DESIGN.md`](./backend/DESIGN.md).

- **Seat hold & TTL** — a hold is a single guarded `updateMany` that flips seats to `HELD` only if currently available (or an expired/own hold), stamping `holdExpiresAt = now + TTL`. A `node-cron` sweeper releases expired holds and emits a real-time update; the seat-map read also treats an expired hold as available, so the UI is never stale.
- **Concurrency** — the winning condition lives in the SQL `WHERE` clause and the affected-row count is checked against the request. Postgres serialises the row writes, so of two racing requests exactly one matches; a mismatch rolls the transaction back with `409`. No partial holds or double-bookings are possible.
- **Waitlist & time-limited offers** — a per-category FIFO queue. On cancellation each freed seat is *reserved* for the next waiter (held to them, offer-TTL) and a claim link is emailed. Accepting converts it to a booking; on expiry the sweeper frees the seat and re-offers it to the next in line.

---

## 📦 Deliverables

- ✅ Complete source code (this repo, branch `main`)
- ✅ README with setup guide, `.env.example`, API docs, DB schema, seat-hold & waitlist explanation — see [`backend/README.md`](./backend/README.md)
- ✅ Hosted application URL — https://cineseat-nine.vercel.app
- ✅ System design write-up (≤800 words) — [`backend/DESIGN.md`](./backend/DESIGN.md)

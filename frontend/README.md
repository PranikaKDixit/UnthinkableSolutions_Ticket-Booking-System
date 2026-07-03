# CineSeat — Frontend

Dark-premium-cinema UI for the Ticket Booking System. React 19 + TypeScript + Vite,
Tailwind, React Router, TanStack Query, Framer Motion, socket.io, Recharts.

Covers all three roles: **Customer** (browse → visual seat map → hold → checkout → QR
ticket → history/cancel → waitlist), **Organiser** (events, shows, revenue reports), and
**Admin** (venues, categories, seat-layout builder).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api → http://localhost:5000)
npm run build      # type-check + production build
npm run preview    # serve the built app
```

The backend is expected on `http://localhost:5000`. In dev, Vite proxies both `/api`
(REST) and `/socket.io` (real-time seat updates) to it — see `vite.config.ts`.

### Environment

| Var | Default | Purpose |
|-----|---------|---------|
| `VITE_API_URL` | `/api` (proxied) | Backend origin in production, e.g. `https://api.example.com` |

Create `.env` (optional in dev):

```
VITE_API_URL=/api
```

## Project structure

```
src/
  api.ts              Typed API client (axios). Single seam to the backend contract.
  types.ts            Shared domain types mirroring Prisma models.
  main.tsx            Providers: Router, QueryClient, Auth, Toaster.
  App.tsx             Route table (public / customer / organiser / admin).
  context/
    AuthContext.tsx   Cookie-session auth (register/login/logout/me).
  hooks/
    useCountdown.ts   Live seat-hold TTL timer.
    useShowSeats.ts   Seat map query + socket live-refresh.
  lib/
    socket.ts         socket.io client + per-show seat subscription.
    format.ts         ₹, dates, mm:ss, initials.
    queryClient.ts    TanStack Query config.
    roleHome.ts       Post-login landing per role.
  components/
    ui.tsx            Button/Input/Select/Card/Badge/Spinner/EmptyState primitives.
    SeatMap.tsx       The visual seat grid (available/held/booked/selected).
    SeatLegend.tsx    Status + per-category price key.
    HoldCountdown.tsx Countdown pill; fires onExpire to release seats.
    QRTicket.tsx      Stylised e-ticket stub with the backend QR.
    WaitlistPanel.tsx Join / view per-category waitlist.
    RevenueChart.tsx  Organiser revenue bars (Recharts).
    Navbar/Layout/Modal/EventCard/StatCard/ProtectedRoute/Logo
  pages/
    Landing, Events, EventDetail, Login, Register, NotFound,
    SeatSelection, Checkout, Confirmation, MyBookings, BookingDetail, WaitlistOffer,
    organiser/{Dashboard,CreateEvent,CreateShow,EventReport},
    admin/{Venues,ManageVenue}
```

## API contract this UI expects

All responses are `{ success: true, ... }`; auth is via httpOnly cookie (`withCredentials`).
The exact methods/paths live in [`src/api.ts`](src/api.ts). Endpoints beyond the current
backend (seat map, holds, bookings, waitlist, reports, sockets) are documented there and
light up automatically once implemented — no frontend changes needed.

Real-time: the app joins a per-show room (`show:join`) and refetches the seat map on any
`seat:update` event, with a 20s poll as fallback.

## Images

See [`IMAGES.md`](IMAGES.md). Everything renders with gradient/icon fallbacks; drop in the
listed files (hero, posters) to make it shine. Nothing ever shows a broken-image box.

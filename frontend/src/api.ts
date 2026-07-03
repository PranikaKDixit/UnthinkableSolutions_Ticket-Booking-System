import axios from 'axios'
import type {
  User,
  Role,
  Venue,
  Category,
  Seat,
  EventItem,
  EventType,
  Show,
  ShowSeat,
  Booking,
  WaitlistEntry,
  ShowSummary,
  EventSummary,
} from './types'

// In dev, the Vite proxy forwards /api -> http://localhost:5000.
// In prod, set VITE_API_URL to the deployed backend origin.
const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

export const http = axios.create({ baseURL, withCredentials: true })

// Normalise backend errors into plain Error(message).
http.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.errors?.[0]?.message ||
      err.message ||
      'Request failed'
    return Promise.reject(new Error(msg))
  },
)

// Helper: unwrap `{ success, <pick> }`, or the whole body if no pick given.
function unwrap<T>(p: Promise<{ data: any }>, pick?: string): Promise<T> {
  return p.then((r) => (pick ? r.data[pick] : r.data)) as Promise<T>
}

/* ------------------------------ auth ------------------------------ */
export const authApi = {
  register: (b: { name: string; email: string; password: string; role: Role }) =>
    unwrap<User>(http.post('/auth/register', b), 'user'),
  login: (b: { email: string; password: string }) =>
    unwrap<User>(http.post('/auth/login', b), 'user'),
  logout: () => http.post('/auth/logout'),
  me: () => unwrap<User>(http.get('/auth/me'), 'user'),
}

/* --------------------------- venues (admin) --------------------------- */
export const venuesApi = {
  list: () => unwrap<Venue[]>(http.get('/venues'), 'venues'),
  create: (b: { name: string; address: string }) =>
    unwrap<Venue>(http.post('/venues', b), 'venue'),
  categories: (venueId: string) =>
    unwrap<Category[]>(http.get(`/venues/${venueId}/categories`), 'categories'),
  addCategory: (venueId: string, b: { name: string; rank: number; color: string }) =>
    unwrap<Category>(http.post(`/venues/${venueId}/categories`, b), 'category'),
  seats: (venueId: string) => unwrap<Seat[]>(http.get(`/venues/${venueId}/seats`), 'seats'),
  addSeats: (venueId: string, b: { categoryId: string; rows: string[]; seatsPerRow: number }) =>
    unwrap<{ created: number }>(http.post(`/venues/${venueId}/seats`, b)),
}

/* ------------------------------ events ------------------------------ */
export const eventsApi = {
  list: (type?: EventType) =>
    unwrap<EventItem[]>(http.get('/events', { params: type ? { type } : {} }), 'events'),
  get: (id: string) => unwrap<EventItem>(http.get(`/events/${id}`), 'event'),
  mine: () => unwrap<EventItem[]>(http.get('/events/mine'), 'events'),
  create: (b: { venueId: string; type: EventType; title: string; description: string }) =>
    unwrap<EventItem>(http.post('/events', b), 'event'),
  summary: (id: string) => unwrap<EventSummary>(http.get(`/events/${id}/summary`), 'summary'),
}

/* --------------------- shows / seat map / holds --------------------- */
export const showsApi = {
  get: (id: string) => unwrap<Show>(http.get(`/shows/${id}`), 'show'),
  create: (b: {
    eventId: string
    startsAt: string
    pricing: { categoryId: string; price: number }[]
  }) => unwrap<Show>(http.post('/shows', b), 'show'),
  seats: (id: string) => unwrap<ShowSeat[]>(http.get(`/shows/${id}/seats`), 'seats'),
  hold: (id: string, seatIds: string[]) =>
    unwrap<{ seats: ShowSeat[]; holdExpiresAt: string }>(
      http.post(`/shows/${id}/hold`, { seatIds }),
    ),
  release: (id: string, seatIds: string[]) => http.post(`/shows/${id}/release`, { seatIds }),
  summary: (id: string) => unwrap<ShowSummary>(http.get(`/shows/${id}/summary`), 'summary'),
  joinWaitlist: (id: string, categoryId: string) =>
    unwrap<WaitlistEntry>(http.post(`/shows/${id}/waitlist`, { categoryId }), 'entry'),
  myWaitlist: (id: string) =>
    unwrap<WaitlistEntry | null>(http.get(`/shows/${id}/waitlist/me`), 'entry'),
}

/* ----------------------------- bookings ----------------------------- */
export const bookingsApi = {
  create: (b: { showId: string; seatIds: string[] }) =>
    unwrap<Booking>(http.post('/bookings', b), 'booking'),
  list: () => unwrap<Booking[]>(http.get('/bookings'), 'bookings'),
  get: (id: string) => unwrap<Booking>(http.get(`/bookings/${id}`), 'booking'),
  cancel: (id: string) => unwrap<Booking>(http.post(`/bookings/${id}/cancel`), 'booking'),
  acceptOffer: (token: string) =>
    unwrap<Booking>(http.post(`/waitlist/offer/${token}/accept`), 'booking'),
}

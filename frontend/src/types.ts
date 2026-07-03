// ---- Shared domain types (mirror the backend Prisma models) ----

export type Role = 'CUSTOMER' | 'ORGANISER' | 'ADMIN'
export type EventType = 'MOVIE' | 'CONCERT'
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED'
export type BookingStatus = 'CONFIRMED' | 'CANCELLED'
export type WaitStatus = 'WAITING' | 'OFFERED' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt?: string
}

export interface Venue {
  id: string
  name: string
  address: string
  createdAt?: string
}

export interface Category {
  id: string
  venueId: string
  name: string
  rank: number
  color: string
}

export interface Seat {
  id: string
  rowLabel: string
  seatNumber: number
  categoryId: string
  category?: { name: string; color: string; rank: number }
}

export interface EventItem {
  id: string
  type: EventType
  title: string
  description: string
  venueId?: string
  venue?: { name: string; address: string }
  createdAt?: string
  posterUrl?: string
  shows?: Show[]
}

export interface Pricing {
  id?: string
  categoryId: string
  price: number
  category?: { name: string; color: string; rank: number }
}

export interface Show {
  id: string
  eventId: string
  startsAt: string
  event?: { title: string; type: EventType; venue?: { name: string } }
  pricing?: Pricing[]
  _count?: { showSeats: number }
}

/** One seat cell in a show's visual map. */
export interface ShowSeat {
  id: string
  seatId: string
  rowLabel: string
  seatNumber: number
  status: SeatStatus
  categoryId: string
  category: { name: string; color: string; rank: number }
  price: number
  heldByMe?: boolean
  holdExpiresAt?: string | null
}

export interface BookingSeat {
  rowLabel: string
  seatNumber: number
  category: { name: string; color: string }
}

export interface Booking {
  id: string
  reference: string
  status: BookingStatus
  totalAmount: number
  createdAt: string
  show?: {
    startsAt: string
    event?: { title: string; type: EventType; venue?: { name: string } }
  }
  seats?: BookingSeat[]
  qr?: string // QR code data-URL produced by the backend
}

export interface WaitlistEntry {
  id: string
  position: number
  status: WaitStatus
  categoryId: string
  category?: { name: string }
  offerToken?: string | null
  offerExpiresAt?: string | null
}

export interface ShowSummary {
  seatsSold: number
  capacity: number
  revenue: number
  occupancy: number // 0..1
}

export interface EventSummary {
  event: EventItem
  totalRevenue: number
  totalBooked: number
  shows: (Show & { summary: ShowSummary })[]
}

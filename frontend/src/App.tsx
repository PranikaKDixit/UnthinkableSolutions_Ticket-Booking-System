import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

// Public
import { Landing } from './pages/Landing'
import { Events } from './pages/Events'
import { EventDetail } from './pages/EventDetail'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { NotFound } from './pages/NotFound'

// Customer
import { SeatSelection } from './pages/SeatSelection'
import { Checkout } from './pages/Checkout'
import { Confirmation } from './pages/Confirmation'
import { MyBookings } from './pages/MyBookings'
import { BookingDetail } from './pages/BookingDetail'
import { WaitlistOffer } from './pages/WaitlistOffer'

// Organiser
import { OrganiserDashboard } from './pages/organiser/Dashboard'
import { CreateEvent } from './pages/organiser/CreateEvent'
import { CreateShow } from './pages/organiser/CreateShow'
import { EventReport } from './pages/organiser/EventReport'

// Admin
import { AdminVenues } from './pages/admin/Venues'
import { ManageVenue } from './pages/admin/ManageVenue'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Seat map is public to browse; holding prompts login */}
        <Route path="/shows/:showId" element={<SeatSelection />} />

        {/* Customer */}
        <Route
          path="/checkout/:showId"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirmation/:bookingId"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <Confirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:bookingId"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <BookingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offer/:token"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <WaitlistOffer />
            </ProtectedRoute>
          }
        />

        {/* Organiser */}
        <Route
          path="/organiser"
          element={
            <ProtectedRoute roles={['ORGANISER']}>
              <OrganiserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/new"
          element={
            <ProtectedRoute roles={['ORGANISER']}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/shows/new"
          element={
            <ProtectedRoute roles={['ORGANISER']}>
              <CreateShow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/:id/report"
          element={
            <ProtectedRoute roles={['ORGANISER']}>
              <EventReport />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/venues"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminVenues />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venues/:id"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ManageVenue />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

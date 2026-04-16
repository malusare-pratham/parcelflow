import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Customer
import HomePage from './pages/customer/HomePage'
import TripsPage from './pages/customer/TripsPage'
import TripDetailPage from './pages/customer/TripDetailPage'
import BookingPage from './pages/customer/BookingPage'
import MyBookingsPage from './pages/customer/MyBookingsPage'

// Driver
import DriverDashboard from './pages/driver/DriverDashboard'
import CreateTripPage from './pages/driver/CreateTripPage'
import DriverTripsPage from './pages/driver/DriverTripsPage'
import UploadDocsPage from './pages/driver/UploadDocsPage'
import DriverBookingsPage from './pages/driver/DriverBookingsPage'
import EarningsPage from './pages/driver/EarningsPage'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import DriversPanel from './pages/admin/DriversPanel'
import DriverDetailPage from './pages/admin/DriverDetailPage'
import TripsPanel from './pages/admin/TripsPanel'
import BookingsPanel from './pages/admin/BookingsPanel'
import CustomersPanel from './pages/admin/CustomersPanel'

// Guards
const RequireAuth = ({ children, role }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

const Spinner = () => (
  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
)

const RedirectByRole = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'driver') return <Navigate to="/driver" replace />
  return <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/redirect" element={<RedirectByRole />} />

        {/* Customer */}
        <Route path="/" element={<HomePage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/book/:tripId" element={
          <RequireAuth role="customer"><BookingPage /></RequireAuth>
        } />
        <Route path="/my-bookings" element={
          <RequireAuth role="customer"><MyBookingsPage /></RequireAuth>
        } />

        {/* Driver */}
        <Route path="/driver" element={
          <RequireAuth role="driver"><DriverDashboard /></RequireAuth>
        } />
        <Route path="/driver/trips" element={
          <RequireAuth role="driver"><DriverTripsPage /></RequireAuth>
        } />
        <Route path="/driver/create-trip" element={
          <RequireAuth role="driver"><CreateTripPage /></RequireAuth>
        } />
        <Route path="/driver/upload-docs" element={
          <RequireAuth role="driver"><UploadDocsPage /></RequireAuth>
        } />
        <Route path="/driver/bookings" element={
          <RequireAuth role="driver"><DriverBookingsPage /></RequireAuth>
        } />
        <Route path="/driver/earnings" element={
          <RequireAuth role="driver"><EarningsPage /></RequireAuth>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <RequireAuth role="admin"><AdminDashboard /></RequireAuth>
        } />
        <Route path="/admin/drivers" element={
          <RequireAuth role="admin"><DriversPanel /></RequireAuth>
        } />
        <Route path="/admin/drivers/:id" element={
          <RequireAuth role="admin"><DriverDetailPage /></RequireAuth>
        } />
        <Route path="/admin/trips" element={
          <RequireAuth role="admin"><TripsPanel /></RequireAuth>
        } />
        <Route path="/admin/bookings" element={
          <RequireAuth role="admin"><BookingsPanel /></RequireAuth>
        } />
        <Route path="/admin/customers" element={
          <RequireAuth role="admin"><CustomersPanel /></RequireAuth>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

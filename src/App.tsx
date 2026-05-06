import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AuthGuard from './components/AuthGuard'
import Home from './pages/Home'
import BikeDetail from './pages/BikeDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import Profile from './pages/Profile'
import MyBookings from './pages/MyBookings'
import BookingDetail from './pages/BookingDetail'
import Confirmation from './pages/Confirmation'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bikes/:model" element={<BikeDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={
          <AuthGuard><Checkout /></AuthGuard>
        } />
        <Route path="/profile" element={
          <AuthGuard><Profile /></AuthGuard>
        } />
        <Route path="/bookings" element={
          <AuthGuard><MyBookings /></AuthGuard>
        } />
        <Route path="/bookings/:id" element={
          <AuthGuard><BookingDetail /></AuthGuard>
        } />
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </Layout>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  const { isLoggedIn, isStaff, logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span style={{ fontSize: '24px' }}>&#x1F6B2;</span>
              <span className="text-xl font-bold text-brand-500">Bike Rental</span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-600 hover:text-brand-500 transition-colors">
                Bikes
              </Link>
              {isLoggedIn ? (
                <>
                  <Link to="/bookings" className="text-sm text-gray-600 hover:text-brand-500 transition-colors">
                    My Bookings
                  </Link>
                  <Link to="/profile" className="text-sm text-gray-600 hover:text-brand-500 transition-colors">
                    Profile
                  </Link>
                  {isStaff && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Staff
                    </span>
                  )}
                  <span className="text-sm text-gray-400 hidden sm:inline">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Bike Rental. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import MerchantHome from './pages/MerchantHome'
import MerchantProducts from './pages/MerchantProducts'
import MerchantStats from './pages/MerchantStats'
import MerchantProfile from './pages/MerchantProfile'
import MerchantOffers from './pages/MerchantOffers'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MerchantOnboarding from './pages/MerchantOnboarding'

function App() {
  const { user } = useAuthStore()
  const isMerchant = user?.role === 'merchant'

  // Redirect non-merchants to customer app
  if (user && !isMerchant) {
    window.location.href = 'http://localhost:5173'
    return null
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<MerchantOnboarding />} />

        {/* Protected Merchant Routes */}
        <Route
          path="/"
          element={isMerchant ? <MerchantHome /> : <Navigate to="/login" />}
        />
        <Route
          path="/products"
          element={isMerchant ? <MerchantProducts /> : <Navigate to="/login" />}
        />
        <Route
          path="/stats"
          element={isMerchant ? <MerchantStats /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isMerchant ? <MerchantProfile /> : <Navigate to="/login" />}
        />
        <Route
          path="/offers"
          element={isMerchant ? <MerchantOffers /> : <Navigate to="/login" />}
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

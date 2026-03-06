import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from './store/authStore'
import TopNav from './components/ui/TopNav'
import BottomNav from './components/ui/BottomNav'

// Lazy load pages for performance
const Home = lazy(() => import('./pages/user/Home'))
const Categories = lazy(() => import('./pages/user/Categories'))
const Search = lazy(() => import('./pages/user/Search'))
const Offers = lazy(() => import('./pages/user/Offers'))
const Account = lazy(() => import('./pages/user/Account'))
const BroadcastPage = lazy(() => import('./pages/user/BroadcastPage'))
const BroadcastRadar = lazy(() => import('./pages/user/BroadcastRadar'))
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const UserOnboarding = lazy(() => import('./pages/auth/UserOnboarding'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboardEnhanced'))

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-nearby-500 flex items-center justify-center animate-pulse-glow">
        <span className="text-white font-display font-bold text-lg">N</span>
      </div>
      <span className="text-sm text-gray-400">Loading...</span>
    </div>
  </div>
)

// Onboarding paths that hide standard nav
const HIDE_NAV_PATHS = ['/login', '/signup', '/onboarding', '/merchant/signup']

// Navigation wrapper — decides which nav bars to show
function NavigationShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const hideNav =
    HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p)) ||
    location.pathname.startsWith('/merchant') ||
    location.pathname.startsWith('/admin')

  return (
    <>
      {!hideNav && <TopNav />}
      {children}
      {!hideNav && <BottomNav />}
    </>
  )
}

function App() {
  const { user } = useAuthStore()
  const isMerchant = user?.role === 'merchant'
  const isAdmin = user?.role === 'admin'

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavigationShell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:id" element={<Categories />} />
              <Route path="/search" element={<Search />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/account" element={<Account />} />
              <Route path="/broadcast" element={<BroadcastPage />} />
              <Route path="/broadcast/radar/:broadcastId" element={<BroadcastRadar />} />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Premium Onboarding Routes */}
              <Route path="/onboarding" element={<UserOnboarding />} />

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />}
              />
            </Routes>
          </Suspense>
        </NavigationShell>
      </div>
    </BrowserRouter>
  )
}

export default App

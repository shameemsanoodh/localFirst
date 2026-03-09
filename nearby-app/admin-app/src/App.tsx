import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LocationAnalytics from './pages/LocationAnalytics'
import SearchAnalytics from './pages/SearchAnalytics'
import Merchants from './pages/Merchants'
import Users from './pages/Users'
import Broadcasts from './pages/Broadcasts'
import Queries from './pages/Queries'
import Locations from './pages/Locations'
import Offers from './pages/Offers'
import Notifications from './pages/Notifications'
import { useAuthStore } from './store/authStore'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchants"
          element={
            <ProtectedRoute>
              <Merchants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queries"
          element={
            <ProtectedRoute>
              <Queries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <ProtectedRoute>
              <Locations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offers"
          element={
            <ProtectedRoute>
              <Offers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/broadcasts"
          element={
            <ProtectedRoute>
              <Broadcasts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/location"
          element={
            <ProtectedRoute>
              <LocationAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/search"
          element={
            <ProtectedRoute>
              <SearchAnalytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

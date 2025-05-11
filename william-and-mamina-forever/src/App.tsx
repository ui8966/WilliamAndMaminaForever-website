// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'      // ← NEW
import Layout       from './layout/Layout'
import HomePage     from './pages/HomePage'
import NotesPage    from './pages/NotesPage'
import GalleryPage  from './pages/GalleryPage'
import MapPage      from './pages/MapPage'
import CalendarPage from './pages/CalendarPage'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <Router>
      <Routes>
        {/* public auth routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* all the rest are protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index       element={<HomePage />} />
          <Route path="notes"    element={<NotesPage />} />
          <Route path="gallery"  element={<GalleryPage />} />
          <Route path="map"      element={<MapPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  )
}

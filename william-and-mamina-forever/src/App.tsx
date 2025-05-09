// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './layout/Layout'
import HomePage from './pages/HomePage'
import MessagesPage from './pages/MessagesPage'
import GalleryPage from './pages/GalleryPage'
import MapPage from './pages/MapPage'
import SettingsPage from './pages/SettingsPage'


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="notes" element={<MessagesPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

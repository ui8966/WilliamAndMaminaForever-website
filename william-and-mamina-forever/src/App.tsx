// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './layout/Layout'
import HomePage from './pages/HomePage'
import MessagesPage from './pages/MessagesPage'


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="messages" element={<MessagesPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

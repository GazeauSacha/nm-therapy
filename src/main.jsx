import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import Home from './pages/Home'
import Login from './pages/Login'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Appointments from './pages/admin/Appointments'
import Clients from './pages/admin/Clients'
import Messages from './pages/admin/Messages'
import Finances from './pages/admin/Finances'
import SiteContent from './pages/admin/SiteContent'
import Settings from './pages/admin/Settings'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Site public */}
          <Route path="/" element={<Home />} />

          {/* Auth */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin (protégé) */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="clients" element={<Clients />} />
            <Route path="messages" element={<Messages />} />
            <Route path="finances" element={<Finances />} />
            <Route path="site" element={<SiteContent />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)

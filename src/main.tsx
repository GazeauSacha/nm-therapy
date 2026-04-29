import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './i18n'
import './index.css'

import Home from './pages/Home'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const AdminLayout = lazy(() => import('./components/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Appointments = lazy(() => import('./pages/admin/Appointments'))
const Clients = lazy(() => import('./pages/admin/Clients'))
const Contacts = lazy(() => import('./pages/admin/Contacts'))
const ContactDetail = lazy(() => import('./pages/admin/ContactDetail'))
const ClientDetail = lazy(() => import('./pages/admin/ClientDetail'))
const Finances = lazy(() => import('./pages/admin/Finances'))
const SiteContent = lazy(() => import('./pages/admin/SiteContent'))
const Formations = lazy(() => import('./pages/admin/Formations'))
const Activities = lazy(() => import('./pages/admin/Activities'))
const Offers = lazy(() => import('./pages/admin/Offers'))
const Settings = lazy(() => import('./pages/admin/Settings'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
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
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="contacts/:id" element={<ContactDetail />} />
              <Route path="finances" element={<Finances />} />
              <Route path="site" element={<SiteContent />} />
              <Route path="formations" element={<Formations />} />
              <Route path="activities" element={<Activities />} />
              <Route path="offers" element={<Offers />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)

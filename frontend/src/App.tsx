import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/public/Landing'
import ComponentTest from './pages/public/ComponentTest'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Header from './components/layout/Header'
import Dashboard from './pages/public/Dashboard'
import ProtectedRoute from './pages/auth/ProtectedRoute'
import InstitutionDashboard from './pages/Institution/InstitutionDashboard'
import Verify from './pages/public/Verify'
import History from './pages/public/History'
import Settings from './pages/public/Settings'
import GenerateBill from './pages/Institution/GenerateBill'
import BillList from './pages/Institution/BillList'
import BillDetails from './pages/Institution/BillDetails'
import Credits from './pages/public/Credits'
import Privacy from './pages/public/Privacy'
import Terms from './pages/public/Terms'
import ForgotPassword from './pages/auth/ForgotPassword'
import NotFound from './pages/NotFound'

function App() {
  return (
    <BrowserRouter>
    <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/test" element={<ComponentTest />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['public']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/verify" 
          element={
            <ProtectedRoute allowedRoles={['public']}>
              <Verify />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/credits" 
          element={
            <ProtectedRoute allowedRoles={['public']}>
              <Credits />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute allowedRoles={['public']}>
              <History />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['public']}>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/institution/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['institution_user', 'institution_admin']}>
              <InstitutionDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/institution/generate" 
          element={
            <ProtectedRoute allowedRoles={['institution_user', 'institution_admin']}>
              <GenerateBill />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/institution/bills" 
          element={
            <ProtectedRoute allowedRoles={['institution_user', 'institution_admin']}>
              <BillList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/institution/bills/:billNumber" 
          element={
            <ProtectedRoute allowedRoles={['institution_user', 'institution_admin']}>
              <BillDetails />
            </ProtectedRoute>
          } 
        />
        <Route path="/privacy" element={<Privacy />}/>
        <Route path="/terms" element={<Terms />}/>
        <Route path="*" element={<NotFound />} />

        {/* <Route path="*" element={<Landing />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
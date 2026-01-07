"use client"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import ErrorBoundary from "./ErrorBoundary"
import ClientOnly from "./ClientOnly"
import Sidebar from "./Sidebar"
import POSPage from "./pos/POSPage"
import RackAllocationPage from "./inventory/RackAllocationPage"
import ReturnReplacePage from "./pos/ReturnReplacePage"
import StockTransfer from "./pos/StockTransfer"

// Component to handle POS redirects
const POSRedirectHandler = ({ user }) => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const page = urlParams.get('page')
    
    if (page) {
      // Route mapping for backward compatibility
      const routeMap = {
        'pos': '/pos',
        'racks': '/inventory/racks',
        'return-replace': '/pos/return-replace',
        'stock-transfer': '/pos/stock-transfer'
      }

      const newRoute = routeMap[page]
      if (newRoute) {
        navigate(newRoute, { replace: true })
        return
      }
    }
    
    // Only redirect if we're exactly on the root path
    if (location.pathname === '/') {
      console.log('Redirecting POS user to POS')
      navigate('/pos', { replace: true })
    }
  }, [location.search, location.pathname, navigate, user])

  return null
}

// Main layout wrapper for POS
const POSLayoutWrapper = ({ children, user, onLogout }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-auto touch-pan-y">{children}</main>
    </div>
  )
}

const POSRouter = ({ user, onLogout }) => {
  return (
    <ErrorBoundary>
      <ClientOnly>
        <Router>
          <Routes>
            {/* POS redirect route */}
            <Route path="/" element={<POSRedirectHandler user={user} />} />
        
            {/* POS routes - Only for POS users */}
            <Route path="/pos" element={
              <POSLayoutWrapper user={user} onLogout={onLogout}>
                <POSPage />
              </POSLayoutWrapper>
            } />
            <Route path="/pos/return-replace" element={
              <POSLayoutWrapper user={user} onLogout={onLogout}>
                <ReturnReplacePage />
              </POSLayoutWrapper>
            } />
            <Route path="/pos/stock-transfer" element={
              <POSLayoutWrapper user={user} onLogout={onLogout}>
                <StockTransfer />
              </POSLayoutWrapper>
            } />
            
            {/* Inventory routes - For POS users */}
            <Route path="/inventory/racks" element={
              <POSLayoutWrapper user={user} onLogout={onLogout}>
                <RackAllocationPage />
              </POSLayoutWrapper>
            } />
            
            {/* Default fallback - redirect to POS */}
            <Route path="*" element={
              <Navigate to="/pos" replace />
            } />
          </Routes>
        </Router>
      </ClientOnly>
    </ErrorBoundary>
  )
}

export default POSRouter
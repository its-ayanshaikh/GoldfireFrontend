"use client"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import ErrorBoundary from "../ErrorBoundary"
import ClientOnly from "../ClientOnly"
import Sidebar from "../Sidebar"
import AttendancePage from "./AttendancePage"
import TasksPage from "./TasksPage"
import LeavesPage from "./LeavesPage"

// Component to handle employee redirects
const EmployeeRedirectHandler = ({ user }) => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const page = urlParams.get('page')
    
    if (page) {
      // Route mapping for backward compatibility
      const routeMap = {
        'attendance': '/employee/attendance',
        'tasks': '/employee/tasks',
        'leaves': '/employee/leaves'
      }

      const newRoute = routeMap[page]
      if (newRoute) {
        navigate(newRoute, { replace: true })
        return
      }
    }
    
    // Only redirect if we're exactly on the root path
    if (location.pathname === '/') {
      console.log('Redirecting employee to attendance')
      navigate('/employee/attendance', { replace: true })
    }
  }, [location.search, location.pathname, navigate, user])

  return null
}

// Main layout wrapper for employee
const EmployeeLayoutWrapper = ({ children, user, onLogout }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-auto touch-pan-y">{children}</main>
    </div>
  )
}

const EmployeeRouter = ({ user, onLogout }) => {
  return (
    <ErrorBoundary>
      <ClientOnly>
        <Router>
          <Routes>
            {/* Employee redirect route */}
            <Route path="/" element={<EmployeeRedirectHandler user={user} />} />
        
            {/* Employee routes - Only for Employee users */}
            <Route path="/employee/attendance" element={
              <EmployeeLayoutWrapper user={user} onLogout={onLogout}>
                <AttendancePage user={user} />
              </EmployeeLayoutWrapper>
            } />
            <Route path="/employee/tasks" element={
              <EmployeeLayoutWrapper user={user} onLogout={onLogout}>
                <TasksPage user={user} />
              </EmployeeLayoutWrapper>
            } />
            <Route path="/employee/leaves" element={
              <EmployeeLayoutWrapper user={user} onLogout={onLogout}>
                <LeavesPage user={user} />
              </EmployeeLayoutWrapper>
            } />
            
            {/* Default fallback - redirect to attendance */}
            <Route path="*" element={
              <Navigate to="/employee/attendance" replace />
            } />
          </Routes>
        </Router>
      </ClientOnly>
    </ErrorBoundary>
  )
}

export default EmployeeRouter
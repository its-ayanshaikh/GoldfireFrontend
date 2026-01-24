"use client"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import ErrorBoundary from "../ErrorBoundary"
import ClientOnly from "../ClientOnly"
import AdminDashboard from "./AdminDashboard"

// Component to handle backward compatibility redirects
const LegacyRedirectHandler = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const view = urlParams.get('view')
    const id = urlParams.get('id')

    if (view) {
      // Route mapping for backward compatibility
      const routeMap = {
        'dashboard': '/admin/dashboard',
        'product-list': '/admin/product',
        'product-add': '/admin/product/add',
        'product-edit': id ? `/admin/product/edit/${id}` : '/admin/product',
        'product-view': id ? `/admin/product/${id}` : '/admin/product',
        'purchase-list': '/admin/purchase',
        'purchase': '/admin/purchase',
        'purchase-add': '/admin/purchase/add',
        'purchase-edit': id ? `/admin/purchase/edit/${id}` : '/admin/purchase',
        'purchase-return': '/admin/purchase/return',
        'employee-list': '/admin/employee',
        'attendance-system': '/admin/attendance',
        'salary-management': '/admin/salary',
        'leave-management': '/admin/leave',
        'leave-requests': '/admin/leave-requests',
        'task-management': '/admin/task',
        'task-list': '/admin/task',
        'task-view': id ? `/admin/task/${id}` : '/admin/task',
        'customer-management': '/admin/customer',
        'bills-management': '/admin/bill',
        'vendor-management': '/admin/vendor',
        'branch-management': '/admin/branch',
        'settings': '/admin/settings'
      }

      const newRoute = routeMap[view]
      if (newRoute) {
        navigate(newRoute, { replace: true })
        return
      }
    } else {
      // If no view parameter, redirect to dashboard
      navigate('/admin/dashboard', { replace: true })
    }
  }, [location.search, navigate])

  return null
}

// Wrapper component that passes user and onLogout to AdminDashboard
const AdminDashboardWrapper = ({ view, id, user, onLogout }) => {
  return <AdminDashboard view={view} id={id} user={user} onLogout={onLogout} />
}

const AdminRouter = ({ user, onLogout }) => {
  return (
    <ErrorBoundary>
      <ClientOnly>
        <Router>
          <Routes>
            {/* Legacy redirect route */}
            <Route path="/" element={<LegacyRedirectHandler />} />

            {/* Clean path routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardWrapper view="dashboard" user={user} onLogout={onLogout} />} />

            {/* Product routes */}
            <Route path="/admin/product" element={<AdminDashboardWrapper view="product" user={user} onLogout={onLogout} />} />
            <Route path="/admin/product/add" element={<AdminDashboardWrapper view="product-add" user={user} onLogout={onLogout} />} />
            <Route path="/admin/product/edit/:id" element={<AdminDashboardWrapper view="product-edit" user={user} onLogout={onLogout} />} />
            <Route path="/admin/product/:id" element={<AdminDashboardWrapper view="product-view" user={user} onLogout={onLogout} />} />

            {/* Purchase routes */}
            <Route path="/admin/purchase" element={<AdminDashboardWrapper view="purchase" user={user} onLogout={onLogout} />} />
            <Route path="/admin/purchase/add" element={<AdminDashboardWrapper view="purchase-add" user={user} onLogout={onLogout} />} />
            <Route path="/admin/purchase/edit/:id" element={<AdminDashboardWrapper view="purchase-add" user={user} onLogout={onLogout} />} />
            <Route path="/admin/purchase/return" element={<AdminDashboardWrapper view="purchase-return" user={user} onLogout={onLogout} />} />

            {/* Employee routes */}
            <Route path="/admin/employee" element={<AdminDashboardWrapper view="employee" user={user} onLogout={onLogout} />} />
            <Route path="/admin/attendance" element={<AdminDashboardWrapper view="attendance" user={user} onLogout={onLogout} />} />
            <Route path="/admin/salary" element={<AdminDashboardWrapper view="salary" user={user} onLogout={onLogout} />} />
            <Route path="/admin/leave-requests" element={<AdminDashboardWrapper view="leave-requests" user={user} onLogout={onLogout} />} />
            <Route path="/admin/leave" element={<AdminDashboardWrapper view="leave" user={user} onLogout={onLogout} />} />

            {/* Task routes */}
            <Route path="/admin/task" element={<AdminDashboardWrapper view="task" user={user} onLogout={onLogout} />} />
            <Route path="/admin/task/:id" element={<AdminDashboardWrapper view="task-view" user={user} onLogout={onLogout} />} />

            {/* Other routes */}
            <Route path="/admin/customer" element={<AdminDashboardWrapper view="customer" user={user} onLogout={onLogout} />} />
            <Route path="/admin/bill" element={<AdminDashboardWrapper view="bill" user={user} onLogout={onLogout} />} />
            <Route path="/admin/vendor" element={<AdminDashboardWrapper view="vendor" user={user} onLogout={onLogout} />} />
            <Route path="/admin/branch" element={<AdminDashboardWrapper view="branch" user={user} onLogout={onLogout} />} />
            <Route path="/admin/settings" element={<AdminDashboardWrapper view="settings" user={user} onLogout={onLogout} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Router>
      </ClientOnly>
    </ErrorBoundary>
  )
}

export default AdminRouter
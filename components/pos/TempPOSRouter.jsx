"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import ErrorBoundary from "../ErrorBoundary"
import ClientOnly from "../ClientOnly"
import TemporaryPOSPage from "./TemporaryPOSPage"
import TempPOSTestPage from "./TempPOSTestPage"
import { Button } from "../ui/button"
import { LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { LogoutConfirmationDialog } from "../ui/logout-confirmation-dialog"

const TempPOSRouter = ({ user, onLogout }) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    console.log('TempPOSRouter mounted with user:', user)
    console.log('User type in TempPOSRouter:', user?.user_type)
  }, [user])

  return (
    <ErrorBoundary>
      <ClientOnly>
        <Router>
          <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header with Logout */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm flex-shrink-0">
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  GOLDFIRE<sup className="text-xs">®</sup> - Temporary POS
                </h1>
                <p className="text-xs text-gray-600">Welcome, {user?.name || user?.username}</p>
              </div>
              <Button
                onClick={() => setShowLogoutDialog(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              >
                <LogOut size={14} />
                Logout
              </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<TemporaryPOSPage />} />
                <Route path="/temp-pos" element={<TemporaryPOSPage />} />
                <Route path="/test" element={<TempPOSTestPage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            {/* Logout Confirmation Dialog */}
            <LogoutConfirmationDialog
              open={showLogoutDialog}
              onOpenChange={setShowLogoutDialog}
              onConfirm={onLogout}
              userName={user?.name || user?.username}
            />
          </div>
        </Router>
      </ClientOnly>
    </ErrorBoundary>
  )
}

export default TempPOSRouter

"use client"

import {
  ShoppingCart,
  Clock,
  CheckSquare,
  LogOut,
  Calendar,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react"
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { LogoutConfirmationDialog } from "./ui/logout-confirmation-dialog"

const Sidebar = ({ user, onLogout }) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Route mapping for different pages
  const getRouteForPage = (pageId) => {
    const routeMap = {
      'pos': '/pos',
      'attendance': '/employee/attendance',
      'tasks': '/employee/tasks',
      'leaves': '/employee/leaves',
      'return-replace': '/pos/return-replace',
      'stock-transfer': '/pos/stock-transfer'
    }
    return routeMap[pageId] || `/${pageId}`
  }

  // Check if current route matches the page
  const isPageActive = (pageId) => {
    const route = getRouteForPage(pageId)
    return location.pathname === route
  }

  const getAllMenuItems = () => [
    { id: "pos", icon: ShoppingCart, label: "POS", route: "/pos" },
    { id: "attendance", icon: Clock, label: "Attendance", route: "/employee/attendance" },
    { id: "tasks", icon: CheckSquare, label: "Tasks", route: "/employee/tasks" },
    { id: "leaves", icon: Calendar, label: "Leaves", route: "/employee/leaves" },
    { id: "return-replace", icon: RefreshCw, label: "Return", route: "/pos/return-replace" },
    { id: "stock-transfer", icon: ArrowLeftRight, label: "Transfer", route: "/pos/stock-transfer" },
  ]

  const getFilteredMenuItems = () => {
    const allItems = getAllMenuItems()

    console.log('Sidebar user:', user)
    console.log('User type:', user?.user_type)

    const userType = user?.user_type?.toLowerCase()

    if (userType === "employee") {
      // Employee users: Only show attendance, tasks, and leaves
      console.log('Filtering for employee user')
      return allItems.filter((item) => item.id === "attendance" || item.id === "tasks" || item.id === "leaves")
    } else if (userType === "cashier") {
      // POS users: Only show POS-related items, NO attendance/tasks/leaves
      console.log('Filtering for POS user')
      return allItems.filter(
        (item) =>
          item.id === "pos" ||
          item.id === "return-replace" ||
          item.id === "stock-transfer"
      )
    }

    // Default: show all items (for admin/other users)
    console.log('Using default menu items for user type:', user?.user_type)
    return allItems
  }

  const menuItems = getFilteredMenuItems()
  console.log('Final menu items:', menuItems)

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false)
    onLogout()
  }

  return (
    <>
      <div className="bg-white border-r-2 border-gray-200 shadow-sm flex-shrink-0">
        {/* Mobile horizontal layout */}
        <div className="md:hidden flex justify-between items-center py-2 px-2 border-b border-gray-200">
          <div className="flex justify-around items-center flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = isPageActive(item.id)

              return (
                <Link
                  key={item.id}
                  to={item.route}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0 min-h-[60px] touch-manipulation
                    ${isActive ? "bg-black text-white shadow-lg scale-105" : "text-gray-600 hover:bg-gray-100 hover:text-black active:bg-gray-200"}
                  `}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="text-xs mt-1 font-medium truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
          <button
            onClick={handleLogoutClick}
            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0 min-h-[60px] touch-manipulation text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 ml-2"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="text-xs mt-1 font-medium truncate">Logout</span>
          </button>
        </div>

        {/* Desktop vertical layout */}
        <div className="hidden md:flex flex-col w-20 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = isPageActive(item.id)

            return (
              <Link
                key={item.id}
                to={item.route}
                className={`
                  w-16 h-16 rounded-xl flex flex-col items-center justify-center mb-4 mx-auto transition-all duration-200
                  ${isActive
                    ? "bg-black text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black hover:shadow-md hover:scale-102"
                  }
                `}
                title={item.label}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="text-xs mt-1 font-medium truncate px-1">{item.label}</span>
              </Link>
            )
          })}

          <button
            onClick={handleLogoutClick}
            className="w-16 h-16 rounded-xl flex flex-col items-center justify-center mx-auto transition-all duration-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-md hover:scale-102 mt-auto"
            title="Logout"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="text-xs mt-1 font-medium truncate px-1">Logout</span>
          </button>
        </div>
      </div>

      <LogoutConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogoutConfirm}
        userName={user?.name || user?.username}
      />
    </>
  )
}

export default Sidebar

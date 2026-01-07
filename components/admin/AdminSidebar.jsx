"use client"

import {
  LogOut,
  Menu,
  X,
  Users,
  UserCheck,
  BarChart3,
  Home,
  ChevronDown,
  ChevronRight,
  Clock,
  CalendarDays,
  CheckSquare,
  List,
  User,
  Receipt,
  Truck,
  Building2,
  Package,
  PackagePlus,
  ShoppingCart,
  Plus,
  Settings,
} from "lucide-react"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { LogoutConfirmationDialog } from "../ui/logout-confirmation-dialog"

const AdminSidebar = ({ user, onLogout, currentView, onViewChange }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isEmployeeMenuOpen, setIsEmployeeMenuOpen] = useState(false)
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false)
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false)
  const [isPurchaseMenuOpen, setIsPurchaseMenuOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Route mapping for clean URLs
  const getCleanRoute = (view) => {
    const routeMap = {
      'dashboard': '/admin/dashboard',
      'product-list': '/admin/product',
      'product-add': '/admin/product/add',
      'purchase-list': '/admin/purchase',
      'purchase-add': '/admin/purchase/add',
      'purchase-return': '/admin/purchase/return',
      'employee-list': '/admin/employee',
      'attendance-system': '/admin/attendance',
      'salary-management': '/admin/salary',
      'leave-management': '/admin/leave',
      'leave-requests': '/admin/leave-requests',
      'task-management': '/admin/task',
      'customer-management': '/admin/customer',
      'bills-management': '/admin/bill',
      'vendor-management': '/admin/vendor',
      'branch-management': '/admin/branch',
      'settings': '/admin/settings'
    }
    return routeMap[view] || '/admin/dashboard'
  }

  const handleViewChange = (view) => {
    const cleanRoute = getCleanRoute(view)
    navigate(cleanRoute)
    setIsMobileMenuOpen(false)
    // Still call onViewChange for backward compatibility
    if (onViewChange) {
      onViewChange(view)
    }
  }

  const menuItems = [
    // 1. Dashboard - Always first for overview
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      onClick: () => handleViewChange("dashboard"),
    },

    // 2. Core Business Operations (Most Used Daily)
    {
      id: "products",
      label: "Products",
      icon: Package,
      hasSubmenu: true,
      submenu: [
        {
          id: "product-list",
          label: "Product List",
          icon: List,
          onClick: () => {
            handleViewChange("product-list")
          },
        },
        {
          id: "product-add",
          label: "Add Product",
          icon: PackagePlus,
          onClick: () => {
            handleViewChange("product-add")
          },
        },
      ],
    },
    {
      id: "purchases",
      label: "Purchase Management",
      icon: ShoppingCart,
      hasSubmenu: true,
      submenu: [
        {
          id: "purchase-list",
          label: "Purchase List",
          icon: List,
          onClick: () => {
            handleViewChange("purchase-list")
          },
        },
        {
          id: "purchase-add",
          label: "Add Purchase",
          icon: Plus,
          onClick: () => {
            handleViewChange("purchase-add")
          },
        },
        {
          id: "purchase-return",
          label: "Return to Vendor",
          icon: ShoppingCart,
          onClick: () => {
            handleViewChange("purchase-return")
          },
        },
      ],
    },
    {
      id: "bills",
      label: "Bills Management",
      icon: Receipt,
      onClick: () => {
        handleViewChange("bills-management")
      },
    },

    // 3. Customer Relations (High Priority)
    {
      id: "customers",
      label: "Customer Management",
      icon: User,
      onClick: () => {
        handleViewChange("customer-management")
      },
    },

    // 4. Employee Management (HR Operations)
    {
      id: "employees",
      label: "Employee Management",
      icon: Users,
      hasSubmenu: true,
      submenu: [
        {
          id: "employee-list",
          label: "Employee List",
          icon: UserCheck,
          onClick: () => handleViewChange("employee-list"),
        },
        {
          id: "attendance-system",
          label: "Attendance System",
          icon: Clock,
          onClick: () => handleViewChange("attendance-system"),
        },
        {
          id: "salary-management",
          label: "Salary Management",
          icon: BarChart3,
          onClick: () => handleViewChange("salary-management"),
        },
        {
          id: "leave-management",
          label: "Leave Management",
          icon: CalendarDays,
          onClick: () => {
            handleViewChange("leave-management")
          },
        },
        {
          id: "leave-requests",
          label: "Leave Requests",
          icon: List,
          onClick: () => {
            handleViewChange("leave-requests")
          },
        },
      ],
    },

    // 5. Task & Project Management
    {
      id: "tasks",
      label: "Task Management",
      icon: CheckSquare,
      hasSubmenu: true,
      submenu: [
        {
          id: "task-list",
          label: "Task List",
          icon: List,
          onClick: () => {
            handleViewChange("task-management")
          },
        },
      ],
    },

    // 6. Business Partners & Infrastructure (Less frequent)
    {
      id: "vendors",
      label: "Vendor Management",
      icon: Truck,
      onClick: () => {
        handleViewChange("vendor-management")
      },
    },
    {
      id: "branches",
      label: "Branch Management",
      icon: Building2,
      onClick: () => {
        handleViewChange("branch-management")
      },
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      onClick: () => {
        handleViewChange("settings")
      },
    },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          GOLDFIRE<sup className="text-xs">®</sup>
        </h2>
        <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.hasSubmenu ? (
                <>
                  <Button
                    variant={
                      (item.id === "employees" &&
                        (currentView?.startsWith("employee") ||
                          currentView?.includes("employee") ||
                          currentView === "attendance-system" ||
                          currentView === "leave-management" ||
                          currentView === "leave-requests" ||
                          currentView === "salary-management")) ||
                        (item.id === "tasks" && currentView === "task-management") ||
                        (item.id === "products" && (currentView === "product-add" || currentView === "product-list")) ||
                        (item.id === "purchases" && (currentView === "purchase-add" || currentView === "purchase-list"))
                        ? "secondary"
                        : "ghost"
                    }
                    className="w-full justify-start gap-2 h-9 text-sm"
                    onClick={() => {
                      if (item.id === "employees") {
                        setIsEmployeeMenuOpen(!isEmployeeMenuOpen)
                      } else if (item.id === "tasks") {
                        setIsTaskMenuOpen(!isTaskMenuOpen)
                      } else if (item.id === "products") {
                        setIsProductMenuOpen(!isProductMenuOpen)
                      } else if (item.id === "purchases") {
                        setIsPurchaseMenuOpen(!isPurchaseMenuOpen)
                      }
                    }}
                  >
                    <item.icon size={14} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {(item.id === "employees" && isEmployeeMenuOpen) ||
                      (item.id === "tasks" && isTaskMenuOpen) ||
                      (item.id === "products" && isProductMenuOpen) ||
                      (item.id === "purchases" && isPurchaseMenuOpen) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </Button>
                  {((item.id === "employees" && isEmployeeMenuOpen) ||
                    (item.id === "tasks" && isTaskMenuOpen) ||
                    (item.id === "products" && isProductMenuOpen) ||
                    (item.id === "purchases" && isPurchaseMenuOpen)) && (
                      <div className="ml-3 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Button
                            key={subItem.id}
                            variant={
                              (subItem.id === "employee-list" && currentView === "employee-list") ||
                                (subItem.id === "attendance-system" && currentView === "attendance-system") ||
                                (subItem.id === "salary-management" && currentView === "salary-management") ||
                                (subItem.id === "leave-management" && currentView === "leave-management") ||
                                (subItem.id === "leave-requests" && currentView === "leave-requests") ||
                                (subItem.id === "task-list" && currentView === "task-management") ||
                                (subItem.id === "product-list" && currentView === "product-list") ||
                                (subItem.id === "product-add" && currentView === "product-add") ||
                                (subItem.id === "purchase-list" && currentView === "purchase-list") ||
                                (subItem.id === "purchase-add" && currentView === "purchase-add")
                                ? "secondary"
                                : "ghost"
                            }
                            className="w-full justify-start gap-2 h-8 text-xs"
                            onClick={subItem.onClick}
                          >
                            <subItem.icon size={12} />
                            <span className="truncate">{subItem.label}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                </>
              ) : (
                <Button
                  variant={
                    currentView === item.id ||
                      (item.id === "customers" && currentView === "customer-management") ||
                      (item.id === "bills" && currentView === "bills-management") ||
                      (item.id === "vendors" && currentView === "vendor-management") ||
                      (item.id === "branches" && currentView === "branch-management")
                      ? "secondary"
                      : "ghost"
                  }
                  className="w-full justify-start gap-2 h-9 text-sm"
                  onClick={item.onClick}
                >
                  <item.icon size={14} />
                  <span className="truncate">{item.label}</span>
                </Button>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t border-border">
        <Button
          onClick={() => setShowLogoutDialog(true)}
          variant="outline"
          className="w-full flex items-center gap-2 text-destructive hover:bg-destructive hover:text-white bg-transparent h-8 text-xs"
        >
          <LogOut size={12} />
          Logout
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          variant="outline"
          size="icon"
          className="bg-background shadow-md h-8 w-8"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`
        lg:hidden fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40 transform transition-transform duration-300
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </div>

      <div className="hidden lg:flex flex-col w-64 bg-card border-r border-border">
        <SidebarContent />
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={onLogout}
        userName={user?.name || user?.username}
      />
    </>
  )
}

export default AdminSidebar

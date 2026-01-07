"use client"

import { LogOut, Menu, X, Home, ChevronDown, ChevronRight, CheckSquare, List, Package, PackagePlus } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"
import { LogoutConfirmationDialog } from "../ui/logout-confirmation-dialog"

const SubadminSidebar = ({ user, onLogout, currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false)
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      onClick: () => {
        onViewChange("dashboard")
        setIsMobileMenuOpen(false)
      },
    },
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
            onViewChange("task-management")
            setIsMobileMenuOpen(false)
          },
        },
      ],
    },
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
            onViewChange("product-list")
            setIsMobileMenuOpen(false)
          },
        },
        {
          id: "product-add",
          label: "Add Product",
          icon: PackagePlus,
          onClick: () => {
            onViewChange("product-add")
            setIsMobileMenuOpen(false)
          },
        },
      ],
    },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Subadmin Panel</h2>
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
                      (item.id === "tasks" && currentView === "task-management") ||
                      (item.id === "products" && (currentView === "product-add" || currentView === "product-list"))
                        ? "secondary"
                        : "ghost"
                    }
                    className="w-full justify-start gap-2 h-9 text-sm"
                    onClick={() => {
                      if (item.id === "tasks") {
                        setIsTaskMenuOpen(!isTaskMenuOpen)
                      } else if (item.id === "products") {
                        setIsProductMenuOpen(!isProductMenuOpen)
                      }
                    }}
                  >
                    <item.icon size={14} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {(item.id === "tasks" && isTaskMenuOpen) || (item.id === "products" && isProductMenuOpen) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </Button>
                  {((item.id === "tasks" && isTaskMenuOpen) || (item.id === "products" && isProductMenuOpen)) && (
                    <div className="ml-3 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Button
                          key={subItem.id}
                          variant={
                            (subItem.id === "task-list" && currentView === "task-management") ||
                            (subItem.id === "product-list" && currentView === "product-list") ||
                            (subItem.id === "product-add" && currentView === "product-add")
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
                  variant={currentView === item.id ? "secondary" : "ghost"}
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

export default SubadminSidebar

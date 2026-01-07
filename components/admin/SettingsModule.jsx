"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Settings, Hash, Shield, ArrowLeft, Percent, Printer } from "lucide-react"
import HSNManagement from "./HSNManagement"
import RoleManagement from "./RoleManagement"
import CommissionManagement from "./CommissionManagement"
import BarcodePrinting from "./BarcodePrinting"

const SettingsModule = () => {
  const [currentView, setCurrentView] = useState("main")

  const settingsModules = [
    {
      id: "hsn",
      title: "HSN Management",
      description: "Manage HSN codes with GST rates and categories",
      icon: Hash,
      color: "blue",
      stats: "GST Codes & Categories",
      onClick: () => setCurrentView("hsn")
    },
    {
      id: "roles",
      title: "Role Management",
      description: "Manage user roles and permissions",
      icon: Shield,
      color: "green",
      stats: "User Roles & Access",
      onClick: () => setCurrentView("roles")
    },
    {
      id: "commission",
      title: "Commission Management",
      description: "Manage commission rules for product categories",
      icon: Percent,
      color: "purple",
      stats: "Commission Rules",
      onClick: () => setCurrentView("commission")
    },
    {
      id: "barcode",
      title: "Barcode Printing",
      description: "Generate and print product barcodes for thermal printers",
      icon: Printer,
      color: "orange",
      stats: "38mm x 38mm Labels",
      onClick: () => setCurrentView("barcode")
    }
  ]

  if (currentView === "hsn") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 pb-0">
          <Button
            variant="ghost"
            onClick={() => setCurrentView("main")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">HSN Management</h1>
            <p className="text-muted-foreground">Manage HSN codes with GST rates and categories</p>
          </div>
        </div>
        <HSNManagement />
      </div>
    )
  }

  if (currentView === "roles") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 pb-0">
          <Button
            variant="ghost"
            onClick={() => setCurrentView("main")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Role Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>
        <RoleManagement />
      </div>
    )
  }

  if (currentView === "commission") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 pb-0">
          <Button
            variant="ghost"
            onClick={() => setCurrentView("main")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Commission Management</h1>
            <p className="text-muted-foreground">Manage commission rules for product categories</p>
          </div>
        </div>
        <CommissionManagement />
      </div>
    )
  }

  if (currentView === "barcode") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 pb-0">
          <Button
            variant="ghost"
            onClick={() => setCurrentView("main")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Barcode Printing</h1>
            <p className="text-muted-foreground">Generate and print product barcodes for thermal printers</p>
          </div>
        </div>
        <BarcodePrinting />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-7 w-7" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure system settings and manage core data
          </p>
        </div>
      </div>

      {/* Settings Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Overview</CardTitle>
          <CardDescription>
            Access and manage various system configuration modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsModules.map((module) => {
              const IconComponent = module.icon
              return (
                <Card
                  key={module.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/20"
                  onClick={module.onClick}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${module.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                            module.color === 'green' ? 'bg-green-100 text-green-600' :
                              module.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                module.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                  'bg-gray-100 text-gray-600'
                          }`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {module.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.description}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {module.stats}
                          </Badge>
                        </div>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system configuration and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-foreground">Version</h4>
              <p className="text-sm text-muted-foreground mt-1">v1.0.0</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-foreground">Last Updated</h4>
              <p className="text-sm text-muted-foreground mt-1">Oct 7, 2025</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-foreground">Status</h4>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mt-1">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsModule

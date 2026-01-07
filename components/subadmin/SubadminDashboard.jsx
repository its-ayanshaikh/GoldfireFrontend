"use client"

import SubadminSidebar from "./SubadminSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Package, CheckSquare } from "lucide-react"
import { useState } from "react"
import TaskManagement from "../admin/TaskManagement"
import ProductAdd from "../admin/ProductAdd"
import ProductList from "../admin/ProductList"

const SubadminDashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState("dashboard")

  const stats = [
    { title: "Total Products", value: "150", change: "+5%", changeType: "positive", icon: Package },
    { title: "Active Tasks", value: "12", change: "+2", changeType: "positive", icon: CheckSquare },
    { title: "Low Stock Items", value: "8", change: "-3", changeType: "positive", icon: Package },
    { title: "Pending Tasks", value: "5", change: "-1", changeType: "positive", icon: CheckSquare },
  ]

  const recentProducts = [
    { id: 1, name: "iPhone 15 Pro Cover", stock: 22, status: "In Stock" },
    { id: 2, name: "Samsung Galaxy Case", stock: 16, status: "In Stock" },
    { id: 3, name: "Wireless Charger", stock: 5, status: "Low Stock" },
    { id: 4, name: "Phone Stand", stock: 2, status: "Low Stock" },
  ]

  const recentTasks = [
    { id: 1, title: "Update inventory count", assignee: "John Doe", status: "In Progress", dueDate: "Today" },
    { id: 2, title: "Check product quality", assignee: "Jane Smith", status: "Pending", dueDate: "Tomorrow" },
    { id: 3, title: "Organize storage", assignee: "Mike Johnson", status: "Completed", dueDate: "Yesterday" },
    { id: 4, title: "Product photography", assignee: "Sarah Wilson", status: "Pending", dueDate: "2 days" },
  ]

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Stock":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
      case "Low Stock":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Low Stock</Badge>
      case "Out of Stock":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Out of Stock</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTaskStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "In Progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "task-management":
        return <TaskManagement />
      case "product-add":
        return <ProductAdd />
      case "product-list":
        return <ProductList />
      default:
        return (
          <div className="p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Subadmin Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.name}</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                        <p className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                          {stat.change} from last week
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Product and Task Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Products */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Recent Products
                    </CardTitle>
                    <CardDescription>Latest product inventory status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-foreground">{product.name}</div>
                            <div className="text-sm text-muted-foreground">Stock: {product.stock} units</div>
                          </div>
                          {getStatusBadge(product.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      Recent Tasks
                    </CardTitle>
                    <CardDescription>Latest task assignments and progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{task.title}</div>
                            <div className="text-sm text-muted-foreground">
                              Assigned to: {task.assignee} • Due: {task.dueDate}
                            </div>
                          </div>
                          {getTaskStatusBadge(task.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => handleViewChange("product-add")}
                      className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Package className="h-6 w-6 mb-2 text-primary" />
                      <div className="font-medium text-foreground">Add Product</div>
                      <div className="text-sm text-muted-foreground">Add new product to inventory</div>
                    </button>
                    <button
                      onClick={() => handleViewChange("product-list")}
                      className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Package className="h-6 w-6 mb-2 text-primary" />
                      <div className="font-medium text-foreground">View Products</div>
                      <div className="text-sm text-muted-foreground">Manage product inventory</div>
                    </button>
                    <button
                      onClick={() => handleViewChange("task-management")}
                      className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <CheckSquare className="h-6 w-6 mb-2 text-primary" />
                      <div className="font-medium text-foreground">Manage Tasks</div>
                      <div className="text-sm text-muted-foreground">Create and assign tasks</div>
                    </button>
                    <button
                      onClick={() => handleViewChange("task-management")}
                      className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <CheckSquare className="h-6 w-6 mb-2 text-primary" />
                      <div className="font-medium text-foreground">View Tasks</div>
                      <div className="text-sm text-muted-foreground">Track task progress</div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <SubadminSidebar user={user} onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />
      <main className="flex-1 overflow-auto lg:ml-0 ml-0">
        <div className="lg:hidden h-16"></div>
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default SubadminDashboard

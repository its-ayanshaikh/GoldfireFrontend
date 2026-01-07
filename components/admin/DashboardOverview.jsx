"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react"

const DashboardOverview = () => {
  // Mock data - in real app this would come from API
  const stats = [
    {
      title: "Total Revenue",
      value: "₹2,45,000",
      change: "+12.5%",
      changeType: "positive",
      icon: DollarSign,
    },
    {
      title: "Total Sales",
      value: "1,234",
      change: "+8.2%",
      changeType: "positive",
      icon: ShoppingCart,
    },
    {
      title: "Active Customers",
      value: "856",
      change: "+3.1%",
      changeType: "positive",
      icon: Users,
    },
    {
      title: "Growth Rate",
      value: "15.3%",
      change: "+2.4%",
      changeType: "positive",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
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
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <h3 className="font-medium text-foreground">View Reports</h3>
                <p className="text-sm text-muted-foreground">Generate detailed reports</p>
              </div>
              <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <h3 className="font-medium text-foreground">Manage Users</h3>
                <p className="text-sm text-muted-foreground">Add or edit user accounts</p>
              </div>
              <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <h3 className="font-medium text-foreground">Inventory Check</h3>
                <p className="text-sm text-muted-foreground">Monitor stock levels</p>
              </div>
              <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <h3 className="font-medium text-foreground">System Settings</h3>
                <p className="text-sm text-muted-foreground">Configure system preferences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">New sale completed</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Employee checked in</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Low stock alert</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">New customer registered</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardOverview

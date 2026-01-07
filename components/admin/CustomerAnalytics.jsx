"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { Badge } from "../ui/badge"
import { TrendingUp, TrendingDown, Users, UserX, UserCheck } from "lucide-react"
import { useState } from "react"

const CustomerAnalytics = () => {
  // Mock customer data
  const customerTrends = [
    { month: "Jan", new: 45, returning: 120, lost: 15 },
    { month: "Feb", new: 52, returning: 135, lost: 12 },
    { month: "Mar", new: 48, returning: 128, lost: 18 },
    { month: "Apr", new: 61, returning: 155, lost: 10 },
    { month: "May", new: 55, returning: 142, lost: 14 },
    { month: "Jun", new: 67, returning: 168, lost: 8 },
  ]

  const customerSegments = [
    {
      id: 1,
      name: "Rajesh Kumar",
      email: "rajesh@email.com",
      totalPurchases: 25,
      totalSpent: 125000,
      lastPurchase: "2 days ago",
      status: "frequent",
      frequency: "Weekly",
    },
    {
      id: 2,
      name: "Priya Sharma",
      email: "priya@email.com",
      totalPurchases: 18,
      totalSpent: 89000,
      lastPurchase: "1 week ago",
      status: "frequent",
      frequency: "Bi-weekly",
    },
    {
      id: 3,
      name: "Amit Singh",
      email: "amit@email.com",
      totalPurchases: 8,
      totalSpent: 45000,
      lastPurchase: "3 weeks ago",
      status: "regular",
      frequency: "Monthly",
    },
    {
      id: 4,
      name: "Sunita Devi",
      email: "sunita@email.com",
      totalPurchases: 12,
      totalSpent: 67000,
      lastPurchase: "2 months ago",
      status: "regular",
      frequency: "Monthly",
    },
    {
      id: 5,
      name: "Vikram Gupta",
      email: "vikram@email.com",
      totalPurchases: 3,
      totalSpent: 15000,
      lastPurchase: "4 months ago",
      status: "lost",
      frequency: "Rare",
    },
    {
      id: 6,
      name: "Meera Joshi",
      email: "meera@email.com",
      totalPurchases: 2,
      totalSpent: 8000,
      lastPurchase: "6 months ago",
      status: "lost",
      frequency: "Rare",
    },
  ]

  const getStatusBadge = (status) => {
    switch (status) {
      case "frequent":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Frequent</Badge>
      case "regular":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Regular</Badge>
      case "lost":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Lost</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "frequent":
        return <UserCheck className="h-4 w-4 text-green-600" />
      case "regular":
        return <Users className="h-4 w-4 text-yellow-600" />
      case "lost":
        return <UserX className="h-4 w-4 text-red-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const customerStats = {
    frequent: customerSegments.filter((c) => c.status === "frequent").length,
    regular: customerSegments.filter((c) => c.status === "regular").length,
    lost: customerSegments.filter((c) => c.status === "lost").length,
    total: customerSegments.length,
  }

  const retentionData = [
    { period: "Week 1", retention: 95 },
    { period: "Week 2", retention: 87 },
    { period: "Month 1", retention: 78 },
    { period: "Month 2", retention: 65 },
    { period: "Month 3", retention: 52 },
    { period: "Month 6", retention: 38 },
  ]

  const [showCustomerList, setShowCustomerList] = useState(false)
  const [selectedCustomerType, setSelectedCustomerType] = useState(null)

  const handleCustomerCardClick = (customerType) => {
    setSelectedCustomerType(customerType)
    setShowCustomerList(true)
  }

  const getFilteredCustomers = () => {
    if (!selectedCustomerType) return customerSegments
    return customerSegments.filter((customer) => customer.status === selectedCustomerType)
  }

  const getCustomerTypeTitle = () => {
    switch (selectedCustomerType) {
      case "frequent":
        return "Frequent Customers"
      case "regular":
        return "Regular Customers"
      case "lost":
        return "Lost Customers"
      default:
        return "All Customers"
    }
  }

  if (showCustomerList) {
    const filteredCustomers = getFilteredCustomers()

    return (
      <div className="space-y-6">
        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCustomerList(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ← Back to Analytics
          </button>
          <h2 className="text-2xl font-bold text-foreground">{getCustomerTypeTitle()}</h2>
          <Badge variant="secondary">{filteredCustomers.length} customers</Badge>
        </div>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle>{getCustomerTypeTitle()} List</CardTitle>
            <CardDescription>Detailed view of {selectedCustomerType} customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-foreground">Customer</th>
                    <th className="text-center p-4 font-medium text-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-foreground">Purchases</th>
                    <th className="text-right p-4 font-medium text-foreground">Total Spent</th>
                    <th className="text-center p-4 font-medium text-foreground">Frequency</th>
                    <th className="text-center p-4 font-medium text-foreground">Last Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border hover:bg-accent">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {getStatusIcon(customer.status)}
                            {customer.name}
                          </div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </div>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(customer.status)}</td>
                      <td className="p-4 text-right text-foreground">{customer.totalPurchases}</td>
                      <td className="p-4 text-right text-foreground">₹{customer.totalSpent.toLocaleString()}</td>
                      <td className="p-4 text-center text-foreground">{customer.frequency}</td>
                      <td className="p-4 text-center text-muted-foreground">{customer.lastPurchase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Customer Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCustomerCardClick("frequent")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Frequent Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{customerStats.frequent}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((customerStats.frequent / customerStats.total) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCustomerCardClick("regular")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Regular Customers</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{customerStats.regular}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((customerStats.regular / customerStats.total) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCustomerCardClick("lost")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lost Customers</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{customerStats.lost}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((customerStats.lost / customerStats.total) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{customerStats.total}</div>
            <p className="text-xs text-muted-foreground">Active customer base</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Acquisition Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition & Retention</CardTitle>
            <CardDescription>Monthly trends of new, returning, and lost customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                new: {
                  label: "New Customers",
                  color: "hsl(var(--chart-1))",
                },
                returning: {
                  label: "Returning Customers",
                  color: "hsl(var(--chart-2))",
                },
                lost: {
                  label: "Lost Customers",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="new" fill="var(--color-new)" name="New" />
                  <Bar dataKey="returning" fill="var(--color-returning)" name="Returning" />
                  <Bar dataKey="lost" fill="var(--color-lost)" name="Lost" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Customer Retention Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Retention Rate</CardTitle>
            <CardDescription>Percentage of customers retained over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                retention: {
                  label: "Retention Rate (%)",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="retention"
                    stroke="var(--color-retention)"
                    strokeWidth={3}
                    name="Retention Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments Analysis</CardTitle>
          <CardDescription>Detailed breakdown of customer behavior and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-foreground">Customer</th>
                  <th className="text-center p-4 font-medium text-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-foreground">Purchases</th>
                  <th className="text-right p-4 font-medium text-foreground">Total Spent</th>
                  <th className="text-center p-4 font-medium text-foreground">Frequency</th>
                  <th className="text-center p-4 font-medium text-foreground">Last Purchase</th>
                </tr>
              </thead>
              <tbody>
                {customerSegments.map((customer) => (
                  <tr key={customer.id} className="border-b border-border hover:bg-accent">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {getStatusIcon(customer.status)}
                          {customer.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-center">{getStatusBadge(customer.status)}</td>
                    <td className="p-4 text-right text-foreground">{customer.totalPurchases}</td>
                    <td className="p-4 text-right text-foreground">₹{customer.totalSpent.toLocaleString()}</td>
                    <td className="p-4 text-center text-foreground">{customer.frequency}</td>
                    <td className="p-4 text-center text-muted-foreground">{customer.lastPurchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Frequent Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              These customers purchase weekly or bi-weekly. They represent your most loyal customer base and should be
              prioritized for retention programs.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-green-600">
                • Average spend: ₹
                {Math.round(
                  customerSegments.filter((c) => c.status === "frequent").reduce((sum, c) => sum + c.totalSpent, 0) /
                    customerStats.frequent,
                ).toLocaleString()}
              </div>
              <div className="text-xs text-green-600">• Purchase frequency: 1-2 times per week</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Regular Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              Monthly purchasers who show consistent buying patterns. Focus on converting them to frequent customers
              through targeted offers.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-yellow-600">
                • Average spend: ₹
                {Math.round(
                  customerSegments.filter((c) => c.status === "regular").reduce((sum, c) => sum + c.totalSpent, 0) /
                    customerStats.regular,
                ).toLocaleString()}
              </div>
              <div className="text-xs text-yellow-600">• Purchase frequency: 1-2 times per month</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Lost Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              Customers who haven't purchased in 3+ months. Implement win-back campaigns to re-engage this segment.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-red-600">
                • Average spend: ₹
                {Math.round(
                  customerSegments.filter((c) => c.status === "lost").reduce((sum, c) => sum + c.totalSpent, 0) /
                    customerStats.lost,
                ).toLocaleString()}
              </div>
              <div className="text-xs text-red-600">• Last purchase: 3+ months ago</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CustomerAnalytics

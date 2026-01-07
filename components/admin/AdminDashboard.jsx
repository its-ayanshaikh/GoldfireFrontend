"use client"
import AdminSidebar from "./AdminSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { Bar, BarChart, Line, LineChart, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import { Users, UserX, UserCheck, ShoppingCart, DollarSign, Trophy, Star, MapPin, Loader2, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useToast } from "../../hooks/use-toast"
import EmployeeList from "./EmployeeList"
import SalaryManagement from "./SalaryManagement"
import EnhancedAttendanceSystem from "./EnhancedAttendanceSystem"
import LeaveManagement from "./LeaveManagement"
import LeaveRequests from "./LeaveRequests"
import TaskManagement from "./TaskManagement" // Added TaskManagement import
import CustomerManagement from "./CustomerManagement" // Added CustomerManagement import
import BillsManagement from "./BillsManagement" // Added BillsManagement import
import VendorManagement from "./VendorManagement" // Added VendorManagement import
import BranchManagement from "./BranchManagement" // Added BranchManagement import
import ProductAdd from "./ProductAdd" // Added ProductAdd import
import ProductList from "./ProductList" // Added ProductList import
import PurchaseAdd from "./PurchaseAdd" // Added PurchaseAdd import
import PurchaseList from "./PurchaseList" // Added PurchaseList import
import PurchaseReturn from "./PurchaseReturn" // Added PurchaseReturn import
import SettingsModule from "./SettingsModule" // Added SettingsModule import

const AdminDashboard = ({ view, user, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  const [selectedBranch, setSelectedBranch] = useState("all")
  const [currentView, setCurrentView] = useState("dashboard")
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [selectedCustomerType, setSelectedCustomerType] = useState(null)

  // API Data States
  const [dashboardData, setDashboardData] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [branchesLoading, setBranchesLoading] = useState(true)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Fetch dashboard data
  const fetchDashboardData = async (branchId = null) => {
    setLoading(true)
    try {
      let url = `${API_BASE}/api/branch/dashboard/`
      if (branchId && branchId !== 'all') {
        url += `?branch_id=${branchId}`
      }

      const response = await fetch(url, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        throw new Error('Failed to fetch dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch branches for dropdown
  const fetchBranches = async () => {
    setBranchesLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/branch/`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const branchList = Array.isArray(data) ? data : (data.results || [])
        setBranches(branchList)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setBranchesLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchBranches()
    fetchDashboardData()
  }, [])

  // Fetch data when branch changes
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchDashboardData(selectedBranch)
    }
  }, [selectedBranch])

  // Get current view from URL pathname
  useEffect(() => {
    // Map pathname to view
    const pathToViewMap = {
      '/admin/dashboard': 'dashboard',
      '/admin/product': 'product-list',
      '/admin/product/add': 'product-add',
      '/admin/purchase': 'purchase-list',
      '/admin/purchase/add': 'purchase-add',
      '/admin/purchase/return': 'purchase-return',
      '/admin/employee': 'employee-list',
      '/admin/attendance': 'attendance-system',
      '/admin/salary': 'salary-management',
      '/admin/leave-requests': 'leave-requests',
      '/admin/leave': 'leave-management',
      '/admin/task': 'task-management',
      '/admin/customer': 'customer-management',
      '/admin/bill': 'bills-management',
      '/admin/vendor': 'vendor-management',
      '/admin/branch': 'branch-management',
      '/admin/settings': 'settings'
    }

    const mappedView = pathToViewMap[location.pathname] || 'dashboard'
    setCurrentView(mappedView)

    // Handle dynamic routes like /admin/product/123 or /admin/task/456
    if (location.pathname.match(/\/admin\/product\/\d+/)) {
      setCurrentView('product-view')
    } else if (location.pathname.match(/\/admin\/task\/\d+/)) {
      setCurrentView('task-view')
    }

    // Reset customer list state
    setShowCustomerList(false)
    setSelectedCustomerType(null)
  }, [location.pathname])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const view = urlParams.get('view') || 'dashboard'
      const customerType = urlParams.get('customer')

      setCurrentView(view)

      if (customerType) {
        setSelectedCustomerType(customerType)
        setShowCustomerList(true)
      } else {
        setSelectedCustomerType(null)
        setShowCustomerList(false)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Computed values from API data
  const summaryStats = dashboardData?.summary_stats || {}
  const salesAnalytics = dashboardData?.sales_analytics || []
  const topSellingProducts = dashboardData?.top_selling_products || []
  const customerAnalytics = dashboardData?.customer_analytics || {}
  const employeeAnalytics = dashboardData?.employee_analytics || {}

  // Chart colors for products
  const productColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  // Sales Analytics Data for charts
  const monthlyRevenue = salesAnalytics.map(item => ({
    month: item.month_name?.split(' ')[0]?.substring(0, 3) || item.month,
    revenue: item.revenue,
    sales: item.sales_count
  }))

  const topProducts = topSellingProducts.map((product, index) => ({
    name: product.product_name?.length > 15 ? product.product_name.substring(0, 15) + '...' : product.product_name,
    fullName: product.product_name,
    sales: product.total_qty_sold,
    revenue: product.total_revenue,
    color: productColors[index % productColors.length]
  }))

  // Customer segments from API
  const customerSegments = [
    ...(customerAnalytics.segments?.frequent || []),
    ...(customerAnalytics.segments?.regular || []),
    ...(customerAnalytics.segments?.lost || [])
  ].map(customer => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    totalPurchases: customer.total_purchases,
    totalSpent: customer.total_spent,
    lastPurchase: customer.last_purchase,
    status: customer.status,
    frequency: customer.status === 'frequent' ? 'Weekly' : customer.status === 'regular' ? 'Monthly' : 'Rare'
  }))

  // Employee data from API
  const topPerformer = employeeAnalytics.employee_of_month || null
  const otherEmployees = employeeAnalytics.other_top_employees || []

  // Overview Stats Data
  const stats = [
    { 
      title: "Total Sales", 
      value: summaryStats.total_sales?.toLocaleString() || "0", 
      change: "+10%", 
      changeType: "positive", 
      icon: ShoppingCart 
    },
    { 
      title: "Total Revenue", 
      value: `₹${(summaryStats.total_revenue || 0).toLocaleString()}`, 
      change: "+5%", 
      changeType: "positive", 
      icon: DollarSign 
    },
    { 
      title: "Active Employees", 
      value: summaryStats.total_employees?.toString() || "0", 
      change: "", 
      changeType: "neutral", 
      icon: Users 
    },
    { 
      title: "Customer Base", 
      value: summaryStats.total_customers?.toLocaleString() || "0", 
      change: "+3%", 
      changeType: "positive", 
      icon: Users 
    },
  ]

  // Helper functions
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

  const getPerformanceBadge = (status) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>
      case "good":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>
      case "needs_improvement":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Needs Improvement</Badge>
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

  // Customer stats from API or computed from segments
  const customerStats = {
    frequent: customerAnalytics.frequent_count || customerSegments.filter((c) => c.status === "frequent").length,
    regular: customerAnalytics.regular_count || customerSegments.filter((c) => c.status === "regular").length,
    lost: customerAnalytics.lost_count || customerSegments.filter((c) => c.status === "lost").length,
    total: (customerAnalytics.frequent_count || 0) + (customerAnalytics.regular_count || 0) + (customerAnalytics.lost_count || 0) || customerSegments.length,
  }

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
  }

  const handleCustomerCardClick = (customerType) => {
    setSelectedCustomerType(customerType)
    setShowCustomerList(true)
    // For customer filtering, we'll keep it on dashboard for now
    // Later can be converted to /admin/customer?type=xyz if needed
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

  const renderCurrentView = () => {
    switch (currentView) {
      case "employee-list":
        return <EmployeeList onViewChange={handleViewChange} />
      case "attendance-system":
        return <EnhancedAttendanceSystem />
      case "salary-management":
        return <SalaryManagement />
      case "leave-management":
        return <LeaveManagement />
      case "leave-requests":
        return <LeaveRequests />
      case "task-management":
        return <TaskManagement />
      case "customer-management":
        return <CustomerManagement />
      case "bills-management":
        return <BillsManagement />
      case "vendor-management":
        return <VendorManagement />
      case "branch-management":
        return <BranchManagement />
      case "product-add":
        return <ProductAdd />
      case "product-list":
        return <ProductList />
      case "purchase-add":
        return <PurchaseAdd />
      case "purchase-list":
        return <PurchaseList />
      case "purchase-return":
        return <PurchaseReturn />
      case "settings":
        return <SettingsModule />
      default:
        if (showCustomerList) {
          const filteredCustomers = getFilteredCustomers()

          return (
            <div className="p-6">
              <div className="space-y-6">
                {/* Back button and header */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setShowCustomerList(false)
                      setSelectedCustomerType(null)
                      // Navigate back to dashboard
                      navigate('/admin/dashboard')
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    ← Back to Dashboard
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
                              <td className="p-4 text-right text-foreground">
                                ₹{customer.totalSpent.toLocaleString()}
                              </td>
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
            </div>
          )
        }

        return (
          <div className="p-3 sm:p-6">
            <div className="mb-4 sm:mb-6 flex flex-col gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Welcome back, {user?.name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchDashboardData(selectedBranch === 'all' ? null : selectedBranch)}
                  disabled={loading}
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={branchesLoading}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={branchesLoading ? "Loading..." : "Select Branch"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex flex-col">
                        <span className="font-medium">All Branches</span>
                        <span className="text-xs text-muted-foreground">Overview</span>
                      </div>
                    </SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{branch.name}</span>
                          <span className="text-xs text-muted-foreground">{branch.location || branch.address}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading dashboard data...</span>
              </div>
            )}

            {!loading && <div className="space-y-8">
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
                          {stat.change} from last month
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Sales Analytics Section */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Sales Analytics</h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  {/* Monthly Revenue Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Monthly Revenue Trend</CardTitle>
                      <CardDescription className="text-sm">Revenue and sales count over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="month"
                              fontSize={12}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <YAxis
                              yAxisId="left"
                              fontSize={12}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              fontSize={12}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#374151' }} />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="revenue"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              name="Revenue (₹)"
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, fill: '#3b82f6' }}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="sales"
                              stroke="#ef4444"
                              strokeWidth={3}
                              name="Sales Count"
                              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, fill: '#ef4444' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Selling Products */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Top Selling Products</CardTitle>
                      <CardDescription className="text-sm">Best performing products by sales volume</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="h-[250px] sm:h-[300px] w-full">
                        {topProducts.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            No product data available
                          </div>
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topProducts}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              type="number"
                              fontSize={12}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={80}
                              fontSize={11}
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value, name, props) => {
                                const product = props.payload
                                return [`${value} units (₹${(product.revenue || 0).toLocaleString()})`, 'Sales']
                              }}
                              labelFormatter={(label, payload) => {
                                const product = payload?.[0]?.payload
                                return `Product: ${product?.fullName || label}`
                              }}
                            />
                            <Bar
                              dataKey="sales"
                              fill="#3b82f6"
                              radius={[0, 4, 4, 0]}
                            >
                              {topProducts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Customer Analytics Section */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Customer Analytics</h2>
                {/* Customer Status Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  <Card
                    className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCustomerCardClick("frequent")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Frequent Customers</CardTitle>
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">{customerStats.frequent}</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((customerStats.frequent / customerStats.total) * 100)}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCustomerCardClick("regular")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Regular Customers</CardTitle>
                      <Users className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-yellow-600">{customerStats.regular}</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((customerStats.regular / customerStats.total) * 100)}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCustomerCardClick("lost")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Lost Customers</CardTitle>
                      <UserX className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-red-600">{customerStats.lost}</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((customerStats.lost / customerStats.total) * 100)}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">{customerStats.total}</div>
                      <p className="text-xs text-muted-foreground">Active customer base</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Segments Table */}
                <Card className="mb-6">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Customer Segments Analysis</CardTitle>
                    <CardDescription className="text-sm">Detailed breakdown of customer behavior and status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
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
                          {customerSegments.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-muted-foreground">
                                No customer data available
                              </td>
                            </tr>
                          ) : customerSegments.map((customer) => (
                            <tr key={customer.id} className="border-b border-border hover:bg-accent">
                              <td className="p-4">
                                <div>
                                  <div className="font-medium text-foreground flex items-center gap-2">
                                    {getStatusIcon(customer.status)}
                                    {customer.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{customer.phone || customer.email}</div>
                                </div>
                              </td>
                              <td className="p-4 text-center">{getStatusBadge(customer.status)}</td>
                              <td className="p-4 text-right text-foreground">{customer.totalPurchases}</td>
                              <td className="p-4 text-right text-foreground">
                                ₹{(customer.totalSpent || 0).toLocaleString()}
                              </td>
                              <td className="p-4 text-center text-foreground">{customer.frequency}</td>
                              <td className="p-4 text-center text-muted-foreground">{customer.lastPurchase || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Employee Performance Section */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Employee Performance</h2>

                {/* Top Performer Highlight */}
                {topPerformer && (
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <Trophy className="h-5 w-5" />
                      Employee of the Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={topPerformer.avatar || "/placeholder.svg"} alt={topPerformer.name} />
                        <AvatarFallback>
                          {topPerformer.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-orange-800">{topPerformer.name}</h3>
                        <p className="text-orange-600">{topPerformer.position || topPerformer.role}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-sm">
                            <span className="font-medium">Sales:</span> {topPerformer.total_sales || topPerformer.monthlySales || 0}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Revenue:</span> ₹
                            {(topPerformer.total_revenue || topPerformer.monthlyRevenue || 0).toLocaleString()}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Efficiency:</span> {topPerformer.efficiency || 100}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )}

                {!topPerformer && (
                  <Card className="mb-6">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No employee of the month data available
                    </CardContent>
                  </Card>
                )}

                {/* Employee Performance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Performance Details</CardTitle>
                    <CardDescription>Comprehensive performance metrics for all team members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {otherEmployees.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No employee performance data available
                      </div>
                    ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-4 font-medium text-foreground">Employee</th>
                            <th className="text-center p-4 font-medium text-foreground">Status</th>
                            <th className="text-right p-4 font-medium text-foreground">Sales</th>
                            <th className="text-right p-4 font-medium text-foreground">Target</th>
                            <th className="text-right p-4 font-medium text-foreground">Revenue</th>
                            <th className="text-right p-4 font-medium text-foreground">Efficiency</th>
                            <th className="text-center p-4 font-medium text-foreground">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {otherEmployees.map((employee) => (
                            <tr key={employee.id} className="border-b border-border hover:bg-accent">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                                    <AvatarFallback>
                                      {employee.name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("") || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-foreground">{employee.name}</div>
                                    <div className="text-sm text-muted-foreground">{employee.position || employee.role}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">{getPerformanceBadge(employee.status || 'good')}</td>
                              <td className="p-4 text-right text-foreground font-medium">{employee.total_sales || employee.monthlySales || 0}</td>
                              <td className="p-4 text-right text-muted-foreground">{employee.target || '-'}</td>
                              <td className="p-4 text-right text-foreground">
                                ₹{(employee.total_revenue || employee.monthlyRevenue || 0).toLocaleString()}
                              </td>
                              <td
                                className={`p-4 text-right font-medium ${(employee.efficiency || 100) >= 100
                                  ? "text-green-600"
                                  : (employee.efficiency || 100) >= 80
                                    ? "text-blue-600"
                                    : "text-yellow-600"
                                  }`}
                              >
                                {employee.efficiency || 100}%
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium text-foreground">{employee.rating || '-'}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>}
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar user={user} onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="lg:hidden h-16"></div>
        <div className="min-h-full">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { 
  Search, 
  Filter, 
  Package, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  RefreshCw
} from "lucide-react"
import { useToast } from "../../hooks/use-toast"

const PurchaseReturn = () => {
  const { toast } = useToast()
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // Data states
  const [returns, setReturns] = useState([])
  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [vendorsLoading, setVendorsLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  // Date filter states - default to current month/year
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  // Pagination states
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Fetch returns data
  const fetchReturns = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('month', selectedMonth)
      params.append('year', selectedYear)
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      if (vendorFilter && vendorFilter !== 'all') {
        params.append('vendor', vendorFilter)
      }
      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      if (page > 1) {
        params.append('page', page)
      }

      const response = await fetch(`${API_BASE}/api/vendor/return/?${params.toString()}`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setReturns(data.results || [])
        setPagination({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          currentPage: page
        })
      } else {
        throw new Error('Failed to fetch returns')
      }
    } catch (error) {
      console.error('Error fetching returns:', error)
      toast({
        title: "Error",
        description: "Failed to fetch vendor returns",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch vendors for dropdown
  const fetchVendors = async () => {
    setVendorsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/vendor/`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        // Handle both array and paginated response
        setVendors(Array.isArray(data) ? data : (data.results || []))
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setVendorsLoading(false)
    }
  }

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/product/categories/`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        // Handle both array and paginated response
        setCategories(Array.isArray(data) ? data : (data.results || []))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchVendors()
    fetchCategories()
  }, [])

  // Fetch returns when filters change
  useEffect(() => {
    fetchReturns(1)
  }, [selectedMonth, selectedYear, vendorFilter, categoryFilter])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReturns(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Generate month options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  // Generate year options (last 5 years + current year)
  const years = []
  for (let y = currentDate.getFullYear(); y >= currentDate.getFullYear() - 5; y--) {
    years.push(y)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.next) {
      fetchReturns(pagination.currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (pagination.previous) {
      fetchReturns(pagination.currentPage - 1)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setVendorFilter("all")
    setCategoryFilter("all")
    setSelectedMonth(currentDate.getMonth() + 1)
    setSelectedYear(currentDate.getFullYear())
  }

  // Calculate total quantity
  const totalQty = returns.reduce((sum, item) => sum + (item.total_qty || 0), 0)

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8" />
          Return to Vendor
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">View products returned to vendors</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Returns</p>
                <p className="text-xl sm:text-2xl font-bold">{pagination.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <RotateCcw className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Qty Returned</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{totalQty}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Period</p>
                <p className="text-lg sm:text-xl font-bold text-purple-600">
                  {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product name or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Month Filter */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor Filter */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name || vendor.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchReturns(pagination.currentPage)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Returns</CardTitle>
          <CardDescription>
            Products returned to vendors in {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No returns found</h3>
              <p className="text-muted-foreground">
                No vendor returns for the selected period and filters
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground text-sm">Product</th>
                      <th className="text-left p-3 font-medium text-foreground text-sm">Category</th>
                      <th className="text-left p-3 font-medium text-foreground text-sm">Brand / Model</th>
                      <th className="text-left p-3 font-medium text-foreground text-sm">Vendor</th>
                      <th className="text-left p-3 font-medium text-foreground text-sm">Branch</th>
                      <th className="text-center p-3 font-medium text-foreground text-sm">Qty</th>
                      <th className="text-left p-3 font-medium text-foreground text-sm">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <span className="font-medium text-foreground">{item.product_name}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="font-normal">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-foreground">{item.brand}</div>
                          <div className="text-xs text-muted-foreground">{item.model}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{item.vendor_name}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{item.branch_name}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            {item.total_qty}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.last_updated)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {returns.map((item) => (
                  <Card key={item.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-foreground">{item.product_name}</h3>
                            <p className="text-xs text-muted-foreground">{item.brand} • {item.model}</p>
                          </div>
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            Qty: {item.total_qty}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <span className="ml-1">{item.category}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Vendor:</span>
                            <span className="ml-1">{item.vendor_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Branch:</span>
                            <span className="ml-1">{item.branch_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Updated:</span>
                            <span className="ml-1 text-xs">{formatDate(item.last_updated)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.count > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {returns.length} of {pagination.count} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={!pagination.previous || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {pagination.currentPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!pagination.next || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PurchaseReturn

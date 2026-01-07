"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Search, User, Phone, ChevronLeft, ChevronRight, Loader2, ArrowLeft, DollarSign, X } from "lucide-react"

const CustomerManagement = () => {
  // Customer List States
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const debounceTimer = useRef(null)

  // API states for customer list
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)

  // Customer Detail States
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDetail, setCustomerDetail] = useState(null)
  const [bills, setBills] = useState([])
  const [billsLoading, setBillsLoading] = useState(false)
  const [billsError, setBillsError] = useState(null)
  const [billsCurrentPage, setBillsCurrentPage] = useState(1)
  const [billsTotalCount, setBillsTotalCount] = useState(0)
  const [billsNextPage, setBillsNextPage] = useState(null)
  const [billsPreviousPage, setBillsPreviousPage] = useState(null)

  // Bill Detail State
  const [selectedBill, setSelectedBill] = useState(null)

  // Bills Filter States
  const [billSearchQuery, setBillSearchQuery] = useState("")
  const [debouncedBillSearchQuery, setDebouncedBillSearchQuery] = useState("")
  const billDebounceTimer = useRef(null)
  const [paymentFilter, setPaymentFilter] = useState("all")

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 500)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchQuery])

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("access_token")

        if (!token) {
          throw new Error('No authentication token found')
        }

        // Build query parameters
        const params = new URLSearchParams()
        params.append("page", currentPage)

        if (debouncedSearchQuery) {
          params.append("search", debouncedSearchQuery)
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/customers/?${params.toString()}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Handle both array and paginated responses
        let customerList = []
        if (Array.isArray(data)) {
          customerList = data
        } else if (data.results) {
          customerList = data.results
        } else if (data.data) {
          customerList = data.data
        }

        // Transform API data to component format
        const transformedData = customerList.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          total_bills: customer.total_bills || 0,
          total_spent: customer.total_spent || 0
        }))

        setCustomers(transformedData)

        // Extract pagination info
        if (data.count !== undefined) {
          setTotalCount(data.count)
        }
        if (data.next !== undefined) {
          setNextPage(data.next)
        }
        if (data.previous !== undefined) {
          setPreviousPage(data.previous)
        }

      } catch (error) {
        console.error('Error fetching customers:', error)
        setError(error.message)
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [debouncedSearchQuery, currentPage])

  // Debounce bill search
  useEffect(() => {
    if (billDebounceTimer.current) {
      clearTimeout(billDebounceTimer.current)
    }

    billDebounceTimer.current = setTimeout(() => {
      setDebouncedBillSearchQuery(billSearchQuery)
      setBillsCurrentPage(1)
    }, 500)

    return () => {
      if (billDebounceTimer.current) {
        clearTimeout(billDebounceTimer.current)
      }
    }
  }, [billSearchQuery])

  // Fetch bills for selected customer
  useEffect(() => {
    if (!selectedCustomer) return

    const fetchBills = async () => {
      try {
        setBillsLoading(true)
        setBillsError(null)
        const token = localStorage.getItem("access_token")

        if (!token) {
          throw new Error('No authentication token found')
        }

        // Build query parameters
        const params = new URLSearchParams()
        params.append("page", billsCurrentPage)

        if (debouncedBillSearchQuery) {
          params.append("search", debouncedBillSearchQuery)
        }

        if (paymentFilter !== "all") {
          params.append("payment_status", paymentFilter)
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/customers/${selectedCustomer.id}/bills/?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Handle response structure
        let billsList = []
        let customerData = null

        if (data.results && typeof data.results === 'object' && !Array.isArray(data.results)) {
          // Response has customer and bills
          customerData = data.results.customer
          billsList = data.results.bills || []
        } else if (Array.isArray(data.results)) {
          billsList = data.results
        } else if (Array.isArray(data)) {
          billsList = data
        }

        setCustomerDetail(customerData)
        setBills(billsList)

        // Extract pagination info
        if (data.count !== undefined) {
          setBillsTotalCount(data.count)
        }
        if (data.next !== undefined) {
          setBillsNextPage(data.next)
        }
        if (data.previous !== undefined) {
          setBillsPreviousPage(data.previous)
        }
      } catch (error) {
        console.error('Error fetching bills:', error)
        setBillsError(error.message)
        setBills([])
      } finally {
        setBillsLoading(false)
      }
    }

    fetchBills()
  }, [selectedCustomer, billsCurrentPage, debouncedBillSearchQuery, paymentFilter])

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer)
    setBillsCurrentPage(1)
    setBillSearchQuery("")
    setPaymentFilter("all")
  }

  const handleBackToList = () => {
    setSelectedCustomer(null)
    setCustomerDetail(null)
    setBills([])
  }

  // Show bills detail view if customer selected
  if (selectedCustomer) {
    return (
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={handleBackToList}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Button>

        {/* Customer Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{selectedCustomer.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Phone className="h-4 w-4" />
            {selectedCustomer.phone}
          </div>
        </div>

        {/* Customer Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">₹{customerDetail?.total_spent?.toLocaleString() || selectedCustomer.total_spent?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bills</p>
                  <p className="text-2xl font-bold text-foreground">{customerDetail?.total_bills || selectedCustomer.total_bills || 0}</p>
                </div>
                <Badge className="text-lg">Bills</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Due Amount</p>
                  <p className="text-2xl font-bold text-red-600">₹{customerDetail?.due_amount?.toLocaleString() || 0}</p>
                </div>
                <Badge variant="destructive">Due</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bill Detail Modal */}
        {selectedBill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="sticky top-0 bg-white border-b flex items-center justify-between">
                <div>
                  <CardTitle>Bill Details</CardTitle>
                  <CardDescription>{selectedBill.bill_number}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBill(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Bill Header Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Bill Number</p>
                    <p className="font-bold text-foreground mt-1">{selectedBill.bill_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Date</p>
                    <p className="font-semibold text-foreground mt-1">{selectedBill.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Total Amount</p>
                    <p className="font-bold text-lg text-blue-600 mt-1">₹{selectedBill.final_amount?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Items</p>
                    <p className="font-semibold text-foreground mt-1">{selectedBill.items?.length || 0}</p>
                  </div>
                </div>

                {/* Bill Items Table */}
                {selectedBill.items && selectedBill.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold text-foreground">Product</th>
                          <th className="text-center p-3 text-sm font-semibold text-foreground">Qty</th>
                          <th className="text-right p-3 text-sm font-semibold text-foreground">Price</th>
                          <th className="text-right p-3 text-sm font-semibold text-foreground">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <p className="font-medium text-foreground">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">CGST: {item.cgst_percent}% | SGST: {item.sgst_percent}%</p>
                            </td>
                            <td className="p-3 text-center text-foreground">{item.qty}</td>
                            <td className="p-3 text-right text-foreground">₹{item.price?.toLocaleString() || 0}</td>
                            <td className="p-3 text-right font-semibold text-foreground">₹{item.final_amount?.toLocaleString() || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total Section */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-600">₹{selectedBill.final_amount?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bills Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Search Bill Number</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by bill number..."
                    value={billSearchQuery}
                    onChange={(e) => setBillSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Payment Status</label>
                <Select value={paymentFilter} onValueChange={(value) => {
                  setPaymentFilter(value)
                  setBillsCurrentPage(1)
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pay_later">Pay Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bills List */}
        <Card>
          <CardHeader>
            <CardTitle>Bills List</CardTitle>
            <CardDescription>Showing {bills.length} bills</CardDescription>
          </CardHeader>
          <CardContent>
            {billsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-muted-foreground">Loading bills...</p>
                </div>
              </div>
            ) : billsError ? (
              <div className="text-center py-8 text-red-500">
                <p className="font-medium">Error Loading Bills</p>
                <p className="text-sm text-muted-foreground">{billsError}</p>
              </div>
            ) : bills.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No bills found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bills.map((bill) => (
                  <Card
                    key={bill.bill_id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedBill(bill)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{bill.bill_number}</p>
                        <p className="text-sm text-muted-foreground">{bill.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{bill.final_amount?.toLocaleString() || 0}</p>
                        <Badge variant="outline" className="mt-1">{bill.items?.length || 0} items</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Bills Pagination */}
            {bills.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  Page <span className="font-semibold text-muted-foreground">{billsCurrentPage}</span> • Total <span className="font-semibold text-muted-foreground">{billsTotalCount}</span> bills
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBillsCurrentPage(billsCurrentPage - 1)}
                    disabled={!billsPreviousPage}
                    className="px-3 font-medium"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBillsCurrentPage(billsCurrentPage + 1)}
                    disabled={!billsNextPage}
                    className="px-3 font-medium"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show customers list view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
        <p className="text-muted-foreground">Manage and view all customers</p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Showing {customers.length} of {totalCount} customers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-muted-foreground">Loading customers...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500">
                <p className="font-medium">Error Loading Customers</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {customers.map((customer) => (
                <Card
                  key={customer.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground text-base truncate">{customer.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Bills</span>
                        <Badge variant="outline" className="text-sm font-semibold">{customer.total_bills}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-bold text-foreground text-base">₹{customer.total_spent.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {customers.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page <span className="font-semibold text-muted-foreground">{currentPage}</span> • Total <span className="font-semibold text-muted-foreground">{totalCount}</span> customers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!previousPage}
                  className="px-3 font-medium"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!nextPage}
                  className="px-3 font-medium"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerManagement

"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ArrowLeft, Receipt, User, Clock, DollarSign, CreditCard, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { useRouter, useSearchParams } from "next/navigation"

const BillsManagement = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [bills, setBills] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedBill, setSelectedBill] = useState(null)

  // Filter states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [filterBranch, setFilterBranch] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceTimer = useRef(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)
  const [summary, setSummary] = useState(null)

  // Product search modal
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [products, setProducts] = useState([])
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productsLoading, setProductsLoading] = useState(false)

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    }
  }

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/branch/`, {
          method: "GET",
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          setBranches(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
      }
    }
    fetchBranches()
  }, [])

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(debounceTimer.current)
  }, [searchQuery])

  // Fetch bills
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        params.append("page", currentPage)
        params.append("date", selectedDate)

        if (debouncedSearch) {
          params.append("search", debouncedSearch)
        }

        if (filterBranch !== "all") {
          params.append("branch", filterBranch)
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/bills/all/?${params.toString()}`,
          {
            method: "GET",
            headers: getAuthHeaders()
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log(data);

        // Handle response structure from API - data is nested in results
        const results = data.results || data
        if (results.bills) {
          setBills(results.bills)
          setSummary(results.summary || null)
          setTotalCount(data.count || 0)
          setNextPage(data.next || null)
          setPreviousPage(data.previous || null)
        } else {
          throw new Error("Invalid response structure")
        }
      } catch (error) {
        console.error("Error fetching bills:", error)
        setError(error.message)
        setBills([])
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [currentPage, selectedDate, debouncedSearch, filterBranch])

  // Update URL when page changes
  useEffect(() => {
    router.push(`?page=${currentPage}`, { scroll: false })
  }, [currentPage, router])

  const getPaymentMethodColor = (method) => {
    const colors = {
      cash: "bg-green-100 text-green-800",
      upi: "bg-blue-100 text-blue-800",
      card: "bg-purple-100 text-purple-800",
      pay_later: "bg-orange-100 text-orange-800"
    }
    return colors[method?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (value) => {
    if (!value) return "₹0"
    const num = typeof value === "string" ? parseFloat(value) : value
    return isNaN(num) ? "₹0" : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Fetch products for search
  const fetchProducts = async (query = "") => {
    try {
      setProductsLoading(true)
      const params = new URLSearchParams()
      if (query) params.append("search", query)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/list/?${params.toString()}`,
        {
          method: "GET",
          headers: getAuthHeaders()
        }
      )

      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : data.results || [])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setProductsLoading(false)
    }
  }

  // Open product search modal
  const openProductSearch = () => {
    setShowProductSearch(true)
    setProductSearchQuery("")
    fetchProducts()
  }

  if (selectedBill) {
    return (
      <div className="p-6 space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedBill(null)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bills
        </Button>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedBill.bill_number}</CardTitle>
                <CardDescription>{new Date(selectedBill.date).toLocaleString()}</CardDescription>
              </div>
              <Badge className="text-lg px-3 py-1">{formatCurrency(selectedBill.final_amount)}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Customer & Branch Info */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Customer</p>
                <p className="font-semibold">{selectedBill.customer?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedBill.customer?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Branch</p>
                <p className="font-semibold">{selectedBill.branch_name}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-2 bg-slate-100 text-xs font-semibold">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-2 text-right">Salesperson</div>
                </div>
                {selectedBill.items?.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-t text-sm hover:bg-slate-50">
                    <div className="col-span-4">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                    </div>
                    <div className="col-span-2 text-center">{item.qty || item.quantity}</div>
                    <div className="col-span-2 text-right">{formatCurrency(item.price)}</div>
                    <div className="col-span-2 text-right font-semibold">{formatCurrency(item.total || item.final_price)}</div>
                    <div className="col-span-2 text-right text-muted-foreground">{item.salesperson?.name || "N/A"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Payments</h3>
              <div className="space-y-2">
                {selectedBill.payments?.map((payment) => {
                  const method = payment.payment_method || payment.method
                  const amount = payment.total_amount || payment.amount
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge className={getPaymentMethodColor(method)}>
                          {method ? method.toUpperCase() : "UNKNOWN"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{payment.date ? new Date(payment.date).toLocaleString() : "N/A"}</span>
                      </div>
                      <p className="font-semibold">{formatCurrency(amount)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="border-t pt-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedBill.total_amount)}</span>
                </div>
                {parseFloat(selectedBill.total_discount) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedBill.total_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Final Amount</span>
                  <span className="text-green-600">{formatCurrency(selectedBill.final_amount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bills Management</h1>
          <p className="text-muted-foreground">View and manage all bills</p>
        </div>
        <Button onClick={openProductSearch} className="gap-2">
          <Search className="h-4 w-4" />
          Search Products
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={filterBranch} onValueChange={(value) => {
                setFilterBranch(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search Bill</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bill number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Bills</p>
              <p className="text-2xl font-bold">{summary.total_bills}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.cash_revenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">UPI</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.upi_revenue)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>Showing {bills.length} of {totalCount} bills</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-muted-foreground">Loading bills...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p className="font-medium">Error Loading Bills</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No bills found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <Card
                  key={bill.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedBill(bill)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{bill.bill_number}</h3>
                          <Badge variant="outline">{bill.branch_name}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {bill.customer.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(bill.date).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {bill.payments?.length || 0} payments
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {bill.items?.length || 0} items
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(bill.final_amount)}</p>
                        <p className="text-xs text-muted-foreground">Final Amount</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {bills.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page <span className="font-semibold">{currentPage}</span> • Total <span className="font-semibold">{totalCount}</span> bills
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!previousPage}
                  className="px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!nextPage}
                  className="px-3"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Search Dialog */}
      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, HSN, vendor..."
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value)
                  fetchProducts(e.target.value)
                }}
                className="pl-10"
                autoFocus
              />
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products found
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      // Copy product info to clipboard or handle as needed
                      const productInfo = `${product.name} (${product.sku}) - ${formatCurrency(product.selling_price)}`
                      navigator.clipboard.writeText(productInfo)
                      setShowProductSearch(false)
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku} • HSN: {product.hsn_code} • Brand: {product.brand_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(product.selling_price)}</p>
                          <p className="text-xs text-muted-foreground">Selling Price</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BillsManagement

"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Eye, Trash2, Building2, FileText, Calendar, X, ChevronLeft, ChevronRight, Package, Edit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { useToast } from "../../hooks/use-toast"
import { useNavigate } from "react-router-dom"

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
]

const years = ["2023", "2024", "2025", "2026"]

const currency = (n) => `₹${Number(n || 0).toLocaleString()}`

export default function PurchaseList() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)
  
  // Detail modal states
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [purchaseDetail, setPurchaseDetail] = useState(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [deleteId, setDeleteId] = useState(null)
  const [previewReceipt, setPreviewReceipt] = useState(null)
  const [vendors, setVendors] = useState([]) // For vendor dropdown

  // Fetch purchases list from API with pagination and filters
  const fetchPurchases = async (page = 1) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("access_token")
      
      // Build query params
      const params = new URLSearchParams()
      params.append('page', page)
      
      // Add filters to query params
      if (query.trim()) {
        params.append('bill_no', query.trim())
      }
      if (selectedVendor !== "all") {
        params.append('vendor_id', selectedVendor)
      }
      if (selectedMonth !== "all") {
        params.append('month', selectedMonth)
      }
      if (selectedYear !== "all") {
        params.append('year', selectedYear)
      }
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/?${params.toString()}`
      console.log('Fetching purchases with URL:', url)
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Purchases API response:', data)
        
        // Handle the nested structure: data.results.results
        const purchaseResults = data.results?.results || []
        setPurchases(purchaseResults)
        setTotalCount(data.count || 0)
        setNextPage(data.next)
        setPrevPage(data.previous)
        setCurrentPage(page)
      } else {
        toast({
          title: "Error",
          description: "Failed to load purchases",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching purchases:", error)
      toast({
        title: "Error",
        description: "Failed to load purchases",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch purchase detail
  const fetchPurchaseDetail = async (purchaseId) => {
    try {
      setIsLoadingDetail(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/${purchaseId}/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Purchase detail fetched:', data)
        setPurchaseDetail(data.purchase)
        setShowDetailModal(true)
      } else {
        toast({
          title: "Error",
          description: "Failed to load purchase details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching purchase detail:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase details",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Fetch vendors for dropdown
  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setVendors(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
    }
  }

  // Load purchases and vendors on mount
  useEffect(() => {
    fetchVendors()
  }, [])

  // Load purchases on mount and when filters change
  useEffect(() => {
    fetchPurchases(1) // Reset to page 1 when filters change
  }, [query, selectedVendor, selectedMonth, selectedYear])

  // Since filtering is now done server-side, just use purchases directly
  const filtered = purchases

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, p) => sum + (p.total || 0), 0)
  }, [filtered])

  const handleViewDetail = (purchase) => {
    setSelectedPurchase(purchase)
    fetchPurchaseDetail(purchase.id)
  }

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      if (response.ok) {
        setPurchases(prev => prev.filter(p => p.id !== id))
        setDeleteId(null)
        toast({
          title: "Success",
          description: "Purchase deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete purchase",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast({
        title: "Error",
        description: "Failed to delete purchase",
        variant: "destructive",
      })
    }
  }

  const handleReceiptPreview = (receipt) => {
    setPreviewReceipt(receipt)
  }

  const closePreview = () => {
    setPreviewReceipt(null)
  }

  const handleNextPage = () => {
    if (nextPage) {
      fetchPurchases(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (prevPage) {
      fetchPurchases(currentPage - 1)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <h1 className="text-2xl font-bold text-foreground">Purchase List</h1>
        </div>
        <div className="flex flex-col gap-3 w-full">
          {/* First Row: Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(query || selectedVendor !== "all" || selectedMonth !== "all" || selectedYear !== "all") && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setQuery("")
                  setSelectedVendor("all")
                  setSelectedMonth("all")
                  setSelectedYear("all")
                }}
                className="w-full lg:w-auto justify-center"
              >
                Clear Filters
              </Button>
            )}
          </div>
          {/* Second Row: Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full"
              placeholder="Search by bill number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <span>Purchase Summary</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {currency(totalAmount)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-accent/40 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{filtered.length}</div>
              <div className="text-sm text-muted-foreground">Total Purchases</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {filtered.filter(p => p.receipts_count > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">With Documents</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(filtered.map(p => p.vendor?.name).filter(Boolean)).size}
              </div>
              <div className="text-sm text-muted-foreground">Unique Vendors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">
            Purchase Records
            {selectedVendor !== "all" && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - {selectedVendor} ({filtered.length} purchases)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-foreground">Vendor</th>
                  <th className="text-left p-3 font-medium text-foreground">Date</th>
                  <th className="text-right p-3 font-medium text-foreground">Amount</th>
                  <th className="text-center p-3 font-medium text-foreground">Document</th>
                  <th className="text-right p-3 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        Loading purchases...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No purchases found
                    </td>
                  </tr>
                ) : (
                  filtered.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-border hover:bg-accent/20">
                    <td className="p-3">
                      <div className="font-medium text-foreground">{purchase.vendor?.name || 'N/A'}</div>
                      {purchase.bill_no && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Bill: {purchase.bill_no}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-foreground">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(purchase.purchase_date)}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-semibold text-foreground">
                          {currency(purchase.total)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {purchase.items_count} items
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {purchase.receipts_count > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          {purchase.receipts_count} {purchase.receipts_count === 1 ? 'File' : 'Files'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No file</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Edit button clicked (desktop), navigating to:', `/admin/purchase/edit/${purchase.id}`)
                            navigate(`/admin/purchase/edit/${purchase.id}`)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(purchase)}
                          disabled={isLoadingDetail && selectedPurchase?.id === purchase.id}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <AlertDialog open={deleteId === purchase.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-white hover:bg-destructive/10"
                              onClick={() => setDeleteId(purchase.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this purchase from "{purchase.vendor?.name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(purchase.id)}
                                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              <Card className="p-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  Loading purchases...
                </div>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  No purchases found
                </div>
              </Card>
            ) : (
              filtered.map((purchase) => (
              <Card key={purchase.id} className="p-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{purchase.vendor?.name || 'N/A'}</h3>
                      {purchase.bill_no && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Bill: {purchase.bill_no}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(purchase.purchase_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-foreground">{currency(purchase.total)}</div>
                      <div className="text-xs text-muted-foreground">{purchase.items_count} items</div>
                      <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground mt-1">
                        {purchase.receipts_count > 0 ? (
                          <>
                            <FileText className="w-3 h-3 text-green-600" />
                            <span className="text-green-600">{purchase.receipts_count} Doc</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-red-400" />
                            <span className="text-red-400">No Doc</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Edit button clicked, navigating to:', `/admin/purchase/edit/${purchase.id}`)
                        navigate(`/admin/purchase/edit/${purchase.id}`)
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(purchase)}
                      disabled={isLoadingDetail && selectedPurchase?.id === purchase.id}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <AlertDialog open={deleteId === purchase.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-white hover:bg-destructive/10 flex-1 sm:flex-none"
                          onClick={() => setDeleteId(purchase.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this purchase from "{purchase.vendor?.name}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteId(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(purchase.id)}
                            className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && totalCount > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing page {currentPage} of {Math.ceil(totalCount / 10)} ({totalCount} total purchases)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!prevPage}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!nextPage}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No purchases found</p>
              {query || selectedVendor !== "all" || selectedMonth !== "all" || selectedYear !== "all" ? (
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Purchase Details
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              Loading details...
            </div>
          ) : purchaseDetail ? (
            <div className="overflow-y-auto flex-1">
              {/* Purchase Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-accent/20 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Vendor</Label>
                  <div className="font-semibold text-foreground">{purchaseDetail.vendor?.name || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Purchase Date</Label>
                  <div className="font-semibold text-foreground">{formatDate(purchaseDetail.purchase_date)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bill Number</Label>
                  <div className="font-semibold text-foreground">{purchaseDetail.bill_no || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Amount</Label>
                  <div className="font-bold text-lg text-foreground">{currency(purchaseDetail.total)}</div>
                </div>
              </div>

              {/* Purchase Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Items ({purchaseDetail.items?.length || 0})
                </h3>
                <div className="space-y-4">
                  {purchaseDetail.items?.map((item, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="bg-accent/40 p-3 border-b">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground text-lg">
                              {item.variant?.name || item.product?.name || 'N/A'}
                            </div>
                            {item.product?.barcode && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Barcode: {item.product.barcode}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-foreground">{currency(item.total)}</div>
                            <div className="text-xs text-muted-foreground">Total Amount</div>
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-3">
                        <div className="grid grid-cols-3 gap-4 mb-3 pb-3 border-b">
                          <div>
                            <Label className="text-xs text-muted-foreground">Total Qty</Label>
                            <div className="font-semibold text-foreground">{item.qty}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Purchase Price</Label>
                            <div className="font-semibold text-foreground">{currency(item.purchase_price)}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Selling Price</Label>
                            <div className="font-semibold text-foreground">{currency(item.selling_price)}</div>
                          </div>
                        </div>

                        {/* Branch-wise Stock Distribution */}
                        {item.stocks && item.stocks.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Branch-wise Distribution</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.stocks.map((stock, stockIndex) => (
                                <div 
                                  key={stockIndex} 
                                  className="flex items-center justify-between p-2 bg-accent/20 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">
                                      {stock.branch?.name || 'Unknown Branch'}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    Qty: {stock.qty || stock.quantity || 0}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Serial Numbers if available */}
                        {item.serial_numbers && item.serial_numbers.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <Label className="text-xs text-muted-foreground mb-2 block">Serial Numbers</Label>
                            <div className="flex flex-wrap gap-1">
                              {item.serial_numbers.map((serial, serialIndex) => (
                                <Badge key={serialIndex} variant="outline" className="text-xs">
                                  {typeof serial === 'object' ? serial.serial_number : serial}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Total Summary */}
                <Card className="mt-4 bg-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-lg">Grand Total:</span>
                      <span className="font-bold text-2xl text-foreground">
                        {currency(purchaseDetail.total)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Receipts/Documents */}
              {purchaseDetail.receipts && purchaseDetail.receipts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents ({purchaseDetail.receipts.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {purchaseDetail.receipts.map((receipt, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                Document {index + 1}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDateTime(receipt.uploaded_at)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReceiptPreview(receipt.receipt)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No details available
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Modal */}
      {previewReceipt && (
        <Dialog open={!!previewReceipt} onOpenChange={closePreview}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Preview
                </span>
                <Button variant="ghost" size="sm" onClick={closePreview}>
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[70vh]">
              <img 
                src={previewReceipt} 
                alt="Receipt" 
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/placeholder.jpg'
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closePreview}>
                Close
              </Button>
              <Button 
                onClick={() => window.open(previewReceipt, '_blank')}
              >
                Open in New Tab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
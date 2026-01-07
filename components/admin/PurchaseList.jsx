"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Eye, Edit, Trash2, Building2, FileText, Calendar, DollarSign, X } from "lucide-react"
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
  DialogTrigger,
} from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { useToast } from "../../hooks/use-toast"



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
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [query, setQuery] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [expandedId, setExpandedId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [editingPurchase, setEditingPurchase] = useState(null)
  const [editForm, setEditForm] = useState({
    vendor: "",
    grandTotal: "",
    purchaseDate: "",
    notes: ""
  })
  const [previewReceipt, setPreviewReceipt] = useState(null)

  // Fetch purchases from API
  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Purchases fetched:', data)
        
        // Map API data to component format
        const mappedPurchases = (data.results || data).map(purchase => ({
          id: purchase.id,
          vendor: purchase.vendor?.name || "Unknown Vendor", // vendor is now object
          vendorId: purchase.vendor?.id,
          grandTotal: parseFloat(purchase.total),
          purchaseDate: purchase.purchase_date,
          notes: purchase.notes || "",
          receipts: purchase.receipts || [], // Array of receipt objects
          hasFile: purchase.receipts && purchase.receipts.length > 0,
          createdAt: purchase.created_at
        }))
        
        setPurchases(mappedPurchases)
      } else {
        console.error("Failed to fetch purchases")
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

  // Load purchases on component mount
  useEffect(() => {
    fetchPurchases()
  }, [])

  const filtered = useMemo(() => {
    let filteredPurchases = purchases

    // Filter by search query
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      filteredPurchases = filteredPurchases.filter((p) => {
        const searchText = `${p.vendor} ${p.notes} ${p.fileName || ''}`.toLowerCase()
        return searchText.includes(q)
      })
    }

    // Filter by vendor
    if (selectedVendor !== "all") {
      filteredPurchases = filteredPurchases.filter((p) => p.vendor === selectedVendor)
    }

    // Filter by month
    if (selectedMonth !== "all") {
      filteredPurchases = filteredPurchases.filter((p) => {
        const purchaseMonth = new Date(p.purchaseDate).getMonth() + 1
        return purchaseMonth.toString() === selectedMonth
      })
    }

    // Filter by year
    if (selectedYear !== "all") {
      filteredPurchases = filteredPurchases.filter((p) => {
        const purchaseYear = new Date(p.purchaseDate).getFullYear()
        return purchaseYear.toString() === selectedYear
      })
    }

    // Sort by date (newest first)
    return filteredPurchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [purchases, query, selectedVendor, selectedMonth, selectedYear])

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, p) => sum + p.grandTotal, 0)
  }, [filtered])

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setPurchases(prev => prev.filter(p => p.id !== id))
        setDeleteId(null)
        toast({
          title: "Success",
          description: "Purchase deleted successfully",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete purchase",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast({
        title: "Error",
        description: "Failed to delete purchase. Please try again.",
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

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase)
    setEditForm({
      vendor: purchase.vendor,
      grandTotal: purchase.grandTotal.toString(),
      purchaseDate: purchase.purchaseDate,
      notes: purchase.notes
    })
  }

  const handleSaveEdit = () => {
    if (!editForm.vendor || !editForm.grandTotal || !editForm.purchaseDate) {
      alert("Please fill in all required fields")
      return
    }

    setPurchases(prev => prev.map(p => 
      p.id === editingPurchase.id 
        ? {
            ...p,
            vendor: editForm.vendor,
            grandTotal: parseFloat(editForm.grandTotal) || 0,
            purchaseDate: editForm.purchaseDate,
            notes: editForm.notes
          }
        : p
    ))
    
    setEditingPurchase(null)
    setEditForm({ vendor: "", grandTotal: "", purchaseDate: "", notes: "" })
  }

  const handleCancelEdit = () => {
    setEditingPurchase(null)
    setEditForm({ vendor: "", grandTotal: "", purchaseDate: "", notes: "" })
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
                {Array.from(new Set(purchases.map(p => p.vendor))).map((vendor) => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor}
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
              placeholder="Search by vendor, notes, or file name..."
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
                {filtered.filter(p => p.receipts && p.receipts.length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">With Documents</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(filtered.map(p => p.vendor?.name || 'Unknown')).size}
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
                      <div className="font-medium text-foreground">{purchase.vendor}</div>
                      {purchase.notes && (
                        <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                          {purchase.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-foreground">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(purchase.purchaseDate)}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-semibold text-foreground">
                          {currency(purchase.grandTotal)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {purchase.receipts && purchase.receipts.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {purchase.receipts.length === 1 ? (
                            <Badge 
                              variant="secondary" 
                              className="text-xs cursor-pointer hover:bg-secondary/80" 
                              onClick={() => handleReceiptPreview(purchase.receipts[0])}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              {purchase.receipts[0].file_url?.split('.').pop()?.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {purchase.receipts.length} Files
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No file</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedId(expandedId === purchase.id ? null : purchase.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {expandedId === purchase.id ? "Hide" : "View"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(purchase)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
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
                                Are you sure you want to delete this purchase from "{purchase.vendor}"? 
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

                      {expandedId === purchase.id && (
                        <div className="mt-3 p-4 rounded-md bg-accent/40 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground text-xs">Purchase Date</Label>
                              <div className="text-sm text-foreground font-medium">
                                {formatDate(purchase.purchaseDate)}
                              </div>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Created At</Label>
                              <div className="text-sm text-foreground">
                                {formatDateTime(purchase.createdAt)}
                              </div>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Grand Total</Label>
                              <div className="text-sm text-foreground font-semibold">
                                {currency(purchase.grandTotal)}
                              </div>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Receipts</Label>
                              <div className="text-sm text-foreground">
                                {purchase.receipts && purchase.receipts.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {purchase.receipts.map((receipt, index) => (
                                      <Badge 
                                        key={receipt.id} 
                                        variant="outline" 
                                        className="cursor-pointer hover:bg-accent"
                                        onClick={() => handleReceiptPreview(receipt)}
                                      >
                                        <FileText className="w-3 h-3 mr-1" />
                                        Receipt {index + 1}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No receipts attached</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {purchase.notes && (
                            <div>
                              <Label className="text-muted-foreground text-xs">Notes</Label>
                              <div className="text-sm text-foreground mt-1 p-2 bg-background rounded border">
                                {purchase.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                      <h3 className="font-semibold text-foreground">{purchase.vendor}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(purchase.purchaseDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-foreground">{currency(purchase.grandTotal)}</div>
                      <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                        {purchase.hasFile ? (
                          <>
                            <FileText className="w-3 h-3 text-green-600" />
                            <span className="text-green-600">Document</span>
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
                  
                  {purchase.notes && (
                    <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {purchase.notes}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === purchase.id ? null : purchase.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {expandedId === purchase.id ? "Hide" : "View"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(purchase)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
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
                            Are you sure you want to delete this purchase from "{purchase.vendor}"? 
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

                  {expandedId === purchase.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground text-xs">Purchase Date</Label>
                          <div className="text-foreground font-medium">
                            {formatDate(purchase.purchaseDate)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Created At</Label>
                          <div className="text-foreground">
                            {formatDateTime(purchase.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-muted-foreground text-xs">Receipts</Label>
                        <div className="text-sm text-foreground mt-1">
                          {purchase.receipts && purchase.receipts.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {purchase.receipts.map((receipt, index) => (
                                <Badge 
                                  key={receipt.id} 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-accent text-xs"
                                  onClick={() => handleReceiptPreview(receipt)}
                                >
                                  <FileText className="w-2 h-2 mr-1" />
                                  Receipt {index + 1}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No receipts attached</span>
                          )}
                        </div>
                      </div>
                      
                      {purchase.notes && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Notes</Label>
                          <div className="text-sm text-foreground mt-1 p-2 bg-accent/20 rounded border">
                            {purchase.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              ))
            )}
          </div>

          {filtered.length === 0 && (
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

      {/* Edit Purchase Dialog */}
      <Dialog open={!!editingPurchase} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-vendor" className="text-sm font-medium">
                Vendor <span className="text-red-500">*</span>
              </Label>
              <Select value={editForm.vendor} onValueChange={(value) => setEditForm(prev => ({ ...prev, vendor: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(purchases.map(p => p.vendor))).map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-total" className="text-sm font-medium">
                Grand Total <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-total"
                type="number"
                placeholder="0.00"
                value={editForm.grandTotal}
                onChange={(e) => setEditForm(prev => ({ ...prev, grandTotal: e.target.value }))}
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-date" className="text-sm font-medium">
                Purchase Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.purchaseDate}
                onChange={(e) => setEditForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                placeholder="Optional notes about this purchase..."
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Modal */}
      <Dialog open={!!previewReceipt} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Receipt Preview
            </DialogTitle>
          </DialogHeader>
          
          {previewReceipt && (
            <div className="flex-1 overflow-auto">
              {previewReceipt.file_url?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewReceipt.file_url}
                  className="w-full h-96 border rounded"
                  title="Receipt Preview"
                />
              ) : (
                <div className="flex justify-center">
                  <img
                    src={previewReceipt.file_url}
                    alt="Receipt"
                    className="max-w-full max-h-96 object-contain border rounded"
                  />
                </div>
              )}
              
              <div className="mt-4 p-3 bg-accent/50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Uploaded: {new Date(previewReceipt.uploaded_at).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <a 
                    href={previewReceipt.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open in new tab →
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={closePreview}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
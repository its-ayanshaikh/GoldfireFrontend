"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ArrowRight, Package, AlertTriangle, CheckCircle, Clock, Send, X, Eye, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { useToast } from "@/hooks/use-toast"



const StockTransfer = () => {
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)
  const pageSize = 20
  const [sentTransfers, setSentTransfers] = useState([])
  const [receivedTransfers, setReceivedTransfers] = useState([])
  const [transfersLoading, setTransfersLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [fromBranch, setFromBranch] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  // Get current user's branch - this should come from user context/login
  const [currentUserBranch, setCurrentUserBranch] = useState(null)
  const [pendingRequests, setPendingRequests] = useState([])
  const [rejectionNotes, setRejectionNotes] = useState("")
  const [selectedRequestForAction, setSelectedRequestForAction] = useState(null)
  const [requestSearchTerm, setRequestSearchTerm] = useState("")
  const [sentTransfersLoaded, setSentTransfersLoaded] = useState(false)
  const [receivedTransfersLoaded, setReceivedTransfersLoaded] = useState(false)

  // API Functions
  const fetchProducts = async (page = 1, search = "", category = "all") => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      
      // Build query params
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('page_size', pageSize.toString())
      
      if (search && search.trim()) {
        params.append('search', search.trim())
      }
      
      if (category && category !== 'all') {
        // Find category ID from categories array
        const categoryObj = categories.find(cat => cat.name === category || cat.id.toString() === category)
        if (categoryObj) {
          params.append('category', categoryObj.id.toString())
        }
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/list/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        
        // Handle paginated response
        const results = data.results || data
        setTotalCount(data.count || results.length)
        setNextPage(data.next)
        setPrevPage(data.previous)
        setCurrentPage(page)

        // Transform API response to match component structure
        const transformedProducts = results.map(product => ({
          id: product.id,
          name: product.name,
          brand: product.brand_name || "Unknown Brand",
          model: product.model_name || "-",
          category: product.category_name || "Unknown Category",
          categoryId: product.category,
          branchQuantities: (product.quantities || []).reduce((acc, qty) => {
            acc[qty.branch_name] = {
              qty: qty.qty,
              branchId: qty.branch,
              rack: qty.rack_name
            }
            return acc
          }, {}),
          // Store original quantities for detailed view
          quantities: product.quantities || []
        }))

        setProducts(transformedProducts)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/categories/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // API Functions for Transfer Requests
  const fetchSentTransfers = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/transfers/sent/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setSentTransfers(data)
        setSentTransfersLoaded(true)
      } else {
        console.error('Failed to fetch sent transfers')
      }
    } catch (error) {
      console.error('Error fetching sent transfers:', error)
    }
  }

  const fetchReceivedTransfers = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/transfers/received/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setReceivedTransfers(data)
        setReceivedTransfersLoaded(true)
      } else {
        console.error('Failed to fetch received transfers')
      }
    } catch (error) {
      console.error('Error fetching received transfers:', error)
    }
  }

  const fetchTransfers = async () => {
    try {
      setTransfersLoading(true)
      await Promise.all([fetchSentTransfers(), fetchReceivedTransfers()])
    } finally {
      setTransfersLoading(false)
    }
  }

  // Handle tab change and load data only when needed
  const handleTabChange = (tabValue) => {
    if (tabValue === "requests" && !sentTransfersLoaded) {
      setTransfersLoading(true)
      fetchSentTransfers().finally(() => {
        setTransfersLoading(false)
        setSentTransfersLoaded(true)
      })
    } else if (tabValue === "receive" && !receivedTransfersLoaded) {
      setTransfersLoading(true)
      fetchReceivedTransfers().finally(() => {
        setTransfersLoading(false)
        setReceivedTransfersLoaded(true)
      })
    }
  }

  // Load categories on mount
  useEffect(() => {
    fetchCategories()

    // Get current user's branch from localStorage or user context
    const userBranch = localStorage.getItem('branch')
    console.log(userBranch)
    if (userBranch) {
      setCurrentUserBranch(userBranch)
    }
  }, [])

  // Fetch products initially after categories are loaded
  useEffect(() => {
    if (categories.length >= 0) {
      fetchProducts(1, searchTerm, selectedCategory)
    }
  }, [categories])

  // Debounced search and category filter
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1)
      fetchProducts(1, searchTerm, selectedCategory)
    }, 500) // 500ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedCategory])

  // Pagination handlers
  const handleNextPage = () => {
    if (nextPage) {
      fetchProducts(currentPage + 1, searchTerm, selectedCategory)
    }
  }

  const handlePrevPage = () => {
    if (prevPage) {
      fetchProducts(currentPage - 1, searchTerm, selectedCategory)
    }
  }

  // Products are now filtered by backend, use directly
  const filteredProducts = products

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize)





  const getStockStatus = (qty) => {
    if (qty === 0) return { status: "out", color: "bg-red-100 text-red-800" }
    if (qty <= 5) return { status: "low", color: "bg-yellow-100 text-yellow-800" }
    return { status: "good", color: "bg-green-100 text-green-800" }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-3 h-3 mr-1" />
      case 'approved': return <CheckCircle className="w-3 h-3 mr-1" />
      case 'rejected': return <X className="w-3 h-3 mr-1" />
      case 'completed': return <CheckCircle className="w-3 h-3 mr-1" />
      default: return <Clock className="w-3 h-3 mr-1" />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleTransferRequest = async () => {
    if (!selectedProduct || !fromBranch || !quantity) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    const requestQty = Number.parseInt(quantity)
    const selectedBranchQty = selectedProduct.quantities?.find(q => q.branch.toString() === fromBranch)
    const availableQty = selectedBranchQty?.qty || 0

    if (requestQty > availableQty) {
      const branchName = selectedBranchQty?.branch_name || "selected branch"
      toast({
        title: "Error",
        description: `Not enough stock in ${branchName}. Available: ${availableQty}`,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/transfers/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({
          product_id: selectedProduct.id,
          to_branch: parseInt(fromBranch), // Branch ID where stock is available
          quantity: requestQty,
          notes: notes || ""
        }),
      })

      if (response.ok) {
        const data = await response.json()

        toast({
          title: "Transfer Request Sent",
          description: `Request for ${requestQty} units of ${selectedProduct.name} has been sent`,
        })

        // Reset form
        setSelectedProduct(null)
        setFromBranch("")
        setQuantity("")
        setNotes("")
        setIsRequestDialogOpen(false)

        // Refresh products and sent transfers to get updated data
        fetchProducts()
        if (sentTransfersLoaded) {
          fetchSentTransfers()
        }

      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData.error || "Failed to create transfer request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating transfer request:', error)
      toast({
        title: "Error",
        description: "Failed to create transfer request",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptTransfer = async (transferId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/transfer/update/${transferId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({
          action: "accept"
        }),
      })

      if (response.ok) {
        toast({
          title: "Transfer Accepted",
          description: "Transfer request has been accepted successfully",
        })

        // Refresh received transfers to get updated data
        fetchReceivedTransfers()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData.error || "Failed to accept transfer request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error accepting transfer:', error)
      toast({
        title: "Error",
        description: "Failed to accept transfer request",
        variant: "destructive",
      })
    }
  }

  const handleRejectTransfer = async (transferId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/transfer/update/${transferId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({
          action: "reject"
        }),
      })

      if (response.ok) {
        toast({
          title: "Transfer Rejected",
          description: "Transfer request has been rejected",
        })

        // Refresh received transfers to get updated data
        fetchReceivedTransfers()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData.error || "Failed to reject transfer request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error rejecting transfer:', error)
      toast({
        title: "Error",
        description: "Failed to reject transfer request",
        variant: "destructive",
      })
    }
  }



  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Transfer Management</h1>
          <p className="text-gray-600 mt-1">Manage stock transfers between branches</p>
        </div>

      </div>



      <Tabs defaultValue="products" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            Products
            <Badge variant="secondary" className="text-xs">
              {loading ? '...' : filteredProducts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="requests">
            Transfer Requests
          </TabsTrigger>
          <TabsTrigger value="receive">
            Receive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Products & Stock Levels ({totalCount})
              </CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, brand, model, or branch..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                  <span className="ml-2">Loading products...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {selectedCategory !== "all" ? 'No products found in selected category.' : 'No products available.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Product Name</th>
                        <th className="text-left p-3 font-semibold">Brand</th>
                        <th className="text-left p-3 font-semibold">Model</th>
                        <th className="text-left p-3 font-semibold">Category</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{product.name}</td>
                          <td className="p-3 text-gray-700">{product.brand}</td>
                          <td className="p-3 text-gray-600">{product.model}</td>
                          <td className="p-3 text-gray-700">{product.category}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Stock Details - {product.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 rounded">
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-sm text-gray-600">Brand: {product.brand}</p>
                                      <p className="text-sm text-gray-600">Model: {product.model}</p>
                                      <p className="text-sm text-gray-600">Category: {product.category}</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {product.quantities && product.quantities.length > 0 ? (
                                        product.quantities.map((quantity) => {
                                          const stockStatus = getStockStatus(quantity.qty)
                                          return (
                                            <div key={quantity.id} className={`border rounded-lg p-4 text-center shadow-sm ${quantity.branch_name === currentUserBranch
                                              ? 'bg-blue-50 border-blue-200'
                                              : 'bg-white'
                                              }`}>
                                              <div className="mb-2">
                                                <p className="font-semibold text-gray-900">
                                                  {quantity.branch_name}
                                                  {quantity.branch_name === currentUserBranch && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                      Current
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                              <Badge className={`${stockStatus.color} text-sm px-3 py-1`}>
                                                {quantity.qty} pcs
                                              </Badge>
                                              {quantity.qty === 0 && (
                                                <div className="flex items-center justify-center mt-2">
                                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                                  <span className="text-xs text-red-500 ml-1">Out of Stock</span>
                                                </div>
                                              )}
                                              {quantity.barcode && (
                                                <p className="text-xs text-gray-400 mt-1 font-mono">{quantity.barcode}</p>
                                              )}
                                              <p className="text-xs text-gray-400 mt-1">
                                                Updated: {new Date(quantity.updated_at).toLocaleDateString()}
                                              </p>
                                            </div>
                                          )
                                        })
                                      ) : (
                                        <div className="col-span-2 text-center py-8 text-gray-500">
                                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                          <p>No stock information available</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog
                                open={isRequestDialogOpen && selectedProduct?.id === product.id}
                                onOpenChange={setIsRequestDialogOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedProduct(product)}
                                    className="bg-primary hover:bg-primary/90"
                                  >
                                    <Send className="w-4 h-4 mr-1" />
                                    Transfer
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Create Transfer Request</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Product</Label>
                                      <div className="p-2 bg-gray-50 rounded border">
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-gray-600">{product.brand} - {product.model}</p>
                                        <p className="text-sm text-gray-500">{product.category}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <Label>From Branch *</Label>
                                      <Select value={fromBranch} onValueChange={setFromBranch}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select source branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {product.quantities && product.quantities
                                            .filter(qty => qty.qty > 0 && qty.branch_name !== currentUserBranch)
                                            .length > 0 ? (
                                            product.quantities
                                              .filter(qty => qty.qty > 0 && qty.branch_name !== currentUserBranch)
                                              .map((quantity) => (
                                                <SelectItem key={quantity.id} value={quantity.branch.toString()}>
                                                  {quantity.branch_name} ({quantity.qty} available)
                                                </SelectItem>
                                              ))
                                          ) : (
                                            <div className="p-2 text-center text-gray-500 text-sm">
                                              No other branches have stock available
                                            </div>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label>Quantity *</Label>
                                      <Input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          const maxQty = product.quantities?.find(q => q.branch.toString() === fromBranch)?.qty || 0
                                          if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= maxQty)) {
                                            setQuantity(value)
                                          }
                                        }}
                                        placeholder="Enter quantity"
                                        min="1"
                                        max={product.quantities?.find(q => q.branch.toString() === fromBranch)?.qty || 1}
                                        disabled={submitting}
                                      />
                                      {fromBranch && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          Available: {product.quantities?.find(q => q.branch.toString() === fromBranch)?.qty || 0}
                                        </p>
                                      )}
                                    </div>

                                    <div>
                                      <Label>Notes (Optional)</Label>
                                      <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any additional notes..."
                                        rows={3}
                                      />
                                    </div>

                                    <Button
                                      onClick={handleTransferRequest}
                                      className="w-full"
                                      disabled={submitting}
                                    >
                                      {submitting ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                          Sending...
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4 mr-2" />
                                          Send Request
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {!loading && totalCount > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} products
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={!prevPage || loading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!nextPage || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Outgoing Transfer Requests
              </CardTitle>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search requests..."
                  className="pl-10"
                  value={requestSearchTerm}
                  onChange={(e) => setRequestSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {transfersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                  <span className="ml-2">Loading transfers...</span>
                </div>
              ) : sentTransfers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No outgoing transfer requests found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Product</th>
                        <th className="text-left p-3 font-semibold">From → To</th>
                        <th className="text-left p-3 font-semibold">Quantity</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentTransfers.map((transfer) => (
                        <tr key={transfer.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{transfer.product}</p>
                              {transfer.brand && (
                                <p className="text-xs text-gray-500">{transfer.brand}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{transfer.from}</span>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{transfer.to}</span>
                            </div>
                          </td>
                          <td className="p-3">{transfer.quantity}</td>
                          <td className="p-3">
                            <Badge className={`${getStatusColor(transfer.status)}`}>
                              {getStatusIcon(transfer.status)}
                              {transfer.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">{formatDate(transfer.created_at)}</td>
                          <td className="p-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Transfer Request Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-3 bg-gray-50 rounded">
                                    <p className="font-medium">{transfer.product}</p>
                                    {transfer.brand && (
                                      <p className="text-sm text-gray-600">Brand: {transfer.brand}</p>
                                    )}
                                    {transfer.model && (
                                      <p className="text-sm text-gray-600">Model: {transfer.model}</p>
                                    )}
                                    {transfer.subbrand && (
                                      <p className="text-sm text-gray-600">Sub-brand: {transfer.subbrand}</p>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">From Branch</Label>
                                      <p className="text-sm">{transfer.from}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">To Branch</Label>
                                      <p className="text-sm">{transfer.to}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Quantity</Label>
                                      <Badge className="bg-blue-100 text-blue-800">{transfer.quantity} pcs</Badge>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      <Badge className={`${getStatusColor(transfer.status)}`}>
                                        {transfer.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Request Date</Label>
                                    <p className="text-sm text-gray-600">{formatDate(transfer.created_at)}</p>
                                  </div>
                                  {transfer.notes && (
                                    <div>
                                      <Label className="text-sm font-medium">Notes</Label>
                                      <p className="text-sm text-gray-600">{transfer.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Incoming Transfer Requests
              </CardTitle>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search incoming requests..."
                  className="pl-10"
                  value={requestSearchTerm}
                  onChange={(e) => setRequestSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {transfersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                  <span className="ml-2">Loading transfers...</span>
                </div>
              ) : receivedTransfers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No incoming transfer requests found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Product</th>
                        <th className="text-left p-3 font-semibold">Requested By</th>
                        <th className="text-left p-3 font-semibold">Quantity</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivedTransfers.map((transfer) => (
                        <tr key={transfer.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{transfer.product}</p>
                              {transfer.brand && (
                                <p className="text-xs text-gray-500">{transfer.brand}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{transfer.from}</Badge>
                          </td>
                          <td className="p-3">{transfer.quantity}</td>
                          <td className="p-3">
                            <Badge className={`${getStatusColor(transfer.status)}`}>
                              {getStatusIcon(transfer.status)}
                              {transfer.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">{formatDate(transfer.created_at)}</td>
                          <td className="p-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Incoming Transfer Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-3 bg-gray-50 rounded">
                                    <p className="font-medium">{transfer.product}</p>
                                    {transfer.brand && (
                                      <p className="text-sm text-gray-600">Brand: {transfer.brand}</p>
                                    )}
                                    {transfer.model && (
                                      <p className="text-sm text-gray-600">Model: {transfer.model}</p>
                                    )}
                                    {transfer.subbrand && (
                                      <p className="text-sm text-gray-600">Sub-brand: {transfer.subbrand}</p>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">From Branch</Label>
                                      <p className="text-sm">{transfer.from}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">To Branch</Label>
                                      <p className="text-sm">{transfer.to}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Quantity</Label>
                                      <Badge className="bg-blue-100 text-blue-800">{transfer.quantity} pcs</Badge>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      <Badge className={`${getStatusColor(transfer.status)}`}>
                                        {transfer.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Request Date</Label>
                                    <p className="text-sm text-gray-600">{formatDate(transfer.created_at)}</p>
                                  </div>
                                  {transfer.notes && (
                                    <div>
                                      <Label className="text-sm font-medium">Notes</Label>
                                      <p className="text-sm text-gray-600">{transfer.notes}</p>
                                    </div>
                                  )}
                                  {transfer.status === "pending" && (
                                    <div className="border-t pt-4 mt-4">
                                      <Label className="text-sm font-medium mb-3 block">Action Required</Label>
                                      <div className="flex gap-2">
                                        <Button
                                          className="bg-green-600 hover:bg-green-700 flex-1"
                                          onClick={() => handleAcceptTransfer(transfer.id)}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Accept
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          className="flex-1"
                                          onClick={() => handleRejectTransfer(transfer.id)}
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StockTransfer

"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Search, Eye, Edit, Trash2, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Separator } from "../ui/separator"
import { useToast } from "../../hooks/use-toast"
import { useNavigate } from "react-router-dom"
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

const currency = (n) => `₹${Number(n || 0).toLocaleString()}`

export default function ProductList() {
  const { toast } = useToast()
  const navigate = useNavigate()

  // State for API data
  const [products, setProducts] = useState([])
  const [branches, setBranches] = useState([])
  const [categories, setCategories] = useState([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPageUrl, setNextPageUrl] = useState(null)
  const [prevPageUrl, setPrevPageUrl] = useState(null)

  // Loading states
  const [productsLoading, setProductsLoading] = useState(true)
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [query, setQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [deleteProductId, setDeleteProductId] = useState(null)
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [variantSearch, setVariantSearch] = useState("")

  // Barcode scanner detection for search
  const [searchBarcodeBuffer, setSearchBarcodeBuffer] = useState("")
  const [lastSearchKeyTime, setLastSearchKeyTime] = useState(0)

  // Fetch products from API with pagination and filters
  const fetchProducts = useCallback(async (page = 1) => {
    try {
      const token = localStorage.getItem('access_token')
      setProductsLoading(true)

      // Build query params
      const params = new URLSearchParams()
      params.append('page', page)
      
      if (query.trim()) {
        params.append('search', query.trim())
      }
      
      if (selectedCategory !== "all") {
        // Find category ID from name
        const category = categories.find(c => c.name === selectedCategory)
        if (category) {
          params.append('category', category.id)
        }
      }
      
      if (selectedBranch !== "all") {
        // Find branch ID from name
        const branch = branches.find(b => b.name === selectedBranch)
        if (branch) {
          params.append('branch', branch.id)
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
        console.log('Products fetched:', data)
        setProducts(data.results || [])
        setTotalCount(data.count || 0)
        setNextPageUrl(data.next)
        setPrevPageUrl(data.previous)
        setCurrentPage(page)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        if (errorData.errors) {
          toast({
            title: "Error",
            description: errorData.message || "Invalid input data",
            variant: "destructive",
          })
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setProductsLoading(false)
    }
  }, [query, selectedCategory, selectedBranch, categories, branches])

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    // Only fetch if branches and categories are loaded
    if (!branchesLoading && !categoriesLoading) {
      fetchProducts(1)
    }
  }, [query, selectedCategory, selectedBranch, branchesLoading, categoriesLoading])

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem('access_token')
        setBranchesLoading(true)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/branch/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Branches fetched:', data)
          setBranches(data.results || data)
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } catch (error) {
        console.error('Error fetching branches:', error)
        toast({
          title: "Error",
          description: "Failed to load branches",
          variant: "destructive",
        })
      } finally {
        setBranchesLoading(false)
      }
    }

    fetchBranches()
  }, [])

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('access_token')
        setCategoriesLoading(true)

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
          console.log('Categories fetched:', data)
          setCategories(data.results || data)
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        })
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const filtered = useMemo(() => {
    // Since filtering is now done by API, just return products directly
    return products
  }, [products])

  const totalQty = (p) => p.quantities?.reduce((sum, q) => sum + Number(q.qty || 0), 0) || 0

  // Pagination handlers
  const handleNextPage = () => {
    if (nextPageUrl) {
      fetchProducts(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (prevPageUrl) {
      fetchProducts(currentPage - 1)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])



  const handleDelete = async (productId) => {
    console.log("[v0] Deleting product with ID:", productId)
    
    try {
      const token = localStorage.getItem('access_token')
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      
      const response = await fetch(`${baseUrl}/api/product/delete/${productId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      console.log('✅ Product deleted successfully')
      
      // Remove from local state
      setProducts((prev) => {
        const newProducts = prev.filter((p) => p.id !== productId)
        console.log("[v0] Products after deletion:", newProducts.length)
        return newProducts
      })
      
      // Update total count
      setTotalCount(prev => prev - 1)
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      
    } catch (error) {
      console.error('❌ Error deleting product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setDeleteProductId(null)
      console.log("[v0] Delete dialog closed")
    }
  }

  // Barcode scanner detection for search
  const handleSearchInput = useCallback((e) => {
    const currentTime = Date.now()
    const timeDiff = currentTime - lastSearchKeyTime

    // If time between keystrokes is very small (< 50ms), it's likely a barcode scanner
    if (timeDiff < 50 && searchBarcodeBuffer.length > 0) {
      setSearchBarcodeBuffer(prev => prev + e.target.value.slice(-1))
    } else {
      setSearchBarcodeBuffer(e.target.value.slice(-1))
    }

    setLastSearchKeyTime(currentTime)
    setSearchInput(e.target.value)

    // Auto-search if it looks like a complete barcode scan
    if (e.target.value.length >= 8 && timeDiff < 50) {
      // Immediate search for barcode
      setQuery(e.target.value)
      console.log('Barcode scanned for search:', e.target.value)
    }
  }, [lastSearchKeyTime, searchBarcodeBuffer])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <h1 className="text-2xl font-bold text-foreground text-balance">Product List</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
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
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.name}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, HSN, SKU, vendor... (Barcode scanner supported)"
              value={searchInput}
              onChange={handleSearchInput}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">
            Inventory Overview
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {totalCount > 0 && `(${totalCount} total products)`}
              {selectedCategory !== "all" && ` - ${selectedCategory}`}
              {selectedBranch !== "all" && ` - ${selectedBranch}`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-foreground">Product</th>
                  <th className="text-left p-3 font-medium text-foreground">Brand</th>
                  <th className="text-right p-3 font-medium text-foreground">
                    {selectedBranch === "all"
                      ? "Total Qty"
                      : `${selectedBranch} Qty`}
                  </th>
                  <th className="text-right p-3 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsLoading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted-foreground">
                      Loading products...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const qty = selectedBranch === "all"
                      ? totalQty(p)
                      : p.quantities?.find(q => q.branch_name === selectedBranch)?.qty || 0
                    const low = qty <= (p.min_qty_alert ?? 0)

                    return (
                      <tr key={p.id} className="border-b border-border align-top">
                        <td className="p-3">
                          <div className="font-medium text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Category: {p.category_name || "-"}
                          </div>
                        </td>
                        <td className="p-3 text-foreground">
                          <div className="font-medium">{p.brand_name || "-"}</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`font-semibold ${low ? "text-destructive" : "text-foreground"}`}>{qty}</span>
                            {low && <Badge variant="destructive">Low</Badge>}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (p.is_variant) {
                                  setSelectedVariantProduct(p)
                                } else {
                                  setSelectedProduct(p)
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/product/edit/${p.id}`)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog
                              open={deleteProductId === p.id}
                              onOpenChange={(open) => {
                                console.log("[v0] AlertDialog onOpenChange:", open, "for product:", p.id)
                                if (!open) {
                                  setDeleteProductId(null)
                                }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-white hover:bg-destructive/10 bg-transparent"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log("[v0] Delete button clicked for product:", p.id)
                                    setDeleteProductId(p.id)
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{p.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={() => {
                                      console.log("[v0] Delete cancelled")
                                      setDeleteProductId(null)
                                    }}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      console.log("[v0] Delete confirmed for product:", p.id)
                                      handleDelete(p.id)
                                    }}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(totalCount / 20)} ({totalCount} items)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!prevPageUrl || productsLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!nextPageUrl || productsLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {Math.ceil(totalCount / 20)} ({totalCount} items)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!prevPageUrl || productsLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!nextPageUrl || productsLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Variants Modal */}
      <Dialog open={!!selectedVariantProduct} onOpenChange={(open) => {
        if (!open) {
          setSelectedVariantProduct(null)
          setVariantSearch("")
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVariantProduct?.name} - Variants & Models
            </DialogTitle>
          </DialogHeader>
          
          {selectedVariantProduct && selectedVariantProduct.variants && (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by model or sub brand..."
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                />
              </div>

              {/* Filtered Variants */}
              {selectedVariantProduct.variants
                .filter(variant => {
                  if (!variantSearch.trim()) return true
                  const search = variantSearch.toLowerCase()
                  const subBrandMatch = (variant.subbrand_name || "").toLowerCase().includes(search)
                  const modelMatch = variant.models && Array.isArray(variant.models) && 
                    variant.models.some(m => (m.name || "").toLowerCase().includes(search))
                  return subBrandMatch || modelMatch
                })
                .map((variant, variantIdx) => (
                  <div key={variantIdx} className="space-y-3 p-4 rounded border border-border bg-card">
                    <div className="font-semibold text-foreground bg-primary/10 px-3 py-1.5 rounded w-fit">
                      {variant.subbrand_name || "Sub Brand"}
                    </div>
                    
                    {/* Models List */}
                    <div className="pl-2">
                      <div className="text-sm text-muted-foreground mb-2">Models:</div>
                      <div className="font-medium text-foreground">
                        {variant.models && Array.isArray(variant.models) && variant.models.length > 0 
                          ? variant.models.map(m => m.name || m).join(", ")
                          : "No models"
                        }
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                      <div>
                        <div className="text-xs text-muted-foreground">Selling Price</div>
                        <div className="font-medium text-foreground">₹{variant.selling_price || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Min Price</div>
                        <div className="font-medium text-foreground">₹{variant.minimum_selling_price || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Min Qty</div>
                        <div className="font-medium text-foreground">{variant.minimum_quantity || "-"}</div>
                      </div>
                    </div>
                  </div>
                ))
              }

              {/* No Results */}
              {variantSearch.trim() && selectedVariantProduct.variants.filter(variant => {
                const search = variantSearch.toLowerCase()
                const subBrandMatch = (variant.subbrand_name || "").toLowerCase().includes(search)
                const modelMatch = variant.models && Array.isArray(variant.models) && 
                  variant.models.some(m => (m.name || "").toLowerCase().includes(search))
                return subBrandMatch || modelMatch
              }).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No variants found for "{variantSearch}"
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Non-Variant Product Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct?.name} - Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium text-foreground">{selectedProduct.category_name || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Brand</div>
                  <div className="font-medium text-foreground">{selectedProduct.brand_name || "-"}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Selling Price</div>
                  <div className="font-medium text-foreground text-lg">₹{selectedProduct.selling_price || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Min Selling Price</div>
                  <div className="font-medium text-foreground text-lg">₹{selectedProduct.minimum_selling_price || "-"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Min Quantity</div>
                  <div className="font-medium text-foreground">{selectedProduct.minimum_quantity || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={selectedProduct.status === "active" ? "default" : "secondary"}>
                    {selectedProduct.status || "-"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
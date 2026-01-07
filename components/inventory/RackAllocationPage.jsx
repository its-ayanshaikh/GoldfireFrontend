"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Edit, Trash2, MapPin, Search } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { useToast } from "@/hooks/use-toast"

const RackAllocationPage = () => {
  const { toast } = useToast()
  const [racks, setRacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [allocating, setAllocating] = useState(false)

  // API data states
  const [stockItems, setStockItems] = useState([])
  const [categories, setCategories] = useState([])
  const [stockLoading, setStockLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [rackSearchTerm, setRackSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [allocationFilter, setAllocationFilter] = useState("unallocated") // Default to unallocated
  const [isRackDialogOpen, setIsRackDialogOpen] = useState(false)
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false)
  const [editingRack, setEditingRack] = useState(null)
  const [allocatingItem, setAllocatingItem] = useState(null)
  const [newRack, setNewRack] = useState({ name: "" })

  // API Functions
  const fetchRacks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/racks/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setRacks(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch racks",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching racks:', error)
      toast({
        title: "Error",
        description: "Failed to fetch racks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createRack = async (rackData) => {
    try {
      setSaving(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/racks/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(rackData),
      })

      if (response.ok) {
        const newRack = await response.json()
        setRacks([...racks, newRack])
        toast({
          title: "Success",
          description: "Rack created successfully",
        })
        return true
      } else {
        toast({
          title: "Error",
          description: "Failed to create rack",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('Error creating rack:', error)
      toast({
        title: "Error",
        description: "Failed to create rack",
        variant: "destructive",
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const updateRack = async (rackId, rackData) => {
    try {
      setSaving(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/racks/${rackId}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(rackData),
      })

      if (response.ok) {
        const updatedRack = await response.json()
        setRacks(racks.map(rack => rack.id === rackId ? updatedRack : rack))
        toast({
          title: "Success",
          description: "Rack updated successfully",
        })
        return true
      } else {
        toast({
          title: "Error",
          description: "Failed to update rack",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('Error updating rack:', error)
      toast({
        title: "Error",
        description: "Failed to update rack",
        variant: "destructive",
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const deleteRack = async (rackId) => {
    try {
      setDeleting(rackId)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/racks/${rackId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        setRacks(racks.filter(rack => rack.id !== rackId))
        // Move items from deleted rack to unallocated
        setStockItems(stockItems.map((item) => (item.rackId === rackId ? { ...item, rackId: null } : item)))
        toast({
          title: "Success",
          description: "Rack deleted successfully",
        })
        return true
      } else {
        toast({
          title: "Error",
          description: "Failed to delete rack",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('Error deleting rack:', error)
      toast({
        title: "Error",
        description: "Failed to delete rack",
        variant: "destructive",
      })
      return false
    } finally {
      setDeleting(null)
    }
  }

  // API Functions for Categories and Stock Items
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

  const fetchStockItems = async () => {
    try {
      setStockLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/products/list/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()

        // Transform API response to match component structure
        const transformedItems = []
        data.forEach(product => {
          product.quantities.forEach(quantity => {
            transformedItems.push({
              id: `${product.id}-${quantity.id}`, // Unique ID combining product and quantity
              productId: product.id,
              quantityId: quantity.id,
              name: product.name,
              brand: product.brand_name || "Unknown Brand", // Brand name from API
              category: product.category_name || "Unknown Category", // Category name from API
              quantity: quantity.qty,
              barcode: quantity.barcode,
              rackId: quantity.rack || null,
              rackName: quantity.rack_name || null,
              sellingPrice: parseFloat(product.selling_price),
              isWarrantyItem: product.is_warranty_item,
              warrantyPeriod: product.warranty_period,
              updatedAt: quantity.updated_at
            })
          })
        })

        setStockItems(transformedItems)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch stock items",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching stock items:', error)
      toast({
        title: "Error",
        description: "Failed to fetch stock items",
        variant: "destructive",
      })
    } finally {
      setStockLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchRacks()
    fetchCategories()
    fetchStockItems()
  }, [])

  // Helper functions - now using direct names from API
  const getCategoryName = (categoryName) => categoryName || "Unknown Category"
  const getBrandName = (brandName) => brandName || "Unknown Brand"

  // Filter stock items
  const filteredStockItems = stockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory

    // Filter by allocation status
    let matchesAllocation = true
    if (allocationFilter === "allocated") {
      matchesAllocation = item.rackId !== null
    } else if (allocationFilter === "unallocated") {
      matchesAllocation = item.rackId === null
    }
    // If "all", matchesAllocation remains true

    return matchesSearch && matchesCategory && matchesAllocation
  })

  const filteredRacks = racks.filter((rack) => {
    const matchesSearch = rack.name.toLowerCase().includes(rackSearchTerm.toLowerCase())
    return matchesSearch
  })

  // Get rack by ID
  const getRackById = (rackId) => racks.find((rack) => rack.id === rackId)

  // Handle rack operations
  const handleSaveRack = async () => {
    if (!newRack.name.trim()) {
      toast({
        title: "Error",
        description: "Rack name is required",
        variant: "destructive",
      })
      return
    }

    let success = false
    if (editingRack) {
      success = await updateRack(editingRack.id, newRack)
    } else {
      success = await createRack(newRack)
    }

    if (success) {
      setNewRack({ name: "" })
      setEditingRack(null)
      setIsRackDialogOpen(false)
    }
  }

  const handleDeleteRack = async (rackId) => {
    if (window.confirm('Are you sure you want to delete this rack? All items will be moved to unallocated.')) {
      await deleteRack(rackId)
    }
  }

  // API function for rack allocation
  const allocateRackAPI = async (productId, rackId) => {
    try {
      setAllocating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/allocate-rack/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({
          product_id: productId,
          rack_id: rackId
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rack allocated successfully",
        })
        // Refresh stock items to get updated data
        await fetchStockItems()
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData.message || "Failed to allocate rack",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('Error allocating rack:', error)
      toast({
        title: "Error",
        description: "Failed to allocate rack",
        variant: "destructive",
      })
      return false
    } finally {
      setAllocating(false)
    }
  }

  const handleAllocateStock = async (itemId, rackId) => {
    const item = stockItems.find(item => item.id === itemId)
    if (!item) {
      toast({
        title: "Error",
        description: "Item not found",
        variant: "destructive",
      })
      return
    }

    const success = await allocateRackAPI(item.productId, parseInt(rackId))
    if (success) {
      setIsAllocationDialogOpen(false)
      setAllocatingItem(null)
    }
  }

  const openEditRack = (rack) => {
    setEditingRack(rack)
    setNewRack({ name: rack.name })
    setIsRackDialogOpen(true)
  }

  const openAddRack = () => {
    setEditingRack(null)
    setNewRack({ name: "" })
    setIsRackDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rack Allocation</h1>
          <p className="text-gray-600 mt-1">Manage warehouse racks and allocate stock items</p>
        </div>
        <Button onClick={openAddRack} className="bg-black hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Add Rack
        </Button>
      </div>

      {/* Racks Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Warehouse Racks ({loading ? '...' : filteredRacks.length})
          </CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search racks by name..."
              value={rackSearchTerm}
              onChange={(e) => setRackSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              <span className="ml-2">Loading racks...</span>
            </div>
          ) : filteredRacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {rackSearchTerm ? 'No racks found matching your search.' : 'No racks available. Add your first rack to get started.'}
            </div>
          ) : (
            <>
              {/* Mobile and Tablet - Grid Layout */}
              <div className="block lg:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredRacks.map((rack) => (
                    <div
                      key={rack.id}
                      className="border rounded-lg p-4 bg-white shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">{rack.name}</h3>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditRack(rack)}
                            disabled={saving || deleting}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRack(rack.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={saving || deleting === rack.id}
                          >
                            {deleting === rack.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop - 3 Rows with Horizontal Scrolling */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <div className="grid grid-rows-3 grid-flow-col gap-4 min-w-max">
                    {filteredRacks.map((rack, index) => (
                      <div
                        key={rack.id}
                        className="border rounded-lg p-4 bg-white shadow-sm w-64"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-lg">{rack.name}</h3>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditRack(rack)}
                              disabled={saving || deleting}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRack(rack.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={saving || deleting === rack.id}
                            >
                              {deleting === rack.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stock Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Stock Allocation ({stockLoading ? '...' : filteredStockItems.length} items)
            </div>
            <div className="text-sm font-normal text-gray-600">
              Showing: {allocationFilter === "all" ? "All Items" : allocationFilter === "allocated" ? "Allocated Items" : "Unallocated Items"}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search stock items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {/* Get unique categories from stock items since we have category names directly */}
                {[...new Set(stockItems.map(item => item.category).filter(Boolean))].map((categoryName) => (
                  <SelectItem key={categoryName} value={categoryName}>
                    {categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={allocationFilter} onValueChange={setAllocationFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by allocation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="allocated">Allocated</SelectItem>
                <SelectItem value="unallocated">Unallocated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Items Table */}
          {stockLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              <span className="ml-2">Loading stock items...</span>
            </div>
          ) : filteredStockItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedCategory !== "all" || allocationFilter !== "all"
                ? 'No items found matching your filters.'
                : 'No stock items available.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Item Name</th>
                    <th className="text-left p-3 font-semibold">Brand</th>
                    <th className="text-left p-3 font-semibold">Category</th>
                    <th className="text-left p-3 font-semibold">Quantity</th>
                    <th className="text-left p-3 font-semibold">Current Rack</th>
                    <th className="text-left p-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockItems.map((item) => {
                    const currentRack = getRackById(item.rackId)

                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3 text-gray-600">
                          <Badge variant="outline">{getBrandName(item.brand)}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{getCategoryName(item.category)}</Badge>
                        </td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">
                          {item.rackName ? (
                            <Badge className="bg-green-100 text-green-800">
                              {item.rackName}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Unallocated</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAllocatingItem(item)
                              setIsAllocationDialogOpen(true)
                            }}
                            disabled={allocating || stockLoading}
                          >
                            {item.rackName ? "Reallocate" : "Allocate"}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rack Management Dialog */}
      <Dialog open={isRackDialogOpen} onOpenChange={setIsRackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRack ? "Edit Rack" : "Add New Rack"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rackName">Rack Name</Label>
              <Input
                id="rackName"
                placeholder="e.g., A1, B2, C3"
                value={newRack.name}
                onChange={(e) => setNewRack({ ...newRack, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !saving && newRack.name.trim()) {
                    e.preventDefault()
                    handleSaveRack()
                  }
                }}
                disabled={saving}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRackDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRack}
                disabled={saving || !newRack.name.trim()}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingRack ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  `${editingRack ? "Update" : "Add"} Rack`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Allocation Dialog */}
      <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Stock to Rack</DialogTitle>
          </DialogHeader>
          {allocatingItem && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold">{allocatingItem.name}</h3>
                <p className="text-sm text-gray-600">Model: {allocatingItem.model}</p>
                <p className="text-sm text-gray-600">Quantity: {allocatingItem.quantity}</p>
                <p className="text-sm text-gray-600">Category: {allocatingItem.category}</p>
              </div>
              <div>
                <Label htmlFor="rackSelect">Select Rack</Label>
                <Select
                  onValueChange={(value) => handleAllocateStock(allocatingItem.id, value)}
                  disabled={allocating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={allocating ? "Allocating..." : "Choose a rack"} />
                  </SelectTrigger>
                  <SelectContent>
                    {racks.map((rack) => (
                      <SelectItem key={rack.id} value={rack.id.toString()}>
                        {rack.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {allocating && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    Allocating rack...
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RackAllocationPage

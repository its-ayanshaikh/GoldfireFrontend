"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { useToast } from "../../hooks/use-toast"
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  Package, 
  Edit,
  Trash2,
  Hash,
  Percent,
  Calculator
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"

const HSNManagement = () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  const { toast } = useToast()
  const [currentView, setCurrentView] = useState("list") // list, create
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [deleteHSNId, setDeleteHSNId] = useState(null)
  const [editingHSN, setEditingHSN] = useState(null)
  const [editForm, setEditForm] = useState({
    code: "",
    description: "",
    category: "",
    cgst: "",
    sgst: "",
    igst: ""
  })

  // HSN data from API
  const [hsnCodes, setHsnCodes] = useState([])
  const [hsnLoading, setHsnLoading] = useState(true)
  const [hsnError, setHsnError] = useState(null)

  // Categories from API
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(null)

  const [newHSN, setNewHSN] = useState({
    code: "",
    description: "",
    category: "",
    cgst: "",
    sgst: "",
    igst: ""
  })

  // API Functions
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      setCategoriesError(null)
      const access_token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/product/categories/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      setCategoriesError(error.message)
      console.error('Error fetching categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchHSNCodes = async () => {
    try {
      setHsnLoading(true)
      setHsnError(null)
      const access_token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/product/hsn/list/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      if (!response.ok) throw new Error('Failed to fetch HSN codes')
      const data = await response.json()
      setHsnCodes(data)
    } catch (error) {
      setHsnError(error.message)
      console.error('Error fetching HSN codes:', error)
    } finally {
      setHsnLoading(false)
    }
  }

  const createHSN = async (hsnData) => {
    try {
      const access_token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/product/hsn/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(hsnData)
      })
      if (!response.ok) throw new Error('Failed to create HSN code')
      const newHSNCode = await response.json()
      setHsnCodes(prev => [...prev, newHSNCode])
      toast({
        title: "Success",
        description: "HSN code created successfully",
        variant: "default",
      })
      return newHSNCode
    } catch (error) {
      console.error('Error creating HSN code:', error)
      throw error
    }
  }

  const updateHSN = async (hsnId, hsnData) => {
    try {
      const access_token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/product/hsn/update/${hsnId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(hsnData)
      })
      if (!response.ok) throw new Error('Failed to update HSN code')
      const updatedHSN = await response.json()
      setHsnCodes(prev => prev.map(hsn => hsn.id === hsnId ? updatedHSN : hsn))
      toast({
        title: "Success",
        description: "HSN code updated successfully",
      })
      return updatedHSN
    } catch (error) {
      console.error('Error updating HSN code:', error)
      throw error
    }
  }

  const deleteHSN = async (hsnId) => {
    try {
      const access_token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/product/hsn/delete/${hsnId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      if (!response.ok) throw new Error('Failed to delete HSN code')
      setHsnCodes(prev => prev.filter(hsn => hsn.id !== hsnId))
      toast({
        title: "Success",
        description: "HSN code deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting HSN code:', error)
      throw error
    }
  }

  // Initial data loading
  useEffect(() => {
    fetchCategories()
    fetchHSNCodes()
  }, [])

  // Get unique categories from API data
  const uniqueCategories = [...new Set(hsnCodes.map(hsn => hsn.category_name || hsn.category))].sort()

  const filteredHSNCodes = hsnCodes.filter(hsn => {
    const matchesSearch = hsn.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hsn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hsn.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || hsn.category_name === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleCreateHSN = async () => {
    if (!newHSN.code || !newHSN.description || !newHSN.category || !newHSN.cgst || !newHSN.sgst) {
      alert("Please fill all required fields!")
      return
    }

    // Check if HSN code already exists
    // if (hsnCodes.some(hsn => hsn.code === newHSN.code)) {
    //   alert("HSN Code already exists!")
    //   return
    // }

    try {
      await createHSN(newHSN)
      setNewHSN({
        code: "",
        description: "",
        category: "",
        cgst: "",
        sgst: "",
        igst: ""
      })
      setCurrentView("list")
    } catch (error) {
      alert("Failed to create HSN code!")
    }
  }

  const handleDeleteHSN = async (id) => {
    try {
      await deleteHSN(id)
      setDeleteHSNId(null)
    } catch (error) {
      alert("Failed to delete HSN code!")
    }
  }

  const handleEditHSN = (hsn) => {
    setEditingHSN(hsn.id)
    const calculatedIgst = ((parseFloat(hsn.cgst) || 0) + (parseFloat(hsn.sgst) || 0)).toFixed(2)
    setEditForm({
      code: hsn.code,
      description: hsn.description,
      category: hsn.category,
      cgst: hsn.cgst.toString(),
      sgst: hsn.sgst.toString(),
      igst: calculatedIgst
    })
  }

  const handleUpdateHSN = async () => {
    if (!editForm.code || !editForm.description || !editForm.category || !editForm.cgst || !editForm.sgst) {
      alert("Please fill all required fields!")
      return
    }

    try {
      await updateHSN(editingHSN, editForm)
      setEditingHSN(null)
      setEditForm({
        code: "",
        description: "",
        category: "",
        cgst: "",
        sgst: "",
        igst: ""
      })
    } catch (error) {
      alert("Failed to update HSN code!")
    }
  }

  const handleCancelEdit = () => {
    setEditingHSN(null)
    setEditForm({
      code: "",
      description: "",
      category: "",
      cgst: "",
      sgst: "",
      igst: ""
    })
  }

  // Stats calculations
  const totalHSNCodes = hsnCodes.length
  const averageGST = hsnCodes.reduce((sum, hsn) => {
    const totalGST = parseFloat(hsn.cgst || 0) + parseFloat(hsn.sgst || 0) + parseFloat(hsn.igst || 0)
    return sum + totalGST
  }, 0) / hsnCodes.length || 0
  const categoriesCount = uniqueCategories.length

  if (editingHSN) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleCancelEdit}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Edit HSN Code</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit HSN - {editForm.code}</CardTitle>
            <CardDescription>Update HSN code details and GST rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">HSN Code *</Label>
                <Input
                  id="code"
                  value={editForm.code}
                  onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Enter 8-digit HSN code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter HSN description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cgst">CGST Rate (%) *</Label>
                <Input
                  id="cgst"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editForm.cgst}
                  onChange={(e) => {
                    const cgstValue = e.target.value
                    const sgstValue = editForm.sgst
                    const igstValue = ((parseFloat(cgstValue) || 0) + (parseFloat(sgstValue) || 0)).toFixed(2)
                    setEditForm(prev => ({ ...prev, cgst: cgstValue, igst: igstValue }))
                  }}
                  placeholder="Enter CGST rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sgst">SGST Rate (%) *</Label>
                <Input
                  id="sgst"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editForm.sgst}
                  onChange={(e) => {
                    const sgstValue = e.target.value
                    const cgstValue = editForm.cgst
                    const igstValue = ((parseFloat(cgstValue) || 0) + (parseFloat(sgstValue) || 0)).toFixed(2)
                    setEditForm(prev => ({ ...prev, sgst: sgstValue, igst: igstValue }))
                  }}
                  placeholder="Enter SGST rate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="igst">IGST Rate (%) (Auto-calculated)</Label>
              <Input
                id="igst"
                type="number"
                value={editForm.igst}
                readOnly
                className="bg-muted cursor-not-allowed"
                placeholder="Auto-calculated as CGST + SGST"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleUpdateHSN} className="flex-1">
                Update HSN Code
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === "create") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentView("list")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Add New HSN Code</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create HSN Code</CardTitle>
            <CardDescription>Add new HSN code with GST rates and category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">HSN Code *</Label>
                <Input
                  id="code"
                  value={newHSN.code}
                  onChange={(e) => setNewHSN(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Enter 8-digit HSN code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={newHSN.category} onValueChange={(value) => setNewHSN(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={newHSN.description}
                onChange={(e) => setNewHSN(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter HSN description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cgst">CGST Rate (%) *</Label>
                <Input
                  id="cgst"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newHSN.cgst}
                  onChange={(e) => {
                    const cgstValue = e.target.value
                    const sgstValue = newHSN.sgst
                    const igstValue = ((parseFloat(cgstValue) || 0) + (parseFloat(sgstValue) || 0)).toFixed(2)
                    setNewHSN(prev => ({ ...prev, cgst: cgstValue, igst: igstValue }))
                  }}
                  placeholder="Enter CGST rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sgst">SGST Rate (%) *</Label>
                <Input
                  id="sgst"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newHSN.sgst}
                  onChange={(e) => {
                    const sgstValue = e.target.value
                    const cgstValue = newHSN.cgst
                    const igstValue = ((parseFloat(cgstValue) || 0) + (parseFloat(sgstValue) || 0)).toFixed(2)
                    setNewHSN(prev => ({ ...prev, sgst: sgstValue, igst: igstValue }))
                  }}
                  placeholder="Enter SGST rate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="igst">IGST Rate (%) (Auto-calculated)</Label>
              <Input
                id="igst"
                type="number"
                value={newHSN.igst}
                readOnly
                className="bg-muted cursor-not-allowed"
                placeholder="Auto-calculated as CGST + SGST"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleCreateHSN} className="flex-1">
                Create HSN Code
              </Button>
              <Button variant="outline" onClick={() => setCurrentView("list")} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">HSN Code Management</h1>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search HSN codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesLoading ? (
                  <SelectItem value="loading-filter" disabled>Loading...</SelectItem>
                ) : uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setCurrentView("create")}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add HSN Code
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
              }}
              className="w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* HSN Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>HSN Codes</CardTitle>
          <CardDescription>Manage HSN codes with GST rates and categories</CardDescription>
        </CardHeader>
        <CardContent>
          {hsnLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading HSN codes...</p>
              </div>
            </div>
          ) : hsnError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading HSN codes: {hsnError}</p>
              <Button onClick={fetchHSNCodes} variant="outline">
                Retry
              </Button>
            </div>
          ) : filteredHSNCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No HSN codes found</p>
            </div>
          ) : (
            <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-foreground">HSN Code</th>
                  <th className="text-left p-4 font-medium text-foreground">Description</th>
                  <th className="text-left p-4 font-medium text-foreground">Category</th>
                  <th className="text-center p-4 font-medium text-foreground">CGST (%)</th>
                  <th className="text-center p-4 font-medium text-foreground">SGST (%)</th>
                  <th className="text-center p-4 font-medium text-foreground">IGST (%)</th>
                  <th className="text-center p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHSNCodes.map((hsn) => (
                  <tr key={hsn.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-medium">{hsn.code}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm max-w-xs truncate" title={hsn.description}>
                        {hsn.description}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{hsn.category_name || hsn.category}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-medium">{hsn.cgst}%</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-medium">{hsn.sgst}%</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-medium">{hsn.igst}%</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditHSN(hsn)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-white hover:bg-destructive/10"
                          onClick={() => setDeleteHSNId(hsn.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredHSNCodes.map((hsn) => (
              <Card key={hsn.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{hsn.code}</h3>
                        <Badge variant="secondary" className="mt-1">{hsn.category_name || hsn.category}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Description:</span>
                        <p className="font-medium text-sm mt-1">{hsn.description}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <span className="text-xs text-muted-foreground">CGST</span>
                          <p className="font-medium">{hsn.cgst}%</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">SGST</span>
                          <p className="font-medium">{hsn.sgst}%</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">IGST</span>
                          <p className="font-medium">{hsn.igst}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditHSN(hsn)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-white hover:bg-destructive/10 flex-1"
                        onClick={() => setDeleteHSNId(hsn.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredHSNCodes.length === 0 && (
            <div className="text-center py-8">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No HSN codes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== "all" 
                  ? "Try adjusting your search or filters to find HSN codes."
                  : "No HSN codes have been added yet. Create your first HSN code to get started."
                }
              </p>
              {(!searchTerm && categoryFilter === "all") && (
                <Button onClick={() => setCurrentView("create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First HSN Code
                </Button>
              )}
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteHSNId} onOpenChange={() => setDeleteHSNId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete HSN Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this HSN code? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteHSN(deleteHSNId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default HSNManagement
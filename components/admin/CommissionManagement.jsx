"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { X, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useToast } from "../../hooks/use-toast"

const CommissionManagement = () => {
  const { toast } = useToast()

  // State
  const [commissions, setCommissions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    commissionType: "percentage",
    commissionValue: "",
    selectedCategories: []
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    }
  }

  // Fetch commissions
  useEffect(() => {
    fetchCommissions()
    fetchCategories()
  }, [])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/commission/list/`,
        { method: "GET", headers: getAuthHeaders() }
      )
      if (response.ok) {
        const data = await response.json()
        setCommissions(Array.isArray(data) ? data : data.results || [])
      } else {
        throw new Error("Failed to fetch commissions")
      }
    } catch (error) {
      console.error("Error fetching commissions:", error)
      toast({ title: "Error", description: "Failed to load commissions", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/commission/categories/`,
        { method: "GET", headers: getAuthHeaders() }
      )
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : data.results || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleAddCategory = (categoryId) => {
    const category = categories.find(c => c.id === parseInt(categoryId))
    if (category && !formData.selectedCategories.find(c => c.id === category.id)) {
      setFormData(prev => ({
        ...prev,
        selectedCategories: [...prev.selectedCategories, category]
      }))
      // Reset select to default
      document.querySelector('[data-category-select]')?.click()
    }
  }

  const handleRemoveCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.filter(c => c.id !== categoryId)
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.commissionValue || formData.selectedCategories.length === 0) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" })
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        name: formData.name,
        commission_type: formData.commissionType,
        commission_value: parseFloat(formData.commissionValue),
        categories: formData.selectedCategories.map(c => c.id)
      }

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/commission/update/${editingId}/`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/commission/create/`

      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: editingId ? "Commission updated successfully" : "Commission created successfully",
          variant: "default"
        })
        setDialogOpen(false)
        resetForm()
        fetchCommissions()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save commission")
      }
    } catch (error) {
      console.error("Error saving commission:", error)
      toast({ title: "Error", description: error.message || "Failed to save commission", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this commission?")) return

    try {
      setDeletingId(id)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/commission/delete/${id}/`,
        { method: "POST", headers: getAuthHeaders() }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Commission deleted successfully",
          variant: "default"
        })
        fetchCommissions()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete commission")
      }
    } catch (error) {
      console.error("Error deleting commission:", error)
      toast({ title: "Error", description: error.message || "Failed to delete commission", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (commission) => {
    setEditingId(commission.id)
    setFormData({
      name: commission.name,
      commissionType: commission.commission_type,
      commissionValue: commission.commission_value.toString(),
      selectedCategories: commission.assigned_categories || []
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      commissionType: "percentage",
      commissionValue: "",
      selectedCategories: []
    })
    setEditingId(null)
  }

  const handleDialogClose = (open) => {
    setDialogOpen(open)
    if (!open) resetForm()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commission Management</h1>
          <p className="text-muted-foreground">Manage commission rules for product categories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={isSaving}>
              <Plus className="h-4 w-4" />
              Add Commission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Commission" : "Add New Commission"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label>Commission Name</Label>
                <Input
                  placeholder="e.g., Electronics Commission"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Commission Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.commissionType} onValueChange={(value) => setFormData(prev => ({ ...prev, commissionType: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder={formData.commissionType === "percentage" ? "e.g., 5" : "e.g., 100"}
                    value={formData.commissionValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Categories Selection */}
              <div>
                <Label>Select Categories</Label>
                <Select onValueChange={handleAddCategory} value="">
                  <SelectTrigger className="mt-1" data-category-select>
                    <SelectValue placeholder="Choose categories..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(category => !formData.selectedCategories.find(c => c.id === category.id))
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Categories */}
              {formData.selectedCategories.length > 0 && (
                <div>
                  <Label>Selected Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.selectedCategories.map((category) => (
                      <Badge key={category.id} variant="secondary" className="gap-2 px-3 py-1">
                        {category.name}
                        <button
                          onClick={() => handleRemoveCategory(category.id)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => handleDialogClose(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Create"} Commission
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Commissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Rules</CardTitle>
          <CardDescription>View and manage all commission configurations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No commissions configured yet
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((commission) => (
                <Card key={commission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{commission.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={commission.commission_type === "percentage" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                            {commission.commission_type === "percentage" ? `${commission.commission_value}%` : `₹${commission.commission_value}`}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {commission.commission_type === "percentage" ? "Percentage" : "Fixed Amount"}
                          </span>
                        </div>
                        {commission.assigned_categories && commission.assigned_categories.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-2">Categories:</p>
                            <div className="flex flex-wrap gap-2">
                              {commission.assigned_categories.map((category) => (
                                <Badge key={category.id} variant="outline">
                                  {category.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(commission)}
                          className="gap-2"
                          disabled={isSaving || deletingId === commission.id}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 gap-2"
                          onClick={() => handleDelete(commission.id)}
                          disabled={isSaving || deletingId === commission.id}
                        >
                          {deletingId === commission.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CommissionManagement

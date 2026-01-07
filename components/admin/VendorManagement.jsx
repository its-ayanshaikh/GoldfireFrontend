"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Building2 } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
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

const VendorManagement = () => {
  const { toast } = useToast()
  const [vendors, setVendors] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoadingVendors, setIsLoadingVendors] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    address: "",
    gst: "",
    status: "active",
  })

  // Fetch vendors from API
  const fetchVendors = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
      const apiUrl = `${API_BASE}/api/vendor/`
      
      console.log('Fetching vendors from:', apiUrl) // Debug log
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        credentials: 'omit',
      })

      console.log('Fetch vendors response status:', response.status) // Debug log

      if (response.ok) {
        const vendorsData = await response.json()
        console.log('Vendors fetched successfully:', vendorsData) // Debug log
        setVendors(vendorsData)
      } else {
        const errorData = await response.json()
        console.error('Error fetching vendors:', errorData)
        setError('Failed to load vendors')
        toast({
          title: "Error",
          description: "Failed to load vendors",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Network error fetching vendors:', error)
      setError('Network error. Please check your connection.')
      toast({
        title: "Network Error",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVendors(false)
    }
  }

  // Load vendors when component mounts
  useEffect(() => {
    fetchVendors()
  }, [])

  // Filter vendors based on search and filters
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.phone_number?.includes(searchTerm) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || vendor.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      phone_number: "",
      email: "",
      address: "",
      gst: "",
      status: "active",
    })
  }

  const openAddDialog = () => {
    resetForm()
    setError("")
    setIsAddDialogOpen(true)
  }

  const handleAddVendor = async () => {
    console.log('Add Vendor button clicked!') // Debug log
    console.log('Form data:', formData) // Debug log
    
    // Only validate required fields: name and contact_person
    if (formData.name && formData.contact_person) {
      setIsLoading(true)
      setError("")
      
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
        const apiUrl = `${API_BASE}/api/vendor/create/`
        
        console.log('Making API call to:', apiUrl) // Debug log
        console.log('Request payload:', formData) // Debug log
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(formData),
        })

        console.log('Response status:', response.status) // Debug log
        console.log('Response ok:', response.ok) // Debug log

        if (response.ok) {
          const newVendor = await response.json()
          console.log('Vendor created successfully:', newVendor) // Debug log
          // Refresh the vendors list from API to get latest data
          await fetchVendors()
          setIsAddDialogOpen(false)
          resetForm()
          toast({
            title: "Success",
            description: "Vendor created successfully",
            variant: "default",
          })
        } else {
          const errorData = await response.json()
          console.error('Error creating vendor:', errorData)
          setError(errorData.error || 'Failed to create vendor')
          toast({
            title: "Error",
            description: errorData.error || 'Failed to create vendor',
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Network error:', error)
        setError('Network error. Please check your connection.')
        toast({
          title: "Network Error",
          description: "Please check your connection and try again",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      console.log('Form validation failed. Missing required fields:')
      console.log('Name:', formData.name ? 'OK' : 'MISSING')
      console.log('Contact Person:', formData.contact_person ? 'OK' : 'MISSING')
      setError('Please fill in all required fields (Name and Contact Person)')
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name and Contact Person)",
        variant: "destructive",
      })
    }
  }

  const handleEditVendor = async () => {
    if (!formData.name || !formData.contact_person) {
      setError("Name and Contact Person are required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/update/${selectedVendor.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedVendor = await response.json()
        setVendors(vendors.map((vendor) => 
          vendor.id === selectedVendor.id ? updatedVendor : vendor
        ))
        setIsEditDialogOpen(false)
        setSelectedVendor(null)
        resetForm()
        toast({
          title: "Success",
          description: "Vendor updated successfully",
        })
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update vendor")
        toast({
          title: "Error",
          description: "Failed to update vendor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating vendor:", error)
      setError("Failed to update vendor. Please try again.")
      toast({
        title: "Error",
        description: "Failed to update vendor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return

    setIsLoading(true)
    
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/delete/${selectedVendor.id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setVendors(vendors.filter((vendor) => vendor.id !== selectedVendor.id))
        setIsDeleteDialogOpen(false)
        setSelectedVendor(null)
        toast({
          title: "Success",
          description: "Vendor deleted successfully",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete vendor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting vendor:", error)
      toast({
        title: "Error",
        description: "Failed to delete vendor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (vendor) => {
    setSelectedVendor(vendor)
    setFormData({
      name: vendor.name || "",
      contact_person: vendor.contact_person || "",
      phone_number: vendor.phone_number || "",
      email: vendor.email || "",
      address: vendor.address || "",
      gst: vendor.gst || "",
      status: vendor.status || "active",
    })
    setError("")
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (vendor) => {
    setSelectedVendor(vendor)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (status) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
    )
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
            <p className="text-muted-foreground">Manage your suppliers and vendors</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={openAddDialog}>
                <Plus size={16} />
                Add New Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription>Enter vendor details to add them to your supplier list</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter vendor name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    placeholder="Enter contact person name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number (Optional)</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210 (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="vendor@example.com (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number (Optional)</Label>
                  <Input
                    id="gst"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    placeholder="07AABCT1234C1Z5 (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter complete address (optional)"
                    rows={3}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm mt-4 p-2 bg-red-50 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleAddVendor} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Add Vendor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    placeholder="Search vendors by name, contact person, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendors List</CardTitle>
            <CardDescription>
              Total {filteredVendors.length} vendor{filteredVendors.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Vendor Name */}
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <Building2 size={16} className="text-muted-foreground" />
                          {vendor.name}
                        </div>
                        {getStatusBadge(vendor.status)}
                      </div>

                      {/* Contact Person */}
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <User size={14} />
                        {vendor.contact_person || "-"}
                      </div>

                      {/* Phone */}
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone size={14} />
                        {vendor.phone_number || "-"}
                      </div>

                      {/* Email */}
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail size={14} />
                        {vendor.email || "-"}
                      </div>

                      {/* Address */}
                      {vendor.address && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin size={14} />
                          <span className="truncate">{vendor.address}</span>
                        </div>
                      )}

                      {/* GST Number */}
                      {vendor.gst && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">GST:</span> {vendor.gst}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(vendor)} className="h-8 px-3">
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(vendor)}
                              className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{vendor.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteVendor}
                                className="bg-destructive text-white hover:bg-destructive/90"
                                disabled={isLoading}
                              >
                                {isLoading ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVendors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No vendors found matching your criteria</div>
            )}
          </CardContent>
        </Card>

        {/* Edit Vendor Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>Update vendor information</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Vendor Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter vendor name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-contact_person">Contact Person *</Label>
                <Input
                  id="edit-contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone_number">Phone Number (Optional)</Label>
                <Input
                  id="edit-phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210 (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address (Optional)</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="vendor@example.com (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-gst">GST Number (Optional)</Label>
                <Input
                  id="edit-gst"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  placeholder="07AABCT1234C1Z5 (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleEditVendor} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Vendor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default VendorManagement

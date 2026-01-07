"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
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
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Building2,
  Search,
  User,
  Key,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react"

const BranchManagement = () => {
  const { toast } = useToast()

  const [branches, setBranches] = useState([])

  const [posUsers, setPosUsers] = useState([
    {
      id: 1,
      branchId: 1,
      branchName: "Gold Fire Main Store",
      username: "mainstore_pos",
      password: "pos123",
      fullName: "Main Store POS User",
      email: "pos.main@goldfire.com",
      status: "active",
      createdAt: "2024-01-15",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPosUserDialogOpen, setIsPosUserDialogOpen] = useState(false)
  const [isUpdatePasswordDialogOpen, setIsUpdatePasswordDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [editingPosUser, setEditingPosUser] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    gst: "",
    latitude: "",
    longitude: "",
    status: "active",
  })

  const [posUserFormData, setPosUserFormData] = useState({
    branchId: "",
    username: "",
    password: "",
  })

  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  const [showCreatePosPassword, setShowCreatePosPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoadingBranches, setIsLoadingBranches] = useState(true)

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
      const apiUrl = `${API_BASE}/api/branch/`
      
      console.log('Fetching branches from:', apiUrl) // Debug log
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        credentials: 'omit',
      })

      console.log('Fetch branches response status:', response.status) // Debug log

      if (response.ok) {
        const branchesData = await response.json()
        console.log('Branches fetched successfully:', branchesData) // Debug log
        setBranches(branchesData)
      } else {
        const errorData = await response.json()
        console.error('Error fetching branches:', errorData)
        setError('Failed to load branches')
        toast({
          title: "Error",
          description: "Failed to load branches",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Network error fetching branches:', error)
      setError('Network error. Please check your connection.')
      toast({
        title: "Network Error",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoadingBranches(false)
    }
  }

  // Load branches when component mounts
  useEffect(() => {
    fetchBranches()
  }, [])

  const initializeForm = (branch = null) => {
    if (branch) {
      setFormData({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        gst: branch.gst || "",
        latitude: branch.latitude || "",
        longitude: branch.longitude || "",
        status: branch.status,
      })
    } else {
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        gst: "",
        latitude: "",
        longitude: "",
        status: "active",
      })
    }
  }

  const initializePosUserForm = () => {
    setPosUserFormData({
      branchId: "",
      username: "",
      password: "",
    })
  }

  const initializePasswordForm = () => {
    setPasswordFormData({
      newPassword: "",
      confirmPassword: "",
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePosUserInputChange = (e) => {
    const { name, value } = e.target
    setPosUserFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddBranch = async () => {
    console.log('Add Branch button clicked!') // Debug log
    console.log('Form data:', formData) // Debug log
    
    if (formData.name && formData.address && formData.phone) {
      setIsLoading(true)
      setError("")
      
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
        const apiUrl = `${API_BASE}/api/branch/create/`
        
        console.log('Making API call to:', apiUrl) // Debug log
        console.log('Request payload:', {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          gst: formData.gst,
          latitude: formData.latitude,
          longitude: formData.longitude,
          status: formData.status,
        }) // Debug log
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}` // Add auth token
          },
          body: JSON.stringify({
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            gst: formData.gst,
            latitude: formData.latitude,
            longitude: formData.longitude,
            status: formData.status,
          }),
        })

        console.log('Response status:', response.status) // Debug log
        console.log('Response ok:', response.ok) // Debug log

        if (response.ok) {
          const newBranch = await response.json()
          console.log('Branch created successfully:', newBranch) // Debug log
          // Refresh the branches list from API to get latest data
          await fetchBranches()
          setIsAddDialogOpen(false)
          initializeForm()
          toast({
            title: "Success",
            description: "Branch created successfully",
            variant: "default",
          })
        } else {
          const errorData = await response.json()
          console.error('Error creating branch:', errorData)
          setError(errorData.error || 'Failed to create branch')
          toast({
            title: "Error",
            description: errorData.error || 'Failed to create branch',
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
      console.log('Form validation failed. Missing fields:')
      console.log('Name:', formData.name ? 'OK' : 'MISSING')
      console.log('Address:', formData.address ? 'OK' : 'MISSING')
      console.log('Phone:', formData.phone ? 'OK' : 'MISSING')
      setError('Please fill in all required fields')
    }
  }

  const handleAddPosUser = async () => {
    console.log('Create POS User button clicked!') // Debug log
    console.log('POS User form data:', posUserFormData) // Debug log
    
    if (posUserFormData.branchId && posUserFormData.username && posUserFormData.password) {
      setIsLoading(true)
      setError("")
      
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
        const apiUrl = `${API_BASE}/api/branch/pos-user/create/`
        
        console.log('Making API call to:', apiUrl) // Debug log
        console.log('Request payload:', {
          branch_id: Number.parseInt(posUserFormData.branchId),
          username: posUserFormData.username,
          password: '***' // Hide password in logs
        }) // Debug log
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            branch_id: Number.parseInt(posUserFormData.branchId),
            username: posUserFormData.username,
            password: posUserFormData.password,
          }),
        })

        console.log('Response status:', response.status) // Debug log
        console.log('Response ok:', response.ok) // Debug log

        if (response.ok) {
          const responseData = await response.json()
          console.log('POS User created successfully:', responseData) // Debug log
          // Refresh the branches list to get updated pos_user_exists status
          await fetchBranches()
          setIsPosUserDialogOpen(false)
          initializePosUserForm()
          toast({
            title: "Success",
            description: "POS user created successfully",
            variant: "default",
          })
        } else {
          const errorData = await response.json()
          console.error('Error creating POS user:', errorData)
          setError(errorData.error || 'Failed to create POS user')
          toast({
            title: "Error",
            description: errorData.error || 'Failed to create POS user',
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
      console.log('POS User form validation failed. Missing fields:')
      console.log('Branch ID:', posUserFormData.branchId ? 'OK' : 'MISSING')
      console.log('Username:', posUserFormData.username ? 'OK' : 'MISSING')
      console.log('Password:', posUserFormData.password ? 'OK' : 'MISSING')
      setError('Please fill in all required fields')
    }
  }

  const handleUpdatePassword = async () => {
    console.log('Update Password button clicked!') // Debug log
    console.log('Editing POS user:', editingPosUser) // Debug log
    console.log('Password form data:', { 
      newPassword: passwordFormData.newPassword ? '***' : 'MISSING',
      confirmPassword: passwordFormData.confirmPassword ? '***' : 'MISSING'
    }) // Debug log
    
    if (
      passwordFormData.newPassword &&
      passwordFormData.confirmPassword &&
      passwordFormData.newPassword === passwordFormData.confirmPassword &&
      editingPosUser
    ) {
      setIsLoading(true)
      setError("")
      
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
        const apiUrl = `${API_BASE}/api/branch/pos-user/update-password/`
        
        console.log('Making API call to:', apiUrl) // Debug log
        console.log('Request payload:', {
          branch_id: editingPosUser.branchId,
          password: '***' // Hide password in logs
        }) // Debug log
        
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            branch_id: editingPosUser.branchId,
            password: passwordFormData.newPassword,
          }),
        })

        console.log('Response status:', response.status) // Debug log
        console.log('Response ok:', response.ok) // Debug log

        if (response.ok) {
          const responseData = await response.json()
          console.log('Password updated successfully:', responseData) // Debug log
          setIsUpdatePasswordDialogOpen(false)
          setEditingPosUser(null)
          initializePasswordForm()
          toast({
            title: "Success",
            description: "POS user password updated successfully",
            variant: "default",
          })
        } else {
          const errorData = await response.json()
          console.error('Error updating password:', errorData)
          setError(errorData.error || 'Failed to update password')
          toast({
            title: "Error",
            description: errorData.error || 'Failed to update password',
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
      console.log('Password update validation failed:')
      console.log('New Password:', passwordFormData.newPassword ? 'OK' : 'MISSING')
      console.log('Confirm Password:', passwordFormData.confirmPassword ? 'OK' : 'MISSING')
      console.log('Passwords Match:', passwordFormData.newPassword === passwordFormData.confirmPassword ? 'OK' : 'NO')
      console.log('Editing POS User:', editingPosUser ? 'OK' : 'MISSING')
      setError('Please fill in all required fields and ensure passwords match')
    }
  }

  const handleEditBranch = async () => {
    console.log('Edit Branch button clicked!') // Debug log
    console.log('Editing branch ID:', editingBranch?.id) // Debug log
    console.log('Form data:', formData) // Debug log
    
    if (formData.name && formData.address && formData.phone && editingBranch) {
      setIsLoading(true)
      setError("")
      
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
        const apiUrl = `${API_BASE}/api/branch/update/${editingBranch.id}/`
        
        console.log('Making API call to:', apiUrl) // Debug log
        console.log('Request payload:', {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          gst: formData.gst,
          latitude: formData.latitude,
          longitude: formData.longitude,
          status: formData.status,
        }) // Debug log
        
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            gst: formData.gst,
            latitude: formData.latitude,
            longitude: formData.longitude,
            status: formData.status,
          }),
        })

        console.log('Response status:', response.status) // Debug log
        console.log('Response ok:', response.ok) // Debug log

        if (response.ok) {
          const updatedBranch = await response.json()
          console.log('Branch updated successfully:', updatedBranch) // Debug log
          // Refresh the branches list from API to get latest data
          await fetchBranches()
          setIsEditDialogOpen(false)
          setEditingBranch(null)
          initializeForm()
          toast({
            title: "Success",
            description: "Branch updated successfully",
            variant: "default",
          })
        } else {
          const errorData = await response.json()
          console.error('Error updating branch:', errorData)
          setError(errorData.error || 'Failed to update branch')
          toast({
            title: "Error",
            description: errorData.error || 'Failed to update branch',
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
      console.log('Form validation failed. Missing fields or no branch selected')
      setError('Please fill in all required fields')
    }
  }

  const handleDeleteBranch = async (branchId) => {
    console.log('Delete Branch clicked for ID:', branchId) // Debug log
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
      const apiUrl = `${API_BASE}/api/branch/delete/${branchId}/`
      
      console.log('Making delete API call to:', apiUrl) // Debug log
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      console.log('Delete response status:', response.status) // Debug log
      console.log('Delete response ok:', response.ok) // Debug log

      if (response.ok || response.status === 204) {
        console.log('Branch deleted successfully') // Debug log
        // Refresh the branches list from API to get latest data
        await fetchBranches()
        toast({
          title: "Success",
          description: "Branch deleted successfully",
          variant: "default",
        })
      } else {
        const errorData = await response.json()
        console.error('Error deleting branch:', errorData)
        setError(errorData.error || 'Failed to delete branch')
        toast({
          title: "Error",
          description: errorData.error || 'Failed to delete branch',
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
    }
  }

  const handleDeletePosUser = (userId) => {
    setPosUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  const openEditDialog = (branch) => {
    setEditingBranch(branch)
    initializeForm(branch)
    setError("")
    setIsEditDialogOpen(true)
  }

  const openAddDialog = () => {
    initializeForm()
    setError("")
    setIsAddDialogOpen(true)
  }

  const openPosUserDialog = async () => {
    initializePosUserForm()
    setError("")
    
    // Refresh branches to ensure we have the latest data
    if (branches.length === 0 && !isLoadingBranches) {
      console.log('Refreshing branches for POS user dialog') // Debug log
      await fetchBranches()
    }
    
    setIsPosUserDialogOpen(true)
  }

  const openPasswordUpdateDialog = (posUser) => {
    setEditingPosUser(posUser)
    initializePasswordForm()
    setError("")
    setIsUpdatePasswordDialogOpen(true)
  }

  const getAvailableBranches = () => {
    // Use the new API response structure - branches without POS users
    return branches.filter((branch) => !branch.pos_user_exists && branch.status === "active")
  }

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
    )
  }

  const stats = {
    total: branches.length,
    active: branches.filter((b) => b.status === "active").length,
    inactive: branches.filter((b) => b.status === "inactive").length,
    posUsers: branches.filter((b) => b.pos_user_exists).length,
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Branch Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your Gold Fire branches and POS users</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isPosUserDialogOpen} onOpenChange={setIsPosUserDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openPosUserDialog}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <UserPlus size={16} />
                  Add POS User
                </Button>
              </DialogTrigger>
            </Dialog>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="flex items-center gap-2">
                  <Plus size={16} />
                  Add New Branch
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Branches</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Branches</CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Branches</CardTitle>
              <Building2 className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">POS Users</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.posUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Branch Cards */}
        {isLoadingBranches ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((branch) => {
            // Use the new API response structure for POS user info
            return (
              <Card key={branch.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{branch.name}</CardTitle>
                      <CardDescription className="mt-1">Branch ID: {branch.id}</CardDescription>
                    </div>
                    {getStatusBadge(branch.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{branch.address ? branch.address : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{branch.phone ? branch.phone : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{branch.email ? branch.email : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        POS User: {branch.pos_user_exists ? "Created" : "Not Created"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(branch.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(branch)}
                        className="flex items-center gap-1 flex-1 sm:flex-none justify-center"
                      >
                        <Edit size={14} />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-destructive hover:text-destructive bg-transparent flex-1 sm:flex-none justify-center"
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{branch.name}"? This will also delete the associated POS
                              user. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {branch.pos_user_exists && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPasswordUpdateDialog({ branchId: branch.id, branchName: branch.name })}
                          className="flex items-center gap-1 flex-1 sm:flex-none justify-center"
                        >
                          <Key size={14} />
                          Update Password
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          </div>
        )}

        {!isLoadingBranches && filteredBranches.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No branches found matching your search.</p>
            </CardContent>
          </Card>
        )}

        {/* POS User Creation Dialog */}
        <Dialog open={isPosUserDialogOpen} onOpenChange={setIsPosUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create POS User</DialogTitle>
              <DialogDescription>Create a POS user for branch operations</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="branchId">Select Branch</Label>
                <select
                  id="branchId"
                  name="branchId"
                  value={posUserFormData.branchId}
                  onChange={handlePosUserInputChange}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  required
                  disabled={isLoadingBranches}
                >
                  <option value="">
                    {isLoadingBranches ? "Loading branches..." : "Select Branch"}
                  </option>
                  {!isLoadingBranches && getAvailableBranches().map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {!isLoadingBranches && getAvailableBranches().length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No available branches. All active branches already have POS users.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={posUserFormData.username}
                  onChange={handlePosUserInputChange}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showCreatePosPassword ? "text" : "password"}
                    value={posUserFormData.password}
                    onChange={handlePosUserInputChange}
                    placeholder="Enter password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePosPassword((s) => !s)}
                    aria-label={showCreatePosPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showCreatePosPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm mt-4 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsPosUserDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddPosUser} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create POS User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Update Dialog */}
        <Dialog open={isUpdatePasswordDialogOpen} onOpenChange={setIsUpdatePasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Password</DialogTitle>
              <DialogDescription>
                Update password for {editingPosUser?.username} ({editingPosUser?.branchName})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((s) => !s)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordFormData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {passwordFormData.newPassword &&
                passwordFormData.confirmPassword &&
                passwordFormData.newPassword !== passwordFormData.confirmPassword && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}
            </div>
            {error && (
              <div className="text-red-500 text-sm mt-4 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsUpdatePasswordDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePassword}
                disabled={
                  isLoading ||
                  !passwordFormData.newPassword ||
                  !passwordFormData.confirmPassword ||
                  passwordFormData.newPassword !== passwordFormData.confirmPassword
                }
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Branch</DialogTitle>
              <DialogDescription>Update branch information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Branch Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter branch name"
                />
              </div>
              <div>
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
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email (Optional)</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="branch@goldfire.com (optional)"
                />
              </div>
              <div>
                <Label htmlFor="edit-gst">GST Number (Optional)</Label>
                <Input
                  id="edit-gst"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  placeholder="Enter GST number (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-latitude">Latitude</Label>
                  <Input
                    id="edit-latitude"
                    name="latitude"
                    type="text"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g. 28.6139"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-longitude">Longitude</Label>
                  <Input
                    id="edit-longitude"
                    name="longitude"
                    type="text"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g. 77.2090"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm mt-4 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleEditBranch} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Branch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Branch Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Branch</DialogTitle>
              <DialogDescription>Create a new Gold Fire branch location</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Branch Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter branch name"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="branch@goldfire.com (optional)"
                />
              </div>
              <div>
                <Label htmlFor="gst">GST Number (Optional)</Label>
                <Input
                  id="gst"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  placeholder="Enter GST number (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="text"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g. 28.6139"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="text"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g. 77.2090"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
              <Button onClick={handleAddBranch} disabled={isLoading}>
                {isLoading ? "Creating..." : "Add Branch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default BranchManagement

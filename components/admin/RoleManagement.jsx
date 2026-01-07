"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Users,
  Shield,
  Loader2
} from "lucide-react"
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
} from "../ui/alert-dialog"

const RoleManagement = () => {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState("list") // list, create
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteRoleId, setDeleteRoleId] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const [editForm, setEditForm] = useState({
    roleName: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Roles data from API
  const [roles, setRoles] = useState([])

  const [newRole, setNewRole] = useState({
    roleName: ""
  })

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/roles/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Roles fetched:', data)
        
        // Map API data to component format
        const mappedRoles = (data.results || data).map(role => ({
          id: role.id,
          roleName: role.name,
          usersCount: role.users_count || 0,
          createdDate: role.created_at ? role.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        }))
        
        setRoles(mappedRoles)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load roles on component mount
  useEffect(() => {
    fetchRoles()
  }, [])

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.roleName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleCreateRole = async () => {
    if (!newRole.roleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter role name!",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/roles/create/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newRole.roleName.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Role created:', data)
        
        toast({
          title: "Success",
          description: "Role created successfully!",
        })
        
        setNewRole({ roleName: "" })
        setCurrentView("list")
        
        // Refresh roles list
        await fetchRoles()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to create role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating role:', error)
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRole = async (id) => {
    const role = roles.find(r => r.id === id)
    if (role && role.usersCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `Cannot delete role "${role.roleName}" because it has ${role.usersCount} users assigned!`,
        variant: "destructive",
      })
      setDeleteRoleId(null)
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/roles/delete/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role deleted successfully!",
        })
        
        setDeleteRoleId(null)
        
        // Refresh roles list
        await fetchRoles()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setDeleteRoleId(null)
    }
  }

  const handleEditRole = (role) => {
    setEditingRole(role)
    setEditForm({
      roleName: role.roleName
    })
  }

  const handleSaveEdit = async () => {
    if (!editForm.roleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter role name!",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/roles/update/${editingRole.id}/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editForm.roleName.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Role updated:', data)
        
        toast({
          title: "Success",
          description: "Role updated successfully!",
        })
        
        setEditingRole(null)
        setEditForm({ roleName: "" })
        
        // Refresh roles list
        await fetchRoles()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to update role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingRole(null)
    setEditForm({ roleName: "" })
  }

  // Stats calculations
  const totalRoles = roles.length
  const totalUsers = roles.reduce((sum, role) => sum + role.usersCount, 0)
  const activeRoles = roles.filter(role => role.usersCount > 0).length

  if (editingRole) {
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
          <h1 className="text-2xl font-bold text-foreground">Edit Role</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Role - {editingRole.roleName}</CardTitle>
            <CardDescription>Update role name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={editForm.roleName}
                onChange={(e) => setEditForm(prev => ({ ...prev, roleName: e.target.value }))}
                placeholder="Enter role name"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSaveEdit} className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  "Update Role"
                )}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} className="flex-1" disabled={isSubmitting}>
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
          <h1 className="text-2xl font-bold text-foreground">Add New Role</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Role</CardTitle>
            <CardDescription>Add new user role to the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={newRole.roleName}
                onChange={(e) => setNewRole(prev => ({ ...prev, roleName: e.target.value }))}
                placeholder="Enter role name (e.g., Manager, Cashier, Sales Executive)"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleCreateRole} className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "Create Role"
                )}
              </Button>
              <Button variant="outline" onClick={() => setCurrentView("list")} className="flex-1" disabled={isSubmitting}>
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
        <h1 className="text-2xl font-bold text-foreground">Role Management</h1>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              onClick={() => setCurrentView("create")}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
            <Button 
              variant="outline"
              onClick={() => setSearchTerm("")}
              className="w-full sm:w-auto"
            >
              Clear Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
          <CardDescription>Manage system user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-foreground">Role Name</th>
                  <th className="text-center p-4 font-medium text-foreground">Users Count</th>
                  <th className="text-center p-4 font-medium text-foreground">Created Date</th>
                  <th className="text-center p-4 font-medium text-foreground">Status</th>
                  <th className="text-center p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading roles...
                      </div>
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted-foreground">
                      {searchTerm ? "No roles found matching your search" : "No roles created yet"}
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{role.roleName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary">{role.usersCount} users</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm">{role.createdDate}</span>
                    </td>
                    <td className="p-4 text-center">
                      {role.usersCount > 0 ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-white hover:bg-destructive/10"
                          onClick={() => setDeleteRoleId(role.id)}
                          disabled={role.usersCount > 0}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading roles...
                </div>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {searchTerm ? "No roles found matching your search" : "No roles created yet"}
              </div>
            ) : (
              filteredRoles.map((role) => (
              <Card key={role.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{role.roleName}</h3>
                      </div>
                      {role.usersCount > 0 ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Users:</span>
                        <Badge variant="secondary">{role.usersCount} users</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Created:</span>
                        <span className="text-sm">{role.createdDate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRole(role)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-white hover:bg-destructive/10 flex-1"
                        onClick={() => setDeleteRoleId(role.id)}
                        disabled={role.usersCount > 0}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>


        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
              {roles.find(r => r.id === deleteRoleId)?.usersCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This role has {roles.find(r => r.id === deleteRoleId)?.usersCount} users assigned!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteRole(deleteRoleId)}
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

export default RoleManagement
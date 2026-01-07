"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Users, Search, Edit, Trash2, MapPin, Briefcase, Phone, Mail, IndianRupee, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import AddEmployeeForm from "./AddEmployeeForm"
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

const EmployeeList = () => {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const debounceTimer = useRef(null)
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterRole, setFilterRole] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // API states
  const [employees, setEmployees] = useState([])
  const [branches, setBranches] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)

  // Debounce search term
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1)
    }, 500)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchTerm])

  // Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("access_token")

        // Build query parameters
        const params = new URLSearchParams()
        params.append("page", currentPage)

        if (debouncedSearchTerm) {
          params.append("search", debouncedSearchTerm)
        }

        if (filterBranch !== "all") {
          params.append("branch_id", filterBranch)
        }

        if (filterRole !== "all") {
          params.append("role_id", filterRole)
        }

        console.log('Fetching with params:', params.toString())
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/?${params.toString()}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: 'omit',
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Employees fetched:', data)

          // Map API data to component format
          const mappedEmployees = (data.results || data).map(employee => ({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            role: employee.role?.name || "Unknown Role",
            roleId: employee.role?.id,
            branch: employee.branch?.name || "Unknown Branch",
            branchId: employee.branch?.id,
            baseSalary: parseFloat(employee.base_salary || 0),
            joiningDate: employee.joining_date,
            workingHours: employee.working_hours,
            overtimeMultiplier: employee.overtime_multiplier,
            emergencyContact: employee.emergency_contact,
            address: employee.address,
            avatar: "/placeholder-user.jpg"
          }))

          setEmployees(mappedEmployees)

          // Extract pagination info
          if (data.count !== undefined) {
            setTotalCount(data.count)
          }
          if (data.next !== undefined) {
            setNextPage(data.next)
          }
          if (data.previous !== undefined) {
            setPreviousPage(data.previous)
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch employees",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error fetching employees:', error)
        toast({
          title: "Error",
          description: "Failed to fetch employees",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [debouncedSearchTerm, filterBranch, filterRole, currentPage])

  // Fetch branches and roles for filters
  const fetchBranchesAndRoles = async () => {
    try {
      const token = localStorage.getItem("access_token")

      // Fetch branches
      const branchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/branch/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: 'omit',
      })

      // Fetch roles
      const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/roles/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: 'omit',
      })

      if (branchResponse.ok && roleResponse.ok) {
        const branchData = await branchResponse.json()
        const roleData = await roleResponse.json()

        // Add "All" option to branches
        const branchOptions = [
          { id: "all", name: "All Branches" },
          ...(branchData.results || branchData).map(branch => ({
            id: branch.id.toString(),
            name: branch.name
          }))
        ]

        // Add "All" option to roles
        const roleOptions = [
          { id: "all", name: "All Roles" },
          ...(roleData.results || roleData).map(role => ({
            id: role.id.toString(),
            name: role.name
          }))
        ]

        setBranches(branchOptions)
        setRoles(roleOptions)
      }
    } catch (error) {
      console.error('Error fetching filter data:', error)
    }
  }

  // Load branches and roles on component mount
  useEffect(() => {
    fetchBranchesAndRoles()
  }, [])



  // Delete employee
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("access_token")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/delete/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Employee deleted successfully!",
        })

        setDeleteEmployeeId(null)

        // Refresh employees list by resetting page
        setCurrentPage(1)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete employee",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteEmployeeId(null)
    }
  }

  // Handle edit employee
  const handleEdit = (employee) => {
    setEditEmployee({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      branch_id: employee.branchId,
      role_id: employee.roleId,
      base_salary: employee.baseSalary,
      working_hours: employee.workingHours,
      overtime_multiplier: employee.overtimeMultiplier,
      joining_date: employee.joiningDate,
      emergency_contact: employee.emergencyContact
    })
    setShowAddForm(true)
  }

  const handleAddEmployee = () => {
    setEditEmployee(null)
    setShowAddForm(true)
  }

  const handleCloseAddForm = async () => {
    setShowAddForm(false)
    setEditEmployee(null)
    // Refresh employee list when form is closed
    await fetchEmployees()
  }

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 lg:p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleCloseAddForm}
              className="h-10 px-4 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 bg-white"
            >
              ← Back to Employee List
            </Button>
          </div>
          <AddEmployeeForm onClose={handleCloseAddForm} editEmployee={editEmployee} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Statistics */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
              <p className="text-gray-600 text-lg">Manage your workforce efficiently</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Search className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">Search & Filters</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Find employees quickly with advanced filters
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleAddEmployee}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 h-10 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                  Search Employee
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400 bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-filter" className="text-sm font-medium text-gray-700">
                  Branch
                </Label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400 bg-white">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id} className="hover:bg-gray-50">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
                  Role
                </Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400 bg-white">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id} className="hover:bg-gray-50">
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900">Employee Directory</CardTitle>
                <CardDescription className="text-sm text-gray-500 mt-1">
                  Showing {employees.length} of {totalCount} employees
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700 text-sm">Employee</th>
                    <th className="text-center p-4 font-medium text-gray-700 text-sm">Branch</th>
                    <th className="text-center p-4 font-medium text-gray-700 text-sm">Role</th>
                    <th className="text-right p-4 font-medium text-gray-700 text-sm">Base Salary</th>
                    <th className="text-center p-4 font-medium text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading employees...
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-muted-foreground">
                        {debouncedSearchTerm || filterBranch !== "all" || filterRole !== "all"
                          ? "No employees found matching your filters"
                          : "No employees found"}
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-gray-300">
                              <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                              <AvatarFallback className="bg-gray-200 text-black font-semibold">
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-black text-base">{employee.name}</div>
                              <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Mail className="h-3 w-3" />
                                {employee.email}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {employee.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="font-medium text-black flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-600" />
                              {employee.branch}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{employee.branchLocation}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Briefcase className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-black">{employee.role}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            <div className="font-bold text-black flex items-center gap-1 text-lg">
                              <IndianRupee className="h-4 w-4 text-gray-600" />
                              {employee.baseSalary.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Monthly</div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                              className="h-9 w-9 p-0 hover:bg-black hover:text-white transition-colors duration-200 border border-gray-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteEmployeeId === employee.id}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteEmployeeId(employee.id)}
                                  className="h-9 w-9 p-0 hover:bg-red-600 hover:text-white transition-colors duration-200 border border-gray-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the employee.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteEmployeeId(null)}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(employee.id)}>Delete</AlertDialogAction>
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

            {/* Pagination Controls */}
            {employees.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {employees.length} employees • Total {totalCount}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!previousPage}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="px-3 py-1 bg-white border border-gray-200 rounded text-sm font-medium">
                    {currentPage}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!nextPage}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EmployeeList

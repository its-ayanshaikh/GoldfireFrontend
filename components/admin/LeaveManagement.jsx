"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useToast } from "../../hooks/use-toast"
import {
  Calendar,
  Search,
  Filter,
  CalendarDays,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Edit,
  Pencil,
  Trash2,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Textarea } from "../ui/textarea"

const LeaveManagement = () => {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBranch, setFilterBranch] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(0) // Default to January
  const [selectedYear, setSelectedYear] = useState(2025) // Default to current year
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [leaveDates, setLeaveDates] = useState([])
  const [currentDate, setCurrentDate] = useState("")
  const [leaveReason, setLeaveReason] = useState("")
  const [expandedEmployee, setExpandedEmployee] = useState(null)

  // API states
  const [employees, setEmployees] = useState([])
  const [branches, setBranches] = useState([])
  const [availableYears, setAvailableYears] = useState([2023, 2024, 2025, 2026, 2027])
  const [leaves, setLeaves] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Edit leave states
  const [editingLeave, setEditingLeave] = useState(null)
  const [editReason, setEditReason] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Delete leave states
  const [deletingLeave, setDeletingLeave] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Employees data:', data)
        
        // Transform API data to match component structure
        const transformedEmployees = (data.results || data).map(employee => ({
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role?.name || 'N/A',
          branch: employee.branch?.name || 'N/A',
          avatar: employee.avatar || "/placeholder-user.jpg",
          phone: employee.phone,
          branchId: employee.branch?.id,
          roleId: employee.role?.id,
        }))
        
        setEmployees(transformedEmployees)
        
        // Extract unique branches from employees
        const uniqueBranches = [...new Set(transformedEmployees.map(emp => emp.branch))]
          .filter(branch => branch && branch !== 'N/A')
          .map((branchName, index) => ({ id: branchName.toLowerCase().replace(/\s+/g, "_"), name: branchName }))
        setBranches([{ id: "all", name: "All Branches" }, ...uniqueBranches])
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
        description: "Failed to load employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Get selected month's first date
  const getSelectedMonthFirstDate = () => {
    return new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]
  }

  // Get selected month's last date  
  const getSelectedMonthLastDate = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0]
  }

  // Get min date (today or selected month first date, whichever is later)
  const getMinDate = () => {
    const today = getTodayDate()
    const monthFirst = getSelectedMonthFirstDate()
    
    // If selected month is current month, use today's date as minimum
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    if (selectedMonth === currentMonth && selectedYear === currentYear) {
      return today
    } else {
      // For other months, use month first date or today (whichever is later)
      return today > monthFirst ? today : monthFirst
    }
  }

  // Check if selected month is current month or future
  const isValidMonth = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Only allow current month
    return selectedMonth === currentMonth && selectedYear === currentYear
  }

  // Fetch leaves from API
  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem("access_token")
      
      // Add query parameters for month and year
      const queryParams = new URLSearchParams({
        month: (selectedMonth + 1).toString(), // Convert 0-based month to 1-based
        year: selectedYear.toString()
      })
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/leaves/?${queryParams}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Leaves data:', data)
        
        // Transform API data to match component structure
        const transformedLeaves = (data.results || data).map(leave => ({
          id: leave.id,
          employeeId: leave.employee.id,
          employeeName: leave.employee.name,
          date: leave.leave_date,
          reason: leave.notes || "No reason provided",
          status: "approved", // Default status
          assignedDate: leave.leave_date,
          month: new Date(leave.leave_date).getMonth(),
          year: new Date(leave.leave_date).getFullYear(),
        }))
        
        setLeaves(transformedLeaves)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch leaves",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching leaves:', error)
      toast({
        title: "Error",
        description: "Failed to load leaves. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Load employees and set current date on component mount
  useEffect(() => {
    fetchEmployees()
    
    // Set current month and year after hydration
    const now = new Date()
    const currentYear = now.getFullYear()
    setSelectedMonth(now.getMonth())
    setSelectedYear(currentYear)
    
    // Set available years (2 years before, current, 2 years after)
    const years = Array.from({length: 5}, (_, i) => currentYear + i - 2)
    setAvailableYears(years)
  }, [])

  // Fetch leaves when month or year changes
  useEffect(() => {
    if (selectedMonth !== undefined && selectedYear !== undefined) {
      fetchLeaves()
      // Clear current date selection when month/year changes
      setCurrentDate("")
      setLeaveDates([])
    }
  }, [selectedMonth, selectedYear])

  const getEmployeeLeaves = (employeeId, month, year) => {
    // Since backend already filters by month/year, just filter by employeeId
    return leaves.filter((leave) => leave.employeeId === employeeId)
  }

  const getStatistics = () => {
    // Backend already filtered by selected month/year, so use all leaves
    return {
      totalLeaves: leaves.length,
      employeesWithLeaves: new Set(leaves.map((leave) => leave.employeeId)).size,
      pendingApprovals: 0, // All leaves are auto-approved in this implementation
    }
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const addLeaveDate = () => {
    if (!currentDate) return
    
    // Check if date is in the past
    const selectedDate = new Date(currentDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to compare only dates
    
    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot select past dates for leave.",
        variant: "destructive",
      })
      return
    }

    // Check if date is in selected month/year
    const selectedDateMonth = selectedDate.getMonth()
    const selectedDateYear = selectedDate.getFullYear()
    
    if (selectedDateMonth !== selectedMonth || selectedDateYear !== selectedYear) {
      toast({
        title: "Invalid Month",
        description: `Please select dates from ${monthNames[selectedMonth]} ${selectedYear} only.`,
        variant: "destructive",
      })
      return
    }
    
    if (leaveDates.length >= 4) {
      toast({
        title: "Limit Reached",
        description: "Maximum 4 leaves can be assigned at once.",
        variant: "destructive",
      })
      return
    }
    
    // This check is now handled in onChange, but keeping as backup
    if (leaveDates.includes(currentDate)) {
      toast({
        title: "Date Already Selected",
        description: "This date is already in your selection.",
        variant: "destructive",
      })
      return
    }
    
    setLeaveDates([...leaveDates, currentDate])
    setCurrentDate("")
  }

  const removeLeaveDate = (indexToRemove) => {
    setLeaveDates(leaveDates.filter((_, index) => index !== indexToRemove))
  }

  const handleAssignLeave = async () => {
    if (!selectedEmployee || leaveDates.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select employee and leave dates.",
        variant: "destructive",
      })
      return
    }

    const employee = employees.find((emp) => emp.id.toString() === selectedEmployee)
    if (!employee) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("access_token")
      
      // Create mode - create new leaves
        const leavePromises = leaveDates.map(async (date) => {
          const leaveData = {
            "employee_id": Number.parseInt(selectedEmployee),
            "leave_date": date,
            "notes": leaveReason || ""
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/leaves/create/`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(leaveData)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Failed to create leave for ${date}`)
          }

          return await response.json()
        })

        // Wait for all leave requests to complete
        await Promise.all(leavePromises)

        toast({
          title: "Success",
          description: `${leaveDates.length} leave(s) assigned to ${employee.name} successfully!`,
        })

      // Reset form and close dialog
      setSelectedEmployee("")
      setLeaveDates([])
      setCurrentDate("")
      setLeaveReason("")
      setEditingLeave(null) // Reset edit mode
      setIsDialogOpen(false)
      
      // Refresh leaves data
      await fetchLeaves()

    } catch (error) {
      console.error('Error assigning leaves:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to assign leaves. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit individual leave function
  const handleEditIndividualLeave = async () => {
    if (!editingLeave) {
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("access_token")
      
      const updateData = {
        "employee_id": editingLeave.employeeId,
        "leave_date": editingLeave.date,
        "notes": editReason.trim()
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/leaves/update/${editingLeave.id}/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update leave")
      }

      toast({
        title: "Success",
        description: "Leave updated successfully!",
      })

      // Reset edit state and close dialog
      setEditingLeave(null)
      setEditReason("")
      setIsEditDialogOpen(false)
      
      // Refresh leaves data
      await fetchLeaves()

    } catch (error) {
      console.error('Error updating leave:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update leave. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }  // Start editing individual leave
  const startEditLeave = (leave) => {
    // Find employee name for display
    const employee = employees.find(emp => emp.id === leave.employeeId)
    const leaveWithEmployeeName = {
      ...leave,
      employeeName: employee ? employee.name : 'Unknown Employee'
    }
    
    setEditingLeave(leaveWithEmployeeName)
    setEditReason(leave.notes || "")
    setIsEditDialogOpen(true)
  }



  // Show delete confirmation dialog
  const showDeleteConfirmation = (leave) => {
    // Find employee name for display
    const employee = employees.find(emp => emp.id === leave.employeeId)
    const leaveWithEmployeeName = {
      ...leave,
      employeeName: employee ? employee.name : 'Unknown Employee'
    }
    
    setDeletingLeave(leaveWithEmployeeName)
    setIsDeleteDialogOpen(true)
  }

  // Delete leave function
  const handleDeleteLeave = async () => {
    if (!deletingLeave) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/leaves/delete/${deletingLeave.id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete leave")
      }

      toast({
        title: "Success",
        description: "Leave deleted successfully!",
      })
      
      // Close dialog and reset state
      setIsDeleteDialogOpen(false)
      setDeletingLeave(null)
      
      // Refresh leaves data
      await fetchLeaves()

    } catch (error) {
      console.error('Error deleting leave:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete leave. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBranch = filterBranch === "all" || employee.branch?.toLowerCase().replace(/\s+/g, "_") === filterBranch
    return matchesSearch && matchesBranch
  })

  const stats = getStatistics()

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8" />
          Leave Management System
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Assign and manage monthly paid leaves for employees (4 leaves per month per employee)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Leaves</p>
                <p className="text-base sm:text-lg font-semibold">{stats.totalLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Employees with Leaves</p>
                <p className="text-base sm:text-lg font-semibold">{stats.employeesWithLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Monthly Allocation</p>
                <p className="text-base sm:text-lg font-semibold">4 per employee</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Leave Button */}
      <div className="mb-6">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            // Reset form when dialog closes
            setSelectedEmployee("")
            setLeaveDates([])
            setCurrentDate("")
            setLeaveReason("")
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Assign Multiple Leaves to Employee
            </Button>
          </DialogTrigger>
          <DialogContent className={`max-w-md ${editingLeave ? "border-blue-200" : ""}`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Assign Multiple Paid Leaves
              </DialogTitle>
              <DialogDescription>
                Assign up to 4 paid leaves at once to an employee
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Loading employees..." : "Choose employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading employees...
                        </div>
                      </SelectItem>
                    ) : employees.length === 0 ? (
                      <SelectItem value="no-employees" disabled>No employees found</SelectItem>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.name} - {employee.role} ({employee.branch})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Select Leave Dates (Max 4)</Label>
                {isValidMonth() ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select dates from {monthNames[selectedMonth]} {selectedYear} only. Past dates are disabled.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={currentDate}
                        onChange={(e) => {
                          const selectedDate = e.target.value
                          if (leaveDates.includes(selectedDate)) {
                            toast({
                              title: "Date Already Selected",
                              description: "This date is already in your selection. Please choose a different date.",
                              variant: "destructive",
                            })
                            setCurrentDate("")
                            return
                          }
                          setCurrentDate(selectedDate)
                        }}
                        min={getMinDate()}
                        max={getSelectedMonthLastDate()}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addLeaveDate}
                        disabled={leaveDates.length >= 4 || !currentDate || (currentDate && leaveDates.includes(currentDate))}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You can only assign leaves for the current month ({monthNames[new Date().getMonth()]} {new Date().getFullYear()}). 
                      Please select the current month to assign leaves.
                    </p>
                  </div>
                )}
                {leaveDates.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-sm text-muted-foreground">Selected Dates ({leaveDates.length}/4):</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {leaveDates.map((date, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                          <span>{new Date(date).toLocaleDateString("en-IN")}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto w-auto p-0 hover:bg-transparent"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeLeaveDate(index)
                            }}
                          >
                            <X className="h-3 w-3 cursor-pointer hover:text-red-500" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>Leave Reason (Optional)</Label>
                <Textarea
                  placeholder="Medical leave, personal work, family function, etc. (Optional)"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAssignLeave}
                className="w-full"
                disabled={!selectedEmployee || leaveDates.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning Leaves...
                  </div>
                ) : (
                  `Assign ${leaveDates.length} Leave${leaveDates.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>Filter employees by branch or search by name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Employee</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="branch-filter">Filter by Branch</Label>
              <Select value={filterBranch} onValueChange={setFilterBranch} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading branches..." : "Select branch"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading-branches" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading branches...
                      </div>
                    </SelectItem>
                  ) : (
                    branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month-filter">Select Month</Label>
              <Select
                value={`${selectedMonth}`}
                onValueChange={(value) => {
                  setSelectedMonth(Number.parseInt(value))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={`${index}`}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year-filter">Select Year</Label>
              <Select
                value={`${selectedYear}`}
                onValueChange={(value) => {
                  setSelectedYear(Number.parseInt(value))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={`${year}`}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Leave Overview */}
      <Card>
        <CardHeader>
          <CardTitle>
            Employee Leave Overview - {monthNames[selectedMonth]} {selectedYear}
          </CardTitle>
          <CardDescription>View and manage leaves for each employee (4 paid leaves per month)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading employees...
                </div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {searchTerm || filterBranch !== "all" ? "No employees found matching your filters" : "No employees found"}
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const employeeLeaves = getEmployeeLeaves(employee.id, selectedMonth, selectedYear)
                const remainingLeaves = 4 - employeeLeaves.length
                const isExpanded = expandedEmployee === employee.id

                return (
                <div key={employee.id} className="border border-border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                        <AvatarFallback>
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground text-sm sm:text-base">{employee.name}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {employee.role} - {employee.branch}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <div className="text-xs sm:text-sm font-medium">Leaves Used: {employeeLeaves.length}/4</div>
                        <div className="text-xs text-muted-foreground">Remaining: {remainingLeaves}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={remainingLeaves > 0 ? "default" : "secondary"}
                          className={`text-xs ${remainingLeaves > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {remainingLeaves > 0 ? "Available" : "Quota Full"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)}
                          className="px-2"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {isExpanded ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="font-medium mb-3">
                        Leave Details for {monthNames[selectedMonth]} {selectedYear}
                      </h4>
                      {employeeLeaves.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {employeeLeaves.map((leave) => (
                            <div key={leave.id} className="bg-muted rounded-lg p-3 hover:bg-muted/80 transition-all duration-200 border border-transparent hover:border-primary/20 hover:shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">{new Date(leave.date).toLocaleDateString("en-IN")}</div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditLeave(leave)}
                                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    title="Edit Leave"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => showDeleteConfirmation(leave)}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    title="Delete Leave"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{leave.status}</Badge>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mb-1">{leave.reason || "No reason provided"}</div>
                              <div className="text-xs text-muted-foreground">
                                Assigned: {new Date(leave.assignedDate).toLocaleDateString("en-IN")}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">No leaves assigned for this month</div>
                      )}
                    </div>
                  )}
                </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Individual Leave Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Leave Details
            </DialogTitle>
            <DialogDescription>
              Update leave date and reason
            </DialogDescription>
          </DialogHeader>
          
          {editingLeave && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium">Current Leave</div>
                <div className="text-sm text-muted-foreground">
                  Employee: {editingLeave.employeeName}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current Date: {new Date(editingLeave.date).toLocaleDateString("en-IN")}
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-date">Leave Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingLeave.date}
                  onChange={(e) => setEditingLeave({...editingLeave, date: e.target.value})}
                  min={getMinDate()}
                  max={getSelectedMonthLastDate()}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-reason">Leave Reason</Label>
                <Textarea
                  id="edit-reason"
                  placeholder="Enter reason for leave..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingLeave(null)
                    setEditReason("")
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditIndividualLeave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Update Leave
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Leave Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Leave
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The leave will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          
          {deletingLeave && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="text-sm font-medium text-red-800">Leave to be deleted:</div>
                <div className="text-sm text-red-700">
                  Employee: {deletingLeave.employeeName}
                </div>
                <div className="text-sm text-red-700">
                  Date: {new Date(deletingLeave.date).toLocaleDateString("en-IN")}
                </div>
                <div className="text-sm text-red-700">
                  Reason: {deletingLeave.notes || "No reason provided"}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setDeletingLeave(null)
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteLeave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Leave
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LeaveManagement

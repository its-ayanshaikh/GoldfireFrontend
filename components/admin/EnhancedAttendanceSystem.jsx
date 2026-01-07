"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Clock, Search, Filter, ArrowLeft, Calendar, CheckCircle, XCircle, AlertCircle, Plus, Coffee, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { useToast } from "../../hooks/use-toast"

const EnhancedAttendanceSystem = () => {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const debounceTimer = useRef(null)
  const [filterBranch, setFilterBranch] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isClient, setIsClient] = useState(false)
  const [isAddBreakDialogOpen, setIsAddBreakDialogOpen] = useState(false)
  const [selectedDateForBreak, setSelectedDateForBreak] = useState("")
  const [breakForm, setBreakForm] = useState({
    startTime: "",
    endTime: "",
    reason: "",
    notes: ""
  })
  const [employeeBreaks, setEmployeeBreaks] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)

  // Edit attendance state
  const [editingAttendance, setEditingAttendance] = useState(null)
  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    breakMinutes: 0
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // API states
  const [employees, setEmployees] = useState([])
  const [branches, setBranches] = useState([{ id: "all", name: "All Branches" }])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState(null)

  // API function to fetch employees with pagination
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("access_token")

        if (!token) {
          throw new Error('No authentication token found')
        }

        // Build query parameters
        const params = new URLSearchParams()
        params.append("page", currentPage)

        if (debouncedSearchTerm) {
          params.append("search", debouncedSearchTerm)
        }

        if (filterBranch !== "all") {
          params.append("branch", filterBranch)
        }

        console.log('Fetching with params:', params.toString())
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/?${params.toString()}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('API Response:', data)
        console.log('Filter Branch:', filterBranch)
        // Handle both array and paginated responses
        let employeeList = []
        if (Array.isArray(data)) {
          employeeList = data
        } else if (data.results) {
          employeeList = data.results
        } else if (data.data) {
          employeeList = data.data
        }

        // Transform API data to component format
        const transformedData = employeeList.map(employee => ({
          id: employee.id,
          employeeId: employee.id,
          name: employee.name,
          role: employee.role?.name || 'Employee',
          branch: employee.branch?.name || 'N/A',
          branchId: employee.branch?.id || null,
          avatar: employee.profile_picture || "/placeholder-user.jpg",
          baseSalary: parseFloat(employee.base_salary || 0),
          phone: employee.phone,
          email: employee.email,
          joiningDate: employee.joining_date,
          status: employee.status
        }))

        setEmployees(transformedData)

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

      } catch (error) {
        console.error('Error fetching employees:', error)
        setError(error.message)
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [debouncedSearchTerm, filterBranch, currentPage])

  // API function to fetch branches
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("access_token")

      if (!token) {
        console.log('No token found, using default branches')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/branch/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Transform API data for dropdown
      const transformedBranches = [
        { id: "all", name: "All Branches" },
        ...data.map(branch => ({
          id: branch.id,
          name: branch.name
        }))
      ]

      setBranches(transformedBranches)

    } catch (error) {
      console.error('Error fetching branches:', error)
      // Keep default branches on error
    }
  }

  // Load branches on component mount
  useEffect(() => {
    fetchBranches()
  }, [])

  // API function to fetch employee attendance history
  const fetchEmployeeAttendance = async (employeeId, month = null, year = null) => {
    try {
      setAttendanceLoading(true)
      setAttendanceError(null)
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error('No authentication token found')
      }

      // Use selected month/year or default to current
      const targetMonth = month !== null ? month : selectedMonth
      const targetYear = year !== null ? year : selectedYear

      console.log(`Fetching attendance for employee ID: ${employeeId}, Month: ${targetMonth + 1}, Year: ${targetYear}`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/attendance/history/${employeeId}/?month=${targetMonth + 1}&year=${targetYear}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Check if data is array or object with array property
      let attendanceRecords = []
      if (Array.isArray(data)) {
        attendanceRecords = data
      } else if (data && Array.isArray(data.attendance)) {
        attendanceRecords = data.attendance
      } else if (data && Array.isArray(data.results)) {
        attendanceRecords = data.results
      } else {
        console.warn('Unexpected API response structure:', data)
        attendanceRecords = []
      }

      // Transform API data to component format
      const transformedAttendance = attendanceRecords.map(record => {
        // Extract time in HH:MM format from ISO string (backend already in IST)
        const extractTime = (isoString) => {
          if (!isoString) return null
          // Format: "2025-11-21T10:55:00Z" or "2025-11-21 10:55:00"
          const timePart = isoString.includes('T') ? isoString.split('T')[1] : isoString.split(' ')[1]
          return timePart ? timePart.substring(0, 5) : null // Get HH:MM
        }

        return {
          id: record.id,
          employee: record.employee,
          loginTime: extractTime(record.login_time),
          logoutTime: extractTime(record.logout_time),
          loginImage: record.login_image,
          logoutImage: record.logout_image,
          status: record.status,
          date: record.date,
          totalHours: record.total_hours || 0,
          overtimeHours: record.overtime_hours || 0,
          breakHours: record.break_hours || 0,
          originalLoginTime: record.login_time,
          originalLogoutTime: record.logout_time
        }
      })

      // Sort by date (newest first)
      const sortedAttendance = transformedAttendance.sort((a, b) => new Date(b.date) - new Date(a.date))
      setAttendanceHistory(sortedAttendance)

    } catch (error) {
      console.error('Error fetching employee attendance:', error)
      setAttendanceError(error.message)
      setAttendanceHistory([])
    } finally {
      setAttendanceLoading(false)
    }
  }

  // Handle employee selection and fetch attendance
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee)
    fetchEmployeeAttendance(employee.id, selectedMonth, selectedYear)
  }

  // Handle month selection change
  const handleMonthChange = (month) => {
    setSelectedMonth(month)
    if (selectedEmployee) {
      fetchEmployeeAttendance(selectedEmployee.id, month, selectedYear)
    }
  }

  // Handle year selection change
  const handleYearChange = (year) => {
    setSelectedYear(year)
    if (selectedEmployee) {
      fetchEmployeeAttendance(selectedEmployee.id, selectedMonth, year)
    }
  }

  // Generate year options (current year and previous year only)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    return [currentYear, currentYear - 1]
  }

  const handleEditAttendance = (day) => {
    console.log('Day object:', day)
    setEditingAttendance(day)
    // Convert break hours to minutes (backend sends break_hours)
    const breakMinutes = day.breakHours ? Math.round(parseFloat(day.breakHours) * 60) : 0
    setEditForm({
      checkIn: day.checkIn || '',
      checkOut: day.checkOut || '',
      breakMinutes: breakMinutes
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveAttendance = async () => {
    if (!selectedEmployee || !editingAttendance) return

    setIsSavingAttendance(true)
    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error('No authentication token found')

      // Use the full date from API (it's already in YYYY-MM-DD format)
      const formattedDate = editingAttendance.fullDate || editingAttendance.date

      console.log('Editing attendance:', editingAttendance)
      console.log('Formatted date:', formattedDate)

      // Format times (YYYY-MM-DD HH:MM:SS)
      const loginTime = editForm.checkIn ? `${formattedDate} ${editForm.checkIn}:00` : null
      const logoutTime = editForm.checkOut ? `${formattedDate} ${editForm.checkOut}:00` : null

      const payload = {
        employee_id: selectedEmployee.id,
        date: formattedDate,
        login_time: loginTime,
        logout_time: logoutTime,
        break_minutes: editForm.breakMinutes
      }

      console.log('Sending attendance update:', payload)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/attendance/update/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Refresh attendance data
      await fetchEmployeeAttendance(selectedEmployee.id, selectedMonth, selectedYear)
      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Attendance updated successfully!",
        variant: "default"
      })
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast({
        title: "Error",
        description: "Failed to update attendance: " + error.message,
        variant: "destructive"
      })
    } finally {
      setIsSavingAttendance(false)
    }
  }

  const handleAddBreak = () => {
    if (!selectedEmployee || !selectedDateForBreak || !breakForm.startTime || !breakForm.endTime || !breakForm.reason) {
      alert("Please fill all required fields")
      return
    }

    const breakKey = `${selectedEmployee.id}-${selectedYear}-${selectedMonth}-${selectedDateForBreak}`
    const newBreak = {
      id: Date.now(),
      employeeId: selectedEmployee.id,
      date: selectedDateForBreak,
      startTime: breakForm.startTime,
      endTime: breakForm.endTime,
      reason: breakForm.reason,
      notes: breakForm.notes,
      addedBy: "Admin",
      addedAt: new Date().toISOString()
    }

    setEmployeeBreaks(prev => ({
      ...prev,
      [breakKey]: [...(prev[breakKey] || []), newBreak]
    }))

    // Reset form
    setBreakForm({
      startTime: "",
      endTime: "",
      reason: "",
      notes: ""
    })
    setSelectedDateForBreak("")
    setIsAddBreakDialogOpen(false)
  }

  const getBreaksForDate = (employeeId, date) => {
    const breakKey = `${employeeId}-${selectedYear}-${selectedMonth}-${date}`
    return employeeBreaks[breakKey] || []
  }

  const calculateBreakDuration = (breaks) => {
    if (!breaks || breaks.length === 0) return 0

    let totalMinutes = 0
    breaks.forEach(breakItem => {
      const start = new Date(`2000-01-01 ${breakItem.startTime}`)
      const end = new Date(`2000-01-01 ${breakItem.endTime}`)
      const diffMinutes = (end - start) / (1000 * 60)
      totalMinutes += diffMinutes
    })

    return Math.round(totalMinutes / 60 * 10) / 10 // Convert to hours with 1 decimal
  }

  const getAttendanceForMonth = (employeeId, month, year) => {
    const attendance = []
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0) // Last day of month

    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(year, month, day)

      // Skip Sundays (day 0) - mark as holiday
      if (date.getDay() === 0) {
        attendance.push({
          date: day,
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          status: "holiday",
          checkIn: null,
          checkOut: null,
          workingHours: 0,
          overtimeHours: 0,
          notes: "Sunday - Weekly Off",
          breaks: []
        })
        continue
      }

      // Deterministic attendance generation for demo (to avoid hydration mismatch)
      const seed = employeeId * 1000 + year * 100 + month * 10 + day
      const pseudoRandom1 = ((seed * 9301 + 49297) % 233280) / 233280
      const pseudoRandom2 = ((seed * 9307 + 49299) % 233281) / 233281
      const pseudoRandom3 = ((seed * 9311 + 49301) % 233282) / 233282
      const pseudoRandom4 = ((seed * 9313 + 49303) % 233283) / 233283

      const isPresent = pseudoRandom1 > 0.2 // 80% attendance rate
      const isHalfDay = pseudoRandom2 > 0.9 // 10% half day rate
      const isLate = pseudoRandom3 > 0.8 // 20% late arrival rate

      if (isPresent) {
        const checkInHour = isLate ? Math.floor(pseudoRandom4 * 2) + 9 : 9 // 9 AM or later if late
        const checkInMinute = Math.floor(pseudoRandom1 * 60)

        // Sometimes overtime - random checkout between 18-22 hours
        const hasOvertime = pseudoRandom2 > 0.85 && !isHalfDay // 15% chance of overtime, no overtime on half day
        const checkOutHour = isHalfDay ? 13 : hasOvertime ? Math.floor(pseudoRandom3 * 4) + 19 : 18 // 7 PM to 10 PM for overtime
        const checkOutMinute = hasOvertime ? Math.floor(pseudoRandom4 * 60) : 0

        const workHours = isHalfDay ? 4 : 9
        const overtimeHours = hasOvertime ? (checkOutHour - 18) + (checkOutMinute / 60) : 0

        const dayBreaks = getBreaksForDate(employeeId, day)
        const breakDuration = calculateBreakDuration(dayBreaks)

        attendance.push({
          date: day,
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          status: isHalfDay ? "half-day" : isLate ? "late" : "present",
          checkIn: `${checkInHour.toString().padStart(2, "0")}:${checkInMinute.toString().padStart(2, "0")}`,
          checkOut: `${checkOutHour.toString().padStart(2, "0")}:${checkOutMinute.toString().padStart(2, "0")}`,
          workingHours: workHours,
          overtimeHours: Math.round(overtimeHours * 10) / 10, // Round to 1 decimal
          breaks: dayBreaks,
          breakDuration: breakDuration,
          notes: isLate ? "Late arrival" : isHalfDay ? "Half day" : hasOvertime ? "Overtime worked" : "",
        })
      } else {
        attendance.push({
          date: day,
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          status: "absent",
          checkIn: null,
          checkOut: null,
          workingHours: 0,
          overtimeHours: 0,
          breaks: [],
          breakDuration: 0,
          notes: "Absent",
        })
      }
    }

    return attendance
  }

  const months = [
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

  // Backend already filters, just use employees directly
  const filteredEmployees = employees

  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>
      case "half-day":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Half Day</Badge>
      case "holiday":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Holiday</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (!selectedEmployee) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Attendance Management
          </h1>
          <p className="text-muted-foreground">Select an employee to view their monthly attendance details</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Search Employee</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="branch-filter">Filter by Branch</Label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>Click on an employee to view their attendance details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading employees...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-red-500">
                    <p className="font-medium">Error Loading Employees</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button
                      onClick={fetchEmployees}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No employees found</p>
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                          <AvatarFallback>
                            {employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.role}</div>
                          <div className="text-sm text-muted-foreground">{employee.branch}</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                          <div>Salary: ₹{employee.baseSalary.toLocaleString()}</div>
                          <div>Phone: {employee.phone}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use API data instead of generated data
  const monthlyAttendance = isClient && attendanceHistory.length > 0
    ? attendanceHistory.map(record => {
      const dateObj = new Date(record.date)
      return {
        date: dateObj.getDate(),
        fullDate: record.date, // Store full date string (YYYY-MM-DD)
        day: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        status: record.status,
        checkIn: record.loginTime,
        checkOut: record.logoutTime,
        workingHours: record.totalHours,
        overtimeHours: record.overtimeHours,
        breakHours: record.breakHours,
        isLate: false, // Can be calculated based on expected check-in time
        hasBreak: false,
        breaks: []
      }
    })
    : []
  const presentDays = isClient ? monthlyAttendance.filter((day) => day.status === "present").length : 0
  const absentDays = isClient ? monthlyAttendance.filter((day) => day.status === "absent").length : 0
  const halfDays = isClient ? monthlyAttendance.filter((day) => day.status === "half-day").length : 0
  const holidays = isClient ? monthlyAttendance.filter((day) => day.status === "holiday").length : 0
  const totalWorkingHours = isClient ? monthlyAttendance.reduce((sum, day) => {
    const hours = typeof day.workingHours === 'number' ? day.workingHours : 0
    return sum + hours
  }, 0) : 0
  const totalOvertimeHours = isClient ? monthlyAttendance.reduce((sum, day) => sum + (day.overtimeHours || 0), 0) : 0

  return (
    <div className="p-6">
      {!selectedEmployee ? (
        // Employee List View
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enhanced Attendance System</h1>
              <p className="text-gray-600">Select an employee to view detailed attendance</p>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Search Employee</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Branch</Label>
                  <Select value={filterBranch} onValueChange={(value) => {
                    setFilterBranch(value)
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee List */}
          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
              <CardDescription>Showing {filteredEmployees.length} of {totalCount} employees</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading employees...</p>
                  </div>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No employees found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEmployees.map((employee) => (
                    <Card key={employee.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleEmployeeSelect(employee)}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{employee.name}</h3>
                            <p className="text-sm text-gray-500">{employee.role}</p>
                            <p className="text-xs text-gray-400">{employee.branch}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filteredEmployees.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredEmployees.length} employees • Total {totalCount} • Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* First Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3"
                    >
                      First
                    </Button>

                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!previousPage}
                      className="px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="px-3 min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    ))}

                    {/* Next Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!nextPage}
                      className="px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Last Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Employee Detail View
        <>
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" onClick={() => setSelectedEmployee(null)} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Employee List
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Monthly Attendance - {selectedEmployee.name}
            </h1>
            <p className="text-muted-foreground">
              {selectedEmployee.role} • {selectedEmployee.branch}
            </p>
          </div>

          {/* Month/Year Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Month & Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Month</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => handleMonthChange(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => handleYearChange(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-lg font-semibold">{presentDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-lg font-semibold">{absentDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Half Days</p>
                    <p className="text-lg font-semibold">{halfDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Holidays</p>
                    <p className="text-lg font-semibold">{holidays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-lg font-semibold">{(totalWorkingHours || 0).toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Overtime Hours</p>
                    <p className="text-lg font-semibold text-blue-600">+{parseFloat(totalOvertimeHours || 0).toFixed(2)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {months[selectedMonth]} {selectedYear} Attendance
              </CardTitle>
              <CardDescription>
                Daily check-in and check-out details. Click "Add Break" to record unauthorized breaks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-foreground">Date</th>
                      <th className="text-center p-4 font-medium text-foreground">Day</th>
                      <th className="text-center p-4 font-medium text-foreground">Status</th>
                      <th className="text-center p-4 font-medium text-foreground">Check In</th>
                      <th className="text-center p-4 font-medium text-foreground">Check Out</th>
                      <th className="text-center p-4 font-medium text-foreground">Total Hours</th>
                      <th className="text-center p-4 font-medium text-foreground">Overtime</th>
                      <th className="text-center p-4 font-medium text-foreground">Break Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isClient ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-muted-foreground">
                          Loading attendance data...
                        </td>
                      </tr>
                    ) : attendanceLoading ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                            <span className="text-muted-foreground">Fetching employee attendance...</span>
                          </div>
                        </td>
                      </tr>
                    ) : attendanceError ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center">
                          <div className="text-red-500">
                            <p className="font-medium">Error Loading Attendance</p>
                            <p className="text-sm text-muted-foreground">{attendanceError}</p>
                            <Button
                              onClick={() => fetchEmployeeAttendance(selectedEmployee.id)}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              Try Again
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : monthlyAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-muted-foreground">
                          No attendance data found for this employee
                        </td>
                      </tr>
                    ) : (
                      monthlyAttendance.map((day) => (
                        <tr
                          key={day.date}
                          className="border-b border-border hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => handleEditAttendance(day)}
                        >
                          <td className="p-4">
                            <span className="font-medium">{day.date}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-sm">{day.day}</span>
                          </td>
                          <td className="p-4 text-center">{getStatusBadge(day.status)}</td>
                          <td className="p-4 text-center">
                            <span className="font-mono text-xs">
                              {day.checkIn || "Add"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-mono text-xs">
                              {day.checkOut || "Add"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-semibold">{day.workingHours > 0 ? `${day.workingHours}h` : "-"}</span>
                          </td>
                          <td className="p-4 text-center">
                            {day.overtimeHours > 0 ? (
                              <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-sm">
                                +{parseFloat(day.overtimeHours).toFixed(2)}h
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {day.breakHours > 0 ? (
                              <span className="font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-sm">
                                {parseFloat(day.breakHours).toFixed(2)}h
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Attendance Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Edit Attendance - {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription>
              Update check-in, check-out, and break time for {editingAttendance?.date}/{selectedMonth + 1}/{selectedYear}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCheckIn">Check In Time</Label>
                <Input
                  id="editCheckIn"
                  type="time"
                  value={editForm.checkIn}
                  onChange={(e) => setEditForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  placeholder="HH:MM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCheckOut">Check Out Time</Label>
                <Input
                  id="editCheckOut"
                  type="time"
                  value={editForm.checkOut}
                  onChange={(e) => setEditForm(prev => ({ ...prev, checkOut: e.target.value }))}
                  placeholder="HH:MM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Break Time (Minutes)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min="0"
                max="480"
                value={editForm.breakMinutes}
                onChange={(e) => setEditForm(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                placeholder="Enter break duration in minutes"
              />
              <p className="text-xs text-muted-foreground">
                {editForm.breakMinutes > 0 ? `${(editForm.breakMinutes / 60).toFixed(2)} hours` : 'No break'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSavingAttendance}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={isSavingAttendance}
            >
              {isSavingAttendance ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Break Dialog */}
      <Dialog open={isAddBreakDialogOpen} onOpenChange={setIsAddBreakDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Add Break - {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription>
              Add a break entry for {selectedMonth + 1}/{selectedDateForBreak}/{selectedYear}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={breakForm.startTime}
                  onChange={(e) => setBreakForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={breakForm.endTime}
                  onChange={(e) => setBreakForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select
                value={breakForm.reason}
                onValueChange={(value) => setBreakForm(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason for break" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unauthorized">Unauthorized Break</SelectItem>
                  <SelectItem value="personal">Personal Work</SelectItem>
                  <SelectItem value="extended_lunch">Extended Lunch</SelectItem>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details..."
                value={breakForm.notes}
                onChange={(e) => setBreakForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddBreakDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddBreak}>
              <Plus className="h-4 w-4 mr-2" />
              Add Break
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedAttendanceSystem

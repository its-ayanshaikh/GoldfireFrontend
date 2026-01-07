"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  Clock,
  ClockIcon as ClockIn,
  Clock1 as ClockOut,
  Search,
  Filter,
  MapPin,
  Timer,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const AttendanceSystem = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const debounceTimer = useRef(null)
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(1)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
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
  const [attendanceData, setAttendanceData] = useState([])
  const [branches, setBranches] = useState([{ id: "all", name: "All Branches" }])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)

  // API function to fetch employees with pagination
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        console.log('Starting fetchEmployees...')
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("access_token")
        console.log('Token found:', !!token)
        console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL)

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
          params.append("branch_id", filterBranch)
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
        console.log('Employees API Response:', data)

        // Handle both array and paginated responses
        let employeeList = []
        if (Array.isArray(data)) {
          employeeList = data
        } else if (data.results) {
          employeeList = data.results
        } else if (data.data) {
          employeeList = data.data
        }

        // Transform API data to attendance format
        const transformedData = employeeList.map(employee => ({
          id: employee.id,
          employeeId: employee.id,
          name: employee.name,
          role: employee.role?.name || 'Employee',
          branch: employee.branch?.name || 'N/A',
          avatar: employee.profile_picture || "/placeholder-user.jpg",
          checkInTime: null,
          checkOutTime: null,
          workingHours: 0,
          overtimeHours: 0,
          status: "absent",
          isLate: false,
          expectedCheckIn: "09:00:00",
          expectedCheckOut: "18:00:00",
          baseSalary: parseFloat(employee.base_salary || 0),
          dailySalary: Math.round((parseFloat(employee.base_salary || 0)) / 26),
          hourlySalary: Math.round((parseFloat(employee.base_salary || 0)) / 26 / 8),
          overtimeRate: Math.round((parseFloat(employee.base_salary || 0)) / 26 / 8 * 1.5),
          email: employee.email,
          phone: employee.phone,
          joining_date: employee.joining_date,
          status: employee.status
        }))

        setAttendanceData(transformedData)

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
        setAttendanceData([])
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [debouncedSearchTerm, filterBranch, currentPage])

  // API function to fetch branches
  const fetchBranches = async () => {
    try {
      console.log('Starting fetchBranches...')
      const token = localStorage.getItem("access_token")
      console.log('Branch API - Token found:', !!token)
      console.log('Branch API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL)

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
      console.log('Branches API Response:', data)

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

  // Load employees and branches on component mount
  useEffect(() => {
    console.log('AttendanceSystem component mounted, calling APIs...')
    fetchEmployees()
    fetchBranches()
  }, [])

  // Calculate working hours between two times
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0
    const checkInTime = new Date(`2024-01-01 ${checkIn}`)
    const checkOutTime = new Date(`2024-01-01 ${checkOut}`)
    const diffMs = checkOutTime - checkInTime
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
  }

  // Calculate overtime hours
  const calculateOvertimeHours = (workingHours, standardHours = 8) => {
    return workingHours > standardHours ? workingHours - standardHours : 0
  }

  // Calculate daily earnings
  const calculateDailyEarnings = (employee) => {
    const { workingHours, overtimeHours, dailySalary, overtimeRate } = employee
    const regularHours = workingHours - overtimeHours
    const regularEarnings = (regularHours / 8) * dailySalary
    const overtimeEarnings = overtimeHours * overtimeRate
    return Math.round(regularEarnings + overtimeEarnings)
  }

  // Handle check-in
  const handleCheckIn = (employeeId) => {
    const currentTimeStr = currentTime.toTimeString().split(" ")[0]
    setAttendanceData((prev) =>
      prev.map((emp) =>
        emp.employeeId === employeeId
          ? {
            ...emp,
            checkInTime: currentTimeStr,
            status: "present",
            isLate: currentTimeStr > emp.expectedCheckIn,
          }
          : emp,
      ),
    )
    console.log("[v0] Employee checked in:", employeeId, "at", currentTimeStr)
  }

  // Handle check-out
  const handleCheckOut = (employeeId) => {
    const currentTimeStr = currentTime.toTimeString().split(" ")[0]
    setAttendanceData((prev) =>
      prev.map((emp) => {
        if (emp.employeeId === employeeId && emp.checkInTime) {
          const workingHours = calculateWorkingHours(emp.checkInTime, currentTimeStr)
          const overtimeHours = calculateOvertimeHours(workingHours)
          return {
            ...emp,
            checkOutTime: currentTimeStr,
            workingHours,
            overtimeHours,
            status: "completed",
          }
        }
        return emp
      }),
    )
    console.log("[v0] Employee checked out:", employeeId, "at", currentTimeStr)
  }



  const getStatusBadge = (status, isLate) => {
    switch (status) {
      case "present":
        return (
          <Badge
            className={`${isLate ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"} hover:bg-current`}
          >
            {isLate ? "Present (Late)" : "Present"}
          </Badge>
        )
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--"
    return timeStr.substring(0, 5)
  }

  const formatHours = (hours) => {
    if (hours === 0) return "--"
    return `${hours}h`
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-8 w-8" />
          Attendance System
        </h1>
        <p className="text-muted-foreground">Track employee check-in/check-out and calculate working hours</p>
      </div>

      {/* Current Time Display */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {currentTime.toLocaleTimeString("en-IN", { hour12: false })}
                </div>
                <div className="text-sm text-muted-foreground">Current Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {currentTime.toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-sm text-muted-foreground">Today's Date</div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceData.filter((emp) => emp.status === "present" || emp.status === "completed").length}
                </div>
                <div className="text-xs text-green-600">Present</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {attendanceData.filter((emp) => emp.status === "absent").length}
                </div>
                <div className="text-xs text-red-600">Absent</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {attendanceData.filter((emp) => emp.isLate).length}
                </div>
                <div className="text-xs text-yellow-600">Late</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Input id="date-filter" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance</CardTitle>
          <CardDescription>Employee check-in/check-out status and working hours calculation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-foreground">Employee</th>
                  <th className="text-center p-4 font-medium text-foreground">Branch</th>
                  <th className="text-center p-4 font-medium text-foreground">Status</th>
                  <th className="text-center p-4 font-medium text-foreground">Check In</th>
                  <th className="text-center p-4 font-medium text-foreground">Check Out</th>
                  <th className="text-center p-4 font-medium text-foreground">Working Hours</th>
                  <th className="text-center p-4 font-medium text-foreground">Overtime</th>
                  <th className="text-center p-4 font-medium text-foreground">Daily Earnings</th>
                  <th className="text-center p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                        <span className="text-muted-foreground">Loading employees...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center">
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
                    </td>
                  </tr>
                ) : attendanceData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center">
                      <p className="text-muted-foreground">No employees found</p>
                    </td>
                  </tr>
                ) : (
                  attendanceData.map((employee) => (
                    <tr key={employee.id} className="border-b border-border hover:bg-accent">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                            <AvatarFallback>
                              {employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">{employee.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{employee.branch}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(employee.status, employee.isLate)}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ClockIn className="h-4 w-4 text-green-600" />
                          <span className={`font-mono ${employee.isLate ? "text-yellow-600" : "text-foreground"}`}>
                            {formatTime(employee.checkInTime)}
                          </span>
                        </div>
                        {employee.isLate && (
                          <div className="text-xs text-yellow-600">Expected: {formatTime(employee.expectedCheckIn)}</div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ClockOut className="h-4 w-4 text-red-600" />
                          <span className="font-mono">{formatTime(employee.checkOutTime)}</span>
                        </div>
                        {employee.checkOutTime && (
                          <div className="text-xs text-muted-foreground">
                            Expected: {formatTime(employee.expectedCheckOut)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Timer className="h-4 w-4" />
                          <span className="font-semibold">{formatHours(employee.workingHours)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-semibold ${employee.overtimeHours > 0 ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          {formatHours(employee.overtimeHours)}
                        </span>
                        {employee.overtimeHours > 0 && (
                          <div className="text-xs text-green-600">
                            +₹{Math.round(employee.overtimeHours * employee.overtimeRate)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-semibold text-foreground">
                          ₹{employee.status === "completed" ? calculateDailyEarnings(employee) : employee.dailySalary}
                        </div>
                        <div className="text-xs text-muted-foreground">Base: ₹{employee.dailySalary}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {employee.status === "absent" && (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(employee.employeeId)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <ClockIn className="h-4 w-4 mr-1" />
                              Check In
                            </Button>
                          )}
                          {employee.status === "present" && !employee.checkOutTime && (
                            <Button size="sm" variant="destructive" onClick={() => handleCheckOut(employee.employeeId)}>
                              <ClockOut className="h-4 w-4 mr-1" />
                              Check Out
                            </Button>
                          )}
                          {employee.status === "completed" && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Complete</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {attendanceData.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-gray-50">
              <div className="text-sm text-muted-foreground">
                Showing {attendanceData.length} employees • Total {totalCount}
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

                <div className="px-3 py-1 bg-white border border-border rounded text-sm font-medium">
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
  )
}

export default AttendanceSystem

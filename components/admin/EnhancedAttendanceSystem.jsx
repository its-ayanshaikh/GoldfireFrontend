"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Clock, Search, Filter, ArrowLeft, Calendar, CheckCircle, XCircle, AlertCircle, Plus, Coffee, ChevronLeft, ChevronRight, Loader2, Eye, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { useToast } from "../../hooks/use-toast"
import { useParams, useNavigate } from "react-router-dom"

const EnhancedAttendanceSystem = () => {
  const { toast } = useToast()
  const routeParams = useParams()
  const navigate = useNavigate()
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

  // Image modal state
  const [selectedImage, setSelectedImage] = useState(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Late attendance review state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null) // employee being rejected
  const [penaltyInput, setPenaltyInput] = useState("")
  const [reviewingId, setReviewingId] = useState(null) // employeeId currently processing

  // Debug: Log state changes
  useEffect(() => {
    console.log('State changed - isImageModalOpen:', isImageModalOpen)
    console.log('State changed - selectedImage:', selectedImage)
  }, [isImageModalOpen, selectedImage])

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
  const fetchEmployeesData = async () => {
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
        status: employee.status,
        todayStatus: employee.today_status || null, // Add today_status from API
        checkInTime: employee.check_in_time || null, // Add check_in_time from API
        checkInImage: employee.check_in_image || null, // Add check_in_image from API
        checkOutImage: employee.check_out_image || null, // Add check_out_image from API
        isLate: employee.is_late || false,
        lateStatus: employee.late_status || null,
        penaltyAmount: parseFloat(employee.penalty_amount || 0),
        todayAttendanceId: employee.today_attendance_id || null
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

  // API function to fetch employees with pagination
  useEffect(() => {
    fetchEmployeesData()
  }, [debouncedSearchTerm, filterBranch, currentPage])

  // -----------------------------
  // Late attendance review (approve / reject with penalty)
  // -----------------------------
  const reviewLateAttendance = async (employee, action, penalty = 0) => {
    if (!employee?.todayAttendanceId) {
      toast({ title: "No attendance record", description: "Today's attendance not found for this employee.", variant: "destructive" })
      return
    }
    try {
      setReviewingId(employee.id)
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/attendance/${employee.todayAttendanceId}/review-late/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, penalty }),
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to update late request")
      }

      // Update local state for that employee
      setEmployees(prev => prev.map(e =>
        e.id === employee.id
          ? { ...e, lateStatus: action === 'approve' ? 'approved' : 'rejected', penaltyAmount: action === 'approve' ? 0 : parseFloat(penalty || 0) }
          : e
      ))

      toast({
        title: action === 'approve' ? "Late request approved" : "Late request rejected",
        description: action === 'approve'
          ? `${employee.name}'s late attendance approved.`
          : `₹${parseFloat(penalty || 0).toLocaleString('en-IN')} penalty deducted from ${employee.name}'s salary.`,
      })
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setReviewingId(null)
    }
  }

  const openRejectDialog = (employee) => {
    setRejectTarget(employee)
    setPenaltyInput("")
    setIsRejectDialogOpen(true)
  }

  const confirmReject = async () => {
    const penalty = parseFloat(penaltyInput || 0)
    if (isNaN(penalty) || penalty < 0) {
      toast({ title: "Invalid penalty", description: "Please enter a valid amount.", variant: "destructive" })
      return
    }
    await reviewLateAttendance(rejectTarget, 'reject', penalty)
    setIsRejectDialogOpen(false)
    setRejectTarget(null)
    setPenaltyInput("")
  }

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
          isLate: record.is_late || false,
          originalLoginTime: record.login_time,
          originalLogoutTime: record.logout_time
        }
      })

      // Sort by date (newest first)
      const sortedAttendance = transformedAttendance.sort((a, b) => new Date(b.date) - new Date(a.date))
      setAttendanceHistory(sortedAttendance)

      // On refresh we may only have the id; enrich the header from the response
      if (data && data.employee) {
        setSelectedEmployee((prev) => {
          if (prev && (!prev.name || prev.name === '')) {
            return { ...prev, name: data.employee.name, branch: data.employee.branch }
          }
          return prev
        })
      }

    } catch (error) {
      console.error('Error fetching employee attendance:', error)
      setAttendanceError(error.message)
      setAttendanceHistory([])
    } finally {
      setAttendanceLoading(false)
    }
  }

  // Handle employee selection — URL drives the detail view (refresh-safe)
  const handleEmployeeSelect = (employee) => {
    navigate(`/admin/attendance/${employee.id}`)
  }

  // ---- Sync selected employee with the URL (/admin/attendance/:id) ----
  useEffect(() => {
    const urlId = routeParams.id ? Number(routeParams.id) : null
    if (!urlId) {
      setSelectedEmployee(null)
      return
    }
    const found = employees.find((e) => e.id === urlId)
    setSelectedEmployee((prev) => {
      if (prev && prev.id === urlId) return prev
      return found || { id: urlId, name: '', role: '', branch: '' }
    })
  }, [routeParams.id, employees])

  // Fetch attendance whenever the selected employee changes
  useEffect(() => {
    if (selectedEmployee?.id) {
      fetchEmployeeAttendance(selectedEmployee.id, selectedMonth, selectedYear)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee?.id])

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

      // Refresh attendance data for selected employee
      await fetchEmployeeAttendance(selectedEmployee.id, selectedMonth, selectedYear)
      
      // Refresh employee list to get updated today's status and check-in/out times
      await fetchEmployeesData()
      
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

  // Pagination is driven by the backend (page_size = 20), so total pages
  // comes from the count returned by the API, not a client-side slice.
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))

  const getPageNumbers = () => {
    const maxButtons = 5
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    let start = Math.max(1, currentPage - 2)
    let end = start + maxButtons - 1
    if (end > totalPages) {
      end = totalPages
      start = end - maxButtons + 1
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  // Helper function to extract time from ISO string (HH:MM:SS format)
  const extractTimeFromISO = (isoString) => {
    if (!isoString) return null
    try {
      // Format: "2026-01-29T18:56:12+05:30"
      const date = new Date(isoString)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      return `${hours}:${minutes}:${seconds}`
    } catch (error) {
      console.error('Error parsing time:', error)
      return null
    }
  }

  // Helper function to get status badge styling
  const getTodayStatusBadge = (todayStatus) => {
    if (!todayStatus) return null
    
    const status = todayStatus.toLowerCase()
    let bgColor = 'bg-gray-100'
    let textColor = 'text-gray-800'
    let borderColor = 'border-gray-300'
    
    if (status === 'present') {
      bgColor = 'bg-green-50'
      textColor = 'text-green-700'
      borderColor = 'border-green-300'
    } else if (status === 'absent') {
      bgColor = 'bg-red-50'
      textColor = 'text-red-700'
      borderColor = 'border-red-300'
    } else if (status === 'on leave' || status === 'leave') {
      bgColor = 'bg-orange-50'
      textColor = 'text-orange-700'
      borderColor = 'border-orange-300'
    }
    
    return { bgColor, textColor, borderColor }
  }

  // Handle update attendance button click
  // Handle image click to open modal
  const handleImageClick = (e, imageUrl) => {
    e.stopPropagation() // Prevent card click
    console.log('Image clicked:', imageUrl)
    console.log('Before state update - isImageModalOpen:', isImageModalOpen)
    console.log('Before state update - selectedImage:', selectedImage)
    setSelectedImage(imageUrl)
    setIsImageModalOpen(true)
    console.log('Modal should open now')
    
    // Check state after a small delay
    setTimeout(() => {
      console.log('After state update - isImageModalOpen should be true')
    }, 100)
  }

  // Handle update attendance button click
  const handleUpdateAttendanceClick = async (e, employee) => {
    e.stopPropagation() // Prevent card click

    // Reflect the detail in the URL (refresh-safe)
    navigate(`/admin/attendance/${employee.id}`)

    // Select employee first
    setSelectedEmployee(employee)
    
    // Fetch attendance data for current month
    await fetchEmployeeAttendance(employee.id, selectedMonth, selectedYear)
    
    // After a short delay to ensure data is loaded, open today's edit dialog
    setTimeout(() => {
      // Get today's date
      const today = new Date()
      const todayDate = today.getDate()
      const todayFormatted = today.toISOString().split('T')[0] // YYYY-MM-DD
      
      // Find today's attendance record from the fetched data
      const todayRecord = attendanceHistory.find(record => {
        const recordDate = new Date(record.date)
        return recordDate.getDate() === todayDate && 
               recordDate.getMonth() === selectedMonth && 
               recordDate.getFullYear() === selectedYear
      })
      
      // Create attendance object for today
      const todayAttendance = todayRecord ? {
        date: todayDate,
        fullDate: todayRecord.date,
        day: today.toLocaleDateString("en-US", { weekday: "short" }),
        status: todayRecord.status,
        checkIn: todayRecord.loginTime || '',
        checkOut: todayRecord.logoutTime || '',
        breakHours: todayRecord.breakHours || 0
      } : {
        date: todayDate,
        fullDate: todayFormatted,
        day: today.toLocaleDateString("en-US", { weekday: "short" }),
        status: 'absent',
        checkIn: '',
        checkOut: '',
        breakHours: 0
      }
      
      // Open edit dialog with today's data
      handleEditAttendance(todayAttendance)
    }, 500) // Small delay to ensure attendance data is loaded
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>
      case "leave":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Leave</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (!selectedEmployee) {
    return (
      <div className="p-0 sm:p-6">
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
            <CardDescription>Click on View button to see attendance details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                filteredEmployees.map((employee) => {
                  const statusBadge = getTodayStatusBadge(employee.todayStatus)
                  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
                  
                  return (
                    <Card
                      key={employee.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                            <AvatarFallback>
                              {employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">{employee.branch}</div>
                          </div>
                          
                          {/* Check-in/Check-out Image Thumbnails */}
                          <div className="flex gap-2 flex-shrink-0">
                            {employee.checkInImage && (
                              <div className="relative group">
                                <div className="text-xs text-muted-foreground text-center mb-1">In</div>
                                <img
                                  src={`${baseUrl}${employee.checkInImage}`}
                                  alt="Check-in"
                                  className="w-12 h-12 object-cover rounded border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => handleImageClick(e, `${baseUrl}${employee.checkInImage}`)}
                                />
                              </div>
                            )}
                            {employee.checkOutImage && (
                              <div className="relative group">
                                <div className="text-xs text-muted-foreground text-center mb-1">Out</div>
                                <img
                                  src={`${baseUrl}${employee.checkOutImage}`}
                                  alt="Check-out"
                                  className="w-12 h-12 object-cover rounded border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => handleImageClick(e, `${baseUrl}${employee.checkOutImage}`)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Today Status Badge with Check-in Time */}
                        {employee.todayStatus && statusBadge && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusBadge.bgColor} ${statusBadge.textColor} ${statusBadge.borderColor} text-xs font-medium`}>
                              <div className={`w-2 h-2 rounded-full ${
                                employee.todayStatus.toLowerCase() === 'present' ? 'bg-green-500' :
                                employee.todayStatus.toLowerCase() === 'absent' ? 'bg-red-500' :
                                'bg-orange-500'
                              }`}></div>
                              {employee.todayStatus}
                            </div>
                            
                            {/* Show check-in time if present */}
                            {employee.todayStatus.toLowerCase() === 'present' && employee.checkInTime && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-300 text-xs font-medium">
                                <Clock className="h-3 w-3" />
                                {extractTimeFromISO(employee.checkInTime)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {employee.isLate && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Late Arrival</Badge>

                            {employee.lateStatus === 'approved' && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>
                            )}

                            {employee.lateStatus === 'rejected' && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                Rejected · ₹{Number(employee.penaltyAmount || 0).toLocaleString('en-IN')} penalty
                              </Badge>
                            )}

                            {(employee.lateStatus === 'pending' || !employee.lateStatus) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  disabled={reviewingId === employee.id}
                                  onClick={() => reviewLateAttendance(employee, 'approve')}
                                >
                                  {reviewingId === employee.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs text-destructive"
                                  disabled={reviewingId === employee.id}
                                  onClick={() => openRejectDialog(employee)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-border flex flex-row gap-2">
                          {/* View Attendance Button */}
                          <Button
                            variant="outline"
                            className="flex-1 h-10 sm:h-9 px-3 sm:px-4 text-sm font-medium"
                            onClick={() => handleEmployeeSelect(employee)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          
                          {/* Update Attendance Button */}
                          <Button
                            variant="default"
                            className="flex-1 h-10 sm:h-9 px-3 sm:px-4 text-sm font-medium"
                            onClick={(e) => handleUpdateAttendanceClick(e, employee)}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Modal for employee list view */}
        {isImageModalOpen && selectedImage && (
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90"
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
            onClick={() => setIsImageModalOpen(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsImageModalOpen(false)
              }}
              className="absolute top-4 right-4 p-3 rounded-full bg-white text-black hover:bg-gray-200 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            <img
              src={selectedImage}
              alt="Attendance"
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
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
        isLate: record.isLate || false,
        hasBreak: false,
        breaks: []
      }
    })
    : []
  // Backend sends Decimal fields as strings (e.g. "2.50"), so always coerce
  // through parseFloat before doing any math. Using `+` directly on these
  // was doing string concatenation instead of addition, producing garbage
  // values on the summary cards.
  const toNumber = (val) => {
    const n = parseFloat(val)
    return isNaN(n) ? 0 : n
  }

  const totalLateDays = isClient ? monthlyAttendance.filter((day) => day.isLate).length : 0
  const holidays = isClient ? monthlyAttendance.filter((day) => day.status === "holiday").length : 0
  const totalWorkingHours = isClient ? monthlyAttendance.reduce((sum, day) => sum + toNumber(day.workingHours), 0) : 0
  const totalOvertimeHours = isClient ? monthlyAttendance.reduce((sum, day) => sum + toNumber(day.overtimeHours), 0) : 0
  const totalBreakHours = isClient ? monthlyAttendance.reduce((sum, day) => sum + toNumber(day.breakHours), 0) : 0
  const workingDays = isClient ? monthlyAttendance.filter((day) => day.status === "present" || day.status === "half-day").length : 0

  return (
    <>
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
          <div className="mb-4 px-2 sm:px-0">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" onClick={() => navigate('/admin/attendance')} className="flex items-center gap-2">
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

          <div className="px-2 sm:px-0 pt-1 pb-3 space-y-2">
            {/* Filters Bar */}
            <div className="rounded-xl border border-border/60 bg-muted/20 px-2 py-2 sm:px-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Filters</div>
                <div className="text-[10px] text-muted-foreground">Month & Year</div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Month</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => handleMonthChange(Number.parseInt(value))}
                  >
                    <SelectTrigger className="h-8 text-xs">
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
                <div className="space-y-1">
                  <Label className="text-[10px]">Year</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => handleYearChange(Number.parseInt(value))}
                  >
                    <SelectTrigger className="h-8 text-xs">
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
            </div>

            {/* Monthly Stats */}
            <div className="sticky top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <Card>
                  <CardContent className="p-2 md:p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                      <div>
                        <p className="text-[10px] md:text-sm text-muted-foreground">Late Days</p>
                        <p className="text-xs md:text-lg font-semibold">{totalLateDays}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2 md:p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                      <div>
                        <p className="text-[10px] md:text-sm text-muted-foreground">Holidays</p>
                        <p className="text-xs md:text-lg font-semibold">{holidays}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2 md:p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                      <div>
                        <p className="text-[10px] md:text-sm text-muted-foreground">Working Days</p>
                        <p className="text-xs md:text-lg font-semibold">{workingDays}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2 md:p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                      <div>
                        <p className="text-[10px] md:text-sm text-muted-foreground">Total Hours</p>
                        <p className="text-xs md:text-lg font-semibold">{(totalWorkingHours || 0).toFixed(1)}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2 md:p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                      <div>
                        <p className="text-[10px] md:text-sm text-muted-foreground">Overtime</p>
                        <p className="text-xs md:text-lg font-semibold text-blue-600">+{parseFloat(totalOvertimeHours || 0).toFixed(2)}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2 md:p-4">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                      <div>
                        <p className="text-[10px] md:text-sm text-muted-foreground">Break Hours</p>
                        <p className="text-xs md:text-lg font-semibold">{parseFloat(totalBreakHours || 0).toFixed(1)}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Monthly Attendance Table */}
          <Card className="rounded-none border-0 shadow-none">
            <CardHeader className="px-2 sm:px-0">
              <CardTitle>
                {months[selectedMonth]} {selectedYear} Attendance
              </CardTitle>
              <CardDescription>
                Daily check-in and check-out details. Click "Add Break" to record unauthorized breaks.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-0 pb-4">
              <div className="hidden md:block overflow-x-auto">
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {!isClient ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Loading attendance data...
                  </div>
                ) : attendanceLoading ? (
                  <div className="p-6 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                      <span className="text-muted-foreground">Fetching employee attendance...</span>
                    </div>
                  </div>
                ) : attendanceError ? (
                  <div className="p-6 text-center">
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
                  </div>
                ) : monthlyAttendance.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No attendance data found for this employee
                  </div>
                ) : (
                  monthlyAttendance.map((day) => (
                    <Card key={day.date} className="border border-border" onClick={() => handleEditAttendance(day)}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">{day.day}</div>
                            <div className="text-lg font-semibold">{day.date}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {day.isLate && (
                              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Late</Badge>
                            )}
                            {getStatusBadge(day.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-lg border border-border p-2">
                            <div className="text-muted-foreground">Check In</div>
                            <div className="font-medium">{day.checkIn || "Add"}</div>
                          </div>
                          <div className="rounded-lg border border-border p-2">
                            <div className="text-muted-foreground">Check Out</div>
                            <div className="font-medium">{day.checkOut || "Add"}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-lg bg-muted/40 p-2 text-center">
                            <div className="text-muted-foreground">Hours</div>
                            <div className="font-semibold">{day.workingHours > 0 ? `${day.workingHours}h` : "-"}</div>
                          </div>
                          <div className="rounded-lg bg-blue-50 p-2 text-center">
                            <div className="text-muted-foreground">Overtime</div>
                            <div className="font-semibold text-blue-700">{day.overtimeHours > 0 ? `+${parseFloat(day.overtimeHours).toFixed(2)}h` : "-"}</div>
                          </div>
                          <div className="rounded-lg bg-orange-50 p-2 text-center">
                            <div className="text-muted-foreground">Break</div>
                            <div className="font-semibold text-orange-700">{day.breakHours > 0 ? `${parseFloat(day.breakHours).toFixed(2)}h` : "-"}</div>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="w-full">
                          Update Day
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Attendance Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
            {/* Mobile-friendly: Stack on mobile, side-by-side on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCheckIn" className="text-sm font-medium">Check In Time</Label>
                <Input
                  id="editCheckIn"
                  type="time"
                  value={editForm.checkIn}
                  onChange={(e) => setEditForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  placeholder="HH:MM"
                  className="w-full text-base h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCheckOut" className="text-sm font-medium">Check Out Time</Label>
                <Input
                  id="editCheckOut"
                  type="time"
                  value={editForm.checkOut}
                  onChange={(e) => setEditForm(prev => ({ ...prev, checkOut: e.target.value }))}
                  placeholder="HH:MM"
                  className="w-full text-base h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakMinutes" className="text-sm font-medium">Break Time (Minutes)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min="0"
                max="480"
                value={editForm.breakMinutes}
                onChange={(e) => setEditForm(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                placeholder="Enter break duration in minutes"
                className="w-full text-base h-11"
              />
              <p className="text-xs text-muted-foreground">
                {editForm.breakMinutes > 0 ? `${(editForm.breakMinutes / 60).toFixed(2)} hours` : 'No break'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSavingAttendance}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={isSavingAttendance}
              className="w-full sm:w-auto"
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

      {/* Image Modal - Simple and Clean */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white text-black hover:bg-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          <img
            src={selectedImage}
            alt="Attendance"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Reject Late Request - Penalty Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Late Request</DialogTitle>
            <DialogDescription>
              {rejectTarget ? `Add a penalty for ${rejectTarget.name}'s late arrival. This amount will be deducted from this month's salary.` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="penalty-amount">Penalty Amount (₹)</Label>
            <Input
              id="penalty-amount"
              type="number"
              min="0"
              placeholder="e.g. 100"
              value={penaltyInput}
              onChange={(e) => setPenaltyInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={reviewingId === rejectTarget?.id}
            >
              {reviewingId === rejectTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject & Deduct'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EnhancedAttendanceSystem

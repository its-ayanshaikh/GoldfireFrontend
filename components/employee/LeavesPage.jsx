"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, Clock, CheckCircle, XCircle, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useToast } from "../../hooks/use-toast"
import LeaveRequestModal from "./LeaveRequestModal"

const LeavesPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState("my-leaves")
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [myLeaves, setMyLeaves] = useState([])
  const [allEmployees, setAllEmployees] = useState([])
  const [swapRequests, setSwapRequests] = useState([])
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [showLeaveRequest, setShowLeaveRequest] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [swapLoading, setSwapLoading] = useState(false)
  const [branchEmployees, setBranchEmployees] = useState(allEmployees)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [swapData, setSwapData] = useState(null)
  const [sentRequests, setSentRequests] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [monthlyLeaveRequests, setMonthlyLeaveRequests] = useState([])
  const [monthlyRequestsLoading, setMonthlyRequestsLoading] = useState(false)
  const [requestedDatesCount, setRequestedDatesCount] = useState(0)
  const { toast } = useToast()
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  // Fetch employee leaves
  const fetchEmployeeLeaves = async (month, year) => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`${API_BASE}/api/employee/my-leaves/?month=${month + 1}&year=${year}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()

      const transformedLeaves = data.map((leave, index) => {
        const leaveDate = new Date(leave.leave_date)
        return {
          id: leave.id || `leave-${index}`,
          employeeId: user.username,
          employeeName: user.username,
          date: leaveDate.getDate(),
          month: month,
          year: year,
          status: leave.status || "allocated",
          leaveType: leave.leave_type || "regular",
          originalDate: leave.leave_date,
          notes: leave.notes || "",
          employee: leave.employee,
        }
      })

      setMyLeaves(transformedLeaves)
    } catch (error) {
      console.error('Error fetching leaves:', error)
      setError(error.message)
      toast({
        title: "Error Loading Leaves",
        description: error.message || "Failed to load your leaves. Please try again.",
        variant: "destructive",
      })
      setMyLeaves([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch employees for swap
  const fetchEmployeesForSwap = async (month, year) => {
    setSwapLoading(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`${API_BASE}/api/employee/employee-leaves/?month=${month + 1}&year=${year}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()

      const transformedEmployees = data.employees.map(employee => ({
        id: employee.id,
        name: employee.name,
        availableDates: employee.leaves ? employee.leaves.map(leave => {
          const leaveDate = new Date(leave.leave_date)
          return leaveDate.getDate()
        }).filter(date => !isNaN(date)) : [],
        leaves: employee.leaves.map(leave => ({
          id: leave.id,
          date: new Date(leave.leave_date).getDate(),
          fullDate: leave.leave_date,
          notes: leave.notes || ""
        }))
      }))

      setAllEmployees(transformedEmployees)
      setBranchEmployees(transformedEmployees)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast({
        title: "Error Loading Employees",
        description: "Failed to load employee data for swap requests.",
        variant: "destructive",
      })
      setAllEmployees([])
    } finally {
      setSwapLoading(false)
    }
  }

  // Fetch sent requests
  const fetchSentRequests = async (month, year) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/employee/swap/sent/?month=${month + 1}&year=${year}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setSentRequests(data)
    } catch (error) {
      console.error('Error fetching sent requests:', error)
      setSentRequests([])
    }
  }

  // Fetch received requests
  const fetchReceivedRequests = async (month, year) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/employee/swap/received/?month=${month + 1}&year=${year}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setReceivedRequests(data)
    } catch (error) {
      console.error('Error fetching received requests:', error)
      setReceivedRequests([])
    }
  }

  // Fetch monthly leave requests
  const fetchMonthlyLeaveRequests = async () => {
    setMonthlyRequestsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/employee/monthly-leave/requests/list/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (!response.ok) throw new Error('Failed to fetch monthly leave requests')

      const data = await response.json()
      const requests = Array.isArray(data) ? data : (data.data || [])
      
      // Calculate total requested dates
      let totalDates = 0
      requests.forEach(request => {
        request.leaves?.forEach(leave => {
          totalDates++
        })
      })
      
      setMonthlyLeaveRequests(requests)
      setRequestedDatesCount(totalDates)
    } catch (error) {
      console.error('Error fetching monthly leave requests:', error)
      toast({
        title: "Error",
        description: "Failed to load your leave requests",
        variant: "destructive",
      })
      setMonthlyLeaveRequests([])
      setRequestedDatesCount(0)
    } finally {
      setMonthlyRequestsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.username) {
      if (activeTab === "my-leaves") {
        fetchEmployeeLeaves(currentMonth, currentYear)
        fetchSentRequests(currentMonth, currentYear)
        fetchReceivedRequests(currentMonth, currentYear)
      } else if (activeTab === "request-leave") {
        fetchMonthlyLeaveRequests()
      }
    }
  }, [currentMonth, currentYear, user?.username, activeTab])

  const handleSwapRequest = (leaveId) => {
    const leave = myLeaves.find((l) => l.id === leaveId)
    setSelectedLeave(leave)
    fetchEmployeesForSwap(currentMonth, currentYear)
    setShowSwapModal(true)
  }

  const submitSwapRequest = (targetEmployeeId, targetDate) => {
    const targetEmployee = branchEmployees.find((e) => e.id === targetEmployeeId)
    setSwapData({
      targetEmployeeId,
      targetEmployeeName: targetEmployee?.name || "Unknown",
      targetDate,
      fromDate: selectedLeave.date,
      fromLeaveId: selectedLeave.id,
      toLeaveId: targetEmployee?.leaves?.find(l => l.date === targetDate)?.id
    })
    setShowConfirmDialog(true)
  }

  const confirmSwapRequest = async () => {
    try {
      setSwapLoading(true)
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_BASE}/api/employee/leave-swap/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_employee_id: swapData.targetEmployeeId,
          from_leave_id: swapData.fromLeaveId,
          to_leave_id: swapData.toLeaveId
        })
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      setShowConfirmDialog(false)
      setShowSwapModal(false)
      setSelectedLeave(null)
      setSwapData(null)

      fetchSentRequests(currentMonth, currentYear)

      toast({
        title: "Swap Request Sent",
        description: `Request sent to swap your leave from ${swapData.fromDate} to ${swapData.targetDate}`,
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (error) {
      console.error('Error creating swap request:', error)
      toast({
        title: "Error",
        description: "Failed to send swap request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSwapLoading(false)
    }
  }

  const handleSwapResponse = async (requestId, response) => {
    try {
      const token = localStorage.getItem('access_token')
      const apiResponse = await fetch(`${API_BASE}/api/employee/leave-swap/${requestId}/respond/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: response })
      })

      if (!apiResponse.ok) throw new Error(`HTTP error! status: ${apiResponse.status}`)

      fetchReceivedRequests(currentMonth, currentYear)
      fetchEmployeeLeaves(currentMonth, currentYear)

      if (response === "approved") {
        toast({
          title: "Swap Approved",
          description: "Leave swap approved successfully!",
          className: "bg-green-50 border-green-200 text-green-800",
        })
      } else {
        toast({
          title: "Swap Rejected",
          description: "The leave swap request has been rejected",
          className: "bg-red-50 border-red-200 text-red-800",
        })
      }
    } catch (error) {
      console.error('Error responding to swap request:', error)
      toast({
        title: "Error",
        description: "Failed to respond to swap request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isDateDisabled = (employeeId, targetDate) => {
    return sentRequests.some(request =>
      request.to_employee === employeeId &&
      new Date(request.to_leave_date).getDate() === targetDate &&
      request.status === "pending"
    )
  }

  const isLeaveSwapDisabled = (leaveDate) => {
    return sentRequests.some(request =>
      new Date(request.from_leave_date).getDate() === leaveDate &&
      request.status === "pending"
    )
  }

  const isPastDate = (date, month, year) => {
    const today = new Date()
    const currentDate = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    if (year < currentYear) return true
    if (year === currentYear && month < currentMonth) return true
    if (year === currentYear && month === currentMonth && date < currentDate) return true

    return false
  }

  const pendingRequests = receivedRequests.filter((req) => req.status === "pending")
  const myRequests = sentRequests

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Leave Management</h1>
          <p className="text-muted-foreground">Manage your monthly leaves and swap requests</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
            <TabsTrigger value="request-leave">Request Leave</TabsTrigger>
          </TabsList>

          {/* My Leaves Tab */}
          <TabsContent value="my-leaves" className="space-y-6">
            {/* Calendar Navigation Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                      if (currentMonth === 0) {
                        setCurrentMonth(11)
                        setCurrentYear(currentYear - 1)
                      } else {
                        setCurrentMonth(currentMonth - 1)
                      }
                    }}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <CardTitle className="text-xl">
                    {loading ? "Loading..." : `${monthNames[currentMonth]} ${currentYear}`}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                      if (currentMonth === 11) {
                        setCurrentMonth(0)
                        setCurrentYear(currentYear + 1)
                      } else {
                        setCurrentMonth(currentMonth + 1)
                      }
                    }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge variant="secondary" className="text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {loading ? "Loading..." : `${myLeaves.length} leaves allocated for this month`}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* My Leaves Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  My Leaves ({myLeaves.length})
                </CardTitle>
                <CardDescription>Your allocated leaves for this month</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading your leaves...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-2">
                      <XCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">Error Loading Leaves</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                    <Button
                      onClick={() => fetchEmployeeLeaves(currentMonth, currentYear)}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : myLeaves.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium text-foreground">No leaves found</p>
                    <p className="text-sm text-muted-foreground">
                      You don't have any leaves allocated for {monthNames[currentMonth]} {currentYear}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {myLeaves.map((leave) => (
                      <Card key={leave.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-2xl font-bold text-foreground">{leave.date}</div>
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            {monthNames[leave.month]} {leave.year}
                            {leave.leaveType && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {leave.leaveType}
                              </Badge>
                            )}
                          </div>
                          <Button
                            onClick={() => handleSwapRequest(leave.id)}
                            className="w-full"
                            size="sm"
                            disabled={loading || isLeaveSwapDisabled(leave.date) || isPastDate(leave.date, leave.month, leave.year)}
                          >
                            <ArrowLeftRight className="w-4 h-4 mr-2" />
                            {isPastDate(leave.date, leave.month, leave.year)
                              ? "Past Date"
                              : isLeaveSwapDisabled(leave.date)
                                ? "Request Pending"
                                : "Request Swap"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Swap Requests Card */}
            {pendingRequests.length > 0 && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Swap Requests
                    <Badge variant="secondary">{pendingRequests.length}</Badge>
                  </CardTitle>
                  <CardDescription>Requests from other employees to swap leaves</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-foreground">{request.from_employee_name}</span>
                                <span className="text-sm text-muted-foreground">wants to swap</span>
                              </div>
                              <div className="text-sm text-muted-foreground mb-3">
                                Their leave:{" "}
                                <Badge variant="outline" className="mx-1">
                                  {new Date(request.from_leave_date).getDate()} {monthNames[new Date(request.from_leave_date).getMonth()]}
                                </Badge>
                                →
                                Your leave:{" "}
                                <Badge variant="outline" className="mx-1">
                                  {new Date(request.to_leave_date).getDate()} {monthNames[new Date(request.to_leave_date).getMonth()]}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleSwapResponse(request.id, "approved")}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleSwapResponse(request.id, "rejected")}
                                  variant="outline"
                                  size="sm"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Requests */}
            {myRequests.length > 0 && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    My Requests ({myRequests.length})
                  </CardTitle>
                  <CardDescription>Your sent swap requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-foreground">Request to {request.to_employee_name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Your leave:{" "}
                                <span className="font-semibold text-foreground">
                                  {new Date(request.from_leave_date).getDate()} {monthNames[new Date(request.from_leave_date).getMonth()]}
                                </span>
                                {" → "}
                                Their leave:{" "}
                                <span className="font-semibold text-foreground">
                                  {new Date(request.to_leave_date).getDate()} {monthNames[new Date(request.to_leave_date).getMonth()]}
                                </span>
                              </div>
                            </div>
                            <Badge className={
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                            }>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Request Leave Tab */}
          <TabsContent value="request-leave" className="space-y-6">
            {/* Request New Leave Button */}
            {requestedDatesCount >= 4 ? (
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Calendar className="w-5 h-5 text-red-600" />
                    Monthly Quota Full
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    You have already requested 4 dates for next month. Come back next month to request more leaves.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Request Paid Leave
                    </CardTitle>
                    <Button
                      onClick={() => setShowLeaveRequest(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      + Request Leave
                    </Button>
                  </div>
                  <CardDescription>You can request {4 - requestedDatesCount} more date(s) this month</CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Leave Requests List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Your Leave Requests
                </CardTitle>
                <CardDescription>All your submitted leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyRequestsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading requests...</p>
                    </div>
                  </div>
                ) : monthlyLeaveRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium text-foreground">No leave requests yet</p>
                    <p className="text-sm text-muted-foreground">
                      You haven't submitted any leave requests
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {monthlyLeaveRequests.map((request) => (
                      <Card key={request.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-foreground mb-2">Request #{request.id}</p>
                              <p className="text-sm text-muted-foreground mb-3">
                                Status: <span className="font-semibold capitalize">{request.aggregate_status}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created: {new Date(request.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <Badge className={
                              request.aggregate_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.aggregate_status === "partial_approved"
                                  ? "bg-blue-100 text-blue-800"
                                  : request.aggregate_status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                            }>
                              {request.aggregate_status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {request.aggregate_status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {request.aggregate_status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                              {request.aggregate_status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          {/* Leaves List */}
                          <div className="space-y-2 mt-4 pt-4 border-t">
                            {request.leaves && request.leaves.map((leave) => (
                              <div key={leave.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {new Date(leave.leave_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <Badge variant="outline" className={
                                  leave.status === "pending"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : leave.status === "approved"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                }>
                                  {leave.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Request Modal */}
          {showLeaveRequest && (
            <LeaveRequestModal
              user={user}
              onClose={() => setShowLeaveRequest(false)}
              onSuccess={() => {
                fetchMonthlyLeaveRequests()
                setShowLeaveRequest(false)
              }}
            />
          )}
        </Tabs>
      </div>

      {/* Swap Modal */}
      {showSwapModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Request Leave Swap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You want to swap your leave on{" "}
                <span className="font-semibold text-foreground">
                  {selectedLeave.date} {monthNames[currentMonth]}
                </span>
              </p>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Available employees:</h4>
                {swapLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {branchEmployees
                      .filter((emp) => emp.id !== user.username)
                      .map((employee) => (
                        <div key={employee.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{employee.name}</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {employee.availableDates && employee.availableDates.length > 0 ? (
                              employee.availableDates.map((date) => {
                                const alreadyRequested = isDateDisabled(employee.id, date)
                                const pastDate = isPastDate(date, currentMonth, currentYear)
                                const disabled = alreadyRequested || pastDate
                                return (
                                  <button
                                    key={date}
                                    onClick={() => !disabled && submitSwapRequest(employee.id, date)}
                                    disabled={disabled}
                                    className={`py-1 px-3 rounded-lg text-sm transition-colors ${disabled
                                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                      }`}
                                  >
                                    {date}
                                  </button>
                                )
                              })
                            ) : (
                              <span className="text-sm text-muted-foreground">No available dates</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSwapModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && swapData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Swap Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to send a swap request?
              </p>
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-foreground">Employee:</span>
                  <span className="ml-2 text-muted-foreground">{swapData.targetEmployeeName}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-foreground">Your leave:</span>
                  <span className="ml-2 text-muted-foreground">{swapData.fromDate} {monthNames[currentMonth]}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-foreground">Their leave:</span>
                  <span className="ml-2 text-muted-foreground">{swapData.targetDate} {monthNames[currentMonth]}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSwapRequest}
                  disabled={swapLoading}
                  className="flex-1"
                >
                  {swapLoading ? "Sending..." : "Confirm"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default LeavesPage

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Calendar, CheckCircle, XCircle, Clock, Search, Filter, Loader2 } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import MonthlyLeaveRequests from "./MonthlyLeaveRequests"

const LeaveRequests = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("daily")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [selectedDate, setSelectedDate] = useState(getTodayDate())

  useEffect(() => {
    if (activeTab === "daily") {
      fetchLeaveRequests()
    }
  }, [selectedDate, searchTerm, activeTab])

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const params = new URLSearchParams()

      if (selectedDate) {
        params.append('date', selectedDate)
      }

      if (searchTerm.trim()) {
        params.append('name', searchTerm.trim())
      }

      const queryString = params.toString()
      const url = queryString
        ? `${API_BASE}/api/employee/paid-leave/request/list/?${queryString}`
        : `${API_BASE}/api/employee/paid-leave/request/list/?date=${selectedDate}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setLeaveRequests(data)
      } else {
        throw new Error('Failed to fetch leave requests')
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = leaveRequests.filter(request => {
    const matchesStatus = filterStatus === "all" || request.status === filterStatus
    return matchesStatus
  })

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${API_BASE}/api/employee/paid-leave/request/${id}/update-status/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'approved' }),
          credentials: 'omit',
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Leave request approved",
          className: "bg-green-50 border-green-200 text-green-800",
        })
        fetchLeaveRequests()
      } else {
        throw new Error('Failed to approve request')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${API_BASE}/api/employee/paid-leave/request/${id}/update-status/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'rejected' }),
          credentials: 'omit',
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Leave request rejected",
          className: "bg-red-50 border-red-200 text-red-800",
        })
        fetchLeaveRequests()
      } else {
        throw new Error('Failed to reject request')
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "approved":
        return "bg-green-100 text-green-800 border-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
        <p className="text-muted-foreground">Manage employee leave requests</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="daily">Daily Requests</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Requests</TabsTrigger>
        </TabsList>

        {/* Daily Requests Tab */}
        <TabsContent value="daily" className="space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{leaveRequests.length}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total Requests</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {leaveRequests.filter(r => r.status === "pending").length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {leaveRequests.filter(r => r.status === "approved").length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {leaveRequests.filter(r => r.status === "rejected").length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Search Employee</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Filter by Date</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Leave Requests ({filteredRequests.length})
              </CardTitle>
              <CardDescription>Daily leave requests from employees</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-foreground">Employee</th>
                        <th className="text-left p-3 font-medium text-foreground">Leave Date</th>
                        <th className="text-left p-3 font-medium text-foreground">Branch</th>
                        <th className="text-left p-3 font-medium text-foreground">Requested At</th>
                        <th className="text-left p-3 font-medium text-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-muted-foreground">
                            No leave requests found
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((request) => {
                          const leaveDate = new Date(request.leave_date)
                          const createdAt = new Date(request.created_at)

                          return (
                            <tr
                              key={request.id}
                              className="border-b border-border hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-foreground">{request.employee_name}</p>
                                  <p className="text-xs text-muted-foreground">ID: {request.employee}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-foreground">
                                    {leaveDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <p className="text-foreground">
                                  {request.employee_branch ? request.employee_branch : <Badge variant="outline">-</Badge>}
                                </p>
                              </td>
                              <td className="p-3">
                                <p className="text-sm text-muted-foreground">
                                  {createdAt.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </td>
                              <td className="p-3">
                                <Badge className={`gap-2 ${getStatusColor(request.status)}`}>
                                  {getStatusIcon(request.status)}
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Modal */}
          <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader className="pb-3">
                <DialogTitle className="text-lg">{selectedRequest?.employee_name}</DialogTitle>
              </DialogHeader>

              {selectedRequest && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Employee</p>
                    <p className="font-semibold text-sm text-foreground">{selectedRequest.employee_name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Leave Date</p>
                    <p className="font-semibold text-sm text-foreground">
                      {new Date(selectedRequest.leave_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Branch</p>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedRequest.employee_branch ? selectedRequest.employee_branch : <Badge variant="outline">-</Badge>}
                    </p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className={`gap-1 ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusIcon(selectedRequest.status)}
                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </Badge>
                    </div>

                    {selectedRequest.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => {
                            handleApprove(selectedRequest.id)
                            setSelectedRequest(null)
                          }}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            handleReject(selectedRequest.id)
                            setSelectedRequest(null)
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 hover:bg-red-50 gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Monthly Requests Tab */}
        <TabsContent value="monthly" className="space-y-6">
          <MonthlyLeaveRequests isActive={activeTab === "monthly"} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LeaveRequests

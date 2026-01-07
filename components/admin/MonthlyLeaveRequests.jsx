"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Calendar, CheckCircle, XCircle, Search, Filter, ChevronDown, Loader2 } from "lucide-react"

const MonthlyLeaveRequests = ({ isActive }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [branches, setBranches] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [monthlyRequests, setMonthlyRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // Get current date for validation
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Calculate available months (current month + next 2 months)
  const getAvailableMonths = () => {
    const months = []
    let tempMonth = currentMonth
    let tempYear = currentYear

    for (let i = 0; i < 3; i++) {
      months.push({ month: tempMonth, year: tempYear })
      if (tempMonth === 12) {
        tempMonth = 1
        tempYear += 1
      } else {
        tempMonth += 1
      }
    }
    return months
  }

  // Calculate available years dynamically
  const getAvailableYears = () => {
    const years = []
    const availableMonths = getAvailableMonths()
    const uniqueYears = [...new Set(availableMonths.map(m => m.year))]
    return uniqueYears.sort()
  }

  // Get available months for selected year
  const getMonthsForYear = (year) => {
    const availableMonths = getAvailableMonths()
    return availableMonths
      .filter(m => m.year === year)
      .map(m => m.month)
  }

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      setBranchesLoading(true)
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_BASE}/api/branch/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Branches fetched:', data)
        setBranches(data)
      } else {
        console.error('Failed to fetch branches')
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setBranchesLoading(false)
    }
  }

  // Fetch monthly leave requests
  const fetchMonthlyRequests = async () => {
    try {
      setRequestsLoading(true)
      const token = localStorage.getItem('access_token')
      
      const params = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
        ...(selectedBranch !== "all" && { branch_id: selectedBranch })
      })

      const response = await fetch(
        `${API_BASE}/api/employee/monthly-leave/requests/list/admin/?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('Monthly leave requests:', data)
        setMonthlyRequests(data.data || [])
      } else {
        console.error('Failed to fetch monthly requests')
        setMonthlyRequests([])
      }
    } catch (error) {
      console.error('Error fetching monthly requests:', error)
      setMonthlyRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }

  // Fetch branches when tab becomes active
  useEffect(() => {
    if (isActive) {
      fetchBranches()
    }
  }, [isActive])

  // Fetch requests when month, year, or branch changes
  useEffect(() => {
    if (isActive) {
      fetchMonthlyRequests()
    }
  }, [selectedMonth, selectedYear, selectedBranch, isActive])



  // Transform API response to match UI format
  const transformedRequests = monthlyRequests.map(request => {
    const individual_statuses = {}
    const leaveIdMap = {}
    request.leaves?.forEach(leave => {
      const date = new Date(leave.leave_date).getDate()
      individual_statuses[date] = leave.status
      leaveIdMap[date] = leave.id
    })
    
    return {
      id: request.id,
      employee_name: request.employee_name,
      branch_name: request.branch_name,
      branch_id: request.branch_id,
      aggregate_status: request.aggregate_status,
      created_at: request.created_at,
      requested_dates: request.leaves?.map(l => new Date(l.leave_date).getDate()) || [],
      individual_statuses,
      leaveIdMap
    }
  })

  // Filter requests by search term
  const filteredRequests = transformedRequests.filter(request => {
    return request.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleApproveDate = async (date) => {
    if (!selectedRequest) return

    try {
      const leaveId = selectedRequest.leaveIdMap[date]
      if (!leaveId) {
        console.error('Leave ID not found for date:', date)
        return
      }

      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${API_BASE}/api/employee/monthly-leave/update/${leaveId}/`,
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
        console.log(`Approved date ${date} for request ${selectedRequest.id}`)
        const updatedStatuses = { ...selectedRequest.individual_statuses }
        updatedStatuses[date] = "approved"
        setSelectedRequest({
          ...selectedRequest,
          individual_statuses: updatedStatuses
        })
      } else {
        console.error('Failed to approve leave')
      }
    } catch (error) {
      console.error('Error approving leave:', error)
    }
  }

  const handleRejectDate = async (date) => {
    if (!selectedRequest) return

    try {
      const leaveId = selectedRequest.leaveIdMap[date]
      if (!leaveId) {
        console.error('Leave ID not found for date:', date)
        return
      }

      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${API_BASE}/api/employee/monthly-leave/update/${leaveId}/`,
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
        console.log(`Rejected date ${date} for request ${selectedRequest.id}`)
        const updatedStatuses = { ...selectedRequest.individual_statuses }
        updatedStatuses[date] = "rejected"
        setSelectedRequest({
          ...selectedRequest,
          individual_statuses: updatedStatuses
        })
      } else {
        console.error('Failed to reject leave')
      }
    } catch (error) {
      console.error('Error rejecting leave:', error)
    }
  }

  const handleCloseDialog = async () => {
    setSelectedRequest(null)
    // Refresh the list when dialog closes
    await fetchMonthlyRequests()
  }

  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"]
    return months[month - 1]
  }



  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {/* Search Employee */}
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Branch Filter */}
            <div className="w-40">
              <label className="text-sm font-medium text-foreground mb-2 block">Branch</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={branchesLoading}>
                <SelectTrigger>
                  {branchesLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue />
                  )}
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

            {/* Month Picker */}
            <div className="w-40">
              <label className="text-sm font-medium text-foreground mb-2 block">Month</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMonthsForYear(selectedYear).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Picker */}
            <div className="w-32">
              <label className="text-sm font-medium text-foreground mb-2 block">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableYears().map((year) => (
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

      {/* Monthly Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Requests for {getMonthName(selectedMonth)} {selectedYear}
          </CardTitle>
          <CardDescription>Maximum 4 dates per employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading requests...</p>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No monthly leave requests found
              </div>
            ) : (
              filteredRequests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="w-full border border-border rounded-lg p-4 flex items-center justify-between hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      <p className="font-medium text-foreground">{request.employee_name}</p>
                      <p className="text-xs text-muted-foreground">Branch: {request.branch_name}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {request.requested_dates.map((date) => (
                        <Badge
                          key={date}
                          variant="outline"
                          className={
                            request.individual_statuses[date] === "approved"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : request.individual_statuses[date] === "rejected"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-yellow-100 text-yellow-800 border-yellow-300"
                          }
                        >
                          {date}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal for Date Details */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedRequest?.employee_name}</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-accent/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Employee Name</p>
                  <p className="font-semibold text-foreground">{selectedRequest.employee_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Branch</p>
                  <p className="font-semibold text-foreground">{selectedRequest.branch_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Requested On</p>
                  <p className="font-semibold text-foreground">
                    {new Date(selectedRequest.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold text-foreground capitalize">{selectedRequest.aggregate_status}</p>
                </div>
              </div>

              {/* Dates List */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Requested Dates ({selectedRequest.requested_dates.length}/4)</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedRequest.requested_dates.map((date) => (
                    <div key={date} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {getMonthName(selectedMonth)} {date}, {selectedYear}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: <span className={
                            selectedRequest.individual_statuses[date] === "approved"
                              ? "text-green-600 font-semibold"
                              : selectedRequest.individual_statuses[date] === "rejected"
                                ? "text-red-600 font-semibold"
                                : "text-yellow-600 font-semibold"
                          }>
                            {selectedRequest.individual_statuses[date].charAt(0).toUpperCase() + selectedRequest.individual_statuses[date].slice(1)}
                          </span>
                        </p>
                      </div>
                      {selectedRequest.individual_statuses[date] === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveDate(date)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectDate(date)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {selectedRequest.individual_statuses[date] !== "pending" && (
                        <Badge className={
                          selectedRequest.individual_statuses[date] === "approved"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-red-100 text-red-800 border-red-300"
                        }>
                          {selectedRequest.individual_statuses[date] === "approved" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {selectedRequest.individual_statuses[date].charAt(0).toUpperCase() + selectedRequest.individual_statuses[date].slice(1)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MonthlyLeaveRequests

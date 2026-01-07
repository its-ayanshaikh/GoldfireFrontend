"use client"

import { useState, useMemo, useEffect } from "react"
import { X, Loader2, Calendar, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { useToast } from "../../hooks/use-toast"

const LeaveRequestModal = ({ onClose, onSuccess }) => {
  const { toast } = useToast()
  const [selectedDates, setSelectedDates] = useState([])
  const [loading, setLoading] = useState(false)
  const [requestedDates, setRequestedDates] = useState([])
  const [requestedCount, setRequestedCount] = useState(0)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // Fetch already requested dates
  useEffect(() => {
    const fetchRequestedDates = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch(
          `${API_BASE}/api/employee/monthly-leave/requests/list/`,
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
          // Handle both array and object with data property
          const requests = Array.isArray(data) ? data : (data.data || [])
          
          // Extract all requested dates
          const dates = []
          requests.forEach(request => {
            request.leaves?.forEach(leave => {
              dates.push(new Date(leave.leave_date).toDateString())
            })
          })
          
          setRequestedDates(dates)
          // Count total dates, not requests
          setRequestedCount(dates.length)
          console.log('Requested dates:', dates, 'Total count:', dates.length)
        }
      } catch (error) {
        console.error('Error fetching requested dates:', error)
      }
    }

    fetchRequestedDates()
  }, [])

  // Get next month only date range
  const dateRange = useMemo(() => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Start from next month
    const startDate = new Date(currentYear, currentMonth + 1, 1)
    // End at end of next month
    const endDate = new Date(currentYear, currentMonth + 2, 0)

    return { startDate, endDate }
  }, [])

  // Generate proper calendar grid for next month
  const calendarData = useMemo(() => {
    const nextMonth = new Date(dateRange.startDate)
    const year = nextMonth.getFullYear()
    const month = nextMonth.getMonth()
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay()
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0).getDate()
    
    const weeks = []
    let currentWeek = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month, day)
      currentWeek.push(date)
      
      // Start new week on Sunday (after Saturday)
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek])
        currentWeek = []
      }
    }
    
    // Add remaining week if not empty
    if (currentWeek.length > 0) {
      // Pad with empty cells to complete the week
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }
    
    return {
      month: nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
      weeks
    }
  }, [dateRange])

  const toggleDate = (date) => {
    const dateStr = date.toDateString()
    const isSelected = selectedDates.some(d => d.toDateString() === dateStr)

    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => d.toDateString() !== dateStr))
    } else {
      if (selectedDates.length < 4) {
        setSelectedDates([...selectedDates, date])
      } else {
        toast({
          title: "Limit Reached",
          description: "You can request maximum 4 dates at a time",
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one date",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')

      // Format payload as per API requirement
      const payload = {
        leave_dates: selectedDates
          .sort((a, b) => a - b)
          .map(date => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          })
      }

      console.log('Submitting leave request with payload:', payload)

      const response = await fetch(
        `${API_BASE}/api/employee/monthly-leave/request/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'omit',
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('Leave request response:', data)

        // Fetch updated list to refresh
        try {
          const listResponse = await fetch(
            `${API_BASE}/api/employee/monthly-leave/requests/list/`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'omit',
            }
          )
          if (listResponse.ok) {
            const listData = await listResponse.json()
            console.log('Updated leave requests list:', listData)
          }
        } catch (error) {
          console.error('Error refreshing list:', error)
        }

        toast({
          title: "Success",
          description: `Leave request submitted for ${selectedDates.length} date(s)`,
          className: "bg-green-50 border-green-200 text-green-800",
        })
        setSelectedDates([])
        onSuccess()
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.message || errorData.detail || "Failed to submit leave request")
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Request Paid Leave
          </CardTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Box */}
          {requestedCount >= 4 ? (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900 dark:text-red-100">
                <p className="font-medium">Your quota is full</p>
                <p className="text-xs mt-1">
                  You have already requested 4 dates for next month. No more requests allowed until next month.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium">Select dates for next month</p>
                <p className="text-xs mt-1">
                  You can request {4 - requestedCount} more date(s) this month.
                </p>
                {requestedDates.length > 0 && (
                  <p className="text-xs mt-1 text-blue-700">
                    {requestedDates.length} date(s) already requested (shown in gray)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Selected Dates Summary */}
          {selectedDates.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                Selected Dates ({selectedDates.length}/4)
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDates
                  .sort((a, b) => a - b)
                  .map((date, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="gap-2 px-3 py-1 cursor-pointer hover:bg-red-100"
                      onClick={() => toggleDate(date)}
                    >
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          {requestedCount >= 4 ? (
            <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
              <p className="text-sm font-medium">Calendar is disabled - Your monthly quota is full</p>
            </div>
          ) : (
            <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">{calendarData.month}</h3>
              <div className="space-y-2">
                {/* Day headers (Sun-Sat) */}
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                {calendarData.weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="grid grid-cols-7 gap-2">
                    {week.map((date, dayIdx) => {
                      if (!date) {
                        return <div key={`empty-${weekIdx}-${dayIdx}`} className="aspect-square"></div>
                      }

                      const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString())
                      const isAlreadyRequested = requestedDates.includes(date.toDateString())
                      const isDisabled = isAlreadyRequested || (requestedCount >= 4 && !isSelected)

                      return (
                        <button
                          key={date.toDateString()}
                          onClick={() => !isDisabled && toggleDate(date)}
                          disabled={isDisabled}
                          className={`
                            aspect-square rounded-lg text-sm font-medium transition-all
                            ${isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : isAlreadyRequested
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-50'
                                : isDisabled
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-50'
                                  : 'bg-muted hover:bg-accent text-foreground cursor-pointer'
                            }
                          `}
                          title={isAlreadyRequested ? 'Already requested' : isDisabled ? 'Limit reached' : ''}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3 justify-end bg-muted/30">
          {requestedCount >= 4 ? (
            <div className="flex-1 text-center py-2 text-red-600 font-medium">
              Your monthly quota is full. Come back next month to request more leaves.
            </div>
          ) : (
            <>
              <Button
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || selectedDates.length === 0}
                className="gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Request ({selectedDates.length}/{4 - requestedCount})
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default LeaveRequestModal

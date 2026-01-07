"use client"

import { useState, useEffect } from "react"
import { X, Loader2, AlertCircle, Calendar, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { useToast } from "../../hooks/use-toast"

const QuickLeaveRequestModal = ({ user, onClose, onSuccess, paidLeaveRequested = false, paidLeaveStatus = null, isOnLeaveToday = false }) => {
  const { toast } = useToast()
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const [employeeLeaves, setEmployeeLeaves] = useState([])
  const [selectedSwapWith, setSelectedSwapWith] = useState(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // Helper function to get modal content based on status
  const getModalContent = () => {
    // Case 1: Already on leave today but no paid leave request
    if (isOnLeaveToday && !paidLeaveRequested) {
      return {
        title: 'Already On Leave',
        icon: AlertCircle,
        iconColor: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        borderColor: 'border-purple-200 dark:border-purple-800',
        message: 'You\'re already on leave today. You can\'t submit another leave request.',
        messageColor: 'text-purple-900 dark:text-purple-100'
      }
    }

    if (!paidLeaveRequested) {
      return null
    }

    switch (paidLeaveStatus) {
      case 'approved':
        return {
          title: 'Leave Request Approved',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800',
          message: 'Your leave request for today has been approved. You are all set!',
          messageColor: 'text-green-900 dark:text-green-100'
        }
      case 'rejected':
        return {
          title: 'Leave Request Rejected',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-200 dark:border-red-800',
          message: 'Your leave request for today has been rejected. Please contact your manager for more details.',
          messageColor: 'text-red-900 dark:text-red-100'
        }
      case 'pending':
      default:
        return {
          title: 'Leave Request Pending',
          icon: Calendar,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          message: 'Your leave request for today is pending approval. Please wait for your manager\'s response.',
          messageColor: 'text-blue-900 dark:text-blue-100'
        }
    }
  }

  const modalContent = getModalContent()

  // Fetch employee leaves
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const today = new Date()
        const month = today.getMonth() + 1
        const year = today.getFullYear()

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/my-leaves/?month=${month}&year=${year}`,
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
          console.log('Leaves data:', data)
          // Filter out past dates
          const today_date = new Date()
          const futureLeaves = data.filter(leave => {
            const leaveDate = new Date(leave.leave_date)
            return leaveDate >= today_date
          })
          setEmployeeLeaves(futureLeaves)
        }
      } catch (error) {
        console.error('Error fetching leaves:', error)
        toast({
          title: "Error",
          description: "Failed to load your leaves",
          variant: "destructive",
        })
      }
    }

    fetchLeaves()
  }, [])



  const handleSubmit = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')

      // Get today's date in Indian timezone
      const today = new Date()
      const istDate = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
      const dateToSubmit = istDate.toISOString().split('T')[0]

      const payload = {
        leave_date: dateToSubmit
      }

      // Add optional fields only if they have values
      if (reason) {
        payload.reason = reason
      }
      if (selectedSwapWith) {
        payload.swap_with = selectedSwapWith
      }

      console.log('Final payload:', payload)
      console.log('selectedSwapWith value:', selectedSwapWith)

      const response = await fetch(
        `${API_BASE}/api/employee/paid-leave/request/`,
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
        toast({
          title: "Success",
          description: "Leave request submitted successfully",
          className: "bg-green-50 border-green-200 text-green-800",
        })
        onSuccess()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit leave request")
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
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <CardTitle className="text-black">
            {paidLeaveRequested ? modalContent?.title : "Request Paid Leave for Today"}
          </CardTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {(isOnLeaveToday && !paidLeaveRequested) || (paidLeaveRequested && modalContent) ? (
            <div className="space-y-4">
              <div className={`${modalContent.bgColor} border ${modalContent.borderColor} rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                  <modalContent.icon className={`w-5 h-5 ${modalContent.iconColor} flex-shrink-0 mt-0.5`} />
                  <div>
                    <h3 className={`font-medium ${modalContent.messageColor}`}>{modalContent.title}</h3>
                    <p className={`text-sm ${modalContent.messageColor} mt-1`}>
                      {modalContent.message}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={onClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Swap With Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Swap With <span className="text-xs text-muted-foreground">(Optional)</span>
                </label>
                {employeeLeaves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leaves available to swap</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {employeeLeaves.map((leave) => {
                      const leaveDate = new Date(leave.leave_date)
                      const isSelected = selectedSwapWith === leave.id

                      return (
                        <button
                          key={leave.id}
                          onClick={() => setSelectedSwapWith(isSelected ? null : leave.id)}
                          className={`
                            p-2 rounded-lg border-2 transition-all text-sm font-medium
                            ${isSelected
                              ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400'
                              : 'border-gray-200 bg-white hover:border-orange-300 text-foreground'
                            }
                          `}
                        >
                          <div>{leaveDate.getDate()}</div>
                          <div className="text-xs text-muted-foreground">
                            {leaveDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Reason Input */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Reason <span className="text-xs text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Not feeling well, Medical appointment, etc."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {reason.length}/200 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 gap-2 bg-black hover:bg-gray-800 text-white"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default QuickLeaveRequestModal

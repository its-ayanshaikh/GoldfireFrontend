"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, User, CheckCircle, X, Loader2, Calendar, Clock, Badge, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge as BadgeComponent } from "../ui/badge"
import { Button } from "../ui/button"
import { useToast } from "../../hooks/use-toast"
import QuickLeaveRequestModal from "./QuickLeaveRequestModal"

const AttendancePage = ({ user }) => {
  const [lastPhoto, setLastPhoto] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null) // Store current location
  const [showLocationDialog, setShowLocationDialog] = useState(false) // Location permission dialog
  const [locationError, setLocationError] = useState("") // Location error message
  const [pendingAction, setPendingAction] = useState(null) // Store pending action (checkin/checkout)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const { toast } = useToast()
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // API function to fetch attendance history
  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')

      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE}/api/employee/attendance/history/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',

        },
        credentials: 'omit',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Attendance History API Response:', data)

      // Transform API data to component format
      const transformedHistory = data.attendance.map(record => ({
        id: record.id,
        date: new Date(record.date).toDateString(),
        checkIn: record.login_time ? new Date(record.login_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
        checkOut: record.logout_time ? new Date(record.logout_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
        workHours: record.total_hours ? record.total_hours : "0.0",
        status: record.status,
        loginImage: record.login_image,
        logoutImage: record.logout_image,
        employee: data.employee
      }))

      // Sort by date (newest first)
      const sortedHistory = transformedHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
      setAttendanceHistory(sortedHistory)

    } catch (error) {
      console.error('Error fetching attendance history:', error)
      toast({
        title: "Error Loading History",
        description: "Failed to load attendance history. Please try again.",
        variant: "destructive",
      })
      setAttendanceHistory([])
    } finally {
      setLoading(false)
    }
  }

  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [todayStatus, setTodayStatus] = useState("out")
  const [showLeaveRequest, setShowLeaveRequest] = useState(false)
  const [paidLeaveRequested, setPaidLeaveRequested] = useState(user?.paid_leave_requested || false)
  const [paidLeaveStatus, setPaidLeaveStatus] = useState(user?.paid_leave_status || null)
  const [isOnLeaveToday, setIsOnLeaveToday] = useState(user?.is_on_leave_today || false)

  // Fetch paid leave status on component mount
  useEffect(() => {
    const fetchPaidLeaveStatus = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await fetch(`${API_BASE}/api/employee/paid-leave/status/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Paid Leave Status:', data)
          setPaidLeaveRequested(data.paid_leave_requested || false)
          setPaidLeaveStatus(data.paid_leave_status || null)
          setIsOnLeaveToday(data.is_on_leave_today || false)
        }
      } catch (error) {
        console.error('Error fetching paid leave status:', error)
      }
    }

    if (user?.id) {
      fetchPaidLeaveStatus()
    }
  }, [user?.id, API_BASE])

  // Load attendance history on component mount
  useEffect(() => {
    if (user?.username) {
      fetchAttendanceHistory()
    }
  }, [user?.username])

  useEffect(() => {
    const today = new Date().toDateString()
    const todayRecord = attendanceHistory.find((record) => record.date === today)
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      setTodayStatus("in")
    }
  }, [attendanceHistory])

  // Helper function to get leave status text and color
  const getLeaveStatusInfo = () => {
    // Case 1: Already on leave today but no paid leave request
    if (isOnLeaveToday && !paidLeaveRequested) {
      return {
        title: 'Already On Leave',
        description: 'You\'re already on leave, can\'t submit request',
        cardColor: 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/20',
        iconColor: 'text-purple-600',
        showButton: false,
        statusBadgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      }
    }

    // Case 2: On leave today with paid leave request
    if (isOnLeaveToday && paidLeaveRequested) {
      switch (paidLeaveStatus) {
        case 'approved':
          return {
            title: 'Leave Request Approved',
            description: 'Your leave request for today has been approved',
            cardColor: 'border-green-200 bg-green-50/50 dark:bg-green-950/20',
            iconColor: 'text-green-600',
            showButton: false,
            statusBadgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
          }
        case 'rejected':
          return {
            title: 'Leave Request Rejected',
            description: 'Your leave request for today has been rejected',
            cardColor: 'border-red-200 bg-red-50/50 dark:bg-red-950/20',
            iconColor: 'text-red-600',
            showButton: false,
            statusBadgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
          }
        case 'pending':
        default:
          return {
            title: 'Leave Request Submitted',
            description: 'Your leave request for today is pending approval',
            cardColor: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20',
            iconColor: 'text-blue-600',
            showButton: false,
            statusBadgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
          }
      }
    }

    // Case 3: Not on leave today but has paid leave request
    if (!isOnLeaveToday && paidLeaveRequested) {
      switch (paidLeaveStatus) {
        case 'approved':
          return {
            title: 'Leave Request Approved',
            description: 'Your leave request for today has been approved',
            cardColor: 'border-green-200 bg-green-50/50 dark:bg-green-950/20',
            iconColor: 'text-green-600',
            showButton: false,
            statusBadgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
          }
        case 'rejected':
          return {
            title: 'Leave Request Rejected',
            description: 'Your leave request for today has been rejected',
            cardColor: 'border-red-200 bg-red-50/50 dark:bg-red-950/20',
            iconColor: 'text-red-600',
            showButton: true,
            statusBadgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
          }
        case 'pending':
        default:
          return {
            title: 'Leave Request Submitted',
            description: 'Your leave request for today is pending approval',
            cardColor: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20',
            iconColor: 'text-blue-600',
            showButton: false,
            statusBadgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
          }
      }
    }

    // Case 4: No leave today and no paid leave request
    return {
      title: 'Request Paid Leave',
      description: 'Request leave for today if you\'re not feeling well',
      cardColor: 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600',
      showButton: true,
      statusBadgeColor: null
    }
  }

  const leaveStatusInfo = getLeaveStatusInfo()

  // Function to get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  const startCamera = async (action) => {
    setLoading(true)
    setCameraReady(false)
    setCurrentAction(action)
    setPendingAction(action)
    setCapturedPhoto(null)

    // First check and get location permission
    try {
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      console.log('Location obtained:', location)
      setShowLocationDialog(false)
      setLocationError("")
    } catch (error) {
      console.error('Location error:', error)
      setLoading(false)
      
      let errorMessage = 'Please enable location permission to continue.'
      if (error.code === 1) {
        errorMessage = 'Location permission denied. Please allow location access in your browser settings to check in/out.'
      } else if (error.code === 2) {
        errorMessage = 'Unable to determine your location. Please check your GPS/location settings.'
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.'
      }
      
      // Show location dialog popup instead of toast
      setLocationError(errorMessage)
      setShowLocationDialog(true)
      return // Don't open camera without location
    }

    // Now open camera after location is obtained
    setShowCamera(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        const handleLoadedMetadata = () => {
          if (videoRef.current) {
            videoRef.current
              .play()
              .then(() => {
                setCameraReady(true)
                setLoading(false)
              })
              .catch((error) => {
                console.error("Error playing video:", error)
                setLoading(false)
              })
          }
        }

        const handleCanPlay = () => {
          setCameraReady(true)
          setLoading(false)
        }

        videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata)
        videoRef.current.addEventListener("canplay", handleCanPlay)

        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata)
            videoRef.current.removeEventListener("canplay", handleCanPlay)
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
      setShowCamera(false)
      setLoading(false)
      setCurrentLocation(null)
    }
  }

  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [showCamera])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedPhoto(photoDataUrl)
    }
  }

  const confirmPhoto = async () => {
    if (capturedPhoto && user && currentLocation) {
      setLoading(true)

      try {
        // Convert base64 to blob for FormData
        const response = await fetch(capturedPhoto)
        const blob = await response.blob()

        // Create FormData
        const formData = new FormData()
        const imageKey = currentAction === "checkin" ? "login_image" : "logout_image"
        formData.append(imageKey, blob, `${currentAction}_${Date.now()}.jpg`)
        
        // Add location data
        formData.append('latitude', currentLocation.latitude)
        formData.append('longitude', currentLocation.longitude)

        // Get JWT token
        const token = localStorage.getItem('access_token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        // API endpoint based on action
        const endpoint = currentAction === "checkin"
          ? `${API_BASE}/api/employee/attendance/login/`
          : `${API_BASE}/api/employee/attendance/logout/`

        console.log(`Making ${currentAction} request to:`, endpoint)
        console.log('Location data:', currentLocation)

        // Make API call
        const apiResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        })

        if (!apiResponse.ok) {
          // Try to parse error response as JSON first
          let errorMessage = `Failed to ${currentAction === "checkin" ? "check in" : "check out"}. Please try again.`
          
          try {
            // Clone response before reading to avoid body consumed error
            const errorData = await apiResponse.clone().json()
            console.error('API Error:', errorData)
            
            // Handle location/distance error from backend
            if (errorData.error && errorData.distance_in_meters !== undefined) {
              toast({
                title: "Location Error",
                description: (
                  <div className="space-y-1">
                    <p>{errorData.error}</p>
                    <p className="font-semibold">Distance: {errorData.distance_in_meters} meters</p>
                  </div>
                ),
                variant: "destructive",
              })
              setLoading(false)
              return
            } else if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (parseError) {
            // If JSON parsing fails, try text
            try {
              const errorText = await apiResponse.text()
              console.error('API Error (text):', errorText)
            } catch (textError) {
              console.error('Could not parse error response')
            }
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const data = await apiResponse.json()
        console.log('API Response:', data)

        // Update today status immediately for better UX
        setTodayStatus(currentAction === "checkin" ? "in" : "out")

        setLastPhoto({
          type: currentAction,
          timestamp: new Date(),
          employee: user,
          photo: capturedPhoto,
        })

        toast({
          title: "Success",
          description: `${currentAction === "checkin" ? "Checked in" : "Checked out"} successfully`,
          className: "bg-green-50 border-green-200 text-green-800",
        })

        // Refresh attendance history after successful submission
        fetchAttendanceHistory()

        setTimeout(() => {
          setLoading(false)
          closeCamera()
        }, 1000)

      } catch (error) {
        console.error('Attendance API Error:', error)
        setLoading(false)

        // Check if it's a network error
        let errorTitle = "Error"
        let errorDescription = `Failed to ${currentAction === "checkin" ? "check in" : "check out"}. Please try again.`
        
        if (error.message === 'Failed to fetch') {
          errorTitle = "Network Error"
          errorDescription = "Unable to connect to server. Please check your internet connection and try again."
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        })
      }
    }
  }

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    streamRef.current = null
    setCameraReady(false)
    setShowCamera(false)
    setCurrentAction(null)
    setCapturedPhoto(null)
    setCurrentLocation(null)
  }

  // Retry location permission
  const retryLocationPermission = async () => {
    if (pendingAction) {
      setShowLocationDialog(false)
      setLocationError("")
      await startCamera(pendingAction)
    }
  }

  // Close location dialog
  const closeLocationDialog = () => {
    setShowLocationDialog(false)
    setLocationError("")
    setPendingAction(null)
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-6">
        {/* Employee Status Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{user?.username || "Employee"}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <BadgeComponent
                    variant={
                      isOnLeaveToday || paidLeaveStatus === "approved" ? "default" :
                        todayStatus === "in" ? "default" : "secondary"
                    }
                    className={`text-xs ${isOnLeaveToday || paidLeaveStatus === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${isOnLeaveToday || paidLeaveStatus === "approved" ? "bg-green-500" :
                        todayStatus === "in" ? "bg-green-500" : "bg-red-500"
                      }`}></div>
                    {isOnLeaveToday || paidLeaveStatus === "approved" ? "On Leave" :
                      todayStatus === "in" ? "Currently Checked In" : "Currently Checked Out"}
                  </BadgeComponent>
                </div>
                {/* Shift Timing Display */}
                {(user?.shift_in || user?.shift_out) && (
                  <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Shift:</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {user?.shift_in || "--:--"} - {user?.shift_out || "--:--"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => startCamera("checkin")}
                disabled={loading || todayStatus === "in"}
                className="h-12"
                size="lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Camera className="w-5 h-5 mr-2" />}
                Check In
              </Button>
              <Button
                onClick={() => startCamera("checkout")}
                disabled={loading || todayStatus === "out"}
                variant="outline"
                className="h-12"
                size="lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Camera className="w-5 h-5 mr-2" />}
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Leave Request Card */}
        <Card className={`hover:shadow-md transition-shadow ${leaveStatusInfo.cardColor}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className={`w-5 h-5 ${leaveStatusInfo.iconColor}`} />
                  {leaveStatusInfo.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {leaveStatusInfo.description}
                </CardDescription>
                {paidLeaveStatus && (
                  <div className="mt-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${leaveStatusInfo.statusBadgeColor}`}>
                      {paidLeaveStatus.charAt(0).toUpperCase() + paidLeaveStatus.slice(1)}
                    </span>
                  </div>
                )}
              </div>
              {leaveStatusInfo.showButton && (
                <Button
                  onClick={() => setShowLeaveRequest(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium ml-4"
                  size="sm"
                >
                  Request Today
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Attendance History Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Attendance History
            </CardTitle>
            <CardDescription>Your attendance record for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loading && attendanceHistory.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading attendance history...</p>
                  </div>
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-foreground">No attendance records found</p>
                  <p className="text-sm text-muted-foreground">Your attendance history will appear here</p>
                </div>
              ) : (
                attendanceHistory.map((record, index) => (
                  <div
                    key={index}
                    className={`p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors ${record.status === "present" ? "bg-green-50/50 dark:bg-green-950/20" : "bg-red-50/50 dark:bg-red-950/20"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BadgeComponent
                          variant={record.status === "present" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {record.status === "present" ? "Present" : "Absent"}
                        </BadgeComponent>
                        <div>
                          <p className="font-medium text-foreground">{record.date}</p>
                        </div>
                      </div>

                      {record.status === "present" && (
                        <div className="text-right">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">In: {record.checkIn}</span>
                            </div>
                            {record.checkOut && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Out: {record.checkOut}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground mt-1">{record.workHours}h worked</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        {lastPhoto && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest attendance action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {lastPhoto.photo && (
                  <img
                    src={lastPhoto.photo || "/placeholder.svg"}
                    alt="Attendance photo"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{lastPhoto.employee.username}</p>
                  <BadgeComponent
                    variant="default"
                    className="text-xs mt-1"
                  >
                    {lastPhoto.type === "checkin" ? "Checked In Successfully" : "Checked Out Successfully"}
                  </BadgeComponent>
                  <p className="text-sm text-muted-foreground truncate mt-1">{lastPhoto.timestamp.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Leave Request Modal */}
      {showLeaveRequest && (
        <QuickLeaveRequestModal
          user={user}
          paidLeaveRequested={paidLeaveRequested}
          paidLeaveStatus={paidLeaveStatus}
          isOnLeaveToday={isOnLeaveToday}
          onClose={() => setShowLeaveRequest(false)}
          onSuccess={() => {
            setShowLeaveRequest(false)
            setPaidLeaveRequested(true)
            setPaidLeaveStatus('pending')
          }}
        />
      )}

      {/* Location Permission Dialog */}
      {showLocationDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm mx-auto">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">Location Required</CardTitle>
              <CardDescription className="mt-2">
                Please allow location access to check in/out
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeLocationDialog}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary"
                  onClick={retryLocationPermission}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Allow Location
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Camera modal remains the same */}
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md mx-auto max-h-[90vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="truncate">
                {currentAction === "checkin" ? "Check In" : "Check Out"} - {user?.username}
              </CardTitle>
              <Button
                onClick={closeCamera}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-accent"
                aria-label="Close camera"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {!capturedPhoto ? (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-border">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover bg-black ${!cameraReady ? "hidden" : ""}`}
                      style={{ transform: "scaleX(-1)" }}
                      onError={(e) => {
                        console.error("Video error:", e)
                        setLoading(false)
                      }}
                    />
                    {!cameraReady && (
                      <div className="w-full h-full flex items-center justify-center absolute inset-0">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
                          <p className="text-white text-sm">Starting camera...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="w-full h-12"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Capture Photo
                  </Button>
                </>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden aspect-video border border-border">
                    <img
                      src={capturedPhoto || "/placeholder.svg"}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setCapturedPhoto(null)}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      Retake
                    </Button>
                    <Button
                      onClick={confirmPhoto}
                      disabled={loading}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Confirm
                    </Button>
                  </div>
                </>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AttendancePage

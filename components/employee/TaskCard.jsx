"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, CheckCircle, Clock, AlertCircle, X, ImageIcon, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { useToast } from "../../hooks/use-toast"

const TaskCard = ({ task, onUpdateStatus }) => {
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [currentPhoto, setCurrentPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const { toast } = useToast()

  // Fallback timeout to ensure camera ready state is set
  useEffect(() => {
    if (showCamera && !cameraReady) {
      const timeout = setTimeout(() => {
        console.log("Fallback timeout - forcing camera ready")
        setCameraReady(true)
        setLoading(false)
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [showCamera, cameraReady])

  const startCamera = async () => {
    console.log("Starting camera...")
    setLoading(true)
    setCameraReady(false)
    setShowCamera(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", 
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
      
      console.log("Camera stream obtained:", stream)
      streamRef.current = stream
      
      // Directly set video source and play when modal is open
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current
          videoRef.current.play()
            .then(() => {
              console.log("Video playing directly")
              setCameraReady(true)
              setLoading(false)
            })
            .catch((error) => {
              console.error("Error playing video directly:", error)
              setLoading(false)
            })
        }
      }, 100) // Small delay to ensure modal is rendered
      
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error", 
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
      setShowCamera(false)
      setLoading(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraReady) {
      try {
        const canvas = canvasRef.current
        const video = videoRef.current
        const context = canvas.getContext("2d")

        // Set canvas dimensions
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        
        console.log("Capturing photo with dimensions:", canvas.width, "x", canvas.height)
        
        // Save current transform state
        context.save()
        
        // Flip the canvas horizontally to match the mirrored video
        context.scale(-1, 1)
        context.drawImage(video, -canvas.width, 0)
        
        // Restore transform state
        context.restore()

        const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8)
        console.log("Photo captured successfully")
        setCurrentPhoto(photoDataUrl)
        
        // Keep video playing
        if (video.paused) {
          console.log("Video was paused, restarting...")
          video.play().catch(err => console.error("Error restarting video:", err))
        }
        
      } catch (error) {
        console.error("Error capturing photo:", error)
        toast({
          title: "Capture Error",
          description: "Failed to capture photo. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      console.log("Cannot capture photo - video not ready")
    }
  }

  const savePhoto = () => {
    if (currentPhoto) {
      setCapturedPhotos([...capturedPhotos, currentPhoto])
      setCurrentPhoto(null)
      
      // Restart video stream after photo save
      requestAnimationFrame(() => {
        if (videoRef.current && streamRef.current && document.contains(videoRef.current)) {
          console.log("Restarting video after photo save")
          videoRef.current.srcObject = streamRef.current
          
          if (!videoRef.current.paused) {
            setCameraReady(true)
            return
          }
          
          videoRef.current.play()
            .then(() => {
              console.log("Video restarted successfully")
              setCameraReady(true)
            })
            .catch((error) => {
              if (error.name !== 'AbortError') {
                console.error("Error restarting video:", error)
              }
              setCameraReady(true)
            })
        } else {
          setCameraReady(true)
        }
      })
      
      toast({
        title: "Photo Added",
        description: "Photo has been added to the task.",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    }
  }

  const removePhoto = (index) => {
    setCapturedPhotos(capturedPhotos.filter((_, i) => i !== index))
    toast({
      title: "Photo Removed",
      description: "Photo has been removed from the task.",
      className: "bg-orange-50 border-orange-200 text-orange-800",
    })
  }

  const restartVideo = () => {
    console.log("Manually restarting video...")
    if (videoRef.current && streamRef.current && document.contains(videoRef.current)) {
      setCameraReady(false)
      videoRef.current.srcObject = streamRef.current
      
      // Check if video is already playing
      if (!videoRef.current.paused) {
        setCameraReady(true)
        return
      }
      
      videoRef.current.play()
        .then(() => {
          console.log("Video manually restarted")
          setCameraReady(true)
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error("Error manually restarting video:", error)
          }
          setCameraReady(true) // Force ready anyway
        })
    } else {
      console.log("Cannot restart video - element not in DOM or stream missing")
      setCameraReady(true)
    }
  }

  const handleRetake = () => {
    console.log("Handling retake...")
    setCurrentPhoto(null)
    
    // Just reset camera ready state and let React re-render handle the video
    setCameraReady(false)
    
    // Use requestAnimationFrame to ensure DOM is updated before video operations
    requestAnimationFrame(() => {
      if (videoRef.current && streamRef.current && videoRef.current.isConnected) {
        console.log("Re-attaching video stream for retake")
        
        // Check if video element is still in DOM
        if (document.contains(videoRef.current)) {
          videoRef.current.srcObject = streamRef.current
          
          // Add a small delay before playing
          setTimeout(() => {
            if (videoRef.current && videoRef.current.isConnected && !videoRef.current.paused) {
              return // Video is already playing
            }
            
            if (videoRef.current && streamRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log("Video playing after retake")
                  setCameraReady(true)
                })
                .catch((error) => {
                  if (error.name !== 'AbortError') {
                    console.error("Error playing video after retake:", error)
                  }
                  // Force camera ready anyway
                  setCameraReady(true)
                })
            }
          }, 100)
        } else {
          console.log("Video element not in DOM, forcing ready state")
          setCameraReady(true)
        }
      } else {
        console.log("Video ref or stream not available, forcing ready state")
        setCameraReady(true)
      }
    })
  }

  const closeCamera = () => {
    console.log("Closing camera...")
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log("Stopping track:", track.kind)
        track.stop()
      })
    }
    streamRef.current = null
    setCameraReady(false)
    setShowCamera(false)
    setCurrentPhoto(null)
  }

  const handleCompleteClick = () => {
    setShowConfirmDialog(true)
  }

  const submitTask = async () => {
    try {
      setLoading(true)
      setShowConfirmDialog(false)

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Create FormData for file upload
      const formData = new FormData()
      formData.append("task", task.id)
      
      // Add captured photos
      capturedPhotos.forEach((photo, index) => {
        // Convert data URL to blob
        fetch(photo)
          .then(res => res.blob())
          .then(blob => {
            formData.append("images", blob, `photo_${index}.jpg`)
          })
      })

      // Wait a bit for all blobs to be added
      await new Promise(resolve => setTimeout(resolve, 100))

      const response = await fetch(`${baseUrl}/api/task/submit/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to submit task")
      }

      onUpdateStatus(task.id, "complete", capturedPhotos)

      toast({
        title: "Success",
        description: "Task has been completed successfully!",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (err) {
      console.error("Error submitting task:", err)
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-orange-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const totalPhotos = task.photos.length + capturedPhotos.length

  return (
    <>
      <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getStatusIcon()}
            {task.title}
          </CardTitle>
          <CardDescription className="mt-2">{task.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Photos */}
          {totalPhotos > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {task.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 bg-accent rounded-lg flex-shrink-0 flex items-center justify-center border border-border"
                  >
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                ))}
                {capturedPhotos.map((photo, index) => (
                  <div key={`new-${index}`} className="relative flex-shrink-0">
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Captured ${index + 1}`}
                      className="w-12 h-12 rounded-lg object-cover border border-border"
                    />
                    <Button
                      onClick={() => removePhoto(index)}
                      size="sm"
                      variant="destructive"
                      className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {task.status === "pending" && (
            <div className="flex gap-3">
              <Button
                onClick={startCamera}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                Add Photos
              </Button>
              <Button
                onClick={handleCompleteClick}
                disabled={loading || capturedPhotos.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Complete
              </Button>
            </div>
          )}

          {task.status === "complete" && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 dark:text-green-400 font-medium text-sm">Task Completed</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Add Task Photos</CardTitle>
              <Button
                onClick={closeCamera}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {!currentPhoto ? (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-border">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover bg-black"
                      style={{ transform: "scaleX(-1)" }} // Mirror effect for selfie camera
                      onError={(e) => {
                        console.error("Video error:", e)
                        setLoading(false)
                      }}
                      onLoadedMetadata={() => {
                        console.log("Video metadata loaded - setting ready")
                        setCameraReady(true)
                        setLoading(false)
                      }}
                      onCanPlay={() => {
                        console.log("Video can play - setting ready")
                        setCameraReady(true)
                        setLoading(false)
                      }}
                      onPlaying={() => {
                        console.log("Video playing - setting ready")
                        setCameraReady(true)
                        setLoading(false)
                      }}
                      onPause={() => {
                        console.log("Video paused - attempting restart")
                        if (streamRef.current) {
                          setTimeout(() => restartVideo(), 100)
                        }
                      }}
                    />
                    {(!cameraReady || loading) && (
                      <div className="w-full h-full flex items-center justify-center absolute inset-0 bg-black/70">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
                          <p className="text-white text-sm">
                            {loading ? "Starting camera..." : "Loading video stream..."}
                          </p>
                          <p className="text-white text-xs mt-1 opacity-70">
                            Please allow camera permissions
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={capturePhoto}
                      disabled={!cameraReady}
                      className="w-full h-12"
                      size="lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Capture Photo
                    </Button>
                    
                    {!cameraReady && (
                      <Button
                        onClick={restartVideo}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Restart Camera
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden aspect-video">
                    <img
                      src={currentPhoto || "/placeholder.svg"}
                      alt="Captured"
                      className="w-full h-full object-cover border border-border"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRetake}
                      variant="outline"
                      className="flex-1"
                    >
                      Retake
                    </Button>
                    <Button
                      onClick={savePhoto}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Save Photo
                    </Button>
                  </div>
                </>
              )}

              {capturedPhotos.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-3">Captured Photos ({capturedPhotos.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {capturedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`Captured ${index + 1}`}
                          className="w-full h-20 rounded-lg object-cover border border-border"
                        />
                        <Button
                          onClick={() => removePhoto(index)}
                          size="sm"
                          variant="destructive"
                          className="absolute -top-1 -right-1 w-6 h-6 p-0 rounded-full"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={closeCamera}
                    className="w-full mt-4"
                    size="lg"
                  >
                    Done ({capturedPhotos.length} photos)
                  </Button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Complete Task
              </CardTitle>
              <CardDescription>
                Are you sure you want to mark this task as complete?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-accent/50 rounded-lg p-3">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  {capturedPhotos.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {capturedPhotos.length} photo{capturedPhotos.length !== 1 ? 's' : ''} attached
                    </p>
                  )}
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
                    onClick={submitTask}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Yes, Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default TaskCard
"use client"

import { useState, useEffect } from "react"
import TaskCard from "./TaskCard"
import { CheckSquare, Search, Loader2, ClipboardList, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { useToast } from "../../hooks/use-toast"

const TasksPage = () => {
  const [tasks, setTasks] = useState([])
  const [submittedTasks, setSubmittedTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const { toast } = useToast()

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

        // Fetch pending tasks
        const response = await fetch(`${baseUrl}/api/task/employee-task/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) throw new Error("Failed to fetch tasks")
        const data = await response.json()

        // Handle both array and object responses
        let taskList = []
        if (Array.isArray(data)) {
          taskList = data
        } else if (data.results) {
          taskList = Array.isArray(data.results) ? data.results : [data.results]
        } else if (data.data) {
          taskList = Array.isArray(data.data) ? data.data : [data.data]
        } else if (data.tasks) {
          taskList = Array.isArray(data.tasks) ? data.tasks : [data.tasks]
        }

        // Map API response to component format
        const formattedTasks = taskList.map((task) => ({
          id: task.id,
          title: task.task_name,
          description: task.description || "",
          status: task.status === "pending" ? "pending" : "complete",
          photos: [],
          priority: "medium",
        }))

        setTasks(formattedTasks)

        // Fetch submitted tasks
        const submittedResponse = await fetch(`${baseUrl}/api/task/submitted-tasks/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (submittedResponse.ok) {
          const submittedData = await submittedResponse.json()

          // Handle both array and object responses
          let submittedList = []
          if (Array.isArray(submittedData)) {
            submittedList = submittedData
          } else if (submittedData.results) {
            submittedList = Array.isArray(submittedData.results) ? submittedData.results : [submittedData.results]
          } else if (submittedData.data) {
            submittedList = Array.isArray(submittedData.data) ? submittedData.data : [submittedData.data]
          }

          // Map submitted tasks response
          const formattedSubmitted = submittedList.map((submission) => ({
            id: submission.id,
            taskId: submission.task,
            title: submission.task_name,
            description: submission.task_description || "",
            status: "complete",
            notes: submission.notes || "",
            submittedAt: submission.submitted_at,
            photos: submission.images?.map((img) => `${baseUrl}${img.image}`) || [],
            priority: "medium",
          }))

          setSubmittedTasks(formattedSubmitted)
        }
      } catch (err) {
        console.error("Error fetching tasks:", err)
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const updateTaskStatus = (taskId, status, photos = []) => {
    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, status, photos: [...task.photos, ...photos] } : task)),
    )
  }

  const handleSearch = (term) => {
    setSearchLoading(true)
    setSearchTerm(term)

    // Simulate search delay
    setTimeout(() => {
      setSearchLoading(false)
      if (term) {
        toast({
          title: "Search Complete",
          description: `Found ${filteredTasks.length} tasks matching "${term}"`,
          className: "bg-green-50 border-green-200 text-green-800",
        })
      }
    }, 500)
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredSubmittedTasks = submittedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const pendingTasks = filteredTasks.filter((task) => task.status === "pending")
  const completedTasks = filteredTasks.filter((task) => task.status === "complete")

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Tasks</h1>
          <p className="text-muted-foreground">View and manage your assigned tasks</p>
        </div>

        {/* Search Card */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {searchLoading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-orange-500" />
                Pending Tasks
                <Badge variant="secondary">{pendingTasks.length}</Badge>
              </CardTitle>
              <CardDescription>Tasks that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdateStatus={updateTaskStatus} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submitted Tasks */}
        {filteredSubmittedTasks.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-500" />
                Submitted Tasks
                <Badge variant="secondary">{filteredSubmittedTasks.length}</Badge>
              </CardTitle>
              <CardDescription>Tasks you have submitted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubmittedTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                        {task.title}
                      </CardTitle>
                      <CardDescription className="mt-2">{task.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {task.notes && (
                        <div>
                          <p className="text-sm font-medium text-foreground">Notes</p>
                          <p className="text-sm text-muted-foreground mt-1">{task.notes}</p>
                        </div>
                      )}
                      {task.photos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Photos ({task.photos.length})</p>
                          <div className="flex gap-2 overflow-x-auto">
                            {task.photos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Submitted ${index + 1}`}
                                onClick={() => setSelectedPhoto(photo)}
                                className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Submitted: {new Date(task.submittedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-500" />
                Completed Tasks
                <Badge variant="secondary">{completedTasks.length}</Badge>
              </CardTitle>
              <CardDescription>Successfully completed tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdateStatus={updateTaskStatus} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Loader2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin" />
              <CardTitle className="mb-2">Loading tasks...</CardTitle>
              <p className="text-muted-foreground">Please wait while we fetch your tasks</p>
            </CardContent>
          </Card>
        )}

        {/* Empty States */}
        {!loading && filteredTasks.length === 0 && searchTerm && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No tasks found</CardTitle>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </CardContent>
          </Card>
        )}

        {!loading && tasks.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No tasks yet</CardTitle>
              <p className="text-muted-foreground">Tasks will appear here when assigned to you</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl w-full max-h-[90vh]">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedPhoto}
              alt="Full view"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default TasksPage

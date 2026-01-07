"use client"
import { useState, useEffect, useRef } from "react"
import { useToast } from "../../hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { Label } from "../ui/label"
import {
  Search,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  ImageIcon,
  Repeat,
  List,
  Calendar,
  Loader,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const TaskManagement = () => {
  const { toast } = useToast()
  const [currentSubView, setCurrentSubView] = useState("task-list") // Added submenu state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedSubmissionDate, setSelectedSubmissionDate] = useState(new Date().toISOString().split("T")[0])
  const [isSubmissionViewOpen, setIsSubmissionViewOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  // Form states
  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
    assignedTo: [],
    frequency: "daily",
    customDays: "",
    selectedDays: [],
    photos: [],
  })

  // API states
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isDeletingTask, setIsDeletingTask] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const debounceTimer = useRef(null)

  // Submission states
  const [taskSubmissions, setTaskSubmissions] = useState([])
  const [submissionLoading, setSubmissionLoading] = useState(false)
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState("")
  const [debouncedSubmissionSearchTerm, setDebouncedSubmissionSearchTerm] = useState("")
  const submissionDebounceTimer = useRef(null)
  const [submissionStatus, setSubmissionStatus] = useState("all")
  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionTotalCount, setSubmissionTotalCount] = useState(0)
  const [submissionNextPage, setSubmissionNextPage] = useState(null)
  const [submissionPreviousPage, setSubmissionPreviousPage] = useState(null)

  // Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

        const response = await fetch(`${baseUrl}/api/employee/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) throw new Error("Failed to fetch employees")
        const data = await response.json()
        console.log(data);
        // Handle both array and object responses
        let employeeList = []
        if (Array.isArray(data)) {
          employeeList = data
        } else if (data.results) {
          employeeList = Array.isArray(data.results) ? data.results : [data.results]
        } else if (data.data) {
          employeeList = Array.isArray(data.data) ? data.data : [data.data]
        } else if (data.employees) {
          employeeList = Array.isArray(data.employees) ? data.employees : [data.employees]
        }
        setEmployees(employeeList)
        setError(null)
      } catch (err) {
        console.error("Error fetching employees:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  // Debounce search term
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 500) // 500ms delay

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchTerm])

  // Debounce submission search term
  useEffect(() => {
    if (submissionDebounceTimer.current) {
      clearTimeout(submissionDebounceTimer.current)
    }

    submissionDebounceTimer.current = setTimeout(() => {
      setDebouncedSubmissionSearchTerm(submissionSearchTerm)
      setSubmissionPage(1) // Reset to page 1 when search changes
    }, 500) // 500ms delay

    return () => {
      if (submissionDebounceTimer.current) {
        clearTimeout(submissionDebounceTimer.current)
      }
    }
  }, [submissionSearchTerm])

  const [tasks, setTasks] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)

  // Fetch tasks from API with filters
  useEffect(() => {
    if (currentSubView !== "task-list") return

    const fetchTasks = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

        // Build query parameters
        const params = new URLSearchParams()
        params.append("page", currentPage)

        if (debouncedSearchTerm) {
          params.append("search", debouncedSearchTerm)
        }

        if (selectedEmployee !== "all") {
          params.append("employee_id", selectedEmployee)
        }

        const response = await fetch(`${baseUrl}/api/task/?${params.toString()}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) throw new Error("Failed to fetch tasks")
        const data = await response.json()
        console.log(data);
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
        const formattedTasks = taskList.map((task) => {
          const assignedEmployees = employees.filter((emp) => task.assigned_to?.includes(emp.id))
          return {
            id: task.id,
            name: task.task_name,
            description: task.description || "",
            assignedTo: task.assigned_to || [],
            assignedEmployees,
            status: task.status || "pending",
            frequency: task.task_frequency?.days?.length > 0 ? "custom" : "daily",
            customDays: "",
            selectedDays: task.task_frequency?.days?.map((day) => {
              const dayMap = { 1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" }
              return dayMap[day] || "Sun"
            }) || [],
            createdDate: task.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
            photos: [],
          }
        })

        setTasks(formattedTasks)

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
      } catch (err) {
        console.error("Error fetching tasks:", err)
      }
    }

    if (employees.length > 0) {
      fetchTasks()
    }
  }, [currentSubView, employees, debouncedSearchTerm, selectedEmployee, currentPage])

  // Fetch submissions from API
  useEffect(() => {
    if (currentSubView !== "task-submissions") return

    const fetchSubmissions = async () => {
      try {
        setSubmissionLoading(true)
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

        // Build query parameters
        const params = new URLSearchParams()
        params.append("page", submissionPage)
        params.append("date", selectedSubmissionDate)

        if (submissionStatus !== "all") {
          params.append("status", submissionStatus)
        }

        if (debouncedSubmissionSearchTerm) {
          params.append("search", debouncedSubmissionSearchTerm)
        }

        const response = await fetch(`${baseUrl}/api/task/list/submissions/?${params.toString()}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) throw new Error("Failed to fetch submissions")
        const data = await response.json()

        // Handle both array and object responses
        let submissionList = []
        if (Array.isArray(data)) {
          submissionList = data
        } else if (data.results) {
          submissionList = Array.isArray(data.results) ? data.results : [data.results]
        } else if (data.data) {
          submissionList = Array.isArray(data.data) ? data.data : [data.data]
        }

        // Map API response to component format
        const formattedSubmissions = submissionList.map((submission) => ({
          id: submission.id,
          taskId: submission.task,
          taskName: submission.task_name,
          employeeName: submission.submitted_by || "Unknown",
          submissionDate: submission.submitted_at?.split("T")[0] || selectedSubmissionDate,
          photos: submission.images?.map((img) => img.image) || [],
          status: submission.status === "submitted" ? "completed" : submission.status,
          notes: submission.notes || "",
        }))

        setTaskSubmissions(formattedSubmissions)

        // Extract pagination info
        if (data.count !== undefined) {
          setSubmissionTotalCount(data.count)
        }
        if (data.next !== undefined) {
          setSubmissionNextPage(data.next)
        }
        if (data.previous !== undefined) {
          setSubmissionPreviousPage(data.previous)
        }
      } catch (err) {
        console.error("Error fetching submissions:", err)
        toast({
          title: "Error",
          description: "Failed to load submissions",
          variant: "destructive",
        })
      } finally {
        setSubmissionLoading(false)
      }
    }

    fetchSubmissions()
  }, [currentSubView, selectedSubmissionDate, submissionStatus, submissionPage, debouncedSubmissionSearchTerm])

  const getFrequencyText = (frequency, customDays, selectedDays = []) => {
    switch (frequency) {
      case "daily":
        return "Daily"
      case "alternate":
        return "Every Other Day"
      case "custom":
        return selectedDays && selectedDays.length > 0
          ? `${selectedDays.join(", ")}`
          : customDays ? `Every ${customDays} days` : "Custom"
      default:
        return "Unknown"
    }
  }

  // Filter tasks based on search and filters
  // All filtering is done via API, no client-side filtering needed
  const filteredTasks = tasks

  // Handle photo upload
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files)
    const newPhotos = files.map((file) => URL.createObjectURL(file))
    setTaskForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos],
    }))
  }

  // Remove photo
  const removePhoto = (index) => {
    setTaskForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  // Convert day names to numbers (Sun=1, Mon=2, ..., Sat=7)
  const dayNameToNumber = (dayName) => {
    const dayMap = { "Sun": 1, "Mon": 2, "Tue": 3, "Wed": 4, "Thu": 5, "Fri": 6, "Sat": 7 }
    return dayMap[dayName] || 1
  }

  // Handle form submission
  const handleCreateTask = async () => {
    if (!taskForm.name || taskForm.assignedTo.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    if (taskForm.selectedDays.length === 0) {
      alert("Please select at least one day")
      return
    }

    try {
      setIsCreatingTask(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Get user ID from adminUser object in localStorage
      let userId = 5
      if (typeof window !== "undefined") {
        const adminUserStr = localStorage.getItem("adminUser")
        if (adminUserStr) {
          try {
            const adminUser = JSON.parse(adminUserStr)
            userId = adminUser.id || 5
          } catch (e) {
            console.error("Error parsing adminUser:", e)
          }
        }
      }

      const assignedToNumbers = taskForm.assignedTo.map((id) => Number.parseInt(id))
      const frequencyDays = taskForm.selectedDays.map(dayNameToNumber)

      const payload = {
        task_name: taskForm.name,
        description: taskForm.description,
        assigned_to: assignedToNumbers,
        assigned_by: userId,
        task_frequency: {
          days: frequencyDays,
        },
        status: "pending",
      }

      const response = await fetch(`${baseUrl}/api/task/create/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to create task")
      }

      const createdTask = await response.json()

      // Add to local state for immediate display
      const assignedEmployees = employees.filter((emp) => assignedToNumbers.includes(emp.id))
      const newTask = {
        id: createdTask.id || tasks.length + 1,
        name: taskForm.name,
        description: taskForm.description,
        assignedTo: assignedToNumbers,
        assignedEmployees,
        status: "pending",
        frequency: taskForm.frequency,
        customDays: taskForm.customDays,
        selectedDays: taskForm.selectedDays,
        createdDate: new Date().toISOString().split("T")[0],
        photos: taskForm.photos,
      }

      setTasks((prev) => [...prev, newTask])
      setTaskForm({
        name: "",
        description: "",
        assignedTo: [],
        frequency: "daily",
        customDays: "",
        selectedDays: [],
        photos: [],
      })
      setIsCreateDialogOpen(false)
      toast({
        title: "Success",
        description: "Task created successfully!",
      })
    } catch (err) {
      console.error("Error creating task:", err)
      toast({
        title: "Error",
        description: "Error creating task: " + err.message,
        variant: "destructive",
      })
    } finally {
      setIsCreatingTask(false)
    }
  }

  // Handle delete task
  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setIsDeleteDialogOpen(false)
  }

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      try {
        setIsDeletingTask(true)
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

        const response = await fetch(`${baseUrl}/api/task/${taskToDelete}/delete/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to delete task")
        }

        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete))
        setTaskToDelete(null)
        setIsDeleteDialogOpen(false)
        toast({
          title: "Success",
          description: "Task deleted successfully!",
        })
      } catch (err) {
        console.error("Error deleting task:", err)
        toast({
          title: "Error",
          description: "Error deleting task: " + err.message,
          variant: "destructive",
        })
      } finally {
        setIsDeletingTask(false)
      }
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setTaskForm({
      name: task.name,
      description: task.description,
      assignedTo: task.assignedTo.map((id) => id.toString()),
      frequency: task.frequency,
      customDays: task.customDays,
      selectedDays: task.selectedDays || [],
      photos: task.photos,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateTask = async () => {
    if (!taskForm.name || taskForm.assignedTo.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    if (taskForm.selectedDays.length === 0) {
      alert("Please select at least one day")
      return
    }

    try {
      setIsCreatingTask(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Get user ID from adminUser object in localStorage
      let userId = 5
      if (typeof window !== "undefined") {
        const adminUserStr = localStorage.getItem("adminUser")
        if (adminUserStr) {
          try {
            const adminUser = JSON.parse(adminUserStr)
            userId = adminUser.id || 5
          } catch (e) {
            console.error("Error parsing adminUser:", e)
          }
        }
      }

      const assignedToNumbers = taskForm.assignedTo.map((id) => Number.parseInt(id))
      const frequencyDays = taskForm.selectedDays.map(dayNameToNumber)

      const payload = {
        task_name: taskForm.name,
        description: taskForm.description,
        assigned_to: assignedToNumbers,
        assigned_by: userId,
        task_frequency: {
          days: frequencyDays,
        },
      }

      const response = await fetch(`${baseUrl}/api/task/${editingTask.id}/update/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }

      const assignedEmployees = employees.filter((emp) => taskForm.assignedTo.includes(emp.id.toString()))
      const updatedTask = {
        ...editingTask,
        name: taskForm.name,
        description: taskForm.description,
        assignedTo: assignedToNumbers,
        assignedEmployees,
        frequency: taskForm.frequency,
        customDays: taskForm.customDays,
        selectedDays: taskForm.selectedDays,
        photos: taskForm.photos,
      }

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updatedTask : t)))
      setTaskForm({
        name: "",
        description: "",
        assignedTo: [],
        frequency: "daily",
        customDays: "",
        selectedDays: [],
        photos: [],
      })
      setIsEditDialogOpen(false)
      setEditingTask(null)
      toast({
        title: "Success",
        description: "Task updated successfully!",
      })
    } catch (err) {
      console.error("Error updating task:", err)
      toast({
        title: "Error",
        description: "Error updating task: " + err.message,
        variant: "destructive",
      })
    } finally {
      setIsCreatingTask(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case "in-progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // Task statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  }

  const submenuItems = [
    { id: "task-list", label: "Task List", icon: List },
    { id: "task-submissions", label: "Task Submissions", icon: Calendar },
  ]

  const renderTaskSubmissions = () => {
    // Get today's date
    const today = new Date().toISOString().split("T")[0]
    const selectedDate = new Date(selectedSubmissionDate)
    const todayDate = new Date(today)
    const isFutureDate = selectedDate > todayDate

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Task Submissions</h2>
          <p className="text-muted-foreground">View submitted tasks by employees</p>
        </div>

        <Card>
          <CardHeader className="bg-gray-50">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="submission-date">Select Date:</Label>
                <Input
                  type="date"
                  value={selectedSubmissionDate}
                  onChange={(e) => {
                    const newDate = e.target.value
                    const selectedDate = new Date(newDate)
                    const todayDate = new Date(today)
                    if (selectedDate <= todayDate) {
                      setSelectedSubmissionDate(newDate)
                      setSubmissionPage(1)
                    } else {
                      toast({
                        title: "Invalid Date",
                        description: "You cannot select a future date",
                        variant: "destructive",
                      })
                    }
                  }}
                  max={today}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="submission-search">Search:</Label>
                <Input
                  id="submission-search"
                  placeholder="Search by task name..."
                  value={submissionSearchTerm}
                  onChange={(e) => {
                    setSubmissionSearchTerm(e.target.value)
                    setSubmissionPage(1)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="submission-status">Status:</Label>
                <Select value={submissionStatus} onValueChange={(value) => {
                  setSubmissionStatus(value)
                  setSubmissionPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isFutureDate && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-800 text-sm">
                ⚠️ Future dates are not allowed. Showing data for today instead.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Submissions
                </CardTitle>
                <CardDescription>Showing {taskSubmissions.length} of {submissionTotalCount} submissions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {submissionLoading ? (
              <div className="p-8 text-center">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Loading submissions...</p>
              </div>
            ) : taskSubmissions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No submissions found</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-foreground">Task</th>
                        <th className="text-left p-4 font-medium text-foreground">Employee</th>
                        <th className="text-center p-4 font-medium text-foreground">Status</th>
                        <th className="text-center p-4 font-medium text-foreground">Photos</th>
                        <th className="text-center p-4 font-medium text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskSubmissions.map((submission) => (
                        <tr key={submission.id} className="border-b border-border hover:bg-accent">
                          <td className="p-4">
                            <div className="font-medium text-foreground">{submission.taskName}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-foreground">{submission.employeeName}</div>
                          </td>
                          <td className="p-4 text-center">{getStatusBadge(submission.status)}</td>
                          <td className="p-4 text-center">
                            {submission.photos.length > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{submission.photos.length}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No photos</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission)
                                setIsSubmissionViewOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {taskSubmissions.length > 0 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {taskSubmissions.length} submissions • Total {submissionTotalCount}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubmissionPage(submissionPage - 1)}
                        disabled={!submissionPreviousPage}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                        {submissionPage}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubmissionPage(submissionPage + 1)}
                        disabled={!submissionNextPage}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
        <p className="text-muted-foreground">Create, assign, and track tasks for your team</p>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          {submenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={currentSubView === item.id ? "default" : "outline"}
                onClick={() => setCurrentSubView(item.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>

      {currentSubView === "task-submissions" ? (
        renderTaskSubmissions()
      ) : (
        <>
          {/* Task Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-foreground">{totalCount}</div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters & Search</CardTitle>
              </div>
              <CardDescription>Search by task name or filter by employee</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="search">Search Tasks</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by task name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="employee-filter">Filter by Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Employees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map((employee) => employee && (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedEmployee("all")
                      setCurrentPage(1)
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="flex justify-center">
            <div className="w-full max-w-6xl">
              <Card className="bg-white">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Task List</CardTitle>
                      <CardDescription>
                        Showing {tasks.length} of {totalCount} tasks
                      </CardDescription>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Task</DialogTitle>
                          <DialogDescription>Create and assign a new task to an employee</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="task-name">Task Name *</Label>
                            <Input
                              id="task-name"
                              placeholder="Enter task name"
                              value={taskForm.name}
                              onChange={(e) => setTaskForm((prev) => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="task-description">Description</Label>
                            <Textarea
                              id="task-description"
                              placeholder="Enter task description"
                              value={taskForm.description}
                              onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="assign-to">Assign To (Multiple) *</Label>
                            <div className="relative">
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder={taskForm.assignedTo.length > 0 ? `${taskForm.assignedTo.length} selected` : "Select employees"} />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="p-2 space-y-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const allIds = employees.map((e) => e.id.toString())
                                        if (taskForm.assignedTo.length === employees.length) {
                                          setTaskForm((prev) => ({ ...prev, assignedTo: [] }))
                                        } else {
                                          setTaskForm((prev) => ({ ...prev, assignedTo: allIds }))
                                        }
                                      }}
                                      className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm font-medium"
                                    >
                                      {taskForm.assignedTo.length === employees.length ? "Deselect All" : "Select All"}
                                    </button>
                                    <div className="border-t border-gray-200"></div>
                                    {employees.map((employee) => (
                                      <label key={employee.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={taskForm.assignedTo.includes(employee.id.toString())}
                                          onChange={() => {
                                            setTaskForm((prev) => {
                                              const isSelected = prev.assignedTo.includes(employee.id.toString())
                                              return {
                                                ...prev,
                                                assignedTo: isSelected
                                                  ? prev.assignedTo.filter((id) => id !== employee.id.toString())
                                                  : [...prev.assignedTo, employee.id.toString()],
                                              }
                                            })
                                          }}
                                          className="w-4 h-4"
                                        />
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{employee.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {typeof employee.role === 'object' ? employee.role?.name : employee.role} {employee.branch && `• ${typeof employee.branch === 'object' ? employee.branch?.name : employee.branch}`}
                                          </div>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>
                            {taskForm.assignedTo.length > 0 && (
                              <div className="text-sm text-muted-foreground mt-2">
                                Selected: {taskForm.assignedTo.map((id) => employees.find((e) => e.id.toString() === id)?.name || "Unknown").filter(Boolean).join(", ")}
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Select Days of Week</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const allDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                                  if (taskForm.selectedDays.length === 7) {
                                    setTaskForm((prev) => ({ ...prev, selectedDays: [], frequency: "custom" }))
                                  } else {
                                    setTaskForm((prev) => ({ ...prev, selectedDays: allDays, frequency: "custom" }))
                                  }
                                }}
                              >
                                {taskForm.selectedDays.length === 7 ? "Deselect All" : "Select All"}
                              </Button>
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    setTaskForm((prev) => {
                                      const isSelected = prev.selectedDays.includes(day)
                                      return {
                                        ...prev,
                                        selectedDays: isSelected
                                          ? prev.selectedDays.filter((d) => d !== day)
                                          : [...prev.selectedDays, day],
                                        frequency: "custom",
                                      }
                                    })
                                  }}
                                  className={`px-2 py-2 rounded-md border-2 transition-colors font-bold text-sm ${taskForm.selectedDays.includes(day)
                                    ? "border-black bg-white text-black"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                            {taskForm.selectedDays.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                Selected: {taskForm.selectedDays.join(", ")}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreatingTask}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateTask} disabled={isCreatingTask} className="flex items-center gap-2">
                              {isCreatingTask && <Loader className="h-4 w-4 animate-spin" />}
                              {isCreatingTask ? "Creating..." : "Create Task"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-muted-foreground">No tasks found</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                        {[...filteredTasks].reverse().map((task) => (
                          <Card
                            key={task.id}
                            className="bg-white border border-gray-200 hover:shadow-md transition-shadow h-full"
                          >
                            <CardContent className="p-4 flex flex-col h-full">
                              <div className="space-y-3 flex-1">
                                <div>
                                  <h3 className="font-medium text-foreground text-base truncate">{task.name}</h3>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm text-muted-foreground">Frequency:</span>
                                    <div className="flex items-start gap-1 flex-1">
                                      <Repeat className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-right break-words">
                                        {getFrequencyText(task.frequency, task.customDays, task.selectedDays)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-center gap-3 pt-4 border-t w-full">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTask(task)
                                    setIsViewDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditTask(task)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:bg-destructive hover:text-white bg-transparent"
                                      onClick={() => {
                                        setTaskToDelete(task.id)
                                        setIsDeleteDialogOpen(true)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{task.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeletingTask}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmDeleteTask}
                                        disabled={isDeletingTask}
                                        className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                      >
                                        {isDeletingTask && <Loader className="h-4 w-4 animate-spin" />}
                                        {isDeletingTask ? "Deleting..." : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {tasks.length > 0 && (
                      <div className="flex items-center justify-between mt-6 pt-6 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {tasks.length} tasks • Total {totalCount}
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

                          <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details and assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-task-name">Task Name *</Label>
              <Input
                id="edit-task-name"
                placeholder="Enter task name"
                value={taskForm.name}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                placeholder="Enter task description"
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-assign-to">Assign To (Multiple) *</Label>
              <div className="relative">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={taskForm.assignedTo.length > 0 ? `${taskForm.assignedTo.length} selected` : "Select employees"} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = employees.map((e) => e.id.toString())
                          if (taskForm.assignedTo.length === employees.length) {
                            setTaskForm((prev) => ({ ...prev, assignedTo: [] }))
                          } else {
                            setTaskForm((prev) => ({ ...prev, assignedTo: allIds }))
                          }
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm font-medium"
                      >
                        {taskForm.assignedTo.length === employees.length ? "Deselect All" : "Select All"}
                      </button>
                      <div className="border-t border-gray-200"></div>
                      {employees.map((employee) => (
                        <label key={employee.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={taskForm.assignedTo.includes(employee.id.toString())}
                            onChange={() => {
                              setTaskForm((prev) => {
                                const isSelected = prev.assignedTo.includes(employee.id.toString())
                                return {
                                  ...prev,
                                  assignedTo: isSelected
                                    ? prev.assignedTo.filter((id) => id !== employee.id.toString())
                                    : [...prev.assignedTo, employee.id.toString()],
                                }
                              })
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {typeof employee.role === 'object' ? employee.role?.name : employee.role} {employee.branch && `• ${typeof employee.branch === 'object' ? employee.branch?.name : employee.branch}`}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              {taskForm.assignedTo.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  Selected: {taskForm.assignedTo.map((id) => employees.find((e) => e.id.toString() === id)?.name || "Unknown").filter(Boolean).join(", ")}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Days of Week</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                    if (taskForm.selectedDays.length === 7) {
                      setTaskForm((prev) => ({ ...prev, selectedDays: [], frequency: "custom" }))
                    } else {
                      setTaskForm((prev) => ({ ...prev, selectedDays: allDays, frequency: "custom" }))
                    }
                  }}
                >
                  {taskForm.selectedDays.length === 7 ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setTaskForm((prev) => {
                        const isSelected = prev.selectedDays.includes(day)
                        return {
                          ...prev,
                          selectedDays: isSelected
                            ? prev.selectedDays.filter((d) => d !== day)
                            : [...prev.selectedDays, day],
                          frequency: "custom",
                        }
                      })
                    }}
                    className={`px-2 py-2 rounded-md border-2 transition-colors font-bold text-sm ${taskForm.selectedDays.includes(day)
                      ? "border-black bg-white text-black"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {taskForm.selectedDays.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Selected: {taskForm.selectedDays.join(", ")}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isCreatingTask}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTask} disabled={isCreatingTask} className="flex items-center gap-2">
                {isCreatingTask && <Loader className="h-4 w-4 animate-spin" />}
                {isCreatingTask ? "Updating..." : "Update Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTask.name}</DialogTitle>
                <DialogDescription>
                  Assigned to {Array.isArray(selectedTask.assignedEmployees) && selectedTask.assignedEmployees.length > 0
                    ? selectedTask.assignedEmployees.filter(e => e).map((e) => e.name).join(", ")
                    : selectedTask.assignedEmployee?.name || "N/A"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employees</Label>
                  <div className="text-sm text-muted-foreground mt-1 space-y-2">
                    {Array.isArray(selectedTask.assignedEmployees) && selectedTask.assignedEmployees.length > 0 ? (
                      selectedTask.assignedEmployees.filter(emp => emp).map((emp) => (
                        <div key={emp.id}>
                          <p className="font-medium text-foreground">{emp.name}</p>
                          <p className="text-xs">{typeof emp.role === 'object' ? emp.role?.name : emp.role} {emp.branch && `• ${typeof emp.branch === 'object' ? emp.branch?.name : emp.branch}`}</p>
                        </div>
                      ))
                    ) : (
                      <p>{selectedTask.assignedEmployee?.name || "N/A"}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                </div>
                <div>
                  <Label>Created Date</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(selectedTask.createdDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getFrequencyText(selectedTask.frequency, selectedTask.customDays, selectedTask.selectedDays)}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submission View Dialog */}
      <Dialog open={isSubmissionViewOpen} onOpenChange={setIsSubmissionViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Submission Details</DialogTitle>
            <DialogDescription>View detailed submission information</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Task Name</Label>
                  <p className="text-sm text-foreground mt-1 font-medium">{selectedSubmission.taskName}</p>
                </div>
                <div>
                  <Label>Employee</Label>
                  <p className="text-sm text-foreground mt-1 font-medium">{selectedSubmission.employeeName}</p>
                </div>
                <div>
                  <Label>Submission Date</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(selectedSubmission.submissionDate).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                  {selectedSubmission.notes || "No notes provided"}
                </p>
              </div>
              {selectedSubmission.photos && selectedSubmission.photos.length > 0 && (
                <div>
                  <Label>Submitted Photos ({selectedSubmission.photos.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {selectedSubmission.photos.map((photo, index) => {
                      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
                      const fullPhotoUrl = `${baseUrl}${photo}`
                      return (
                        <div key={index} className="relative">
                          <img
                            src={fullPhotoUrl}
                            alt={`Submission photo ${index + 1}`}
                            onClick={() => setSelectedPhoto(fullPhotoUrl)}
                            className="w-full h-24 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
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

export default TaskManagement

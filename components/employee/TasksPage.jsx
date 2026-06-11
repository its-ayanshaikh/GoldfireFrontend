"use client"

import { useState, useEffect, useCallback } from "react"
import TaskCard from "./TaskCard"
import {
  CheckSquare,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  CalendarDays,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { useToast } from "../../hooks/use-toast"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const TasksPage = () => {
  const { toast } = useToast()

  // Today's pending tasks (for submitting)
  const [todayTasks, setTodayTasks] = useState([])
  const [todayLoading, setTodayLoading] = useState(true)

  // Calendar state
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // "YYYY-MM"
  const [calendarDays, setCalendarDays] = useState({})
  const [todayStr, setTodayStr] = useState(new Date().toISOString().split("T")[0])
  const [calendarLoading, setCalendarLoading] = useState(true)

  // Day dialog
  const [selectedDay, setSelectedDay] = useState(null) // { dateStr, tasks }
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  // -------- Fetch today's pending tasks (for submit) --------
  const fetchTodayTasks = useCallback(async () => {
    try {
      setTodayLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      const response = await fetch(`${baseUrl}/api/task/employee-task/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()

      let taskList = []
      if (Array.isArray(data)) taskList = data
      else if (data.results) taskList = Array.isArray(data.results) ? data.results : [data.results]
      else if (data.data) taskList = Array.isArray(data.data) ? data.data : [data.data]
      else if (data.tasks) taskList = Array.isArray(data.tasks) ? data.tasks : [data.tasks]

      const formatted = taskList.map((task) => ({
        id: task.id,
        title: task.task_name,
        description: task.description || "",
        status: "pending",
        photos: [],
        priority: "medium",
      }))

      setTodayTasks(formatted)
    } catch (err) {
      console.error("Error fetching today's tasks:", err)
    } finally {
      setTodayLoading(false)
    }
  }, [])

  // -------- Fetch month calendar --------
  const fetchCalendar = useCallback(async () => {
    try {
      setCalendarLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      const response = await fetch(
        `${baseUrl}/api/task/my-submissions/calendar/?month=${selectedMonth}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) throw new Error("Failed to fetch calendar")
      const data = await response.json()

      setCalendarDays(data.days || {})
      if (data.today) setTodayStr(data.today)
    } catch (err) {
      console.error("Error fetching calendar:", err)
      toast({
        title: "Error",
        description: "Failed to load task calendar",
        variant: "destructive",
      })
    } finally {
      setCalendarLoading(false)
    }
  }, [selectedMonth, toast])

  useEffect(() => {
    fetchTodayTasks()
  }, [fetchTodayTasks])

  useEffect(() => {
    fetchCalendar()
  }, [fetchCalendar])

  // After submitting a task, refresh both today's tasks and calendar
  const handleTaskSubmitted = () => {
    fetchTodayTasks()
    fetchCalendar()
  }

  // -------- Build calendar grid --------
  const [year, month] = selectedMonth.split("-").map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startWeekday = firstDay.getDay() // 0 = Sun

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cells.push({ day: d, dateStr })
  }

  const monthLabel = firstDay.toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  const goPrevMonth = () => {
    const prev = new Date(year, month - 2, 1)
    setSelectedMonth(prev.toISOString().slice(0, 7))
  }
  const goNextMonth = () => {
    const next = new Date(year, month, 1)
    const nextStr = next.toISOString().slice(0, 7)
    if (nextStr <= new Date().toISOString().slice(0, 7)) {
      setSelectedMonth(nextStr)
    }
  }

  const isNextDisabled = selectedMonth >= new Date().toISOString().slice(0, 7)

  // returns color classes for a date cell
  const getCellStyle = (dateStr) => {
    const dayData = calendarDays[dateStr]
    const isToday = dateStr === todayStr

    if (!dayData) {
      // no task this day
      return {
        className: "bg-muted/30 text-muted-foreground border-transparent",
        label: "—",
        clickable: false,
      }
    }

    if (dayData.all_done) {
      return {
        className: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
        label: null,
        clickable: true,
      }
    }

    // any pending → red
    return {
      className: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200",
      label: null,
      clickable: true,
    }
  }

  const openDay = (dateStr) => {
    const dayData = calendarDays[dateStr]
    if (!dayData) return
    setSelectedDay({ dateStr, tasks: dayData.tasks || [] })
  }

  // tasks that can be submitted today (pending) — matched from todayTasks
  const submittablePendingForToday = (dayTasks) => {
    return dayTasks
      .filter((t) => !t.done)
      .map((t) => todayTasks.find((tt) => tt.id === t.task_id))
      .filter(Boolean)
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Tasks</h1>
          <p className="text-muted-foreground">Your monthly task overview — tap a date to view or submit</p>
        </div>

        {/* Today's pending tasks (quick submit) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-500" />
              Today's Tasks
              {!todayLoading && <Badge variant="secondary">{todayTasks.length}</Badge>}
            </CardTitle>
            <CardDescription>Tasks you need to submit today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckSquare className="w-10 h-10 mx-auto mb-2" />
                No pending tasks for today. You're all caught up!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdateStatus={handleTaskSubmitted} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {monthLabel}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goPrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goNextMonth} disabled={isNextDisabled}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-300 inline-block" /> Submitted
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-300 inline-block" /> Not submitted
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-muted inline-block" /> No task
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {calendarLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading calendar...
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {wd}
                  </div>
                ))}
                {cells.map((cell, idx) => {
                  if (!cell) return <div key={`empty-${idx}`} />

                  const style = getCellStyle(cell.dateStr)
                  const isToday = cell.dateStr === todayStr
                  const dayData = calendarDays[cell.dateStr]

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      disabled={!style.clickable}
                      onClick={() => openDay(cell.dateStr)}
                      className={`relative aspect-square rounded-lg border flex flex-col items-center justify-center text-sm font-semibold transition-colors ${style.className} ${
                        isToday ? "ring-2 ring-primary ring-offset-1" : ""
                      } ${style.clickable ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <span>{cell.day}</span>
                      {dayData && (
                        <span className="mt-0.5">
                          {dayData.all_done ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                          )}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDay &&
                new Date(selectedDay.dateStr).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </DialogTitle>
            <DialogDescription>Tasks for this day</DialogDescription>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-4">
              {/* Task status list */}
              <div className="space-y-2">
                {selectedDay.tasks.map((t) => (
                  <div
                    key={t.submission_id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="mt-0.5">
                      {t.done ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{t.task_name}</div>
                      {t.task_description && (
                        <div className="text-sm text-muted-foreground mt-0.5">{t.task_description}</div>
                      )}
                      <Badge
                        variant="secondary"
                        className={`mt-1 ${
                          t.done ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.done ? "Submitted" : "Not submitted"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* If this is today, allow submitting pending tasks */}
              {selectedDay.dateStr === todayStr && (
                <>
                  {submittablePendingForToday(selectedDay.tasks).length > 0 ? (
                    <div className="pt-2 border-t border-border space-y-4">
                      <p className="text-sm font-medium text-foreground">Submit pending tasks</p>
                      <div className="grid grid-cols-1 gap-4">
                        {submittablePendingForToday(selectedDay.tasks).map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onUpdateStatus={() => {
                              handleTaskSubmitted()
                              setSelectedDay(null)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    selectedDay.tasks.some((t) => !t.done) && (
                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                        Pending tasks can be submitted from the "Today's Tasks" section above.
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <img src={selectedPhoto} alt="Full view" className="w-full h-full object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}

export default TasksPage

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { ArrowLeft, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function EmployeeAttendanceDetail({ 
  employee, 
  onBack,
  attendanceHistory,
  attendanceLoading,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onEditAttendance
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    return [currentYear, currentYear - 1]
  }

  const monthlyAttendance = isClient && attendanceHistory.length > 0
    ? attendanceHistory.map(record => {
      const dateObj = new Date(record.date)
      return {
        date: dateObj.getDate(),
        fullDate: record.date,
        day: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        status: record.status,
        checkIn: record.loginTime,
        checkOut: record.logoutTime,
        workingHours: record.totalHours,
        overtimeHours: record.overtimeHours,
        breakHours: record.breakHours,
      }
    })
    : []

  const presentDays = isClient ? monthlyAttendance.filter((day) => day.status === "present").length : 0
  const absentDays = isClient ? monthlyAttendance.filter((day) => day.status === "absent").length : 0
  const halfDays = isClient ? monthlyAttendance.filter((day) => day.status === "half-day").length : 0
  const holidays = isClient ? monthlyAttendance.filter((day) => day.status === "holiday").length : 0
  const totalWorkingHours = isClient ? monthlyAttendance.reduce((sum, day) => {
    const hours = typeof day.workingHours === 'number' ? day.workingHours : 0
    return sum + hours
  }, 0) : 0
  const totalOvertimeHours = isClient ? monthlyAttendance.reduce((sum, day) => sum + (day.overtimeHours || 0), 0) : 0

  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>
      case "half-day":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Half Day</Badge>
      case "holiday":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Holiday</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Employee List
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          {employee.name}
        </h1>
        <p className="text-muted-foreground">
          {employee.role} • {employee.branch}
        </p>
      </div>

      {/* Month/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Month & Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Month</Label>
              <Select value={`${selectedMonth}`} onValueChange={(value) => onMonthChange(Number.parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={`${index}`}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Year</Label>
              <Select value={`${selectedYear}`} onValueChange={(value) => onYearChange(Number.parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map((year) => (
                    <SelectItem key={year} value={`${year}`}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-lg font-semibold">{presentDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-lg font-semibold">{absentDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Half Days</p>
                <p className="text-lg font-semibold">{halfDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Holidays</p>
                <p className="text-lg font-semibold">{holidays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Working Hours</p>
              <p className="text-lg font-semibold">{totalWorkingHours.toFixed(1)}h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Overtime</p>
              <p className="text-lg font-semibold">{totalOvertimeHours.toFixed(1)}h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Attendance - {months[selectedMonth]} {selectedYear}</CardTitle>
          <CardDescription>Click on any day to edit attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-foreground">Day</th>
                  <th className="text-left p-3 font-medium text-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-foreground">Check In</th>
                  <th className="text-left p-3 font-medium text-foreground">Check Out</th>
                  <th className="text-left p-3 font-medium text-foreground">Working Hours</th>
                  <th className="text-left p-3 font-medium text-foreground">Overtime</th>
                  <th className="text-left p-3 font-medium text-foreground">Break</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLoading ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-muted-foreground">
                      Loading attendance data...
                    </td>
                  </tr>
                ) : (
                  monthlyAttendance.map((day) => (
                    <tr
                      key={day.date}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => onEditAttendance(day)}
                    >
                      <td className="p-3 font-medium">{day.date}</td>
                      <td className="p-3">{day.day}</td>
                      <td className="p-3">{getStatusBadge(day.status)}</td>
                      <td className="p-3">{day.checkIn || "-"}</td>
                      <td className="p-3">{day.checkOut || "-"}</td>
                      <td className="p-3">
                        {day.workingHours ? `${parseFloat(day.workingHours).toFixed(2)}h` : "-"}
                      </td>
                      <td className="p-3">
                        {day.overtimeHours ? (
                          <span className="text-green-600 font-medium">
                            +{parseFloat(day.overtimeHours).toFixed(2)}h
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {day.breakHours ? (
                          <span className="text-orange-600">
                            {parseFloat(day.breakHours).toFixed(2)}h
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

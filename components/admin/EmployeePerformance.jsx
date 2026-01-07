"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Trophy, TrendingUp, Target, Clock, Star } from "lucide-react"

const EmployeePerformance = () => {
  // Mock employee data
  const employees = [
    {
      id: 1,
      name: "Rahul Verma",
      position: "Sales Executive",
      avatar: "/placeholder-user.jpg",
      monthlySales: 45,
      monthlyRevenue: 225000,
      target: 40,
      efficiency: 112.5,
      rating: 4.8,
      status: "excellent",
    },
    {
      id: 2,
      name: "Priya Singh",
      position: "Sales Associate",
      avatar: "/placeholder-user.jpg",
      monthlySales: 38,
      monthlyRevenue: 190000,
      target: 35,
      efficiency: 108.6,
      rating: 4.6,
      status: "excellent",
    },
    {
      id: 3,
      name: "Amit Kumar",
      position: "Sales Executive",
      avatar: "/placeholder-user.jpg",
      monthlySales: 32,
      monthlyRevenue: 160000,
      target: 40,
      efficiency: 80.0,
      rating: 4.2,
      status: "good",
    },
    {
      id: 4,
      name: "Sunita Sharma",
      position: "Sales Associate",
      avatar: "/placeholder-user.jpg",
      monthlySales: 28,
      monthlyRevenue: 140000,
      target: 35,
      efficiency: 80.0,
      rating: 4.0,
      status: "good",
    },
    {
      id: 5,
      name: "Vikash Gupta",
      position: "Sales Trainee",
      avatar: "/placeholder-user.jpg",
      monthlySales: 18,
      monthlyRevenue: 90000,
      target: 25,
      efficiency: 72.0,
      rating: 3.5,
      status: "needs_improvement",
    },
  ]

  const monthlyPerformance = [
    { month: "Jan", rahul: 42, priya: 35, amit: 28, sunita: 25, vikash: 15 },
    { month: "Feb", rahul: 38, priya: 32, amit: 30, sunita: 27, vikash: 16 },
    { month: "Mar", rahul: 45, priya: 38, amit: 32, sunita: 28, vikash: 18 },
    { month: "Apr", rahul: 48, priya: 40, amit: 35, sunita: 30, vikash: 20 },
    { month: "May", rahul: 44, priya: 36, amit: 29, sunita: 26, vikash: 17 },
    { month: "Jun", rahul: 45, priya: 38, amit: 32, sunita: 28, vikash: 18 },
  ]

  const teamStats = [
    { metric: "Total Sales", value: "161", change: "+8.5%", trend: "up" },
    { metric: "Total Revenue", value: "₹8,05,000", change: "+12.3%", trend: "up" },
    { metric: "Avg Efficiency", value: "90.6%", change: "+5.2%", trend: "up" },
    { metric: "Team Rating", value: "4.2/5", change: "+0.3", trend: "up" },
  ]

  const getPerformanceBadge = (status) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>
      case "good":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>
      case "needs_improvement":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Needs Improvement</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 100) return "text-green-600"
    if (efficiency >= 80) return "text-blue-600"
    return "text-yellow-600"
  }

  const topPerformer = employees.reduce((prev, current) => (prev.monthlySales > current.monthlySales ? prev : current))

  return (
    <div className="space-y-6">
      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {teamStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.metric}</CardTitle>
              {stat.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className={`text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Performer Highlight */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Trophy className="h-5 w-5" />
            Employee of the Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={topPerformer.avatar || "/placeholder.svg"} alt={topPerformer.name} />
              <AvatarFallback>
                {topPerformer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-orange-800">{topPerformer.name}</h3>
              <p className="text-orange-600">{topPerformer.position}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-sm">
                  <span className="font-medium">Sales:</span> {topPerformer.monthlySales}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Revenue:</span> ₹{topPerformer.monthlyRevenue.toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Efficiency:</span> {topPerformer.efficiency}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Performance</CardTitle>
            <CardDescription>Individual employee sales trends over 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                rahul: {
                  label: "Rahul Verma",
                  color: "hsl(var(--chart-1))",
                },
                priya: {
                  label: "Priya Singh",
                  color: "hsl(var(--chart-2))",
                },
                amit: {
                  label: "Amit Kumar",
                  color: "hsl(var(--chart-3))",
                },
                sunita: {
                  label: "Sunita Sharma",
                  color: "hsl(var(--chart-4))",
                },
                vikash: {
                  label: "Vikash Gupta",
                  color: "hsl(var(--chart-5))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="rahul" stroke="var(--color-rahul)" strokeWidth={2} />
                  <Line type="monotone" dataKey="priya" stroke="var(--color-priya)" strokeWidth={2} />
                  <Line type="monotone" dataKey="amit" stroke="var(--color-amit)" strokeWidth={2} />
                  <Line type="monotone" dataKey="sunita" stroke="var(--color-sunita)" strokeWidth={2} />
                  <Line type="monotone" dataKey="vikash" stroke="var(--color-vikash)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Current Month Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Current Month Performance</CardTitle>
            <CardDescription>Sales vs targets for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sales: {
                  label: "Actual Sales",
                  color: "hsl(var(--chart-1))",
                },
                target: {
                  label: "Target",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={employees.map((emp) => ({
                    name: emp.name.split(" ")[0],
                    sales: emp.monthlySales,
                    target: emp.target,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="sales" fill="var(--color-sales)" name="Actual Sales" />
                  <Bar dataKey="target" fill="var(--color-target)" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance Details</CardTitle>
          <CardDescription>Comprehensive performance metrics for all team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-foreground">Employee</th>
                  <th className="text-center p-4 font-medium text-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-foreground">Sales</th>
                  <th className="text-right p-4 font-medium text-foreground">Target</th>
                  <th className="text-right p-4 font-medium text-foreground">Revenue</th>
                  <th className="text-right p-4 font-medium text-foreground">Efficiency</th>
                  <th className="text-center p-4 font-medium text-foreground">Rating</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border hover:bg-accent">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                          <AvatarFallback>
                            {employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">{getPerformanceBadge(employee.status)}</td>
                    <td className="p-4 text-right text-foreground font-medium">{employee.monthlySales}</td>
                    <td className="p-4 text-right text-muted-foreground">{employee.target}</td>
                    <td className="p-4 text-right text-foreground">₹{employee.monthlyRevenue.toLocaleString()}</td>
                    <td className={`p-4 text-right font-medium ${getEfficiencyColor(employee.efficiency)}`}>
                      {employee.efficiency}%
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">{employee.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 mb-3">
              Employees exceeding their monthly targets and showing excellent performance.
            </p>
            <div className="space-y-2">
              {employees
                .filter((emp) => emp.status === "excellent")
                .map((emp) => (
                  <div key={emp.id} className="text-xs text-green-600 flex justify-between">
                    <span>{emp.name}</span>
                    <span>{emp.efficiency}%</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Steady Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-3">
              Consistent performers meeting expectations with room for growth.
            </p>
            <div className="space-y-2">
              {employees
                .filter((emp) => emp.status === "good")
                .map((emp) => (
                  <div key={emp.id} className="text-xs text-blue-600 flex justify-between">
                    <span>{emp.name}</span>
                    <span>{emp.efficiency}%</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Development Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 mb-3">
              Team members who would benefit from additional training and support.
            </p>
            <div className="space-y-2">
              {employees
                .filter((emp) => emp.status === "needs_improvement")
                .map((emp) => (
                  <div key={emp.id} className="text-xs text-yellow-600 flex justify-between">
                    <span>{emp.name}</span>
                    <span>{emp.efficiency}%</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EmployeePerformance

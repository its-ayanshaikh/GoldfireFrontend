"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"

const SalesAnalytics = () => {
  // Mock data for charts
  const monthlyRevenue = [
    { month: "Jan", revenue: 45000, sales: 120 },
    { month: "Feb", revenue: 52000, sales: 135 },
    { month: "Mar", revenue: 48000, sales: 128 },
    { month: "Apr", revenue: 61000, sales: 155 },
    { month: "May", revenue: 55000, sales: 142 },
    { month: "Jun", revenue: 67000, sales: 168 },
  ]

  const topProducts = [
    { name: "Smartphone", sales: 245, revenue: 245000, color: "hsl(var(--chart-1))" },
    { name: "Laptop", sales: 156, revenue: 156000, color: "hsl(var(--chart-2))" },
    { name: "Headphones", sales: 189, revenue: 94500, color: "hsl(var(--chart-3))" },
    { name: "Tablet", sales: 134, revenue: 80400, color: "hsl(var(--chart-4))" },
    { name: "Smartwatch", sales: 98, revenue: 49000, color: "hsl(var(--chart-5))" },
  ]

  const dailySales = [
    { day: "Mon", sales: 45 },
    { day: "Tue", sales: 52 },
    { day: "Wed", sales: 48 },
    { day: "Thu", sales: 61 },
    { day: "Fri", sales: 55 },
    { day: "Sat", sales: 67 },
    { day: "Sun", sales: 43 },
  ]

  const categoryBreakdown = [
    { category: "Electronics", value: 45, color: "hsl(var(--chart-1))" },
    { category: "Accessories", value: 25, color: "hsl(var(--chart-2))" },
    { category: "Clothing", value: 20, color: "hsl(var(--chart-3))" },
    { category: "Others", value: 10, color: "hsl(var(--chart-4))" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Revenue and sales count over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue (₹)",
                  color: "hsl(var(--chart-1))",
                },
                sales: {
                  label: "Sales Count",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={3}
                    name="Revenue (₹)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-sales)"
                    strokeWidth={3}
                    name="Sales Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sales: {
                  label: "Sales",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)">
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Pattern</CardTitle>
            <CardDescription>Sales distribution across the week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sales: {
                  label: "Daily Sales",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Percentage",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ category, value }) => `${category}: ${value}%`}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance Summary</CardTitle>
          <CardDescription>Detailed breakdown of top products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-foreground">Product</th>
                  <th className="text-right p-4 font-medium text-foreground">Units Sold</th>
                  <th className="text-right p-4 font-medium text-foreground">Revenue</th>
                  <th className="text-right p-4 font-medium text-foreground">Avg. Price</th>
                  <th className="text-center p-4 font-medium text-foreground">Performance</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-border hover:bg-accent">
                    <td className="p-4 font-medium text-foreground">{product.name}</td>
                    <td className="p-4 text-right text-foreground">{product.sales}</td>
                    <td className="p-4 text-right text-foreground">₹{product.revenue.toLocaleString()}</td>
                    <td className="p-4 text-right text-foreground">
                      ₹{Math.round(product.revenue / product.sales).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          index === 0
                            ? "bg-green-100 text-green-800"
                            : index === 1
                              ? "bg-blue-100 text-blue-800"
                              : index === 2
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {index === 0 ? "Excellent" : index === 1 ? "Good" : index === 2 ? "Average" : "Fair"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SalesAnalytics

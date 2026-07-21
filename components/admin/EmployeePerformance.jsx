"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { BarChart3, Loader2, Trophy, IndianRupee } from "lucide-react"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const EmployeePerformance = () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  const now = new Date()

  const [branches, setBranches] = useState([])
  const [branch, setBranch] = useState("all")
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))

  const [rows, setRows] = useState([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  })

  // Branches for the filter
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/branch/`, { headers: authHeaders() })
        if (res.ok) {
          const data = await res.json()
          setBranches(Array.isArray(data) ? data : data.results || [])
        }
      } catch (e) {
        console.error("Error loading branches:", e)
      }
    }
    fetchBranches()
  }, [])

  // Performance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (branch !== "all") params.append("branch_id", branch)
        if (month) params.append("month", month)
        if (year) params.append("year", year)

        const res = await fetch(`${API_BASE}/api/pos/employee-sales/?${params.toString()}`, {
          headers: authHeaders(),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setRows(data.results || [])
        setGrandTotal(data.grand_total || 0)
      } catch (e) {
        console.error("Error loading performance:", e)
        setError("Failed to load employee performance")
        setRows([])
        setGrandTotal(0)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branch, month, year])

  const yearOptions = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

  return (
    <div className="p-3 sm:p-6 pb-24 sm:pb-6">
      {/* Header (desktop only; mobile uses tab context) */}
      <div className="hidden sm:block mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-7 w-7" />
          Employee Performance
        </h1>
        <p className="text-muted-foreground">Sales by employee — filter by branch, month and year</p>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Branch</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total banner */}
      <Card className="mb-4 sm:mb-6 border-l-4 border-l-green-500">
        <CardContent className="p-3 sm:p-4 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Sales ({MONTHS[Number(month) - 1]} {year})</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700 flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />{Number(grandTotal).toLocaleString()}
            </p>
          </div>
          <BarChart3 className="h-8 w-8 text-green-600 opacity-30" />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="py-3 sm:py-6">
          <CardTitle className="text-base sm:text-lg">Sales by Employee</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{rows.length} employee(s) with sales</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No sales found for this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs sm:text-sm">
                    <th className="text-left p-2 sm:p-3 font-medium">#</th>
                    <th className="text-left p-2 sm:p-3 font-medium">Employee</th>
                    <th className="text-left p-2 sm:p-3 font-medium hidden sm:table-cell">Branch</th>
                    <th className="text-center p-2 sm:p-3 font-medium">Bills</th>
                    <th className="text-center p-2 sm:p-3 font-medium">Qty</th>
                    <th className="text-right p-2 sm:p-3 font-medium">Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.salesperson_id}-${r.branch_name}`} className="border-b hover:bg-accent/40 text-xs sm:text-sm">
                      <td className="p-2 sm:p-3">
                        {i === 0 ? <Trophy className="h-4 w-4 text-yellow-500" /> : i + 1}
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="font-medium text-foreground">{r.salesperson_name}</div>
                        <div className="text-[11px] text-muted-foreground sm:hidden">{r.branch_name}</div>
                      </td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell">
                        <Badge variant="outline">{r.branch_name}</Badge>
                      </td>
                      <td className="p-2 sm:p-3 text-center">{r.bills_count}</td>
                      <td className="p-2 sm:p-3 text-center">{r.total_qty}</td>
                      <td className="p-2 sm:p-3 text-right font-semibold text-green-700">₹{Number(r.total_sales).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeePerformance

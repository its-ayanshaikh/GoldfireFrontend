"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Wallet, Loader2, IndianRupee, Calendar } from "lucide-react"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const ExpensesManagement = () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  const today = new Date().toISOString().split("T")[0]

  const [branches, setBranches] = useState([])
  const [branch, setBranch] = useState("all")
  const [mode, setMode] = useState("day") // 'day' | 'month'
  const [date, setDate] = useState(today)
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))

  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  })

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

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (branch !== "all") params.append("branch_id", branch)
        if (mode === "day") {
          params.append("date", date)
        } else {
          params.append("month", month)
          params.append("year", year)
        }
        const res = await fetch(`${API_BASE}/api/pos/expenses/?${params.toString()}`, { headers: authHeaders() })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setExpenses(data.expenses || [])
        setTotal(data.total || 0)
      } catch (e) {
        console.error("Error loading expenses:", e)
        setError("Failed to load expenses")
        setExpenses([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    fetchExpenses()
  }, [branch, mode, date, month, year])

  const yearOptions = [new Date().getFullYear(), new Date().getFullYear() - 1]

  return (
    <div className="p-3 sm:p-6 pb-24 sm:pb-6">
      <div className="hidden sm:block mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-7 w-7" />
          Expenses
        </h1>
        <p className="text-muted-foreground">Daily branch expenses recorded from POS</p>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
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
              <Label className="text-xs">View</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">By Day</SelectItem>
                  <SelectItem value="month">By Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === "day" ? (
              <div className="space-y-1 col-span-2 sm:col-span-2">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total */}
      <Card className="mb-4 sm:mb-6 border-l-4 border-l-orange-500">
        <CardContent className="p-3 sm:p-4 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-700 flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />{Number(total).toLocaleString()}
            </p>
          </div>
          <Wallet className="h-8 w-8 text-orange-600 opacity-30" />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="py-3 sm:py-6">
          <CardTitle className="text-base sm:text-lg">Expense Records</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{expenses.length} expense(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No expenses found for this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs sm:text-sm">
                    <th className="text-left p-2 sm:p-3 font-medium">Date</th>
                    <th className="text-left p-2 sm:p-3 font-medium">Expense</th>
                    <th className="text-left p-2 sm:p-3 font-medium hidden sm:table-cell">Branch</th>
                    <th className="text-center p-2 sm:p-3 font-medium">Method</th>
                    <th className="text-right p-2 sm:p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-accent/40 text-xs sm:text-sm">
                      <td className="p-2 sm:p-3 whitespace-nowrap">{e.date}</td>
                      <td className="p-2 sm:p-3">
                        <div className="font-medium text-foreground">{e.name}</div>
                        <div className="text-[11px] text-muted-foreground sm:hidden">{e.branch_name}</div>
                      </td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell">
                        <Badge variant="outline">{e.branch_name}</Badge>
                      </td>
                      <td className="p-2 sm:p-3 text-center">
                        <Badge className={e.payment_method === "upi" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                          {e.payment_method?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 text-right font-semibold text-orange-700">₹{Number(e.amount).toLocaleString()}</td>
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

export default ExpensesManagement

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Calculator, Search, Filter, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useToast } from "../../hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"

const SalaryManagement = () => {
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [allSalaryData, setAllSalaryData] = useState([]) // All data from backend
  const [filteredData, setFilteredData] = useState([]) // Filtered data for display
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  // Salary Payment Dialog State
  const [selectedSalary, setSelectedSalary] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Set payment amount when salary is selected
  useEffect(() => {
    if (selectedSalary && selectedSalary.paid_amount) {
      setPaymentAmount(selectedSalary.paid_amount.toString())
    } else {
      setPaymentAmount("")
    }
  }, [selectedSalary])

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!selectedSalary || !paymentAmount) return

    try {
      setIsProcessing(true)
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      const payload = {
        salary_id: selectedSalary.id,
        paid_amount: parseFloat(paymentAmount),
        status: "paid"
      }

      console.log("Sending payment payload:", payload)

      const response = await fetch(`${API_BASE}/api/employee/salary/update-payment/`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Payment response:", data)

      // Show success message
      toast({
        title: "Success",
        description: "Payment processed successfully!",
        variant: "default"
      })

      // Close dialog and refresh data
      setSelectedSalary(null)
      setPaymentAmount("")

      // Refresh salary data
      fetchSalaryData()
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Error",
        description: "Failed to process payment: " + error.message,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Base API URL from environment variable
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // Get authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/branch/`, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Branches API Response:', data) // Debug log
        setBranches(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  // Fetch all salary data from API (without pagination)
  const fetchSalaryData = async () => {
    setLoading(true)
    try {
      // Remove pagination parameters to get all records
      let url = `${API_BASE}/api/employee/salary/?month=${selectedMonth}&year=${selectedYear}`

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Salary API Response:', data) // Debug log

        // Handle different response formats
        let allData = []
        if (Array.isArray(data)) {
          allData = data
        } else {
          allData = data.results || data.data || []
        }

        setAllSalaryData(allData)
        // Reset to first page when new data is loaded
        setCurrentPage(1)
      }
    } catch (error) {
      console.error('Error fetching salary data:', error)
      setAllSalaryData([])
    } finally {
      setLoading(false)
    }
  }

  // Filter and search data on frontend
  const filterData = () => {
    let filtered = [...allSalaryData]

    // Apply branch filter
    if (selectedBranch !== "all") {
      filtered = filtered.filter(record =>
        record.employee.branch.id.toString() === selectedBranch
      )
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(record =>
        record.employee.name.toLowerCase().includes(searchLower) ||
        record.employee.role.name.toLowerCase().includes(searchLower) ||
        record.employee.branch.name.toLowerCase().includes(searchLower)
      )
    }

    setFilteredData(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchSalaryData()
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    filterData()
  }, [allSalaryData, selectedBranch, searchTerm])

  const handleSearch = (value) => {
    setSearchTerm(value)
  }

  const handleBranchChange = (value) => {
    setSelectedBranch(value)
  }

  // Calculate pagination for filtered data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageData = filteredData.slice(startIndex, endIndex)

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-6 w-6 lg:h-8 lg:w-8" />
          Salary Management
        </h1>
        <p className="text-muted-foreground">View and manage employee salaries with automatic calculations</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>Filter employees by branch or search by name</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                  Search Employee
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="branch" className="text-sm font-medium mb-2 block">
                  Filter by Branch
                </Label>
                <Select value={selectedBranch} onValueChange={handleBranchChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="month-year" className="text-sm font-medium mb-2 block">
                  Month & Year
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(0, i).toLocaleDateString('en', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Employee Salary List</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `Showing ${currentPageData.length} of ${filteredData.length} salary records`}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Employee Salary Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-muted-foreground">Loading salary data...</div>
          </div>
        ) : currentPageData.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-muted-foreground">No salary records found</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentPageData.map((salaryRecord) => (
              <Card
                key={salaryRecord.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedSalary(salaryRecord)
                  setPaymentAmount("")
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="/placeholder-user.jpg" alt={salaryRecord.employee.name} />
                        <AvatarFallback>
                          {salaryRecord.employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{salaryRecord.employee.name}</CardTitle>
                        <CardDescription>
                          {salaryRecord.employee.role.name} • {salaryRecord.employee.branch.name}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(salaryRecord.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Salary Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Salary:</span>
                      <span className="font-medium">₹{parseFloat(salaryRecord.base_salary).toLocaleString()}</span>
                    </div>

                    {parseFloat(salaryRecord.overtime_salary) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overtime:</span>
                        <span className="font-medium text-blue-600">
                          ₹{parseFloat(salaryRecord.overtime_salary).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {parseFloat(salaryRecord.commission) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Commission:</span>
                        <span className="font-medium text-green-600">
                          ₹{parseFloat(salaryRecord.commission).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {parseFloat(salaryRecord.deduction) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deductions:</span>
                        <span className="font-medium text-red-600">
                          -₹{parseFloat(salaryRecord.deduction).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {parseFloat(salaryRecord.paid_amount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid Amount:</span>
                        <span className="font-medium text-blue-600">
                          ₹{parseFloat(salaryRecord.paid_amount).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Net Salary:</span>
                        <span className="text-green-600">
                          ₹{parseFloat(salaryRecord.gross_salary).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-accent/50 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Month/Year:</span>
                      <span>{salaryRecord.month}/{salaryRecord.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(salaryRecord.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({filteredData.length} total records)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Salary Payment Dialog */}
        {selectedSalary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex items-center justify-between pb-4">
                <div>
                  <CardTitle>Salary Payment</CardTitle>
                  <CardDescription>Process salary payment for employee</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSalary(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Employee Info */}
                <div className="space-y-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee Name</p>
                    <p className="font-semibold text-foreground text-lg">{selectedSalary.employee.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium text-foreground">{selectedSalary.employee.role.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Branch</p>
                      <p className="font-medium text-foreground">{selectedSalary.employee.branch.name}</p>
                    </div>
                  </div>
                </div>

                {/* Already Paid Info */}
                {selectedSalary.paid_amount && parseFloat(selectedSalary.paid_amount) > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-muted-foreground">Already Paid</p>
                    <p className="text-lg font-bold text-green-600">₹{parseFloat(selectedSalary.paid_amount).toLocaleString()}</p>
                  </div>
                )}

                {/* Salary Info */}
                <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Base Salary</p>
                    <p className="font-medium text-foreground">₹{(selectedSalary.base_salary ? parseFloat(selectedSalary.base_salary) : 0).toLocaleString()}</p>
                  </div>
                  {selectedSalary.overtime_salary && parseFloat(selectedSalary.overtime_salary) > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Overtime</p>
                      <p className="font-medium text-blue-600">₹{parseFloat(selectedSalary.overtime_salary).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedSalary.commission && parseFloat(selectedSalary.commission) > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="font-medium text-green-600">₹{parseFloat(selectedSalary.commission).toLocaleString()}</p>
                    </div>
                  )}
                  <div className="border-t pt-3 flex items-center justify-between">
                    <p className="font-semibold text-foreground">Net Salary</p>
                    <p className="text-2xl font-bold text-blue-600">₹{(selectedSalary.gross_salary ? parseFloat(selectedSalary.gross_salary) : 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* Payment Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="payment-amount" className="text-sm font-medium">
                    {selectedSalary.paid_amount && parseFloat(selectedSalary.paid_amount) > 0 ? "Amount Paid" : "Amount to Pay"}
                  </Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    placeholder="Enter payment amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Net Salary: ₹{(selectedSalary.gross_salary ? parseFloat(selectedSalary.gross_salary) : 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
              <div className="border-t p-4 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSalary(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || isProcessing}
                >
                  {isProcessing ? "Processing..." : "Process Payment"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalaryManagement

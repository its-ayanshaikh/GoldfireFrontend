"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { Calculator, Save, User, MapPin, Briefcase, IndianRupee, Percent, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const AddEmployeeForm = ({ onClose, editEmployee = null }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // API data states
  const [branches, setBranches] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    name: editEmployee?.name || "",
    email: editEmployee?.email || "",
    phone: editEmployee?.phone || "",
    address: editEmployee?.address || "",
    branch_id: editEmployee?.branch_id || "",
    role_id: editEmployee?.role_id || "",
    base_salary: editEmployee?.base_salary || "",
    shift_in: editEmployee?.shift_in || "09:00",
    shift_out: editEmployee?.shift_out || "18:00",
    working_hours: editEmployee?.working_hours || "9",
    overtime_multiplier: editEmployee?.overtime_multiplier || "1",
    joining_date: editEmployee?.joining_date || "",
    emergency_contact: editEmployee?.emergency_contact || "",
    status: editEmployee?.status || "active",
  })

  const [calculatedSalary, setCalculatedSalary] = useState({
    dailySalary: 0,
    hourlySalary: 0,
    monthlySalary: 0,
    overtimeHourlyRate: 0,
  })

  // Fetch branches and roles from API
  const fetchBranchesAndRoles = async () => {
    try {
      setIsLoadingData(true)
      const token = localStorage.getItem("access_token")
      
      // Fetch branches
      const branchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/branch/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: 'omit',
      })

      // Fetch roles
      const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/roles/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: 'omit',
      })

      if (branchResponse.ok && roleResponse.ok) {
        const branchData = await branchResponse.json()
        const roleData = await roleResponse.json()
        
        console.log('Branches:', branchData)
        console.log('Roles:', roleData)
        
        setBranches(branchData.results || branchData)
        setRoles(roleData.results || roleData)
      } else {
        toast({
          title: "Error",
          description: "Failed to load branches and roles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchBranchesAndRoles()
  }, [])

  // Calculate working hours from shift times
  const calculateWorkingHoursFromShift = (shiftIn, shiftOut) => {
    if (!shiftIn || !shiftOut) return 0
    
    const [inHours, inMinutes] = shiftIn.split(':').map(Number)
    const [outHours, outMinutes] = shiftOut.split(':').map(Number)
    
    let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes)
    
    // Handle overnight shifts
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60
    }
    
    return Math.round(totalMinutes / 60 * 10) / 10 // Round to 1 decimal
  }

  const handleInputChange = (field, value) => {
    let updatedData = {
      ...formData,
      [field]: value,
    }

    // Auto-calculate working hours when shift times change
    if (field === "shift_in" || field === "shift_out") {
      const shiftIn = field === "shift_in" ? value : formData.shift_in
      const shiftOut = field === "shift_out" ? value : formData.shift_out
      const calculatedHours = calculateWorkingHoursFromShift(shiftIn, shiftOut)
      updatedData.working_hours = calculatedHours.toString()
    }

    setFormData(updatedData)

    if (["base_salary", "working_hours", "overtime_multiplier", "shift_in", "shift_out"].includes(field)) {
      calculateSalary(updatedData)
    }
  }

  const calculateSalary = (data) => {
    const baseSalary = Number.parseFloat(data.base_salary) || 0
    const workingDays = 26 // Fixed working days per month
    const workingHours = Number.parseFloat(data.working_hours) || 8
    const overtimeRate = Number.parseFloat(data.overtime_multiplier) || 1.5

    if (baseSalary > 0) {
      const dailySalary = baseSalary / workingDays
      const hourlySalary = dailySalary / workingHours
      const overtimeHourlyRate = hourlySalary * overtimeRate

      setCalculatedSalary({
        dailySalary: Math.round(dailySalary),
        hourlySalary: Math.round(hourlySalary),
        monthlySalary: Math.round(baseSalary),
        overtimeHourlyRate: Math.round(overtimeHourlyRate),
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (!formData.name || !formData.phone || !formData.branch_id || !formData.role_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      
      // Prepare API data
      const apiData = {
        branch_id: parseInt(formData.branch_id),
        role_id: parseInt(formData.role_id),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emergency_contact: formData.emergency_contact,
        joining_date: formData.joining_date,
        base_salary: formData.base_salary,
        shift_in: formData.shift_in,
        shift_out: formData.shift_out,
        overtime_multiplier: formData.overtime_multiplier,
        working_hours: parseFloat(formData.working_hours),
        status: formData.status
      }

      // Determine if this is create or update
      const isEdit = editEmployee && editEmployee.id
      const url = isEdit 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/update/${editEmployee.id}/`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employee/create/`
      const method = isEdit ? "PUT" : "POST"

      console.log(isEdit ? 'Updating employee with data:' : 'Creating employee with data:', apiData)

      const response = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        const data = await response.json()
        console.log(isEdit ? 'Employee updated:' : 'Employee created:', data)
        
        toast({
          title: "Success",
          description: isEdit 
            ? `${formData.name} has been updated successfully!`
            : `${formData.name} has been added successfully!`,
        })

        if (onClose) {
          onClose()
        } else {
          // Reset form
          setFormData({
            name: "",
            email: "",
            phone: "",
            address: "",
            branch_id: "",
            role_id: "",
            base_salary: "",
            shift_in: "09:00",
            shift_out: "18:00",
            working_hours: "9",
            overtime_multiplier: "1.5",
            joining_date: "",
            emergency_contact: "",
            status: "active",
          })
          setCalculatedSalary({
            dailySalary: 0,
            hourlySalary: 0,
            monthlySalary: 0,
            overtimeHourlyRate: 0,
          })
        }
      } else {
        const errorData = await response.json()
        console.error('Error creating employee:', errorData)
        toast({
          title: "Error",
          description: errorData.message || (isEdit ? "Failed to update employee" : "Failed to create employee"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(isEdit ? 'Error updating employee:' : 'Error creating employee:', error)
      toast({
        title: "Error",
        description: isEdit ? "Failed to update employee. Please try again." : "Failed to create employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRole = roles.find((role) => role.id === parseInt(formData.role_id))
  const selectedBranch = branches.find((branch) => branch.id === parseInt(formData.branch_id))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gray-900 rounded-xl">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editEmployee ? "Edit Employee" : "Add New Employee"}
            </h1>
            <p className="text-gray-600 text-lg">
              {editEmployee
                ? "Update employee information and salary details"
                : "Complete the form to add a new team member"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-gray-900">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  Personal Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Basic employee details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter full name"
                      disabled={isLoading}
                      required
                      className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter email address"
                      disabled={isLoading}
                      className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                      disabled={isLoading}
                      required
                      className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joining_date" className="text-sm font-medium text-gray-700">Joining Date *</Label>
                    <Input
                      id="joining_date"
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => handleInputChange("joining_date", e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter complete address"
                    disabled={isLoading}
                    rows={2}
                    className="border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Job Information */}
            <Card className="mt-6 border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-gray-900">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-gray-600" />
                  </div>
                  Job Information
                </CardTitle>
                <CardDescription className="text-gray-600">Branch assignment and role details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-sm font-medium text-gray-700">Branch *</Label>
                    <Select
                      value={formData.branch_id.toString()}
                      onValueChange={(value) => handleInputChange("branch_id", value)}
                      disabled={isLoading || isLoadingData}
                    >
                      <SelectTrigger className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400">
                        <SelectValue placeholder={isLoadingData ? "Loading branches..." : "Select branch"} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">{branch.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedBranch && (
                      <Badge variant="outline" className="mt-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        {selectedBranch.name}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role_id.toString()}
                      onValueChange={(value) => handleInputChange("role_id", value)}
                      disabled={isLoading || isLoadingData}
                    >
                      <SelectTrigger className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400">
                        <SelectValue placeholder={isLoadingData ? "Loading roles..." : "Select role"} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{role.name}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedRole && (
                      <Badge variant="outline" className="mt-2">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {selectedRole.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional notes about the employee"
                    disabled={isLoading}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary Information */}
          <div>
            <Card className="sticky top-6 border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-gray-900">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <IndianRupee className="h-5 w-5 text-gray-600" />
                  </div>
                  Salary Configuration
                </CardTitle>
                <CardDescription className="text-gray-600">Set base salary and calculate rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="baseSalary" className="text-sm font-medium text-gray-700">Base Monthly Salary (₹) *</Label>
                  <Input
                    id="base_salary"
                    type="number"
                    value={formData.base_salary}
                    onChange={(e) => handleInputChange("base_salary", e.target.value)}
                    placeholder="Enter base salary"
                    disabled={isLoading}
                    className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                    required
                  />
                </div>

                {/* Shift Timings */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Shift Timings (24-hour format)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="shift_in" className="text-xs text-gray-500">Shift In</Label>
                      <Input
                        id="shift_in"
                        type="text"
                        pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                        placeholder="09:00"
                        value={formData.shift_in}
                        onChange={(e) => handleInputChange("shift_in", e.target.value)}
                        disabled={isLoading}
                        className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="shift_out" className="text-xs text-gray-500">Shift Out</Label>
                      <Input
                        id="shift_out"
                        type="text"
                        pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                        placeholder="18:00"
                        value={formData.shift_out}
                        onChange={(e) => handleInputChange("shift_out", e.target.value)}
                        disabled={isLoading}
                        className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Format: HH:MM (e.g., 09:00, 18:00, 22:30)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="working_hours" className="text-sm font-medium text-gray-700">Working Hours/Day</Label>
                    <Input
                      id="working_hours"
                      type="number"
                      step="0.5"
                      value={formData.working_hours}
                      onChange={(e) => handleInputChange("working_hours", e.target.value)}
                      placeholder="9"
                      disabled={isLoading}
                      className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Auto-calculated from shift</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime_multiplier" className="text-sm font-medium text-gray-700">Overtime Multiplier</Label>
                    <Input
                      id="overtime_multiplier"
                      type="number"
                      step="0.1"
                      value={formData.overtime_multiplier}
                      onChange={(e) => handleInputChange("overtime_multiplier", e.target.value)}
                      placeholder="1"
                      disabled={isLoading}
                      className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact" className="text-sm font-medium text-gray-700">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                    placeholder="Emergency contact number"
                    disabled={isLoading}
                    className="h-10 border border-gray-200 hover:border-gray-300 focus:border-gray-400"
                  />
                </div>

                {selectedRole?.hasCommission && (
                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      value={formData.commissionRate}
                      onChange={(e) => handleInputChange("commissionRate", e.target.value)}
                      placeholder="2.5"
                      disabled={isLoading}
                    />
                  </div>
                )}

                {calculatedSalary.monthlySalary > 0 && (
                  <div className="mt-6 p-4 bg-accent rounded-lg">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Calculated Rates
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shift Timing:</span>
                        <span className="font-medium">{formData.shift_in} - {formData.shift_out}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Working Hours:</span>
                        <span className="font-medium">{formData.working_hours} hrs/day</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-muted-foreground">Monthly Salary:</span>
                        <span className="font-medium">₹{calculatedSalary.monthlySalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily Salary:</span>
                        <span className="font-medium">₹{calculatedSalary.dailySalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hourly Rate:</span>
                        <span className="font-medium">₹{calculatedSalary.hourlySalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overtime Rate:</span>
                        <span className="font-medium text-green-600">
                          ₹{calculatedSalary.overtimeHourlyRate.toLocaleString()}
                        </span>
                      </div>
                      {selectedRole?.hasCommission && formData.commissionRate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commission:</span>
                          <span className="font-medium text-blue-600">{formData.commissionRate}% per sale</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="px-6 py-2 h-11 border-2 border-gray-300 hover:border-gray-400"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-2 h-11 bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {editEmployee ? "Updating..." : "Adding..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editEmployee ? "Update Employee" : "Add Employee"}
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddEmployeeForm

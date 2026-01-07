"use client"

import { useState, useEffect } from "react"

const SalespersonSelect = ({ value, onChange }) => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [branchName, setBranchName] = useState("")

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/employees/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Employees data:', data)

          if (data.success && data.employees) {
            setEmployees(data.employees)
            setBranchName(data.branch || "")
          }
        } else {
          console.error('Failed to fetch employees:', response.status)
        }
      } catch (error) {
        console.error('Error fetching employees:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  return (
    <div className="min-w-48">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
        disabled={loading}
      >
        <option value="">
          {loading ? "Loading employees..." : "Select Salesperson"}
        </option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
      {branchName && (
        <div className="text-xs text-gray-500 mt-1">
          Branch: {branchName}
        </div>
      )}
    </div>
  )
}

export default SalespersonSelect

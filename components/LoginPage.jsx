"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"
import { Eye, EyeOff } from "lucide-react"
import InstallPrompt from "./InstallPrompt"


const LoginPage = ({ onLogin }) => {
  // Base API URL from environment variable (NEXT_PUBLIC_ so it's available in the browser)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  
  console.log('API_BASE:', API_BASE) // Debug log to check if env var is loaded
  
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const apiUrl = `${API_BASE}/api/account/login/`
      console.log('Making API call to:', apiUrl) // Debug log
      console.log('Request payload:', { username: credentials.username, password: '***' }) // Debug log (password hidden)
      
      // Call your Django API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      })
      
      console.log('Response status:', response.status) // Debug log
      console.log('Response ok:', response.ok) // Debug log

      const data = await response.json()

      if (response.ok) {
        // API response: { message, user: { id, username, user_type, branch, paid_leave_requested, paid_leave_status, is_on_leave_today, shift_in, shift_out }, tokens }
        const userData = {
          id: data.user.id,
          username: data.user.username,
          user_type: data.user.user_type,
          branch: data.user.branch,
          name: data.user.username, // Using username as name, modify if needed
          paid_leave_requested: data.user.paid_leave_requested || false,
          paid_leave_status: data.user.paid_leave_status || null,
          is_on_leave_today: data.user.is_on_leave_today || false,
          shift_in: data.user.shift_in || null, // 24 hour format e.g. "09:00"
          shift_out: data.user.shift_out || null, // 24 hour format e.g. "18:00"
        }
        
        // Store tokens in localStorage for future API calls
        if (data.tokens) {
          localStorage.setItem('access_token', data.tokens.access)
          localStorage.setItem('refresh_token', data.tokens.refresh)
          localStorage.setItem('branch', data.user.branch)
        }
        
        // Request location permission after successful login
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Location permission granted:', position.coords)
            },
            (error) => {
              console.warn('Location permission denied or error:', error.message)
            },
            { enableHighAccuracy: true }
          )
        }
        
        onLogin(userData)
      } else {
        setError(data.message || "Invalid credentials")
      }
    } catch (err) {
      setError("Login failed. Please check your connection and try again.")
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <InstallPrompt />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

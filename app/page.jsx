"use client"

import { useEffect, useState } from "react"
import LoginPage from "../components/LoginPage"
import AdminRouter from "../components/admin/AdminRouter"
import POSRouter from "../components/POSRouter"
import EmployeeRouter from "../components/employee/EmployeeRouter"
import SubadminDashboard from "../components/subadmin/SubadminDashboard"
import InstallPrompt from "../components/InstallPrompt"

export default function Home() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // When component mounts, try auto-login from localStorage
  useEffect(() => {
    const checkAuthStatus = async () => {
      const access = localStorage.getItem("access_token")
      const refresh = localStorage.getItem("refresh_token")

      if (access && refresh) {
        try {
          // Option A: verify token quickly via backend
          const res = await fetch(`${API_BASE}/api/account/profile/`, {
            headers: {
              "Authorization": `Bearer ${access}`,
            },
          })
          
          if (res.ok) {
            const data = await res.json()
            setUser(data)
            setIsAuthenticated(true)

            console.log('User authenticated:', data)
            
            setIsLoading(false)
          } else {
            // token expired → try refresh
            await handleTokenRefresh(refresh)
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          setIsLoading(false)
        }
      } else {
        // No tokens found
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const handleTokenRefresh = async (refresh) => {
    try {
      const res = await fetch(`${API_BASE}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem("access_token", data.access)
        // ✅ try verifying again
        const verify = await fetch(`${API_BASE}/api/account/profile/`, {
          headers: { Authorization: `Bearer ${data.access}` },
        })
        const userData = await verify.json()
        setUser(userData)
        setIsAuthenticated(true)
        
        console.log('Token refreshed, user authenticated:', userData)
        
        setIsLoading(false)
      } else {
        handleLogout()
      }
    } catch {
      handleLogout()
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (userData) => {
    console.log('handleLogin called with:', userData)
    setUser(userData)
    setIsAuthenticated(true)
    setIsLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    setUser(null)
    setIsAuthenticated(false)
  }

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          {/* GOLDFIRE Typography Animation */}
          <div className="flex justify-center items-center space-x-1 text-6xl font-normal text-black tracking-tight">
            <span className="animate-pulse" style={{animationDelay: '0ms'}}>G</span>
            <span className="animate-pulse" style={{animationDelay: '50ms'}}>O</span>
            <span className="animate-pulse" style={{animationDelay: '100ms'}}>L</span>
            <span className="animate-pulse" style={{animationDelay: '150ms'}}>D</span>
            <span className="animate-pulse" style={{animationDelay: '200ms'}}>F</span>
            <span className="animate-pulse" style={{animationDelay: '250ms'}}>I</span>
            <span className="animate-pulse" style={{animationDelay: '300ms'}}>R</span>
            <span className="animate-pulse" style={{animationDelay: '350ms'}}>E</span>
            <sup className="text-2xl animate-pulse" style={{animationDelay: '400ms'}}>®</sup>
          </div>
          
          {/* Simple loading dots */}
          <div className="flex justify-center space-x-1 mt-8">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, showing login page')
    return <LoginPage onLogin={handleLogin} />
  }

  console.log('Rendering app for user:', user)

  if (user?.user_type === "admin") {
    return (
      <>
        <InstallPrompt />
        <AdminRouter user={user} onLogout={handleLogout} />
      </>
    )
  }

  if (user?.user_type === "subadmin") {
    return (
      <>
        <InstallPrompt />
        <SubadminDashboard user={user} onLogout={handleLogout} />
      </>
    )
  }

  if (user?.user_type === "employee") {
    return (
      <>
        <InstallPrompt />
        <EmployeeRouter user={user} onLogout={handleLogout} />
      </>
    )
  }

  // For POS users, use POSRouter
  return (
    <>
      <InstallPrompt />
      <POSRouter user={user} onLogout={handleLogout} />
    </>
  )
}

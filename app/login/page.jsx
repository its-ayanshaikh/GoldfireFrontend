"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Login() {
  const router = useRouter()

  // Always redirect to main page - login is handled there
  useEffect(() => {
    router.push("/")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    </div>
  )
}
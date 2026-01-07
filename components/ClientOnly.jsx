"use client"
import { useEffect, useState } from 'react'

const ClientOnly = ({ children, fallback }) => {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          {/* GOLDFIRE Typography Animation */}
          <div className="flex justify-center items-center space-x-1 text-6xl font-normal text-black tracking-tight">
            <span className="animate-pulse" style={{animationDelay: '0ms'}}>G</span>
            <span className="animate-pulse" style={{animationDelay: '200ms'}}>O</span>
            <span className="animate-pulse" style={{animationDelay: '400ms'}}>L</span>
            <span className="animate-pulse" style={{animationDelay: '600ms'}}>D</span>
            <span className="animate-pulse" style={{animationDelay: '800ms'}}>F</span>
            <span className="animate-pulse" style={{animationDelay: '1000ms'}}>I</span>
            <span className="animate-pulse" style={{animationDelay: '1200ms'}}>R</span>
            <span className="animate-pulse" style={{animationDelay: '1400ms'}}>E</span>
            <sup className="text-2xl animate-pulse" style={{animationDelay: '1600ms'}}>®</sup>
          </div>
          
          {/* Loading message */}
          <div className="mt-8">
            <p className="text-gray-600 text-lg">Initializing...</p>
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default ClientOnly
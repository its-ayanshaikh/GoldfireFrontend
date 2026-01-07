"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, ScanLine, X } from "lucide-react"

const SearchBar = ({ onProductSelect, selectedBranch, withBarcodeScanner }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanningMessage, setScanningMessage] = useState("Position barcode in the camera view")
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Barcode scanner detection
  const [barcodeBuffer, setBarcodeBuffer] = useState("")
  const [lastKeyTime, setLastKeyTime] = useState(0)

  // Debouncing
  const debounceTimeoutRef = useRef(null)

  // Keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)

  // Clean barcode function - removes various "Enter" variations that barcode guns add
  const cleanBarcode = (value) => {
    if (!value) return value

    return value
      .replace(/Enter/gi, '')      // Remove "Enter" anywhere (global, case-insensitive)
      .replace(/\r?\n/g, '')       // Remove actual newline characters (global)
      .replace(/\r/g, '')          // Remove carriage return (global)
      .replace(/\u000D/g, '')      // Remove carriage return unicode (global)
      .replace(/\u000A/g, '')      // Remove line feed unicode (global)
      .replace(/\u0013/g, '')      // Remove device control 3
      .replace(/\u0010/g, '')      // Remove device control 0
      .trim()                      // Remove whitespace
  }

  // API search function
  const searchProducts = useCallback(async (query) => {
    // Clean the query - remove "Enter" text that barcode guns add
    const cleanQuery = cleanBarcode(query)

    if (!cleanQuery || cleanQuery.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/search-products/?q=${encodeURIComponent(cleanQuery)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Search results:', data)

        // Handle different response formats
        let transformedProducts = []

        if (data.success && data.products && Array.isArray(data.products)) {
          // New API response format - all products have direct fields
          transformedProducts = data.products.map(product => ({
            id: product.id || product.product_id,
            name: product.name || product.product_name,
            price: parseFloat(product.selling_price) || 0,
            barcode: product.barcode || "",
            qty: product.qty || 0,
            gst: product.gst || product.hsn || { cgst: 9, sgst: 9, igst: 18 },
            isWarrantyItem: product.is_warranty_item || false,
            warrantyPeriod: product.warranty_period,
            hsnCode: product.hsn_code || product.hsn?.hsn_code,
            serialNumber: product.serial_number,
            serialNumbers: product.serial_numbers || [],
            searchType: product.search_type || "regular",
            brand: product.brand || "",
            model: product.model || "",
            rack: product.rack || ""
          }))

          console.log('SearchBar - Transformed products:', transformedProducts)
        }

        setSuggestions(transformedProducts)
      } else {
        console.error('Search API failed:', response.status)
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error searching products:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchProducts(query)
    }, 500) // 500ms delay
  }, [searchProducts])

  const handleSearch = (value) => {
    // Clean the search term - remove "Enter" text and trim whitespace
    const cleanValue = cleanBarcode(value)

    setSearchTerm(cleanValue)
    setSelectedIndex(-1) // Reset selection when searching

    // Check if it looks like a barcode (8+ characters, alphanumeric with dashes)
    const barcodePattern = /^[A-Z0-9\-]{8,}$/i
    const isBarcode = barcodePattern.test(cleanValue)

    if (cleanValue.length > 0) {
      if (isBarcode && cleanValue.length >= 8) {
        // If it looks like a barcode, don't show search suggestions
        // The barcode detection in handleSearchInput will handle it
        console.log('Detected barcode pattern, skipping search suggestions:', cleanValue)
        setSuggestions([])
        setSelectedIndex(-1)
        // Clear any pending search
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
      } else {
        // Regular search for product names
        debouncedSearch(cleanValue)
      }
    } else {
      setSuggestions([])
      setSelectedIndex(-1)
      // Clear any pending search
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleProductSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setSuggestions([])
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Barcode scanner input detection with keyboard navigation
  const handleSearchInput = (e) => {
    const currentTime = Date.now()
    const timeDiff = currentTime - lastKeyTime

    // If time between keystrokes is very small (< 50ms), it's likely a barcode scanner
    if (timeDiff < 50 && barcodeBuffer.length > 0) {
      setBarcodeBuffer(prev => prev + e.target.value.slice(-1))
    } else {
      setBarcodeBuffer(e.target.value.slice(-1))
    }

    setLastKeyTime(currentTime)
    handleSearch(e.target.value)

    // Auto-select if it looks like a complete barcode scan
    if (e.target.value.length >= 8 && timeDiff < 50) {
      // Immediately clear any existing search results
      setSuggestions([])
      setSelectedIndex(-1)

      setTimeout(async () => {
        // Clean the barcode - remove "Enter" text that barcode guns add
        const barcode = cleanBarcode(e.target.value)
        console.log('SearchBar - Barcode scanned:', barcode)

        // Search for product by barcode using API
        try {
          const token = localStorage.getItem('access_token')
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/search-products/?q=${encodeURIComponent(barcode)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'omit',
          })

          if (response.ok) {
            const data = await response.json()
            console.log('SearchBar - Barcode API response:', data)

            if (data.success && data.products && data.products.length > 0) {
              const product = data.products.find(p => p.barcode === barcode)
              if (product) {
                // Use the new API response format
                const transformedProduct = {
                  id: product.id || product.product_id,
                  name: product.name || product.product_name,
                  price: parseFloat(product.selling_price) || 0,
                  barcode: product.barcode,
                  qty: product.qty || 0,
                  gst: product.gst || { cgst: 9, sgst: 9, igst: 18 },
                  isWarrantyItem: product.is_warranty_item || false,
                  warrantyPeriod: product.warranty_period,
                  hsnCode: product.hsn_code,
                  serialNumber: product.serial_number,
                  serialNumbers: product.serial_numbers || [],
                  searchType: product.search_type || "barcode",
                  brand: product.brand || "",
                  model: product.model || "",
                  rack: product.rack || ""
                }

                console.log('SearchBar - Transformed barcode product:', transformedProduct)

                // Clear search results immediately before adding to cart
                setSuggestions([])
                setSearchTerm("")
                setSelectedIndex(-1)

                // Clear the input field
                if (inputRef.current) {
                  inputRef.current.value = ""
                }

                // Directly add to cart instead of showing search results
                handleProductSelect(transformedProduct)
              }
            }
          }
        } catch (error) {
          console.error('Error searching barcode:', error)
        }
      }, 100)
    }
  }

  // Combined input handler that includes keyboard navigation
  const handleInputChange = (e) => {
    // Clean the input value immediately - remove "Enter" text that barcode guns add
    const originalValue = e.target.value
    const cleanValue = cleanBarcode(originalValue)

    // If the value was cleaned (had "Enter"), update the input field immediately
    if (originalValue !== cleanValue) {
      e.target.value = cleanValue
    }

    if (withBarcodeScanner) {
      // Create a new event object with cleaned value for barcode scanner
      const cleanEvent = {
        ...e,
        target: {
          ...e.target,
          value: cleanValue
        }
      }
      handleSearchInput(cleanEvent)
    } else {
      handleSearch(cleanValue)
    }
  }

  const handleProductSelect = (product) => {
    onProductSelect(product)
    setSearchTerm("")
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera for better barcode scanning
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        const handleVideoReady = () => {
          setCameraReady(true)
          setIsScanning(true)
          setScanningMessage("Scanning for barcodes...")
        }

        videoRef.current.addEventListener("loadedmetadata", handleVideoReady)
        videoRef.current.addEventListener("canplay", handleVideoReady)

        // Fallback timeout
        setTimeout(() => {
          if (!cameraReady) {
            setCameraReady(true)
            setIsScanning(true)
            setScanningMessage("Scanning for barcodes...")
          }
        }, 3000)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  const handleVideoClick = () => {
    if (isScanning) {
      setScanningMessage("Scanning... Please position barcode clearly in the frame")
      // Real barcode detection would happen here with a barcode scanning library
      // For now, no automatic product selection
    }
  }

  const handleBarcodeDetected = async (barcode) => {
    // Clean the barcode - remove "Enter" text that barcode guns add
    const cleanedBarcode = cleanBarcode(barcode)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/search-products/?q=${encodeURIComponent(cleanedBarcode)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.products && data.products.length > 0) {
          const product = data.products.find(p => p.barcode === barcode)
          if (product) {
            const transformedProduct = {
              id: product.product__id,
              name: product.product__name,
              price: parseFloat(product.product__selling_price),
              barcode: product.barcode,
              qty: product.qty,
              gst: 18,
              isWarrantyItem: product.product__is_warranty_item,
              warrantyPeriod: product.product__warranty_period,
              brand: product.brand || "",
              model: product.model || "",
              rack: product.rack || ""
            }
            setScanningMessage(`Barcode detected: ${transformedProduct.name}`)
            setSearchTerm(transformedProduct.name)
            handleProductSelect(transformedProduct)
            setTimeout(() => {
              closeCamera()
            }, 1500)
            return
          }
        }
      }

      setScanningMessage("Barcode not found in inventory")
      setTimeout(() => {
        setScanningMessage("Scanning for barcodes...")
      }, 2000)
    } catch (error) {
      console.error('Error searching barcode:', error)
      setScanningMessage("Error searching barcode")
      setTimeout(() => {
        setScanningMessage("Scanning for barcodes...")
      }, 2000)
    }
  }

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    setShowCamera(false)
    setCameraReady(false)
    setIsScanning(false)
    setScanningMessage("Position barcode in the camera view")
  }

  const handleBarcodeScanner = () => {
    setShowCamera(true)
    setCameraReady(false)
    startCamera()
  }

  // Monitor searchTerm for "Enter" and clean it immediately
  useEffect(() => {
    if (searchTerm && (searchTerm.includes('Enter') || searchTerm.includes('enter') || searchTerm.includes('ENTER'))) {
      const cleaned = cleanBarcode(searchTerm)
      console.log('Cleaning searchTerm:', { original: searchTerm, cleaned }) // Debug log
      if (cleaned !== searchTerm) {
        setSearchTerm(cleaned)
        if (inputRef.current) {
          inputRef.current.value = cleaned
        }
      }
    }
  }, [searchTerm])

  // Add a polling mechanism to catch any "Enter" that might slip through
  useEffect(() => {
    const interval = setInterval(() => {
      if (inputRef.current && inputRef.current.value) {
        const currentValue = inputRef.current.value
        const cleanValue = cleanBarcode(currentValue)
        if (currentValue !== cleanValue) {
          console.log('Polling cleanup:', { original: currentValue, cleaned: cleanValue }) // Debug log
          inputRef.current.value = cleanValue
          setSearchTerm(cleanValue)
          handleSearch(cleanValue)
        }
      }
    }, 100) // Check every 100ms

    return () => clearInterval(interval)
  }, [])



  useEffect(() => {
    return () => {
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      // Cleanup debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedBranch ? "Search products by name or barcode... (Use ↑↓ to navigate, Enter to add)" : "Select branch first..."}
          value={searchTerm}
          onChange={handleInputChange}
          onInput={(e) => {
            // Immediately clean any "Enter" text that gets typed
            const originalValue = e.target.value
            const cleanValue = cleanBarcode(originalValue)

            console.log('Input detected:', { original: originalValue, cleaned: cleanValue }) // Debug log

            if (originalValue !== cleanValue) {
              e.target.value = cleanValue
              setSearchTerm(cleanValue)
              // Trigger search with cleaned value
              handleSearch(cleanValue)
            }
          }}
          onKeyPress={(e) => {
            // Prevent Enter key from being processed
            if (e.key === 'Enter' && suggestions.length === 0) {
              e.preventDefault()
              return false
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={!selectedBranch}
          autoComplete="off"
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleBarcodeScanner}
          disabled={!selectedBranch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors disabled:cursor-not-allowed disabled:hover:text-gray-400"
        >
          <ScanLine size={20} />
        </button>
      </div>

      {(suggestions.length > 0 || loading) && selectedBranch && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-80 sm:max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                Searching products...
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((product, index) => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 last:border-b-0 transition-colors ${index === selectedIndex
                  ? "bg-blue-50 border-blue-200"
                  : "hover:bg-gray-50"
                  }`}
              >
                <div className="font-medium text-sm sm:text-base mb-1">{product.name}</div>
                <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <div className="flex flex-wrap items-center gap-1">
                    {product.brand && (
                      <span className="text-gray-600">{product.brand}</span>
                    )}
                    {product.brand && product.model && <span>•</span>}
                    {product.model && (
                      <span className="text-gray-600">{product.model}</span>
                    )}
                    {(product.brand || product.model) && product.barcode && <span>•</span>}
                    {product.barcode && (
                      <span className="text-gray-600 font-mono text-xs">{product.barcode}</span>
                    )}
                    <span className="font-semibold text-gray-800">₹{product.price.toLocaleString()}</span>
                    {product.rack && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        📍 {product.rack}
                      </span>
                    )}
                    {product.isWarrantyItem && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        Warranty: {product.warrantyPeriod || 'N/A'}
                      </span>
                    )}
                    {product.searchType === "serial_number" && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                        SN: {product.serialNumber}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${product.qty > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                    Stock: {product.qty}
                  </span>
                </div>
                {index === selectedIndex && (
                  <div className="text-xs text-blue-600 mt-1">
                    Press Enter to add to cart
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              No products found
            </div>
          )}
        </div>
      )}

      {/* Camera Modal for Barcode Scanning */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Barcode Scanner</h3>
              <button
                onClick={closeCamera}
                className="text-gray-400 hover:text-gray-600 p-2 -m-2"
                aria-label="Close scanner"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                {!cameraReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                    <span className="text-sm">Starting camera...</span>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onClick={handleVideoClick}
                  onTouchStart={handleVideoClick}
                  className={`w-full h-full object-cover cursor-pointer ${cameraReady ? "block" : "hidden"}`}
                />

                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-red-500 w-3/4 h-1/2 rounded-lg">
                      <div className="w-full h-0.5 bg-red-500 animate-pulse mt-1/2"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center text-sm text-gray-600 mb-4">{scanningMessage}</div>

              <button
                onClick={closeCamera}
                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-base"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar

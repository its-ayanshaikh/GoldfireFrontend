"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, X, Edit3, Check } from "lucide-react"

const CartItem = ({ item, onUpdateQuantity, onRemove, compact = false, gstEnabled = false, onSerialUpdate, onSalespersonUpdate }) => {
  const [serialInput, setSerialInput] = useState("")
  const [barcodeBuffer, setBarcodeBuffer] = useState("")
  const [lastKeyTime, setLastKeyTime] = useState(0)
  const [showSerialInput, setShowSerialInput] = useState(false)
  const [employees, setEmployees] = useState([])

  // Initialize serial numbers array if not exists
  const serialNumbers = item.serialNumbers || []

  // Fetch employees from API
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
          if (data.success && data.employees) {
            setEmployees(data.employees)
          }
        }
      } catch (error) {
        console.error('Error fetching employees:', error)
      }
    }

    fetchEmployees()
  }, [])

  const inclusivePrice = item.price * item.quantity

  // Calculate GST only for serial number items when GST is enabled
  let basePrice = inclusivePrice
  let gstAmount = 0
  let gstRate = 0

  if (gstEnabled && item.serialNumber) {
    // Handle GST object or number
    gstRate = typeof item.gst === 'object'
      ? (item.gst?.igst || (item.gst?.cgst + item.gst?.sgst) || 18)
      : (item.gst || 18)

    // Calculate base price from inclusive price using formula
    basePrice = (inclusivePrice * 100) / (100 + gstRate)
    gstAmount = inclusivePrice - basePrice
  }

  // Handle barcode scanner input for serial number
  const handleSerialInput = (e) => {
    const currentTime = Date.now()
    const timeDiff = currentTime - lastKeyTime

    // If time between keystrokes is very small (< 50ms), it's likely a barcode scanner
    if (timeDiff < 50 && barcodeBuffer.length > 0) {
      setBarcodeBuffer(prev => prev + e.target.value.slice(-1))
    } else {
      setBarcodeBuffer(e.target.value.slice(-1))
    }

    setLastKeyTime(currentTime)
    setSerialInput(e.target.value)

    // Auto-save if it looks like a complete barcode scan
    if (e.target.value.length >= 6 && timeDiff < 50) {
      setTimeout(() => {
        const scannedSerial = e.target.value.trim()
        if (scannedSerial) {
          handleSerialSave(scannedSerial)
        }
      }, 100)
    }
  }

  const handleSerialSave = (serial = serialInput) => {
    const trimmedSerial = serial.trim()
    if (trimmedSerial && onSerialUpdate) {
      // Add serial to array instead of replacing
      const updatedSerials = [...serialNumbers, trimmedSerial]
      onSerialUpdate(item, updatedSerials)
    }
    setSerialInput("")
    setShowSerialInput(false)
  }

  const removeSerial = (indexToRemove) => {
    if (onSerialUpdate) {
      const updatedSerials = serialNumbers.filter((_, index) => index !== indexToRemove)
      onSerialUpdate(item, updatedSerials)
    }
  }

  const handleSerialKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSerialSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSerialInput(item.serialNumber || "")
      setShowSerialInput(false)
    }
  }

  if (compact) {
    return (
      <div className="bg-white rounded-md p-2 border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-xs truncate flex-1">{item.name}</h3>
              {/* Salesperson Selection - Top Right */}
              <select
                value={item.salespersonId || ""}
                onChange={(e) => onSalespersonUpdate && onSalespersonUpdate(item, e.target.value)}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white h-6 ml-2 min-w-0 w-auto"
                style={{ maxWidth: '80px' }}
              >
                <option value="">SP</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500">
              ₹{item.price.toLocaleString()} × {item.quantity}
            </p>
            {/* Serial Number Section */}
            {item.isWarrantyItem && (
              <div className="mt-1">
                {showSerialInput ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={serialInput}
                      onChange={handleSerialInput}
                      onKeyDown={handleSerialKeyDown}
                      placeholder="Type or scan serial..."
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-black"
                      autoComplete="off"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSerialSave()}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      <Check size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">Serials ({serialNumbers.length}):</span>
                      <button
                        onClick={() => setShowSerialInput(true)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Add Serial Number"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    {serialNumbers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {serialNumbers.map((serial, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                            {serial}
                            <button
                              onClick={() => removeSerial(index)}
                              className="text-green-600 hover:text-red-600"
                            >
                              <X size={8} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No Serials</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onUpdateQuantity(item, item.quantity - 1)}
              className="w-6 h-6 rounded bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Minus size={10} />
            </button>
            <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item, item.quantity + 1)}
              className="w-6 h-6 rounded bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Plus size={10} />
            </button>
            <button onClick={() => onRemove(item)} className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors ml-1">
              <X size={12} />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          {gstEnabled && item.serialNumber && gstAmount > 0 && (
            <span className="text-xs text-blue-600">GST: ₹{gstAmount.toFixed(2)} ({gstRate}%)</span>
          )}
          <span className="font-semibold text-sm">₹{inclusivePrice.toFixed(0)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex-1">{item.name}</h3>
            {/* Salesperson Selection - Top Right */}
            <select
              value={item.salespersonId || ""}
              onChange={(e) => onSalespersonUpdate && onSalespersonUpdate(item, e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white h-8 mr-3 min-w-0"
              style={{ maxWidth: '120px' }}
            >
              <option value="">Salesperson</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">
            {item.brand && `${item.brand} • `}
            {item.model && `${item.model}`}
          </p>
          {/* Serial Number Section */}
          {item.isWarrantyItem && (
            <div className="mt-2">
              {showSerialInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serialInput}
                    onChange={handleSerialInput}
                    onKeyDown={handleSerialKeyDown}
                    placeholder="Type or scan serial number..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSerialSave()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Serial Numbers ({serialNumbers.length}):</span>
                    <button
                      onClick={() => setShowSerialInput(true)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Add Serial Number"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {serialNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {serialNumbers.map((serial, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {serial}
                          <button
                            onClick={() => removeSerial(index)}
                            className="text-green-600 hover:text-red-600"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No Serial Numbers Added</span>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-sm font-medium">₹{item.price.toLocaleString()}</p>
          {gstEnabled && item.serialNumber && gstAmount > 0 && (
            <p className="text-xs text-blue-600 font-medium">
              Base: ₹{basePrice.toFixed(2)} + GST: ₹{gstAmount.toFixed(2)} ({gstRate}%)
            </p>
          )}
        </div>
        <button onClick={() => onRemove(item)} className="text-gray-400 hover:text-red-500 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item, item.quantity - 1)}
            className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item, item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="text-right">
          <div className="font-semibold">₹{inclusivePrice.toLocaleString()}</div>
          {gstEnabled && item.serialNumber && gstAmount > 0 && (
            <div className="text-xs text-gray-500">Inc. GST</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartItem
